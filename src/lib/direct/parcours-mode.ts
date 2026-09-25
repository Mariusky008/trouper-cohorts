/**
 * 👗 LE PARCOURS MODE — quatre étapes, de la pièce à la boutique.
 *
 * ═══ CE QU'IL A DEMANDÉ ════════════════════════════════════════════════════
 *
 * « Voici la suite : parcours mode d'abord et on fera la suite après. »
 *
 * QUATRE ÉCRANS, DANS SON ORDRE : la pièce, le rendu sur soi, les façons de la
 * porter, et la boutique qui l'attend. C'est la « partie 2 » annoncée quand on
 * a fait l'écran de choix — celle qui commence « quand l'un de ces commerçants
 * nous plaît ».
 *
 * ═══ CE FICHIER NE DÉCLARE QUE CE QUI N'EXISTE NULLE PART AILLEURS ═════════
 *
 * L'ENSEIGNE, LA DISTANCE, LA VILLE, LE NOM DE LA PIÈCE ET SON PRIX viennent
 * de la boutique de la démo et de sa journée — voir `apercu-habitant.ts`. La
 * veste blazer rose y est un moment comme un autre, avec son prix : elle
 * s'affiche donc à l'identique sur l'annonce, sur l'écran de choix et ici.
 * Écrite trois fois, elle aurait divergé au premier changement.
 *
 * CE QUI RESTE ICI : les images du parcours, et les mots de chaque étape.
 * Les images d'abord, parce qu'il va envoyer les siennes — une ligne par
 * photo, et rien à chercher ailleurs le jour où elles arrivent.
 */

/** La boutique de la démo dont ce parcours raconte une pièce. */
export const COMMERCE_MODE = "mode-centre";

/**
 * LA PIÈCE, DÉSIGNÉE PAR SA PHOTO.
 *
 * ON NE RECOPIE NI SON NOM NI SON PRIX : le parcours retrouve le moment de la
 * journée dont la photo est celle-ci, et lit son titre et son prix. C'est la
 * même règle que sur l'écran de choix, et pour la même raison — un prix écrit
 * à deux endroits est un prix faux à l'un des deux.
 */
export const PIECE_MODE = "/direct/accueil/mode-apres.jpg";

/**
 * L'AVANT ET L'APRÈS.
 *
 * DEUX PHOTOS DE LA MÊME PERSONNE, AU MÊME ENDROIT, sans puis avec la pièce.
 * C'est ce qui rend la comparaison honnête : deux mannequins différentes
 * montreraient deux photos, pas un essayage. Elles existaient déjà dans le
 * dépôt — elles servaient à l'ancien écran d'ouverture.
 */
export const AVANT_MODE = "/direct/accueil/mode-avant.jpg";
export const APRES_MODE = "/direct/accueil/mode-apres.jpg";

/** La devanture, pour la dernière étape. */
export const DEVANTURE_MODE = "/direct/vitrine-mode.jpg";

/**
 * ═══ LA TROISIÈME ÉTAPE : LA MÊME VESTE, SUR D'AUTRES FEMMES ═══════════════
 *
 * « On a une veste rose à l'essai et trois femmes en bas qui ont des tenues qui
 * n'ont rien à voir avec la veste rose d'essayage. Je t'ai mis trois femmes qui
 * portent la même veste. »
 *
 * IL AVAIT RAISON DEUX FOIS, ET IL VIENT DE DÉBLOQUER LA BONNE VERSION. Le
 * premier jet promettait « plusieurs façons de la porter » et montrait trois
 * autres vêtements ; le rattrapage montrait les autres pièces de la boutique,
 * ce qui était honnête mais répondait à une autre question. La vraie question
 * d'un essayage est « est-ce que ça tombe bien sur quelqu'un comme moi », et on
 * n'y répond qu'avec LA MÊME PIÈCE SUR D'AUTRES CORPS.
 *
 * TROIS FEMMES, TROIS ÂGES, TROIS ENDROITS DE LA VILLE, UN SEUL BLAZER. C'est
 * ce qui rend le bloc utile : la mannequin de l'essayage a vingt-cinq ans, et
 * celle qui regarde l'écran n'en a pas forcément vingt-cinq.
 *
 * LA LÉGENDE DÉCRIT CE QU'ON VOIT, ET RIEN DE PLUS. Pas de prénom, pas d'avis,
 * pas de « taille 38 » : on n'a ni l'un ni l'autre. On a une photo, et on dit
 * sur quoi la veste est portée — c'est vérifiable à l'œil, sur l'image même.
 */
export const FACONS_MODE: { photo: string; ou: string; avec: string }[] = [
  { photo: "/direct/accueil/mode-porte-bureau.jpg", ou: "Au bureau", avec: "Sur un jean noir" },
  { photo: "/direct/accueil/mode-porte-terrasse.jpg", ou: "En terrasse", avec: "Sur un tee-shirt blanc" },
  { photo: "/direct/accueil/mode-porte-marche.jpg", ou: "Au marché", avec: "Sur une chemise claire" },
];

/** Combien d'étapes, et dans quel ordre. Le numéro « 1/4 » en dépend. */
export const ETAPES_MODE = 4;
