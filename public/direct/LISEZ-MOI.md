# Les photos d'illustration du Direct

Six photos, et elles ne servent qu'à DEUX cas :

1. **Les cartes de la ville** montrées à l'acte 3 de la démonstration. Elles
   décrivent d'autres commerces que celui qui regarde — on ne peut donc pas y
   mettre ses photos à lui, et on ne veut nommer personne.
2. **Le repli** quand un commerçant n'a aucune photo sur sa fiche Google.

Partout ailleurs, ce sont SES photos qui sont affichées. C'est délibéré : ce qui
frappe un commerçant, c'est de voir son propre commerce dans l'écran de ses
clients, pas une image de banque plus jolie que la réalité.

## Les noms de fichiers attendus

Le code les cherche à ces adresses exactes. Un fichier absent n'est pas une
panne : la carte retombe sur son fond dégradé (voir `carte-swipe.tsx`, où
l'image et le dégradé sont deux couches empilées, précisément pour ça).

| Fichier                | Ce qu'il montre                                  |
|------------------------|--------------------------------------------------|
| `plat-du-jour.jpg`     | Une assiette de plat du jour                      |
| `tables-libres.jpg`    | Une salle de restaurant, tables vides             |
| `sortie-du-four.jpg`   | Des viennoiseries qui sortent du four             |
| `vitrine-du-soir.jpg`  | Une vitrine de commerce éclairée, le soir         |
| `portion-a-emporter.jpg` | Une part soulevée d'un plat entamé              |
| `tablee-du-soir.jpg`   | Une tablée conviviale, le soir                    |

Les deux dernières ont été ajoutées parce que deux moments n'avaient AUCUNE
image juste : « il m'en reste » tombait sur l'assiette du menu du jour (une
image qui contredit son texte), et « une table à partager » sur une devanture
vide. Elles ne sont pas là pour varier — elles sont là parce que la carte ment
sans elles.

## Le format, et pourquoi il n'est pas négociable

- **Vertical, ratio 3:4.** Le cadre de la carte est en 3/4,15 : une photo
  horizontale s'y fait couper les deux côtés.
- **1200 × 1600 px** suffit. La plus grande carte fait 250 px de large en CSS ;
  sur un téléphone à 3×, ça monte à 750 px physiques.
- **JPEG, 200 à 400 Ko.** Le fond est très sombre, monter en qualité ne se voit
  pas et coûte du temps de chargement à un moment où l'on ne peut pas se le
  permettre.

## LE CADRAGE — c'est ce qui compte le plus

Le bas de la carte est recouvert d'un voile dégradé qui porte le nom, le métier,
l'offre et le prix. Ce voile est opaque à 72 % dès 58 % de la hauteur.

| Zone de l'image | Ce qu'on en voit                                    |
|-----------------|------------------------------------------------------|
| 0 – 15 %        | Légèrement assombri (le badge du temps y est posé)   |
| **15 – 50 %**   | **Pleinement visible — le sujet va ICI**             |
| 58 – 100 %      | Noirci, puis illisible                                |

Autrement dit : **le sujet doit être dans la moitié haute**, pas au centre. Une
assiette parfaitement centrée disparaît à moitié sous le texte.

Le recadrage est en `cover` centré : une image plus haute que 3:4 est rognée en
haut ET en bas, symétriquement. Prévoir un peu d'air au-dessus du sujet.
