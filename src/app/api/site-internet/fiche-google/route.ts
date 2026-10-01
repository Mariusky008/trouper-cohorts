// 🔎 RELIRE LA FICHE GOOGLE D'UNE PAGE DÉJÀ CRÉÉE — depuis la page elle-même.
//
// « J'ai l'impression que la fiche Google n'a pas du tout été consultée. »
//
// POST { slug } → lance la relecture et répond TOUT DE SUITE (202) ; la
//   lecture tourne ensuite (`after`), comme à l'inscription. Attendre Apify
//   dans la requête, c'était risquer le 504 que l'inscription a déjà montré.
// GET ?slug= → où en est la lecture : en cours, lue, ou pourquoi pas.
//
// ELLE NE FAIT QU'AJOUTER (voir `lireEtRangerLaFiche`) et elle est PLAFONNÉE :
// une relecture toutes les dix minutes par page. Chaque relecture coûte des
// appels Apify, et l'adresse de la page est la seule clé — comme pour la photo
// ClikMe, c'est le plafond qui rend la porte sûre.
import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LECTURE_PERIMEE_MS, lireEtRangerLaFiche, raisonLisible } from "@/lib/site-internet/fiche-google";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const ATTENTE_MS = 10 * 60_000;
const lisible = (slug: string) => /^[a-z0-9-]{2,120}$/i.test(slug);

async function lireLeSite(slug: string) {
  const { data } = await createAdminClient()
    .from("human_vitrine_sites")
    .select("id, google_rating, diagnostic")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  return (data as Record<string, unknown> | null) ?? null;
}

/** L'état de la lecture, tel que la page le montre. */
function etatDeLaFiche(row: Record<string, unknown>) {
  const d = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;
  const lancee = Date.parse(s(d.fiche_en_cours));
  const enCours = Number.isFinite(lancee) && Date.now() - lancee < LECTURE_PERIMEE_MS;
  const erreurs = (Array.isArray(d.fiche_erreurs) ? d.fiche_erreurs : []).map((e) => s(e)).filter(Boolean);
  const corrections = (Array.isArray(d.fiche_corrections) ? d.fiche_corrections : []).map((e) => s(e)).filter(Boolean);
  return {
    enCours,
    lue: d.places_found === true,
    photos: Array.isArray(d.photos) ? d.photos.length : 0,
    avis: Array.isArray(d.reviews_top) ? d.reviews_top.length : 0,
    raison: !enCours && d.places_found !== true && erreurs.length ? raisonLisible(erreurs[erreurs.length - 1]) : undefined,
    detail:
      erreurs.length || corrections.length
        ? [...erreurs, ...corrections.map((c) => `corrigé — ${c}`)].join(" | ").slice(0, 600)
        : undefined,
  };
}

export async function GET(requete: Request) {
  const slug = s(new URL(requete.url).searchParams.get("slug"));
  if (!lisible(slug)) return NextResponse.json({ erreur: "adresse illisible" }, { status: 400 });
  const row = await lireLeSite(slug);
  if (!row) return NextResponse.json({ erreur: "site introuvable" }, { status: 404 });
  return NextResponse.json(etatDeLaFiche(row), { headers: { "cache-control": "no-store" } });
}

export async function POST(requete: Request) {
  const debut = Date.now();
  let p: Record<string, unknown> = {};
  try {
    p = (await requete.json()) as Record<string, unknown>;
  } catch {
    /* corps vide */
  }
  const slug = s(p.slug);
  if (!lisible(slug)) return NextResponse.json({ erreur: "adresse illisible" }, { status: 400 });
  const row = await lireLeSite(slug);
  if (!row) return NextResponse.json({ erreur: "site introuvable" }, { status: 404 });
  const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;

  const etat = etatDeLaFiche(row);
  if (etat.enCours) return NextResponse.json({ ...etat, ok: true }, { status: 202 });
  const derniere = Date.parse(s(diag.fiche_relue_at));
  if (Number.isFinite(derniere) && Date.now() - derniere < ATTENTE_MS) {
    const min = Math.ceil((ATTENTE_MS - (Date.now() - derniere)) / 60_000);
    return NextResponse.json({ ...etat, ok: false, raison: `Votre fiche vient d'être relue. Réessayez dans ${min} min.` });
  }

  // ON NOTE LA TENTATIVE AVANT D'APPELER : deux appuis rapprochés n'en paient qu'une.
  const maintenant = new Date().toISOString();
  await createAdminClient()
    .from("human_vitrine_sites")
    .update({ diagnostic: { ...diag, fiche_relue_at: maintenant, fiche_en_cours: maintenant } })
    .eq("id", s(row.id));

  after(async () => {
    try {
      await lireEtRangerLaFiche(slug, { finAvant: debut + 240_000 });
    } catch (e) {
      console.warn("[fiche-google] relecture", JSON.stringify({ slug, erreur: e instanceof Error ? e.message : String(e) }));
    }
  });
  return NextResponse.json({ ...etat, enCours: true, ok: true }, { status: 202 });
}
