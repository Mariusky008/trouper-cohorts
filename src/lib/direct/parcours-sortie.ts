/**
 * 🎺 LE PARCOURS SORTIE — quatre étapes, de l'affiche au trottoir.
 *
 * ═══ CE QU'IL A DONNÉ ══════════════════════════════════════════════════════
 *
 * Quatre écrans dessinés : « Ce soir, ça joue ici » ; l'extrait qu'on écoute ;
 * avec qui partager la soirée ; et « votre soirée commence ici ».
 *
 * C'EST LE PREMIER PARCOURS QUI NE SE REGARDE PAS, IL S'ÉCOUTE. Les deux
 * autres montrent un résultat — une coupe, une veste — et un résultat est une
 * image. Une soirée, non : ce qu'on y vend est une ambiance, et une ambiance
 * ne se photographie pas. D'où les dix secondes de son, qui sont VRAIES.
 *
 * ═══ CE FICHIER NE DÉCLARE QUE LES IMAGES ══════════════════════════════════
 *
 * LE RESTE EXISTE DÉJÀ, DEUX FOIS, ET C'EST TANT MIEUX. L'événement vit dans
 * `apercu-habitant.ts` — son titre, son heure, son lieu, sa distance, ce qu'il
 * faut savoir avant d'y aller, l'itinéraire. Sa soirée vit dans `soiree.ts` —
 * l'extrait sonore et sa durée, la question qu'on pose après l'écoute, les
 * Fantômes déjà là. Le parcours lit les deux et n'en recopie rien.
 */

/** L'événement de la démonstration dont ce parcours raconte la soirée. */
export const SORTIE_ID = "kiosque";

/**
 * ═══ LES DEUX PHOTOS, ET POURQUOI ELLES SONT RECADRÉES ═════════════════════
 *
 * ELLES VIENNENT DE SES MAQUETTES, et elles sont bien meilleures que celle que
 * le dépôt avait : `concert-kiosque.jpg` montre deux guitares électriques dans
 * le noir, ce qui n'est ni un trio de jazz ni une envie de sortir.
 *
 * L'ENSEIGNE A ÉTÉ CADRÉE DEHORS, ET C'ÉTAIT OBLIGATOIRE. Ses deux images
 * portent un néon « Le Splendid » — un lieu que la démonstration n'a pas. La
 * photo aurait nommé une salle pendant que l'écran en nommait une autre : le
 * même défaut que la femme titrée « coupe homme », en plus difficile à voir.
 * On ne retouche pas une image pour effacer ce qui gêne ; on cadre autrement.
 */
export const TRIO_SORTIE = "/direct/soiree/trio-au-kiosque.jpg";
export const TABLEE_SORTIE = "/direct/soiree/tablee-au-concert.jpg";

/** Combien d'étapes, et dans quel ordre. Le numéro « 1/4 » en dépend. */
export const ETAPES_SORTIE = 4;
