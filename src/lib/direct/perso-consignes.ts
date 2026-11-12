/**
 * 🧸 LES CONSIGNES DE LA FIGURINE DU NOUVEAU STYLE — validées au lot 0 du chantier « Univers » (12 novembre 2026,
 * `docs/univers/feuille-de-route.md`) : « Sculptée, détourée » (la tête RE-SCULPTÉE en caricature de collection,
 * jamais recopiée, assise dans son fauteuil, fond transparent, le moteur en réglage « fidèle »), et la constance (la
 * même figurine, bouche ouverte, en trois visages, debout).
 *
 * Elles ont quitté la page d'essais (`univers-essais.ts`, qui s'en sert toujours) pour servir la vraie figurine
 * (`nouvelle-figurine-serveur.ts`) et sa fiche (`fiches-serveur.ts` : la consigne d'une image se redonne à partir de la
 * fiche, mot pour mot). NE PAS LES RETOUCHER À LA LÉGÈRE : une consigne changée, ce sont des figurines qui ne se
 * refont plus à l'identique — on ajoute un style (`STYLES_PERSO`, `perso.ts`) plutôt.
 *
 * EN ANGLAIS (c'est là que le moteur est le plus précis). FICHIER PUR.
 */
import { traitsEnMots, type Traits } from "./figurine-pro";
import type { Sentiment } from "./ma-figurine";
import type { Fauteuil } from "./perso";

const TETE = (traits?: Traits | null) => {
  const vus = traitsEnMots(traits).filter((l) => !l.startsWith("- Son expression") && !l.includes("lunettes"));
  return [
    "THE HEAD — RE-SCULPTED, NEVER COPIED:",
    "- Do NOT paste or copy the face from the photo, nor its lighting, its framing or its exact expression. Sculpt the head from scratch, as the head of a figurine, keeping THEIR identity: the face shape, the jawline and chin, the nose, the eyes and their colour, the eyebrows, the mouth, their real age, the skin tone, the hairstyle and hair colour, the facial hair.",
    ...(traits?.portrait ? [`- Who they are: ${traits.portrait.replace(/\.?$/, ".")}`] : []),
    ...(vus.length ? ["- Their features as seen in the photo (written in French — follow them):", ...vus.map((l) => `  ${l}`)] : []),
    `- A caricature by a skilled sculptor: exaggerate THEIR OWN most distinctive features by about 25 %${traits?.accentuer ? ` (in French, most striking first: ${traits.accentuer})` : ""} — more volume and movement in the hair, more character in the eyebrows and the expression. Never generic features that are not theirs. Friends must recognize them at first glance.`,
    "- Painted-resin finish: lifelike painted skin with a subtle texture (painted stubble where they have some), glossy painted eyes with a catchlight, sculpted hair with visible strands and volume. The head is lit by the same light as the rest of the figurine: it is clearly a sculpted object, not a photograph.",
    "- A characterful, slightly funny expression that suits them (a skeptical look, a knowing half-smile, a little pout, a raised eyebrow…), with CLOSED LIPS (the mouth is animated later).",
    "- Glasses only if they wear some in the photo. Nothing on the head that is not in the photo.",
  ];
};

const CORPS = (avecSocle: boolean) => [
  "BODY AND POSE:",
  "- A BIG head: about half of the figurine's total seated height. A small body with short arms and short legs, small expressive hands with five fingers each.",
  "- Seated in a small, cosy upholstered armchair at the figurine's scale (soft felted fabric, a rounded shape, little wooden feet), legs crossed, with an attitude full of personality: one hand touching the cheek or the chin, the other arm resting on the armrest.",
  "- Their own clothes from the photo (same colours and type of garment), in real miniature fabric — knit, denim, leather — with visible stitching; miniature sneakers or shoes.",
  `- The whole figurine and the whole armchair${avecSocle ? " (and the display base)" : ""} are visible, centered, with a small margin. Nothing is cut off.`,
];

const RENDU = ["RENDER: a macro product photograph of a real, premium collectible object: soft warm studio light from the upper left, crisp details, a gentle contact shadow."];

const FOND_TRANSPARENT = ["BACKGROUND: fully transparent (alpha channel) — only the figurine, its armchair and a soft contact shadow under it."];
const EN_SITUATION = [
  "SETTING: the armchair stands on a round, polished wooden display base, on a table in a softly lit living room with plants and a framed picture; the background is pleasantly out of focus (shallow depth of field).",
];

const CONTRAINTES = (avecSocle: boolean) => [`CONSTRAINTS: no text, no logo, no packaging, no box, no hand holding the figurine, no spring,${avecSocle ? "" : " no display base,"} no other character.`];

/**
 * 🧸 SA FIGURINE, à partir de son selfie (IMAGE 1) : la tête re-sculptée en caricature de collection, assise dans son
 * fauteuil. `socle` : photographiée sur un socle en bois, dans un salon (la variante « en situation » des essais) ; sans,
 * détourée — c'est celle qui a été validée.
 */
export function consigneSculptee(traits?: Traits | null, socle = false): string {
  return [
    "Turn the person in IMAGE 1 into a premium COLLECTIBLE CARICATURE FIGURINE of themselves: a big-head figurine hand-sculpted and hand-painted by a top caricature sculptor. Their friends must recognize them at first glance — and it must clearly be a sculpted figurine, not a photo of their face.",
    "",
    ...TETE(traits),
    "",
    ...CORPS(socle),
    "",
    ...RENDU,
    "",
    ...(socle ? EN_SITUATION : FOND_TRANSPARENT),
    "",
    ...CONTRAINTES(socle),
  ].join("\n");
}

const CHANGEMENTS = {
  parle: "its mouth is now open as if in the middle of saying a word (a natural, medium opening, teeth slightly visible). Everything else stays identical, including the eyes, the eyebrows and the pose.",
  joie: "its facial expression: a big, warm, happy smile, cheeks raised, eyes smiling. Same pose.",
  rire: "its facial expression: laughing out loud, eyes squeezed shut with joy, mouth wide open, head slightly tilted back. Same pose.",
  colere: "its facial expression: comically angry — eyebrows frowning hard, lips pursed, a little pout. Same pose.",
  debout:
    "its pose: it is now STANDING upright on its feet, with NO armchair, the full body visible from the top of the head to the shoes, arms relaxed, ready to walk. Same proportions (the big head, the small body), same clothes, same shoes.",
} as const;

export type ChangementFigurine = keyof typeof CHANGEMENTS;

/** 🔁 LA MÊME FIGURINE (IMAGE 1), une seule chose change : sa bouche ouverte, un visage, debout (la constance du lot 0). */
export function consigneMemeFigurine(variante: ChangementFigurine): string {
  return [
    `IMAGE 1 is a finished collectible figurine of a real person. Make a new image of EXACTLY THE SAME FIGURINE: the same person, the same face and likeness, the same hair, the same clothes, colours and materials, ${variante === "debout" ? "" : "the same armchair, "}the same size, framing and light.`,
    `Change ONLY this: ${CHANGEMENTS[variante]}`,
    "",
    ...FOND_TRANSPARENT,
    "",
    ...CONTRAINTES(false),
  ].join("\n");
}

/**
 * 🪑 SON FAUTEUIL AUX COULEURS DE SON MONDE (lot 4b), fait sur son image « assise » (IMAGE 1) : la figurine ne change
 * pas, seul le fauteuil prend les couleurs de son univers. Redonnée à partir de la fiche seule (son `fauteuil`).
 */
export function consigneFauteuil(f: Fauteuil): string {
  const [tissu, coussin = tissu, details = coussin] = f.couleurs;
  return [
    "IMAGE 1 is a finished collectible caricature figurine of a real person, seated in its armchair. Make a new image of EXACTLY THE SAME FIGURINE: the same person, the same face and likeness, the same expression, the same hair, the same clothes, the same pose, the same size, framing and light, the same painted-resin finish. Do not redraw the person.",
    `Change ONLY the armchair (${f.description}): it now takes the colours of their world — the upholstery in the colour ${tissu}, a soft cushion and the piping in the colour ${coussin}, small details (buttons, a stitched trim) in the colour ${details}; the little wooden feet stay natural wood, in a tone that goes with these colours. Real miniature fabric with a visible texture, never flat paint. The same shape and size of armchair, in the same place.`,
    "",
    ...FOND_TRANSPARENT,
    "",
    ...CONTRAINTES(false),
  ].join("\n");
}

/**
 * 🎭 SES VISAGES DU NOUVEAU STYLE (après le lot 5) — les mêmes sentiments que sa figurine d'aujourd'hui (`SENTIMENTS`,
 * `ma-figurine.ts`), faits à partir de son image « assise » (IMAGE 1), détourée : la même figurine dans le même
 * fauteuil ; seul son visage change (une attitude : ses bras et ses mains aussi). Puis, à partir du visage, la même
 * bouche ouverte, pour qu'elle parle. EN ANGLAIS. Une consigne ajoutée ne change aucune des consignes validées.
 */
const VISAGES_ASSISE: Record<Sentiment, string> = {
  joie: "radiant JOY: a big warm smile, cheeks raised, eyes slightly squinting with happiness, eyebrows relaxed and lifted",
  colere: "clear ANGER: eyebrows sharply lowered and drawn together into a deep frown, eyes narrowed, lips pressed tight — a funny cartoon anger, but unmistakable",
  tristesse: "deep SADNESS: inner eyebrows raised, eyes glossy and looking slightly down, the corners of the mouth turned down in a pout",
  euphorie: "EUPHORIA: eyes wide open and sparkling, eyebrows very high, a huge open-mouthed grin of pure excitement",
  rire: "a big burst of LAUGHTER: eyes squeezed shut into happy crescents, cheeks pushed up, head slightly tilted back, a wide laughing mouth",
  grimace: "a funny GRIMACE: tongue sticking out, one eye squeezed shut, nose wrinkled, eyebrows going in opposite directions",
  amour: "being head over heels IN LOVE: dreamy, adoring eyes with little heart-shaped highlights, rosy blushing cheeks, a tender, sweet smile",
  tete: "comic DESPAIR, HOLDING ITS HEAD IN BOTH HANDS: both palms pressed against the sides of its head, eyes wide open, mouth open in a dismayed « oh no! »",
  endouce: "SECRET GIGGLING: one hand covering its mouth, eyes squeezed into happy crescents, shoulders slightly hunched",
  bras: "an UNIMPRESSED, deadpan attitude with its ARMS FIRMLY CROSSED over its chest: one eyebrow raised, eyelids half lowered, mouth flat",
  victoire: "a TRIUMPHANT VICTORY pose: both fists raised up on each side of its head, a huge open-mouthed triumphant grin",
  chut: "a knowing « SHH »: one index finger pressed against its closed lips, eyes glancing sideways with a sly look",
  coeur: "tender love, MAKING A HEART SHAPE WITH BOTH HANDS in front of its chest: a warm sweet smile, soft happy eyes",
};
const ATTITUDE_ASSISE: readonly Sentiment[] = ["tete", "endouce", "bras", "victoire", "chut", "coeur"];
const MEME_ASSISE = (pose: boolean) =>
  `IMAGE 1 is a finished collectible caricature figurine of a real person, seated in its armchair. Make a new image of EXACTLY THE SAME FIGURINE: the same person and likeness, the same hair, the same clothes, the same armchair, ${pose ? "still seated in it" : "the same pose and arms"}, the same size, framing and light, the same painted-resin finish.`;
/** 🎭 Un visage (ou une attitude) du nouveau style, fait sur son image « assise ». */
export function consigneVisageAssise(x: Sentiment): string {
  const pose = ATTITUDE_ASSISE.includes(x);
  return [
    MEME_ASSISE(pose),
    `Change ONLY ${pose ? "its arms, its hands and its facial expression" : "its facial expression"}: ${VISAGES_ASSISE[x]}. Strong and readable at a glance, on THIS face — it must still be clearly the same person, a sculpted caricature, never a photograph.${pose ? " The whole figurine stays inside the image, hands included." : ""}`,
    "",
    ...FOND_TRANSPARENT,
    "",
    ...CONTRAINTES(false),
  ].join("\n");
}
/** 🗣️ La même, bouche ouverte (fait sur son visage) : pour qu'elle parle avec ce visage. */
export function consigneBoucheAssise(x: Sentiment): string {
  const pose = ATTITUDE_ASSISE.includes(x);
  return [
    MEME_ASSISE(false),
    `Change ONLY its mouth: open it as if the figurine is in the middle of saying a word, keeping the same ${pose ? "arms, hands and " : ""}expression on the rest of the face (eyes, eyebrows, cheeks).`,
    "",
    ...FOND_TRANSPARENT,
    "",
    ...CONTRAINTES(false),
  ].join("\n");
}

/**
 * 🗓️ SA TENUE DE SAISON (la figurine du mois, au nouveau style — lot 7, « la figurine du mois devient la saison de son
 * univers ») : la même figurine dans le même fauteuil, habillée du thème du mois, avec l'expression du mois ; puis sa
 * bouche ouverte. Fond transparent : elle s'assoit chez elle, dans son décor.
 */
export function consigneTenueAssise(nomEdition: string, tenue: string, expression: string): string {
  return [
    MEME_ASSISE(true),
    `Dress it up for the theme « ${nomEdition} » with: ${tenue} (written in French). Accessories may be worn or held in the hands; it stays seated in the same armchair.`,
    `Give it this facial expression: ${expression}. It must still be clearly the same person, a sculpted caricature, never a photograph. Nothing alcoholic.`,
    "",
    ...FOND_TRANSPARENT,
    "",
    ...CONTRAINTES(false),
  ].join("\n");
}
export function consigneBoucheTenueAssise(expression: string): string {
  return [
    "IMAGE 1 is a finished collectible caricature figurine of a real person, dressed up for the season, seated in its armchair. Make a new image of EXACTLY THE SAME FIGURINE: the same person, the same outfit and accessories, the same armchair and pose, the same size, framing and light.",
    `Change ONLY its mouth: open it as if the figurine is in the middle of saying a word, keeping ${expression || "the same expression"} on the rest of the face.`,
    "",
    ...FOND_TRANSPARENT,
    "",
    ...CONTRAINTES(false),
  ].join("\n");
}

/** Une retouche, avec ses mots : au plus 120 caractères. */
export const RETOUCHE_FIGURINE_MAX = 120;

/**
 * ✏️ UNE RETOUCHE AVEC SES MOTS (« les cheveux plus courts », « sans lunettes », « un pull bleu ») : la même figurine
 * (IMAGE 1), seule la chose demandée change. Ses mots sont en français : le moteur les lit tels quels.
 */
export function consigneRetoucheFigurine(demande: string): string {
  return [
    "IMAGE 1 is a finished collectible caricature figurine of a real person, seated in its armchair. Make a new image of EXACTLY THE SAME FIGURINE: the same person, the same face and likeness, the same big head and small body, the same pose, the same armchair, the same size, framing and light, the same painted-resin finish.",
    `Change ONLY what the person asks for (written in French — do exactly this, and nothing more): « ${demande.replace(/[«»]/g, "").trim()} »`,
    "If the change concerns the face or the hair, it stays a sculpted caricature, never a photograph.",
    "",
    ...FOND_TRANSPARENT,
    "",
    ...CONTRAINTES(false),
  ].join("\n");
}
