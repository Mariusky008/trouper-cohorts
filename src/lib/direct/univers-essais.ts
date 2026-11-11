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
import { traitsEnMots, type Traits } from "./figurine-pro";

/** Les trois façons d'essayer la figurine, pour comparer. */
export const VARIANTES_FIGURINE = [
  { cle: "collection", nom: "Collection, détourée", dit: "La cible : une figurine de collection réaliste, assise dans son fauteuil, sur fond transparent (prête à poser dans un univers)." },
  { cle: "collection-photo", nom: "Collection, en photo", dit: "La même, photographiée de près sur une table : pour juger le rendu d'objet, comme la photo de référence." },
  { cle: "collection-douce", nom: "Plus douce", dit: "Un peu plus stylisée (une finition de figurine d'artiste) : pour voir si le réalisme flatte assez." },
] as const;
export type VarianteFigurine = (typeof VARIANTES_FIGURINE)[number]["cle"];

/** La constance : d'une figurine qu'il a aimée, la même, avec une seule chose qui change. */
export const VARIANTES_CONSTANCE = [
  { cle: "parle", nom: "Bouche ouverte" },
  { cle: "joie", nom: "Joie" },
  { cle: "rire", nom: "Fou rire" },
  { cle: "colere", nom: "Colère" },
  { cle: "debout", nom: "Debout" },
] as const;
export type VarianteConstance = (typeof VARIANTES_CONSTANCE)[number]["cle"];

export type EssaiType = "figurine" | "constance";
export type EtatEssai = "en-cours" | "fait" | "erreur";

/** Une personne d'essai : un repère (jamais plus), son selfie, l'accord coché, ses traits vus. */
export type PersonneEssai = { id: string; nom: string; accordLe: string; le: string; selfie: string; traits: string[] };
/** Une image d'essai, et tout ce qui permet de la juger et de la refaire. */
export type ResultatEssai = {
  id: string;
  personne: string;
  type: EssaiType;
  variante: string;
  /** (la constance) la figurine d'où elle part */
  source?: string;
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

/** Les images par jour, au plus (un double toucher ne doit pas coûter cher). */
export const IMAGES_PAR_JOUR = 150;
export const NOM_MAX = 40;
export const NOTE_MAX = 400;

export const varianteFigurine = (x: unknown): VarianteFigurine | null => (VARIANTES_FIGURINE.some((v) => v.cle === x) ? (x as VarianteFigurine) : null);
export const varianteConstance = (x: unknown): VarianteConstance | null => (VARIANTES_CONSTANCE.some((v) => v.cle === x) ? (x as VarianteConstance) : null);
export const nomDeVariante = (x: string) => [...VARIANTES_FIGURINE, ...VARIANTES_CONSTANCE].find((v) => v.cle === x)?.nom ?? x;

// ─── les consignes ────────────────────────────────────────────────────────────────────────────────
const LIKENESS = (traits?: Traits | null) => {
  const vus = traitsEnMots(traits).filter((l) => !l.startsWith("- Son expression") && !l.includes("lunettes"));
  return [
    "LIKENESS (most important):",
    ...(traits?.portrait ? [`- ${traits.portrait.replace(/\.?$/, ".")}`] : []),
    "- Keep THEIR face exactly: the face shape and proportions, the jawline and chin, the nose shape and size, the eye shape, colour and spacing, the eyebrows, the mouth, the skin tone, their real age, the hair colour and hairstyle, the facial hair. Do not beautify, do not rejuvenate, do not slim, do not change their ethnicity or how they present.",
    ...(vus.length ? ["- Their features as seen in the photo (written in French — follow them exactly):", ...vus.map((l) => `  ${l}`)] : []),
    ...(traits?.accentuer
      ? [`- Like a good caricature sculptor, gently play up THEIR OWN most distinctive features (about 15 %), so friends recognize them at first glance (in French, most striking first): ${traits.accentuer}. Never add generic features that are not theirs.`]
      : []),
    "- Their expression from the photo, with CLOSED LIPS (the mouth is animated separately later).",
    "- If they wear glasses in the photo, keep them, same shape; otherwise add none. Nothing on the head or face that is not in the photo.",
  ];
};

const PROPORTIONS = [
  "PROPORTIONS:",
  "- A big head: about 45 % of the figurine's total seated height. A small body with short arms and short legs, small hands with five fingers each. Charming, not grotesque.",
];

const POSE_FAUTEUIL = [
  "POSE AND ARMCHAIR:",
  "- Seated comfortably in a small, cosy upholstered armchair at the figurine's scale (a simple rounded shape, soft fabric, a calm neutral colour), legs crossed, relaxed and friendly attitude, body turned very slightly towards the viewer, looking at the camera.",
  "- The whole figurine AND the whole armchair are visible, centered, with a small margin around them. Nothing is cut off.",
];

const MATIERES_REALISTES = [
  "MATERIALS AND RENDER — a premium hand-painted collectible figure, like a limited-edition resin-and-fabric figure:",
  "- Their own clothes from the photo (same colours and kind of garment), made of real miniature fabric: visible knit, weave and stitching; real miniature shoes or sneakers.",
  "- Real rooted hair with fine individual strands; skin with a subtle, natural painted-resin finish and a fine grain (no plastic shine, no wax look); eyes with a lifelike glint.",
  "- Photographed like a product shot of a high-end collectible: macro lens, soft studio light from the upper left, a gentle realistic contact shadow under the armchair.",
];

const MATIERES_DOUCES = [
  "MATERIALS AND RENDER — a designer art-toy figure, a little more stylized but still clearly them:",
  "- Their own clothes from the photo (same colours and kind of garment), in soft miniature fabric with visible stitching; miniature shoes or sneakers.",
  "- Smooth matte skin with a soft painted finish, softly simplified shapes that still follow their real features, eyes very slightly larger (about 10 %), sculpted hair in neat locks with their real colour and style. Warm and friendly.",
  "- Photographed like a product shot: soft studio light from the upper left, a gentle contact shadow under the armchair.",
];

const FOND_TRANSPARENT = ["BACKGROUND: fully transparent (alpha channel) — only the figurine, its armchair and a soft contact shadow under it."];
const FOND_PHOTO = [
  "SETTING: placed on a warm wooden tabletop in a softly lit living room, photographed up close; the background is pleasantly out of focus (shallow depth of field), nothing distracting in it.",
];

const CONTRAINTES = ["CONSTRAINTS: no text, no logo, no packaging, no box, no hand holding the figurine, no display base, no spring, no other character."];

/** 🧸 LA FIGURINE DU NOUVEAU STYLE, à partir de son selfie (IMAGE 1). */
export function consigneFigurineCollection(variante: VarianteFigurine, traits?: Traits | null): string {
  return [
    "Turn the person in IMAGE 1 into a REALISTIC COLLECTIBLE FIGURINE of themselves. The person must be INSTANTLY RECOGNIZABLE by their friends: likeness comes first, style second.",
    "",
    ...LIKENESS(traits),
    "",
    ...PROPORTIONS,
    "",
    ...POSE_FAUTEUIL,
    "",
    ...(variante === "collection-douce" ? MATIERES_DOUCES : MATIERES_REALISTES),
    "",
    ...(variante === "collection-photo" ? FOND_PHOTO : FOND_TRANSPARENT),
    "",
    ...CONTRAINTES,
  ].join("\n");
}

const CHANGEMENTS: Record<VarianteConstance, string> = {
  parle: "its mouth is now open as if in the middle of saying a word (a natural, medium opening, teeth slightly visible). Everything else stays identical, including the eyes, the eyebrows and the pose.",
  joie: "its facial expression: a big, warm, happy smile, cheeks raised, eyes smiling. Same pose.",
  rire: "its facial expression: laughing out loud, eyes squeezed shut with joy, mouth wide open, head slightly tilted back. Same pose.",
  colere: "its facial expression: comically angry — eyebrows frowning hard, lips pursed, a little pout. Same pose.",
  debout:
    "its pose: it is now STANDING upright on its feet, with NO armchair, the full body visible from the top of the head to the shoes, arms relaxed, ready to walk. Same proportions (the big head, the small body), same clothes, same shoes.",
};

/** 🔁 LA CONSTANCE : la même figurine (IMAGE 1), une seule chose change. */
export function consigneConstance(variante: VarianteConstance): string {
  return [
    `IMAGE 1 is a finished collectible figurine of a real person. Make a new image of EXACTLY THE SAME FIGURINE: the same person, the same face and likeness, the same hair, the same clothes, colours and materials, ${variante === "debout" ? "" : "the same armchair, "}the same size, framing and light.`,
    `Change ONLY this: ${CHANGEMENTS[variante]}`,
    "",
    ...FOND_TRANSPARENT,
    "",
    ...CONTRAINTES,
  ].join("\n");
}
