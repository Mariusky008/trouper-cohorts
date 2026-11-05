/**
 * 💬 LA RENCONTRE DU JOUR — 4 novembre 2026, l'idée du propriétaire : « chaque jour sa figurine est présentée à une autre
 * figurine, et les deux ont une discussion en fonction des traits de leur personnalité… on peut commenter les phrases
 * en disant si on aurait dit ça ou pas, en y mettant des émotions, ce qui permet petit à petit d'avoir des
 * renseignements de plus en plus précis sur la personnalité ». Ses décisions :
 *   · AVEC QUI : un ami qu'il a invité par WhatsApp, dès qu'il a fait sa carte (« la prochaine conversation sera entre
 *     eux deux ») ; sinon la figurine d'un commerce ClikMe de sa ville ;
 *   · À LIRE seulement, pour le moment (pas de voix) ;
 *   · « RENCONTRER UN MEMBRE » (5 novembre 2026) : s'il n'invite personne, un bouton à compte à rebours le présente à un
 *     membre de sa ville qui a fait le même geste (une fois par jour) ; se voir en vrai reste pour plus tard.
 *   · EN DIRECT, ET APRÈS (5 novembre 2026, les mots de Pablito : « pendant quelques minutes, vos deux figurines
 *     discuteront, réagiront et s'amuseront ensemble, tu seras juste spectateur. Et à la fin, tu pourras découvrir ce
 *     qui a été partagé et, si vous êtes d'accord, échanger vos impressions. À chaque rencontre, une carte souvenir est
 *     créée ») : une conversation plus longue, où chaque réplique a son geste (elle rit, danse, fait une grimace…),
 *     qui se joue en deux minutes environ ; puis « ce qui a été partagé » (`partage`), la carte souvenir (`titre`) et,
 *     entre deux clients qui le veulent tous les deux, leurs impressions (`echange`).
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

export const REPLIQUES_MIN = 8;
export const REPLIQUES_MAX = 14;
export const REPLIQUE_MAX = 160;

/** 🎭 CE QUE FAIT UNE FIGURINE EN DISANT SA RÉPLIQUE (la rencontre se joue en direct). */
export const GESTES = [
  { cle: "rit", emoji: "😂", dit: "éclate de rire" },
  { cle: "danse", emoji: "🕺", dit: "danse" },
  { cle: "grimace", emoji: "😜", dit: "fait une grimace" },
  { cle: "surprise", emoji: "😮", dit: "sursaute" },
  { cle: "clin", emoji: "😉", dit: "fait un clin d’œil" },
  { cle: "touchee", emoji: "🥰", dit: "est touchée" },
  { cle: "applaudit", emoji: "👏", dit: "applaudit" },
  { cle: "reflechit", emoji: "🤔", dit: "réfléchit" },
] as const;
export type Geste = (typeof GESTES)[number]["cle"];
export const gesteValide = (x: unknown): Geste | null => (GESTES.some((g) => g.cle === x) ? (x as Geste) : null);
export const gesteDe = (x: unknown) => GESTES.find((g) => g.cle === x) ?? null;

/** Le temps d'une réplique, en direct (millisecondes) : on la lit à son rythme — deux minutes environ pour toutes. */
export const dureeReplique = (texte: string) => 2200 + Math.min(REPLIQUE_MAX, texte.length) * 60;

/** La carte souvenir : son titre ; et ce qui a été partagé (trois points au plus). */
export const TITRE_MAX = 48;
export const PARTAGE_MAX = 3;
export const PARTAGE_LONGUEUR = 140;

/**
 * 💬 LEURS IMPRESSIONS — entre deux clients seulement, si les DEUX ont dit oui ; chacun en écrit 20 au plus, de 280
 * caractères. On se parle ici, pas ailleurs (pour le moment) : pas de numéro, d'adresse e-mail ni de lien.
 */
export const IMPRESSION_MAX = 280;
export const IMPRESSIONS_MAX = 20;
export function impressionRefusee(texte: string): string | null {
  if (!texte) return "Écris d’abord ton impression.";
  if (texte.length > IMPRESSION_MAX) return `${IMPRESSION_MAX} caractères au plus.`;
  if (/https?:|www\.|\.(?:com|fr|net|org|io|me)\b/i.test(texte)) return "Pas de lien ici : on se parle sur ClikMe.";
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(texte)) return "Pas d’adresse e-mail ici : on se parle sur ClikMe.";
  if ((texte.match(/\d/g) ?? []).length >= 8) return "Pas de numéro ici : on se parle sur ClikMe.";
  if (/\b(?:insta(?:gram)?|snap(?:chat)?|whats ?app|telegram|tiktok|facebook|messenger)\b/i.test(texte)) return "On se parle ici, pas ailleurs (pour le moment).";
  return null;
}

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

/** Leurs impressions : qui a dit oui, et ce qu'ils se sont écrit (`moi` : c'est lui qui l'a écrit). */
export type EchangeVue = { moi: boolean; autre: boolean; messages: { moi: boolean; texte: string; le: string }[] };

/** Ce que voit l'un des deux : « moi » (sa figurine) et « l'autre ». */
export type RencontreVue = {
  id: string;
  jour: string;
  moi: Participant;
  autre: Participant;
  /** `moi` : une phrase de sa figurine (il peut dire si c'est lui) ; `geste` : ce qu'elle fait en la disant. */
  repliques: { moi: boolean; texte: string; geste?: Geste }[];
  /** La carte souvenir : son titre (« Le duel des desserts »). */
  titre?: string;
  /** Ce qui a été partagé (points communs, défi lancé, découverte). */
  partage?: string[];
  /** Entre deux clients : échanger leurs impressions, s'ils le veulent tous les deux. */
  echange?: EchangeVue;
  /** Ses réactions, par numéro de phrase. */
  reactions: Record<number, Reaction>;
  /** Écrite par l'IA, ou composée ici (sans IA). */
  par: "ia" | "local";
  /** Une rencontre avec un membre de sa ville, qu'il ne connaissait pas (« Rencontrer un membre »). */
  membre?: boolean;
};

/** 🎞️ UNE CARTE SOUVENIR (une rencontre) : la date, avec qui, son titre, la figurine de l'autre. */
export type Souvenir = { id: string; jour: string; avec: string; titre: string; image: string; figurine: boolean };

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
