/**
 * 🍽️ LE PARCOURS RESTAURANT — quatre étapes, du plat à la table.
 *
 * ═══ CE QU'IL A DONNÉ ══════════════════════════════════════════════════════
 *
 * Quatre écrans dessinés : le plat et son prix ; ce qu'on mangera vraiment,
 * entier puis dans l'assiette ; la cuisinière qui raconte ; et « à midi, vous
 * savez où aller ».
 *
 * ═══ CE PARCOURS EST LE PLUS DOCUMENTÉ DES QUATRE, ET IL N'INVENTE RIEN ════
 *
 * LE BOCAL DE MARGOT EXISTE DÉJÀ ENTIÈREMENT DANS LA DÉMONSTRATION. Son nom,
 * ses 180 mètres, ses horaires, son mot, son site, sa cuisinière avec son
 * prénom, son rôle et sa phrase — « Je fais mes pâtes le matin même » — et
 * surtout SON CARTE : « Lasagnes maison, faites le matin, 11 € » et « La part
 * de lasagnes, dans sa barquette, 9 € ». Tout ce que ses quatre écrans
 * affichent est donc lu, jamais écrit ici.
 *
 * C'EST LE SEUL COMMERCE DE DÉMONSTRATION QUI PORTE UN NOM. Les autres sont
 * « un salon du centre », « une boutique de la rue piétonne ». Celui-là
 * s'appelle Le Bocal de Margot depuis le début, et c'est ce qui rend ce
 * parcours possible : on peut montrer sa devanture avec son enseigne, parce
 * que l'enseigne est la nôtre.
 */

/** Le restaurant de la démonstration dont ce parcours raconte un plat. */
export const COMMERCE_TABLE = "emporter";

/**
 * LE PLAT ET SA PART, DÉSIGNÉS PAR LEUR ENTRÉE DE CARTE.
 *
 * ON NE RECOPIE NI LEUR NOM NI LEUR PRIX : le parcours retrouve les deux
 * lignes de sa carte et lit leur nom, leur détail et leur prix. Onze euros sur
 * place, neuf euros à emporter — c'est écrit une seule fois, chez elle.
 */
export const PLAT_TABLE = "e-1";
export const PART_TABLE = "e-4";

/**
 * ═══ LES QUATRE PHOTOS, ET CELLES QU'ELLES REMPLACENT ══════════════════════
 *
 * ELLES VIENNENT DE SES MAQUETTES, et elles réparent deux défauts que le dépôt
 * traînait. `plat-lasagnes.jpg` montre des lasagnes au JAMBON ET AUX PETITS
 * POIS, avec la marque du plat en relief sur la poignée ; `plat-lasagnes-servi`
 * fait quatre cent quatre-vingts points de large, c'est-à-dire flou dès qu'on
 * le met en grand. Aucune des deux ne pouvait porter un écran plein cadre.
 *
 * LA DEVANTURE EST LA SEULE ENSEIGNE QU'ON S'AUTORISE, et elle est légitime :
 * elle porte « Le Bocal de Margot », qui est le nom de NOTRE commerce de
 * démonstration. La règle de `public/direct/LISEZ-MOI.md` interdit l'enseigne
 * d'un vrai commerçant qui n'a rien signé — pas la nôtre sur une image
 * fabriquée pour nous.
 *
 * LE PORTRAIT DE MARGOT EST CADRÉ À L'ÉCART DES TEXTES de la maquette, comme
 * le trio de jazz l'a été de son néon. On recadre, on ne retouche pas.
 */
export const PLAT_PHOTO = "/direct/table/lasagnes-plat.jpg";
export const PART_PHOTO = "/direct/table/lasagnes-portion.jpg";
export const MARGOT_PHOTO = "/direct/table/margot-en-cuisine.jpg";
export const DEVANTURE_TABLE = "/direct/table/devanture-margot.jpg";

/** Combien d'étapes, et dans quel ordre. Le numéro « 1/4 » en dépend. */
export const ETAPES_TABLE = 4;
