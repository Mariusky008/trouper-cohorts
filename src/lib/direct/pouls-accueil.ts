// CE QUI SE PASSE VRAIMENT DANS UNE VILLE, POUR LA PAGE D'ACCUEIL.
//
// LA RÈGLE QUI COMMANDE TOUT CE FICHIER : les points affichés sur l'accueil
// sont de VRAIES publications, ou il n'y en a pas.
//
// La maquette dont vient cette idée montrait « 38 menus », « 17 créneaux »,
// « 12 nouveautés ». À Dax, le premier jour, ces nombres valent zéro. Un
// commerçant qui s'inscrit parce qu'il a vu une ville qui bouillonne, et qui
// découvre le calme en arrivant, est perdu en trente secondes — et il est perdu
// au moment où sa confiance était maximale.
//
// Le produit applique déjà la règle inverse chez l'habitant : `degradation.ts`
// REFUSE d'afficher un compteur en dessous de douze, parce qu'« un compteur qui
// affiche un petit nombre fait plus de mal que pas de compteur du tout ». On ne
// va pas refuser un petit chiffre VRAI aux habitants et servir un gros chiffre
// FAUX aux commerçants.
//
// D'où le choix : pas d'agrégats, des ÉVÉNEMENTS. « 11 h 45 · Chez Bergeron ·
// carte du jour » est vérifiable — on peut cliquer et le voir. Trois lignes
// vraies valent mieux que trente-huit inventées, et elles grandissent toutes
// seules sans que personne ne retouche la page.
import { villeSlug } from "./ville";
import { FAMILLE_LABEL, estFamille, type Famille } from "./publications";

const str = (v: unknown) => (v == null ? "" : String(v));

type Supabase = {
  from: (t: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

/** Un point lumineux : une publication réelle, vivante à cet instant. */
export type PointVille = {
  /** L'heure de publication, à PARIS. « 11 h 45 ». */
  heure: string;
  /** Le nom du commerce. Vide si la ligne n'en porte pas. */
  qui: string;
  /** « Carte du jour », « Place libre »… le libellé de la famille. */
  quoi: string;
  emoji: string;
};

export type PoulsAccueil = {
  /** Le slug résolu, vide si la saisie ne donne rien d'exploitable. */
  slug: string;
  /** Le nom tel qu'il a été saisi, remis en forme. */
  nom: string;
  /** Vrai quand la ville a AU MOINS UNE chose vivante en ce moment. */
  vivante: boolean;
  /** Le nombre réel de publications vivantes. Jamais arrondi, jamais gonflé. */
  total: number;
  /** Les points à allumer, du plus récent au plus ancien. */
  points: PointVille[];
};

export const POULS_VIDE: PoulsAccueil = { slug: "", nom: "", vivante: false, total: 0, points: [] };

/** Le pictogramme d'une famille. Le même que sur le fil : un habitant qui
 *  reconnaît une forme sur l'accueil la retrouve dans l'application. */
const EMOJI: Record<Famille, string> = {
  place: "🗓️",
  offre: "🏷️",
  menu: "🍽️",
  evenement: "🎪",
  ville: "📣",
};

/**
 * L'heure de publication, à Paris.
 *
 * `getHours()` lirait l'horloge du serveur — qui est en UTC en production. Le
 * défaut a déjà été payé une fois sur les échéances du fil, où toutes les
 * annonces s'affichaient deux heures trop tôt.
 */
function heureParis(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  try {
    const s = new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(new Date(t));
    const [hh, mn] = s.split(":");
    return `${hh.replace(/^0/, "")} h ${mn}`;
  } catch {
    return "";
  }
}

/**
 * Ce qui est vivant dans une ville, MAINTENANT.
 *
 * `villeSaisie` est ce que le commerçant tape dans le formulaire : « dax »,
 * « Dax », « DAX, France ». Le slug est la seule clé fiable.
 *
 * Table absente, colonne non migrée, panne : on rend `POULS_VIDE`. La page
 * d'accueil doit se charger même quand Le Direct est indisponible — c'est une
 * décoration honnête, jamais une dépendance.
 */
export async function poulsAccueil(
  supabase: unknown,
  villeSaisie: string,
  max = 6,
): Promise<PoulsAccueil> {
  const slug = villeSlug(villeSaisie);
  // Deux lettres : en dessous, on interrogerait la base à chaque frappe pour
  // « d » puis « da », et on allumerait une ville au hasard entre-temps.
  if (slug.length < 2) return POULS_VIDE;

  const maintenant = new Date().toISOString();
  try {
    const { data, error } = await (supabase as Supabase)
      .from("human_publications")
      .select("id, famille, auteur_nom, publie_le, expire_le")
      .eq("ville_slug", slug)
      .is("retire_le", null)
      // VIVANT VEUT DIRE VIVANT. Une annonce dont l'échéance est passée ne
      // compte pas, même si elle rendrait la page plus jolie. C'est toute la
      // différence entre montrer une ville et montrer une archive.
      .gt("expire_le", maintenant)
      .order("publie_le", { ascending: false })
      .limit(max);
    if (error || !Array.isArray(data)) return POULS_VIDE;

    const lignes = data as Record<string, unknown>[];
    const points = lignes
      .map((r) => {
        const fam: Famille = estFamille(r.famille) ? r.famille : "offre";
        return {
          heure: heureParis(str(r.publie_le)),
          qui: str(r.auteur_nom),
          quoi: FAMILLE_LABEL[fam],
          emoji: EMOJI[fam],
        };
      })
      .filter((p) => p.heure);

    return {
      slug,
      nom: str(villeSaisie).trim(),
      vivante: points.length > 0,
      total: points.length,
      points,
    };
  } catch {
    return POULS_VIDE;
  }
}
