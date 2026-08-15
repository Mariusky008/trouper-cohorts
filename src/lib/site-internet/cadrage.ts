// LA GÉOMÉTRIE DU RECADRAGE.
//
// Séparée du canvas et de React à dessein : c'est la seule partie où se cachent
// de vraies erreurs (un décalage inversé, un cadre qui sort de l'image), et
// c'est la seule qu'on peut vérifier sans navigateur.
//
// POURQUOI RECADRER À L'ENVOI PLUTÔT QUE LAISSER FAIRE LE CSS. La carte du fil
// affiche l'image en `cover` : quelle que soit la photo, le navigateur en coupe
// les bords pour remplir un rectangle 16:9. Une photo prise en portrait au
// téléphone y perd donc les deux tiers de sa hauteur — le plat est coupé, et
// PERSONNE NE L'A VU avant que l'annonce parte dans la ville. Recadrer ici, ce
// n'est pas ajouter une contrainte au commerçant : c'est lui montrer le
// découpage qui allait lui être imposé de toute façon, et lui rendre la main
// dessus.

/** Le rapport de la carte du fil. Tout ce qui est publié y passe. */
export const RATIO_FIL = 16 / 9;

/**
 * En dessous, on refuse.
 *
 * Une image de 400 px étalée sur la largeur d'un téléphone récent est
 * visiblement floue, et une carte floue en dit plus long sur le commerce que
 * son texte. 800 px est le minimum pour que le recadrage 16:9 laisse encore de
 * quoi afficher proprement.
 */
/** EN DESSOUS, ON REFUSE. C'est le seuil où l'image devient franchement
 *  inutilisable une fois découpée en 16:9 et affichée sur 280 px de haut. */
export const LARGEUR_REFUS = 480;

/** EN DESSOUS, ON PRÉVIENT SANS BLOQUER. C'est la largeur à partir de laquelle
 *  une photo est nette sur un écran de téléphone moderne.
 *
 *  Elle servait de MUR : toute image plus étroite était refusée. Une capture
 *  d'écran de téléphone (780 px), une photo reçue par message (720 px) — donc
 *  la majorité de ce qu'un commerçant a sous la main — étaient rejetées, et le
 *  bouton « ajouter une photo » ne servait plus à rien. Une carte avec une
 *  photo un peu douce vaut mieux qu'une carte sans photo : c'est l'image qui
 *  donne envie. On prévient, il décide. */
export const LARGEUR_MIN = 800;

/** La largeur du JPEG produit. 1200 couvre les écrans à forte densité sans
 *  faire grossir l'envoi au-delà de ce que la route accepte. */
export const LARGEUR_SORTIE = 1200;

export type Zone = { sx: number; sy: number; sw: number; sh: number };

const borner = (v: number, min: number, max: number) => (v < min ? min : v > max ? max : v);

/**
 * La zone de la photo source qui sera conservée.
 *
 * `decalage` va de 0 à 1 et ne bouge que sur l'axe qui déborde : une photo
 * portrait ne se déplace que verticalement, une photo panoramique que
 * horizontalement. C'est le seul degré de liberté réel — en offrir deux
 * obligerait à inventer un mouvement qui ne mène nulle part sur l'autre axe.
 *
 * 0,5 par défaut : le centre est ce que la personne a visé en prenant la photo.
 */
export function zoneRecadrage(largeur: number, hauteur: number, decalage = 0.5, ratio = RATIO_FIL): Zone {
  const w = Math.max(1, Math.round(largeur));
  const h = Math.max(1, Math.round(hauteur));
  const d = Number.isFinite(decalage) ? borner(decalage, 0, 1) : 0.5;

  if (w / h > ratio) {
    // Plus large que le cadre : on garde toute la hauteur, on glisse en largeur.
    const sw = Math.round(h * ratio);
    return { sx: Math.round((w - sw) * d), sy: 0, sw, sh: h };
  }
  // Plus haute (ou pile au bon rapport) : on garde toute la largeur.
  const sh = Math.round(w / ratio);
  return { sx: 0, sy: Math.round((h - sh) * d), sw: w, sh };
}

/** Vrai si l'axe concerné peut réellement bouger. En dessous d'un pixel de
 *  débordement, proposer de déplacer le cadre est un mensonge d'interface. */
export function axeMobile(largeur: number, hauteur: number, ratio = RATIO_FIL): "x" | "y" | null {
  const z = zoneRecadrage(largeur, hauteur, 0.5, ratio);
  if (z.sw < Math.round(largeur)) return "x";
  if (z.sh < Math.round(hauteur)) return "y";
  return null;
}

/**
 * Ce qu'on pense de la taille d'une image.
 *
 *   `refus` — inutilisable, on n'ira pas plus loin.
 *   `moyen` — publiable, mais un peu douce : on le DIT et on laisse décider.
 *   `bon`   — rien à signaler.
 */
export type NiveauTaille = "refus" | "moyen" | "bon";
export type Verdict = { ok: true; niveau: "bon" } | { ok: true; niveau: "moyen"; raison: string } | { ok: false; niveau: "refus"; raison: string };

/**
 * Le verdict, avec la phrase que verra le commerçant.
 *
 * Elle dit quoi faire, pas ce qui ne va pas : « 640 px » ne veut rien dire pour
 * quelqu'un qui vend du pain.
 *
 * TROIS NIVEAUX, ET C'EST LE POINT. Un seuil unique refusait la majorité de ce
 * qu'un commerçant a sous la main — captures d'écran, photos reçues par
 * message — et le bouton « ajouter une photo » devenait décoratif. Une carte
 * avec une photo un peu douce vaut mieux qu'une carte sans photo.
 */
export function verifierTaille(
  largeur: number,
  hauteur: number,
  seuilNet = LARGEUR_MIN,
  seuilRefus = LARGEUR_REFUS
): Verdict {
  if (!Number.isFinite(largeur) || !Number.isFinite(hauteur) || largeur < 1 || hauteur < 1) {
    return { ok: false, niveau: "refus", raison: "Ce fichier ne s'ouvre pas comme une image." };
  }
  // On borne sur le PLUS PETIT côté : une panoramique de 2000×300 est large sur
  // le papier et n'a pas de quoi remplir la hauteur du cadre.
  const petit = Math.min(largeur, hauteur);
  if (largeur < seuilRefus || petit < Math.round(seuilRefus / RATIO_FIL)) {
    return {
      ok: false,
      niveau: "refus",
      raison:
        "Cette image est vraiment trop petite : elle serait floue au point d'être illisible. Prenez-la avec l'appareil photo du téléphone.",
    };
  }
  if (largeur < seuilNet || petit < Math.round(seuilNet / RATIO_FIL)) {
    return {
      ok: true,
      niveau: "moyen",
      raison:
        "Cette photo est un peu petite : elle sera légèrement floue dans le fil. Vous pouvez la publier quand même — une photo un peu douce vaut mieux que pas de photo. Pour qu'elle soit nette, prenez-la avec l'appareil photo du téléphone plutôt que de l'enregistrer depuis une conversation.",
    };
  }
  return { ok: true, niveau: "bon" };
}
