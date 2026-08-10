// sitemap.xml — la liste des pages qu'on demande VRAIMENT à Google d'indexer.
//
// Ce que faisait l'ancien générateur : il listait toutes les routes du projet.
// Il y annonçait donc les anciens produits (marketplace, privilège, alliance,
// cohorts-demo…) qui redirigent aujourd'hui vers l'accueil, ainsi que des pages
// portant `noindex`. Un sitemap majoritairement composé de redirections et de
// pages interdites est pire que pas de sitemap : c'est le signal qu'on ne sait
// pas ce qu'on publie, et Google cesse de s'y fier.
//
// Ici on n'annonce QUE ce qui est publiquement utile et réellement indexable :
// l'accueil, les pages légales, et le fil de chaque ville couverte.
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { villeSlug } from "@/lib/direct/ville";

// Le sitemap est reconstruit au plus une fois par heure : les villes couvertes
// ne changent pas à la minute, et on ne veut pas une requête base à chaque
// passage d'un robot.
export const revalidate = 3600;

const str = (v: unknown) => (v == null ? "" : String(v));

/** Les villes qui ont quelque chose à montrer. Deux sources, parce qu'une ville
 *  peut avoir des commerces publiés sans publication du jour, et l'inverse. */
async function villesCouvertes(): Promise<string[]> {
  const slugs = new Set<string>();
  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return [];
  }

  try {
    const { data } = await supabase
      .from("human_vitrine_sites")
      .select("city")
      .eq("channel", "letter")
      .eq("published", true)
      .not("city", "is", null)
      .limit(2000);
    for (const r of (Array.isArray(data) ? data : []) as Array<Record<string, unknown>>) {
      const s = villeSlug(str(r.city).replace(/,.*$/, "").replace(/\b\d{5}\b/g, ""));
      if (s) slugs.add(s);
    }
  } catch {
    /* base indisponible → on publiera au moins les pages fixes */
  }

  try {
    const { data } = await supabase
      .from("human_publications")
      .select("ville_slug")
      .is("retire_le", null)
      .limit(2000);
    for (const r of (Array.isArray(data) ? data : []) as Array<Record<string, unknown>>) {
      const s = villeSlug(str(r.ville_slug));
      if (s) slugs.add(s);
    }
  } catch {
    /* table non migrée → idem */
  }

  return [...slugs].sort();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // `/legal` lui-même porte `noindex` (choix délibéré) : on ne l'annonce donc
  // pas. Annoncer une page qu'on interdit ensuite est exactement la
  // contradiction qui fait perdre confiance à un moteur.
  const fixes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/legal/mentions`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/legal/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/legal/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const villes = await villesCouvertes();
  const filsDeVille: MetadataRoute.Sitemap = villes.map((v) => ({
    url: `${SITE_URL}/ville/${v}`,
    // Le fil d'une ville change tous les jours — c'est même tout son propos.
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...fixes, ...filsDeVille];
}
