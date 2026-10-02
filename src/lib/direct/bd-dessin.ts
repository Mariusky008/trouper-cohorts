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

export const SOURCES_BD: Record<string, SourceBD> = {
  rue: {
    photo: "/direct/bd/rue-txupinazo.jpg",
    format: "1024x1536",
    sujet: "The corner facade of the bar El Txupinazo in Dax, its red doors wide open, the sunny paved street of the old town.",
  },
  salle: {
    photo: "/direct/bd/salle-txupinazo.jpg",
    format: "1536x1024",
    sujet: "The dining room of El Txupinazo: a red ceiling with a painted bull emblem, the long bar, wooden high stools and round tables.",
  },
  atelier: {
    photo: "/direct/double/ongles/decor.jpg",
    format: "1024x1536",
    sujet: "A warm nail salon: pink velvet chairs, manicure tables, shelves of nail polish, a wooden counter in the foreground.",
  },
  /* LE GAG DE L'ÉPISODE TIENT DANS CETTE IMAGE. « Qui a fait les ongles du
     taureau ? » : la même salle, et le taureau peint au plafond porte du vernis
     rouge brillant aux sabots et au bout des cornes. Le moteur sait modifier
     une photo ; c'est la seule case où on lui demande d'ajouter quelque chose. */
  "salle-verni": {
    photo: "/direct/bd/salle-txupinazo.jpg",
    format: "1536x1024",
    sujet:
      "The dining room of El Txupinazo: a red ceiling with a painted bull emblem, the long bar, wooden high stools and round tables. " +
      "ONE CHANGE: the painted bull on the ceiling now has glossy brick-red nail polish on its four hooves and on the tips of its horns, with a tiny gold sparkle, clearly visible.",
  },
  "chef-accueil": { photo: "/direct/double/accueil.webp", format: "1024x1024", personnage: true, sujet: "A friendly ghost chef waving hello." },
  "chef-content": { photo: "/direct/double/content.webp", format: "1024x1024", personnage: true, sujet: "A friendly ghost chef, eyes closed with joy." },
  "chef-parle": { photo: "/direct/double/parle-1.webp", format: "1024x1024", personnage: true, sujet: "A ghost chef shouting in shock, mouth wide open." },
  "chef-reflechit": { photo: "/direct/double/reflechit.webp", format: "1024x1024", personnage: true, sujet: "A ghost chef looking up, finger on the chin, suspicious." },
  "ongles-accueil": { photo: "/direct/double/ongles/accueil.webp", format: "1024x1024", personnage: true, sujet: "A friendly ghost manicurist waving hello." },
  "ongles-content": { photo: "/direct/double/ongles/content.webp", format: "1024x1024", personnage: true, sujet: "A friendly ghost manicurist, eyes closed with joy." },
  "ongles-reflechit": {
    photo: "/direct/double/ongles/reflechit.webp",
    format: "1024x1024",
    personnage: true,
    sujet: "A friendly ghost manicurist thinking, finger on the chin.",
  },
};

/** La consigne complète d'un dessin. */
export function consigneBD(s: SourceBD): string {
  return `${s.personnage ? STYLE_PERSONNAGE : STYLE_DECOR} ${s.sujet}`;
}
