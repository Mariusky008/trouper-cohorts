// LE FIL PARTAGÉ DE LA VILLE — voir la migration `20261006120000_ville_partagee.sql`.
//
// GET  ?ville=<ville>                          → { moi, amis, publications }
// POST { action: "publier", ville, id, visibilite, donnees, qui }
// POST { action: "geste", id, geste, qui }     — cœur, réponse, « ça m'intéresse »
// POST { action: "retirer", id }               — l'auteur seul
// POST { action: "signaler", id, motif }
//
// QUI VOIT QUOI, ET C'EST ICI QUE ÇA SE DÉCIDE : « Public dans ma ville » pour
// tous les habitants de la ville, « Mes amis » pour l'auteur et ceux qui
// partagent une conversation avec lui (`amis.ts`). L'écran ne reçoit jamais ce
// qu'il n'a pas le droit de montrer.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assurerHabitant, habitantCourant } from "@/lib/direct/habitant";
import { villeSlug } from "@/lib/direct/ville";
import { amisDe } from "@/lib/direct/amis";
import { rangerPhoto } from "@/lib/direct/ranger-photo";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const s = (v: unknown) => String(v ?? "").trim();
const texte = (v: unknown, n: number) => s(v).slice(0, n);
const ID = /^v[a-z0-9]{6,40}$/i;
const NATURES = ["question", "evenement", "bon-plan", "coup-de-coeur", "cherche"];
/** La vie locale ne vit pas plus de douze heures — le plafond de `resteMinutes`. */
const VIE_MAX_MS = 12 * 3600_000;
/** Au-delà, la publication est masquée en attendant l'administrateur. */
const SEUIL_SIGNALEMENTS = 3;
const PAR_MINUTE = 30;

type Supabase = ReturnType<typeof createAdminClient>;

/** Le prénom qu'il donne, sinon celui qu'on connaît, sinon « Un habitant ». */
const prenom = (qui: unknown, connu: string) => {
  const q = texte(qui, 30);
  return q && q !== "Vous" ? q : connu || "Un habitant";
};

/** Peut-il voir cette publication ? */
function peutVoir(p: Record<string, unknown>, moi: string | null, amis: Map<string, string>): boolean {
  const auteur = s(p.habitant);
  if (moi && auteur === moi) return true;
  if (p.retire_le || p.masque) return false;
  return p.visibilite === "public" || amis.has(auteur);
}

async function limite(supabase: Supabase, habitant: string): Promise<boolean> {
  const depuis = new Date(Date.now() - 60_000).toISOString();
  const [{ count: a }, { count: b }] = await Promise.all([
    supabase.from("human_ville_gestes").select("id", { count: "exact", head: true }).eq("habitant", habitant).gte("cree_le", depuis),
    supabase.from("human_ville_publications").select("id", { count: "exact", head: true }).eq("habitant", habitant).gte("cree_le", depuis),
  ]);
  return (a ?? 0) + (b ?? 0) >= PAR_MINUTE;
}

export async function GET(request: Request) {
  const ville = villeSlug(s(new URL(request.url).searchParams.get("ville")));
  let supabase: Supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json({ ok: false, publications: [], amis: [] });
  }
  if (!ville) return NextResponse.json({ ok: false, publications: [], amis: [] });
  const moi = await habitantCourant(supabase);
  try {
    const amis = moi ? await amisDe(supabase, moi.id) : new Map<string, string>();
    const { data, error } = await supabase
      .from("human_ville_publications")
      .select("id, habitant, qui, visibilite, donnees, persistant, cree_le, retire_le, masque")
      .eq("ville_slug", ville)
      .is("retire_le", null)
      .or(`persistant.eq.true,cree_le.gte.${new Date(Date.now() - VIE_MAX_MS).toISOString()}`)
      .order("cree_le", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const visibles = ((data ?? []) as Record<string, unknown>[]).filter((p) => peutVoir(p, moi?.id ?? null, amis));
    const ids = visibles.map((p) => s(p.id));
    const { data: gestes } = ids.length
      ? await supabase.from("human_ville_gestes").select("id, publication, habitant, qui, geste, cree_le").in("publication", ids).order("id", { ascending: true }).limit(5000)
      : { data: [] };
    // LES GESTES REJOUÉS : un cœur et un « ça m'intéresse » par personne, qui se basculent.
    const coeurs = new Map<string, Set<string>>();
    const interesses = new Map<string, Map<string, { qui: string; moi: boolean }>>();
    const reponses = new Map<string, { id: string; qui: string; moi: boolean; texte: string; cree_le: string }[]>();
    for (const g of (gestes ?? []) as Record<string, unknown>[]) {
      const pub = s(g.publication);
      const h = s(g.habitant);
      const x = (g.geste ?? {}) as Record<string, unknown>;
      if (x.type === "coeur") {
        const set = coeurs.get(pub) ?? new Set<string>();
        if (set.has(h)) set.delete(h);
        else set.add(h);
        coeurs.set(pub, set);
      } else if (x.type === "interesse") {
        const m = interesses.get(pub) ?? new Map<string, { qui: string; moi: boolean }>();
        if (m.has(h)) m.delete(h);
        else m.set(h, { qui: s(g.qui), moi: Boolean(moi && h === moi.id) });
        interesses.set(pub, m);
      } else if (x.type === "reponse") {
        const l = reponses.get(pub) ?? [];
        l.push({ id: `r${s(g.id)}`, qui: s(g.qui), moi: Boolean(moi && h === moi.id), texte: s(x.texte), cree_le: s(g.cree_le) });
        reponses.set(pub, l);
      }
    }
    return NextResponse.json({
      ok: true,
      moi: moi ? "1" : null,
      amis: [...new Set(amis.values())],
      publications: visibles.map((p) => {
        const id = s(p.id);
        const auteur = s(p.habitant);
        return {
          id,
          qui: s(p.qui),
          moi: Boolean(moi && auteur === moi.id),
          ami: amis.has(auteur),
          visibilite: s(p.visibilite),
          persistant: Boolean(p.persistant),
          cree_le: s(p.cree_le),
          masque: Boolean(p.masque),
          donnees: p.donnees,
          coeurs: coeurs.get(id)?.size ?? 0,
          monCoeur: Boolean(moi && coeurs.get(id)?.has(moi.id)),
          reponses: reponses.get(id) ?? [],
          interesses: [...(interesses.get(id)?.values() ?? [])],
        };
      }),
    });
  } catch {
    // MIGRATION PAS ENCORE APPLIQUÉE : rien de partagé, le téléphone garde les siennes.
    return NextResponse.json({ ok: false, publications: [], amis: [] });
  }
}

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const action = s(p?.action);
  let supabase: Supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Indisponible." }, { status: 503 });
  }

  if (action === "publier") {
    const ville = villeSlug(s(p?.ville));
    const id = s(p?.id);
    if (!ville || !ID.test(id)) return NextResponse.json({ error: "Publication illisible." }, { status: 400 });
    const h = await assurerHabitant(supabase, ville);
    if (!h) return NextResponse.json({ error: "Indisponible." }, { status: 503 });
    if (await limite(supabase, h.id)) return NextResponse.json({ error: "Doucement : réessaie dans une minute." }, { status: 429 });
    const d = (p?.donnees && typeof p.donnees === "object" ? p.donnees : {}) as Record<string, unknown>;
    const t = texte(d.texte, 1200);
    const photo = await rangerPhoto("ville", id, d.photo);
    if (!t && !photo) return NextResponse.json({ error: "Il manque le texte." }, { status: 400 });
    const genre = d.genre === "essai" || d.genre === "decouverte" ? d.genre : undefined;
    const c = d.commerce && typeof d.commerce === "object" ? (d.commerce as Record<string, unknown>) : null;
    const r = d.reference && typeof d.reference === "object" ? (d.reference as Record<string, unknown>) : null;
    const donnees = {
      texte: t,
      nature: NATURES.includes(s(d.nature)) ? s(d.nature) : "bon-plan",
      ...(genre ? { genre } : {}),
      ...(photo ? { photo } : {}),
      ou: texte(d.ou, 120),
      dure: Math.max(30, Math.min(Number(d.dure) || 180, 720)),
      ...(c && s(c.id) ? { commerce: { id: texte(c.id, 120), nom: texte(c.nom, 120) } } : {}),
      ...(r && s(r.carte) && s(r.piece) ? { reference: { carte: texte(r.carte, 120), piece: texte(r.piece, 120), nom: texte(r.nom, 120) } } : {}),
      ...(d.vecu ? { vecu: true } : {}),
      ...(ID.test(s(d.suite)) ? { suite: s(d.suite) } : {}),
      ...(d.cherche ? { cherche: true } : {}),
    };
    const { error } = await supabase.from("human_ville_publications").insert({
      id,
      ville_slug: ville,
      habitant: h.id,
      qui: prenom(p?.qui, h.prenom),
      visibilite: p?.visibilite === "public" ? "public" : "amis",
      donnees,
      persistant: Boolean(genre),
    });
    if (error) return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const id = s(p?.id);
  if (!ID.test(id)) return NextResponse.json({ error: "Publication inconnue." }, { status: 400 });
  const { data: pub } = await supabase
    .from("human_ville_publications")
    .select("id, ville_slug, habitant, visibilite, retire_le, masque")
    .eq("id", id)
    .maybeSingle();
  if (!pub) return NextResponse.json({ error: "Publication inconnue." }, { status: 404 });
  const ligne = pub as Record<string, unknown>;
  const h = await assurerHabitant(supabase, s(ligne.ville_slug));
  if (!h) return NextResponse.json({ error: "Indisponible." }, { status: 503 });

  if (action === "retirer") {
    if (s(ligne.habitant) !== h.id) return NextResponse.json({ error: "Seul son auteur peut la retirer." }, { status: 403 });
    await supabase.from("human_ville_publications").update({ retire_le: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  // POUR RÉAGIR OU SIGNALER, IL FAUT POUVOIR LA VOIR.
  const amis = await amisDe(supabase, h.id);
  if (!peutVoir(ligne, h.id, amis)) return NextResponse.json({ error: "Publication inconnue." }, { status: 404 });

  if (action === "geste") {
    if (await limite(supabase, h.id)) return NextResponse.json({ error: "Doucement : réessaie dans une minute." }, { status: 429 });
    const g = (p?.geste && typeof p.geste === "object" ? p.geste : {}) as Record<string, unknown>;
    const geste =
      g.type === "coeur" ? { type: "coeur" } : g.type === "interesse" ? { type: "interesse" } : g.type === "reponse" && s(g.texte) ? { type: "reponse", texte: texte(g.texte, 600) } : null;
    if (!geste) return NextResponse.json({ error: "Geste illisible." }, { status: 400 });
    const { error } = await supabase.from("human_ville_gestes").insert({ publication: id, habitant: h.id, qui: prenom(p?.qui, h.prenom), geste });
    if (error) return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "signaler") {
    if (s(ligne.habitant) === h.id) return NextResponse.json({ ok: true });
    await supabase.from("human_ville_signalements").upsert({ publication: id, habitant: h.id, motif: texte(p?.motif, 200) || null }, { onConflict: "publication,habitant", ignoreDuplicates: true });
    const { count } = await supabase.from("human_ville_signalements").select("habitant", { count: "exact", head: true }).eq("publication", id);
    const n = count ?? 0;
    const { data: v } = await supabase.from("human_ville_publications").select("verdict").eq("id", id).maybeSingle();
    // MASQUÉE AU TROISIÈME SIGNALEMENT — sauf si l'administrateur a déjà décidé de la garder.
    const masque = n >= SEUIL_SIGNALEMENTS && s((v as Record<string, unknown> | null)?.verdict) !== "garde";
    await supabase.from("human_ville_publications").update({ signalements: n, ...(masque ? { masque: true } : {}) }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}
