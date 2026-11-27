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
 * ses passions (frapper, faire coucou), et la surprise d'une visite. 🎬 Le lot F3 (25 novembre 2026) : les séances en
 * cours chez ses proches (« Léa et Sam regardent ensemble », « Demander à les rejoindre ») ; et, quand sa figurine entre
 * dans un salon, ceux qui y sont lui font signe d'un toucher. 🧭 Le lot F4 : l'ordre du fil (`ordreDuFil`).
 */
import type { IdTheme } from "./decouvrir";
import type { PropositionGroupe } from "./groupes";
import type { Ornements } from "./ornements";
import type { PlaceGradin } from "./salons-gradins";
import type { FigurinePosee } from "./autour";
import type { Zone } from "./pieces-duo";
import type { InfosVideo } from "./salons-ouverts";

/** Une figurine telle que le fil la montre : assise (son corps sans sa tête, la tête qu'elle fait), sinon d'une image. */
/** (✨ « Ma figurine » : `pancarte`, la phrase qu'elle porte partout) */
export type SilhouetteFil = { tete: string; corps?: { src: string; ratio: number; boite: Zone }; image?: string; /** 🗣️ sa tête la bouche ouverte (si elle est prête) : sa bouche suit son bonjour (`useBoucheDuBonjour`) */ parle?: string; pancarte?: string; ornements?: Ornements };

/** Quelqu'un qui est dans un salon, en ce moment (jamais son compte : son identifiant court). */
export type PresentFil = { q: string; prenom: string; src: string; place: number; /** 🎙️ son bonjour (lot 4 de « Ma figurine ») */ bonjour?: string };
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
  /** ce qui passe à sa télé ; sa chaîne, ses vues YouTube, sa mise en ligne (montrées sous la télé) */
  video: InfosVideo | null;
  /** 🧭 (lot F4) ses proches qui y sont en ce moment (leur prénom) : le salon vient en premier dans son fil */
  proches?: string[];
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
  passion: { e: string; nom: string; court: string; /** (« Quoi de neuf ? ») son salon : `/univers/salons?theme=<id>` */ id?: IdTheme };
  /** 👋 son coucou : envoyé, ou la personne a répondu (jamais une fausse réponse : c'est la sienne) */
  coucou?: "envoye" | "repondu";
  /** 🎙️ son bonjour (lot 4 de « Ma figurine ») */
  bonjour?: string;
};
/**
 * 🎬 (lot F3) Une séance en cours chez un proche (il n'y est pas) : ceux qui y sont (l'hôte d'abord), ce qui passe à sa
 * télé, sa pièce. Déjà invité : il s'assoit ; sinon il demande à les rejoindre, et seul l'hôte ouvre la porte.
 */
export type SeanceFil = {
  sorte: "seance";
  /** la clé de l'hôte (`/univers/salons?chez=<clé>`) */
  cle: string;
  /** le prénom de l'hôte */
  hote: string;
  hoteLa: boolean;
  presents: PresentFil[];
  video: { id: string; titre: string } | null;
  /** la vignette de sa pièce */
  image?: string;
  /** invité (une invitation de moins de six heures) : sa place l'attend */
  invite?: true;
  /** sa demande est partie (moins d'une heure) : on attend l'hôte */
  demande?: true;
};
/**
 * 📣 (Mes groupes, lot G2, 26 novembre 2026) « On se retrouve ? » : de temps en temps, une proposition ouverte à tout le
 * monde, d'un autre, où il reste une place — ses passions d'abord. Une seule par fil.
 */
export type RdvFil = { sorte: "rdv"; proposition: PropositionGroupe };
export type PieceFil = SalonFil | AutourFil | HumeurFil | MaisonFil | SeanceFil | RdvFil;

/**
 * ☀️ « QUOI DE NEUF ? » (26 novembre 2026, la maquette validée par le propriétaire ; `docs/univers/fil.md`) : la rangée
 * en haut de Découvrir, comme les stories de Facebook. D'abord la sienne (son humeur du jour, ou « ＋ » pour la dire),
 * puis l'humeur du jour de ses proches (leur figurine qui en fait la tête) ; sans proche qui l'a dite, des gens qui
 * partagent une de ses passions et ont ouvert leur maison (lot F2). Toucher une carte : sa figurine du jour en grand, et
 * on y réagit avec SA figurine (pour de vrai : un geste dans leur conversation, un coucou dans sa maison).
 */
export type QuoiDeNeufFil = { mienne: { emoji: string; nom: string } | null; proches: ProcheHumeurFil[]; decouvrir: MaisonFil[] };
/** Combien de cartes au plus dans « Quoi de neuf ? » (après la sienne). */
export const QUOI_DE_NEUF_MAX = 12;

export type FilVue = {
  /** ☀️ « Quoi de neuf ? », en haut (sans rien à y montrer, il n'est pas là) */
  quoiDeNeuf?: QuoiDeNeufFil;
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
 * 🧭 L'ORDRE DU FIL (le lot F4, 25 novembre 2026 ; `docs/univers/fil.md`, section 7). Les groupes arrivent dans l'ordre
 * voulu par le propriétaire : d'abord ses proches en direct (leurs séances, les salons où ils sont), l'humeur de ses
 * proches, puis ses passions, puis les maisons, puis Autour, puis les autres salons où il y a quelqu'un, et enfin les
 * salons sans personne. « Rien ne revient deux fois de suite » : à chaque pas, la première pièce (dans cet ordre) d'une
 * autre sorte que la précédente ; s'il n'en reste que de la même sorte, la suivante.
 */
export function ordreDuFil(groupes: PieceFil[][], max = PIECES_MAX): PieceFil[] {
  const reste = groupes.flat();
  const fil: PieceFil[] = [];
  while (fil.length < max && reste.length) {
    const avant = fil[fil.length - 1];
    const k = avant ? reste.findIndex((p) => p.sorte !== avant.sorte) : 0;
    fil.push(reste.splice(Math.max(0, k), 1)[0]);
  }
  return fil;
}

/** La réaction de sa figurine quand il touche deux fois : 😂 dans un salon, 💃 dans celui de la musique, 👋 dans une maison ou chez un proche. */
export const reactionDuFil = (p: PieceFil): { cle: string; e: string } =>
  p.sorte === "salon" && p.theme === "musique" ? { cle: "danse", e: "💃" } : p.sorte === "salon" ? { cle: "rire", e: "😂" } : p.sorte === "maison" || p.sorte === "seance" ? { cle: "coucou", e: "👋" } : { cle: "coeur", e: "❤️" };

/** 🎬 (lot F3) Le titre d'une séance : « Léa et Sam regardent ensemble », « Léa regarde sa télé », « Sam regarde chez Léa ». */
export function titreDeSeance(p: Pick<SeanceFil, "hote" | "hoteLa" | "presents">): string {
  const prenoms = p.presents.map((x) => x.prenom);
  if (prenoms.length > 1) return `${listePrenoms(prenoms)} regardent ensemble`;
  return p.hoteLa ? `${p.hote} regarde sa télé` : `${prenoms[0] ?? "Quelqu’un"} regarde chez ${p.hote}`;
}

/** « Sam », « Sam et Léa », « Sam, Léa et Hugo ». */
export const listePrenoms = (l: string[]) => (l.length > 1 ? `${l.slice(0, -1).join(", ")} et ${l[l.length - 1]}` : (l[0] ?? ""));

export const PHRASES_FIL = {
  indice: "Glisse : de pièce en pièce, de salon en salon",
  indiceDouble: "Touche deux fois : ta figurine réagit, et on la voit",
  retourFil: "‹ Le fil",
  enDirect: (n: number) => `${n} en direct`,
  tesPassions: "ta passion",
  places: (libres: number) => (libres > 0 ? `${libres} place${libres > 1 ? "s" : ""} libre${libres > 1 ? "s" : ""}` : "complet pour l’instant"),
  asseoir: "M’asseoir",
  // 🪑 (25 novembre 2026, la pièce du salon refaite : la télé, les fauteuils, ta place)
  taPlace: "Ta place",
  asseoirIci: "M’asseoir à ma place",
  toi: "Toi",
  inviter: "Inviter",
  invitationSalon: (nom: string) => `Viens t’asseoir avec moi dans ${String(nom).replace(/^(Le|La|Les) /, (m) => m.toLowerCase())}, sur ClikMe 🛋️`,
  lienCopie: "Lien copié : envoie-le à qui tu veux",
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
  // 🎬 (lot F3) mes proches en direct
  seanceEtiquette: (hote: string) => `Chez ${hote}, en direct`,
  // 📣 (Mes groupes, lot G2) « On se retrouve ? »
  rdvEtiquette: "📣 On se retrouve ?",
  rdvSous: (prenom: string) => `${prenom} propose de se retrouver : il reste de la place.`,
  rdvVoir: "Voir dans Mes groupes",
  seanceSous: (hote: string) => `Demande à les rejoindre : ${hote} te fait entrer d’un toucher.`,
  seanceInvite: "Tu es invité : ta place t’attend.",
  seanceDemande: (hote: string) => `🙋 Demande envoyée à ${hote}. Tu es prévenu dès qu’on t’ouvre.`,
  rejoindre: (n: number, prenom: string) => (n > 1 ? "🙋 Demander à les rejoindre" : `🙋 Demander à rejoindre ${prenom}`),
  asseoirAvecEux: (n: number) => (n > 1 ? "🛋️ M’asseoir avec eux" : "🛋️ M’asseoir à côté"),
  demandeEnvoyee: "🙋 Demande envoyée",
  seanceFinie: "La séance vient de finir.",
  rejoindreNotif: (prenom: string) => `🙋 ${prenom} aimerait vous rejoindre`,
  rejoindreNotifCorps: "Fais-lui une place d’un toucher, depuis ta télé.",
  // 👋 (lot F3) faire signe à celui qui arrive
  teFaitSigne: (prenom: string) => `👋 ${prenom} te fait signe`,
  // 🧭 (lot F4) ses proches dans un salon ouvert
  prochesLa: (prenoms: string[]) => `👋 ${listePrenoms(prenoms)} ${prenoms.length > 1 ? "sont là" : "est là"}`,
} as const;
