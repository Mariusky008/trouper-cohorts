/**
 * 🏷️ LE NOM D'UNE PAGE DE COMMERCE, D'APRÈS SON ADRESSE.
 *
 * Deux lecteurs en ont besoin : le titre de la page (`generateMetadata`) et
 * son manifeste — le nom que le téléphone écrit sous l'icône quand on la pose
 * sur l'écran d'accueil. Un seul endroit, pour qu'ils ne disent jamais deux
 * noms différents.
 *
 * Dans l'ordre où la page elle-même les cherche : une copie de présentation,
 * une démonstration, puis la vraie fiche en base. Rien ne lève : sans base,
 * on rend `null`, et chacun garde son repli.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { carteDeDemo, estAdresseDeDemo } from "@/lib/site-internet/fiches-demo";
import { copieDePresentation } from "@/lib/direct/copies-presentation";

export type NomDeLaPage = { nom: string; ville?: string; demo: boolean };

export async function nomDeLaPage(slug: string): Promise<NomDeLaPage | null> {
  const copie = copieDePresentation(slug);
  if (copie) return { nom: copie.carte.nom, ville: copie.carte.ville, demo: false };
  if (estAdresseDeDemo(slug)) {
    const c = carteDeDemo(slug);
    return c ? { nom: c.nom, ville: c.ville, demo: true } : null;
  }
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("human_vitrine_sites")
      .select("business_name, city")
      .eq("slug", slug)
      .eq("channel", "letter")
      .maybeSingle();
    const row = (data as Record<string, unknown> | null) ?? null;
    if (!row) return null;
    const nom = String(row.business_name ?? "").trim();
    return nom ? { nom, ville: String(row.city ?? "") || undefined, demo: false } : null;
  } catch {
    return null;
  }
}

/**
 * LE NOM SOUS L'ICÔNE. Un écran d'accueil coupe vers douze lettres :
 * « OXYGENE BY ALEXIS - Maison d'experts en coiffure » y devenait
 * « OXYGENE BY A… ». On garde ce qui vient avant le premier tiret ou la
 * première parenthèse — le nom, pas le slogan.
 */
export function nomCourt(nom: string): string {
  const coupe = nom.split(/\s[-–—|(]\s?|\s·\s/)[0].trim();
  return (coupe || nom).slice(0, 30);
}
