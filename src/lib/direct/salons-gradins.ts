/**
 * 🎭 LES GRADINS DES SALONS OUVERTS (`docs/univers/decouvrir.md`, section 27) — ce qui ne dépend pas de l'écran.
 *
 * Le propriétaire, le 20 novembre 2026 : « fais-moi une proposition de décor où on peut accueillir les figurines […] même
 * la table, je ne suis pas vraiment fan », puis, sur la proposition du gradin : « ok pour le gradin, fais les décors ».
 *
 * Un décor par lieu (onze lieux pour les douze passions : les séries et la télé-réalité partagent la petite salle de
 * cinéma), une seule image carrée (1024 × 1024), dans le style des pièces : **huit emplacements face à toi, sur deux
 * marches** — quatre devant, au sol, en bas de l'image ; quatre derrière, sur une marche plus haute. Chaque figurine
 * arrive assise dans son propre fauteuil : un emplacement est un petit tapis rond, vide, dans le style du lieu (une place
 * libre brille doucement à l'écran). Fabriqué une fois sur la page de l'administrateur, d'après un plan des huit
 * emplacements (`PLAN_GRADIN`), relevé, puis **validé par le propriétaire** : seul un gradin validé va dans les salons.
 *
 * Les places sont rangées dans l'ordre des places du salon (`PLACES_DU_SALON`) : devant, du milieu vers les bords, puis
 * derrière, du milieu vers les bords — les premiers arrivés au centre.
 *
 * FICHIER PARTAGÉ (l'écran et le serveur).
 */
import type { ImageSalon } from "./salon";
import type { IdTheme } from "./decouvrir";

export type IdGradin = "cinema" | "tribune" | "concert" | "arcade" | "comptoir" | "defile" | "cafe-theatre" | "jardin" | "club-manga" | "bibliotheque" | "cocon";

/**
 * Les onze lieux : leur nom (en français, pour la page de l'administrateur), et, pour le moteur d'image (en anglais),
 * le lieu et ses huit emplacements.
 */
export const GRADINS: readonly { id: IdGradin; nom: string; e: string; themes: readonly IdTheme[]; lieu: string; tapis: string }[] = [
  {
    id: "cinema",
    nom: "La petite salle de cinéma",
    e: "🎬",
    themes: ["series", "tele"],
    lieu: "a small, cosy private cinema room: deep red velvet everywhere, heavy curtains on the side walls, small warm wall lamps, a soft glow, popcorn boxes on a little side table",
    tapis: "a small round red velvet rug with a gold edge",
  },
  {
    id: "tribune",
    nom: "La tribune du stade",
    e: "⚽",
    themes: ["foot"],
    lieu: "the stand of a small football stadium at dusk: concrete steps, scarves and flags hanging on the railing, the floodlights glowing high behind",
    tapis: "a round mat painted in bright team colours on the concrete step",
  },
  {
    id: "concert",
    nom: "La petite salle de concert",
    e: "🎵",
    themes: ["musique"],
    lieu: "a small, intimate concert venue: warm coloured stage lights and a mirror ball high in the background, amplifiers, a guitar on a stand, fairy lights",
    tapis: "a round, soft and colourful floor mat (like a flattened beanbag)",
  },
  {
    id: "arcade",
    nom: "La salle d'arcade",
    e: "🎮",
    themes: ["jeux"],
    lieu: "a retro arcade hall: glowing arcade cabinets lined up in the background, neon light strips in pink and blue, a claw machine, a checkered floor",
    tapis: "a round mat with a softly glowing neon edge",
  },
  {
    id: "comptoir",
    nom: "Le comptoir de la cuisine",
    e: "🍳",
    themes: ["cuisine"],
    lieu: "a big, warm open kitchen: a wooden counter, copper pots hanging, baskets of vegetables and fruit, fresh bread, herbs on the window sill, a soft steam from a pot",
    tapis: "a round woven kitchen mat",
  },
  {
    id: "defile",
    nom: "Le premier rang du défilé",
    e: "👗",
    themes: ["mode"],
    lieu: "the front row of a small, chic fashion show: the white runway and its soft spotlights in the background, a backdrop of fabric drapes, flowers",
    tapis: "a round white rug with a thin gold line",
  },
  {
    id: "cafe-theatre",
    nom: "Le café-théâtre",
    e: "😂",
    themes: ["humour"],
    lieu: "a small café-théâtre: red brick walls, warm string bulbs, a little stage with a red curtain on one side, old show posters without any text",
    tapis: "a round burgundy velvet rug",
  },
  {
    id: "jardin",
    nom: "Le jardin",
    e: "🐾",
    themes: ["animaux"],
    lieu: "a sunny garden: soft green grass, flowers, a big tree, a little wooden doghouse, a bird feeder, butterflies",
    tapis: "a round wooden deck in the grass",
  },
  {
    id: "club-manga",
    nom: "Le club manga",
    e: "🍥",
    themes: ["manga"],
    lieu: "a cosy manga club room: shelves full of colourful comic book spines (no readable text), paper lanterns, posters with drawings and no text, a low table with snacks",
    tapis: "a big round floor cushion, flat, in a bright colour",
  },
  {
    id: "bibliotheque",
    nom: "La bibliothèque",
    e: "📚",
    themes: ["revisions"],
    lieu: "a warm old library: tall wooden bookshelves full of books, green desk lamps, a big window with soft daylight, a ladder against the shelves",
    tapis: "a round, soft reading rug",
  },
  {
    id: "cocon",
    nom: "Le grand salon cosy",
    e: "👶",
    themes: ["parents"],
    lieu: "a big, calm and cosy living room: soft pastel colours, plants, a basket of soft toys, a knitted blanket, warm lamps",
    tapis: "a round, thick and soft rug",
  },
];
export const gradinDe = (id: IdGradin) => GRADINS.find((g) => g.id === id)!;
export const gradinValide = (x: unknown): x is IdGradin => GRADINS.some((g) => g.id === x);
/** Le lieu d'une passion. */
export const gradinDuTheme = (t: IdTheme): IdGradin => (GRADINS.find((g) => g.themes.includes(t)) ?? GRADINS[0]).id;

/** Un emplacement : le centre du tapis, au sol (là où se posent les pieds du fauteuil), et la hauteur de la figurine assise. */
export type PlaceGradin = { x: number; y: number; hauteur: number };
export const PLACES_GRADIN = 8;
/** L'image d'un gradin : carrée. */
export const COTE_GRADIN = 1024;
/** Ses largeurs servies (le téléphone, l'ordinateur). */
export const LARGEURS_GRADIN = [768, 1024] as const;

/**
 * 📐 LE PLAN DES HUIT EMPLACEMENTS (en parts de l'image), dans l'ordre des places : devant (au sol, en bas), du milieu
 * vers les bords ; derrière (sur la marche), du milieu vers les bords. Les têtes de devant restent sous la marche : on
 * voit toutes les figurines, et chaque prénom.
 */
export const PLAN_GRADIN: readonly PlaceGradin[] = [
  { x: 0.375, y: 0.9, hauteur: 0.27 },
  { x: 0.625, y: 0.9, hauteur: 0.27 },
  { x: 0.13, y: 0.9, hauteur: 0.27 },
  { x: 0.87, y: 0.9, hauteur: 0.27 },
  { x: 0.4, y: 0.6, hauteur: 0.21 },
  { x: 0.6, y: 0.6, hauteur: 0.21 },
  { x: 0.2, y: 0.6, hauteur: 0.21 },
  { x: 0.8, y: 0.6, hauteur: 0.21 },
];

/**
 * 🛋️ (21 novembre 2026, « Ma télé du jour » et la séance chez moi : « la même chose, mais avec seulement 4 places pour
 * nos amis ») Les quatre places d'une séance, sans décor : les deux du milieu devant, une de chaque côté — plus grandes
 * que celles d'un salon de huit.
 */
export const PLAN_SEANCE: readonly PlaceGradin[] = [
  { x: 0.375, y: 0.92, hauteur: 0.34 },
  { x: 0.625, y: 0.92, hauteur: 0.34 },
  { x: 0.14, y: 0.86, hauteur: 0.3 },
  { x: 0.86, y: 0.86, hauteur: 0.3 },
];

const fraction = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 1 ? Math.round(n * 1000) / 1000 : null;
};

/**
 * Les places relevées sur l'image, si elles tiennent debout : EXACTEMENT huit, chacune dans l'image, d'une taille
 * plausible (de 8 % à 50 % de sa hauteur) — rangées dans l'ordre des places (les quatre plus basses devant). Sinon `null`
 * (on garde le plan).
 */
export function placesGradinValides(x: unknown): PlaceGradin[] | null {
  const l = (Array.isArray(x) ? x : [])
    .map((p) => {
      const q = (p ?? {}) as Record<string, unknown>;
      const px = fraction(q.x);
      const py = fraction(q.y);
      const h = fraction(q.hauteur);
      return px === null || py === null || h === null || h < 0.08 || h > 0.5 || py - h < 0 ? null : { x: px, y: py, hauteur: h };
    })
    .filter((p): p is PlaceGradin => p !== null);
  if (l.length !== PLACES_GRADIN) return null;
  const parY = [...l].sort((a, b) => b.y - a.y);
  const rang = (r: PlaceGradin[]) => r.sort((a, b) => Math.abs(a.x - 0.5) - Math.abs(b.x - 0.5) || a.x - b.x);
  return [...rang(parY.slice(0, 4)), ...rang(parY.slice(4))];
}

/** 🎭 Le gradin d'un salon, à l'écran : son image (à adresse stable) et ses huit places. */
export type GradinScene = { id: IdGradin; nom: string; image: ImageSalon; places: PlaceGradin[] };

/** D'où viennent ses places : relevées par un modèle qui voit, le plan, ou posées à la main. */
export type SourcePlaces = "regard" | "plan" | "main";

/** (la page de l'administrateur) un gradin : où il en est. */
export type GradinVue = {
  id: IdGradin;
  nom: string;
  e: string;
  themes: IdTheme[];
  /** son image (signée), si elle est faite */
  image?: string;
  places?: PlaceGradin[];
  source?: SourcePlaces;
  /** le relevé n'a pas marché : on a gardé le plan (pourquoi) */
  releveRate?: string;
  valide: boolean;
  /** quand il a été validé */
  le?: string;
};
export type EtatGradins = { gradins: GradinVue[]; moteurs: { image: boolean; regard: boolean } };

export const PHRASES_GRADINS = {
  titre: "🎭 Les gradins des salons ouverts",
  chapo:
    "Un décor par lieu, huit emplacements de face, sur deux marches (quatre devant, quatre derrière). Chaque figurine arrive dans son fauteuil : un emplacement est un petit tapis rond, vide. « Fabriquer » fait le décor, puis relève ses huit emplacements ; vous le validez quand il vous plaît — seul un gradin validé va dans les salons (sinon, le salon garde sa pièce).",
  fabriquer: "🛠️ Fabriquer",
  refaireDecor: "↺ Refaire le décor",
  refaireReleve: "↺ Refaire le relevé",
  plan: "📐 Prendre le plan",
  valider: "✓ Valider",
  retirer: "Retirer des salons",
  valide: "✓ Dans les salons",
  aFaire: "Pas encore fait",
  aValider: "À valider",
  source: { regard: "relevées sur l’image", plan: "le plan", main: "posées à la main" } satisfies Record<SourcePlaces, string>,
};
