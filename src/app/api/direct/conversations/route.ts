// LES CONVERSATIONS PARTAGÉES DE LA VRAIE VILLE — voir `lib/direct/conversations.ts`.
//
// GET  ?ville=<ville>&ids=a,b   → { moi, conversations } : celles que j'ai
//                                  ouvertes ou où j'ai fait un geste, plus
//                                  celles que je demande (le lien reçu).
// POST { action: "ouvrir", ville, base, qui }   → { id }
// POST { action: "geste", id, geste, qui }      → { ok }
//
// QUI : l'habitant tel que l'application le connaît déjà (`habitant.ts`) — un
// jeton dans un cookie, posé au premier geste, sans inscription. Lire ne crée
// personne ; ouvrir ou écrire, oui.
//
// L'INVITATION EST LE LIEN : qui connaît l'identifiant peut lire et écrire.
// C'est la règle des salons depuis le début. L'identifiant est tiré au hasard
// sur seize caractères : on ne le devine pas.
import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { assurerHabitant, habitantCourant } from "@/lib/direct/habitant";
import { villeSlug } from "@/lib/direct/ville";
import { rangerPhoto as rangerPhotoDHabitant } from "@/lib/direct/ranger-photo";
import type { BaseConversation, Geste, GesteLu } from "@/lib/direct/conversations";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const s = (v: unknown) => String(v ?? "").trim();
const ID = /^[a-z0-9]{16}$/;
/** Au plus tant de gestes par minute et par habitant : un téléphone qui boucle ne remplit pas la base. */
const PAR_MINUTE = 40;

/** L'empreinte d'un habitant dans une conversation — voir `GesteLu.auteur`. */
const empreinte = (habitant: string, conv: string) => createHash("sha1").update(`${habitant}|${conv}`).digest("hex").slice(0, 10);

/** Une photo de conversation : rangée chez nous — voir `ranger-photo.ts`. */
const rangerPhoto = (conv: string, valeur: unknown) => rangerPhotoDHabitant("conversations", conv, valeur);

/** Un texte borné. */
const texte = (v: unknown, n: number) => s(v).slice(0, n);

/** Le geste tel qu'on accepte de le garder — rien d'autre ne passe. */
async function nettoyer(conv: string, g: Record<string, unknown>): Promise<Geste | null> {
  switch (s(g.type)) {
    case "ecrire": {
      const t = texte(g.texte, 1200);
      const photo = await rangerPhoto(conv, g.photo);
      if (!t && !photo) return null;
      const c = g.carte && typeof g.carte === "object" ? (g.carte as Record<string, unknown>) : null;
      return {
        type: "ecrire",
        texte: t,
        ...(photo ? { photo } : {}),
        ...(c ? { carte: { titre: texte(c.titre, 120), detail: texte(c.detail, 400), ...(s(c.tampon) ? { tampon: texte(c.tampon, 60) } : {}), ...(c.pro ? { pro: true } : {}) } } : {}),
        ...(g.systeme ? { systeme: true } : {}),
      };
    }
    case "tete":
      return texte(g.texte, 300) ? { type: "tete", texte: texte(g.texte, 300) } : null;
    case "proposer": {
      const p = g.p && typeof g.p === "object" ? (g.p as Record<string, unknown>) : null;
      if (!p || !s(p.cle) || !s(p.quoi)) return null;
      const photo = await rangerPhoto(conv, p.photo);
      return {
        type: "proposer",
        p: {
          cle: texte(p.cle, 160),
          par: texte(p.par, 40),
          quoi: texte(p.quoi, 160),
          ou: texte(p.ou, 160),
          ...(s(p.prix) ? { prix: texte(p.prix, 40) } : {}),
          ...(s(p.distance) ? { distance: texte(p.distance, 40) } : {}),
          ...(photo ? { photo } : {}),
        },
      };
    }
    case "voix":
      return s(g.propo) ? { type: "voix", propo: texte(g.propo, 160) } : null;
    case "venue":
      return { type: "venue" };
    case "entrer":
      return { type: "entrer", vient: Boolean(g.vient) };
    case "reagir":
      return s(g.message) && s(g.emoji) ? { type: "reagir", message: texte(g.message, 40), emoji: texte(g.emoji, 8) } : null;
    case "voter":
      return s(g.option) ? { type: "voter", option: texte(g.option, 60) } : null;
    case "visibilite":
      return { type: "visibilite", prive: Boolean(g.prive) };
    default:
      return null;
  }
}

/** Le point de départ d'une conversation, nettoyé comme un geste. */
async function nettoyerBase(id: string, b: Record<string, unknown>, qui: string): Promise<BaseConversation | null> {
  const sujet = texte(b.sujet, 200);
  if (!sujet) return null;
  const photo = await rangerPhoto(id, b.photo);
  const props = Array.isArray(b.propositions) ? (b.propositions as Record<string, unknown>[]).slice(0, 6) : [];
  const vote = b.vote && typeof b.vote === "object" ? (b.vote as Record<string, unknown>) : null;
  const boutique = b.boutique && typeof b.boutique === "object" ? (b.boutique as Record<string, unknown>) : null;
  return {
    cle: id,
    sujet,
    ou: texte(b.ou, 160),
    parQui: qui,
    quand: texte(b.quand, 80),
    prive: b.prive !== false,
    ...(photo ? { photo } : {}),
    ...(s(b.annonce) ? { annonce: texte(b.annonce, 200) } : {}),
    ...(s(b.prix) ? { prix: texte(b.prix, 40) } : {}),
    ...(s(b.reste) ? { reste: texte(b.reste, 60) } : {}),
    ...(s(b.distance) ? { distance: texte(b.distance, 40) } : {}),
    ...(boutique && s(boutique.id) ? { boutique: { id: texte(boutique.id, 120), nom: texte(boutique.nom, 120), lien: texte(boutique.lien, 300) } } : {}),
    ...(vote && Array.isArray(vote.options)
      ? {
          vote: {
            question: texte(vote.question, 200),
            options: (vote.options as Record<string, unknown>[]).slice(0, 4).map((o) => ({
              cle: texte(o.cle, 60),
              label: texte(o.label, 80),
              voix: 0,
              ...(s(o.photo) && /^(https:\/\/|\/)/.test(s(o.photo)) ? { photo: texte(o.photo, 600) } : {}),
            })),
          },
        }
      : {}),
    propositions: props
      .filter((p) => s(p.cle) && s(p.quoi))
      .map((p) => ({
        cle: texte(p.cle, 160),
        par: qui,
        quoi: texte(p.quoi, 160),
        ou: texte(p.ou, 160),
        ...(s(p.prix) ? { prix: texte(p.prix, 40) } : {}),
        ...(s(p.distance) ? { distance: texte(p.distance, 40) } : {}),
        ...(s(p.photo) && /^(https:\/\/|\/)/.test(s(p.photo)) ? { photo: texte(p.photo, 600) } : photo ? { photo } : {}),
        voix: [qui],
      })),
  } as BaseConversation;
}

/** Le prénom qu'il donne, sinon celui qu'on connaît, sinon « Un ami ». */
const prenom = (qui: unknown, connu: string) => {
  const q = texte(qui, 30);
  return q && q !== "Vous" ? q : connu || "Un ami";
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ville = villeSlug(s(url.searchParams.get("ville")));
  const demandes = s(url.searchParams.get("ids"))
    .split(",")
    .map((x) => x.trim())
    .filter((x) => ID.test(x))
    .slice(0, 10);
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json({ ok: false, moi: null, conversations: [] });
  }
  const moi = await habitantCourant(supabase);
  try {
    const ids = new Set<string>(demandes);
    if (moi) {
      const [{ data: creees }, { data: faites }] = await Promise.all([
        supabase.from("human_conversations").select("id").eq("createur", moi.id).order("activite", { ascending: false }).limit(40),
        supabase.from("human_conversation_gestes").select("conversation").eq("habitant", moi.id).order("id", { ascending: false }).limit(400),
      ]);
      for (const r of (creees ?? []) as Record<string, unknown>[]) ids.add(s(r.id));
      for (const r of (faites ?? []) as Record<string, unknown>[]) ids.add(s(r.conversation));
    }
    const liste = [...ids].slice(0, 50);
    if (!liste.length) return NextResponse.json({ ok: true, moi: moi ? "1" : null, conversations: [] });
    let q = supabase.from("human_conversations").select("id, ville_slug, createur, base, activite").in("id", liste);
    if (ville) q = q.eq("ville_slug", ville);
    const { data: convs, error } = await q;
    if (error) throw new Error(error.message);
    const { data: gestes } = await supabase
      .from("human_conversation_gestes")
      .select("id, conversation, habitant, qui, geste, cree_le")
      .in("conversation", liste)
      .order("id", { ascending: true })
      .limit(5000);
    const parConv = new Map<string, GesteLu[]>();
    for (const g of (gestes ?? []) as Record<string, unknown>[]) {
      const c = s(g.conversation);
      const h = s(g.habitant);
      const l = parConv.get(c) ?? [];
      l.push({ id: Number(g.id), qui: s(g.qui), auteur: h ? empreinte(h, c) : "", moi: Boolean(moi && h === moi.id), quand: s(g.cree_le), geste: g.geste as Geste });
      parConv.set(c, l);
    }
    return NextResponse.json({
      ok: true,
      moi: moi ? "1" : null,
      conversations: ((convs ?? []) as Record<string, unknown>[]).map((c) => ({
        id: s(c.id),
        base: c.base,
        createurMoi: Boolean(moi && s(c.createur) === moi.id),
        activite: s(c.activite),
        gestes: parConv.get(s(c.id)) ?? [],
      })),
    });
  } catch {
    // MIGRATION PAS ENCORE APPLIQUÉE, OU BASE INDISPONIBLE : rien de partagé,
    // l'application garde ce qui est dans le téléphone.
    return NextResponse.json({ ok: false, moi: moi ? "1" : null, conversations: [] });
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
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Indisponible." }, { status: 503 });
  }

  if (action === "ouvrir") {
    const ville = villeSlug(s(p?.ville));
    if (!ville) return NextResponse.json({ error: "Ville inconnue." }, { status: 400 });
    const h = await assurerHabitant(supabase, ville);
    if (!h) return NextResponse.json({ error: "Indisponible." }, { status: 503 });
    const id = randomBytes(12).toString("base64").replace(/[^a-z0-9]/gi, "").toLowerCase().padEnd(16, "0").slice(0, 16);
    const qui = prenom(p?.qui, h.prenom);
    const base = await nettoyerBase(id, (p?.base && typeof p.base === "object" ? p.base : {}) as Record<string, unknown>, qui);
    if (!base) return NextResponse.json({ error: "Il manque le sujet." }, { status: 400 });
    const { error } = await supabase.from("human_conversations").insert({ id, ville_slug: ville, createur: h.id, base });
    if (error) return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  if (action === "geste") {
    const id = s(p?.id);
    if (!ID.test(id)) return NextResponse.json({ error: "Conversation inconnue." }, { status: 400 });
    const { data: conv } = await supabase.from("human_conversations").select("id, ville_slug").eq("id", id).maybeSingle();
    if (!conv) return NextResponse.json({ error: "Conversation inconnue." }, { status: 404 });
    const h = await assurerHabitant(supabase, s((conv as Record<string, unknown>).ville_slug));
    if (!h) return NextResponse.json({ error: "Indisponible." }, { status: 503 });
    // UN TÉLÉPHONE QUI BOUCLE NE REMPLIT PAS LA BASE.
    const { count } = await supabase
      .from("human_conversation_gestes")
      .select("id", { count: "exact", head: true })
      .eq("habitant", h.id)
      .gte("cree_le", new Date(Date.now() - 60_000).toISOString());
    if ((count ?? 0) >= PAR_MINUTE) return NextResponse.json({ error: "Doucement : réessaie dans une minute." }, { status: 429 });
    const geste = await nettoyer(id, (p?.geste && typeof p.geste === "object" ? p.geste : {}) as Record<string, unknown>);
    if (!geste) return NextResponse.json({ error: "Geste illisible." }, { status: 400 });
    const { error } = await supabase.from("human_conversation_gestes").insert({ conversation: id, habitant: h.id, qui: prenom(p?.qui, h.prenom), geste });
    if (error) return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
    await supabase.from("human_conversations").update({ activite: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}
