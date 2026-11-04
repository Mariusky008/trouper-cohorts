/**
 * 💬 LA RENCONTRE DU JOUR — 4 novembre 2026, l'idée du propriétaire : « chaque jour sa figurine est présentée à une autre
 * figurine, et les deux ont une discussion en fonction des traits de leur personnalité… on peut commenter les phrases
 * en disant si on aurait dit ça ou pas, en y mettant des émotions, ce qui permet petit à petit d'avoir des
 * renseignements de plus en plus précis sur la personnalité ». Ses décisions :
 *   · AVEC QUI : un ami qu'il a invité par WhatsApp, dès qu'il a fait sa carte (« la prochaine conversation sera entre
 *     eux deux ») ; sinon la figurine d'un commerce ClikMe de sa ville ;
 *   · À LIRE seulement, pour le moment (pas de voix) ;
 *   · SE RENCONTRER : une option possible plus tard (entre clients qui ne se connaissent pas, avec l'accord des deux) —
 *     pas encore construite.
 *
 * LA CONVERSATION est écrite par l'IA d'après les deux cartes (sa façon de parler, ce qu'il aime, sa phrase fétiche),
 * et d'après SES RÉACTIONS aux conversations d'avant : « c'est tout moi » / « jamais de la vie » sur les phrases de sa
 * figurine — c'est ce qui la fait lui ressembler de plus en plus (sa « ressemblance », en pourcentage).
 *
 * BIENVEILLANTE, TOUJOURS : rien de sensible, rien sur où il est allé et quand ; la figurine d'un commerce ne promet
 * rien (ni prix, ni offre, ni horaire) — ce n'est pas le commerçant qui parle. « Écrit par l'IA, pour jouer. »
 *
 * FICHIER PARTAGÉ (navigateur et serveur).
 */

export const REPLIQUES_MIN = 4;
export const REPLIQUES_MAX = 8;
export const REPLIQUE_MAX = 160;

/** Sur une phrase de SA figurine : il se reconnaît, ou pas (ça affine la suite). */
export const VERDICTS = [
  { cle: "moi", emoji: "✅", dit: "C’est tout moi" },
  { cle: "pas", emoji: "🙅", dit: "Jamais de la vie" },
] as const;
export type Verdict = (typeof VERDICTS)[number]["cle"];
/** Et ce que la phrase lui fait (sur n'importe quelle phrase). */
export const EMOTIONS = ["😂", "❤️", "😮", "😬"] as const;
export type Emotion = (typeof EMOTIONS)[number];

export type Participant =
  | { type: "client"; prenom: string; titre: string; image: string; figurine: boolean }
  | { type: "commerce"; nom: string; slug: string; ville: string; image: string };

export type Reaction = { v?: Verdict; e?: Emotion };

/** Ce que voit l'un des deux : « moi » (sa figurine) et « l'autre ». */
export type RencontreVue = {
  id: string;
  jour: string;
  moi: Participant;
  autre: Participant;
  /** `moi` : une phrase de sa figurine (il peut dire si c'est lui). */
  repliques: { moi: boolean; texte: string }[];
  /** Ses réactions, par numéro de phrase. */
  reactions: Record<number, Reaction>;
  /** Écrite par l'IA, ou composée ici (sans IA). */
  par: "ia" | "local";
};

export const verdictValide = (x: unknown): Verdict | null => (VERDICTS.some((v) => v.cle === x) ? (x as Verdict) : null);
export const emotionValide = (x: unknown): Emotion | null => (EMOTIONS.includes(x as Emotion) ? (x as Emotion) : null);
export const idRencontreValide = (id: string) => /^[a-z0-9]{12}$/.test(id);
export const codeInvitationValide = (c: string) => /^[a-z0-9]{10}$/.test(c);

/** Sa ressemblance : la part des phrases où il s'est reconnu (`null` : pas encore assez de réactions). */
export const ressemblance = (moi: number, pas: number): number | null => (moi + pas >= 3 ? Math.round((100 * moi) / (moi + pas)) : null);

/** Le texte de l'invitation (WhatsApp). */
export const texteInvitation = (prenom: string) =>
  `${prenom ? `${prenom} t’invite` : "Je t’invite"} sur ClikMe : crée ta figurine qui parle (c’est gratuit), et demain nos deux figurines discutent ensemble 😄`;
export const lienInvitation = (code: string) => `/collection?ami=${code}`;
