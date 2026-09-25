/**
 * ✂️ LE PARCOURS COIFFURE — quatre étapes, de la coupe au rendez-vous.
 *
 * ═══ CE QU'IL A DONNÉ ══════════════════════════════════════════════════════
 *
 * Quatre écrans dessinés, dans cet ordre : la coupe et son salon ; l'essayage
 * avant/après ; d'autres coupes ; et « envie de la faire pour de vrai ? ».
 *
 * SA COQUE EST DIFFÉRENTE DE CELLE DE LA MODE, ET ELLE EST MEILLEURE. Le logo
 * reste en haut, la pastille du salon se tient sous lui à gauche sur les quatre
 * écrans, le fantôme veille en haut à droite, et la photo occupe tout le reste.
 * On sait donc en permanence chez qui on est — ce que le parcours mode ne dit
 * qu'une fois sur deux.
 *
 * ═══ CE FICHIER NE DÉCLARE QUE LES IMAGES ══════════════════════════════════
 *
 * Le nom du salon, sa distance, sa ville, le nom de la coupe et son prix
 * viennent du salon de la démo et du moment de sa journée qui porte cette
 * photo. Voir `apercu-habitant.ts`. Les recopier ici ferait deux vérités.
 */

/** Le salon de la démo dont ce parcours raconte une coupe. */
export const COMMERCE_COIFFURE = "coif-centre";

/**
 * LA COUPE, DÉSIGNÉE PAR SA PHOTO — comme la pièce du parcours mode.
 *
 * C'EST L'APRÈS DE LA PAIRE. La même femme, au même endroit, dans le même haut,
 * avant et après : c'est ce qui rend l'essayage lisible. Deux mannequins
 * différentes montreraient deux photos, pas une coupe.
 */
export const AVANT_COIFFURE = "/direct/accueil/coiffure-avant.jpg";
export const APRES_COIFFURE = "/direct/accueil/coiffure-apres.jpg";

/** Le salon, pour la dernière étape. */
export const SALON_COIFFURE = "/direct/salon-neuf.jpg";

/**
 * ═══ CE QUE MONTRE LA TROISIÈME ÉTAPE ══════════════════════════════════════
 *
 * SA MAQUETTE MONTRE LA MÊME COUPE SUR TROIS VISAGES — trente, cinquante-cinq
 * et soixante-sept ans. C'est le bon écran : il répond à « est-ce que ça marche
 * sur une tête comme la mienne », qui est la vraie question d'un essayage.
 *
 * JE N'AI PAS CES TROIS PHOTOS, et je ne peux pas les fabriquer ici. Trois
 * portraits de femmes différentes avec des coupes différentes ne diraient pas
 * « la même coupe sur d'autres visages » : ils diraient « d'autres coupes »,
 * et c'est exactement le reproche qu'il vient de faire au parcours mode.
 *
 * L'ÉTAPE MONTRE DONC CE QU'ELLE A : les autres coupes que ce salon propose
 * aujourd'hui, avec leur nom et leur prix, lues dans sa journée. Le titre le
 * dit. Le jour où les trois portraits arrivent, cette étape redevient la
 * sienne — c'est un titre et une source à changer.
 */
export const ETAPES_COIFFURE = 4;
