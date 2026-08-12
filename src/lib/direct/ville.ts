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
  //
  // LE FILTRE EST FAIT EN SQL, pas en mémoire. Lire 500 fiches puis chercher la
  // ville dedans marche tant qu'on a moins de 500 fiches ; au-delà, une ville
  // parfaitement active se déclare « pas encore couverte » simplement parce
  // qu'elle n'est pas dans les 500 premières lignes rendues.
  //
  // `ilike %ville%` est volontairement large : le champ contient « Bordeaux »,
  // « Bordeaux, France » ou « 33000 Bordeaux ». Le tri fin se fait ensuite sur
  // le slug, qui est la seule comparaison fiable.
  const motif = s.replace(/-/g, " ");
  try {
    const { data } = await supabase
      .from("human_vitrine_sites")
      .select("city")
      .eq("channel", "letter")
      .eq("est_client", true)
      .ilike("city", `%${motif}%`)
      .limit(50);
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

  // UNE VILLE QUI A DES PUBLICATIONS EST COUVERTE, quoi qu'en dise la requête
  // ci-dessus. Le fil et ce drapeau se contredisaient : on pouvait lire des
  // annonces de Bordeaux sous un titre « Bordeaux n'est pas encore couverte ».
  // La présence d'une publication est la preuve la plus directe qu'il s'y passe
  // quelque chose.
  if (!base.active) {
    try {
      const { data } = await supabase
        .from("human_publications")
        .select("ville")
        .eq("ville_slug", s)
        .is("retire_le", null)
        .limit(1);
      const p0 = (Array.isArray(data) ? data : [])[0] as Record<string, unknown> | undefined;
      if (p0) {
        base.active = true;
        const v = str(p0.ville).replace(/,.*$/, "").replace(/\b\d{5}\b/g, "").trim();
        if (v) base.nom = nomDeVille(v);
      }
    } catch {
      /* table non migrée → on garde ce qu'on a */
    }
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
