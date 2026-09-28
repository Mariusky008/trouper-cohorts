# L'ouverture en trois actes

Neuf secondes avant le premier écran de la démonstration. Trois actes, joués
dans cet ordre — et l'ordre est tout le propos :

| Acte | Ce qu'on y voit | Durée | Poses |
|---|---|---|---|
| 1 | Le Fantôme sur son canapé, qui ouvre ClikMe. | 2 s | `poses/1` `poses/2` `poses/3` |
| 2 | Sur son téléphone : il touche une veste, elle apparaît sur son image. | 4 s | `poses/4` `poses/5` `poses/6` |
| 3 | Devant la boutique, la même veste en vitrine, la commerçante l'accueille. | 3 s | `poses/7` `poses/8` `poses/9` |

**Une découverte, un essai, une vraie rencontre.** C'est ce que l'ouverture doit
faire comprendre, et c'est aussi l'ordre des trois actes : on ne peut en
déplacer aucun. Chacun pris seul ne dit rien de neuf — un fantôme sur un canapé
est une mascotte, un essayage virtuel existe ailleurs, une commerçante qui
accueille est une photo de site. C'est la SUITE qui dit ce que fait le produit.

## Les neuf poses

`poses/1.jpg` … `poses/9.jpg`, **941 × 1672 à l'origine, servies en 940 × 1672**.
Trois par acte. Ce sont elles la matière première : les films n'existent que
pour passer de l'une à l'autre.

**CE QUI DOIT ÊTRE IDENTIQUE D'UNE POSE À L'AUTRE : tout sauf le Fantôme.** Même
cadrage, même lumière, même décor au point près. C'est la condition du procédé —
mesuré sur ce jeu-ci, 2 à 22 % des pixels changent d'une pose à la suivante, et
le reste ne bouge pas du tout. Un fond qui bouge, même d'un point, et le fondu
se lit comme une secousse de caméra.

**CE QUE CHAQUE TRIO DOIT RACONTER**, dans l'ordre :

- **1, 2, 3** — affalé, sans téléphone · il le lève, l'écran s'allume dans ses
  yeux · il sourit.
- **4, 5, 6** — son écran le montre **en tee-shirt** · son doigt touche la
  vignette de la veste · **la veste est sur lui**. La 4 est la plus importante
  des neuf : c'est elle qui permet de faire *apparaître* la veste sur lui au
  lieu de faire voler une vignette.
- **7, 8, 9** — il arrive, elle ne l'a pas vu · elle le voit et s'avance · elle
  lui ouvre les bras.

**AUCUN TEXTE INCRUSTÉ.** La promesse et le mot de chaque acte sont écrits en
HTML par-dessus le film (voir plus bas). Un texte peint dans l'image serait flou
à l'échelle du téléphone, impossible à corriger sans refabriquer les films, et
il traverserait les fondus.

## Les films

`npm exec -- node scripts/fabriquer-ouverture.mjs` lit les neuf poses et écrit
six fichiers — `1.mp4` `1.webm` `2.mp4` `2.webm` `3.mp4` `3.webm` — plus les
trois affiches `1.jpg` `2.jpg` `3.jpg`.

- **940 × 1672, 30 images par seconde, sans audio.** 940 et pas 941 : H.264
  refuse une dimension impaire.
- **Les deux formats.** Le `webm` passe en premier parce qu'il est plus léger à
  qualité égale ; le navigateur qui ne sait pas le lire prend le `mp4`.
- **Moins de 800 ko chacun.**

Le script explique en détail comment il passe d'une pose à l'autre. En deux
lignes : un **flou de bougé posé à travers un masque** tiré de la différence
entre les deux poses — le personnage traîne, le décor reste net — et, pour la
veste, un **voile qui descend sur lui** dont la vitesse suit la quantité de
pixels que chaque rangée change, pour que la révélation occupe tout son temps.

## Ce que le code ajoute, et rien de plus

`src/components/direct/ouverture.tsx` :

- **La promesse, immobile, en haut** : « Votre ville à essayer. **Avant d'y
  aller.** » Elle est posée au-dessus des trois actes, donc elle ne bouge pas
  d'un point pendant les passages. C'était sa demande — garder la promesse
  générale pour éviter que neuf secondes de veste laissent croire à une
  application de mode — et l'écran suivant montre les cinq catégories.
- **Le mot de l'acte, en bas** : « Une découverte. » « Un essai. » « Une vraie
  rencontre. » Il est *dans* l'acte, donc il traverse le passage avec lui.
- **Le passage** : celui qui arrive RECOUVRE celui qui sort. Deux opacités qui
  se croisent laissent remonter le fond entre les deux plans ; ici le sortant
  garde son opacité pleine le temps du fondu, puis tombe quand il est déjà
  caché. Mesuré : l'opacité cumulée ne descend jamais sous 1.
- **Un doigt posé n'importe où passe l'ouverture.**

## Si un fichier manque

- **Pas de film** → l'affiche de l'acte reste à l'écran et l'acte garde sa durée
  annoncée. L'ouverture se joue en trois photos fixes.
- **Pas d'affiche du premier acte** → l'ouverture se retire d'elle-même et la
  démonstration s'ouvre directement. Neuf secondes de fond vide seraient une
  panne que personne ne peut deviner ni contourner.
