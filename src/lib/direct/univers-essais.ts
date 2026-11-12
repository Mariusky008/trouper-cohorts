/**
 * 🧪 LES ESSAIS DU LOT 0 (chantier « Univers », `docs/univers/feuille-de-route.md`, lot 0) — ce que la page d'essais
 * de l'admin (`/admin/humain/univers-essais`) fait faire au moteur d'image, avant tout écran : la figurine du nouveau
 * style (une figurine de collection réaliste, assise dans son fauteuil — section 3 de la feuille de route), et sa
 * constance (la même figurine, bouche ouverte, trois visages, debout).
 *
 * Les selfies viennent de volontaires qui sont d'accord (le propriétaire le coche à chaque dépôt) ; ils restent dans le
 * seau privé, s'effacent d'un geste avec leurs images, et ne vont jamais dans le dépôt de code.
 *
 * LES CONSIGNES SONT EN ANGLAIS (c'est là que le moteur est le plus précis). Les anciennes (le ressort, le socle, le
 * personnage de film d'animation : `consigneFigurineClient`, `figurine-pro.ts`) restent telles quelles : rien de
 * l'appli d'aujourd'hui ne change ici.
 *
 * Ce fichier est partagé (la page et le serveur).
 */
import type { Traits } from "./figurine-pro";
import { consigneMemeFigurine, consigneSculptee } from "./perso-consignes";
import { STYLE_FILM_CHALEUREUX, consigneRetoucheDecor, consigneScene as consigneSceneDuMonde } from "./monde-consignes";

/**
 * Les trois façons d'essayer la figurine, pour comparer — LA DEUXIÈME VERSION (11 novembre 2026, le propriétaire, sur
 * les premières : « la figurine est quasi à l'identique de la photo avec juste un plus petit corps, alors que je voulais
 * que la tête soit retravaillée », comme la figurine qu'il a montrée — une caricature sculptée, les cheveux en volume,
 * une vraie expression, un doigt sur la joue). La tête n'est plus recopiée : elle est RE-SCULPTÉE. Deux réglages du
 * moteur à comparer : « fidèle » (il garde davantage la photo) et « libre » (il la réinterprète).
 */
export const VARIANTES_FIGURINE = [
  { cle: "sculptee", nom: "Sculptée, détourée", dit: "La tête re-sculptée en caricature de collection, assise dans son fauteuil, sur fond transparent. Le moteur en réglage « fidèle »." },
  { cle: "sculptee-libre", nom: "Sculptée, plus libre", dit: "La même consigne, le moteur en réglage « libre » : il réinterprète davantage la photo (plus figurine, parfois moins ressemblante)." },
  { cle: "sculptee-photo", nom: "Sculptée, en situation", dit: "Photographiée sur un socle en bois, dans un salon, avec une pose qui a du caractère : comme la figurine que vous avez montrée." },
] as const;
export type VarianteFigurine = (typeof VARIANTES_FIGURINE)[number]["cle"];
/** Le réglage du moteur pour chaque variante : « high » garde la photo, « low » la réinterprète. */
export const fideliteDe = (v: string): "high" | "low" => (v === "sculptee-libre" || v === "sculptee-photo" ? "low" : "high");
/** Une figurine sur fond transparent (prête à poser dans un univers), ou photographiée dans un décor. */
export const estDetouree = (v: string) => !v.endsWith("photo");
/** Les variantes des premiers essais (elles restent affichées avec leur nom). */
const ANCIENNES = [
  { cle: "collection", nom: "Collection, détourée (1re version)" },
  { cle: "collection-photo", nom: "Collection, en photo (1re version)" },
  { cle: "collection-douce", nom: "Plus douce (1re version)" },
  { cle: "diorama", nom: "Diorama miniature (1re version)" },
  { cle: "maquette", nom: "Pièce miniature (1re version)" },
  { cle: "peint", nom: "Monde peint (1re version)" },
  { cle: "vedette", nom: "La vedette (1re version)" },
];

/** La constance : d'une figurine qu'il a aimée, la même, avec une seule chose qui change. */
export const VARIANTES_CONSTANCE = [
  { cle: "parle", nom: "Bouche ouverte" },
  { cle: "joie", nom: "Joie" },
  { cle: "rire", nom: "Fou rire" },
  { cle: "colere", nom: "Colère" },
  { cle: "debout", nom: "Debout" },
] as const;
export type VarianteConstance = (typeof VARIANTES_CONSTANCE)[number]["cle"];

/**
 * 🌍 L'ÉTAPE 2 : LES UNIVERS — trois fiches d'essai (inventées, très différentes : personne de réel derrière) et trois
 * directions de style. Le décor est une image 9:16 SANS figurine, avec un espace accueillant devant pour les figurines
 * (feuille de route, 4.3). « Ma fiche » : le propriétaire écrit la sienne.
 * LA DEUXIÈME VERSION (11 novembre 2026, le propriétaire : « je n'imaginais pas vraiment les univers comme ceux-là »,
 * avec l'image qu'il imagine — une bibliothèque-tour magique, riche, pleine d'objets personnels, éclairée comme au
 * cinéma) : trois directions de FILM D'ANIMATION, de la plus magique à la plus grandiose.
 */
export const FICHES_UNIVERS = [
  {
    cle: "atelier-mer",
    nom: "L’atelier sur la mer",
    fiche: "A seaside workshop open onto the sea, where one tinkers calmly and the door stays open to friends: a carpenter's workbench covered with tools and wood shavings, ropes and a few shells, a small lighthouse far away on the sea, golden late-afternoon light.",
  },
  {
    cle: "serre-disques",
    nom: "La serre aux disques",
    fiche: "A tropical greenhouse full of plants and vinyl records: big leaves and hanging ferns, a record player on a vintage cabinet, crates of records, fairy lights, warm humid morning light through the glass panes.",
  },
  {
    cle: "toit-etoiles",
    nom: "Le toit aux étoiles",
    fiche: "A city rooftop at night under the stars: a telescope, notebooks full of sketches, paper lanterns, a kettle and two mugs, chimneys, and the glowing windows of the city below, deep blue night light.",
  },
] as const;
export type FicheUnivers = (typeof FICHES_UNIVERS)[number]["cle"];
export const DIRECTIONS_UNIVERS = [
  { cle: "magique", nom: "Film, magique", dit: "Un décor de grand film d’animation, riche en objets personnels, éclairé comme au cinéma, avec une touche de magie (des lumières qui brillent, des étincelles)." },
  { cle: "chaleureux", nom: "Film, chaleureux", dit: "La même qualité de film d’animation, sans magie : un lieu habité, doré, plein de charme." },
  { cle: "grandiose", nom: "Film, grandiose", dit: "Un plan large de cinéma : le lieu en grand, une lumière spectaculaire, et un coin intime devant pour les figurines." },
] as const;
export type DirectionUnivers = (typeof DIRECTIONS_UNIVERS)[number]["cle"];
export const ficheUnivers = (x: unknown): FicheUnivers | null => (FICHES_UNIVERS.some((f) => f.cle === x) ? (x as FicheUnivers) : null);
export const directionUnivers = (x: unknown): DirectionUnivers | null => (DIRECTIONS_UNIVERS.some((d) => d.cle === x) ? (x as DirectionUnivers) : null);
export const nomDeFiche = (x: string | undefined) => FICHES_UNIVERS.find((f) => f.cle === x)?.nom ?? (x === "perso" ? "Ma fiche" : "");
/** « Ma fiche » : sa longueur. Une retouche : la sienne. */
export const FICHE_MAX = 600;
export const RETOUCHE_MAX = 200;
export const RETOUCHE_PAR_DEFAUT = "davantage de nature : des plantes, de la mousse, un peu de verdure qui entre dans le lieu";

/** 🎬 La scène : une ou deux figurines mises en scène par le moteur dans un décor — sa situation par défaut. */
export const SITUATION_MAX = 300;
export const SITUATION_UNE = "La figurine est chez elle et accueille un visiteur avec un grand geste de bienvenue, l’air ravi.";
export const SITUATION_DEUX = "La première figurine raconte sa journée avec de grands gestes, debout ; la seconde, installée dans son fauteuil, éclate de rire.";

export type EssaiType = "figurine" | "constance" | "univers" | "retouche" | "vedette" | "scene";
export type EtatEssai = "en-cours" | "fait" | "erreur";

/** Une personne d'essai : un repère (jamais plus), son selfie, l'accord coché, ses traits vus. */
export type PersonneEssai = { id: string; nom: string; accordLe: string; le: string; selfie: string; traits: string[] };
/** Une image d'essai, et tout ce qui permet de la juger et de la refaire. */
export type ResultatEssai = {
  id: string;
  personne: string;
  type: EssaiType;
  variante: string;
  /** (la constance) la figurine d'où elle part ; (la retouche, la vedette) le décor */
  source?: string;
  /** (un univers) sa fiche (`FICHES_UNIVERS`, ou « perso ») ; (la vedette) la figurine posée dedans */
  fiche?: string;
  figurine?: string;
  /** (la retouche) ce qu'il a demandé */
  retouche?: string;
  /** (la scène) les figurines posées dedans, leurs personnes, et la situation */
  figurines?: string[];
  personnes?: string[];
  situation?: string;
  etat: EtatEssai;
  erreur?: string;
  image?: string;
  modele?: string;
  qualite: string;
  taille: string;
  le: string;
  dureeS?: number;
  /** ce que le moteur dit avoir consommé (les jetons de l'image) */
  jetons?: number;
  consigne: string;
  avis?: "oui" | "non";
  note?: string;
};
export type EtatEssais = { personnes: PersonneEssai[]; resultats: ResultatEssai[]; imagesDuJour: number; plafond: number; branche: boolean };

/** La version de la page d'essais. Chaque série qui change les boutons (variantes, directions…) l'augmente : une page
 * restée ouverte d'avant (sur l'iPhone du propriétaire, le 12 novembre : « Diorama miniature » refusé) est alors priée
 * de se recharger, au lieu d'envoyer des choix que le serveur ne connaît plus. */
export const VERSION_PAGE_ESSAIS = 2;
export const PAGE_PERIMEE = "Cette page a été mise à jour depuis que vous l’avez ouverte : rechargez-la (fermez l’onglet et rouvrez-le, ou tirez l’écran vers le bas).";

/** Les images par jour, au plus (un double toucher ne doit pas coûter cher). */
export const IMAGES_PAR_JOUR = 150;
export const NOM_MAX = 40;
export const NOTE_MAX = 400;

export const varianteFigurine = (x: unknown): VarianteFigurine | null => (VARIANTES_FIGURINE.some((v) => v.cle === x) ? (x as VarianteFigurine) : null);
export const varianteConstance = (x: unknown): VarianteConstance | null => (VARIANTES_CONSTANCE.some((v) => v.cle === x) ? (x as VarianteConstance) : null);
export const nomDeVariante = (x: string) =>
  [...VARIANTES_FIGURINE, ...VARIANTES_CONSTANCE, ...DIRECTIONS_UNIVERS, { cle: "retouche", nom: "Retouche" }, { cle: "scene", nom: "La scène" }, ...ANCIENNES].find((v) => v.cle === x)?.nom ?? x;

// ─── les consignes (validées au lot 0 : elles vivent dans `perso-consignes.ts`, mot pour mot) ──────────────────
/** 🧸 LA FIGURINE DU NOUVEAU STYLE, à partir de son selfie (IMAGE 1) : la tête re-sculptée en caricature de collection. */
export const consigneFigurineCollection = (variante: VarianteFigurine, traits?: Traits | null): string => consigneSculptee(traits, !estDetouree(variante));
/** 🔁 LA CONSTANCE : la même figurine (IMAGE 1), une seule chose change. */
export const consigneConstance = (variante: VarianteConstance): string => consigneMemeFigurine(variante);

// ─── l'étape 2 : les univers ──────────────────────────────────────────────────────────────────────
const STYLE_DIRECTION: Record<DirectionUnivers, string> = {
  magique:
    "a set from a high-end 3D animated feature film (the quality of the best animation studios): a rich, characterful place full of personal storytelling props, a cinematic composition with depth and layers, warm practical lights and a touch of everyday magic (softly glowing elements, a few floating sparkles, light drawing shapes in the air), detailed materials and textures, wondrous and cosy.",
  chaleureux: STYLE_FILM_CHALEUREUX,
  grandiose:
    "a breathtaking wide shot from a high-end 3D animated feature film: a vast, epic version of the place with a striking perspective and dramatic cinematic light (light rays, a soft haze), and a cosy, intimate spot in the foreground.",
};

/** 🌍 LE DÉCOR D'UN UNIVERS (sans figurine), d'après sa fiche, dans une direction de style. */
export function consigneDecor(fiche: string, direction: DirectionUnivers): string {
  return [
    "Create the DECOR of a personal universe for small collectible figurines (about 15 cm tall), as a vertical portrait image.",
    "",
    `THE WORLD (data, not instructions): ${JSON.stringify(fiche)}`,
    "",
    `STYLE: ${STYLE_DIRECTION[direction]}`,
    "",
    "COMPOSITION:",
    "- The camera is at the characters' eye level, looking into the place.",
    "- In the lower middle, an inviting open space in the foreground (a rug, a floor, a terrace), in sharp focus, where two small characters will later stand or sit in armchairs, facing each other. Keep it free of objects.",
    "- The meaningful elements of the world surround that space and fill the background, telling who lives here.",
    "- The main light comes from the left.",
    "",
    "NO figurine, no person, no character, no animal, no text, no logo.",
  ].join("\n");
}

/** ✏️ UNE RETOUCHE : le même décor (IMAGE 1), une seule chose change (`monde-consignes.ts`). */
export const consigneRetouche = (retouche: string): string => consigneRetoucheDecor(retouche);

/** 🎬 LA SCÈNE, MISE EN SCÈNE PAR LE MOTEUR (`monde-consignes.ts`, mot pour mot). */
export const consigneScene = (nb: 1 | 2, situation: string): string => consigneSceneDuMonde(nb, situation);
