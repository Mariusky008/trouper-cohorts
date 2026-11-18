/**
 * 🛋️ LE SALON DU DUO — LE CONTRAT COMMUN AUX DEUX SESSIONS (`docs/univers/salon-du-duo.md`, sections 5, 6, 8 et 9).
 *
 * « La pièce est la conversation. » Ce fichier dit ce que les deux sessions se partagent : qui est qui dans la scène, les
 * calques de l'image du duo (section 5), la liste des gestes (section 4.4), et l'API du moteur de la scène (section 6,
 * `src/app/salon/moteur.ts`) — ses ressorts, ses effets, ses sons, ses repères, et le registre où chaque lot enregistre
 * ses mises en scène (les gestes, lot S3 ; le talkie, S4 ; les mèmes, S5…).
 *
 * ⚠️ IL NE CHANGE QUE PAR UNE PR QUI LE DIT DANS SON TITRE (section 9), et l'autre session en est prévenue.
 *
 * Les positions sont en FRACTIONS DE L'IMAGE (de 0 à 1, comme le relevé des pièces) — la maquette les écrivait en
 * pourcents : diviser par 100.
 *
 * Partagé (l'écran et le serveur) : rien ici ne touche au navigateur.
 */
import { PANNEAUX, type Vivant } from "./vivant";
import type { EmplacementsDuo, MomentDuo, PieceDuo, PlaceDuo, Zone } from "./pieces-duo";
import type { Fil } from "./talkie";
import type { Boucle } from "./compagnons";

// ─── QUI EST QUI ─────────────────────────────────────────────────────────────────────────────────────────────────────
/** Dans la scène : « moi » (celui qui regarde) et « autre » (son proche). */
export type Qui = "moi" | "autre";
export const autreQue = (q: Qui): Qui => (q === "moi" ? "autre" : "moi");
/** Un point sur l'image, en fractions (0 à 1). */
export type Point = { x: number; y: number };
/** Le sens où regarde une figurine : vers la droite de l'image (1, celle de gauche) ou vers la gauche (-1). */
export type Sens = 1 | -1;

// ─── LES CALQUES DE L'IMAGE DU DUO (section 5) ───────────────────────────────────────────────────────────────────────
/**
 * Une image d'un calque (avec transparence, recadrée au plus près) et sa boîte sur la pièce. `decoupe` : la partie de
 * l'image à montrer (x, y, largeur, hauteur en fractions de l'image source) — toute l'image sinon.
 */
export type CalqueImage = { fichier: string; boite: Zone; decoupe?: Zone };
/**
 * Une figurine en calques : son corps (le cou compris) et sa tête, qui pivote autour du milieu du cou (`pivot`, sur la
 * pièce) ; sa bouche et ses joues (là où tombent le talkie, la marque 💋, le rouge aux joues), si on les connaît.
 */
export type CalqueFigurine = {
  corps: CalqueImage;
  tete: CalqueImage & { pivot: [number, number] };
  bouche?: [number, number];
  joues?: [[number, number], [number, number]];
};
/**
 * Les calques d'une image du duo (`…-calques.json`, faits par le serveur juste après elle, lot S1) : la plaque (la pièce
 * elle-même, dans la même lumière) et les deux figurines — `a` assise à gauche, `b` à droite. Côté écran, `fichier`
 * est une adresse ; côté serveur, un chemin du seau.
 */
export type CalquesDuo = { plaque: string; a: CalqueFigurine; b: CalqueFigurine };

// ─── L'OUVERTURE D'UNE CONVERSATION (sections 7.2 et 7.4 ; lot S0b) ─────────────────────────────────────────────────
/**
 * 🗂️ Une image de la scène À ADRESSE STABLE (`/api/direct/salon/fichier/<empreinte>-<largeur>.webp`, gardée un an par
 * le téléphone) : la plus grande en `src`, ses largeurs en `srcset` (720 et 1080 points au plus), la taille de l'image
 * d'origine en pixels, et sa vignette floue (`data:`, quelques centaines d'octets) à montrer tout de suite.
 */
export type ImageSalon = { src: string; srcset: string; largeur: number; hauteur: number; flou: string };
/**
 * 🛋️ La scène d'une conversation : la pièce et sa lumière du moment, la plaque (la pièce vide, à adresse stable), les deux
 * places (en points d'assise, de gauche à droite), les emplacements relevés — et, quand le lot S1 les fait, les calques
 * des deux figurines (`a` : celle de gauche).
 */
export type SceneSalon = {
  piece: PieceDuo;
  moment: MomentDuo;
  plaque: ImageSalon;
  places: PlaceDuo[];
  emplacements: EmplacementsDuo | null;
  calques?: { a: CalqueFigurine; b: CalqueFigurine };
  /** (lot S2) le duo a choisi sa pièce (sinon : celle qu'on lui propose, et « Où vous installez-vous ? ») */
  choisie?: boolean;
  /** (lot S2) qui l'a installée là (« ✨ Léa vous a installés sur la terrasse ») */
  installePar?: Qui;
};
/**
 * 🎭 Les calques d'une image du duo, publiés (lot S1) : la plaque et les quatre calques à adresse stable (`fichier` : leur
 * adresse) ; leurs boîtes et les pivots en fractions de la plaque.
 */
export type CalquesSalon = { plaque: ImageSalon; a: CalqueFigurine; b: CalqueFigurine };
/**
 * 🚪 TOUT CE QU'IL FAUT POUR OUVRIR UNE CONVERSATION, EN UNE REQUÊTE (`GET /api/direct/proches?ouvrir=<clé>`) : le fil
 * (les derniers messages), la vie (gestes, apartés, étagère) et la scène — `null` tant que la pièce n'est pas faite.
 */
export type OuvertureSalon = { cle: string; fil: Fil; vivant: Vivant | null; scene: SceneSalon | null; flamme?: Flamme; table?: ObjetTable[]; chat?: ChatSalon };

/**
 * 🐾 (lot S3, section 4.5) LE CHAT DU SALON : celui de l'essai C0, le même pour tous — son nom, ses boucles faites
 * (vidéos sur fond vert, à adresse stable), son vrai son enregistré (le ronronnement), s'il est déposé.
 */
export type ChatSalon = { nom: string; boucles: Partial<Record<Boucle, string>>; son?: string };

// ─── 🌷 LA TABLE (lot S3, section 4.4) ───────────────────────────────────────────────────────────────────────────────
/**
 * Un objet posé sur la table de la pièce par un geste (une tulipe, un café, une surprise) : il reste (les quatre
 * derniers), il suit le duo d'une pièce à l'autre, et se touche (« Camille a laissé une tulipe · 8 h 12 »).
 */
export type ObjetTable = { id: string; e: string; nom: string; moi: boolean; le: string };
/** Comment il arrive sur la table : il pousse (la fleur), il glisse (la tasse), il tombe (la surprise) ; rien : il est là. */
export type EntreeObjet = "pousse" | "glisse" | "tombe";
/** Les places sur la table. */
export const PLACES_TABLE = 4;
/**
 * 🔥 (lot S2, section 4.12) LES JOURS DE SUITE où ils se sont écrit tous les deux : `jours` (aujourd'hui compris si
 * c'est fait) ; `moi`, `lui` : chacun a déjà écrit aujourd'hui (l'heure de Paris) — la flamme monte d'un cran au premier
 * échange du jour.
 */
export type Flamme = { jours: number; moi: boolean; lui: boolean };
/** 🚪 (lot S2, section 4.13) Une pièce où s'installer : sa scène toute prête (les figurines posées à ses places). */
export type PieceDuSalon = { cle: PieceDuo; nom: string; emoji: string; scene: SceneSalon };
/** 🚪 Les pièces prêtes, celle qu'on propose d'abord (la sienne, chez soi), et celle du duo s'il en a choisi une. */
export type CataloguePieces = { pieces: PieceDuSalon[]; proposee: PieceDuo; piece: PieceDuo | null };

// ─── LES GESTES (section 4.4 ; leurs mises en scène : lot S3) ───────────────────────────────────────────────────────
export type CategorieGeste = "attentions" | "ensemble";
/** Les douze gestes de la maquette (💌 Petites attentions, 🛋️ Ensemble). */
export const GESTES = [
  { cle: "coucou", e: "👋", nom: "Coucou", cat: "attentions" },
  { cle: "bisou", e: "😘", nom: "Bisou", cat: "attentions" },
  { cle: "check", e: "🤜", nom: "Check", cat: "attentions" },
  { cle: "chatouilles", e: "🪶", nom: "Chatouilles", cat: "attentions" },
  { cle: "fleur", e: "🌷", nom: "Une fleur", cat: "attentions" },
  { cle: "calin", e: "🤗", nom: "Câlin", cat: "ensemble" },
  { cle: "cafe", e: "☕", nom: "Un café", cat: "ensemble" },
  { cle: "danser", e: "🎶", nom: "Danser", cat: "ensemble" },
  { cle: "clip", e: "📺", nom: "Un clip", cat: "ensemble" },
  { cle: "selfie", e: "📸", nom: "Photo à deux", cat: "ensemble" },
  { cle: "photo", e: "🖼️", nom: "Accrocher", cat: "ensemble" },
  { cle: "surprise", e: "🎁", nom: "Surprise", cat: "ensemble" },
] as const satisfies readonly { cle: string; e: string; nom: string; cat: CategorieGeste }[];
export type CleGesteSalon = (typeof GESTES)[number]["cle"];
/** L'emoji de chacun des huit panneaux d'aujourd'hui (`PANNEAUX`, `vivant.ts`), devenus des petites attentions. */
const EMOJI_PANNEAU: Record<(typeof PANNEAUX)[number]["cle"], string> = {
  mdr: "😂",
  jarrive: "🏃",
  rappelle: "📞",
  bravo: "👏",
  pasdispo: "😴",
  pense: "💭",
  merci: "🙏",
  cesoir: "🌙",
};
/** Une puce de la barre des gestes : un geste, ou un panneau (`panneau` : sa clé dans `PANNEAUX`). */
export type PuceGeste = { cle: string; e: string; nom: string; cat: CategorieGeste; panneau?: (typeof PANNEAUX)[number]["cle"] };
/**
 * La barre des gestes, dans l'ordre de la maquette : les cinq petites attentions, puis les huit panneaux (décidé par le
 * propriétaire le 16 novembre 2026), puis les sept gestes d'ensemble.
 */
export const PUCES_GESTES: PuceGeste[] = [
  ...GESTES.filter((g) => g.cat === "attentions"),
  ...PANNEAUX.map((p) => ({ cle: `panneau-${p.cle}`, e: EMOJI_PANNEAU[p.cle], nom: p.texte.replace(/\s*\p{Extended_Pictographic}+$/u, ""), cat: "attentions" as const, panneau: p.cle })),
  ...GESTES.filter((g) => g.cat === "ensemble"),
];

// ─── L'API DU MOTEUR DE LA SCÈNE (section 6) ─────────────────────────────────────────────────────────────────────────
/**
 * Ce que la caméra regarde : la pièce entière, les deux figurines, une zone (x, y, largeur, hauteur), ou un point et une
 * échelle.
 */
export type Vue = "piece" | "duo" | Zone | { x: number; y: number; echelle: number };

/** Les repères d'une figurine sur la pièce (en fractions), tirés de ses calques. */
export type Repere = "tete" | "haut" | "bouche" | "joue" | "cote" | "main";

/** Les ressorts d'une figurine (la tête sur son ressort, le corps qui respire) : de petits mouvements, la pièce reste en place. */
export interface CommandesFigurine {
  readonly sens: Sens;
  /** Pencher la tête (degrés, vers l'autre figurine), pendant `ms`. */
  pencher(deg: number, ms: number): void;
  /** Gonfler la tête (1 = rien), pendant `ms`. */
  gonfler(echelle: number, ms: number): void;
  /** Un sursaut (la tête saute, tourne un peu). */
  sursaut(force?: number): void;
  /** Secouer la tête (non). */
  secouer(force?: number): void;
  /** La tête sautille comme quand on parle, pendant `sec` secondes. */
  parler(sec?: number): void;
  /** Le fou rire : la tête secouée, des traits de rire, pendant `sec` secondes. */
  rire(sec?: number): void;
  /** Pencher le corps (degrés, vers l'autre), pendant `ms`. */
  pencherCorps(deg: number, ms: number): void;
  /** Se rapprocher de l'autre (en fraction de la largeur), pendant `ms`. */
  rapprocher(fraction: number, ms: number): void;
  /** Un bond sur son siège. */
  bondir(force?: number): void;
  /** Danser pendant `sec` secondes. */
  danser(sec: number): void;
  /** S'assoupir (zZz, la tête penchée) / se réveiller (avec un sursaut). */
  endormir(): void;
  reveiller(): void;
  readonly dort: boolean;
}

/** Une particule de la toile des effets (la maquette, telle quelle ; positions en pixels de la pièce). */
export type Particule = {
  k: "coeur" | "etoile" | "trait" | "rond" | "anneau" | "flash" | "arc" | "emoji" | "texte";
  x: number;
  y: number;
  vie: number;
  s?: number;
  t?: number;
  vx?: number;
  vy?: number;
  ax?: number;
  ay?: number;
  rot?: number;
  vr?: number;
  al?: number;
  fr?: number;
  c?: string | [string, string];
  l?: number;
  e?: string;
  pop?: boolean;
  a0?: number;
  a1?: number;
  bord?: string;
  fondu?: (k: number) => number;
};
/** Un acteur : un emoji qui suit un trajet (`pos`, en pixels de la pièce), le temps d'une mise en scène. */
export type Acteur = {
  e?: string;
  duree: number;
  pos: (u: number, t: number) => { x: number; y: number };
  taille?: (u: number, t: number) => number;
  rot?: (u: number, t: number) => number;
  alpha?: (u: number) => number;
  pivotBas?: boolean;
  trainee?: (q: { x: number; y: number }, dt: number, u: number) => void;
};

/** Les effets de la maquette (positions en fractions de l'image, sauf `part` et `acteur`, en pixels de la pièce). */
export interface EffetsScene {
  /** Une particule (pixels de la pièce : `px` convertit). */
  part(p: Particule): void;
  /** Un acteur ; la promesse est résolue à la fin de son trajet, avec sa dernière position. */
  acteur(a: Acteur): Promise<{ x: number; y: number }>;
  /** Un point de la pièce (fractions) en pixels de la pièce. */
  px(p: Point): { x: number; y: number };
  /** Un centième de la largeur de la pièce, en pixels (l'unité des tailles de la maquette). */
  u(): number;
  eclatCoeurs(p: Point, n?: number): void;
  etincelles(p: Point, n?: number, o?: { f?: number; t?: number }): void;
  anneau(p: Point, couleur?: string, taille?: number): void;
  jaillir(emoji: string, p: Point, n?: number, o?: { taille?: number }): void;
  traitsDeRire(q: Qui): void;
  zZz(q: Qui): void;
  texteQuiMonte(texte: string, p: Point, o?: { v?: number; taille?: number; c?: string; vie?: number }): void;
  /** Le lettrage de BD (« Coucou ! », « Mwah ! ») ; `taille` en fraction de la largeur de la pièce. */
  lettrage(texte: string, p: Point, o?: { couleur?: "rose" | "jaune" | "bleu" | ""; rot?: number; taille?: number; duree?: number }): void;
  /** La scène tremble. */
  secousse(force?: number): void;
  /** Un flash de lumière. */
  flash(p: Point, taille?: number): void;
  /** Rougir (les deux joues), pendant `ms`. */
  rougir(q: Qui, ms?: number): void;
  /** La marque 💋 sur la joue (et le rouge). */
  marqueBisou(q: Qui): void;
  /** (lot S3) La figurine brandit une pancarte au-dessus de sa tête (les panneaux : « J'arrive ! »), pendant `ms`. */
  pancarte(q: Qui, texte: string, ms?: number): Promise<void>;
}

/** Les sons : des bruits et de courtes musiques, jamais une voix (`CLAUDE.md`). Coupés par l'interrupteur de l'iPhone. */
export interface SonsScene {
  bruit(ms: number, volume: number, frequence: number, q?: number): void;
  note(frequence: number, debut: number, duree: number, volume?: number, type?: OscillatorType): void;
  kssht(): void;
  bipFin(): void;
  clac(): void;
  jingle(humeur: string): void;
}

/** Une mise en scène (un geste, un panneau…) : jouée par le moteur, résolue à sa fin. */
export type MiseEnScene = (scene: Scene, de: Qui) => Promise<void>;

/** Les ancres des bulles (pixels du conteneur) : au-dessus de chaque tête, là où la caméra la montre. */
export type AncresBulles = Record<Qui, { x: number; y: number }>;

export interface Scene {
  /** La caméra (1,5 s, ou tout de suite). */
  viser(vue: Vue, anime?: boolean): void;
  /** Les ressorts d'une figurine (rien si elle n'a pas de calques). */
  figurine(q: Qui): CommandesFigurine;
  /** La tête suit une voix (un niveau de 0 à 1, toutes les 60 ms environ). */
  parle(q: Qui, niveau: number): void;
  readonly fx: EffetsScene;
  readonly sons: SonsScene;
  /** Un repère d'une figurine, ou le milieu entre les deux têtes (fractions). */
  repere(q: Qui, r: Repere): Point;
  milieu(): Point;
  /** Jouer une mise en scène enregistrée (rien si elle ne l'est pas) ; plusieurs à la fois s'enchaînent. */
  geste(cle: string, de: Qui): Promise<void>;
  /** Attendre `ms` (annulé avec la scène ; écourté en mouvement réduit). */
  attendre(ms: number): Promise<void>;
  /**
   * (lot S3) Une couche de la pièce, sur toute l'image, sous la caméra (ses enfants se placent en fractions de l'image) :
   * `derriere` — entre la pièce et les figurines (le chat dans son coin) ; `devant` — devant elles (le chat sur mes
   * genoux). La même à chaque appel ; retirée avec la scène.
   */
  couche(rang: "derriere" | "devant"): HTMLElement;
  /** Être appelé à chaque image (dt, t en secondes) — pour le chat, la télé… ; rend de quoi se désabonner. */
  surImage(fn: (dt: number, t: number) => void): () => void;
  /** Une mise en scène est en cours. */
  readonly occupee: boolean;
  /**
   * 🌷 (lot S3) Poser un objet sur la table (`OptionsScene.table`), à une place libre (la plus proche de qui le pose :
   * `o.moi`), sinon à celle du plus ancien ; `entree` : son arrivée (rien : il est déjà là). Rend sa place (fractions de
   * l'image). Un objet déjà posé (même `id`) ne bouge pas.
   */
  poser(o: ObjetTable, entree?: EntreeObjet): Point;
  /**
   * La place qu'aurait le prochain objet posé par `de` (pour y faire voler quelque chose avant) : une place libre, la
   * plus proche de sa figurine.
   */
  placeLibre(de?: Qui): Point;
  /** Retirer un objet de la table. */
  retirer(id: string): void;
  /** Ce qui est sur la table, du plus ancien au plus récent. */
  readonly surTable: readonly ObjetTable[];
  /** `prefers-reduced-motion` : les mises en scène se réduisent à leur fin. */
  readonly reduit: boolean;
  /** Le mode léger s'est mis en route (des images trop lentes) : moins de particules. */
  readonly leger: boolean;
  detruire(): void;
}

/** Ce que l'écran donne au moteur pour créer la scène. */
export type OptionsScene = {
  /** La pièce (adresse) et sa taille en pixels (le rapport compte). */
  plaque: string;
  largeur: number;
  hauteur: number;
  /** Les deux figurines en calques, et le sens où chacune regarde ; une figurine sans calques reste dans la plaque. */
  figurines: Partial<Record<Qui, { calque: CalqueFigurine; sens: Sens }>>;
  /** La place de la pièce dans le cadre : 0 en haut, 0,5 au milieu (la maquette : 0,3). */
  cadrageVertical?: number;
  /** Forcer le mouvement réduit (sinon : `prefers-reduced-motion`). */
  reduit?: boolean;
  /** (lot S2) le moment de la pièce : les figurines en prennent la teinte (plus chaude le soir, plus sombre la nuit). */
  moment?: MomentDuo;
  /** Les ancres des bulles, à chaque changement de caméra ou de taille (jamais à chaque image). */
  surAncres?: (a: AncresBulles) => void;
  /** Le mode léger vient de se mettre en route. */
  surLeger?: () => void;
  /** 🌷 (lot S3) la table basse de la pièce (son relevé) : les objets s'y posent ; sans elle, entre les deux figurines. */
  table?: Zone;
  /** Un objet de la table est touché. */
  surObjet?: (o: ObjetTable) => void;
};

// ─── LE REGISTRE DES MISES EN SCÈNE ──────────────────────────────────────────────────────────────────────────────────
const REGISTRE = new Map<string, MiseEnScene>();
/** Enregistrer une mise en scène (un geste : sa clé de `GESTES` ; un panneau : `panneau-<clé>`…). */
export function enregistrerMiseEnScene(cle: string, jouer: MiseEnScene): void {
  REGISTRE.set(cle, jouer);
}
export const miseEnSceneDe = (cle: string): MiseEnScene | undefined => REGISTRE.get(cle);
