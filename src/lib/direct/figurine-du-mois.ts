/**
 * 🗓️ SA FIGURINE DU MOIS, MÉRITÉE — le lot 3 de la stratégie de « Ma collection » (5 novembre 2026, validée avec le
 * patron : « on peut collectionner sa propre figurine avec chaque mois un nouveau thème, un nouveau vêtement en fonction
 * du mois, une nouvelle expression, et un nouveau slogan qui résume notre mois à venir, en fonction des infos qu'on a
 * récupérées pendant le mois » ; « méritée » ; « 10 jours, ça va »).
 *
 *   · ELLE SE MÉRITE : 10 jours de rencontres dans le mois (`JOURS_POUR_LA_FIGURINE`) ; au 10ᵉ, elle se fabrique ;
 *   · ELLE CHANGE AVEC LUI : sa figurine, habillée du thème du mois (les tenues des éditions : `TENUES_EDITION`), avec
 *     l'expression du mois (`EXPRESSIONS_DU_MOIS`) ;
 *   · SA PHRASE DU MOIS : « drôle et bienveillante, comme un horoscope qui le connaît », écrite d'après ce qu'il a dit
 *     et vécu pendant le mois (son journal) ;
 *   · « MES FIGURINES » : l'album de soi, mois après mois (douze par an).
 * Sans moteur d'image, c'est sa figurine de tous les jours, avec le thème et sa phrase.
 *
 * FICHIER PARTAGÉ (navigateur et serveur).
 */
import { EDITIONS_DATEES } from "./collection";

export const JOURS_POUR_LA_FIGURINE = 10;

/** L'expression de chaque mois (en français pour la page, en anglais pour le moteur). */
export const EXPRESSIONS_DU_MOIS: Record<string, { dit: string; en: string }> = {
  galette: { dit: "fier comme un roi", en: "a proud, regal, delighted grin, chin slightly up — the king of the day" },
  "saint-valentin": { dit: "attendri", en: "a tender, dreamy smile with soft, warm eyes" },
  printemps: { dit: "plein d'entrain", en: "a fresh, wide-awake, delighted look, eyes bright" },
  paques: { dit: "gourmand", en: "a mischievous, greedy little smile, as if hiding a chocolate egg" },
  "fete-des-meres": { dit: "touché", en: "a moved, warm, grateful smile" },
  musique: { dit: "dans la musique", en: "eyes half closed, blissfully humming a tune, a happy smile" },
  ete: { dit: "insouciant", en: "a carefree, sunny, relaxed grin" },
  vacances: { dit: "zen", en: "a totally relaxed, blissful, peaceful expression" },
  rentree: { dit: "déterminé", en: "a determined, motivated look, eyebrows set, a confident half-smile" },
  halloween: { dit: "faussement effrayant", en: "a playful pretend-scary expression, eyebrows raised, a mock spooky grin" },
  automne: { dit: "rêveur", en: "a cosy, dreamy, slightly nostalgic smile" },
  noel: { dit: "émerveillé", en: "a wide-eyed, wonder-struck, sparkling expression" },
};

export type EditionDuMois = { cle: string; nom: string; emoji: string };
/** L'édition d'un mois (« 2026-11 » → Automne 🍂). */
export function editionDuMois(mois: string): EditionDuMois {
  const mm = mois.slice(5, 7);
  const e = EDITIONS_DATEES.find((x) => x.debut.startsWith(`${mm}-`)) ?? EDITIONS_DATEES[0];
  return { cle: e.cle, nom: e.nom, emoji: e.emoji };
}
/** « novembre 2026 ». */
export const moisEnClair = (mois: string) => new Date(`${mois}-15T12:00:00`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

export type FigurineDuMois = {
  mois: string;
  edition: EditionDuMois;
  /** L'expression du mois, en mots (« émerveillé »). */
  expression: string;
  /** « a-gagner » : il lui manque des jours (ou sa figurine) ; « a-fabriquer » : méritée, à faire ; « prete ». */
  etat: "a-gagner" | "a-fabriquer" | "prete";
  /** Ses jours de rencontres ce mois-là, et l'objectif. */
  jours: number;
  objectif: number;
  /** Il n'a pas encore sa figurine (il faut d'abord la créer). */
  sansFigurine?: boolean;
  /** Prête : son image (adresse signée), sa phrase du mois, quand. */
  image?: string;
  phrase?: string;
  le?: string;
  /**
   * 🎭 SA BOUCHE OUVERTE (adresse signée) : la figurine du mois devient un LOOK qu'il fait parler dans ses mèmes
   * (7 novembre 2026, le patron : « on devrait pouvoir utiliser celle qu'on veut pour l'envoyer en faisant dire quelque
   * chose ou la transformer en mème »). Faite à la demande, la première fois qu'il la choisit.
   */
  parle?: string;
};

/** Un look : « 2026-11 » (le mois de sa figurine du mois). */
export const lookValide = (x: unknown): string => (typeof x === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(x) ? x : "");
export type MesFigurinesDuMois = { courante: FigurineDuMois; passees: FigurineDuMois[] };
