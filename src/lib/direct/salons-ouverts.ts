/**
 * 🛋️ LES SALONS OUVERTS — les lots D3 et D4 de Découvrir (`docs/univers/decouvrir.md`, sections 5, 6, 13 et 18).
 *
 * Une pièce par passion, ouverte à tous ceux qui l'aiment : on entre, sa figurine (dans son fauteuil) s'assoit sur une
 * place libre ; la télé du salon passe la sélection du jour du thème, à la même seconde pour tous ; on écrit (des
 * bulles), on réagit (😂 ❤️ 😮 😱 👏), on fait un geste à quelqu'un (👋 👏 😂).
 *
 * - **8 places par salon** ; plein, un deuxième s'ouvre (« Le salon du foot · 2 ») ; on entre toujours dans le plus
 *   rempli qui a une place. Présent : vu depuis moins de 2 min 30 (comme le duo).
 * - **Deux maisons de salons** : les adultes, et les 15-17 ans — **ils ne se croisent jamais**. Le salon des jeunes
 *   parents est réservé aux adultes.
 * - **Le prénom et la figurine seulement** : jamais la ville, le nom, ni la maison.
 * - **Ce qui est écrit passe la modération avant d'apparaître** (`refusDuMessage`) : ni lien, ni numéro, ni adresse, ni
 *   réseau social, ni question personnelle, ni gros mot, rien d'alcoolisé ; un message refusé ne part pas, et son
 *   auteur voit pourquoi.
 * - **Pas de vocal, pas de photo** dans un salon ouvert (le propriétaire, 17 novembre 2026).
 * - **La conversation est gardée 48 h** ; « 💬 » la relit.
 * - **« Signaler »** : trois personnes différentes en une heure, et la personne quitte les salons ouverts pour 24 h
 *   (l'administrateur le voit sur `/admin/humain/salons`). **« Ne plus voir »** : ses bulles disparaissent, partout.
 *
 * FICHIER PARTAGÉ (l'écran et le serveur).
 */
import { motInterdit } from "./mots-interdits";
import { parleDAlcool } from "./meme-surprise";
import { THEMES_DECOUVRIR, type IdTheme, type ThemeDecouvrir } from "./decouvrir";
import type { PieceDuo } from "./pieces-duo";
import type { ImageSalon } from "./salon";

export const PLACES_SALON = 8;
/** Présent : vu depuis moins de 2 min 30 (la présence du duo, `LA_MS`). */
export const PRESENCE_MS = 150_000;
/** Le téléphone redit qu'il est là toutes les 30 secondes (pas à chaque pouls : moins d'écritures). */
export const REDIRE_MS = 30_000;
/** La conversation d'un salon est gardée 48 heures. */
export const CONSERVE_MS = 48 * 3600_000;
export const TEXTE_SALON_MAX = 90;
/** Trois signalements de personnes différentes en une heure : 24 heures hors des salons ouverts. */
export const SIGNALEMENTS_SEUIL = 3;
export const SIGNALEMENTS_FENETRE_MS = 3600_000;
export const EXCLUSION_MS = 24 * 3600_000;

export type MaisonSalons = "adultes" | "jeunes";
export const maisonDe = (adulte: boolean | null): MaisonSalons | null => (adulte === true ? "adultes" : adulte === false ? "jeunes" : null);

/** Le nom de chaque salon, et le décor (une pièce du catalogue) qu'il préfère. */
export const SALONS: Record<IdTheme, { nom: string; decor: PieceDuo }> = {
  foot: { nom: "Le salon du foot", decor: "salon" },
  series: { nom: "Le salon des séries", decor: "salon" },
  musique: { nom: "Le salon de la musique", decor: "chambre-musicale" },
  jeux: { nom: "Le salon des jeux vidéo", decor: "chambre" },
  tele: { nom: "Le salon de la télé-réalité", decor: "salon" },
  humour: { nom: "Le salon de l’humour", decor: "cafe" },
  cuisine: { nom: "Le salon de la cuisine", decor: "cuisine" },
  mode: { nom: "Le salon de la mode", decor: "newyork" },
  manga: { nom: "Le salon des mangas", decor: "chambre" },
  animaux: { nom: "Le salon des animaux", decor: "terrasse" },
  revisions: { nom: "Le salon des révisions", decor: "cafe" },
  parents: { nom: "Le salon des jeunes parents", decor: "salon" },
};

/** Les salons qu'il peut voir : sans le salon des jeunes parents chez les 15-17 ans. */
export const themesDesSalons = (maison: MaisonSalons): ThemeDecouvrir[] => THEMES_DECOUVRIR.filter((t) => !(t.adultes && maison !== "adultes"));

/** L'identifiant d'un salon : son thème et son numéro (« foot-2 »). */
export const idSalon = (theme: IdTheme, n: number) => `${theme}-${n}`;
export function salonDe(id: unknown): { theme: IdTheme; n: number } | null {
  const m = /^([a-z]+)-(\d{1,3})$/.exec(String(id ?? ""));
  if (!m) return null;
  const theme = THEMES_DECOUVRIR.find((t) => t.id === m[1])?.id;
  const n = Number(m[2]);
  return theme && n >= 1 ? { theme, n } : null;
}
/** « ⚽ Le salon du foot », « ⚽ Le salon du foot · 2 ». */
export function nomDuSalon(theme: IdTheme, n = 1): string {
  const t = THEMES_DECOUVRIR.find((x) => x.id === theme);
  return `${t?.e ?? "🛋️"} ${SALONS[theme].nom}${n > 1 ? ` · ${n}` : ""}`;
}

// ─── ce qu'on y fait ───
export const REACTIONS_SALON = [
  { cle: "rire", e: "😂", nom: "Rire" },
  { cle: "coeur", e: "❤️", nom: "J’adore" },
  { cle: "oh", e: "😮", nom: "Oh !" },
  { cle: "surprise", e: "😱", nom: "Surprise" },
  { cle: "bravo", e: "👏", nom: "Bravo" },
] as const;
export type CleReaction = (typeof REACTIONS_SALON)[number]["cle"];
export const GESTES_SALON = [
  { cle: "coucou", e: "👋", nom: "Coucou" },
  { cle: "bravo", e: "👏", nom: "Bravo" },
  { cle: "rire", e: "😂", nom: "Rire" },
] as const;
export type CleGeste = (typeof GESTES_SALON)[number]["cle"];
export const reactionDe = (x: unknown) => REACTIONS_SALON.find((r) => r.cle === x);
export const gesteDe = (x: unknown) => GESTES_SALON.find((g) => g.cle === x);

export const MOTIFS_SIGNALEMENT = ["Des insultes ou des moqueries", "Demande des choses personnelles", "Ce qu’on montre ou dit est choquant", "Autre chose"] as const;

/**
 * Quelqu'un dans le salon (`q` : son identifiant court, jamais son compte) ; (lot D5) ses passions, et la clé de sa
 * maison si elle est ouverte à tous (« 🏠 Voir sa maison »).
 */
export type PresentSalon = { q: string; prenom: string; figurine: ImageSalon | null; place: number; arrive: number; passions?: string[]; maison?: string };

// ─── 🛋️ D2 : la séance chez moi (ma pièce, ma télé, jusqu'à trois proches) ───
export const PLACES_SEANCE = 4;
export const INVITES_MAX = PLACES_SEANCE - 1;
/** Une invitation tient six heures. */
export const INVITATION_MS = 6 * 3600_000;
/** La télé de la séance : celle que l'hôte mène — la vidéo, l'heure où elle a commencé, sa pause (en secondes), `n`. */
export type TeleSeance = { video: VideoSalon; depart: number; pause?: number; n: number };
/** Où en est la vidéo de la séance à cet instant (en secondes). */
export const positionSeance = (t: TeleSeance, ms: number): number => Math.max(0, Math.min(t.video.duree || 1e6, t.pause ?? (ms - t.depart) / 1000));
/** Une invitation reçue (« 🎬 Léa t'invite devant sa télé »). */
export type InvitationTele = { cle: string; prenom: string; le: number };
/** 👯 (lot D5) une demande de proche reçue dans un salon ouvert. */
export type DemandeProche = { q: string; prenom: string; salon: string; le: number };
/** 🗄️ (lot D5) un moment de l'étagère d'un salon : un message aimé par trois personnes au moins. */
export type MomentSalon = { id: string; texte: string; prenom: string; le: number; n: number };
export const AIMES_POUR_ETAGERE = 3;
export const DEMANDES_PAR_JOUR = 10;
/** 🏠 (lot D5) « Mes salons » : les salons que je fréquente, en fanions dans ma pièce. */
export type MonSalon = { theme: IdTheme; e: string; nom: string };
/** Un message du salon : un texte (une bulle), une réaction, ou un geste à quelqu'un (`a`). */
export type MessageSalon = { id: string; de: string; prenom: string; le: number; sorte: "texte" | "reaction" | "geste"; texte?: string; cle?: string; a?: string };
/** Un salon, sur l'accueil de Découvrir. */
export type CarteSalon = { theme: IdTheme; e: string; nom: string; presents: number; salons: number; mien: boolean; decor: { src: string; flou: string } | null; teles?: number };
/** La télé du salon : la sélection du jour du thème, en boucle, à la même seconde pour tous. */
export type VideoSalon = { id: string; titre: string; chaine: string; duree: number };

// ─── 🛡️ la modération de ce qu'on écrit ───
const aPlat = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’`]/g, "'");
const LIEN = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|fr|net|org|io|be|ch|ly|gg|me|tv|app|link|co)\b)/;
const COURRIEL = /[a-z0-9._-]+@[a-z0-9-]+\.[a-z]{2,}/;
const NUMERO = /(\d[\s.\-/]?){6,}/;
const RESEAU = /\b(insta(gram)?|snap(chat)?|sc|tiktok|tik tok|whats ?app|wsp|telegram|discord|facebook|fb|messenger|twitter|onlyfans|wa\.me|signal)\b|(^|\s)@[a-z0-9_.]{2,}/;
const PERSONNEL =
  /\b(quel age|t'?as quel|tu as quel|ton age|tu habites|t'?habites|ou tu habites|ou t'?habites|tu vis ou|t'?es d'?ou|tu es d'?ou|tu viens d'?ou|t'?es ou|tu es ou|ton adresse|ta ville|ton numero|ton num|ton tel|ton telephone|ton nom de famille|ton vrai nom|en prive|en mp|mp moi|dm moi|ecris moi en|photo de toi|envoie (moi )?(une |des )?photos?|montre (moi )?(ta|ton)|on se voit|on se rejoint|rendez[- ]vous|ton ecole|ton college|ton lycee)\b/;

/** Ce qui l'empêche de partir (dit à son auteur), ou `null` : il part. */
export function refusDuMessage(texte: string): string | null {
  const t = texte.replace(/\s+/g, " ").trim();
  if (!t) return "il est vide";
  if ([...t].length > TEXTE_SALON_MAX) return `${TEXTE_SALON_MAX} signes au plus`;
  const p = aPlat(t);
  if (LIEN.test(p)) return "un lien ne part pas ici";
  if (COURRIEL.test(p)) return "une adresse ne part pas ici";
  if (NUMERO.test(p)) return "un numéro ne part pas ici";
  if (RESEAU.test(p)) return "un réseau social ne part pas ici";
  if (PERSONNEL.test(p)) return "on ne demande rien de personnel dans un salon";
  if (motInterdit(t)) return "ces mots ne passent pas";
  if (parleDAlcool(t)) return "rien d’alcoolisé ici";
  return null;
}

// ─── 📺 la télé du salon : la même seconde pour tous ───
/**
 * Où en est la télé du salon à cet instant : la sélection du jour en boucle, depuis minuit (heure de Paris) — tout le
 * monde calcule la même chose, sans rien se dire.
 */
export function positionTele(videos: readonly Pick<VideoSalon, "duree">[], ms: number): { i: number; t: number } | null {
  const durees = videos.map((v) => Math.max(1, Math.round(v.duree)));
  const total = durees.reduce((a, b) => a + b, 0);
  if (!total) return null;
  const depuisMinuit = Math.floor((ms - minuitDeParis(ms)) / 1000);
  let reste = ((depuisMinuit % total) + total) % total;
  for (let i = 0; i < durees.length; i++) {
    if (reste < durees[i]) return { i, t: reste };
    reste -= durees[i];
  }
  return { i: 0, t: 0 };
}
/** Minuit à Paris (ms), le jour de `ms`. */
function minuitDeParis(ms: number): number {
  const d = new Date(ms);
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hourCycle: "h23" }).format(d));
  const m = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", minute: "2-digit" }).format(d));
  const s = d.getUTCSeconds();
  return ms - ((h * 60 + m) * 60 + s) * 1000 - d.getUTCMilliseconds();
}

/**
 * Les huit places d'un salon, sur la bande de la pièce (en fractions de la largeur visible, et de la hauteur de la
 * bande) : quatre au fond, plus petites, quatre devant — chacun dans son fauteuil.
 */
export const PLACES_DU_SALON: readonly { x: number; y: number; h: number }[] = [
  // (devant, du milieu vers les bords : les premiers arrivés au centre)
  { x: 0.375, y: 0.95, h: 0.37 },
  { x: 0.625, y: 0.95, h: 0.37 },
  { x: 0.125, y: 0.95, h: 0.37 },
  { x: 0.875, y: 0.95, h: 0.37 },
  // (au fond, plus petites — leur prénom reste au-dessus des têtes de devant)
  { x: 0.4, y: 0.585, h: 0.27 },
  { x: 0.6, y: 0.585, h: 0.27 },
  { x: 0.2, y: 0.585, h: 0.27 },
  { x: 0.8, y: 0.585, h: 0.27 },
]

export const PHRASES_SALONS = {
  titre: "Les salons ouverts",
  sousTitre: "par passion",
  chapo: "Tes passions d’abord. Tu entres, ta figurine s’assoit, on parle.",
  chapoJeunes: "Les salons des 15-17 ans : tu n’y croises jamais d’adulte. ",
  autres: "Les autres salons",
  ici: (n: number) => (n ? `${n} ici` : "Personne pour l’instant"),
  entrer: "Entrer",
  slogan: "Regarde tes vidéos avec ceux que tu aimes, même quand ils sont loin.",
  age: "Avant d’entrer : as-tu 18 ans ou plus ? Les 15-17 ans ont leurs salons à eux.",
  adulte: "J’ai 18 ans ou plus",
  jeune: "J’ai entre 15 et 17 ans",
  sansFigurine: "Pour entrer, il te faut ta figurine assise dans son fauteuil.",
  bienvenue: "Tu t’assois. Ici, on ne voit que ton prénom et ta figurine.",
  plein: (nom: string) => `Le premier ${nom} est complet : tu t’assois dans le suivant.`,
  regles: "Relu avant d’apparaître · ni vocal ni photo ici · on ne voit que ton prénom et ta figurine",
  tele: "📺 La sélection du jour, la même seconde pour tout le salon",
  allumer: "▶ Allumer la télé du salon",
  pasDeTele: "La télé du salon s’allume avec la sélection du jour.",
  ecrire: "Écris au salon",
  refus: (r: string) => `🚫 Ce message ne part pas : ${r}.`,
  conversation: "💬 La conversation du salon",
  conversationChapo: "Tout ce qui s’est dit ces dernières 48 heures.",
  avant: "Avant ton arrivée",
  depuis: "Depuis que tu es là",
  rien: "Rien encore.",
  fiche: "Dans ce salon · prénom et figurine seulement",
  nePlusVoir: "🙈 Ne plus voir",
  nePlusVu: (p: string) => `🙈 Tu ne verras plus les bulles de ${p}, nulle part`,
  signaler: "🚩 Signaler",
  signalerTitre: (p: string) => `Signaler ${p}`,
  signalerChapo: "Ça reste entre toi et ClikMe.",
  signale: "🚩 Merci, c’est signalé. Au troisième signalement en une heure, la personne quitte les salons ouverts pendant 24 h.",
  exclu: "Tu ne peux plus entrer dans les salons ouverts pour l’instant (des signalements). Reviens demain.",
  sortir: "‹",
  places: (n: number) => `${n} ici · ${PLACES_SALON - n ? `${PLACES_SALON - n} place${PLACES_SALON - n > 1 ? "s" : ""} libre${PLACES_SALON - n > 1 ? "s" : ""}` : "complet"} · ${PLACES_SALON} places`,
  indice: "Touche une figurine : son prénom, un coucou, un bravo…",
  reagis: "Réagis :",
  ouTouche: "ou touche une figurine",
  // 🛋️ D2 : la séance chez moi
  chezMoi: "👥 Regarder avec mes proches",
  chez: (p: string) => `🏠 Chez ${p}`,
  inviter: "👥 Inviter",
  inviterTitre: "Inviter à regarder avec toi",
  inviterChapo: `Jusqu’à ${INVITES_MAX} proches. Tu mènes la télé : tout le monde voit la même seconde.`,
  inviterEnvoyer: "Inviter",
  sansProches: "Pas encore de proches à inviter : ajoute-les depuis « Proches ».",
  invites: (n: number) => (n > 1 ? `Invitations envoyées à ${n} proches : chacun arrive en touchant « Venir »` : "Invitation envoyée : ton proche arrive en touchant « Venir »"),
  choisir: "📺 Choisir",
  choisirTitre: "Ta télé du jour",
  sansVideos: "Ta télé du jour est vide : choisis d’abord tes passions dans Découvrir.",
  seuls: "Invite tes proches : ils s’assoient à côté de toi.",
  aime: "❤️ Aimé",
  surEtagere: "🗄️ Aimé par 3 personnes : il monte sur l’étagère du salon !",
  dejaProches: "Vous êtes déjà proches 🙂",
  invitationsTitre: "🎬 On t’attend devant la télé",
  demandesTitre: "👯 On veut t’ajouter en proche",
  accepte: (p: string) => `🎉 ${p} et toi êtes proches : votre conversation est ouverte dans « Proches »`,
  invitation: (p: string) => `🎬 ${p} t’invite devant sa télé`,
  venir: "Venir",
  pasMaintenant: "Pas maintenant",
  hote: "Tu mènes la télé : tout le monde voit la même seconde.",
  invite: (p: string) => `C’est ${p} qui mène la télé.`,
  pause: "❚❚ Pause",
  reprendre: "▶ Reprendre",
  suivante: "⏭ Suivante",
  pasInvite: "Cette séance est réservée à ceux qui y sont invités.",
  // 🗄️ D5 : l'étagère du salon, ajouter en proche
  etagere: "🗄️ L’étagère du salon",
  etagereChapo: `Les moments que ${AIMES_POUR_ETAGERE} personnes ou plus ont aimés, sans limite de temps. « 📌 Garder » : il va dans ta maison.`,
  etagereVide: "Rien encore : touche une bulle pour l’aimer ❤️",
  garder: "📌 Garder",
  garde: "📌 Gardé : il est chez toi",
  proche: "👯 Ajouter en proche",
  procheEnvoye: (p: string) => `👯 Demande envoyée : si ${p} t’ajoute aussi, votre conversation s’ouvre dans « Proches »`,
  procheFait: (p: string) => `🎉 ${p} et toi êtes proches : votre conversation est ouverte`,
  demandeProche: (p: string, salon: string) => `👯 ${p} (${salon}) veut t’ajouter en proche`,
  accepter: "Accepter",
  refuser: "Non merci",
  voirMaison: "🏠 Voir sa maison",
  maisonFermee: "🏠 Sa maison est fermée aux visites",
  sesPassions: "Ses passions",
  mesSalons: "Mes salons",
} as const;
