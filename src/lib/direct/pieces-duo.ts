/**
 * 🛋️ LA PIÈCE DU DUO — la décision du 15 novembre 2026 (`docs/univers/piece-du-duo.md`). Le propriétaire : « que
 * penses-tu de pouvoir choisir la pièce dans laquelle on se sent bien avec cette personne (et on peut en changer selon
 * l'humeur) […] avec toujours les mêmes éléments (télé, disque, cadre, le chat…) ? » ; puis « oui », avec ces cinq
 * pièces, et leurs images faites par une page d'essai de l'admin.
 *
 * Chaque conversation se passe dans une pièce choisie à deux (et changée selon l'humeur) ; toutes les pièces ont LES
 * MÊMES EMPLACEMENTS — la télé (les liens partagés), la platine (la chanson), les cadres (les photos), l'étagère (les
 * rendez-vous, les souvenirs), la fenêtre (la vue), deux places, le coin du chat — : chaque chose ne se fait qu'une fois,
 * et suit le duo d'une pièce à l'autre. Les pièces sont un catalogue, fait une fois pour tous (comme les compagnons).
 *
 * Ce fichier est partagé (l'écran et le serveur).
 */

export const PIECES_DUO = [
  {
    cle: "salon",
    nom: "Le salon",
    pour: "entre amis",
    emoji: "🛋️",
    lieu: "a cosy living room",
    places: "a deep sofa and an armchair, slightly turned toward each other, on a soft rug",
    vue: "a large window with a view on the roofs of a small city at golden hour",
    chat: "a round cat basket with a cushion on the floor, near the sofa",
    tele: "a flat TV on the wall or on a low TV cabinet",
  },
  {
    cle: "cuisine",
    nom: "La cuisine",
    pour: "en famille",
    emoji: "🍳",
    lieu: "a warm family kitchen",
    places: "a wooden table with two chairs facing each other",
    vue: "a window above the sink with a view on a green garden",
    chat: "a cushion for a cat on a bench or near the radiator",
    tele: "a small flat TV on the wall above the counter",
  },
  {
    cle: "terrasse",
    nom: "La terrasse",
    pour: "pour un verre au soleil (sans alcool)",
    emoji: "🌇",
    lieu: "a covered terrace under a wooden pergola with string lights, against the wall of a house",
    places: "two comfortable outdoor armchairs facing each other, with a small low table holding two glasses of lemonade",
    vue: "beyond the railing, an open view on hills and a village at sunset",
    chat: "a cushion for a cat on a wooden bench",
    tele: "a flat TV mounted on the house wall, sheltered under the pergola",
  },
  {
    cle: "chambre",
    nom: "La chambre vue mer",
    pour: "en amoureux",
    emoji: "🌊",
    lieu: "a cosy, softly lit bedroom (tender and peaceful, nothing suggestive)",
    places: "a large bed with soft linen and cushions, where two small characters can sit side by side on its edge, facing us",
    vue: "a large bay window with a wide view on the sea",
    chat: "a round cat basket at the foot of the bed",
    tele: "a flat TV on a side wall, turned toward the bed and toward us",
  },
  {
    cle: "cafe",
    nom: "Le café",
    pour: "pour un café, entre copains",
    emoji: "☕",
    lieu: "a charming small café corner",
    places: "a booth bench and a chair around a small round table holding two cups of coffee",
    vue: "a big window on a lively street",
    chat: "a cushion for a cat on the window seat",
    tele: "a flat TV on the wall",
  },
] as const;
export type PieceDuo = (typeof PIECES_DUO)[number]["cle"];
export const pieceDuoValide = (x: unknown): x is PieceDuo => PIECES_DUO.some((p) => p.cle === x);
export const pieceDuoDe = (x: PieceDuo) => PIECES_DUO.find((p) => p.cle === x)!;

/** Une zone sur l'image : x, y, largeur, hauteur, de 0 à 1. */
export type Zone = [number, number, number, number];
/** Où une figurine s'assoit : le point où elle touche son siège, et sa hauteur assise (en part de l'image). */
export type PlaceDuo = { x: number; y: number; hauteur: number };
/** Les emplacements, relevés sur la pièce par un modèle qui voit. */
export type EmplacementsDuo = {
  tele?: Zone;
  platine?: Zone;
  cadres: Zone[];
  etagere?: Zone;
  fenetre?: Zone;
  places: PlaceDuo[];
  chat?: { x: number; y: number };
};

/** Les emplacements, tels qu'on les montre (l'emoji, le nom). */
export const EMPLACEMENTS_DITS = {
  tele: { emoji: "📺", nom: "La télé", sert: "les liens que vous vous envoyez" },
  platine: { emoji: "🎵", nom: "La platine", sert: "votre chanson" },
  cadres: { emoji: "🖼️", nom: "Les cadres", sert: "vos photos" },
  etagere: { emoji: "📚", nom: "L’étagère", sert: "vos rendez-vous, vos souvenirs" },
  fenetre: { emoji: "🪟", nom: "La fenêtre", sert: "la vue, le temps qu’il fait" },
  places: { emoji: "🪑", nom: "Vos deux places", sert: "vos figurines" },
  chat: { emoji: "🐾", nom: "Le coin du chat", sert: "votre compagnon" },
} as const;

const fraction = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= 1 ? x : null);
function zoneValide(x: unknown): Zone | undefined {
  if (!Array.isArray(x) || x.length !== 4) return undefined;
  const z = x.map(fraction);
  if (z.some((v) => v === null)) return undefined;
  const [a, b, l, h] = z as number[];
  return l > 0.01 && h > 0.01 && a + l <= 1.02 && b + h <= 1.02 ? [a, b, l, h] : undefined;
}

/** Les emplacements relevés, vérifiés (des fractions de l'image ; ce qui est faux est laissé de côté). */
export function emplacementsValides(o: unknown): EmplacementsDuo {
  const r = (o ?? {}) as Record<string, unknown>;
  const places = (Array.isArray(r.places) ? r.places : [])
    .map((p) => {
      const q = (p ?? {}) as Record<string, unknown>;
      const x = fraction(q.x);
      const y = fraction(q.y);
      const hauteur = fraction(q.hauteur);
      return x !== null && y !== null && hauteur !== null && hauteur >= 0.08 && hauteur <= 0.6 ? { x, y, hauteur } : null;
    })
    .filter((p): p is PlaceDuo => Boolean(p))
    .slice(0, 2);
  const c = (r.chat ?? {}) as Record<string, unknown>;
  const cx = fraction(c.x);
  const cy = fraction(c.y);
  const tele = zoneValide(r.tele);
  const platine = zoneValide(r.platine);
  const etagere = zoneValide(r.etagere);
  const fenetre = zoneValide(r.fenetre);
  return {
    ...(tele ? { tele } : {}),
    ...(platine ? { platine } : {}),
    cadres: (Array.isArray(r.cadres) ? r.cadres : []).map(zoneValide).filter((z): z is Zone => Boolean(z)).slice(0, 4),
    ...(etagere ? { etagere } : {}),
    ...(fenetre ? { fenetre } : {}),
    places,
    ...(cx !== null && cy !== null ? { chat: { x: cx, y: cy } } : {}),
  };
}

/** Ce que la page d'essais montre de chaque pièce. */
export type PieceDuoVue = { cle: PieceDuo; nom: string; pour: string; emoji: string; decor?: string; emplacements?: EmplacementsDuo; releveRate?: string };
export type EtatPiecesDuo = { pieces: PieceDuoVue[]; moteurs: { image: boolean; regard: boolean } };

/** 💶 Le coût, environ (novembre 2026) : une pièce en haute qualité ; le relevé, quelques millièmes. */
export const COUT_PIECE_DUO = 0.17;

// ─── 🧩 L'EFFET « COLLAGE » : LE PREMIER ESSAI DE LA MAQUETTE (`piece-du-duo.md`, section 5) ─────────────────────────
/**
 * Deux vraies figurines dans une vraie pièce, de deux façons, côte à côte : POSÉES sur l'image de la pièce (chacune
 * assise sans son fauteuil, faite une fois par personne ; une ombre au sol, la lumière de la pièce, la taille de son
 * siège), ou GÉNÉRÉES avec la pièce (une image du duo, faite une fois par duo et par pièce). Le propriétaire choisit en
 * regardant les deux.
 */
export type FigurineDuo = { id: string; nom: string; image: string };
export type ChoixCollage = { piece: PieceDuo; a: string; b: string; avis?: AvisCollage; note?: string };
export const AVIS_COLLAGE = [
  { cle: "posees", dit: "👍 Les posées tiennent" },
  { cle: "generee", dit: "👍 La générée, nettement mieux" },
  { cle: "aucune", dit: "👎 Aucune ne va" },
] as const;
export type AvisCollage = (typeof AVIS_COLLAGE)[number]["cle"];
export const avisCollageValide = (x: unknown): x is AvisCollage => AVIS_COLLAGE.some((a) => a.cle === x);
export type EtatCollage = {
  figurines: FigurineDuo[];
  choix: ChoixCollage | null;
  /** (le choix) la pièce, ses deux places (de gauche à droite), et ce qui est fait */
  decor?: string;
  places: PlaceDuo[];
  poses: { a?: string; b?: string };
  generee?: string;
  moteur: boolean;
};
/** Deux places, si la pièce n'a pas été relevée. */
export const PLACES_PAR_DEFAUT: PlaceDuo[] = [
  { x: 0.36, y: 0.72, hauteur: 0.3 },
  { x: 0.64, y: 0.72, hauteur: 0.3 },
];
/** Sur la figurine assise sans fauteuil (détourée au plus près), le point qui touche le siège, de haut en bas. */
export const ANCRE_ASSISE = 0.66;
/** 💶 Deux poses sans fauteuil et une image du duo, environ. */
export const COUT_COLLAGE = 0.55;
