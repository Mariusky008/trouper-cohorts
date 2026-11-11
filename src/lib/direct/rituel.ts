/**
 * ☀️ LE RITUEL DU JOUR — lot R1 (le propriétaire, 11 novembre 2026 : « avant toute conversation ou en début de journée,
 * chaque utilisateur donne son état d'esprit du jour en choisissant rapidement un de ses visages ; les autres figurines
 * disent un mot sur cette humeur, elles-mêmes, sans que leurs propriétaires aient à le faire »).
 *
 * L'HUMEUR DU JOUR : un de ses visages, choisi d'un toucher à la première ouverture du jour (« Passer » est possible).
 * Ses proches la voient (sa figurine la porte chez eux) ; elle s'efface à minuit (l'heure de Paris).
 *
 * LES MOTS DES FIGURINES : les figurines de trois de ses proches au plus (ceux à qui il parle le plus) lui laissent
 * chacune un mot sur cette humeur, écrit par l'IA dans la façon de parler de chaque figurine — sur l'humeur, et rien
 * d'autre. Toujours présenté comme écrit par la figurine (IA), jamais comme les mots de son propriétaire, qui voit ce
 * que sa figurine a dit en son nom, peut l'effacer, et peut couper « Ma figurine parle pour moi ».
 *
 * Voir `docs/univers/feuille-de-route.md` (lot R) et `docs/figurines.md` (9.0). Ce fichier est partagé (page et serveur).
 */
import { SENTIMENTS, type Sentiment } from "./ma-figurine";

/** Les humeurs qu'on peut choisir : ses visages, et « la tête dans les mains ». Les plus gaies d'abord. */
export const HUMEURS: readonly Sentiment[] = ["joie", "rire", "euphorie", "amour", "grimace", "tete", "tristesse", "colere"];
export const humeurValide = (x: unknown): Sentiment | null => (typeof x === "string" && (HUMEURS as readonly string[]).includes(x) ? (x as Sentiment) : null);
/** Les humeurs qui appellent un mot doux, jamais une blague. */
export const HUMEURS_DOUCES: readonly Sentiment[] = ["tristesse", "colere", "tete"];

/** Ce qu'on dit de son humeur, à l'écran (« Ton humeur : Fou rire »). */
export const humeurDe = (h: Sentiment | null | undefined) => SENTIMENTS.find((x) => x.cle === h) ?? null;

/** Les figurines qui lui laissent un mot (ses proches à qui il parle le plus). */
export const MOTS_PAR_HUMEUR = 3;
/** Les humeurs qui font écrire les figurines, par jour (au-delà, l'humeur change sans nouveaux mots). */
export const HUMEURS_ECRITES_PAR_JOUR = 3;
/** La longueur d'un mot. */
export const MOT_MAX = 140;

/** Qui : une figurine (sa clé de profil, jamais son identifiant). */
export type QuiRituel = { cle: string; prenom: string; image: string };
/** Un mot reçu : la figurine d'un proche, sur son humeur du jour. */
export type MotRecu = { id: string; de: QuiRituel; texte: string; le: string; humeur: Sentiment };
/** Un mot que SA figurine a écrit en son nom, à un proche. */
export type MotEcrit = { id: string; pour: QuiRituel; texte: string; le: string; humeur: Sentiment };
/**
 * 🌙 LE MOT DE LA FIN (lot R2) : hier, deux proches se sont parlé (chacun au moins un message) ; ce matin, leurs deux
 * figurines se laissent une réplique chacune, tirée de ce qu'ils se sont dit ce jour-là, qui finit sur une relance.
 * `mots` : dans l'ordre (la figurine de celui qui a parlé le premier commence) ; `moi` : la mienne.
 */
export type FinVue = { cle: string; jour: string; lui: QuiRituel; moi: QuiRituel; mots: { moi: boolean; texte: string }[] };
/** La longueur d'une réplique du mot de la fin. */
export const FIN_MAX = 120;

/**
 * Tout le rituel du jour, pour sa page. `attente` : les figurines sont en train d'écrire. `parle` : « Ma figurine parle
 * pour moi ». `fins` : les mots de la fin de cette nuit (d'hier) ; `finsAttente` : elles les écrivent.
 */
export type EtatRituel = {
  jour: string;
  humeur: Sentiment | null;
  mots: MotRecu[];
  ecrits: MotEcrit[];
  attente: boolean;
  parle: boolean;
  proches: number;
  fins: FinVue[];
  finsAttente: boolean;
};
/** Le rituel avec un proche, en haut de leur conversation (et leur mot de la fin de cette nuit). */
export type RituelAvec = { jour: string; sienne: Sentiment | null; mienne: Sentiment | null; pourLui: MotEcrit | null; pourMoi: MotRecu | null; fin: FinVue | null };

/** Un mot relu : une ou deux phrases, sans retour à la ligne, coupé proprement. */
export function motPropre(x: unknown, max = MOT_MAX): string {
  const t = (typeof x === "string" ? x : "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^["«»“”\s]+|["«»“”\s]+$/g, "")
    .trim()
    // (l'espace fine insécable avant « ? ! : ; » : le signe ne part jamais seul à la ligne)
    .replace(/\s*([?!:;]+)/g, "\u202f$1")
    .replace(/^\u202f/, "");
  if (t.length <= max) return t;
  const coupe = t.slice(0, max);
  const fin = Math.max(coupe.lastIndexOf(". "), coupe.lastIndexOf("! "), coupe.lastIndexOf("? "));
  return fin > 40 ? coupe.slice(0, fin + 1).trim() : `${coupe.slice(0, coupe.lastIndexOf(" ")).trim()}…`;
}

/**
 * LES MOTS DE SECOURS (sans IA, ou quand elle se trompe) : quelques-uns par humeur, qui finissent sur une relance.
 * Aucun accord au féminin ou au masculin (on ne devine jamais le genre), aucune taquinerie amoureuse, aucun conseil.
 */
export const MOTS_DE_SECOURS: Record<Sentiment, readonly string[]> = {
  joie: ["Cette bonne humeur se voit d’ici ☀️ Qu’est-ce qui se passe de beau ?", "Ça rayonne aujourd’hui ! Raconte, je prends ma part 😄", "Belle journée en vue, on dirait. C’est quoi le secret ?"],
  rire: ["Ce fou rire, je veux savoir d’où il vient 😂 Raconte !", "Tu ris déjà ? Partage, je m’ennuie ici 😂", "Quelque chose t’a fait rire, ça se voit. Envoie la blague !"],
  euphorie: ["Oh là, ça pétille aujourd’hui 🤩 C’est quoi la grande nouvelle ?", "Cette énergie ! Tu as gagné quoi ce matin ?", "Je sens une très bonne nouvelle dans l’air. Dis-moi tout 🤩"],
  amour: ["Des cœurs plein les yeux aujourd’hui 😍 Ça fait plaisir à voir. Raconte !", "Journée tendresse, on dirait ! Qu’est-ce qui te met dans cet état ?", "Ça déborde de douceur aujourd’hui. Tu m’en gardes un peu ? 😍"],
  grimace: ["Cette grimace ! 😜 Tu prépares un mauvais coup ?", "Toi, tu as une idée derrière la tête. Je veux savoir 😜", "Grimace du jour validée. C’est pour qui ?"],
  tete: ["Journée « oh non », on dirait. Je suis là si tu veux vider ton sac.", "Ça commence fort… Raconte-moi, ça ira mieux après 🤍", "Tête dans les mains ? Je t’envoie du courage. Qu’est-ce qui se passe ?"],
  tristesse: ["Un petit coup de gris aujourd’hui… Je pense à toi. Tu veux en parler ? 🤍", "Je t’envoie une grosse dose de douceur. Je suis là si tu veux.", "Les jours gris passent aussi. Je suis là, tu me racontes ?"],
  colere: ["Ça bout là-dedans 😠 Raconte-moi, je t’écoute.", "Grosse colère ? Vide ton sac, je suis là.", "Respire… et raconte-moi ce qui se passe. Je suis là."],
  // (les attitudes, au cas où : elles ne se choisissent pas comme humeur)
  endouce: ["Tu ris en douce ? Je veux savoir pourquoi 🤭"],
  bras: ["Bras croisés aujourd’hui ? Raconte-moi."],
  victoire: ["Victoire ! Tu as gagné quoi ? 🙌"],
  chut: ["Un secret ? Je sais garder les secrets 🤫"],
  coeur: ["Plein de cœur aujourd’hui 🫶 Raconte !"],
};

/** Un mot de secours, différent pour chaque figurine du jour (`rang` : la place de la figurine). */
export function motDeSecours(humeur: Sentiment, graine: string, rang: number): string {
  const l = MOTS_DE_SECOURS[humeur] ?? MOTS_DE_SECOURS.joie;
  let n = 0;
  for (const c of graine) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  return motPropre(l[(n + rang) % l.length]);
}
