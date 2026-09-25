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
 * ═══ CE QUE MONTRAIT LA TROISIÈME ÉTAPE, ET POURQUOI ELLE NE LE MONTRE PLUS ══
 *
 * « Les trois femmes ne portent pas du tout la même veste que la modèle. »
 *
 * IL A RAISON, ET C'ÉTAIT INDÉFENDABLE. Le titre promettait « une pièce,
 * plusieurs façons de la porter » et les images montraient trois autres
 * vêtements sur trois autres personnes. Le titre annonçait une chose, les
 * images en montraient une autre.
 *
 * JE N'AI PAS TROIS PHOTOS DU MÊME BLAZER PORTÉ AUTREMENT, et je ne peux pas en
 * fabriquer ici. L'étape montre donc les AUTRES PIÈCES de cette boutique, lues
 * dans sa journée avec leur nom et leur prix — voir `autresPieces` dans
 * l'écran. Rien n'est déclaré ici : ce serait un second endroit où les écrire.
 *
 * POUR RETROUVER SA MAQUETTE : trois photos du même blazer porté différemment,
 * déclarées ici comme les autres images du parcours, et le bloc redevient
 * « plusieurs façons de la porter ».
 */

/** Combien d'étapes, et dans quel ordre. Le numéro « 1/4 » en dépend. */
export const ETAPES_MODE = 4;
