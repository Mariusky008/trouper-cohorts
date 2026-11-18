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

/**
 * 🛋️ LES GESTES DU SALON DU DUO (`docs/univers/salon-du-duo.md`, 4.4 ; le lot S3) : leurs clés (leur nom, leur emoji et
 * leur onglet : `GESTES`, `salon.ts`). Chacun est une petite mise en scène jouée chez les deux (`app/salon/gestes.ts`).
 */
export const CLES_GESTES_SALON = ["coucou", "bisou", "check", "chatouilles", "fleur", "calin", "cafe", "danser", "clip", "selfie", "photo", "surprise"] as const;
export type CleGesteDuSalon = (typeof CLES_GESTES_SALON)[number];
export const gesteDuSalon = (x: unknown): CleGesteDuSalon | null => CLES_GESTES_SALON.find((c) => c === x) ?? null;
/** 🌷 Un objet posé sur la table par un geste : son emoji, son nom (« une tulipe »). */
export type ObjetGeste = { e: string; nom: string };
/** Ce que la fleur et le café posent sur la table. */
export const OBJETS_DES_GESTES: Partial<Record<CleGesteDuSalon, ObjetGeste>> = { fleur: { e: "🌷", nom: "une tulipe" }, cafe: { e: "☕", nom: "un café" } };
/** 🎁 Ce que la surprise laisse sur la table : une parmi celles-ci (tirée par celui qui la fait ; rien d'alcoolisé). */
export const SURPRISES = [
  { cle: "ourson", e: "🧸", nom: "un ourson" },
  { cle: "cupcake", e: "🧁", nom: "un cupcake" },
  { cle: "ballon", e: "🎈", nom: "un ballon" },
  { cle: "chocolat", e: "🍫", nom: "du chocolat" },
  { cle: "tournesol", e: "🌻", nom: "un tournesol" },
  { cle: "etoile", e: "⭐", nom: "une étoile" },
  { cle: "cookie", e: "🍪", nom: "un cookie" },
  { cle: "mot", e: "💌", nom: "un petit mot" },
] as const;
export const surpriseDe = (cle: unknown) => SURPRISES.find((x) => x.cle === cle) ?? null;
/** L'objet qu'un geste pose sur la table (la surprise : celle qui a été tirée), ou rien. */
export function objetDuGeste(cle: CleGesteDuSalon, surprise?: unknown): ObjetGeste | null {
  if (cle === "surprise") {
    const x = surpriseDe(surprise);
    return x ? { e: x.e, nom: x.nom } : null;
  }
  return OBJETS_DES_GESTES[cle] ?? null;
}

/**
 * Un geste de la conversation : un panneau, une réaction sur un message (`message` : son identifiant), ou 🛋️ (lot S3) un
 * geste du salon (`objet` : ce qu'il a posé sur la table). `nouveau` : de l'autre, pas encore vu (l'arrivée le rejoue).
 */
export type GesteFil = { id: string; moi: boolean; le: string; type: "panneau" | "reaction" | "geste"; cle: string; message?: string; objet?: ObjetGeste; nouveau?: boolean };
/**
 * Ce que la conversation relit toutes les quelques secondes, page visible : s'il prépare un message, les gestes (des
 * sept derniers jours), et quand est arrivé le dernier message (un nouveau : elle se relit, et les figurines sursautent) ;
 * 📚 et leur étagère (lot E1, `etagere.ts`) : ce que leurs figurines ont noté, ce qu'il n'a pas encore vu se poser.
 */
/** 📺 (lot S6) ce que l'un des deux a mis à la télé lui-même : le message, quand, par qui (le salon relit alors le programme). */
export type TeleVivante = { message: string; le: string; par: "moi" | "lui" };
/** 🖼️ (lot S6) la dernière photo accrochée au mur : quand, par qui (le salon relit alors les cadres). */
export type CadresVivants = { le: string; par: "moi" | "lui" };
export type Vivant = { enregistre: boolean; gestes: GesteFil[]; dernier: number; apartes: AparteVue[]; etagere?: EtagereScene; tele?: TeleVivante; cadres?: CadresVivants };

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
  const type = g.type === "panneau" || g.type === "reaction" || g.type === "geste" ? g.type : null;
  if (!type || typeof g.id !== "string" || typeof g.le !== "string") return null;
  if (type === "panneau" ? !panneauDe(g.cle) : type === "geste" ? !gesteDuSalon(g.cle) : !reactionDe(g.cle) || typeof g.message !== "string") return null;
  const o = (g.objet ?? null) as Record<string, unknown> | null;
  const objet = type === "geste" && o && typeof o.e === "string" && typeof o.nom === "string" && o.e.length <= 16 && o.nom.length <= 40 ? { e: o.e, nom: o.nom } : null;
  return {
    id: g.id,
    moi: g.moi === true,
    le: g.le,
    type,
    cle: String(g.cle),
    ...(type === "reaction" ? { message: String(g.message) } : {}),
    ...(objet ? { objet } : {}),
    ...(g.nouveau === true ? { nouveau: true } : {}),
  };
}
