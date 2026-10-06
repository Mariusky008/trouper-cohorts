/**
 * 👻 MON FANTÔME — un seul look par personne, réutilisé partout : Ensemble,
 * les conversations, Ma maison.
 *
 * Des looks PRÉPARÉS À L'AVANCE, sans génération au moment du choix. Les noms
 * décrivent un style ; ils ne changent aucun droit ni aucun comportement.
 *
 * DOUZE LOOKS, chacun en plusieurs poses superposables : assis tasse en
 * main (les scènes), la même main levée (le salut), les yeux fermés (le
 * clignement), et bras ouverts (le sélecteur). Un look n'est proposé que s'il
 * a son image ; le compteur du sélecteur compte les looks disponibles.
 *
 * L'IDENTIFIANT EST RATTACHÉ À L'HABITANT (le cookie de l'appareil), jamais au
 * prénom. Sur un autre appareil, sans le même cookie, le look n'est pas
 * retrouvé automatiquement : c'est la limite de l'identité actuelle.
 */
export type Look = {
  id: string;
  nom: string;
  /** Les accessoires, en quelques mots. */
  style: string;
  /** Une courte phrase de caractère, sous le nom (« Curieux, toujours partant. »). */
  devise: string;
  /** L'image assise (provisoire tant que les quatre poses n'existent pas). */
  image?: string;
  /** Largeur / hauteur de l'image. */
  r: number;
  /** La pose debout, bras ouverts : le sélecteur et « Ton fantôme est prêt ». */
  debout?: string;
  /** Vu de face (les autres images sont de trois quarts, retournées à droite). */
  frontal?: boolean;
  /** Agrandissement dans les scènes, pour que tous aient la même carrure (le chapeau compte dans la hauteur). */
  echelle?: number;
  /** Assis, une main levée qui salue : superposable au pixel à `image`. */
  salue?: string;
  /** Les mêmes images, yeux fermés, superposables au pixel (le clignement). */
  cligne?: string;
  deboutCligne?: string;
};

const D = "/direct/ensemble/";
export const TOUS_LES_LOOKS: Look[] = [
  { id: "flaneur", nom: "Le Flâneur", style: "Casquette marine, écharpe moutarde.", devise: "Curieux, toujours partant.", image: `${D}flaneur-assis.webp`, r: 0.9, debout: `${D}flaneur-debout.webp`, frontal: true, cligne: `${D}flaneur-assis-cligne.webp`, deboutCligne: `${D}flaneur-debout-cligne.webp` },
  { id: "cosy", nom: "Le Cosy", style: "Bonnet terracotta, écharpe vert sauge.", devise: "Un plaid, un thé, et on refait le monde.", image: `${D}cosy-assis.webp`, r: 0.663, debout: `${D}cosy-debout.webp`, frontal: true, echelle: 1.12, cligne: `${D}cosy-cligne.webp`, salue: `${D}cosy-salue.webp` },
  { id: "artiste", nom: "L'Artiste", style: "Béret bordeaux, lunettes rondes.", devise: "Toujours un carnet dans la poche.", image: `${D}artiste-assis.webp`, r: 0.691, debout: `${D}artiste-debout.webp`, frontal: true, echelle: 1.12, cligne: `${D}artiste-cligne.webp`, salue: `${D}artiste-salue.webp` },
  { id: "fleuri", nom: "Le Fleuri", style: "Couronne de marguerites, foulard pêche.", devise: "Toujours une fleur à offrir.", image: `${D}fleuri-assis.webp`, r: 0.741, debout: `${D}fleuri-debout.webp`, frontal: true, echelle: 1.12, cligne: `${D}fleuri-cligne.webp`, salue: `${D}fleuri-salue.webp` },
  { id: "jardinier", nom: "Le Jardinier", style: "Chapeau de paille, salopette verte.", devise: "Les mains dans la terre, le cœur en fleurs.", image: `${D}jardinier-assis.webp`, r: 0.815, debout: `${D}jardinier-debout.webp`, frontal: true, echelle: 1.12, cligne: `${D}jardinier-cligne.webp`, salue: `${D}jardinier-salue.webp` },
  { id: "denim", nom: "Le Denim", style: "Casquette et veste en jean.", devise: "Toujours partant pour une virée.", image: `${D}denim-assis.webp`, r: 0.65, debout: `${D}denim-debout.webp`, frontal: true, echelle: 1.12, cligne: `${D}denim-cligne.webp`, salue: `${D}denim-salue.webp` },
  { id: "voyageur", nom: "Le Voyageur", style: "Bob, foulard bleu, petite sacoche.", devise: "Toujours un plan pour le prochain départ.", image: `${D}voyageur-assis.webp`, r: 0.741, debout: `${D}voyageur-debout.webp`, frontal: true, echelle: 1.12, cligne: `${D}voyageur-cligne.webp`, salue: `${D}voyageur-salue.webp` },
  { id: "lecteur", nom: "Le Lecteur", style: "Lunettes rondes dorées, cardigan beige.", devise: "Un livre d’avance sur tout le monde.", image: `${D}lecteur-assis.webp`, r: 0.753, debout: `${D}lecteur-debout.webp`, frontal: true, echelle: 1.12, cligne: `${D}lecteur-cligne.webp`, salue: `${D}lecteur-salue.webp` },
  { id: "melomane", nom: "Le Mélomane", style: "Casque audio, écharpe corail.", devise: "Une chanson pour chaque moment.", image: `${D}melomane-assis.webp`, r: 0.787, debout: `${D}melomane-debout.webp`, frontal: true, echelle: 1.12, cligne: `${D}melomane-cligne.webp`, salue: `${D}melomane-salue.webp` },
  { id: "curieux", nom: "Le Curieux", style: "Casquette à l’envers, doudoune moutarde.", devise: "Il pose toujours la question de trop.", image: `${D}curieux-assis.webp`, r: 0.728, debout: `${D}curieux-debout.webp`, frontal: true, echelle: 1.12, cligne: `${D}curieux-cligne.webp`, salue: `${D}curieux-salue.webp` },
  { id: "rebelle", nom: "Le Rebelle", style: "Bonnet noir, bandana rouge, perfecto.", devise: "Jamais là où on l’attend.", image: `${D}rebelle-assis.webp`, r: 0.678, debout: `${D}rebelle-debout.webp`, frontal: true, echelle: 1.12, cligne: `${D}rebelle-cligne.webp`, salue: `${D}rebelle-salue.webp` },
  { id: "soleil", nom: "Le Soleil", style: "Bandeau orange, écharpe moutarde.", devise: "La bonne humeur en plus.", image: `${D}soleil-assis.webp`, r: 0.685, debout: `${D}soleil-debout.webp`, frontal: true, echelle: 1.12, cligne: `${D}soleil-cligne.webp`, salue: `${D}soleil-salue.webp` },
];
/** Les looks qu'on peut choisir aujourd'hui : ceux qui ont une image. */
export const LOOKS = TOUS_LES_LOOKS.filter((l): l is Look & { image: string } => Boolean(l.image));
export const LOOK_PAR_DEFAUT = LOOKS[0].id;
export const lookDe = (id: string | null | undefined): Look & { image: string } => LOOKS.find((l) => l.id === id) ?? LOOKS[0];
export const lookValide = (id: unknown): id is string => typeof id === "string" && LOOKS.some((l) => l.id === id);

/**
 * LE LOOK D'UN AUTRE MEMBRE qui n'en a pas choisi : stable, tiré de son
 * empreinte dans le salon (un identifiant, pas son prénom).
 */
export function lookParDefautDe(empreinte: string): Look & { image: string } {
  let h = 2166136261;
  for (const c of empreinte) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return LOOKS[h % LOOKS.length];
}

// ═══ LE MIEN, SUR CET APPAREIL ════════════════════════════════════════════
const CLE = "clikme-look-v1";
type Etat = { id: string; choisi: boolean };
let cache: Etat | null = null;
const abonnes = new Set<() => void>();

function lire(): Etat {
  if (cache) return cache;
  let e: Etat = { id: LOOK_PAR_DEFAUT, choisi: false };
  if (typeof window !== "undefined") {
    try {
      const j = JSON.parse(window.localStorage.getItem(CLE) || "null") as Partial<Etat> | null;
      if (j && lookValide(j.id)) e = { id: j.id, choisi: Boolean(j.choisi) };
    } catch {
      /* rien de gardé */
    }
  }
  cache = e;
  return e;
}
function ecrire(e: Etat) {
  cache = e;
  try {
    window.localStorage.setItem(CLE, JSON.stringify(e));
  } catch {
    /* la session continue en mémoire */
  }
  abonnes.forEach((f) => f());
}

/** Mon look (celui par défaut tant que je n'ai rien choisi). */
export const monLook = (): Look & { image: string } => lookDe(lire().id);
/** Ai-je déjà répondu au sélecteur (choisi, ou « Choisir plus tard ») ? */
export const lookDecide = (): boolean => lire().choisi;
export function abonnerLook(f: () => void) {
  abonnes.add(f);
  return () => void abonnes.delete(f);
}

let envoi: ((id: string) => void) | null = null;
/** La vraie ville branche ici l'envoi du look au serveur. */
export function brancherEnvoiDuLook(f: ((id: string) => void) | null) {
  envoi = f;
}

/** Garder ce look. `choisi` : la question ne sera plus posée. */
export function garderLook(id: string) {
  if (!lookValide(id)) return;
  ecrire({ id, choisi: true });
  envoi?.(id);
}

/** Le serveur connaît déjà mon look (un autre onglet, une autre visite) : on le reprend. */
export function lookDuServeur(id: unknown) {
  if (!lookValide(id)) return;
  const e = lire();
  if (e.id !== id || !e.choisi) ecrire({ id, choisi: true });
}

/** Pour les essais : tout oublier. */
export function oublierLook() {
  cache = null;
  try {
    window.localStorage.removeItem(CLE);
  } catch {
    /* rien */
  }
  abonnes.forEach((f) => f());
}
