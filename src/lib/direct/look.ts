/**
 * 👻 MON FANTÔME — un seul look par personne, réutilisé partout : Ensemble,
 * les conversations, Ma maison.
 *
 * Des looks PRÉPARÉS À L'AVANCE, sans génération au moment du choix. Les noms
 * décrivent un style ; ils ne changent aucun droit ni aucun comportement.
 *
 * LES DOUZE LOOKS VALIDÉS. Leurs images arrivent par modules (Le Flâneur en
 * premier, dans ses quatre poses). En attendant, un look n'est proposé que
 * s'il a déjà une image qui lui ressemble vraiment, prise parmi les fantômes
 * du dépôt — jamais une copie répétée pour faire nombre. Le compteur du
 * sélecteur compte donc les looks réellement disponibles.
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
};

const D = "/direct/ensemble/";
export const TOUS_LES_LOOKS: Look[] = [
  { id: "flaneur", nom: "Le Flâneur", style: "Casquette marine, écharpe moutarde.", devise: "Curieux, toujours partant.", image: `${D}fantome-casquette-bleue.webp`, r: 0.885 },
  { id: "cosy", nom: "Le Cosy", style: "Bonnet terracotta, écharpe vert sauge.", devise: "Un plaid, un thé, et on refait le monde.", image: `${D}fantome-bonnet.webp`, r: 0.929 },
  { id: "artiste", nom: "L'Artiste", style: "Béret bordeaux, lunettes rondes.", devise: "Toujours un carnet dans la poche.", image: `${D}fantome-beret-rouge.webp`, r: 0.777 },
  { id: "jardinier", nom: "Le Jardinier", style: "Couronne de fleurs, foulard crème.", devise: "Les mains dans la terre, le cœur en fleurs.", r: 0.85 },
  { id: "voyageur", nom: "Le Voyageur", style: "Casquette en jean, bandana bleu.", devise: "Toujours un plan pour le prochain départ.", r: 0.85 },
  { id: "lecteur", nom: "Le Lecteur", style: "Lunettes rondes, cardigan beige.", devise: "Un livre d’avance sur tout le monde.", image: `${D}fantome-lunettes-rouges.webp`, r: 0.821 },
  { id: "melomane", nom: "Le Mélomane", style: "Casque audio, bonnet noir.", devise: "Une chanson pour chaque moment.", r: 0.85 },
  { id: "curieux", nom: "Le Curieux", style: "Casquette moutarde, petite sacoche.", devise: "Il pose toujours la question de trop.", r: 0.85 },
  { id: "reveur", nom: "Le Rêveur", style: "Bonnet lavande, écharpe bleu nuit.", devise: "La tête dans les étoiles.", image: `${D}fantome-echarpe-violette.webp`, r: 0.833 },
  { id: "local", nom: "Le Local", style: "Béret basque, foulard écru.", devise: "Connaît chaque recoin de la ville.", image: `${D}fantome-beret-noir.webp`, r: 0.746 },
  { id: "rebelle", nom: "Le Rebelle", style: "Bonnet noir, bandana rouge.", devise: "Jamais là où on l’attend.", r: 0.85 },
  { id: "soleil", nom: "Le Soleil", style: "Bob orange, lunettes teintées.", devise: "La bonne humeur en plus.", r: 0.85 },
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
