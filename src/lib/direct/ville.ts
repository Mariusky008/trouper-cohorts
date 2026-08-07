// Résolution d'une ville et de sa configuration.
//
// Le nom stocké sur les fiches n'est jamais propre (« Dax, France », « 40100
// Dax ») : le slug d'URL est la seule clé fiable, et le nom d'affichage se
// déduit de ce qu'on trouve. Une ville sans commerce publié n'existe pas — on
// ne promet pas une page qu'on sait vide.
import { SEUIL_COMPTEUR_DEFAUT } from "./degradation";

const str = (v: unknown) => (v == null ? "" : String(v));
type Supabase = { from: (t: string) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any

export function villeSlug(v: string): string {
  return str(v)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const PARTICULES = new Set(["de", "du", "des", "d", "la", "le", "les", "lès", "sur", "sous", "en", "et", "aux", "au", "l"]);

/** « saint-paul-lès-dax » → « Saint-Paul-lès-Dax ». Les particules restent en
 *  bas de casse, sauf en tête. */
export function nomDeVille(raw: string): string {
  const s = str(raw).trim().toLowerCase();
  if (!s) return "";
  let premier = true;
  return s.replace(/\p{L}+/gu, (mot) => {
    const nu = mot.normalize("NFD").replace(/[̀-ͯ]/g, "");
    const out = !premier && PARTICULES.has(nu) ? mot : mot.charAt(0).toUpperCase() + mot.slice(1);
    premier = false;
    return out;
  });
}

export type VilleConfig = {
  slug: string;
  /** Nom d'affichage. Toujours renseigné : à défaut de fiche, le slug embelli. */
  nom: string;
  seuilCompteur: number;
  quartiers: string[];
  /** Faux = aucun commerce publié ici. L'écran le dit, il ne fait pas semblant. */
  active: boolean;
};

export async function configVille(supabase: Supabase, slug: string): Promise<VilleConfig> {
  const s = villeSlug(slug);
  const base: VilleConfig = {
    slug: s,
    nom: nomDeVille(s.replace(/-/g, " ")),
    seuilCompteur: SEUIL_COMPTEUR_DEFAUT,
    quartiers: [],
    active: false,
  };
  if (!s) return base;

  // Le nom exact tel que stocké sur les fiches : c'est lui qui sert à filtrer,
  // et il vaut mieux que l'embellissement du slug quand il existe.
  try {
    const { data } = await supabase
      .from("human_vitrine_sites")
      .select("city")
      .eq("channel", "letter")
      .eq("published", true)
      .limit(500);
    for (const r of (Array.isArray(data) ? data : []) as Array<Record<string, unknown>>) {
      const c = str(r.city).trim();
      if (!c) continue;
      const cs = villeSlug(c);
      if (cs === s || cs.startsWith(`${s}-`) || cs.endsWith(`-${s}`)) {
        base.nom = nomDeVille(c.replace(/,.*$/, "").replace(/\b\d{5}\b/g, "").trim()) || base.nom;
        base.active = true;
        break;
      }
    }
  } catch {
    /* base indisponible → la ville reste inactive, l'écran le dit */
  }

  try {
    const { data } = await supabase
      .from("human_villes_config")
      .select("ville, seuil_compteur, quartiers")
      .eq("ville_slug", s)
      .maybeSingle();
    const c = data as Record<string, unknown> | null;
    if (c) {
      if (str(c.ville)) base.nom = str(c.ville);
      if (typeof c.seuil_compteur === "number" && c.seuil_compteur > 0) base.seuilCompteur = c.seuil_compteur;
      if (Array.isArray(c.quartiers)) base.quartiers = c.quartiers.map(str).filter(Boolean);
    }
  } catch {
    /* table non migrée → valeurs par défaut, l'application fonctionne */
  }

  return base;
}
