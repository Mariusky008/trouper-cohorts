/**
 * ✨ « MA FIGURINE », MON DOUBLE DU JOUR (le chantier « Ma figurine », lot 1 ; `docs/univers/ma-figurine.md` ; le serveur :
 * `mon-double-serveur.ts`, la route `/api/direct/mon-double`, l'écran `app/collection/mon-double.tsx`).
 *
 * Le propriétaire, le 25 novembre 2026 : « cette figurine dans ma maison doit être vraiment le centre de notre attention
 * puisque c'est elle que les gens verront partout ». Chaque jour, on prépare son double :
 *   · 😊 SA TÊTE DU JOUR : une de ses sept expressions (par défaut, celle de son humeur du jour), montrée partout jusqu'à
 *     minuit ;
 *   · 🪧 SA PANCARTE : UNE phrase, qui est aussi son mot du jour d'Autour — écrite une fois, visible partout jusqu'à ce
 *     qu'on la change ;
 *   · 🪞 le miroir (la caméra : elle copie sa tête ; on garde celle qui plaît), 💃 ses réactions à essayer, 🗓️ sa
 *     figurine du mois.
 * Une pastille reste sur le bouton « ✨ Ma figurine » tant qu'on ne l'a pas préparée aujourd'hui.
 *
 * FICHIER PARTAGÉ (l'écran et le serveur).
 */
import { EXPRESSIONS_FIGURINE, type ExpressionFigurine } from "./expressions-figurine";
import { IDEES_MOT_DU_JOUR, MOT_DU_JOUR_MAX } from "./autour";
import type { Ornements } from "./ornements";

/** La pancarte : la longueur du mot du jour d'Autour (c'est la même phrase), et ses idées toutes prêtes. */
export const PANCARTE_MAX = MOT_DU_JOUR_MAX;
export const IDEES_PANCARTE = IDEES_MOT_DU_JOUR;

/** Une tête qu'on peut choisir : son expression, son image (à adresse stable), son nom. */
export type TeteAuChoix = { cle: ExpressionFigurine; e: string; nom: string; src: string };

/**
 * Ce que l'écran « Ma figurine » montre : son corps sans sa tête et la boîte de sa tête (pour poser l'expression),
 * ses têtes prêtes, celle de son humeur du jour, celle choisie aujourd'hui, sa pancarte, et si son double est prêt
 * aujourd'hui. Sans calques (une figurine de l'ancien style) : `image`, sa figurine d'une seule image, et pas de têtes.
 */
export type MonDoubleVue = {
  corps?: { src: string; ratio: number; boite: [number, number, number, number] };
  /** sa tête habituelle (sans expression) */
  habituelle?: string;
  image?: string;
  tetes: TeteAuChoix[];
  /** l'expression de son humeur du jour, si elle en a une (et son humeur, en mots) */
  humeur?: { e: ExpressionFigurine; emoji: string; nom: string };
  /** la tête choisie aujourd'hui (rien : celle de son humeur) */
  choisie?: ExpressionFigurine;
  pancarte: string;
  /** il a préparé son double aujourd'hui (la pastille s'en va) */
  pret: boolean;
  /** 🔥🎧❤️ ce qu'elle porte toute seule (« Elle change toute seule ») */
  ornements?: Ornements;
};

/** Ce que les autres voient de mon double, partout : ma pancarte (rien s'il n'y en a pas). */
export type DoubleVu = { pancarte?: string };

export const expressionDe = (e: ExpressionFigurine | undefined | null) => EXPRESSIONS_FIGURINE.find((x) => x.cle === e) ?? null;

/** Les réactions qu'on essaie sur l'écran (celles des salons et de la musique : elle les fait pour de vrai là-bas). */
export const REACTIONS_A_ESSAYER = [
  { cle: "danse", e: "💃", nom: "Danser" },
  { cle: "rire", e: "😂", nom: "Rire" },
  { cle: "coucou", e: "👋", nom: "Coucou" },
  { cle: "bravo", e: "👏", nom: "Bravo" },
  { cle: "coeur", e: "❤️", nom: "J’adore" },
  { cle: "oh", e: "😮", nom: "Oh !" },
] as const;
export type ReactionAEssayer = (typeof REACTIONS_A_ESSAYER)[number]["cle"];

/** Les cinq onglets sous la figurine. */
export const ONGLETS_DOUBLE = [
  { cle: "tete", e: "😊", nom: "Sa tête" },
  { cle: "pancarte", e: "🪧", nom: "Pancarte" },
  { cle: "miroir", e: "🪞", nom: "Miroir" },
  { cle: "reactions", e: "💃", nom: "Réactions" },
  { cle: "mois", e: "🗓️", nom: "Du mois" },
] as const;
export type OngletDouble = (typeof ONGLETS_DOUBLE)[number]["cle"];

export const PHRASES_DOUBLE = {
  bouton: "Ma figurine",
  aPreparer: "À préparer aujourd’hui",
  pretAujourdhui: "✓ Ton double est prêt pour aujourd’hui",
  touche: "👆 Touche-la : c’est ton double",
  titre: "Mon double du jour",
  sousTitre: "C’est elle que tout le monde voit",
  retour: "‹ Ma maison",
  teteTitre: "😊 Sa tête du jour",
  teteChapo: "Par défaut, celle de ton humeur. Elle la garde partout jusqu’à demain.",
  monHumeur: (nom: string) => `Mon humeur (${nom.toLowerCase()})`,
  monHumeurSans: "Ma tête habituelle",
  teteGardee: (nom: string) => `✓ Partout aujourd’hui : ${nom.toLowerCase()}.`,
  teteHumeur: "✓ Partout aujourd’hui : la tête de ton humeur.",
  sansTetes: "Ses expressions se préparent : reviens dans un moment.",
  pancarteTitre: "🪧 Sa pancarte",
  pancarteChapo: "Une phrase, visible partout jusqu’à ce que tu la changes. C’est aussi ton mot du jour dans Autour.",
  pancarteLabel: "Ce qu’elle dit",
  pancarteIndice: "Écris ta phrase…",
  idees: "Des idées, pour aller vite",
  pancarteGardee: "✓ Sa pancarte, partout, et ton mot du jour dans Autour.",
  sansPancarte: "Sans pancarte",
  pancarteEnlevee: "✓ Plus de pancarte.",
  garder: "Garder",
  miroirTitre: "🪞 Le miroir",
  miroirChapo: "Allume ta caméra et fais une tête : ta figurine la copie, en direct. Rien n’est enregistré.",
  allumer: "📷 Allumer ma caméra",
  eteindre: "Éteindre",
  miroirCharge: "La caméra s’allume…",
  miroirRefus: "La caméra n’a pas pu s’allumer : autorise-la dans les réglages de ton téléphone.",
  miroirFait: (nom: string) => `Elle fait ta tête : ${nom.toLowerCase()}`,
  miroirNeutre: "Fais une tête : elle la copie.",
  garderTete: "📌 Garder cette tête pour aujourd’hui",
  miroirSans: "Le miroir arrive quand tes expressions sont prêtes.",
  reactionsTitre: "💃 Ses réactions",
  reactionsChapo: "Essaie-les ici. Dans le fil ou un salon, touche deux fois l’écran : elle le fait devant tout le monde.",
  moisTitre: "🗓️ Sa figurine du mois",
  valider: "✓ C’est moi aujourd’hui",
  partout: "Partout : le fil, les salons, Autour, chez ceux qui te visitent.",
  pret: "✓ Ton double est prêt : on le voit partout aujourd’hui.",
  refus: "Ça, ta figurine ne le dit pas. Écris autre chose 🙂",
} as const;
