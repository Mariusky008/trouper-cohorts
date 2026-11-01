# Les figurines ClikMe — le double du pro, ses éditions, la collection des clients

> 1er novembre 2026. L'idée « wow » cherchée avec le propriétaire : pas une mécanique de communication de plus, mais
> quelque chose qui fasse dire à un pro « c'est fou ce qu'ils ont réussi à faire, il me le faut ». La réponse était
> sous nos yeux : la figurine sur ressort de la démo humaine (`outils/tour-du-fantome/outils/ressort.py`).

## 1. La promesse

**Chaque pro a son double en figurine, qui annonce ses offres avec sa voix.**

Le matin, il envoie un vocal de 10 secondes (« Ce midi, garbure landaise et magret ! »). Mike en fait la vidéo du
jour : sa figurine le dit avec **sa** voix, la bouche sur ses syllabes, un clin d'œil, un rire, le ressort qui
rebondit. Il ne passe jamais devant une caméra, mais c'est lui : reconnaissable, drôle, attachant.

Ce que ça lève : le premier blocage des commerçants devant la vidéo — ils n'osent pas se filmer, n'ont pas le temps,
ne se trouvent pas bien à l'écran.

Ce que ça apporte : un personnage récurrent, qu'on suit chaque jour comme un dessin animé, que le quartier reconnaît.
L'annonce passe parce qu'on a envie de revoir le personnage.

**Jamais de voix fabriquée** : la figurine parle avec la voix du pro, enregistrée par lui.

## 2. Les éditions : la figurine change avec les saisons et les événements

La figurine se déguise selon le calendrier, et chaque tenue est une **édition datée** : « Édition Noël 2026 ».

- **Saisons et fêtes** : Noël, Halloween, Pâques, l'été, la rentrée, la fête des mères, la fête des pères, la
  Saint-Valentin.
- **Événements du commerce** : son anniversaire, une ouverture, une nouvelle carte, la fête du quartier, un match du
  club local.
- **Tenues du métier** : la toque du chef, le tablier de la potière, la tenue du cabinet.
- Pas de tenue liée à l'alcool.

Une édition dure un temps (la saison, la semaine de l'événement) : elle devient **collectionnable**. Le socle porte
le nom du commerce, gravé sur une plaque, et l'édition.

## 3. La collection des clients

Un client qui vient pour de vrai (un bon validé, le mot du jour dit au comptoir) **gagne la figurine du pro dans son
édition du moment**. Elle va dans sa Maison, dans une vitrine de collection : toutes les figurines des commerces de
sa ville.

- **Des éditions rares, vraiment rares** : « Noël 2026 » pour les 30 premiers venus, « Jour d'ouverture » pour ceux
  qui étaient là. Jamais de rareté inventée : le nombre est dit et tenu.
- **L'effet réseau** : « il me manque la fleuriste en Halloween » fait découvrir des commerces où l'on n'allait pas.
  La collection fait circuler les clients d'un commerce à l'autre — c'est l'argument le plus fort de ClikMe auprès
  d'une ville.
- **Sa propre figurine, en cadeau** : le client qui le veut a la sienne, offerte par le commerce où il est venu, qui
  apparaît dans la vidéo du lendemain, attablée chez le commerçant. Il la partage (« je suis dans la vidéo de mon
  resto ! »). Accord clair, jamais de mineurs.
- **Elle parle, avec sa voix** : son petit mot devient un avis parlé (« Le meilleur magret de Dax ! », dit par sa
  figurine). C'est la meilleure preuve sociale qui soit, et il la partage. Garde-fous : sa voix à lui, jamais
  fabriquée ; rien ne passe dans la vidéo du commerce sans que le commerçant l'ait validé ; le vocal sert au rendu
  puis il est effacé (c'est une donnée personnelle) ; jamais de mineurs. Plus tard : l'envoyer à un ami (un
  anniversaire), qui découvre ClikMe par là.

## 4. Les échanges

Plus tard : les clients échangent leurs doubles entre eux, comme des images à coller (« mon boulanger de Noël contre
ta fleuriste d'Halloween »).

- On ne **gagne** une figurine qu'en venant ; on ne l'**achète** pas, et il n'y a pas de pochette surprise payante
  (règles des jeux d'argent et des « loot boxes »).
- Échanger est gratuit, entre deux personnes qui le veulent.
- Pas de chaîne de blocs ni de jeton : un inventaire dans l'application suffit.

## 5. Comment on les fabrique

### Ce qui existe déjà (la démo humaine, octobre–novembre 2026)

- Six images alignées au pixel près (neutre, parle, clin, rire bras ouverts, louche bras croisés, salue), faites par
  le propriétaire avec un générateur d'images, en modifiant une même image.
- La découpe (`ressort.py`) : fond lisse, têtes par expression, corps par geste, ressort, socle.
- L'animation sur la voix (`tour-humain.html`, `dessinerFigurine`) : la bouche sur les syllabes (énergie de la voix,
  `figurine.py`), le ressort simulé, les expressions et les gestes, la tête qui se change sans toucher au corps.
- Le rendu en vidéo (`rendre-video.mjs`).

### Ce qu'il faut construire

1. **Des photos aux images alignées.** Le pro envoie trois photos de lui. Un modèle d'images qui sait modifier une
   image en gardant la personne fait le buste neutre, puis chaque expression et chaque geste **à partir de ce buste**
   (sinon elles ne se superposent pas). On vérifie l'alignement (corrélation de phase, déjà écrite) et on recale.
2. **Un ressort et un socle communs.** On ne fait générer que le buste, jusqu'à la coupelle en bois. Le ressort et le
   socle sont les mêmes pour tous, dessinés une fois, avec la plaque gravée au nom du commerce : la découpe devient
   simple et la marque est reconnaissable.
3. **Les repères automatiques.** Le menton et la zone de la tête viennent des repères du visage (MediaPipe, déjà dans
   le projet : `reperes-visage.mjs`), au lieu des valeurs fixes de `ressort.py`.
4. **La validation par le pro.** Rien n'est publié avant qu'il ait dit « c'est moi ». On refait si besoin.
5. **Le vocal du matin.** Dans l'application, ou par le numéro WhatsApp de ClikMe (chantier 4).
6. **Le rendu côté serveur.** Une à deux minutes par vidéo, publiée comme la vidéo du jour d'aujourd'hui.
7. **Les éditions.** Une tenue = une modification du buste neutre et de ses expressions, au calendrier.

Coût estimé : quelques euros par figurine et par édition pour la génération d'images, puis un peu de calcul par
vidéo.

## 6. Les étapes

| Étape | Quoi | Prêt quand |
|---|---|---|
| 0 | La scène de la démo : la révélation (« Cette figurine, c'est moi »), le chef, les éditions, une cliente | faite le 1er novembre (les trois démos) |
| 1 | Les premiers pros : figurine faite à la main par le propriétaire, vidéos rendues sur demande | tout de suite |
| 2 | La fabrication automatique (photos → images → validation) et le vocal du matin | chantier 4 pour WhatsApp |
| 3 | Les éditions au calendrier, et la collection des clients dans leur Maison | après l'étape 2 |
| 4 | Les échanges entre clients | après l'étape 3 |

## 7. Pré-mortem

- **Une figurine ratée, qui ne lui ressemble pas** → il valide avant toute publication ; trois photos plutôt qu'une.
- **L'effet de nouveauté qui s'use** → les éditions, le jeu du jour présenté par la figurine, les figurines des
  clients.
- **Une bouche qui sonne faux** → des bouches dessinées (ouverte, fermée, « o »), pas une imitation réaliste : on
  reste dans le jouet.
- **Le droit à l'image** → pour le pro, son visage, avec son accord écrit ; pour les clients, un accord clair, jamais
  de mineurs.
- **Les règles des jeux d'argent** → les figurines se gagnent en venant, jamais en payant ; les échanges sont gratuits.
- **La rareté** → le nombre d'une édition rare est dit et tenu, jamais inventé.

## 8. Dans la démo humaine

Une scène de 10 à 15 secondes après la réplique 12 (« …pour vous apporter des clients ») et avant la 13 (« 1 mois
gratuit… »). Sa figurine s'arrête, la caméra recule : « Cette figurine qui vous parle depuis le début ? C'est moi. »
Ses éditions arrivent, comme des cartes à collectionner (Noël, Halloween, l'été, la rentrée, chacune avec son
édition sur le socle) ; un téléphone montre un vocal de 10 secondes, et la figurine le dit.

À enregistrer (lui) : « Cette figurine qui vous parle depuis le début ? C'est moi. Et vous aurez la vôtre : un vocal
de 10 secondes, et elle annonce vos offres avec votre voix… et elle change à chaque saison. Vos clients aussi auront
la leur, en cadeau : à collectionner… et à faire parler, pour dire tout le bien qu'ils pensent de vous ! »

À fournir (lui) : son image neutre (`recu/humain/ressort/neutre.jpg`) modifiée en quatre éditions, même cadrage,
même pose (comme pour les expressions) : Noël, Halloween, l'été, la rentrée.

**Et vous aussi** : la photo du chef de Chez Bergine (celle de la démo, « Notre chef aux fourneaux ») devient sa
figurine, qui annonce le menu de l'ardoise. Le chef a donné son accord (confirmé par le propriétaire le 1er novembre).
À fournir : sa figurine, faite comme celle du propriétaire (même style, même cadrage, fond rose), en deux images au
moins, alignées : neutre et bouche ouverte (et un rire si possible) ; et, s'il le veut, son vocal de 10 secondes
(« Ce midi, garbure landaise et magret ! ») — sinon, des sous-titres seuls.
