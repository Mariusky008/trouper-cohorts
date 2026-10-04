// LA MAISON D'UN HABITANT, VISITABLE — voir la migration `20261007120000_maisons.sql`.
//
// POST { action: "poser", ville, prenom, presentation, adoptes, essais } → { jeton }
//   Le propriétaire publie ce qu'il partage. Une photo d'essai déjà rangée
//   n'est pas renvoyée : `photo` absent garde la précédente.
// GET ?jeton=<jeton>            → la maison, essais partagés compris (le lien
//                                 est l'invitation) ;
// GET ?publication=<id>         → la maison de l'auteur de cette publication
//                                 de La ville : ses essais partagés seulement
//                                 pour ses amis.
// Dans les deux cas : ses publications de La ville que le visiteur a le droit
// de voir.
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { assurerHabitant, habitantCourant } from "@/lib/direct/habitant";
import { villeSlug } from "@/lib/direct/ville";
import { amisDe } from "@/lib/direct/amis";
import { rangerPhoto } from "@/lib/direct/ranger-photo";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const s = (v: unknown) => String(v ?? "").trim();
const texte = (v: unknown, n: number) => s(v).slice(0, n);
type Supabase = ReturnType<typeof createAdminClient>;
type Essai = { cle: string; titre: string; lieu: string; photo?: string; carte?: string };

const VIE_MAX_MS = 12 * 3600_000;

/** Ses publications de La ville que ce visiteur a le droit de voir. */
async function publicationsVisibles(supabase: Supabase, auteur: string, visiteur: string | null, ami: boolean) {
  try {
    const { data } = await supabase
      .from("human_ville_publications")
      .select("id, qui, visibilite, donnees, persistant, cree_le, masque")
      .eq("habitant", auteur)
      .is("retire_le", null)
      .or(`persistant.eq.true,cree_le.gte.${new Date(Date.now() - VIE_MAX_MS).toISOString()}`)
      .order("cree_le", { ascending: false })
      .limit(30);
    const moi = visiteur === auteur;
    return ((data ?? []) as Record<string, unknown>[])
      .filter((p) => moi || (!p.masque && (p.visibilite === "public" || ami)))
      .map((p) => ({ id: s(p.id), visibilite: s(p.visibilite), cree_le: s(p.cree_le), donnees: p.donnees }));
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const jeton = s(url.searchParams.get("jeton"));
  const publication = s(url.searchParams.get("publication"));
  let supabase: Supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json({ ok: false });
  }
  const visiteur = await habitantCourant(supabase);
  try {
    let maison: Record<string, unknown> | null = null;
    let parLien = false;
    if (/^[a-z0-9]{12,24}$/.test(jeton)) {
      const { data } = await supabase.from("human_maisons").select("*").eq("jeton", jeton).maybeSingle();
      maison = data as Record<string, unknown> | null;
      parLien = true;
    } else if (/^v[a-z0-9]{6,40}$/i.test(publication)) {
      const { data: pub } = await supabase.from("human_ville_publications").select("habitant, visibilite, masque").eq("id", publication).maybeSingle();
      const auteur = s((pub as Record<string, unknown> | null)?.habitant);
      if (auteur) {
        const { data } = await supabase.from("human_maisons").select("*").eq("habitant", auteur).maybeSingle();
        // L'AUTEUR N'A PAS ENCORE DE MAISON PUBLIÉE : on montre au moins ses publications.
        maison = (data as Record<string, unknown> | null) ?? { habitant: auteur, prenom: "", presentation: "", adoptes: [], essais: [] };
      }
    }
    if (!maison) return NextResponse.json({ ok: false, error: "Maison introuvable." }, { status: 404 });
    const auteur = s(maison.habitant);
    const moi = Boolean(visiteur && visiteur.id === auteur);
    const ami = Boolean(visiteur && (await amisDe(supabase, visiteur.id)).has(auteur));
    const essais = parLien || ami || moi ? ((Array.isArray(maison.essais) ? maison.essais : []) as Essai[]) : [];
    return NextResponse.json({
      ok: true,
      moi,
      ami,
      prenom: s(maison.prenom),
      presentation: s(maison.presentation),
      adoptes: Array.isArray(maison.adoptes) ? (maison.adoptes as unknown[]).map(s).filter(Boolean) : [],
      essais,
      publications: await publicationsVisibles(supabase, auteur, visiteur?.id ?? null, ami || parLien),
    });
  } catch {
    return NextResponse.json({ ok: false });
  }
}

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  if (s(p?.action) !== "poser") return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  const ville = villeSlug(s(p?.ville));
  if (!ville) return NextResponse.json({ error: "Ville inconnue." }, { status: 400 });
  let supabase: Supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Indisponible." }, { status: 503 });
  }
  const h = await assurerHabitant(supabase, ville);
  if (!h) return NextResponse.json({ error: "Indisponible." }, { status: 503 });
  const { data: avant } = await supabase.from("human_maisons").select("jeton, essais").eq("habitant", h.id).maybeSingle();
  const ancienne = (avant as Record<string, unknown> | null) ?? null;
  const anciensEssais = new Map(((Array.isArray(ancienne?.essais) ? ancienne?.essais : []) as Essai[]).map((e) => [e.cle, e]));
  const essais: Essai[] = [];
  for (const e of (Array.isArray(p?.essais) ? p.essais : []).slice(0, 24) as Record<string, unknown>[]) {
    const cle = texte(e.cle, 200);
    if (!cle) continue;
    // UNE PHOTO DÉJÀ RANGÉE N'EST PAS RENVOYÉE : on garde la précédente.
    const photo = (await rangerPhoto("maisons", h.id.slice(0, 8), e.photo)) ?? anciensEssais.get(cle)?.photo;
    essais.push({ cle, titre: texte(e.titre, 120), lieu: texte(e.lieu, 120), ...(photo ? { photo } : {}), ...(s(e.carte) ? { carte: texte(e.carte, 120) } : {}) });
  }
  const jeton = s(ancienne?.jeton) || randomBytes(12).toString("base64").replace(/[^a-z0-9]/gi, "").toLowerCase().padEnd(16, "0").slice(0, 16);
  const { error } = await supabase.from("human_maisons").upsert(
    {
      habitant: h.id,
      ville_slug: ville,
      jeton,
      prenom: texte(p?.prenom, 30) === "Vous" ? "" : texte(p?.prenom, 30),
      presentation: texte(p?.presentation, 120),
      adoptes: (Array.isArray(p?.adoptes) ? p.adoptes : []).map((x) => texte(x, 120)).filter(Boolean).slice(0, 80),
      essais,
      maj_le: new Date().toISOString(),
    },
    { onConflict: "habitant" },
  );
  if (error) return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
  return NextResponse.json({ ok: true, jeton, photos: Object.fromEntries(essais.filter((e) => e.photo).map((e) => [e.cle, e.photo])) });
}
