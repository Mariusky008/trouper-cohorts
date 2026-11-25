/**
 * 🎞️ DÉCOUVRIR, LE FIL « DE PIÈCE EN PIÈCE » (le lot F1, 23 novembre 2026 ; `docs/univers/fil.md`) — partagé entre le
 * serveur et l'écran.
 *
 * Le propriétaire, après trente minutes sur l'appli : « je n'ai pas ce sentiment de simplicité d'utilisation qui fait que
 * dès la première seconde on sait quoi faire, et qu'après quelques secondes on ne veut plus en partir ». Puis, sur la
 * première maquette (un fil de vidéos) : « c'est exactement la même chose que TikTok […] la différence pour nous, c'est
 * que je vois quelque chose avec d'autres personnes, je vois leur réaction, je peux découvrir leur maison ».
 *
 * D'où le fil : on ne fait pas défiler des vidéos, on passe DE PIÈCE EN PIÈCE, et on y voit des gens. Un seul geste
 * (glisser vers le haut) ; sa figurine est au bord de la pièce ; toucher deux fois : elle y réagit pour de vrai (dans un
 * salon, ceux qui sont là la voient). Chaque bouton ouvre ce qui existe déjà.
 *
 * Les pièces du lot F1 : les salons où il y a quelqu'un en ce moment, le salon de la musique, les figurines posées dans
 * Autour, l'humeur de ses proches ; puis (le propriétaire, le même jour : « on ne me propose pas de salon, même s'il est
 * vide ? ») tous les autres salons, sans personne en ce moment, avec ce qui s'y est dit aujourd'hui — sans avoir à passer
 * par « Tous les salons ». 🏡 Le lot F2 (25 novembre 2026) : les maisons ouvertes de ceux de son âge qui partagent une de
 * ses passions (frapper, faire coucou), et la surprise d'une visite. Les séances entre proches en cours (F3) et l'ordre
 * fin (F4) viendront après.
 */
import type { IdTheme } from "./decouvrir";
import type { PlaceGradin } from "./salons-gradins";
import type { FigurinePosee } from "./autour";
import type { Zone } from "./pieces-duo";

/** Une figurine telle que le fil la montre : assise (son corps sans sa tête, la tête qu'elle fait), sinon d'une image. */
export type SilhouetteFil = { tete: string; corps?: { src: string; ratio: number; boite: Zone }; image?: string };

/** Quelqu'un qui est dans un salon, en ce moment (jamais son compte : son identifiant court). */
export type PresentFil = { q: string; prenom: string; src: string; place: number };
/** Une bulle qui vient d'être dite dans le salon (un texte, une réaction, un geste). */
export type BulleFil = { id: string; q: string; prenom: string; texte: string; le: number };

/**
 * 🛋️ Un salon : le plus rempli de son thème, s'il y a quelqu'un ; sinon (`presents` vide) son premier salon, avec ce qui
 * s'y est dit aujourd'hui (`traces`). Jamais une fausse présence : on ne montre assis que ceux qui y sont.
 */
export type SalonFil = {
  sorte: "salon";
  id: string;
  theme: IdTheme;
  e: string;
  nom: string;
  /** une de ses passions */
  mien: boolean;
  presents: PresentFil[];
  bulles: BulleFil[];
  /** 🪑 personne en ce moment : les dernières bulles de la journée (qui, quoi, quand) */
  traces?: BulleFil[];
  /** son gradin validé (l'image carrée, ses places) ; sinon le plan des places sur un fond sombre */
  gradin: { src: string; flou: string; places: PlaceGradin[] } | null;
  /** ce qui passe à sa télé, à la même seconde pour tous */
  video: { id: string; titre: string } | null;
  /** 🎵 le salon de la musique : le morceau proposé qui passe, et qui l'a choisi (sans : la radio du salon) */
  morceau?: { titre: string; prenom: string } | null;
};
/** 📍 Une figurine posée dans Autour, avec son mot du jour. */
export type AutourFil = { sorte: "autour"; lieu: string; nomLieu: string; figurine: FigurinePosee };
/** ☀️ L'humeur du jour de ses proches (ceux qui l'ont dite aujourd'hui). */
export type ProcheHumeurFil = { cle: string; prenom: string; humeur: string; emoji: string; nom: string; doux: boolean; figurine: SilhouetteFil };
export type HumeurFil = { sorte: "humeur"; proches: ProcheHumeurFil[] };
/**
 * 🏡 (lot F2) La maison ouverte de quelqu'un de son âge qui partage une de ses passions : sa pièce, sa figurine, la
 * passion en commun ; « 🚪 Frapper à sa porte » (la visite), « 👋 Lui faire coucou ».
 */
export type MaisonFil = {
  sorte: "maison";
  cle: string;
  prenom: string;
  /** la vignette de sa pièce */
  image: string;
  figurine: SilhouetteFil;
  passion: { e: string; nom: string; court: string };
  /** 👋 son coucou : envoyé, ou la personne a répondu (jamais une fausse réponse : c'est la sienne) */
  coucou?: "envoye" | "repondu";
};
export type PieceFil = SalonFil | AutourFil | HumeurFil | MaisonFil;

export type FilVue = {
  moi: { prenom: string; figurine: SilhouetteFil | null };
  /** les salons ont besoin de savoir s'il a 18 ans ou plus (les 15-17 ans ont les leurs) */
  age?: true;
  pieces: PieceFil[];
  /** 🎬 ce qui l'attend ailleurs : la première invitation devant la télé d'un proche, les demandes de proche reçues */
  invitation?: { cle: string; prenom: string };
  demandes?: number;
  /** 🎁🚪 (lot F2) la surprise d'une visite qui l'attend dans « Messages » : un cadeau, ou quelqu'un qui a frappé */
  surprise?: { genre: "cadeau" | "toc"; prenom: string };
};

/** Combien de pièces au plus (le fil se recharge en revenant). */
export const PIECES_MAX = 16;
/** Les bulles d'un salon qu'on montre : celles des dix dernières minutes. */
export const BULLES_FRAICHES_MS = 10 * 60_000;
/** Dans un salon où il n'y a personne : ce qui s'y est dit dans la journée (les dernières 24 h). */
export const TRACES_MS = 24 * 3600_000;

/**
 * L'ordre du fil (F1, simple ; le lot F4 l'affinera) : les salons de ses passions, l'humeur de ses proches, Autour, les
 * autres salons — un de chaque à tour de rôle, pour que deux pièces de la même sorte ne se suivent pas quand il y en a
 * d'autres.
 */
export function ordreDuFil(groupes: PieceFil[][], max = PIECES_MAX): PieceFil[] {
  const files = groupes.map((g) => [...g]);
  const fil: PieceFil[] = [];
  while (fil.length < max && files.some((f) => f.length)) {
    for (const f of files) {
      const x = f.shift();
      if (x) fil.push(x);
      if (fil.length >= max) break;
    }
  }
  return fil;
}

/** La réaction de sa figurine quand il touche deux fois : 😂 dans un salon, 💃 dans celui de la musique, 👋 dans une maison. */
export const reactionDuFil = (p: PieceFil): { cle: string; e: string } =>
  p.sorte === "salon" && p.theme === "musique" ? { cle: "danse", e: "💃" } : p.sorte === "salon" ? { cle: "rire", e: "😂" } : p.sorte === "maison" ? { cle: "coucou", e: "👋" } : { cle: "coeur", e: "❤️" };

/** « Sam », « Sam et Léa », « Sam, Léa et Hugo ». */
export const listePrenoms = (l: string[]) => (l.length > 1 ? `${l.slice(0, -1).join(", ")} et ${l[l.length - 1]}` : (l[0] ?? ""));

export const PHRASES_FIL = {
  indice: "Glisse : de pièce en pièce, de salon en salon",
  indiceDouble: "Touche deux fois : ta figurine réagit, et on la voit",
  tousLesSalons: "Tous les salons",
  retourFil: "‹ Le fil",
  enDirect: (n: number) => `${n} en direct`,
  tesPassions: "ta passion",
  places: (libres: number) => (libres > 0 ? `${libres} place${libres > 1 ? "s" : ""} libre${libres > 1 ? "s" : ""}` : "complet pour l’instant"),
  asseoir: "M’asseoir",
  entrerDanser: "Entrer danser",
  radio: "📻 La radio du salon",
  choix: (prenom: string) => `🎵 Le choix de ${prenom}`,
  teVoient: (n: number, prenom?: string) => (n > 1 ? `Les ${n} te voient` : n === 1 ? `${prenom || "Quelqu’un"} te voit` : "Les suivants te verront"),
  soisLePremier: "Sois le premier",
  premier: "Personne pour l’instant. Assieds-toi : les suivants te verront.",
  yEtaient: (prenoms: string[]) => `${listePrenoms(prenoms)} ${prenoms.length > 1 ? "y étaient" : "y était"} aujourd’hui. Assieds-toi : les suivants te verront.`,
  radioTourne: "La radio tourne. Entre danser : les suivants te verront.",
  ilYa: (ms: number) => (ms < 3600_000 ? `il y a ${Math.max(1, Math.round(ms / 60_000))} min` : `il y a ${Math.round(ms / 3600_000)} h`),
  autourEtiquette: (nom: string) => nom,
  autourTitre: (prenom: string) => `${prenom} a posé sa figurine ici`,
  autourSous: (heures: number) => `Elle reste encore ${heures} h.`,
  asseoirACote: "M’asseoir à côté",
  humeurEtiquette: "Tes proches, aujourd’hui",
  humeurTitre: (prenom: string, nom: string) => `${prenom} : ${nom.toLowerCase()}`,
  humeurDouce: "Un mot de toi, et sa journée change.",
  humeurSous: "Ils l’ont dit ce matin. Réponds-leur avec ta figurine.",
  repondre: "Lui répondre",
  repondreA: (prenom: string) => `Répondre à ${prenom}`,
  invitation: (prenom: string) => `🎬 ${prenom} t’invite devant sa télé`,
  demandes: (n: number) => (n > 1 ? `👯 ${n} demandes de proche` : "👯 Une demande de proche"),
  voir: "Voir",
  maisonEtiquette: (e: string, nom: string) => `${e} ${nom}, comme toi`,
  maisonTitre: (prenom: string) => `Chez ${prenom}`,
  maisonSous: (court: string) => `Vous aimez tous les deux : ${court}. Sa pièce est ouverte à ceux qui partagent ses passions.`,
  frapper: "🚪 Frapper à sa porte",
  coucou: "👋 Lui faire coucou",
  coucouEnvoye: (prenom: string) => `👋 Ta figurine est chez ${prenom}`,
  coucouRepondu: (prenom: string) => `👋 ${prenom} t’a répondu !`,
  surpriseCadeau: (prenom: string) => `🎁 ${prenom} t’a laissé un cadeau`,
  surpriseToc: (prenom: string) => `🚪 ${prenom} a frappé à ta porte`,
  age: "Avant d’entrer dans les salons : as-tu 18 ans ou plus ?",
  ageChapo: "Les 15-17 ans ont leurs salons à eux : ils n’y croisent jamais d’adulte.",
  adulte: "J’ai 18 ans ou plus",
  jeune: "J’ai entre 15 et 17 ans",
  videTitre: "Personne en direct pour l’instant",
  videSous: "Pose ta figurine dans Autour, ou entre le premier dans un salon : les suivants te verront.",
  poserAutour: "📍 Poser ma figurine",
  sansFigurine: "Pour réagir, il te faut ta figurine assise dans son fauteuil.",
} as const;
