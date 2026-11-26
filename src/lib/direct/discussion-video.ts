/**
 * 💬 LA DISCUSSION D'UNE VIDÉO (`docs/univers/discussions-video.md` ; le lot A1) — ce qui ne dépend pas de l'écran.
 *
 * Une discussion appartient à la vidéo, pas au salon où elle a commencé : elle reste quand le salon ferme. On la voit à
 * travers un cercle :
 *   · 👯 Mes proches : leurs réactions à la seconde, leurs mots, leurs vocaux, leurs réponses (celles qui sont pour moi) —
 *     les proches ajoutés des deux côtés qui l'ont vue (`reactions-video`, rien de nouveau) ;
 *   · 🌍 Tous ceux qui l'ont vue : les mots laissés à la fin de la vidéo (`mots-video`), dans sa tranche (adultes, ou
 *     15-17 ans), où qu'on l'ait vue.
 *
 * On l'ouvre si la vidéo est à sa télé (aujourd'hui ou hier), dans son historique (📼 Revoir), dans une séance où l'on est,
 * dans la sélection d'un salon ouvert de sa tranche, ou si l'on y a déjà laissé un mot ou une réaction.
 *
 * FICHIER PARTAGÉ (l'écran, le serveur, les essais).
 */
import type { ProcheDevantVideo, ReactionVideo } from "./reactions-video";
import type { MotVu, SuiteVue } from "./mots-video";

export const CERCLES_DISCUSSION = ["proches", "tous"] as const;
export type CercleDiscussion = (typeof CERCLES_DISCUSSION)[number];
export const cercleValide = (x: unknown): CercleDiscussion | null => ((CERCLES_DISCUSSION as readonly unknown[]).includes(x) ? (x as CercleDiscussion) : null);

/** 🔔 (lot A3) Le suivi d'une discussion : prévenir (sur le téléphone), sans bruit (dans Activité), ne plus suivre. */
export const NIVEAUX_SUIVI = ["prevenir", "discret", "non"] as const;
export type NiveauSuivi = (typeof NIVEAUX_SUIVI)[number];
export const NIVEAUX: Record<NiveauSuivi, { e: string; nom: string; sous: string }> = {
  prevenir: { e: "🔔", nom: "Me prévenir", sous: "Une notification quand on y écrit (jamais la nuit, une à la fois)" },
  discret: { e: "🤫", nom: "Sans bruit", sous: "Les nouveautés t’attendent dans Activité ; une réponse à toi te prévient" },
  non: { e: "🔕", nom: "Ne plus suivre", sous: "Rien ne te prévient ; la discussion reste là si tu reviens" },
};
/**
 * Le niveau de départ, tant qu'on n'a pas choisi : 👯 entre proches, on est prévenu (on l'a vue) ; 🌍 sans bruit si
 * l'on y a parlé, sinon pas suivi. Le temps passé devant ne compte pas : ce qu'on y fait, si.
 */
export function niveauDeDepart(cercle: CercleDiscussion, o: { vue: boolean; aParle: boolean }): NiveauSuivi {
  if (cercle === "proches") return o.vue || o.aParle ? "prevenir" : "non";
  return o.aParle ? "discret" : "non";
}

export type VideoDiscussion = { id: string; titre: string; chaine: string; duree: number };

/** Ce que l'écran reçoit. */
export type DiscussionVue = {
  video: VideoDiscussion;
  /** Je l'ai déjà vue : tout ce que mes proches ont dit est montré (sinon : caché, pour ne rien gâcher). */
  vue: boolean;
  /** Elle est à ma télé : « ▶ Revoir la vidéo » la rouvre dans mon salon ; sinon, sur YouTube. */
  aMaTele: boolean;
  proches: ProcheDevantVideo[];
  miennes: ReactionVideo[];
  /** Les mots de ma tranche (`null` : je n'ai pas encore dit si j'ai 18 ans). */
  tous: SuiteVue | null;
  /** ✍️ (lot A2) les mots écrits de ma tranche (vides tant que je n'ai pas dit si j'ai 18 ans). */
  ecrits: EcritVu[];
  /** 🔔 (lot A3) mon niveau dans chaque cercle, et quand je l'avais lue avant d'ouvrir (0 : jamais) — « Nouveau ». */
  suivi: Record<CercleDiscussion, NiveauSuivi>;
  luAvant: Record<CercleDiscussion, number>;
  /** 👥 (lot A6) mes groupes qui parlent de cette vidéo (ou d'où je viens) : leurs mots, mon niveau, ma dernière lecture. */
  groupes: GroupeDeLaDiscussion[];
};

/** 👥 (lot A6) Le cercle d'un groupe, pour une vidéo : ses membres actuels seulement. */
export type GroupeDeLaDiscussion = { id: string; nom: string; ecrits: EcritVu[]; suivi: NiveauSuivi; luAvant: number };
/** Un cercle de l'écran : 👯, 🌍, ou 👥 un de mes groupes (son id). */
export type OngletDiscussion = CercleDiscussion | `groupe:${string}`;

/**
 * ✍️ (lot A2) Les mots écrits sous la vidéo (🌍) : 90 signes, la modération des salons ouverts ; on répond à un mot écrit
 * ou à un mot dit (`mot:<q>`). Gardés 30 jours ; cachés pour moi si je les signale, pour tous à trois signalements.
 */
export const ECRITS_VIDEO = {
  texte: 90,
  conserveJours: 30,
  seuilSignalements: 3,
  /** Les plus récents lus pour une vidéo. */
  lusMax: 120,
  /** Par personne et par vidéo. */
  parPersonne: 30,
  /** Pas plus d'un toutes les trois secondes. */
  ecartMs: 3000,
  /** Les figurines préparées (les premières) ; les autres : leur initiale. */
  figurinesMax: 16,
} as const;

/** Un mot écrit, tel que les autres le voient (jamais un compte). */
export type EcritVu = {
  id: string;
  q: string;
  prenom: string;
  texte: string;
  le: number;
  /** À quoi il répond : un mot écrit (son id) ou un mot dit (`mot:<q>`), et à qui. */
  repond?: { id: string; prenom: string };
  /** « vu dans le salon … » */
  de?: string;
  moi: boolean;
  proche: boolean;
  figurine: { src: string } | null;
};

/** La clé d'un mot dit, pour lui répondre par écrit. */
export const cleMot = (q: string) => `mot:${q}`;

/** Une ligne du fil 🌍 : un mot dit ou un mot écrit. */
export type LigneTous = { cle: string; le: number; repond?: string; mot?: MotVu; ecrit?: EcritVu };

/**
 * Le fil 🌍 : chaque conversation dans l'ordre où elle a commencé ; une réponse juste après ce à quoi elle répond (et
 * après les réponses déjà là). Une réponse à quelque chose qui n'est plus là devient une ligne comme une autre.
 */
export function filDeTous(mots: readonly MotVu[], ecrits: readonly EcritVu[]): LigneTous[] {
  const lignes: LigneTous[] = [
    ...mots.map((m) => ({ cle: cleMot(m.q), le: m.le, ...(m.repond ? { repond: cleMot(m.repond.q) } : {}), mot: m })),
    ...ecrits.map((e) => ({ cle: e.id, le: e.le, ...(e.repond ? { repond: e.repond.id } : {}), ecrit: e })),
  ];
  const cles = new Set(lignes.map((l) => l.cle));
  const enfants = new Map<string, LigneTous[]>();
  const racines: LigneTous[] = [];
  for (const l of lignes) {
    if (l.repond && l.repond !== l.cle && cles.has(l.repond)) enfants.set(l.repond, [...(enfants.get(l.repond) ?? []), l]);
    else racines.push(l);
  }
  const fil: LigneTous[] = [];
  const vus = new Set<string>();
  const poser = (l: LigneTous) => {
    if (vus.has(l.cle)) return;
    vus.add(l.cle);
    fil.push(l);
    for (const e of (enfants.get(l.cle) ?? []).sort((a, b) => a.le - b.le)) poser(e);
  };
  for (const r of racines.sort((a, b) => a.le - b.le)) poser(r);
  // (une boucle de réponses, s'il y en avait une : rien ne se perd)
  for (const l of lignes) poser(l);
  return fil;
}

/** L'adresse de la discussion (un cercle, si l'on veut l'ouvrir là). */
export const lienDiscussion = (id: string, cercle?: CercleDiscussion | "groupe", seance?: string, groupe?: string) =>
  `/univers/discussion?video=${encodeURIComponent(id)}${cercle ? `&cercle=${cercle}` : ""}${seance ? `&seance=${encodeURIComponent(seance)}` : ""}${groupe ? `&groupe=${encodeURIComponent(groupe)}` : ""}`;
/** La vidéo sur YouTube (quand elle n'est plus à ma télé). */
export const lienYouTube = (id: string) => `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;

/** Combien de choses dites dans un cercle (jamais un chiffre inventé : ce qui est là). */
export function combienDans(d: DiscussionVue, c: CercleDiscussion): number {
  if (c === "tous") return (d.tous?.mots.length ?? 0) + d.ecrits.length;
  const deux = [...d.proches.flatMap((p) => p.reactions), ...d.miennes];
  return deux.filter((r) => r.source !== "implicite").length;
}

/** Le cercle où s'ouvre l'écran : celui demandé ; sinon mes proches s'ils ont dit quelque chose ; sinon tous. */
export function cercleDeDepart(d: DiscussionVue, demande: unknown): CercleDiscussion {
  const c = cercleValide(demande);
  if (c) return c;
  return combienDans(d, "proches") > 0 || !combienDans(d, "tous") ? "proches" : "tous";
}

export const PHRASES_DISCUSSION = {
  titre: "💬 La discussion",
  ouvrir: "💬 Toute la discussion",
  retour: "‹",
  retourNom: "Revenir",
  revoir: "▶ Revoir la vidéo",
  surYouTube: "▶ La voir sur YouTube",
  proches: "👯 Mes proches",
  tous: "🌍 Tous",
  cercle: (nom: string, n: number) => (n ? `${nom} · ${n}` : nom),
  quiProches: "Tes proches qui l’ont vue. Eux seuls lisent ce qui est dit ici.",
  quiTous: "Tous ceux qui la regardent dans ClikMe : leurs mots, dits par leur figurine.",
  quiJeunes: "Tous les 15-17 ans qui la regardent dans ClikMe : leurs mots, dits par leur figurine.",
  rienProches: "Aucun de tes proches n’a encore réagi à cette vidéo.",
  rienTous: "Personne n’a encore laissé de mot sur cette vidéo.",
  cachees: (n: number) => `🔒 ${n} ${n > 1 ? "réactions attendent" : "réaction attend"} : regarde la vidéo d’abord, pour ne rien te gâcher.`,
  aLaSeconde: (t: string) => `à ${t}`,
  toi: "Toi",
  aToi: "à toi",
  unVocal: "🎙️ un vocal",
  ecouter: "▶",
  repondA: (prenom: string) => `↩ ${prenom}`,
  pourEcrire: "Pour dire quelque chose à tes proches, réagis pendant la vidéo : ils le verront à la seconde.",
  // ✍️ (lot A2) écrire sous la vidéo
  luParTous: "🌍 Lu par tous ceux qui la regardent",
  /** 👥 (lot A6) */
  luParGroupe: (nom: string) => `👥 Lu par ${nom}`,
  quiGroupe: (nom: string) => `Les membres de ${nom}. Ce que vous dites au salon du groupe pendant la vidéo arrive ici aussi.`,
  groupeVide: "Rien encore. Dis-leur ce que tu en as pensé.",
  auSalon: "au salon du groupe",
  luParJeunes: "🌍 Lu par tous les 15-17 ans qui la regardent",
  ecrire: "Écris sous la vidéo…",
  repondreA: (prenom: string) => `↩ Répondre à ${prenom}…`,
  repondre: "↩ Répondre",
  annulerReponse: "✕",
  publier: "Publier",
  accord: "Tous ceux qui regardent cette vidéo verront ta figurine et ce mot. Tu pourras l’effacer quand tu veux.",
  annuler: "Annuler",
  publie: "✓ Ton mot est sous la vidéo.",
  effacer: "Effacer",
  efface: "✓ Ton mot est effacé, partout.",
  signaler: "Signaler",
  /** 📼 (lot A7) la vidéo a quitté YouTube : la discussion reste */
  indisponible: "Cette vidéo n’est plus sur YouTube. Ce qui s’en est dit reste ici.",
  /** 🙈 (lot A7) ne plus voir quelqu'un (la même liste que dans les salons) */
  nePlusVoir: "🙈 Ne plus voir",
  nePlusVu: (prenom: string) => `${prenom} ne passera plus chez toi, ici comme dans les salons.`,
  signale: "Merci : ce mot ne passera plus chez toi, et on va le regarder.",
  refus: (r: string) => `Ton mot ne part pas : ${r}.`,
  vuDans: (nom: string) => `vu dans ${nom}`,
  doucement: "Doucement 🙂 Un mot à la fois.",
  // (dans un salon ouvert, sous ma bulle)
  sousLaVideo: "🌍 Le laisser sous la vidéo",
  sousLaVideoSous: "Ceux qui la regarderont ailleurs le liront",
  voirDiscussion: "💬 Voir la discussion",
  // 🔔 (lot A3) suivre
  suivreTitre: "Cette discussion",
  nouveau: "Nouveau",
  proposerSuivre: "🔔 Te prévenir quand quelqu’un écrit ici ?",
  oui: "Oui",
  pasBesoin: "Pas besoin",
  niveauChoisi: (nom: string) => `✓ ${nom}`,
  introuvable: "Cette discussion n’est plus là : la vidéo a quitté ta télé, et tu n’y as rien dit.",
  age: "Avant de lire leurs mots : as-tu 18 ans ou plus ? Les 15-17 ans ont leur discussion à eux.",
  adulte: "J’ai 18 ans ou plus",
  jeune: "J’ai entre 15 et 17 ans",
  sansCompte: "Crée d’abord ta figurine sur ce téléphone.",
  rate: "La discussion n’a pas pu s’ouvrir. Réessaie dans un instant.",
} as const;
