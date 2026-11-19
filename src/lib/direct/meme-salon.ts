/**
 * 🎭 LES MÈMES DU SALON (`docs/univers/salon-du-duo.md`, section 4.7 ; le lot S5) — LES RÈGLES, sans serveur.
 *
 * « Un mème est une donnée, pas une vidéo » : ce que dit ma figurine (120 signes), sa tête (😂 😄 🤩 😍 😜 😢 😠), si elle
 * danse — et ma voix (🎙️ « Ma voix », 20 secondes au plus : alors le texte est facultatif, la transcription le remplit). Il est joué en direct par le moteur de la scène, chez les deux : la caméra s'approche,
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
/** 🎙️ Un mème dit avec ma voix : 20 secondes au plus (un vocal, c'est une minute). */
export const MEME_VOIX_MAX = 20;

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

/**
 * Un mème du salon, tel qu'il se joue : ce qu'il dit (vide : dit avec sa voix, pas encore transcrit), sa tête, s'il
 * danse ; `pret` : le mème prêt d'où il vient ; `voix` : 🎙️ dit avec sa voix (son adresse, sa durée, ses niveaux).
 */
export type MemeSalon = { texte: string; tete: TeteMeme; danse: boolean; pret?: string; voix?: VoixDuMeme };
/** 🎙️ Sa voix, telle qu'elle se joue : son adresse, sa durée (s), ses niveaux (`vocal.ts`). */
export type VoixDuMeme = { url: string; duree: number; niveaux: string };

const signes = (t: string) => [...t].length;
/** Le texte d'un mème, nettoyé (une ligne, pas de balise) ; `null` : vide ou trop long. */
export function texteDeMeme(x: unknown): string | null {
  if (typeof x !== "string") return null;
  const t = x.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
  return t && signes(t) <= MEME_MAX ? t : null;
}
/**
 * Un mème envoyé, relu : son texte, sa tête (sinon : la joie), sa danse, le mème prêt (sa clé, s'il en vient).
 * `avecVoix` : dit avec sa voix — le texte peut manquer (pas trop long pour autant).
 */
export function memeValide(x: { texte?: unknown; tete?: unknown; danse?: unknown; pret?: unknown }, avecVoix = false): Omit<MemeSalon, "voix"> | null {
  const vide = x.texte == null || (typeof x.texte === "string" && !x.texte.replace(/[<>]/g, "").trim());
  const texte = avecVoix && vide ? "" : texteDeMeme(x.texte);
  if (texte == null || (!texte && !avecVoix)) return null;
  const pret = typeof x.pret === "string" && /^[a-z0-9-]{2,30}$/.test(x.pret) ? x.pret : undefined;
  return { texte, tete: teteMeme(x.tete) ?? "joie", danse: x.danse === true, ...(pret ? { pret } : {}) };
}

/** Les mèmes de l'onglet 🎭 : le mème du jour (✨), puis les mèmes prêts du moment (les fêtes, le jour, les autres). */
export function memesDuSalon(d = new Date()): (MemePret & { tete: TeteMeme })[] {
  return memesDuMoment(d).map((m) => ({ ...m, tete: teteMeme(m.sentiment) ?? "joie" }));
}

/**
 * Le temps que dure le mème joué (ms) : la caméra, « Action ! », les mots un à un (ou sa voix, si elle dure plus), la
 * tenue, « Coupez ! ». `voix` : la durée de sa voix (s).
 */
export function dureeDuMeme(m: Pick<MemeSalon, "texte" | "danse"> & { voix?: number }): number {
  const mots = m.texte ? m.texte.split(" ").length : 0;
  return 900 + Math.max(mots * MOT_MS, (m.voix ?? 0) * 1000) + 1300 + (m.danse ? 900 : 0) + 700;
}
/** 🎙️ Avec sa voix, un mot de la bulle toutes les… (ms) : les mots répartis sur sa voix. */
export const motMsAvecVoix = (mots: number, voix: number) => Math.min(800, Math.max(140, (voix * 1000) / Math.max(1, mots)));
/** Un mot de la bulle de BD toutes les… (ms). */
export const MOT_MS = 230;

/** La bulle, « Chez moi », les figurines qui lisent : « 🎭 « Le texte » » (dit avec sa voix, pas encore écrit : « 🎭 🎙️ Un mème, avec sa voix »). */
export const ligneMeme = (texte?: string, voix = false) => ((texte ?? "").trim() ? `🎭 ${voix ? "🎙️ " : ""}« ${(texte ?? "").trim()} »` : `🎭 🎙️ ${PHRASES_MEME.avecSaVoix}`);
/** 🔔 La notification : « 🎭 Léa t'a envoyé un mème », et ce qu'il dit (ou « 🎙️ Avec sa voix »). */
export function notifMeme(prenom: string, texte: string, voix = false): { titre: string; corps: string } {
  return { titre: `🎭 ${prenom.trim() || "Un proche"} t’a envoyé un mème`, corps: texte.trim() ? `${voix ? "🎙️ " : ""}${texte}` : `🎙️ ${PHRASES_MEME.avecSaVoixCourt}` };
}
/** 🎙️ Ce que la transcription de sa voix devient : le texte du mème (120 signes au plus, coupé proprement). */
export function texteTranscrit(t: string): string {
  const net = t.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
  if ([...net].length <= MEME_MAX) return net;
  const coupe = [...net].slice(0, MEME_MAX - 1).join("");
  const espace = coupe.lastIndexOf(" ");
  return `${(espace > MEME_MAX / 2 ? coupe.slice(0, espace) : coupe).trim()}…`;
}

/**
 * 🎬 UN DUO DE MÈMES (« Je le range ? ») : ses deux derniers messages sont deux mèmes, l'un de chacun, à moins de
 * 30 minutes l'un de l'autre ; proposé pendant 2 heures après le second.
 */
export const DUO_MS = 30 * 60_000;
export const DUO_PROPOSE_MS = 2 * 3600_000;
type MemeDuFil = { id: string; moi: boolean; le: string; genre?: string };
/** Le duo à ranger : ses deux derniers messages (déjà partis), s'ils en font un ; sinon `null`. */
export function duoDuFil<M extends MemeDuFil>(messages: readonly M[], maintenant: number): [M, M] | null {
  const vrais = messages.filter((m) => !m.id.startsWith("envoi-"));
  const [a, b] = vrais.slice(-2);
  if (!a || !b || a.genre !== "meme" || b.genre !== "meme" || a.moi === b.moi) return null;
  const ta = Date.parse(a.le);
  const tb = Date.parse(b.le);
  if (!Number.isFinite(ta) || !Number.isFinite(tb) || Math.abs(tb - ta) > DUO_MS || maintenant - tb > DUO_PROPOSE_MS) return null;
  return [a, b];
}
/** Le titre d'un duo rangé (28 signes au plus) : le début du premier mème. */
export function titreDuDuo(texte: string): string {
  const t = texte.replace(/\s+/g, " ").trim();
  if (!t) return "Un duo de mèmes";
  return [...t].length <= 28 ? t : `${[...t].slice(0, 27).join("").trim()}…`;
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
  // 🎙️ Ma voix
  maVoix: "Ma voix",
  direAvecVoix: "🎙️ Le dire avec ma voix",
  gardeAppuye: "Garde le micro appuyé et dis-le (20 secondes au plus).",
  taVoix: (duree: string) => `🎙️ Ta voix · ${duree}`,
  ecouter: "▶ Écouter",
  effacerVoix: "Effacer ta voix",
  voixCourte: "Garde le micro appuyé pendant que tu parles.",
  voixPasPartie: "Ta voix n’est pas partie : redis-le (20 secondes au plus).",
  texteFacultatif: "Avec ta voix, le texte est facultatif : ce que tu dis s’écrira tout seul.",
  avecSaVoix: "Un mème, avec sa voix",
  avecSaVoixCourt: "Avec sa voix",
  avecTaVoix: "Un mème, avec ta voix",
  // 🎬 le duo rangé
  duoQuestion: "🎬 Je le range dans « Nos fous rires » ?",
  duoOui: "🎬 Oui",
  duoNon: "Non",
  duoRange: "🎬 Rangé dans « Nos fous rires »",
  duoPasRange: "Pas rangé : réessaie.",
  leRevoir: "▶ Le revoir",
} as const;
