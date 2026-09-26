/**
 * 🛋️ LE PARCOURS DÉCO — quatre étapes, du salon à la boutique.
 *
 * ═══ CE QU'IL A DONNÉ ══════════════════════════════════════════════════════
 *
 * Quatre écrans dessinés : « ce fauteuil chez vous ? » ; le salon sans puis
 * avec ; les détails de près ; et « venez le découvrir ».
 *
 * ═══ C'EST LE SEUL ESSAI QUI SE FAIT DANS UNE PIÈCE, PAS SUR UNE PERSONNE ══
 *
 * LES TROIS AUTRES ESSAYAGES POSENT UNE CHOSE SUR UN CORPS — une coupe, une
 * veste. Celui-là la pose dans un LIEU, et c'est une question différente :
 * pas « est-ce que ça me va » mais « est-ce que ça rentre, et est-ce que ça
 * va avec le reste ». D'où la paire avant/après de l'étape 2, qui est le même
 * salon au même cadrage, et d'où les deux mentions qui reviennent sur les
 * étapes 2, 3 et 4 : la taille se vérifie en boutique, toujours.
 *
 * ON NE PROMET DONC JAMAIS LES DIMENSIONS. Un rendu qui fait croire qu'un
 * fauteuil passe la porte, et qui se trompe, coûte une livraison et un client
 * au commerçant. C'est la seule chose que ce parcours répète trois fois.
 *
 * ═══ CE FICHIER NE DÉCLARE QUE LES IMAGES ══════════════════════════════════
 *
 * Le nom de la boutique, sa distance, sa ville, le nom du fauteuil, sa
 * matière et ses 390 € viennent de `maison-dax` dans `apercu-habitant.ts` —
 * un commerce qui n'existait pas et qu'il a fallu écrire, la catégorie
 * « Commerces » n'ayant aucun meuble.
 */

/** La boutique de la démonstration dont ce parcours raconte une pièce. */
export const COMMERCE_DECO = "maison-dax";

/** Le fauteuil et le coussin, désignés par leur entrée de carte. */
export const PIECE_DECO = "md-1";
export const COUSSIN_DECO = "md-3";

/**
 * ═══ LA PAIRE, ET C'EST LE MÊME SALON DEUX FOIS ════════════════════════════
 *
 * MÊME PIÈCE, MÊME CADRAGE, MÊME LUMIÈRE, sans puis avec le fauteuil. C'est
 * ce qui rend la comparaison lisible — deux salons différents montreraient
 * deux photos, pas un essayage. Même règle que l'avant/après de la mode et de
 * la coiffure, et c'est la troisième fois qu'elle se vérifie.
 */
export const SALON_AVANT = "/direct/deco/salon-avant.jpg";
export const SALON_APRES = "/direct/deco/salon-apres.jpg";

/** Le fauteuil en grand, et ses deux détails de près. */
export const FAUTEUIL_DECO = "/direct/deco/fauteuil-grand.jpg";
export const DETAILS_DECO: { photo: string; quoi: string }[] = [
  { photo: "/direct/deco/detail-velours.jpg", quoi: "Le velours côtelé" },
  { photo: "/direct/deco/detail-coussin.jpg", quoi: "Le coussin tissé" },
];

/** La boutique, pour la dernière étape. Son enseigne est la nôtre. */
export const BOUTIQUE_DECO = "/direct/deco/boutique-maison-dax.jpg";

/** Combien d'étapes, et dans quel ordre. Le numéro « 1/4 » en dépend. */
export const ETAPES_DECO = 4;
