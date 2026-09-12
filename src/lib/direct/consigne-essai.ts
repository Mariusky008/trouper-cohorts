// 🪞 LA CONSIGNE DE L'ESSAI — ce qu'on demande au modèle d'image, mot pour mot.
//
// ═══ POURQUOI ELLE VIT DANS UNE BIBLIOTHÈQUE ET NON DANS LA ROUTE ══════════
//
// PARCE QUE C'EST DU CONTENU DE PRODUIT, PAS DE LA PLOMBERIE. Cette fonction ne
// fait aucun appel réseau, ne lit aucun en-tête, ne dépend de rien : elle écrit
// une phrase. Et c'est LA phrase dont dépend la moitié du résultat.
//
// ET PARCE QU'ENFERMÉE DANS LA ROUTE, ELLE N'ÉTAIT PAS VÉRIFIABLE. Une route ne
// se teste qu'en la faisant tourner, avec un serveur, une clé et un faux
// fournisseur ; une fonction pure se lit et se mesure en trois lignes. Le seul
// défaut grave de tout l'essayage — « ce n'est pas exactement ma tête ni les
// mêmes lunettes » — venait d'ici, et rien ne le surveillait.

/**
 * LA CONSIGNE, ET ELLE EST LA MOITIÉ DU RÉSULTAT.
 *
 * TROIS CHOSES DOIVENT Y ÊTRE, et chacune répare une façon de rater :
 *
 *   · CE QU'ON GARDE. Sans « ne change rien d'autre », le modèle redresse la
 *     main, change la lumière, remplace l'arrière-plan — et la cliente ne
 *     reconnaît plus sa propre photo, donc ne croit plus le rendu.
 *   · CE QU'ON PREND DE LA RÉFÉRENCE. Pas « inspire-toi » mais « reproduis
 *     exactement » : la forme, la longueur, la couleur, le motif. C'est le
 *     travail du commerçant qu'on essaie, pas une interprétation.
 *   · CE QU'ON N'INVENTE PAS. Une main a cinq doigts et la photo en montre
 *     peut-être quatre ; ajouter le cinquième est un mensonge visible.
 *
 * ═══ ELLE A ÉTÉ RÉÉCRITE, ET LE DÉFAUT VENAIT D'UN VISAGE ══════════════════
 *
 * « Ce n'est pas exactement ma tête ni les mêmes lunettes, donc assez déçu. »
 *
 * C'EST LE DÉFAUT LE PLUS GRAVE QUE CET ESSAI PUISSE AVOIR, parce qu'il en
 * annule le sens : si ce n'est pas moi, ça ne me dit rien sur moi — et une
 * coupe magnifique sur le visage d'un autre, c'est exactement ce qu'un
 * catalogue faisait déjà.
 *
 * LA PREMIÈRE VERSION DISAIT « ne modifie RIEN d'autre que la zone concernée ».
 * C'est une phrase GÉNÉRALE, et un modèle d'image l'applique généreusement : il
 * redresse, il rajeunit, il lisse la peau, il remplace une monture par une
 * monture qui va mieux. Il ne sait pas ce qui compte pour la personne. Il faut
 * le lui NOMMER, trait par trait — le nez, la mâchoire, les rides, les cernes,
 * l'âge, la barbe — et lui INTERDIRE explicitement d'embellir, parce
 * qu'embellir est son penchant naturel et qu'il le prend pour un service.
 *
 * ELLE S'ÉCRIT EN DEUX MORCEAUX. Le noyau commun est ici ; la liste PROPRE AU
 * MÉTIER arrive de l'écran (`garder`), parce qu'elle ne peut pas être la même
 * partout : chez le coiffeur les lunettes doivent rester, chez le lunetier
 * elles sont précisément ce qui change.
 */
export function consigne(partie: string, garder: string[] = []): string {
  return [
    `Première image : la photo d'un client, montrant ${partie}.`,
    "Deuxième image : la photo de référence d'un professionnel, montrant le résultat à reproduire.",
    "",
    `Reproduis EXACTEMENT ce que montre la deuxième image, appliqué à ${partie} de la`,
    "première image : la forme, la longueur, la couleur, le motif, la finition et la brillance.",
    "",
    "═══ CE QUI NE DOIT ABSOLUMENT PAS CHANGER ═══",
    "C'est la MÊME personne, sur la MÊME photographie. On doit pouvoir superposer",
    `l'image rendue et l'image d'origine et ne voir de différence QUE sur ${partie}.`,
    "",
    "- Le visage trait pour trait : la forme et la largeur du nez, la bouche, les yeux,",
    "  les sourcils, la mâchoire, le front, les oreilles, les rides, les cernes,",
    "  les grains de beauté, les cicatrices, la pilosité et la barbe telles qu'elles sont.",
    "- L'âge, la carnation, le teint et l'expression exactement tels qu'ils sont.",
    "- La pose, l'angle de la tête, le cadrage, l'arrière-plan, la lumière et les ombres.",
    "- Les vêtements et leur couleur.",
    ...garder.map((g) => `- ${g}`),
    "",
    "═══ CE QU'IL NE FAUT SURTOUT PAS FAIRE ═══",
    "- Ne rajeunis pas, n'amincis pas, ne lisse pas la peau, n'efface aucune ride,",
    "  aucun défaut, aucune asymétrie. N'« améliore » pas la photo.",
    "- Ne redresse pas la pose, ne recadre pas, ne change pas l'objectif ni la profondeur de champ.",
    "- N'ajoute aucun objet, aucun accessoire, aucun texte, aucun filigrane, aucun doigt.",
    "- Ne remplace aucun accessoire porté par la personne par un autre qui irait mieux.",
    "",
    "Le résultat doit ressembler à la photographie d'origine retouchée par un professionnel,",
    "et non à un nouveau portrait de quelqu'un qui lui ressemble.",
    "",
    "Rends uniquement l'image modifiée.",
  ].join("\n");
}

