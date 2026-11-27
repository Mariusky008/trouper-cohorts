/**
 * 🎆 LES GRANDS MOMENTS (27 novembre 2026, le propriétaire : « le marqueur principal de ClikMe, c'est les réactions des
 * figurines, et pour le moment elles sont beaucoup trop légères » ; `docs/univers/grands-moments.md` ; la maquette validée :
 * https://claude.ai/artifact/UMLWowMEFXrAd68ktmsAbE).
 *
 * Quand quelqu'un réagit pendant une vidéo, sa figurine **prend la scène** : elle quitte son fauteuil et grossit au centre,
 * elle fait la tête de l'émotion (ses sept têtes existent déjà), son visage se colore, une aura s'allume, des émojis
 * jaillissent, une bulle crie le mot ; les autres s'assombrissent et se penchent vers elle. Rien de nouveau à fabriquer :
 * tout se pose par-dessus ses têtes. Pas de son ajouté (ni bruitage, ni voix de synthèse).
 *
 * FICHIER PARTAGÉ (l'écran, le serveur, les essais).
 */
import type { ExpressionFigurine } from "./expressions-figurine";

export type CleMoment = "rire" | "coeur" | "choc" | "colere" | "triste" | "bravo" | "feu";
/** Comment la figurine bouge pendant son moment. */
export type GesteMoment = "sautille" | "flotte" | "bondit" | "tremble" | "affaisse" | "saute";

export type Moment = {
  cle: CleMoment;
  e: string;
  nom: string;
  /** la couleur de l'émotion : l'aura, la bulle, le voile de la pièce */
  couleur: string;
  /** la couleur posée sur son visage (sur sa tête seulement) */
  teinte: string;
  /** la tête qu'elle fait (une des sept) */
  tete: ExpressionFigurine;
  /** ce qui jaillit autour d'elle */
  parts: readonly string[];
  /** les cris de la bulle, quand on n'a rien écrit (le même pour tous : tiré de l'identifiant du message) */
  mots: readonly string[];
  geste: GesteMoment;
  /** comment jaillissent les émojis : en éventail, ils montent (cœurs, flammes), ils tombent (la pluie) */
  sens: "eventail" | "monte" | "tombe";
  confettis?: boolean;
  /** des rayons qui tournent derrière elle (le choc) */
  rayons?: boolean;
  /** la pièce tremble (une fois ; trois fois au niveau ×3) */
  secoue?: boolean;
  /** un nuage au-dessus de sa tête (la tristesse) */
  nuage?: string;
};

export const MOMENTS: Record<CleMoment, Moment> = {
  rire: { cle: "rire", e: "😂", nom: "Le fou rire", couleur: "#FFC23D", teinte: "rgba(255,96,64,.55)", tete: "rire", parts: ["😂", "🤣", "🎉", "✨"], mots: ["MDR !!!", "JE SUIS MORT", "PTDR !"], geste: "sautille", sens: "eventail", confettis: true },
  coeur: { cle: "coeur", e: "❤️", nom: "J’adore", couleur: "#FF4FA3", teinte: "rgba(255,60,150,.6)", tete: "sourire", parts: ["❤️", "💖", "😍", "💕"], mots: ["J’ADORE !!", "TROP BEAU", "JE FONDS"], geste: "flotte", sens: "monte" },
  choc: { cle: "choc", e: "😱", nom: "Le choc", couleur: "#A78BFF", teinte: "rgba(170,190,255,.6)", tete: "surprise", parts: ["⚡", "❗", "💥", "😱"], mots: ["QUOI ?!", "NOOON !", "C’EST PAS VRAI !"], geste: "bondit", sens: "eventail", rayons: true, secoue: true },
  colere: { cle: "colere", e: "😠", nom: "La colère", couleur: "#FF3B2F", teinte: "rgba(255,20,0,.72)", tete: "fache", parts: ["🔥", "💢", "🔥", "😡"], mots: ["MAIS NON !!!", "N’IMPORTE QUOI !", "J’EN PEUX PLUS !"], geste: "tremble", sens: "monte", secoue: true },
  triste: { cle: "triste", e: "😢", nom: "La tristesse", couleur: "#4C8DFF", teinte: "rgba(60,120,255,.6)", tete: "triste", parts: ["💧", "💧", "😢"], mots: ["SNIF…", "NOOON…", "ÇA ME BRISE"], geste: "affaisse", sens: "tombe", nuage: "🌧️" },
  bravo: { cle: "bravo", e: "👏", nom: "Bravo", couleur: "#FFD84A", teinte: "rgba(255,215,80,.45)", tete: "sourire", parts: ["👏", "⭐", "✨", "👏"], mots: ["BRAVO !!!", "INCROYABLE !", "CHAPEAU !"], geste: "saute", sens: "eventail", confettis: true },
  // (🎵 le salon de la musique : 🔥 « Ça brûle », j'adore en flammes dorées)
  feu: { cle: "feu", e: "🔥", nom: "Ça brûle", couleur: "#FF8A00", teinte: "rgba(255,140,0,.5)", tete: "rire", parts: ["🔥", "🎵", "✨", "🔥"], mots: ["ÇA BRÛLE !!!", "LE FEU !", "QUELLE PÉPITE"], geste: "sautille", sens: "monte" },
};

/** Le grand moment d'une réaction du salon (😮 « Oh ! », l'ancienne, joue le choc) ; 💃 🎶 gardent leur danse : `null`. */
export function momentDeReaction(cle: string | undefined): Moment | null {
  switch (cle) {
    case "rire":
      return MOMENTS.rire;
    case "coeur":
      return MOMENTS.coeur;
    case "oh":
    case "surprise":
      return MOMENTS.choc;
    case "fache":
      return MOMENTS.colere;
    case "triste":
      return MOMENTS.triste;
    case "bravo":
      return MOMENTS.bravo;
    case "feu":
      return MOMENTS.feu;
    default:
      return null;
  }
}

/** Le grand moment d'une réaction à la seconde d'une vidéo (les souvenirs des proches, ma télé du jour) ; 😴 bof : `null`. */
export function momentDeSorte(sorte: string | undefined): Moment | null {
  return sorte === "rire" ? MOMENTS.rire : sorte === "coeur" ? MOMENTS.coeur : sorte === "oh" || sorte === "peur" ? MOMENTS.choc : null;
}

export const GRAND_MOMENT = {
  /** la figurine reste au centre 3 secondes */
  ms: 3000,
  /** (lot R2) ×2 ×3 : la même émotion touchée encore pendant son moment — 1,6 s de plus à chaque fois, jusqu'à ×3 */
  encore: 1600,
  niveauMax: 3,
  /** 🫶 deux qui réagissent pareil à 1,8 s d'écart (comme « Au même moment ») montent ensemble */
  ensemble: 1800,
  /** la scène est prise : on attend son tour (trois au plus), s'il n'est pas trop tard (6 s) */
  file: 3,
  fraicheur: 6000,
  /** pendant qu'on attend : sur place, sa couleur autour de lui (2,2 s) */
  surPlace: 2200,
  /** ce qu'elle a écrit juste avant (5 s au plus) devient sa bulle, à la place du cri */
  texteAvant: 5000,
  /** la bulle : 40 signes au plus (au-delà, coupé d'un « … ») */
  bulle: 40,
} as const;

/** Un nombre tiré d'un texte (le même partout : tous voient le même cri). */
function graine(t: string): number {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Le mot de la bulle : ce qu'on a écrit à ce moment, sinon un cri de l'émotion (le même pour tous). */
export function motDuMoment(m: Moment, id: string, texte?: string | null): string {
  const t = texte?.replace(/\s+/g, " ").trim();
  if (t) return [...t].length > GRAND_MOMENT.bulle ? `${[...t].slice(0, GRAND_MOMENT.bulle - 1).join("")}…` : t;
  return m.mots[graine(id) % m.mots.length];
}

/** Les émojis qui jaillissent : où chacun va (en points, depuis le centre de la figurine), sa taille, son retard. */
export type Eclat = { e: string; x: number; y: number; taille: number; retard: number; duree: number };
export function eclatsDuMoment(m: Moment, id: string, n = 14, rayon = 140): Eclat[] {
  let g = graine(id) || 1;
  const hasard = () => {
    g = Math.imul(g ^ (g >>> 15), 2246822507) >>> 0;
    g = Math.imul(g ^ (g >>> 13), 3266489909) >>> 0;
    return ((g ^= g >>> 16) >>> 0) / 4294967296;
  };
  return Array.from({ length: n }, (_, k) => {
    const a = (k / n) * Math.PI * 2 + hasard() * 0.6;
    const r = rayon * (0.6 + hasard() * 0.6);
    const [x, y] =
      m.sens === "monte" ? [(hasard() - 0.5) * rayon * 1.8, -(rayon * 0.7 + hasard() * rayon)] : m.sens === "tombe" ? [(hasard() - 0.5) * rayon * 0.7, rayon * 0.5 + hasard() * rayon * 0.4] : [Math.cos(a) * r, Math.sin(a) * r * 0.8 - rayon * 0.3];
    return { e: m.parts[k % m.parts.length], x: Math.round(x), y: Math.round(y), taille: Math.round(18 + hasard() * 16), retard: Math.round(k * 45 + hasard() * 120), duree: Math.round(1300 + hasard() * 900) };
  });
}
