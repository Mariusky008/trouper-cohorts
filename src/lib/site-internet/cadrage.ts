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

export type Verdict = { ok: true } | { ok: false; raison: string };

/**
 * Le refus, avec la phrase que verra le commerçant.
 *
 * Elle dit quoi faire, pas ce qui ne va pas : « 640 px » ne veut rien dire pour
 * quelqu'un qui vend du pain.
 */
export function verifierTaille(largeur: number, hauteur: number, min = LARGEUR_MIN): Verdict {
  if (!Number.isFinite(largeur) || !Number.isFinite(hauteur) || largeur < 1 || hauteur < 1) {
    return { ok: false, raison: "Ce fichier ne s'ouvre pas comme une image." };
  }
  // On borne sur le PLUS PETIT côté : une panoramique de 2000×300 est large sur
  // le papier et n'a pas de quoi remplir la hauteur du cadre.
  const petit = Math.min(largeur, hauteur);
  const requis = Math.round(min / RATIO_FIL);
  if (largeur < min || petit < requis) {
    return {
      ok: false,
      raison:
        "Cette image est trop petite pour être nette dans le fil. Prenez-la avec l'appareil photo du téléphone plutôt que de l'enregistrer depuis une conversation — une photo reçue par message a déjà perdu la moitié de sa définition.",
    };
  }
  return { ok: true };
}
