/**
 * 👋 LA BIENVENUE « ENTRE CHEZ PABLITO » — 15 novembre 2026, le propriétaire : « il va falloir largement améliorer cette
 * démo de départ pour vraiment donner les plus-values de ce qu'on fait sur cette app ». La proposition validée le même
 * jour (« OUI » : son univers devient celui de Pablito, montré à tous les nouveaux venus ; les trois nouvelles phrases,
 * enregistrées par lui dans la foulée) : le nouveau venu est l'invité de Pablito, dans le VRAI univers du propriétaire
 * (`chez-pablito-serveur.ts`). La conversation avec Pablito devient la démo : chaque chose se vit d'un toucher.
 *
 *   1. Pablito debout, en grand, salue ;
 *   2. « C'est un peu comme WhatsApp… Mais ici… » : une conversation grise, ordinaire ; à « Mais ici », la brume se lève
 *      sur son univers (sa figurine dans son fauteuil, la saison) ;
 *   3. « Là, tu es chez moi… Touche-en un » : ses clés (« pourquoi c'est là »), sur le décor ;
 *   4. « Quand on se parle, ma figurine écoute. Tiens : tu fais quoi ce week-end ? » : trois choix, puis « Je le range ? »,
 *      l'étagère, et le rappel du jour venu ;
 *   5. « Tes proches peuvent le visiter… » puis « Tu es mon invité : laisse-moi un souvenir ! » : il se pose chez lui ;
 *      « Merci, je le garde. » ;
 *   6. « Ton univers s'agrandit… » : une nouvelle pièce, un endroit secret, « Qui peut entrer » ;
 *   7. « Par toi ! » : son décor en esquisse, une place vide, « 📸 Je crée ma figurine ».
 * Rien n'est enregistré pendant la bienvenue : le rangement et le souvenir sont joués pour elle.
 *
 * Ce fichier est partagé (l'écran et les essais).
 */
import type { Boucle, Espece } from "./compagnons";
import type { FigurineEnPlace, PlaceMonde } from "./monde";
import type { CleUnivers } from "./univers-creation";

/**
 * 🔀 L'INTERRUPTEUR : allumé, la toute première arrivée ouvre la bienvenue chez Pablito (si son univers est adopté ;
 * sinon, l'ancienne). Éteint tant que le propriétaire ne l'a pas regardée à son adresse directe, `/bienvenue`.
 */
export const BIENVENUE_CHEZ_PABLITO = false;

/** Son adresse directe (pour la regarder, la rejouer, la montrer). */
export const LIEN_BIENVENUE = "/bienvenue";

export type MomentBienvenue = "salut" | "gris" | "chez" | "range" | "visite" | "souvenir" | "merci" | "grandit" | "fin";

/**
 * Les bulles de Pablito : leur texte, leur enregistrement et sa durée (la bulle s'écrit au rythme de sa voix). Les
 * bulles 1, 2, 5, 8 et 9 gardent les enregistrements du 13 novembre (`tuto-bienvenue-1`, `tuto-univers-*`) ; les
 * nouvelles (`tuto-chez-*`) sont arrivées le 15 novembre.
 */
export const BULLES_CHEZ: { moment: MomentBienvenue; t: string; son: string; duree: number; visage: "joie" | "euphorie" }[] = [
  { moment: "salut", t: "Salut ! Moi, c’est Pablito, le patron de ClikMe. Bienvenue !", son: "tuto-bienvenue-1", duree: 4.05, visage: "joie" },
  {
    moment: "gris",
    t: "ClikMe, c’est un peu comme WhatsApp : tu parles avec tes proches. Mais ici, vos conversations créent un univers commun entre vous.",
    son: "tuto-univers-2",
    duree: 6.69,
    visage: "euphorie",
  },
  { moment: "chez", t: "Là, tu es chez moi. Rien n’est là par hasard : chaque objet vient de ce que j’aime. Touche-en un.", son: "tuto-chez-3", duree: 5.72, visage: "joie" },
  { moment: "range", t: "Quand on se parle, ma figurine écoute. Tiens : tu fais quoi ce week-end ?", son: "tuto-chez-4", duree: 4.21, visage: "joie" },
  { moment: "visite", t: "Petit à petit, il te définit mieux que tu ne pourrais l’imaginer. Tes proches peuvent le visiter… et toi, visiter les leurs.", son: "tuto-univers-5", duree: 7.63, visage: "joie" },
  { moment: "souvenir", t: "Tu es mon invité : laisse-moi un souvenir !", son: "tuto-chez-5", duree: 2.48, visage: "euphorie" },
  { moment: "merci", t: "Merci, je le garde.", son: "tuto-chez-5-merci", duree: 2.3, visage: "joie" },
  {
    moment: "grandit",
    t: "Ton univers s’agrandit à chaque conversation. De nouveaux endroits apparaissent, certains secrets, avec des portes que tu n’ouvres qu’à qui tu veux.",
    son: "tuto-univers-4",
    duree: 7.71,
    visage: "euphorie",
  },
  { moment: "fin", t: "Par toi ! Un selfie pour ta figurine, puis on discute cinq minutes, et je dessine les premiers endroits de ton univers.", son: "tuto-univers-6", duree: 6.11, visage: "joie" },
];

/** Ce qu'on lui répond, après la bulle (les bulles 4 et 6 enchaînent : on choisit, puis il répond). */
export const REPONSES_CHEZ: Partial<Record<MomentBienvenue, string>> = {
  salut: "C’est quoi, ClikMe ?",
  gris: "On est où, là ?",
  chez: "Trop beau ! Et après ?",
  range: "Et mes proches ?",
  merci: "Et le mien, il sera comment ?",
  grandit: "Ça commence comment ?",
};

/** « Tu fais quoi ce week-end ? » : ce qu'on répond, ce que sa figurine propose de ranger, et le rappel du jour venu. */
export const WEEKEND = [
  { cle: "cine", dit: "🎬 Ciné samedi", range: "📅 Samedi : ciné", rappel: { quand: "Samedi, 9:00", dit: "Ce soir, ciné ! 🎬" } },
  { cle: "foot", dit: "⚽ Foot dimanche", range: "📅 Dimanche : foot", rappel: { quand: "Dimanche, 9:00", dit: "Foot aujourd’hui ! ⚽" } },
  { cle: "pizza", dit: "🍕 Pizza avec des potes", range: "📅 Ce week-end : pizza avec les potes", rappel: { quand: "Samedi, 9:00", dit: "Pizza avec les potes ce week-end ! 🍕" } },
] as const;

/** L'univers de Pablito, tel que la bienvenue le montre (`chez-pablito-serveur.ts` ; des adresses signées, une heure). */
export type UniversDePablito = {
  decor: string;
  /** sa figurine assise, bouche fermée et ouverte (sa tenue du mois, si elle est méritée) */
  figurine?: { assise: string; parle?: string };
  /** 📏 sa figurine relevée sur l'image vedette (la place et la taille que la pièce demande) */
  place?: FigurineEnPlace;
  /** sa place d'hôte (sans relevé) */
  hote?: PlaceMonde;
  /** ses clés posées sur le décor : ce qui est là, et pourquoi */
  cles: CleUnivers[];
  saison?: { nom: string; emoji: string };
  /** 🌟 son décor, vivant (une courte vidéo en boucle), s'il a été fait */
  decorVivant?: string;
  version?: number;
  /** 🐾 son chat : son nom, et ses boucles faites (le catalogue des compagnons, des adresses signées) */
  compagnon?: { espece: Espece; nom: string; boucles: Partial<Record<Boucle, string>> };
};

/** Les souvenirs qu'on peut lui laisser (parmi ceux des visites, `visites.ts`). */
export const SOUVENIRS_CHEZ = ["fleurs", "tasse", "biscuits", "plante"] as const;

/** Où un mot de la bulle tombe, en part de sa durée (la bulle s'écrit au rythme de sa voix) : pour caler la scène. */
export function momentDuMot(t: string, mot: string, duree: number): number {
  const i = t.indexOf(mot);
  return i < 0 ? 0 : (i / Math.max(1, t.length)) * duree;
}
