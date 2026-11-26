/**
 * 👥 MES GROUPES — LES PROPOSITIONS (« On se retrouve ? ») : le lot G2 (`docs/univers/mes-groupes.md`).
 *
 * Quelqu'un propose de se retrouver à une heure, autour d'une passion et d'une vidéo : un nom, quand, pour qui (tout le
 * monde — les adultes seulement — ou ses proches), 4 ou 8 places, un mot s'il veut. Les autres confirment leur place, ou
 * proposent une autre heure. À l'heure dite, on entre :
 *   · ouverte à tout le monde : le salon de la passion, dans Découvrir (8 places, le gradin) ;
 *   · entre proches : la séance chez celui qui propose (4 places), avec la vidéo choisie.
 * « Maintenant » et ouverte à tout le monde : pas de proposition, on va tout de suite au salon de la passion.
 *
 * Les règles de toujours : jamais un chiffre inventé (celui qui propose a sa place : « 1/8 », jamais « 0/8 ») ; pas de
 * vote, pas de points ; le nom et le mot passent la modération des salons (`refusDuMessage`) ; « Signaler » : trois
 * personnes, et la proposition disparaît. Les 15-17 ans ne proposent et ne voient que des propositions entre proches.
 *
 * FICHIER PARTAGÉ (l'écran et le serveur).
 */
import { THEMES_DECOUVRIR, type IdTheme } from "./decouvrir";
import { refusDuMessage } from "./salons-ouverts";

export type PourQui = "tous" | "proches";
export const PLACES_GROUPE = [4, 8] as const;
export type PlacesGroupe = (typeof PLACES_GROUPE)[number];
export const NOM_GROUPE_MAX = 28;
export const MOT_GROUPE_MAX = 80;
/** On peut entrer dix minutes avant l'heure, et jusqu'à deux heures après. */
export const OUVERT_AVANT_MS = 10 * 60_000;
export const OUVERT_APRES_MS = 2 * 3600_000;
/** Une proposition se fait pour les quatorze prochains jours au plus. */
export const HORIZON_MS = 14 * 24 * 3600_000;
/** Trois signalements de personnes différentes : la proposition disparaît. */
export const SIGNALEMENTS_GROUPE = 3;
/** Trois propositions à venir par personne, au plus. */
export const PROPOSITIONS_MAX = 3;

/** Une personne qui a sa place : son prénom, sa figurine. */
export type PlaceGroupe = { q: string; prenom: string; src: string };

/** Une proposition, telle que l'écran la voit. */
export type PropositionGroupe = {
  id: string;
  nom: string;
  theme: IdTheme;
  e: string;
  video: { id: string; titre: string } | null;
  /** l'heure du rendez-vous (ms) */
  quand: number;
  pour: PourQui;
  places: PlacesGroupe;
  mot?: string;
  /** celui qui propose (son prénom) ; `mienne` : c'est moi */
  de: string;
  mienne?: true;
  /** ceux qui ont leur place (celui qui propose en premier) */
  confirmes: PlaceGroupe[];
  /** j'ai ma place */
  jY?: true;
  /** la dernière autre heure proposée (pas par celui qui propose) */
  autre?: { prenom: string; quand: number; q: string };
  /** on peut entrer (dix minutes avant, deux heures après) */
  ouverte?: true;
  /** 💛 (lot G4) la séance est finie : « On garde ce groupe ? » (seulement pour ceux qui y avaient leur place) */
  garder?: GarderGroupe;
};

export const themeDuGroupe = (t: unknown) => THEMES_DECOUVRIR.find((x) => x.id === t) ?? null;
export const estOuverte = (quand: number, maintenant: number) => maintenant >= quand - OUVERT_AVANT_MS && maintenant <= quand + OUVERT_APRES_MS;

/** Pourquoi un nom ou un mot ne passe pas (`null` : il passe). */
export function refusDuGroupe(texte: string, max: number): string | null {
  const t = texte.replace(/\s+/g, " ").trim();
  if ([...t].length > max) return `${max} signes au plus`;
  return refusDuMessage(t);
}

const HEURE = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "numeric", minute: "2-digit" });
const JOUR = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" });
const CLE_JOUR = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });

/** « 20 h », « 20 h 30 » (heure de Paris). */
export function heureLisible(ms: number): string {
  const [h, m] = HEURE.format(ms).split(":");
  return m && m !== "00" ? `${Number(h)} h ${m}` : `${Number(h)} h`;
}
/** « Ce soir 20 h », « Demain 21 h », « Samedi 20 h 30 », « Le 12 décembre 20 h ». */
export function quandLisible(ms: number, maintenant = Date.now()): string {
  const jour = CLE_JOUR.format(ms);
  const auj = CLE_JOUR.format(maintenant);
  const dem = CLE_JOUR.format(maintenant + 24 * 3600_000);
  const h = heureLisible(ms);
  if (jour === auj) return `${Number(HEURE.format(ms).split(":")[0]) >= 18 ? "Ce soir" : "Aujourd’hui"} ${h}`;
  if (jour === dem) return `Demain ${h}`;
  const j = JOUR.format(ms);
  if (ms - maintenant < 7 * 24 * 3600_000) {
    const nom = j.split(" ")[0];
    return `${nom[0].toUpperCase()}${nom.slice(1)} ${h}`;
  }
  return `Le ${j.split(" ").slice(1).join(" ")} ${h}`;
}

/** (Paris) le décalage avec l'heure universelle à cet instant, en minutes. */
function decalageParis(ms: number): number {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(ms);
  const v = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return (Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute")) - Math.floor(ms / 60_000) * 60_000) / 60_000;
}
/** L'instant d'un jour (dans `jours` jours, heure de Paris) à `h` heures `m` minutes. */
export function aParis(jours: number, h: number, m = 0, maintenant = Date.now()): number {
  const [a, mo, j] = CLE_JOUR.format(maintenant + jours * 24 * 3600_000).split("-").map(Number);
  const brut = Date.UTC(a, mo - 1, j, h, m);
  return brut - decalageParis(brut) * 60_000;
}

export const PHRASES_PROPOSITIONS = {
  rangee: "Propositions de groupes",
  lancer: "Lancer",
  confirmer: "Je confirme ma place",
  confirme: "✓ Ma place est prise",
  laisser: "Laisser ma place",
  autreHeure: "🕘 Autre heure",
  entrer: "▶ Entrer",
  complet: "Complet",
  confirmes: (n: number, places: number) => `${n}/${places} confirmé${n > 1 ? "s" : ""}`,
  propose: (prenom: string) => `Proposé par ${prenom}`,
  autre: (prenom: string, quand: string) => `🕘 ${prenom} propose ${quand}`,
  prendreHeure: "Prendre cette heure",
  retirer: "Retirer",
  signaler: "Signaler",
  signale: "Merci : c’est signalé.",
  pourProches: "👥 Entre proches",
  // l'écran « Proposer »
  titre: "Proposer",
  sonNom: "Son nom",
  nomIndice: "Soirée foot",
  passion: "La passion",
  video: "La vidéo pour commencer",
  unLien: "Un lien",
  lienIndice: "Colle un lien YouTube",
  nouveautes: "Nouveautés",
  nouveautesSous: "Les vidéos du jour de la passion",
  quand: "Quand",
  maintenant: "Maintenant",
  ceSoir: "Ce soir",
  demain: "Demain",
  autreJour: "Un autre jour",
  pourQui: "Pour qui",
  tous: "Tout le monde",
  tousSous: "Adultes",
  proches: "Mes proches",
  places: "Places",
  mot: "Un mot (si tu veux)",
  motIndice: "Tout le monde est bienvenu !",
  publier: "📣 Publier",
  allerAuSalon: "▶ Aller au salon",
  ouVa: (tous: boolean, maintenant: boolean) => (maintenant && tous ? "Elle ouvre le salon de la passion, dans Découvrir" : tous ? "Elle ira dans « Propositions de groupes », pour tout le monde" : "Elle ira dans « Propositions de groupes », chez tes proches"),
  publiee: "📣 Ta proposition est dans « Propositions de groupes »",
  jeunes: "Entre 15 et 17 ans, on se retrouve entre proches.",
  ferme: "Les propositions ouvertes à tout le monde sont en pause.",
  tropDePropositions: `${PROPOSITIONS_MAX} propositions à venir au plus : retire-en une d’abord.`,
  // l'autre heure
  autreTitre: "🕘 Un autre horaire ?",
  proposerHeure: "Proposer",
  autreEnvoye: "🕘 C’est proposé : tout le monde le voit sur la carte.",
  // 🔔 (lot G3) les rappels et les changements d'heure
  rappelTitre: (nom: string, minutes: number) => (minutes > 0 ? `🔔 ${nom} commence dans ${minutes} minute${minutes > 1 ? "s" : ""}` : `🔔 ${nom} a commencé`),
  rappelCorps: (n: number) => (n > 1 ? `Vous êtes ${n} à avoir votre place : on se retrouve !` : "Ta place t’attend : on se retrouve !"),
  autreNotifTitre: (prenom: string, quand: string) => `🕘 ${prenom} propose ${quand} à la place`,
  autreNotifCorps: (nom: string) => `Pour « ${nom} » : tu peux prendre cette heure depuis la carte.`,
  changeNotifTitre: (nom: string, quand: string) => `🕘 ${nom} passe à ${quand.charAt(0).toLowerCase()}${quand.slice(1)}`,
  changeNotifCorps: "Ta place est gardée. Si ça ne te va plus, laisse-la depuis la carte.",
} as const;

/** 🔔 (lot G3) Le rappel part une fois par heure de rendez-vous, de quinze minutes avant à trente minutes après. */
export const RAPPEL_AVANT_MS = 15 * 60_000;
export const RAPPEL_APRES_MS = 30 * 60_000;

// ═══ 💛 (lot G4) « ON GARDE CE GROUPE ? », ET TOUS MES GROUPES ═══
/** La fin du premier rendez-vous : « On garde ce groupe ? » à partir de quarante-cinq minutes après l'heure… */
export const GARDER_DES_MS = 45 * 60_000;
/** … et pendant deux jours. */
export const GARDER_JUSQUA_MS = 48 * 3600_000;
/** Trois groupes gardés par personne, pour commencer (montré seulement quand on l'atteint). */
export const GROUPES_MAX = 3;
/** Un groupe : au moins deux personnes qui l'ont gardé (celui qui le crée avec ses proches : tout de suite). */
export const MEMBRES_MIN = 2;
export const MEMBRES_MAX = 8;
/** « g-<ms>-<q>-<hex> » : un groupe (né d'une proposition, il en garde l'identifiant). */
export const ID_GROUPE = /^g-\d{13}-[A-Za-z0-9_-]{4,16}-[0-9a-f]{6}$/;
export const idDuGroupe = (idProposition: string) => `g-${idProposition}`;

/** « On garde ce groupe ? » sur la carte d'une proposition, pour ceux qui y avaient leur place. */
export type GarderGroupe = {
  /** ceux qui l'ont gardé (leur `q`) */
  gardes: string[];
  /** je l'ai gardé */
  moi?: true;
  /** le groupe est né (deux personnes au moins) : son identifiant */
  groupe?: string;
};

/** Un groupe, tel que l'écran le voit (seulement ses membres le voient). */
export type GroupeVue = {
  id: string;
  nom: string;
  mot?: string;
  theme: IdTheme;
  e: string;
  /** ses membres (moi compris), dans l'ordre où ils l'ont gardé */
  membres: PlaceGroupe[];
  /** ceux qui sont dans son salon en ce moment */
  ici: PlaceGroupe[];
  /** le dernier passage dans son salon (pas le mien) */
  passage?: { prenom: string; le: number };
  /** je suis invité (un proche l'a créé) : « 💛 Garder ce groupe » ou « Non merci » */
  invite?: { de: string };
  /** 📅 (lot G5) son prochain rendez-vous */
  prochain?: { nom: string; quand: number };
};

export const PHRASES_GROUPES_GARDES = {
  // la carte de fin
  finie: (e: string, nom: string) => `${e} ${nom} · la séance est finie`,
  garderQuestion: "On garde ce groupe ?",
  garder: "💛 Garder ce groupe",
  garde: "✓ Gardé · entrer dans le groupe",
  gardeSeul: "✓ Gardé",
  personne: "Personne n’est obligé : ceux qui gardent forment le groupe.",
  attendre: "Le groupe naît dès qu’un autre le garde aussi.",
  ne: (nom: string) => `✨ « ${nom} » est dans Mes groupes, pour de bon`,
  tuGardes: "💛 Tu gardes le groupe",
  tropDeGroupes: `${GROUPES_MAX} groupes au plus pour commencer.`,
  // les rangées
  actifs: "Mes groupes actifs",
  tous: "Tous mes groupes",
  creer: "Créer",
  seulsMembres: "Un groupe n’est visible que par ses membres.",
  enLigne: (n: number) => `● ${n} dans le salon`,
  passe: (prenom: string, heure: string) => `🕑 Passage de ${prenom} à ${heure}`,
  entrer: "Entrer",
  invitePar: (prenom: string) => `👥 ${prenom} te propose ce groupe`,
  nonMerci: "Non merci",
  // son espace
  retour: "Retour à Mes groupes",
  membres: (n: number) => `👥 ${n}`,
  salonVide: "Son salon est toujours ouvert : les suivants te verront.",
  dansLeSalon: "🛋️ Le salon du groupe",
  lesMembres: "👥 Membres",
  // créer avec ses proches
  creerTitre: "Un groupe avec mes proches",
  creerChoisir: "Avec qui ?",
  creerAucun: "Il te faut d’abord des proches : invite-les devant ta télé.",
  creerPublier: "👥 Créer le groupe",
  cree: (nom: string) => `👥 « ${nom} » est créé : tes proches le voient dans Mes groupes`,
} as const;

// ═══ 📅💬 (lot G5) LES RENDEZ-VOUS DU GROUPE, ET SA DISCUSSION ═══
/** « chaque jour », « chaque semaine » (un jour, 0 = lundi), ou une seule fois (exceptionnel). */
export type Recurrence = "jour" | "semaine" | "une";
export type ReponseRdv = "viens" | "absent" | "tard";
export const REPONSES_RDV: ReponseRdv[] = ["viens", "absent", "tard"];
/** Six rendez-vous au plus par groupe ; un message : 90 signes, comme dans les salons. */
export const RDV_MAX = 6;
export const MESSAGE_GROUPE_MAX = 90;
/** Une idée de séance entre dans les rendez-vous quand deux personnes sont partantes. */
export const PARTANTS_MIN = 2;
export const JOURS_SEMAINE = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const;

/** Un rendez-vous du groupe, tel que l'écran le voit (sa prochaine fois). */
export type RdvGroupe = {
  id: string;
  nom: string;
  e: string;
  recurrence: Recurrence;
  /** chaque semaine : le jour (0 = lundi) */
  jour?: number;
  heure: number;
  minute: number;
  /** la prochaine fois (ms) — ou celle qui est en cours */
  quand: number;
  /** ceux qui viennent (leur figurine) */
  viennent: PlaceGroupe[];
  /** ma réponse pour cette fois-ci */
  moi?: ReponseRdv;
  /** je l'ai proposé (je peux le retirer) */
  mien?: true;
  /** une idée de séance (« Partant ! ») : elle entre dans les rendez-vous à deux partants */
  idee?: true;
  de: string;
};

/** Un message de la discussion du groupe. */
export type MessageGroupe = { id: string; q: string; prenom: string; src: string; texte: string; le: number; mien?: true; idee?: string };

/** Ce qu'on lit en ouvrant l'espace d'un groupe. */
export type VieDuGroupe = { rdv: RdvGroupe[]; messages: MessageGroupe[] };

const JOUR_COURT = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", weekday: "short" });
const JOURS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
/** (Paris) le jour de la semaine d'un instant, 0 = lundi. */
export const jourDeLaSemaine = (ms: number) => JOURS_EN.indexOf(JOUR_COURT.format(ms));

/**
 * La prochaine fois d'un rendez-vous (ou celle en cours : jusqu'à deux heures après l'heure). Une seule fois : son
 * heure, ou `null` quand elle est passée depuis plus de deux heures.
 */
export function prochaineFois(r: { recurrence: Recurrence; jour?: number; heure: number; minute: number; quand?: number }, maintenant = Date.now()): number | null {
  if (r.recurrence === "une") return r.quand && r.quand + OUVERT_APRES_MS > maintenant ? r.quand : null;
  for (let k = 0; k <= 8; k++) {
    const t = aParis(k, r.heure, r.minute, maintenant);
    if (t + OUVERT_APRES_MS <= maintenant) continue;
    if (r.recurrence === "semaine" && jourDeLaSemaine(t) !== r.jour) continue;
    return t;
  }
  return null;
}

/** « chaque soir · 21 h », « chaque mercredi · 20 h », « Samedi 22 h · exceptionnel ». */
export function quandDuRdv(r: Pick<RdvGroupe, "recurrence" | "jour" | "heure" | "quand">, maintenant = Date.now()): string {
  const h = heureLisible(r.quand);
  if (r.recurrence === "jour") return `${r.heure >= 18 ? "chaque soir" : "chaque jour"} · ${h}`;
  if (r.recurrence === "semaine") return `chaque ${JOURS_SEMAINE[r.jour ?? 0]} · ${h}`;
  return `${quandLisible(r.quand, maintenant)} · exceptionnel`;
}

export const PHRASES_VIE_DU_GROUPE = {
  ongletRdv: "📅 Rendez-vous",
  ongletDiscussion: "💬 Discussion",
  ongletMembres: "👥 Membres",
  viens: "✓ Je viens",
  absent: "Absent",
  tard: "Plus tard",
  tardDit: "Tu retrouveras la séance et ses réactions plus tard",
  nouveau: "＋ Un rendez-vous",
  nouveauTitre: "📅 Un rendez-vous",
  nouveauDit: "📅 Le groupe le voit tout de suite",
  sonNom: "Son nom",
  nomIndice: "Le rendez-vous du soir",
  chaqueJour: "Chaque jour",
  chaqueSemaine: "Chaque semaine",
  uneFois: "Une seule fois",
  heure: "À quelle heure",
  quelJour: "Quel jour",
  rdvAucun: "Un rendez-vous fixe, et le groupe se retrouve sans y penser.",
  creer: "📅 Ajouter",
  retirer: "Retirer",
  tropDeRdv: `${RDV_MAX} rendez-vous au plus par groupe.`,
  prochain: (quand: string) => `Prochain : ${quand}`,
  // la discussion
  ecrire: "Écrire au groupe…",
  envoyer: "Envoyer",
  idee: "💡 Une idée de séance",
  ideeTitre: "💡 Une idée de séance",
  ideeQuestion: (nom: string) => `Une séance « ${nom} » ?`,
  partant: "Partant !",
  partantFait: "✓ Partant",
  ideeEntre: (nom: string) => `⭐ « ${nom} » arrive dans les rendez-vous`,
  ideeEnvoyee: "💡 Ton idée est dans la discussion",
  rienEncore: "Dites-vous un mot entre deux rencontres.",
  // le rappel (lot G3, pour les rendez-vous du groupe)
  rappelCorps: "Ton groupe t’attend dans son salon.",
} as const;

// ═══ 🎬 (lot G6) AUJOURD'HUI DANS LE GROUPE : LA SÉLECTION DU JOUR, LES RÔLES QUI TOURNENT ═══
/** Une vidéo est retenue pour ce soir dès que deux membres lèvent la main (🙋) — jamais un nombre à l'écran. */
export const ENVIES_RETENUE = 2;
/** Les nouveautés de la passion, au bout de la sélection (trois quand personne n'a encore rien proposé). */
export const NOUVEAUTES_DU_JOUR = 2;

/** Une vidéo de la sélection du jour du groupe. */
export type VideoDuGroupe = {
  id: string;
  titre: string;
  chaine: string;
  duree: number;
  /** qui l'a proposée, et son mot (« pourquoi elle ») ; sans : une nouveauté de la passion */
  de?: PlaceGroupe;
  mot?: string;
  nouveaute?: true;
  /** ceux qui la veulent ce soir (🙋, leurs têtes) */
  envies: PlaceGroupe[];
  moi?: true;
  /** ✓ Ce soir : elle ouvrira la séance dans le salon du groupe */
  retenue?: true;
  mienne?: true;
};

export type IdRole = "video" | "sujet" | "decouverte" | "prochaine";
/** Les rôles du jour, dans l'ordre : ils tournent chaque jour entre les membres. */
export const ROLES_DU_JOUR: { id: IdRole; e: string; nom: string; tour: string }[] = [
  { id: "video", e: "🎬", nom: "La vidéo", tour: "Choisis la vidéo qui ouvrira la séance" },
  { id: "sujet", e: "💬", nom: "Le sujet", tour: "Lance le sujet du jour dans la discussion" },
  { id: "decouverte", e: "🔎", nom: "La découverte", tour: "Fais découvrir quelque chose au groupe" },
  { id: "prochaine", e: "📅", nom: "La prochaine", tour: "Pose le prochain rendez-vous" },
];
export type RoleDuJour = { id: IdRole; e: string; nom: string; qui: PlaceGroupe; moi?: true };

/** L'onglet Aujourd'hui. */
export type AujourdhuiDuGroupe = { jour: string; selection: VideoDuGroupe[]; roles: RoleDuJour[] };

/** Le numéro d'un jour (« 2026-11-26 ») : les rôles tournent d'un cran chaque jour. */
export const numeroDuJour = (jour: string) => Math.floor(Date.parse(`${jour}T12:00:00Z`) / 86_400_000);

/** Les rôles du jour : chaque membre (dans l'ordre de leur `q`) prend le suivant, d'un cran de plus chaque jour. */
export function rolesDuJour(membres: PlaceGroupe[], jour: string, q: string): RoleDuJour[] {
  const l = [...membres].sort((a, b) => (a.q < b.q ? -1 : a.q > b.q ? 1 : 0));
  if (!l.length) return [];
  const d = ((numeroDuJour(jour) % l.length) + l.length) % l.length;
  return ROLES_DU_JOUR.slice(0, l.length).map((r, k) => {
    const qui = l[(k + d) % l.length];
    return { id: r.id, e: r.e, nom: r.nom, qui, ...(qui.q === q ? { moi: true as const } : {}) };
  });
}

export const PHRASES_AUJOURDHUI = {
  onglet: "🎬 Aujourd’hui",
  etiquette: (e: string, court: string) => `Aujourd’hui : ${e} ${court}`,
  ceSoir: "✓ Ce soir",
  envie: "🙋",
  envieDit: "🙋 Tu la veux ce soir",
  retenueDit: "✓ Elle ouvrira la séance, dans le salon du groupe",
  nouveaute: "✨ Nouveauté",
  proposer: "Proposer la mienne",
  roles: "Ce soir, chacun son rôle",
  toi: "Toi",
  tonTour: "C’est ton tour",
  go: "Go",
  // la feuille « Ma vidéo »
  maVideoTitre: "＋ Ma vidéo du jour",
  maTele: "De ma télé du jour",
  unLien: "Un lien YouTube",
  lienIndice: "Colle le lien d’une vidéo YouTube",
  pourquoi: "Pourquoi elle ?",
  pourquoiIndice: "Le moment de dingue à 1:10",
  publier: "＋ Dans la sélection",
  ajoutee: "＋ Ta vidéo est dans la sélection, avec ton mot",
  retirer: "Retirer la mienne",
} as const;
