/**
 * 🎭 LA CONVERSATION VIVANTE — lot R4a du rituel du jour (`docs/univers/feuille-de-route.md`, lot R, point 5 ; le
 * propriétaire, le 12 novembre 2026 : « qu'est-ce qui va être différenciant, mis à part nos figurines qui parlent et qui
 * bougent ? Il faut qu'il y ait une utilité et du dynamisme dans cette scène » — puis « oui » au premier lot).
 *
 * Sans IA :
 *   · « IL PRÉPARE UN MESSAGE » : quand l'autre enregistre, sa figurine se penche vers la mienne, main levée, « … » ;
 *   · LES SILENCES : après 20 s, elles s'occupent (s'étirer, regarder leur téléphone) ; après une minute, selon leur
 *     humeur du jour, elles se lèvent et dansent, s'affalent ou croisent les bras ; après trois minutes, elles
 *     s'endorment (zZz) ; un message arrive : elles sursautent ;
 *   · LES RÉACTIONS AVEC LE CORPS : un appui long sur un message, six gestes ; sa figurine le fait, dans les deux scènes ;
 *   · LES PANNEAUX : un toucher, sa figurine brandit une pancarte, vue des deux (liste validée par le propriétaire).
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : aucun accès à la base ici.
 */
import type { Sentiment } from "./ma-figurine";
import type { EtagereScene } from "./etagere";

/** 🪧 Les panneaux (validés par le propriétaire le 12 novembre 2026). */
export const PANNEAUX = [
  { cle: "mdr", texte: "MDR" },
  { cle: "jarrive", texte: "J’arrive !" },
  { cle: "rappelle", texte: "Rappelle-moi" },
  { cle: "bravo", texte: "Bravo !" },
  { cle: "pasdispo", texte: "Pas dispo 😴" },
  { cle: "pense", texte: "Je pense à toi" },
  { cle: "merci", texte: "Merci !" },
  { cle: "cesoir", texte: "Ce soir ?" },
] as const;
/** 👏 Les réactions avec le corps (un appui long sur un message). */
export const REACTIONS = [
  { cle: "applaudir", emoji: "👏", nom: "Applaudir" },
  { cle: "mdr", emoji: "😂", nom: "Mort de rire" },
  { cle: "coeur", emoji: "❤️", nom: "Cœur" },
  { cle: "check", emoji: "✋", nom: "Check" },
  { cle: "front", emoji: "🤦", nom: "Se taper le front" },
  { cle: "waouh", emoji: "😮", nom: "Waouh" },
] as const;
export type CleGeste = (typeof PANNEAUX)[number]["cle"] | (typeof REACTIONS)[number]["cle"];
export const panneauDe = (cle: unknown) => PANNEAUX.find((p) => p.cle === cle) ?? null;
export const reactionDe = (cle: unknown) => REACTIONS.find((r) => r.cle === cle) ?? null;

/** Un geste de la conversation : un panneau, ou une réaction sur un message (`message` : son identifiant). */
export type GesteFil = { id: string; moi: boolean; le: string; type: "panneau" | "reaction"; cle: string; message?: string };
/**
 * Ce que la conversation relit toutes les quelques secondes, page visible : s'il prépare un message, les gestes (des
 * sept derniers jours), et quand est arrivé le dernier message (un nouveau : elle se relit, et les figurines sursautent) ;
 * 📚 et leur étagère (lot E1, `etagere.ts`) : ce que leurs figurines ont noté, ce qu'il n'a pas encore vu se poser.
 */
export type Vivant = { enregistre: boolean; gestes: GesteFil[]; dernier: number; apartes: AparteVue[]; etagere?: EtagereScene };

/**
 * 🎭 L'APARTÉ DES DEUX FIGURINES (lot R4b) : après un vrai échange et deux minutes de silence, elles se tournent l'une
 * vers l'autre, une bulle chacune (`mots` : dans l'ordre ; `moi` : la mienne). Écrit par l'IA, visible des deux, sans
 * demande d'accord (le propriétaire, le 12 novembre 2026 : « pas besoin d'accord, mais visibles des deux »).
 */
export type AparteVue = { id: string; le: string; mots: { moi: boolean; texte: string }[] };
/** Un vrai échange : quatre messages au moins en un quart d'heure, des deux ; puis deux minutes de silence. Une fois par heure et par paire, trois par jour. */
export const APARTE = { messages: 4, fenetre: 15 * 60_000, silence: 2 * 60_000, entre: 60 * 60_000, parJour: 3 } as const;
/** La longueur d'une réplique d'aparté. */
export const APARTE_MAX = 90;

/** « Il prépare un message » s'éteint seul, s'il ne se redit pas (la page le redit toutes les 5 s). */
export const ENREGISTRE_MS = 9000;
/** La page relit la conversation vivante toutes les… */
export const RELIRE_MS = 4000;
/** Les gestes par personne et par jour, au plus. */
export const GESTES_PAR_JOUR = 300;
/** Les silences : quand elles s'occupent, quand leur humeur se voit, quand elles s'endorment. */
export const SILENCES = { occupe: 20_000, humeur: 60_000, dort: 180_000 } as const;

/** La posture d'une figurine dans la scène. */
export type Posture = "calme" | "occupe" | "danse" | "affale" | "bras" | "dort";
/** 🕺 Selon le silence (en millisecondes) et son humeur du jour : la joie fait danser, la tristesse affale, la colère croise les bras. */
export function postureDe(humeur: Sentiment | null | undefined, silence: number): Posture {
  if (silence >= SILENCES.dort) return "dort";
  if (silence >= SILENCES.humeur) {
    if (humeur === "joie" || humeur === "euphorie" || humeur === "rire" || humeur === "amour" || humeur === "grimace") return "danse";
    if (humeur === "tristesse" || humeur === "tete") return "affale";
    if (humeur === "colere") return "bras";
    return "occupe";
  }
  if (silence >= SILENCES.occupe) return "occupe";
  return "calme";
}

/** Un geste relu (le seau ou la route) : rien d'inventé. */
export function gesteValide(x: unknown): GesteFil | null {
  if (!x || typeof x !== "object") return null;
  const g = x as Record<string, unknown>;
  const type = g.type === "panneau" || g.type === "reaction" ? g.type : null;
  if (!type || typeof g.id !== "string" || typeof g.le !== "string") return null;
  if (type === "panneau" ? !panneauDe(g.cle) : !reactionDe(g.cle) || typeof g.message !== "string") return null;
  return { id: g.id, moi: g.moi === true, le: g.le, type, cle: String(g.cle), ...(type === "reaction" ? { message: String(g.message) } : {}) };
}
