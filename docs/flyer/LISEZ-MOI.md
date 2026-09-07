# Le flyer commerçant — comment le refaire

`clikme-flyer-commercant.pdf` est le fichier à imprimer : **A5 recto-verso**
(148 × 210 mm), fonds perdus non nécessaires, tout est à l'intérieur des
10 mm de marge.

## Ce qu'il dit, et pourquoi dans cet ordre

**Le recto parle au commerçant.** C'est le seul choix de fond de ce document.
Le bond doré du fantôme et ses cœurs sont ce qu'il y a de plus charmant dans
l'application — mais c'est un plaisir de CLIENT, et un commerçant qui lit un
flyer huit secondes n'a pas huit secondes à donner à un plaisir qui n'est pas
le sien. Il doit voir son problème nommé, et la réponse dans le même regard.
D'où le titre : ils décident ensemble, ils viennent chez vous.

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

Le cadrage des deux téléphones se règle dans la feuille de style
(`object-position`) : le recto garde le HAUT de l'écran, le verso descend à
62 % pour que la bulle du fantôme soit dans le cadre. C'est une correction
faite après mesure, pas un réglage esthétique — au cadrage par le haut, la
seule chose que le verso raconte tombait hors de l'image.

## Les polices

Anton (les titres) et Inter (le texte), déposées ici en TTF plutôt que
chargées depuis Google : un flyer doit pouvoir se régénérer dans dix-huit mois
sans dépendre d'un CDN. Anton **n'a pas le « À » accentué** dans la coupe
servie — il rend un A nu. Le titre est écrit en conséquence ; si vous le
réécrivez, évitez un mot qui commence par À.
