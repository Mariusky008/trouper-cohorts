# L'ouverture en trois actes

Trois images, et l'animation les joue dans cet ordre :

| Fichier | Ce qu'on y voit | Durée |
|---|---|---|
| `1.jpg` | Le Fantôme sur son canapé, qui ouvre ClikMe. | 2 s |
| `2.jpg` | On s'est rapproché du téléphone : il touche une veste, elle apparaît sur son image. | 4 s |
| `3.jpg` | Il est devant la boutique, la veste est en vitrine, la commerçante l'accueille. | 3 s |

**Une découverte, un essai, une vraie rencontre.** C'est la phrase qui résume ce
que l'ouverture doit faire comprendre, et c'est aussi l'ordre des trois actes :
on ne peut en déplacer aucun.

## Ce que les images doivent porter, et ce que le code ajoute

**LA PROMESSE EST DANS L'IMAGE, EN HAUT, ET IDENTIQUE SUR LES TROIS.** « Votre
ville à essayer. Avant d'y aller. » ne bouge donc pas d'un pixel pendant les
fondus : deux textes identiques qui se croisent ne se voient pas se croiser.
C'est ce qui permet de garder la promesse générale à l'écran pendant les neuf
secondes sans qu'elle clignote — et c'était sa demande : « garde la promesse
générale, puis affiche les cinq catégories sur l'écran qui suit ».

**LA LÉGENDE DU BAS EST DANS L'IMAGE AUSSI**, et elle change à chaque acte :
« On fait quoi aujourd'hui ? », « Cette tenue, sur mon téléphone. », « Essayé
sur mon écran. Maintenant, chez le commerçant. »

**LE CODE N'AJOUTE QUE LE MOUVEMENT** : le fondu entre les actes, le lent
rapprochement de la caméra — plus marqué au deuxième acte, puisque c'est là
qu'on « se rapproche du téléphone » — et la sortie. Rien n'est écrit par-dessus
les images : un texte dessiné en plus d'un texte incrusté aurait fini par ne
plus être au même endroit sur un téléphone étroit.

## Le format

Les images de ses maquettes font **941 × 1672**. L'écran d'un téléphone est plus
étroit que ça, donc l'image entière ne peut pas remplir le cadre sans être
rognée par les côtés — et c'est la promesse, qui prend presque toute la largeur,
qui serait coupée la première.

**L'IMAGE EST DONC POSÉE EN ENTIER, et les bandes qui restent sont remplies par
l'image elle-même, agrandie et floutée.** C'est le procédé déjà en place dans le
parcours mode et sur les photos des cuisiniers : le bord ne se voit pas, et il
n'y a aucune couleur à deviner.

## Sans les images, il ne se passe rien

Si `1.jpg` est absente, **l'ouverture se retire d'elle-même** et la démonstration
s'ouvre directement sur les cinq catégories, comme avant. C'est volontaire : une
ouverture à moitié chargée est pire que pas d'ouverture du tout, et personne ne
doit avoir à toucher au code pour la désactiver.
