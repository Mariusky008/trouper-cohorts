# Le flyer commerçant — comment le refaire

`clikme-flyer-commercant.pdf` est le fichier à imprimer : **A5 recto-verso**
(148 × 210 mm), fonds perdus non nécessaires, tout est à l'intérieur des
10 mm de marge.

## Trois règles de fabrication, apprises à l'essai

**Aucune ombre portée.** Le moteur d'impression de Chromium ne sait pas rendre
une `box-shadow` floue sur un élément qui porte une rotation ou un débordement
caché : il la remplace par son rectangle englobant, en aplat. C'est ce qu'on
voyait sur la première version — des rectangles gris à côté des téléphones. Ce
qui les détache du fond est désormais une **lueur peinte en dégradé radial**,
c'est-à-dire de la couleur, que l'impression rend exactement comme l'écran.

**Les captures sont montrées entières.** Du haut de la barre à la barre du bas.
C'est la seule façon de faire comprendre que c'est un écran réel et pas une
maquette de présentation — et c'est aussi ce qui rend visible le fantôme, qui
vit en bas de l'écran.

**Les flèches ne se croisent jamais.** Chaque légende part du côté où se
trouve sa cible : celle qui vise le haut de l'écran est posée en haut, celle
qui vise le bas est posée en bas. La première version les avait à l'envers, et
les deux traits se coupaient au milieu de la page — un croisement fait perdre
le fil des deux à la fois. Les pointes visent le **bord** de l'objet, pas son
centre, sinon elles recouvrent ce qu'on veut faire lire.

## Ce qu'il dit, et pourquoi dans cet ordre

**Le recto parle au commerçant.** C'est le seul choix de fond de ce document.
Le bond doré du fantôme et ses cœurs sont ce qu'il y a de plus charmant dans
l'application — mais c'est un plaisir de CLIENT, et un commerçant qui lit un
flyer huit secondes n'a pas huit secondes à donner à un plaisir qui n'est pas
le sien. Il doit voir son problème nommé, et la réponse dans le même regard.
**Et le titre nomme la scène, pas le mécanisme.** Première version : « ils
décident ensemble, ils viennent chez vous ». C'est vrai, c'est juste, et ça ne
fait rien voir — personne ne se lève pour un mécanisme. Ce qui produit l'effet,
c'est une scène qu'un commerçant peut se jouer dans sa tête, en trois temps :
ce qu'il lui reste, le fait de le dire, et les gens qui poussent la porte. Les
deux chiffres sont là parce qu'un chiffre se vérifie et qu'une promesse vague
ne se vérifie pas — et ils sont vrais : le Flash dure trente minutes, et le
salon fait venir un groupe.

**Le verso montre l'autre moitié.** C'est la pièce qui décide, et la seule
qu'aucune plateforme de réservation ne donne : non pas « table de 4 à 12 h 30 »
mais CE QU'ILS ONT CHOISI. Un restaurateur sait alors quoi sortir du frigo. Le
salon de discussion vient après, parce qu'il explique COMMENT on en arrive là.

**Rien n'y est inventé.** Aucune promesse commerciale, aucun prix, aucun
pourcentage de commission : ces choses-là ne sont pas encore décidées, et un
flyer qui promet ce qu'on ne tient pas coûte le commerce qu'il a convaincu.
Les deux captures sont de vraies captures de l'application, prises sur le
serveur local, pas des maquettes.

## Ce qu'il reste à remplir

Le pied du verso porte un cadre en pointillés : **votre nom et votre numéro**.
Il est volontairement vide — je ne les invente pas. Remplacez le `<u>` de la
classe `.coord` dans `flyer.html`, ou écrivez-le à la main sur les premiers
exemplaires, ce qui n'est pas une mauvaise idée pour du démarchage de rue.

## Refaire le PDF

Les deux captures et les quatre polices sont dans ce dossier, donc le flyer se
régénère sans réseau et sans le serveur de développement :

```
node - <<'EOF'
import pw from "/opt/node22/lib/node_modules/playwright/index.js";
const b = await pw.chromium.launch();
const p = await b.newPage();
await p.goto("file://" + process.cwd() + "/docs/flyer/flyer.html",
             { waitUntil: "networkidle" });
await p.pdf({ path: "docs/flyer/clikme-flyer-commercant.pdf",
              width: "148mm", height: "210mm", printBackground: true,
              margin: { top: 0, right: 0, bottom: 0, left: 0 } });
await b.close();
EOF
```

## Refaire les captures

Serveur local sur 3821, puis :

- **Le Flash** — `/autour-de-moi?h=13.2`, un appui sur le fantôme, attendre
  trois secondes que le bandeau de notification s'efface, capturer.
- **Le salon** — onglet Propositions, ouvrir « La table des inconnus »,
  « Je viens », donner un prénom, appuyer sur le fantôme pour ouvrir sa bulle.

Les deux téléphones sont dimensionnés au rapport exact de la capture
(390 × 844, soit 0,462) : à ce rapport, `object-fit: cover` ne coupe rien et
l'annonce apparaît en entier.

Les flèches sont un SVG dont **une unité vaut un millimètre** (`viewBox` réglé
sur la taille de la scène) : pour déplacer une pointe, on lit la position de
sa cible en pourcentage de la capture, on la convertit en millimètres avec la
hauteur du téléphone, et on l'écrit. Aucun tâtonnement.

## Les polices

Anton (les titres) et Inter (le texte), déposées ici en TTF plutôt que
chargées depuis Google : un flyer doit pouvoir se régénérer dans dix-huit mois
sans dépendre d'un CDN. Anton **n'a pas le « À » accentué** dans la coupe
servie — il rend un A nu. Le titre est écrit en conséquence ; si vous le
réécrivez, évitez un mot qui commence par À.
