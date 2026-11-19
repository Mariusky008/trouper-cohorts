/**
 * 🎭 LES MÈMES DU SALON (`docs/univers/salon-du-duo.md`, section 4.7 ; le lot S5) — LES RÈGLES, sans serveur.
 *
 * « Un mème est une donnée, pas une vidéo » : ce que dit ma figurine (120 signes), sa tête (😂 😄 🤩 😍 😜 😢 😠), si elle
 * danse — et, plus tard, ma voix. Il est joué en direct par le moteur de la scène, chez les deux : la caméra s'approche,
 * un projecteur s'allume, « Action ! », le texte arrive mot à mot dans une bulle de BD avec la tête qui va avec et une
 * petite musique, « Coupez ! ». Il se range dans leur fil comme un message (`genre: "meme"`).
 *
 * Les mèmes prêts et le mème du jour : `memes-prets.ts` (les mêmes que le studio).
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : aucun accès à la base ici.
 */
import type { Sentiment } from "./ma-figurine";
import { memesDuMoment, type MemePret } from "./memes-prets";

/** Ce que dit ma figurine, au plus (en signes). */
export const MEME_MAX = 120;
/** Les mèmes du salon, par personne et par jour. */
export const MEMES_SALON_PAR_JOUR = 60;

/** Les sept têtes d'un mème, dans l'ordre de la feuille « Ton mème ». */
export const TETES_MEME = [
  { cle: "rire", e: "😂", nom: "Fou rire" },
  { cle: "joie", e: "😄", nom: "Joie" },
  { cle: "euphorie", e: "🤩", nom: "Euphorie" },
  { cle: "amour", e: "😍", nom: "Amour" },
  { cle: "grimace", e: "😜", nom: "Grimace" },
  { cle: "tristesse", e: "😢", nom: "Tristesse" },
  { cle: "colere", e: "😠", nom: "Colère" },
] as const satisfies readonly { cle: Sentiment; e: string; nom: string }[];
export type TeteMeme = (typeof TETES_MEME)[number]["cle"];
export const teteMeme = (x: unknown): TeteMeme | null => TETES_MEME.find((t) => t.cle === x)?.cle ?? null;
export const emojiDeTete = (t: TeteMeme) => TETES_MEME.find((x) => x.cle === t)?.e ?? "😄";

/** Un mème du salon, tel qu'il se joue : ce qu'il dit, sa tête, s'il danse ; `pret` : le mème prêt d'où il vient. */
export type MemeSalon = { texte: string; tete: TeteMeme; danse: boolean; pret?: string };

const signes = (t: string) => [...t].length;
/** Le texte d'un mème, nettoyé (une ligne, pas de balise) ; `null` : vide ou trop long. */
export function texteDeMeme(x: unknown): string | null {
  if (typeof x !== "string") return null;
  const t = x.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
  return t && signes(t) <= MEME_MAX ? t : null;
}
/** Un mème envoyé, relu : son texte, sa tête (sinon : la joie), sa danse, le mème prêt (sa clé, s'il en vient). */
export function memeValide(x: { texte?: unknown; tete?: unknown; danse?: unknown; pret?: unknown }): MemeSalon | null {
  const texte = texteDeMeme(x.texte);
  if (!texte) return null;
  const pret = typeof x.pret === "string" && /^[a-z0-9-]{2,30}$/.test(x.pret) ? x.pret : undefined;
  return { texte, tete: teteMeme(x.tete) ?? "joie", danse: x.danse === true, ...(pret ? { pret } : {}) };
}

/** Les mèmes de l'onglet 🎭 : le mème du jour (✨), puis les mèmes prêts du moment (les fêtes, le jour, les autres). */
export function memesDuSalon(d = new Date()): (MemePret & { tete: TeteMeme })[] {
  return memesDuMoment(d).map((m) => ({ ...m, tete: teteMeme(m.sentiment) ?? "joie" }));
}

/** Le temps que dure le mème joué (ms) : la caméra, « Action ! », les mots un à un, la tenue, « Coupez ! ». */
export function dureeDuMeme(m: Pick<MemeSalon, "texte" | "danse">): number {
  const mots = m.texte.split(" ").length;
  return 900 + mots * MOT_MS + 1300 + (m.danse ? 900 : 0) + 700;
}
/** Un mot de la bulle de BD toutes les… (ms). */
export const MOT_MS = 230;

/** La bulle, « Chez moi », les figurines qui lisent : « 🎭 « Le texte » ». */
export const ligneMeme = (texte?: string) => `🎭 « ${(texte ?? "").trim()} »`;
/** 🔔 La notification : « 🎭 Léa t'a envoyé un mème », et ce qu'il dit. */
export function notifMeme(prenom: string, texte: string): { titre: string; corps: string } {
  return { titre: `🎭 ${prenom.trim() || "Un proche"} t’a envoyé un mème`, corps: texte };
}

/** Les phrases de l'écran (on tutoie ; jamais le genre deviné). */
export const PHRASES_MEME = {
  onglet: "🎭 Mèmes",
  duJour: "Du jour",
  lemien: "Le mien",
  feuille: "Ton mème",
  dit: "Ce que dit ta figurine",
  idees: "Des idées",
  tete: "Sa tête",
  danse: "🎶 Elle danse",
  action: "🎬 Action !",
  coupez: "Coupez !",
  revoir: "▶ Revoir",
  vide: "Écris ce que dit ta figurine.",
  long: `${MEME_MAX} signes au plus.`,
  pasParti: "Ton mème n’est pas parti : réessaie.",
  assez: "Assez de mèmes pour aujourd’hui : reviens demain.",
  joue: (prenom: string) => `🎭 ${prenom || "Ton proche"} te joue un mème`,
  case: "joué par ta figurine",
} as const;
