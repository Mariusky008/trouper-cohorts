// 🔎 LA LECTURE DE LA FICHE GOOGLE D'UNE PAGE — la relancer, la suivre.
//
// « J'ai l'impression que la fiche Google n'a pas du tout été consultée. »
//
// POST { slug } → relance la lecture chez Apify et répond tout de suite (202).
// GET ?slug=   → fait AVANCER la lecture d'un temps si le précédent est fini
//                (voir `avancerLaFiche`), puis dit où elle en est. C'est la page
//                du commerçant qui l'appelle toutes les cinq secondes : c'est
//                donc aussi elle qui mène la lecture à son terme.
//
// ELLE NE FAIT QU'AJOUTER, et elle est PLAFONNÉE : une relance toutes les dix
// minutes par page. Chaque lecture coûte chez Apify, et l'adresse de la page
// est la seule clé — c'est le plafond qui rend la porte sûre.
import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  avancerLaFiche,
  conduireLaFiche,
  etatDeLaFiche,
  lancerLaFiche,
  raisonLisible,
  type EtatFiche,
} from "@/lib/site-internet/fiche-google";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const ATTENTE_MS = 10 * 60_000;
const lisible = (slug: string) => /^[a-z0-9-]{2,120}$/i.test(slug);

/** Ce que la page reçoit : l'état, la raison en français, et le détail exact. */
const reponse = (e: EtatFiche) => ({
  enCours: e.enCours,
  lue: e.lue,
  photos: e.photos,
  avis: e.avis,
  raison: !e.enCours && !e.lue && e.erreurs.length ? raisonLisible(e.erreurs[e.erreurs.length - 1]) : undefined,
  detail:
    e.erreurs.length || e.corrections.length
      ? [...e.erreurs, ...e.corrections.map((c) => `corrigé — ${c}`)].join(" | ").slice(0, 600)
      : undefined,
});

export async function GET(requete: Request) {
  const slug = s(new URL(requete.url).searchParams.get("slug"));
  if (!lisible(slug)) return NextResponse.json({ erreur: "adresse illisible" }, { status: 400 });
  const e = await avancerLaFiche(slug);
  if (!e) return NextResponse.json({ erreur: "site introuvable" }, { status: 404 });
  return NextResponse.json(reponse(e), { headers: { "cache-control": "no-store" } });
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
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("id, diagnostic")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const row = (data as Record<string, unknown> | null) ?? null;
  if (!row) return NextResponse.json({ erreur: "site introuvable" }, { status: 404 });
  const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;

  const avant = etatDeLaFiche(diag);
  if (avant.enCours) return NextResponse.json({ ...reponse(avant), ok: true }, { status: 202 });
  const derniere = Date.parse(s(diag.fiche_relue_at));
  if (Number.isFinite(derniere) && Date.now() - derniere < ATTENTE_MS) {
    const min = Math.ceil((ATTENTE_MS - (Date.now() - derniere)) / 60_000);
    return NextResponse.json({ ...reponse(avant), ok: false, raison: `Votre fiche vient d'être relue. Réessayez dans ${min} min.` });
  }
  await supabase
    .from("human_vitrine_sites")
    .update({ diagnostic: { ...diag, fiche_relue_at: new Date().toISOString() } })
    .eq("id", s(row.id));

  const lancee = await lancerLaFiche(slug);
  if (lancee) {
    after(async () => {
      try {
        await conduireLaFiche(slug, debut + 280_000);
      } catch (e) {
        console.warn("[fiche-google] suivi", JSON.stringify({ slug, erreur: e instanceof Error ? e.message : String(e) }));
      }
    });
  }
  const e = (await avancerLaFiche(slug)) ?? avant;
  return NextResponse.json({ ...reponse(e), ok: lancee }, { status: lancee ? 202 : 200 });
}
