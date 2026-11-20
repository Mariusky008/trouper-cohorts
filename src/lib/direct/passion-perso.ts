/**
 * ✨ MA PASSION À MOI (`docs/univers/decouvrir.md`, section 23.2 ; le lot D9) — ce qui ne dépend pas de l'écran.
 *
 * Une passion écrite librement (« la pêche à la mouche », « la K-pop », « les trains »), une par personne (décision du
 * propriétaire, 20 novembre 2026), en plus de ses 3 à 5 passions. Relue avant d'être gardée (la relecture des salons
 * ouverts). Ceux qui écrivent la même chose la partagent : « La pêche », « la peche » et « pêche » donnent la même clé —
 * une seule recherche YouTube pour tous.
 *
 * FICHIER PARTAGÉ (l'écran et le serveur).
 */
import { refusDuMessage } from "./salons-ouverts";
import { MOTS_EXCLUS } from "./decouvrir";

export const PASSION_PERSO = {
  min: 3,
  max: 40,
  /** refaite tous les trois jours */
  jours: 3,
  /** les recherches YouTube (100 unités chacune) : 20 la nuit, 10 dans la journée (quand quelqu'un en choisit une) */
  budgetNuit: 20,
  budgetJournee: 10,
  /** ses vidéos : publiées dans les trente derniers jours (une passion rare a peu de vidéos chaque semaine) */
  fraicheurJours: 30,
  videos: 15,
} as const;

/** Sa passion à soi : ce qu'il a écrit, et sa clé (partagée par ceux qui écrivent la même chose). */
export type PassionPerso = { mots: string; cle: string };

const ARTICLES = new Set(["le", "la", "les", "l", "un", "une", "des", "du", "de", "d"]);

/** La clé : minuscules, sans accents, sans « le, la, les, l' » ; ses mots joints par des tirets. `null` : rien à chercher. */
export function clePassion(mots: string): string | null {
  const l = mots
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’'`]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter((m) => m && !ARTICLES.has(m));
  const cle = l.join("-").slice(0, 60);
  return cle.length >= 2 ? cle : null;
}

/** Ce qu'il a écrit, relu : `{ passion }` ou `{ error }` (dit à lui). */
export function passionValide(x: unknown): { passion: PassionPerso } | { error: string } {
  const mots = (typeof x === "string" ? x : "").replace(/\s+/g, " ").trim();
  if ([...mots].length < PASSION_PERSO.min) return { error: `Écris ta passion (${PASSION_PERSO.min} lettres au moins).` };
  if ([...mots].length > PASSION_PERSO.max) return { error: `${PASSION_PERSO.max} lettres au plus.` };
  const cle = clePassion(mots);
  if (!cle || refusDuMessage(mots) || MOTS_EXCLUS.test(mots)) return { error: PHRASES_PASSION_PERSO.refusee };
  return { passion: { mots, cle } };
}

export const PHRASES_PASSION_PERSO = {
  titre: "✨ Ta passion à toi",
  intro: "Elle n’est pas dans la liste ? Écris-la : on te cherche ses vidéos, en plus de tes passions.",
  champ: "La pêche, la K-pop…",
  garder: "Garder",
  changer: "Changer",
  enlever: "Enlever ma passion",
  gardee: (mots: string) => `✨ « ${mots} » : ses vidéos arrivent dans ta télé.`,
  enlevee: "Ta passion à toi est enlevée.",
  refusee: "Choisis une autre passion.",
  retiree: "Cette passion n’est plus cherchée : choisis-en une autre.",
  bientot: "On cherche ses vidéos : elles arrivent bientôt dans ta télé.",
  etiquette: (mots: string) => `✨ ${mots}`,
};
