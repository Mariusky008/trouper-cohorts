/**
 * 🖋️ LE FANTÔME DE DAX — LES PHOTOS DEVENUES DESSIN DE BD.
 *
 * « Ça fait très enfantin, il faudrait peut-être créer un univers à mi-chemin
 * où les caractères circulent dans la ville qu'on reconnaît, et dont l'univers
 * est propre à ClikMe, voire même que ça devienne le magazine du mois, comme
 * une BD magazine. » Puis, devant la version tout photo : « Maintenant ça ne
 * fait plus du tout BD. »
 *
 * LE MI-CHEMIN, C'EST LA VRAIE VILLE DESSINÉE. Les photos de la fiche Google
 * passent par le moteur d'images avec UNE consigne de style, la même pour tous
 * les commerces : encrage franco-belge, aplats chauds. On reconnaît la rue,
 * le plafond rouge, l'enseigne — et tout appartient au même album.
 *
 * LES FANTÔMES PASSENT PAR LE MÊME CRAYON, sinon ils restent des jouets en
 * plastique posés sur un dessin.
 *
 * LISTE FERMÉE, ET C'EST VOULU : chaque dessin coûte une génération. La route
 * ne dessine que ce qui est écrit ici — personne ne peut lui faire dessiner
 * autre chose en changeant l'adresse.
 */

export type SourceBD = {
  /** L'image d'origine, servie par le site. */
  photo: string;
  /** Format demandé au moteur — l'orientation de la case qui l'attend. */
  format: "1024x1536" | "1536x1024" | "1024x1024";
  /** Un personnage : fond transparent, pour le poser dans les cases. */
  personnage?: boolean;
  /** Ce que montre la photo, pour que le dessin garde ce qui compte. */
  sujet: string;
};

/** Le style de toute la BD. En anglais : c'est la langue où le moteur suit le plus fidèlement. */
export const STYLE_DECOR =
  "Redraw this photo as a hand-inked Franco-Belgian comic book panel (bande dessinée, ligne claire, in the spirit of modern European graphic novels). " +
  "Clean black ink outlines of consistent weight, flat warm colours with soft cel shading, a warm amber, cream and brick-red palette, subtle paper grain. " +
  "Keep the exact composition, perspective, architecture, shop signs and every recognisable detail, so that locals instantly recognise the real place. " +
  "Do not add people, characters, text, speech bubbles, captions or panel borders.";

export const STYLE_PERSONNAGE =
  "Redraw this exact character as a hand-inked Franco-Belgian comic book character (ligne claire). " +
  "Keep the same shape, the same cap and outfit with its emblem, the same pose and the same facial expression, and the same colours, " +
  "but drawn with flat colours, soft cel shading and a clean black ink outline. Remove the pink glow and the glossy 3D plastic look. " +
  "Transparent background. No text, no shadow on the ground.";

/* ═══ ÉPISODE 1 — « CINQ ANS AU SPLENDID, ET PAS UNE SEULE NOTE DE CHAMBRE » ═══

   « Une BD avec une véritable histoire qui s'est produite à Dax, et des
   fantômes qui en parlent… le gossip du jour. » L'histoire vraie du Splendid,
   racontée par deux fantômes à sa propre terrasse.

   QUATRE PHOTOS, ET LE MOTEUR EN TIRE LES ÉPOQUES. La façade devient le
   chantier de 1928, la façade éteinte de la guerre et celle, fermée, de 2013 ;
   le hall devient la nuit d'inauguration de 1929 ; le salon, la pièce vide
   sous des draps. Chaque version part de la vraie photo : le palace reste le
   palace, on le reconnaît à chaque époque. */
const PHOTO = {
  facade: "/direct/bd/splendid-facade.jpg",
  hall: "/direct/bd/splendid-hall.jpg",
  terrasse: "/direct/bd/splendid-terrasse.jpg",
  salon: "/direct/bd/splendid-salon.jpg",
};
const LE_SPLENDID = "The Splendid, the white 1929 Art Deco palace hotel of Dax, France, with its arched roofline and stained-glass windows.";

const perso = (photo: string, sujet: string): SourceBD => ({ photo, format: "1024x1024", personnage: true, sujet });

export const SOURCES_BD: Record<string, SourceBD> = {
  terrasse: {
    photo: PHOTO.terrasse,
    format: "1024x1024",
    sujet: `The café terrace of ${LE_SPLENDID} Parasols, black bistro chairs, white facade behind.`,
  },
  "terrasse-soir": {
    photo: PHOTO.terrasse,
    format: "1024x1024",
    sujet:
      `The café terrace of ${LE_SPLENDID} ` +
      "ONE CHANGE: it is now evening, warm lamplight on the terrace, a deep blue sky, and one single upper window of the hotel glows brightly.",
  },
  facade: { photo: PHOTO.facade, format: "1536x1024", sujet: `The front of ${LE_SPLENDID} Palm trees, steps, a sunny day.` },
  "facade-1928": {
    photo: PHOTO.facade,
    format: "1536x1024",
    sujet:
      `The front of ${LE_SPLENDID} ` +
      "CHANGE: as it was in 1928, still under construction — wooden scaffolding on the upper floors, ladders, a few workers in period clothes, " +
      "no modern objects (no blue sign, no bollards), young palm trees. Faded sepia tones like an old photograph, still drawn in ink.",
  },
  "hall-1929": {
    photo: PHOTO.hall,
    format: "1024x1024",
    sujet:
      "The grand Art Deco hall of the Splendid in Dax, with its glowing stained-glass light panels and twin staircases. " +
      "CHANGE: the inauguration night of October 1929 — elegant guests in 1920s evening wear, flowers, a festive crowd. Sepia tones like an old photograph, still drawn in ink.",
  },
  "facade-guerre": {
    photo: PHOTO.facade,
    format: "1536x1024",
    sujet:
      `The front of ${LE_SPLENDID} ` +
      "CHANGE: the early 1940s at dusk, wartime, deserted, all windows dark and shuttered, cold grey-blue desaturated tones. No people, no flags, no symbols, no vehicles.",
  },
  "facade-2013": {
    photo: PHOTO.facade,
    format: "1536x1024",
    sujet:
      `The front of ${LE_SPLENDID} ` +
      "CHANGE: closed and abandoned in 2013 — every shutter closed, faded paint, weeds between the paving stones, untidy palm trees, a grey sky. No people, no text.",
  },
  "salon-vide": {
    photo: PHOTO.salon,
    format: "1536x1024",
    sujet:
      "The Art Deco lounge of the Splendid in Dax, with its tall columns, palm trees, reception desk and grand piano. " +
      "CHANGE: deserted for years — white dust sheets over the armchairs, dim light through the arched windows, a few cobwebs. No people.",
  },
  "bar-accueil": perso("/direct/double/bar/accueil.webp", "A friendly ghost bartender in a waistcoat and bow tie, waving hello."),
  "bar-content": perso("/direct/double/bar/content.webp", "A ghost bartender in a waistcoat and bow tie, eyes closed, smiling slyly."),
  "bar-reflechit": perso("/direct/double/bar/reflechit.webp", "A ghost bartender in a waistcoat and bow tie, finger on the chin, nostalgic."),
  "ongles-content": perso("/direct/double/ongles/content.webp", "A friendly ghost manicurist, eyes closed with joy."),
  "ongles-reflechit": perso("/direct/double/ongles/reflechit.webp", "A friendly ghost manicurist listening, finger on the chin, curious."),
  "ongles-parle": perso("/direct/double/ongles/parle-1.webp", "A ghost manicurist shouting in surprise, mouth wide open."),
  "coiffure-content": perso("/direct/double/coiffure/content.webp", "A cheerful ghost hairdresser, eyes closed with joy."),
  "fleurs-accueil": perso("/direct/double/fleurs/accueil.webp", "A cheerful ghost florist waving."),
};

/** La consigne complète d'un dessin. */
export function consigneBD(s: SourceBD): string {
  return `${s.personnage ? STYLE_PERSONNAGE : STYLE_DECOR} ${s.sujet}`;
}
