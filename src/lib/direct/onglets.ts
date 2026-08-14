// LES ONGLETS DU FIL.
//
// CE QU'ILS REMPLACENT, ET POURQUOI. Le fil se filtrait par FAMILLE — offres,
// places, ma ville — c'est-à-dire par notre taxonomie interne. Personne n'ouvre
// une application de ville en cherchant « une publication de famille place ».
// On cherche à déjeuner, un créneau chez le coiffeur, ce qui ferme dans
// l'heure. Les onglets suivent donc l'INTENTION, pas la structure des données.
//
// CHAQUE ONGLET A SON TITRE. « Ce qui se passe maintenant à Dax » et « On mange
// quoi maintenant ? » ne sont pas la même question, et l'écran doit répondre à
// celle qu'on vient de poser. Un titre unique au-dessus d'un filtre qui change
// donne l'impression d'un tableau de bord ; un titre qui suit donne
// l'impression que l'application a compris.
import { modeleDuMetier } from "./modeles-fiche";
import { heureLocale } from "./degradation";

export const ONGLETS = ["tout", "heure", "dejeuner", "beaute", "boutiques", "soir"] as const;
export type Onglet = (typeof ONGLETS)[number];

export function estOnglet(v: unknown): v is Onglet {
  return typeof v === "string" && (ONGLETS as readonly string[]).includes(v);
}

/** « Dans l'heure » : ce qui disparaît avant soixante minutes. La même borne
 *  que le rang « urgent » du tri — les deux doivent dire la même chose. */
export const URGENT_MS = 60 * 60 * 1000;

export type DefOnglet = {
  cle: Onglet;
  /** L'étiquette de la pastille. Courte : elles défilent horizontalement. */
  label: string;
  /** Le titre de l'écran. `\n` marque la coupure voulue, pas un hasard de
   *  largeur : « Ce qui se passe / maintenant à Dax » se lit en deux temps. */
  titre: (ville: string) => string;
};

export const DEFS: readonly DefOnglet[] = [
  { cle: "tout", label: "Tout", titre: (v) => `Ce qui se passe\nmaintenant à ${v}` },
  { cle: "heure", label: "Dans l'heure", titre: () => "Ce qui disparaît\ndans l'heure" },
  { cle: "dejeuner", label: "Déjeuner", titre: () => "On mange quoi\nmaintenant ?" },
  { cle: "beaute", label: "Beauté", titre: () => "Un créneau\nse libère près de vous" },
  { cle: "boutiques", label: "Boutiques", titre: () => "Ce qui vient\nd'arriver en boutique" },
  { cle: "soir", label: "Ce soir", titre: (v) => `Ce qui vous attend\nce soir à ${v}` },
];

export type EntreeOnglet = {
  famille?: string | null;
  auteurMetier?: string | null;
  expireLe?: string | null;
};

const ms = (v: unknown): number => {
  const t = Date.parse(String(v ?? ""));
  return Number.isFinite(t) ? t : NaN;
};

/**
 * Une annonce appartient-elle à cet onglet ?
 *
 * Le métier fait foi, pas la famille : un restaurant qui annonce une place
 * libre relève quand même du déjeuner. C'est ce qu'on cherche — « où manger » —
 * et pas la nature technique de l'annonce.
 */
export function dansOnglet(e: EntreeOnglet, onglet: Onglet, maintenant: number = Date.now()): boolean {
  if (onglet === "tout") return true;

  if (onglet === "heure") {
    const t = ms(e.expireLe);
    // Sans échéance, rien ne « disparaît dans l'heure » : l'annonce ne peut pas
    // entrer dans cet onglet, même si elle est récente.
    return !Number.isNaN(t) && t > maintenant && t - maintenant <= URGENT_MS;
  }

  if (onglet === "soir") {
    // Ce qui court encore ce soir : une échéance entre 17 h et minuit, ou un
    // événement — un concert n'a pas besoin d'expirer à 19 h pour être une
    // sortie du soir.
    if (String(e.famille) === "evenement") return true;
    const t = ms(e.expireLe);
    if (Number.isNaN(t) || t <= maintenant) return false;
    const h = heureLocale(new Date(t));
    return h >= 17;
  }

  const modele = modeleDuMetier(String(e.auteurMetier ?? ""));
  if (onglet === "dejeuner") return modele === "menu" || String(e.famille) === "menu";
  if (onglet === "beaute") return modele === "creneau";
  // « Boutiques » regroupe ce qui se vend en rayon : les produits qui arrivent
  // et ceux qui partent en fin de journée.
  return modele === "produit" || modele === "derniere-chance";
}

/**
 * Le sous-titre : ce que l'onglet contient VRAIMENT, compté sur place.
 *
 * Compté et non annoncé : le prototype affiche « 31 offres chez 18 commerces ».
 * Un chiffre inventé se démonte au premier coup d'œil au fil, et c'est la seule
 * chose que cette application vend — que ce qui est écrit soit vrai.
 */
export function sousTitre(
  entrees: ReadonlyArray<EntreeOnglet & { auteurSlug?: string | null }>,
  onglet: Onglet
): string {
  const n = entrees.length;
  if (n === 0) return "";
  const commerces = new Set(entrees.map((e) => String(e.auteurSlug ?? "")).filter(Boolean)).size;
  const offres = `${n} ${n > 1 ? "offres" : "offre"}`;

  if (onglet === "heure") return `${offres} ${n > 1 ? "se terminent" : "se termine"} dans l'heure`;
  if (onglet === "dejeuner") return `${commerces || n} ${commerces > 1 ? "restaurants ont" : "restaurant a"} publié aujourd'hui`;
  if (onglet === "beaute") return `${commerces || n} ${commerces > 1 ? "salons ont" : "salon a"} des places aujourd'hui`;
  if (onglet === "boutiques") return `${commerces || n} ${commerces > 1 ? "boutiques ont" : "boutique a"} publié aujourd'hui`;
  if (onglet === "soir") return `${commerces || n} ${commerces > 1 ? "commerces proposent" : "commerce propose"} quelque chose ce soir`;
  return commerces > 1 ? `${offres} chez ${commerces} commerces` : offres;
}
