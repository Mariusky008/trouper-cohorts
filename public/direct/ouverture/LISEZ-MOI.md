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

**MESURÉ SUR QUATRE TÉLÉPHONES.** Sur un écran court — 440 × 760, 360 × 640 —
l'image remplit tout et il n'y a aucune bande. Sur un grand — 390 × 844,
430 × 932 — il reste 76 à 84 points en haut et en bas, remplis par le flou.

**POURQUOI PAS « COVER », QUI REMPLIRAIT TOUJOURS.** Il rognerait par les côtés :
sur un 390 × 900, neuf pour cent de chaque bord. « Maintenant, chez le
commerçant. » commence à douze pour cent du bord gauche. Douze contre neuf, c'est
trois pour cent de marge — un téléphone un peu plus haut et sa phrase est coupée.
On ne joue pas la composition de quelqu'un à trois pour cent près.

## Les trois films, et ce qu'ils doivent respecter

C'est la voie choisie : **le mouvement est dans le film, pas dans le code.** Le
code n'enchaîne que les trois actes.

| Fichier | La scène | Durée |
|---|---|---|
| `1.mp4` + `1.webm` | Le Fantôme sur son canapé, qui ouvre ClikMe. | **2 s** |
| `2.mp4` + `2.webm` | On s'est rapproché du téléphone : il touche une veste, elle apparaît sur son image. | **4 s** |
| `3.mp4` + `3.webm` | Il est devant la boutique, la veste en vitrine, la commerçante l'accueille. | **3 s** |

**L'ORDRE DES DURÉES EST 2, 4, 3 — PAS 2, 3, 4.** Le deuxième acte est le plus
long parce que c'est celui qui doit être compris : c'est là qu'on voit la veste
se poser sur lui alors que lui ne change pas. Les deux autres posent le décor et
referment.

### Six règles, et chacune a coûté quelque chose

1. **Largeur et hauteur PAIRES.** 941 × 1672 ne s'encode pas en H.264 — mesuré,
   l'encodeur refuse : « width not divisible by 2 ». **940 × 1672** convient.
2. **Aucune piste son.** Un navigateur refuse de démarrer tout seul une vidéo
   qui a du son, et le film resterait sur son affiche. Une ouverture sonore
   serait de toute façon la meilleure façon de faire fermer une démonstration
   ouverte dans une salle d'attente.
3. **Le même cadrage que les images, sans zoom qui pousse le texte dehors.**
   L'écran est plus étroit que le film : il est rogné par les côtés, et
   « Maintenant, chez le commerçant. » commence déjà à douze pour cent du bord.
   Un zoom avant de douze pour cent suffit à la couper — vérifié sur un film
   d'essai.
4. **La promesse au même endroit sur les trois**, comme sur les images : deux
   textes identiques qui se croisent pendant un fondu ne se voient pas se
   croiser.
5. **Les deux formats.** Le `webm` passe en premier — plus léger à qualité
   égale — et le `mp4` sert aux navigateurs qui ne le lisent pas. Un seul des
   deux suffit à jouer, mais les deux évitent de découvrir le manquant en
   rendez-vous.
6. **Le poids.** Ils sont servis avant le premier écran de chaque
   démonstration. En dessous de 1,5 Mo par fichier, ça ne se sent pas.

### Les images restent, et elles servent

Les trois `.jpg` ne sont pas remplacés : ils deviennent **l'affiche** de chaque
film — ce qu'on voit tant que la première image n'est pas prête, sans quoi chaque
acte commencerait par un éclair noir. **Et si un film manque, son affiche reste
et l'acte dure exactement sa durée annoncée** : l'ouverture se joue alors en
photos fixes, comme aujourd'hui.

### Qui décide de la fin d'un acte

**Le film.** C'est son `ended` qui fait passer au suivant, donc une prise un peu
plus longue que prévu ne se fait pas couper au milieu. Une horloge de secours
tranche une seconde et demie plus tard si l'événement n'arrive jamais — fichier
abîmé, décodeur qui cale, onglet mis en arrière-plan. Sans film, c'est la durée
annoncée qui commande, au dixième près.

## Sans les images, il ne se passe rien

Si `1.jpg` est absente, **l'ouverture se retire d'elle-même** et la démonstration
s'ouvre directement sur les cinq catégories, comme avant. C'est volontaire : une
ouverture à moitié chargée est pire que pas d'ouverture du tout, et personne ne
doit avoir à toucher au code pour la désactiver.
