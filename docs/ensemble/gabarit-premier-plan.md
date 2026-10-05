# Grand salon d'Ensemble — gabarit figé (390 × 844)

Un seul gabarit sert à préparer les images ET à les assembler. Les cotes
font foi dans `gabarit-390x844.json` (points CSS d'un écran 390 × 844 ;
pour une image à 3×, multiplier par 3). Les deux images en sont tirées :

- `gabarit-390x844-sur-la-scene.png` : le gabarit posé sur la scène validée ;
- `gabarit-390x844-calque-3x.png` : le même, seul, sur fond transparent,
  en 1170 × 2532 — à superposer à l'image en préparation.

Redessiner après une retouche des cotes :
`python3 docs/ensemble/dessiner-gabarit.py <capture 780×1688> <sur-la-scene.png> <calque-3x.png>`

## Ce qui est fixe

| Élément | Où (points, écran 390 × 844) |
| --- | --- |
| En-tête de l'app | y 0 → 140, rien d'important dessous |
| Horizon du décor | y 250 (point de fuite x 195) — caméra peu plongeante, 10 à 15° |
| Bibliothèque (calque séparé) | x 0 → 121, y 0 → 270 ; elle passe devant le groupe du fond |
| Groupe du fond | x 70 → 230, y 160 → 270 (pied y 262), en partie derrière la bibliothèque |
| Groupe du milieu | x 145 → 405, y 255 → 425 (pied y 404), peut déborder à droite |
| Bloc du premier plan (titre, statut, dernier message) | x 12 → 228, y 336 → 436 — aucun visage dessous |
| Bouton « Ouvrir la discussion » | x 85 → 305, y 686 → 732 |
| Bande libre autour du bouton | y 680 → 740, ni visage ni contenu partagé |
| Mot « Discuter » de la barre | x 150 → 240, y 735 → 772 |
| Barre de l'app | y 795 → 844 |

### Le groupe du premier plan

- **Banquette** : boîte x −40 → 430 (elle déborde de 40 de chaque côté),
  y 480 → 770 ; son bas est caché par la table et la bande du bouton.
  - haut du dossier : y 492 au centre, 518 à x 60 et 330, 548 aux bords
    (elle s'enroule vers nous) — **il arrive aux épaules des fantômes** ;
  - ligne d'assise : y 585 au centre, 592 à x 105 et 285, 604 à x 40 et 350.
- **Trois fantômes** : centres x 105, 195, 285 ; haut de la tête y 455,
  450, 455 ; bas posé sur la ligne d'assise ; environ 115 de large.
- **Plateau** : ellipse de centre (195, 620), 320 × 110, chant de 12.
  Son bord arrière (y 565 au centre, 575 à x 105 et 285) passe devant
  le bas des fantômes. Le pied reste sous y 680, caché par la bande du
  bouton.
- **Contenu partagé** : quadrilatère (115, 588) (275, 588) (290, 648)
  (100, 648) — une photo, ou deux côte à côte.

## Les images à préparer (dans cet ordre)

Toutes en PNG transparent, sauf le fond. Même lumière que le salon actuel
(chaude, lampes, fin de journée). Pas d'ombre portée au sol dessinée dans
l'image : les ombres sont posées à l'assemblage.

1. **Banquette du premier plan** — arrondie, **vue de face** (0° de lacet),
   **18 à 22° de plongée**, cuir chaud ou velours. Dossier **bas**. Elle
   doit remplir la boîte du gabarit : 1410 × 870 px à 3×. Si possible,
   les coussins de dossier en PNG séparés.
2. **Table du premier plan** — ronde, **même caméra que la banquette**
   (18 à 22°) : le dessus est une ellipse environ **3 fois plus large que
   haute**, chant fin, **pied court et discret**. 960 × 400 px à 3× pour le
   plateau et le haut du pied ; le plateau vide (le contenu est ajouté).
3. **Fond** — un salon enveloppant, 1170 × 2532 px (cadrage « cover » du
   téléphone), horizon à y 750 px (250 points). Sur les côtés, des
   éléments qui encadrent (boiseries, lampes, plantes) entre x 0–180 px et
   x 990–1170 px, de y 420 à 1440 px, sans entrer dans les zones des
   groupes. Peu de sol libre au centre. La bibliothèque reste un calque à
   part, à gauche.
4. Ensuite, peu d'accessoires (emplacements dans le gabarit, relatifs à la
   table du premier plan — ils la suivent au défilement) :
   - **une petite lampe chaude** (laiton, abat-jour champignon), environ
     30 × 56 points à l'écran (90 × 168 px à 3×), posée sur le plateau à
     droite, à hauteur du corps des fantômes, jamais devant un visage ;
   - **deux tasses** (avec soucoupe), environ 34 × 24 points (100 × 72 px à 3×) ;
   - **une plante** de premier plan, au bord gauche, environ 86 × 232
     points (260 × 700 px à 3×), fixe dans le cadre, hors du bouton et de
     la barre.
   Même caméra que la table reçue (plateau environ 5 fois plus large que
   haut), PNG transparents, lumière chaude venant de la gauche.

Les fantômes actuels (de face, à hauteur d'œil) conviennent : ils sont
posés sur la ligne d'assise, le bas caché par le plateau.

## Vue fixe validée (révision 2)

- La bibliothèque est allégée (64 points de large) et posée devant le bord
  gauche du passage vers la seconde pièce ; derrière elle, le passage reste
  libre pour la disparition des tables pendant le défilement.
- Chaque étiquette est au-dessus de sa table, avec une pointe vers elle ;
  le bloc du premier plan est compact et posé juste au-dessus du dossier.
- Premier plan figé : banquette, table (360 points de large), fantômes
  assis (ligne y 598, bas caché par le plateau), photo partagée à cette taille.

## Assemblage, à réception

1. Composer **seul** le groupe du premier plan dans le décor, au gabarit :
   banquette, fantômes sur la ligne d'assise, masques (le plateau devant le
   bas des fantômes ; l'avant de l'assise et les accoudoirs redessinés
   par-dessus), ombres de contact.
2. Le faire valider.
3. Décliner le milieu et le fond.
4. Rebrancher le défilement **sans toucher à la mécanique** : positions,
   échelles et masques par profondeur seulement.
