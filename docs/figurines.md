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
2. **Un ressort et un socle communs.** On ne fait générer que le buste, jusqu'aux hanches (le ressort part de sous ses
   vêtements ; une première version demandait une coupelle en bois, abandonnée en novembre 2026). Le ressort et le
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

Une scène d'environ 30 secondes après la réplique 12 (« …pour vous apporter des clients ») et avant la 13. Elle dit,
dans l'ordre, les trois idées qui rendent la direction claire pour un pro :

1. **Le messager, c'est la figurine** (12b, lui) : « Cette figurine qui vous parle depuis le début ? C'est moi. Et vous
   aurez la vôtre. Une table vide ? Un vocal de 10 secondes… et c'est votre figurine qui prévient ceux qui attendaient
   ce moment, à leur prénom : » — puis la figurine du chef le dit, avec la voix enregistrée par Nicolas : « Camille !
   Il me reste une table à 12 h 30 : elle est à toi pendant 5 minutes ! » (carte polaroïd « Pour Camille 💌 », badge
   « 🪑 Table libre · 12 h 30 »).
2. **La raison de venir, c'est la collection** (12c, lui) : « Et ceux qui viennent gagnent votre figurine : une édition
   à chaque saison… et des éditions rares, pour ceux qui remplissent vos creux. À collectionner… et à faire parler ! »
   — les quatre éditions (Halloween, Noël, l'été, la rentrée), puis la carte holographique « Édition rare mardi midi »
   avec « 🏆 Défi de la famille · 3 tables · Complet ✅ » (la mission de la famille), et l’album « Ma collection · 6 / 10 » (comme dans l’appli : 10, la 10ᵉ en or).
3. **Et elle parle** : la figurine de Léa, offerte par Chez Bergine, dit avec la voix enregistrée par Emma « Le meilleur
   magret de Dax ! ».

Puis la 13 résume le positionnement : « Des vidéos qui font jouer vos clients, pour mieux les connaître. Des surprises
et des figurines, pour les remercier. Et un seul but : remplir vos places vides, au bon moment. 1 mois gratuit pour
faire mes preuves… on commence ? », avec trois pictogrammes (🎮 ils jouent, 🎁 vous les remerciez, 🪑 vos places vides
se remplissent).

Les voix : `recu/humain/figurines/jp-revelation-a.mp3`, `jp-revelation-b.mp3`, `chef-camille.mp3`, `cliente.mp3`, et
`recu/humain/13-p.mp3`. Les images : `jp-{halloween,noel,ete,rentree}.jpg`, `chef-{neutre,parle}.jpg`,
`cliente-{neutre,parle}.jpg`. La figurine de la cliente est faite d'après la compagne du propriétaire, avec son accord ;
la photo d'origine n'est pas dans le dépôt. Le chef de Chez Bergine a donné son accord (1er novembre).

## 9. Le système complet (1er novembre, le soir) — à valider

> Sa demande : « qu'il y ait un avantage à avoir les figurines complètes d'un commerçant (un massage offert, un repas
> pour 2…), ou que les figurines aient une utilité, une valeur ; un endroit où collectionner, prouver qu'on a la
> collection entière, débloquer des choses, échanger plus tard ; 10 figurines par an et par commerçant ; la
> fabrication automatique des figurines des pros et des clients ; ce que le client fait de la sienne ; et le système
> dans sa globalité, pour que l'effet devienne viral et qu'il y ait de la demande. »

### 9.0 Simplifier d'abord (2 novembre) — décidé

« Si on met cette fonctionnalité dans l'application avec déjà tout ce qui s'y trouve, ne risque-t-on pas de perdre la
simplicité de la démarche initiale ? » — Si. D'où trois règles :

- **La figurine du commerçant remplace les pièces** (bronze, argent, or) comme récompense visible : le client a son
  fantôme (c'est lui) ; le commerçant a sa figurine (c'est elle qu'on gagne). Deux systèmes de récompense, c'est un de
  trop. (Le rang, qui décide de l'ordre d'envoi des bons plans, reste en coulisse, compté en figurines.)
- **Le parcours ne change pas** : la vidéo, la cage, la visite validée au comptoir comme aujourd'hui ; on repart avec
  la figurine de la saison. Rien de plus à faire pour le pro : les figurines, c'est ClikMe qui les fait.
- **Le test de la phrase** : « Chaque fois que je vais chez Bergine, je gagne sa figurine de la saison ; à 10, j'ai un
  repas pour 2. » Ce qui demande une deuxième phrase attend : les doubles, les accessoires, les échanges, la collection
  de la ville, la figurine que le client fait lui-même — après les 5 premiers commerces, si la version simple marche.

**Où on la voit — à valider** : pas dans l'application de la ville (`/ville/dax`), déjà pleine ; deux pages simples,
qu'on atteint par un lien :

1. **Chez un commerce : sur sa page de la famille** (`/f/<lien>`), là où le client arrive déjà (le lien de la vidéo,
   le carton QR au comptoir) et où il voit aujourd'hui sa pièce : à sa place, « Ta collection Chez Bergine · 6 / 10 »,
   la figurine à gagner en ce moment et le temps qui reste, le cadeau à 10.
2. **Toutes ses figurines : une seule page « Ma collection »** (`/collection`), une étagère par commerce et rien
   d'autre ; on y arrive par l'écran qui suit la visite validée (« Tu as gagné l'édition automne ! »), par le message
   du commerce, et par un bouton sur chaque page de famille. Dans l'application de la ville : au plus une icône.

Un commerce = une page (sa famille) ; un client = une page (sa collection).

**Construit le 2 novembre (étape 1)** :

- le calcul (`src/lib/direct/collection.ts`) : 8 éditions datées (Hiver, Saint-Valentin, Printemps, Fête de la
  musique, Été, Automne, Halloween, Noël) et 2 rares — **depuis le 3 novembre, 12 éditions, une par mois (voir 9.2)** ; une visite validée (`clik_visite`) = une figurine au plus, la
  plus rare d'abord (rare si un bon plan « place libre » a été publié ce jour-là, puis le temps fort, puis la
  saison) ; la collection commence à la première visite et dure le temps de passer par chaque édition, puis une
  nouvelle commence ; les rares et les figurines d'or numérotées dans toute la famille (`famille-serveur.ts`) ;
- sur la page de la famille (`/f/<lien>`) : le bloc animé à la place du chemin des pièces (le compteur, la jauge et
  ses trois paliers, la figurine à gagner maintenant dans les couleurs de son édition, l'étagère des dix, la fête
  d'une nouvelle figurine), et sur l'accueil « Collectionne ses figurines » ;
- la page « Ma collection » (`/collection`), et « 🏆 3 / 10 » dans Mes familles (Ma Maison) ;
- la figurine d'un commerce : la sienne si ClikMe l'a faite (`FIGURINES`, `figurines-commerces.ts`), sinon son double ;
  le cadeau de la collection complète : seulement s'il l'a choisi (`metadata.collection_cadeau` de sa fiche).

**Construit le 2 novembre (suite)** :

- **le cadeau de la collection complète, au comptoir** (« Ma famille » → « 🏆 Leurs figurines ») : il l'écrit (des
  idées dans les mots de son métier, jamais d'alcool ; tant qu'il n'écrit rien, sa page ne promet que la figurine
  d'or) ; les collections complètes s'affichent « Inès · n°3 · Remis ✓ », une fois chacune ; sa page dit ensuite
  « Cadeau remis le … ». Rangé dans sa fiche (`metadata.collection_cadeau`, `metadata.collection_remis`), sans table de
  plus ;
- **les pièces visibles remplacées par la collection** : « Leurs figurines » (3 et plus, 6 et plus, 10 / 10, ses
  meilleurs collectionneurs) à la place de « Leurs pièces » ; dans le carnet, « n°1 · 🏆 2 » ; dans les vitrines, un
  socle en bois frappé du numéro, et la bulle « Fantôme n°1 · 🏆 2 figurines » ; sur la page de la famille et dans Mes
  familles, plus de nom de pièce. Le rang reste en coulisse : il décide de l'ordre d'envoi des bons plans.
- **« Ma collection » pour qui n'a encore rien** (2 novembre, sa remarque : « au départ c'est complètement vide et on
  ne comprend pas vraiment à quoi ça sert ») : la vitrine (l'édition du moment, les deux suivantes, une rare, l'or),
  « En ce moment : édition Automne, encore 49 jours », ce que ça rapporte (les trois paliers, dits concrètement, et les
  rares), comment on la gagne (la cage, la visite notée au comptoir, la figurine), et les commerces ClikMe où la
  commencer — ceux de sa ville d'abord, avec leur cadeau à 10 s'ils l'ont écrit (`collection/decouvrir.tsx`). Qui
  collectionne déjà retrouve « Comment ça marche ? » et « D'autres collections à commencer » sous ses étagères.

### 9.0 bis Sa propre figurine, à 10 figurines tous commerces (2 novembre) — décidé, construit

Sa question : « Est-ce que ça ne serait pas mieux qu'ils obtiennent leur figurine après avoir collectionné un minimum
de 10 figurines, tous commerces compris ? » — Oui : « les plus fidèles » ne disait rien, et 10 chez un seul commerce,
c'est une année (une figurine par édition). Chaque commerce récompense sa collection (la figurine d'or, son cadeau) ;
ClikMe récompense le réseau (sa figurine à soi), et pousse à découvrir un deuxième, un troisième commerce.

**La phrase de la vidéo** (à enregistrer par lui, à la place de « Les plus fidèles… ») : « Et ça sert à quoi ? À avoir
vos bons plans avant les autres. Et à 10 figurines, chez vous ou ailleurs, vos clients ont leur propre figurine : elle
parle avec leur voix, part chez leurs proches… et cite leurs commerces préférés, dont le vôtre. C'est du
bouche-à-oreille très puissant… sans payer un euro de pub ! »

**Construit** (`lib/direct/ma-figurine.ts`, `ma-figurine-serveur.ts`, migration `20261106090000_clik_ma_figurine.sql`) :

- dans « Ma collection », en haut : « Ta figurine qui parle · 6 / 10 · encore 4, chez n'importe quel commerce
  ClikMe » (les collections finies comptent leurs 10) ;
- à 10 : sa photo, avec « C'est bien moi sur la photo, et j'accepte que ClikMe en fasse ma figurine » ; puis « On
  fabrique ta figurine » ;
- **la fabrication, à la main pour l'instant** : `/admin/humain/figurines-clients` montre sa photo ; on y dépose ses
  deux images (bouche fermée, bouche ouverte, cadrées pareil, comme pour la démo) ; ou « Refuser la photo », avec la
  raison ;
- prête : « Fais-la parler ! » — 15 secondes au plus, **sa voix**, la bouche qui bouge dessus ; il choisit les
  commerces qu'elle cite (4 au plus, parmi ceux où il a des figurines — jamais « vu récemment chez… ») ; il l'envoie :
  WhatsApp, SMS, le lien, la feuille de partage du téléphone ;
- celui qui le reçoit (`/figurine/<id>`, sans compte, pas dans Google) : « Léa t'a envoyé sa figurine », « Écouter »,
  ses commerces préférés (vers leur page), « Et toi ? » vers sa collection, et « Signaler ce message » (il ne
  s'affiche plus ; l'admin le remet ou le retire) ;
- photo, images et voix dans un seau privé (`figurines-clients`) : adresses signées, jamais publiques ; 30 messages
  par jour au plus.

**À faire par lui** : appliquer la migration dans l'éditeur SQL de Supabase (sans elle : le compteur marche, et à 10,
« ta figurine arrive très bientôt »).

### 9.0 ter « Ma collection » qui donne envie, et ce que ressent sa figurine (3 novembre) — construit

Sa remarque : « la page n'est pas responsive sur ordinateur, les explications sont épuisantes à lire… il manque une âme
et cette sensation de manquer la prochaine figurine… on ne voit rien de notre propre figurine : au moins celle d'un
ami qui a déjà la sienne, et ce qu'on peut en faire (lui faire dire des choses, lui faire exprimer un sentiment : la
joie, la colère, la tristesse, l'euphorie) ; c'est ici qu'on explique les avantages ».

- **Le compte à rebours** (`ChronoEdition`, `app/collection/decouvrir.tsx`) : « À gagner maintenant · Édition Automne ·
  elle s'en va dans 47 j 16 h 59 min 04 s », et la frise : celle qui vient de finir (« terminée »), celle-ci, les deux
  suivantes (cadenas, « dans 28 j »), la rare, l'or. Les dates sont celles des éditions : rien d'inventé (aucun
  « 238 personnes l'ont déjà »). Pour qui collectionne déjà, il est au-dessus de ses étagères.
- **Comment ça marche** : trois tuiles de trois mots ; **ce que ça rapporte** : une piste de 1 à 10 et trois médailles.
- **Ta propre figurine** (`apercu-figurine.tsx`) : la figurine de Léa (la cliente des démos, voix « Emma » qu'il a
  faite), marquée « Démonstration » ; on l'écoute, et elle passe d'un sentiment à l'autre (un toucher l'arrête sur le
  sien) ; les quatre avantages (sa voix, ce qu'on ressent, chez ses proches, ses commerces préférés) ; « Toi : 0 / 10 ».
  Pour qui collectionne, sous son compteur.
- **Les sentiments sont vrais** (`SENTIMENTS`) : dans « Ma figurine », avant d'envoyer, « Ce qu'elle ressent » ; chez
  celui qui reçoit, la figurine le joue (elle sautille, tremble, s'affaisse ou bondit ; le fond et ce qui flotte
  autour le disent) et la page dit « Sa figurine est pleine de joie ». Ses images ne changent pas.
- **Sur ordinateur**, la page prend la largeur (1 180 points au plus) : le compte à rebours en grand, les tuiles côte à
  côte, l'aperçu en deux colonnes, quatre commerces par ligne, deux étagères par ligne.

**À faire par lui** : appliquer `20261108090000_clik_figurine_sentiment.sql` (après celle de « Ma figurine ») ; sans
elle, les messages partent quand même, sans sentiment.

### 9.0 quater « Ma collection » refaite : sa figurine qui parle, en héros (4 novembre) — construit

Sa remarque : « la page n'est vraiment pas bonne en UX ou UI, on s'y perd, on ne sait pas quoi y faire, ça manque de
clarté et de modernité ; la section qui devrait être le wow de la page, “Ta propre figurine”, n'est pas du tout ce que je
voulais : les émotions devaient être réelles, avec des expressions du visage de la figurine, et pas un décor ; on devrait
pouvoir la faire parler avec une voix lambda en mettant un texte, et l'envoyer à quelqu'un via WhatsApp. »

Ses décisions : un texte lu par une voix **ElevenLabs** (la seule voix fabriquée de ClikMe ; jamais la voix du
téléphone), et les expressions faites par **le moteur d'image**.

- **La page, dans l'ordre** (`src/app/collection/ma-collection.tsx`) : en haut, « Ta figurine qui parle » ; puis
  « Ce que tu gagnes » (les deux « 10 » enfin séparés : 10 au même commerce = sa figurine d'or ; 10 en tout = la
  sienne) ; « L'édition du mois » ; « Mes figurines » ; « Où gagner tes figurines ». Une barre « Ma collection · 13 »
  reste en haut.
- **Le studio** (`ma-figurine.tsx`) : la figurine en grand ; dessous, cinq visages (normal, joie, colère, tristesse,
  euphorie) ; « Ce qu'elle dit » : un texte (140 caractères) et sa voix parmi quatre (Douce, Pétillante, Chaleureuse,
  Posée), ou sa propre voix (15 s) ; « Écouter » ; « L'envoyer à quelqu'un » → un gros bouton WhatsApp, puis SMS,
  « Partager… », « Copier le lien ».
- **La démonstration** (qui n'a pas encore la sienne) : la figurine de Léa, sa vraie phrase (« Le meilleur magret de
  Dax ! ») et trois phrases toutes faites dans la voix qu'on veut (faites une fois, puis gardées : jamais un texte libre
  sans compte) ; sous elle, « 6 / 10 figurines » et « Gagner mes figurines ↓ ».
- **Ses expressions** (`figurine-expressions-serveur.ts`) : à partir de sa figurine bouche fermée, le moteur d'OpenAI en
  fidélité haute fait chaque visage, puis la même bouche ouverte (pour parler) ; huit images, une fois par figurine,
  en deux tours sous verrou ; l'image est remise dans son cadre d'origine (la figurine ne saute pas d'un visage à
  l'autre). La première fois, la page le fait toute seule (« Ta figurine apprend ses expressions… ») ; celles de Léa,
  la première visite. Tant qu'un visage manque, elle le joue en bougeant (un petit badge le dit) — plus de fond coloré
  ni de pluie d'émojis.
- **La voix** (`voix-figurine-serveur.ts`) : `ELEVENLABS_API_KEY` ; les quatre voix par défaut sont des voix de base
  d'ElevenLabs, à remplacer par celles de son compte avec `ELEVENLABS_VOIX_FIGURINE`
  (« douce:<id>,petillante:<id>,chaleureuse:<id>,posee:<id> ») ; 20 lectures par jour et par client.
- **Celui qui reçoit** (`/figurine/<id>`) : le visage de l'émotion choisie, et ce qu'elle dit en bulle.

**À faire par lui** : poser `ELEVENLABS_API_KEY` dans Vercel (sans elle : sa propre voix seulement, et la
démonstration ne parle pas) ; appliquer la migration `20261109090000_clik_figurine_texte.sql` (sans elle : le texte ne
s'affiche pas chez celui qui reçoit). `OPENAI_API_KEY` est déjà là pour les expressions.

### 9.0 quinquies La démonstration qu'on fait parler soi-même, et l'album (4 novembre, le soir) — construit

Sa remarque, après avoir vu la page : « il manque la possibilité de faire parler la figurine de démonstration et de
l'envoyer à quelqu'un pour lui faire découvrir. “Ce qu'elle dit « Le meilleur magret de Dax ! » ▶ Écouter” : ça ne sert
à rien, je veux moi-même essayer en lui faisant dire quelque chose que j'aurais décidé, et si c'est bluffant, en ayant
choisi l'émotion moi-même, alors je voudrais créer ma propre figurine : c'est ça qui motivera. Je choisis l'émotion, je
tape ce que je veux qu'elle dise et je l'envoie à quelqu'un. » Et : « la position normale est plus grande que les autres,
la tête sort du cadre » ; « supprimer “Ce que tu gagnes” » ; « “Mes figurines” n'est pas du tout addictive ».

Sa décision : la figurine de démonstration, c'est **la sienne** (le propriétaire, sur ressort ; images
`public/collection/demo-neutre.webp` et `demo-parle.webp`, tirées de `outils/tour-du-fantome/recu/humain/ressort/`).
Celle de Léa n'est plus montrée.

- **La démonstration, en trois gestes** (`StudioDemo`, `ma-figurine.tsx`) : ① choisis son émotion (son visage change) ;
  ② écris ce qu'elle dit (140 caractères, une idée en filigrane qui change toute seule — jamais une phrase toute faite à
  toucher), sa voix parmi quatre, « Écouter » ; ③ ton prénom (facultatif, il le verra), « L'envoyer » → WhatsApp, SMS,
  « Partager… », « Copier le lien », « Voir ce qu'on recevra ». Dessous : « Bluffant ? La tienne aura TON visage. »,
  sa jauge « 6 / 10 » et « Gagner mes figurines ↓ ».
- **Ce qu'elle ne dit pas** (`mots-interdits.ts`, partagé page/serveur) : insultes, injures racistes ou homophobes,
  menaces, sexe explicite (minuscules, accents, chiffres « leet » et lettres répétées ramenés) → « Ça, la figurine ne le
  dit pas. Écris autre chose 🙂 ». Le reste passe par « Signaler » chez celui qui reçoit. Le même filet vaut pour le
  texte d'un client sur SA figurine.
- **Ce que ça coûte, compté** (`ma-figurine-serveur.ts`) : un texte déjà lu dans cette voix se reprend sans repayer ;
  sinon 10 lectures par visiteur et par jour (son habitant, sinon une empreinte de sa connexion), et 300 pour tous
  (`FIGURINE_DEMO_LECTURES_JOUR`) ; 10 messages par visiteur et par jour. Le serveur relit le texte lui-même : il ne
  prend jamais un son venu du navigateur.
- **Où c'est rangé** : dans le seau privé `figurines-clients`, sous `demo-proprio/v1/` — ses expressions (`expr/`), les
  textes lus (`voix/`), les messages (`messages/<id>.json`), les compteurs (`jour/`). Pas de table, rien à migrer.
- **Celui qui reçoit** (`/figurine/<id>`) : « Julien t'a envoyé une figurine qui parle », son émotion, sa voix, le texte
  en bulle, « Message écrit par Julien, avec la figurine de démonstration de ClikMe », puis « À ton tour ! » →
  « Fais-la parler » (la démonstration). « Signaler » le retire.
- **Le cadre** (`figurine-qui-parle.tsx`) : il prend les proportions de l'image de tous les jours (lues dans le
  navigateur) ; rien n'est rogné, la tête ne sort plus, et les expressions (remises au même cadre) tombent dessus.
- **« Ce que tu gagnes » est parti** (et ses paliers repliés) : l'album les montre là où ils comptent.
- **« Mes figurines », un album** (`album.tsx`) : une page par commerce — le compteur qui monte (« 5 / 10 »), la jauge
  et ses paliers (🥈 🥇 🏆), « Encore 1 → 🥇 Au courant en premier » ; la figurine à gagner maintenant, qui brille, avec
  ses jours et « J'y vais › » ; les quatorze cases (gagnées en couleur avec leur jour, celle du mois qui pulse avec son
  « ? », à venir en silhouette sous cadenas, manquées en gris, rares en holographique) et au bout la case d'or, fermée
  jusqu'à 10 ; « Nouvelle ! » sur celles gagnées depuis sa dernière visite de l'album ; une case touchée s'ouvre en
  grand avec ce qu'elle raconte (gagnée le…, encore 27 jours…, manquée…). Les mois s'abrègent à la française
  (« juin », « juil. » : plus de « jui. » pour les deux).

### 9.0 sexies Sa figurine dès le départ, une option de plus à chaque achat (4 novembre, la nuit) — construit

Sa décision : « le plus simple et le mieux, c'est qu'on ait la possibilité de créer sa figurine dès le départ, mais qu'on
bénéficie d'options supplémentaires à chaque fois qu'on achète quelque chose chez un commerçant ». Plus de « 10
figurines » à attendre.

- **« Crée ta figurine »** (`EnvoiPhoto`, sous la démonstration, `#creer`) : sa photo, « C'est bien moi », et — sans
  compte — son prénom et sa ville (une ville des commerces ClikMe) : la photo lui ouvre son compte (`assurerHabitant`).
- **Le moteur la fabrique tout de suite** (`ma-figurine-fabrique-serveur.ts`) : ses traits décrits, puis la consigne des
  figurines des commerçants (le style « film d'animation 3D » qui a marché) avec SES vêtements, le ressort, le socle et un
  fond rose uni (`consigneFigurineClient`) ; puis la même bouche ouverte, remise dans le même cadre. Deux minutes
  environ ; la page attend (`FabricationAuto`). « Elle ne te ressemble pas ? La refaire » : 3 fabrications par jour et
  par personne ; `FIGURINE_CLIENTS_JOUR` (100) nouvelles figurines par jour pour tout ClikMe. Sans `OPENAI_API_KEY`,
  ClikMe la fait à la main depuis l'admin, comme avant.
- **Ses options** (`OPTIONS_FIGURINE`, `ma-figurine.ts`), une par achat (une visite validée au comptoir = une figurine
  gagnée, tous commerces confondus) : au départ, sa figurine qui parle (son texte, la joie, la voix « Douce », l'envoi) ;
  1ᵉʳ achat : 😠 la colère ; 2ᵉ : 🎙️ toutes les voix, et la sienne ; 3ᵉ : 😢 la tristesse ; 4ᵉ : 🤩 l'euphorie ; 5ᵉ :
  ✨ le cadre doré (ses messages arrivent dans un cadre en or). Les options fermées se voient sous cadenas ; un toucher
  dit quel achat les ouvre. Le serveur les tient aussi (une voix ou un visage fermé est refusé). Ses visages ne se
  fabriquent qu'une fois ouverts (une image de moins à payer pour qui ne revient pas).
- **Celui qui reçoit** : « Et toi ? » mène à « Crée ta figurine ».

**Coût à surveiller** : une figurine, c'est 2 images du moteur (plus 2 par visage ouvert) ; le plafond du jour le tient.

### 9.0 septies Sa carte de personnage, et la rencontre du jour (4 novembre, la nuit) — construit

Ses décisions : la carte de personnage d'abord (« le questionnaire, la fiche écrite par l'IA et des caractéristiques qui
montent avec les visites ») ; puis la rencontre du jour (son idée : « chaque jour sa figurine est présentée à une autre,
et les deux ont une discussion selon leurs personnalités… on commente les phrases, si on aurait dit ça ou pas »), avec
la figurine d'un commerce ou un ami invité par WhatsApp (« dès qu'il a créé son compte, la prochaine conversation sera
entre eux deux ») ; à lire seulement pour le moment ; se rencontrer : une option pour plus tard.

- **La carte** (`personnage.ts`, `personnage-serveur.ts`, `personnage.tsx`, section « Mon personnage ») : sept questions
  (fonceur ou prudent, clown ou sérieux…), une à la fois ; trois goûts au plus (une liste de loisirs) ; une phrase
  fétiche (filtrée). L'IA écrit la fiche — un titre, un portrait, un super-pouvoir, un point faible, sa façon de parler
  — drôle et tendre, sans rien de sensible, sans deviner le genre ; relue (longueurs, mots interdits) ; sans IA, une
  fiche composée par le serveur. Ses SIX CARACTÉRISTIQUES (audace, humour, mauvaise foi, chance, curiosité, fidélité) ne
  sont pas écrites par l'IA : ses réponses donnent la base, ses achats les font monter (la fidélité à chaque figurine,
  la curiosité à chaque nouveau commerce, la chance avec les rares et l'or). Son niveau : un de plus par achat ; son
  cadre : bronze, argent (3 achats), or (6, holographique). « Partager ma carte » : un lien `/carte/<id>` (hors
  Google), qu'il peut reprendre. 5 cartes par jour au plus. Rangée dans le seau privé, sans table.
- **La rencontre du jour** (`rencontre.ts`, `rencontre-serveur.ts`, `rencontre.tsx`) : faite à sa première visite du
  jour. Avec qui : un ami invité qui vient de faire sa carte (tout de suite, la même chez les deux), sinon ses amis et
  les commerces chacun son tour (un ami au plus un jour sur deux) ; les commerces : ceux où il a des figurines, puis
  ceux de sa ville. L'IA écrit 4 à 8 répliques d'après les deux cartes et ce qu'il a appris de lui ; la figurine d'un
  commerce ne promet rien (ni prix, ni offre, ni horaire) — « ce n'est pas le commerçant qui parle ». Les répliques
  arrivent une à une. Sous chaque phrase de SA figurine : « ✅ C'est tout moi » / « 🙅 Jamais de la vie » (ce qui
  affine les suivantes : les phrases reconnues et rejetées passent dans la consigne) ; une émotion sur n'importe quelle
  phrase ; sa ressemblance en pourcentage (dès trois réponses). « Inviter un ami » : `/collection?ami=<code>`, gardé
  sur l'appareil et accepté dès qu'il a un compte. « Signaler » la retire pour les deux. Ses rencontres d'avant, avec
  qui. Rangé dans le seau privé (`rencontres/`, `<habitant>/rencontres.json`, `invitations/`), sans table.
- **Pas encore construit** : la voix des conversations (décision : à lire), et les rencontres entre clients qui ne se
  connaissent pas, avec l'accord des deux pour se rencontrer (l'option gardée pour plus tard).

### 9.0 octies « Ma collection » en onglets, avec Clik la mascotte (5 novembre) — construit

Ses remarques : la démonstration « ne sert plus à rien maintenant » (chacun crée la sienne dès le départ) ; « inciter
directement à créer sa figurine, en encore plus gamifié, accueillant et chaleureux — une figurine marrante peut
accueillir et expliquer vite fait ce qu'il faut faire et ce que ça permettra ensuite » ; « Mon personnage : tu peux
vraiment mieux faire, plus interactif et gamifié » ; la rencontre du jour « beaucoup mieux mise en valeur, que ça donne
envie d'inviter quelqu'un, ou de comprendre que si on ne le fait pas, on peut appuyer sur un compte à rebours pour être
mis en contact avec un membre » ; « L'édition du mois : on ne saisit pas ce que c'est… au lieu de mettre des fantômes
partout, mettre des figurines d'exemple comme la figurine marrante » ; « un menu en bas avec les différentes sections ».

- **Clik, la mascotte** (`mascotte.tsx`) : une figurine dessinée (une grosse tête sur un ressort et un socle en bois,
  comme les vraies), qui rebondit, cligne des yeux, salue et parle. Elle porte la tenue de chaque édition (la couronne
  de la galette, les oreilles de Pâques, le casque de la fête de la musique, le chapeau de sorcière d'Halloween, le
  bonnet de l'automne, le bonnet de Noël…), dorée pour l'or, holographique pour les rares. `MascotteDit` : ses bulles,
  tapées comme un message ; un toucher passe à la suite ; revenu, on ne réécoute pas tout. C'est la figurine d'exemple
  partout où il y avait un fantôme (l'édition du mois, la frise, l'album, les commerces où gagner, les avatars).
- **Le menu en bas** (`ma-collection.tsx`) : 🗣️ Ma figurine · 🃏 Personnage · 💬 Rencontres · 📅 Ce mois-ci · 📒 Album,
  avec une pastille quand quelque chose attend ; chaque onglet a son adresse (`#personnage`…), les anciens liens
  retombent sur le bon (`#creer`, `#ou-gagner`), le lien d'un ami ouvre « Rencontres ». Un onglet ne se charge qu'à sa
  première ouverture (la rencontre du jour n'est écrite que si on va la lire).
- **Ma figurine** : Clik accueille (qui il est, ce qu'on fait ici, ce que la figurine fera, les super-pouvoirs à chaque
  achat) ; la quête « Crée ta figurine » (des étapes qui se cochent, une jauge, « Donner vie à ma figurine ») ; « Ce que
  tu vas débloquer » ; pendant la fabrication, Clik raconte ce qu'il fait. La démonstration (`StudioDemo`) et ses
  routes sont parties ; ses messages déjà envoyés s'ouvrent toujours.
- **Personnage** : Clik lance le test, la carte mystère attend ; chaque question est posée par Clik, deux grosses cartes
  à toucher, une jauge d'XP ; la carte se construit en direct (le gain s'envole : « +25 ») ; la révélation (la carte
  tourne, les confettis, « Nouvelle carte ! ») ; la carte se retourne d'un toucher (sa fiche au dos) et s'incline sous
  le doigt ; dessous, le prochain niveau, le prochain cadre et « Où acheter ce mois-ci ? ».
- **Rencontres** : Clik explique le jeu ; la rencontre du jour en vedette, et « Prochaine rencontre dans 07:12:44 » ;
  deux grands choix — « Invite un ami » et le bouton rond « Rencontre un membre » (3… 2… 1…) : son geste l'inscrit dans
  la file des membres de sa ville (il accepte que sa figurine, son prénom et sa carte soient présentés) ; on lui présente
  celui qui attend depuis le plus longtemps (pas quelqu'un bloqué, pas quelqu'un vu ces quatorze jours) ; personne ? il
  attend, le prochain qui appuie le rencontrera. Une rencontre de membre par jour ; « Ne plus rencontrer ce membre » ;
  « Ne plus me faire rencontrer ». Rangé dans le seau privé (`membres/<ville>.json`). Se voir en vrai : toujours pas.
- **Ce mois-ci** : Clik, dans la tenue du mois, explique ce qu'est l'édition (chaque commerce a sa figurine du mois, elle
  rejoint l'album à l'achat, elle s'en va à la fin du mois, l'or à dix) ; le temps qui reste, la frise, où la gagner.
- **Album** : Clik dans la tenue de chaque mois sur les cases (tant qu'un commerce n'a pas sa vraie figurine) ; vide,
  Clik dit comment le remplir.

### 9.0 nonies Le guide : la figurine du patron de ClikMe, à la place de Clik (5 novembre) — construit

Sa remarque, en voyant Clik : « pourquoi ne reprends-tu pas cette figurine qui est moi ? En plus elle a déjà plein
d'expressions que tu peux utiliser : ça permettra de voir à quoi ça ressemble dès le départ, au lieu d'avoir un
personnage cartoon. »

- **Le guide qui parle** (`app/collection/guide.tsx`, `Guide` et `GuideDit`) : son portrait (la figurine de la
  démonstration), la bouche qui s'ouvre et se ferme pendant qu'il parle (ses deux images), et le visage de ce qu'il dit
  — joie, euphorie, tristesse (`{ t, v }` dans les bulles) : ses vraies expressions, celles que le moteur avait faites
  pour la démonstration. En grand sur l'accueil, en petit ailleurs ; il pose les questions du test de personnage.
- **Sa figurine seule, l'exemple** (`FigurineGuide`) : là où il n'y a pas encore la vraie (l'édition du mois, la frise,
  l'album, les commerces où gagner), sa figurine sans fond, dans la tenue de chaque édition. Le moteur les fait une fois
  chacune (`lib/direct/guide-serveur.ts` : sa figurine recopiée sans son fond rose, puis ses douze tenues, celle du mois
  d'abord), à la première demande et après la réponse, une image par passage, sous verrou ; refusée trois fois, une image
  n'est plus redemandée. En attendant : son image de tous les jours. Une quinzaine d'images, pour toujours.
- **Servies par** `/api/direct/guide/<nom>` (`joie-n`, `joie-p`… ; `seule` ; `edition-noel`…), gardées par le réseau ;
  rangées dans le seau privé (`demo-proprio/v1/expr/` pour ses visages, `demo-proprio/v1/guide/` pour le reste).
- **Une autre image de lui** (« plus jeune, peut-être ? ») : remplacer `public/collection/demo-neutre.webp` et
  `demo-parle.webp`, puis monter `VERSION_GUIDE` (`lib/direct/guide.ts`) — tout se refait de soi-même dans un nouveau
  dossier.
- **Pas son visage à la place de quelqu'un** : sur la carte de personnage d'un client sans figurine, et dans les
  rencontres (un commerce ou un membre sans figurine), une silhouette de figurine et « ? » — pas sa tête.

### 9.0 decies Pablito : ses mots, sa grimace, en fenêtre la première fois, prêt pour sa voix (5 novembre) — construit

Ses remarques : « l'introduction est trop approximative : orienter directement les avantages, comme ceci : Salut ! Moi,
c'est Pablito ! (Il sourit… puis louche.) … » ; « ça doit arriver la première fois comme une pop-up, et pas comme
quelque chose de fixe en haut » ; « il faut donc que je t'enregistre les voix pour mettre sur la figurine ».

- **Son nom, Pablito** (`NOM_GUIDE`), et **ses mots** : les huit bulles du patron, telles quelles (`OngletFigurine`).
- **Il sourit… puis louche** : une bulle peut finir sur une grimace (`apres`) ; « il louche » est une image de plus que
  le moteur fait une fois (`louche-n`, `guide-serveur.ts`), à la même place que ses autres visages.
- **En fenêtre, la première fois** (`GuideDit popup`) : sur chaque onglet où il explique (l'accueil, le personnage, les
  rencontres, ce mois-ci, l'album vide) ; ✕, « Passer », Échap, ou ce qu'il propose la ferment (« Je crée ma figurine »,
  « Lancer le test »…). Ensuite, un petit bouton « Pablito t'explique » la rouvre. Un onglet caché ne montre pas sa
  fenêtre (`OngletVisible`).
- **Sa voix** : des enregistrements du patron, un par bulle (`SONS_PABLITO` dans `lib/direct/guide.ts`, fichiers dans
  `public/collection/pablito/`). Sa bouche bouge tant que sa voix joue ; si le téléphone refuse de la jouer avant un
  premier toucher, la bulle propose « 🔊 Touche pour l'entendre ». **Reçus le 5 novembre** : les huit bulles de
  l'accueil (`public/collection/pablito/accueil-1.mp3` à `-8`, dans l'ordre du texte, sans leurs métadonnées). Un seul
  lecteur pour toutes ses bulles (débloqué une fois, l'iPhone le laisse jouer les suivantes) ; la bulle s'écrit au
  rythme de sa voix ; quand il se tait, la suivante vient toute seule (l'accueil entier : une minute environ).
  **Reçus ensuite le même jour** : les autres onglets (Personnage, Rencontres, Ce mois-ci, Album vide), les questions
  du test de personnage (`pablito-quiz-<question>`, `useVoixPablito`) et ce qu'il raconte pendant la fabrication
  (`pablito-fabrication-1` à `-4`, `-oups`). Un seul lecteur pour toute la page (`lecteurPablito`). Rangés d'après
  l'heure d'enregistrement, la durée et les pauses ; « Dis-moi si c'est bien toi… » (Rencontres, 3ᵉ bulle) reçu à
  part. « Ensuite, chaque achat… » (Personnage, 3ᵉ bulle) : pas enregistré — le patron ne veut pas d'une progression
  par les achats (« ça ressemble trop à de l'achat forcé »), la phrase changera avec la façon de progresser.
- **Ce que ses mots promettent et qui n'existe pas encore** : danser et faire des grimaces (la figurine du client : ses
  quatre sentiments seulement), une rencontre de « quelques minutes » (une conversation de quelques répliques, à lire),
  échanger ses impressions après une rencontre, la carte souvenir de chaque rencontre.

### 9.0 undecies La rencontre en direct, la carte souvenir, les impressions ; sa figurine danse, rit, fait des grimaces (5 novembre) — construit

Sa décision, sur ce que promettent les mots de Pablito : « oui, toutes ces fonctionnalités sont à créer ».

- **En direct** (`Spectacle`, `rencontre.tsx`) : l'IA écrit une conversation plus longue (8 à 14 répliques), chaque
  réplique avec son geste (rit, danse, grimace, sursaute, clin d'œil, touchée, applaudit, réfléchit). La première fois,
  elle se joue sur scène : les deux figurines face à face, celle qui parle bouge et fait son geste (un émoji s'envole),
  chaque réplique à son rythme (`dureeReplique` : deux minutes environ), « ● EN DIRECT », « 🍿 tu es spectateur »,
  pause, « Passer à la fin », « Revoir en direct ». Regardée une fois (retenu sur l'appareil) : toute la conversation.
- **À la fin** (`ApresRencontre`) : « ✨ Ce qui a été partagé » (trois points au plus, écrits par l'IA : un point
  commun, le défi lancé, une découverte) ; **la carte souvenir** (son titre, « Le duel des desserts », les deux
  figurines, le jour) — « 🎉 Nouvelle carte souvenir ! » après le direct ; dans « Rencontres », « Tes cartes
  souvenirs » ; dans l'album, « 🎞️ Mes cartes souvenirs » (`MesSouvenirs`, `GET ?souvenirs=1`), une carte touchée
  rouvre sa rencontre. Sans IA, la page compose la conversation, son titre et son partage d'après les deux cartes.
- **Leurs impressions** (`Echange`) : entre deux clients seulement (un ami, un membre), si les DEUX disent oui ; tant
  que l'autre n'a pas dit oui, rien ne s'écrit (et on ne sait pas s'il a refusé). 20 impressions de 280 caractères au
  plus chacun ; ni numéro, ni adresse e-mail, ni lien, ni autre messagerie (« on se parle ici, pas ailleurs, pour le
  moment ») ; les mots interdits ; « Retirer mon accord » / « Ne plus échanger » ; « Signaler » et « Ne plus rencontrer
  ce membre » restent. Rangé dans la rencontre (`echange`), dans le seau privé.
- **Sa figurine danse** (dès le départ, avec n'importe quel visage) : « 🕺 La faire danser » dans le studio ; chez
  celui qui reçoit, elle se balance sur son ressort, des notes de musique autour.
- **Le fou rire et la grimace** : deux visages de plus (faits par le moteur, comme les autres), options 6 et 7 — après
  les cinq déjà ouvertes, qui ne bougent pas. Pablito les a aussi (il rit, puis fait une grimace, en disant « rire et
  faire des grimaces »).
- **Sans migration** : la table des messages ne connaît que quatre visages ; le fou rire, la grimace et la danse sont
  rangés à côté du message, dans le seau (`<habitant>/m-<id>.json`).

### 9.0 duodecies Les cadeaux de ClikMe, un à chaque étape — plus de progression par les achats (5 novembre) — construit

Sa remarque : « chaque achat chez un commerce fait monter tes caractéristiques… je ne suis pas certain que ce soit la
bonne manière de les faire progresser, ça ressemble trop à de l'achat forcé ; je préférerais que ce soit des cadeaux,
et plus tard peut-être pourront-ils même acheter ces options ». Ses choix : « ClikMe offre à chaque étape » ; l'album,
lui, se remplit toujours « en passant chez le commerçant ».

- **Les étapes** (`lib/direct/etapes.ts`) : créer sa figurine, faire sa carte, envoyer son premier message, sa première
  rencontre, dire 3 fois si c'est bien soi, un ami qui rejoint, rencontrer un membre, revenir 3 jours différents, 5
  cartes souvenirs, sa première figurine du mois (en passant chez un commerçant). Une étape franchie, un cadeau.
- **Ce que les cadeaux ouvrent** : les options de sa figurine (la n-ième au n-ième cadeau : la colère, les voix, la
  tristesse, l'euphorie, le cadre doré, le fou rire, les grimaces), le niveau de sa carte (un par cadeau), son cadre
  (argent à 3, or à 6), et ses caractéristiques (chaque étape fait monter la sienne : `BONUS_ETAPE`).
- **Lues là où elles sont** (`etapes-serveur.ts`, `cadeauxDe`) : sa figurine, sa carte, ses messages, ses rencontres,
  ses jours de présence (`<habitant>/presence.json`, notés quand il ouvre la page — pas quand quelqu'un ouvre son
  message), ses figurines du mois. Rien à migrer.
- **Ce qui était déjà ouvert le reste** : à la première lecture, ce que ses figurines lui ouvraient (une option par
  figurine) est noté une fois (`<habitant>/cadeaux.json`) ; ses cadeaux comptent au moins cela.
- **À l'écran** : « 🎁 Un cadeau de ClikMe à chaque étape : il ouvre une option », ses étapes cochées, la prochaine en
  lien ; sur sa carte, « Ta prochaine étape » (ce qu'elle fera monter) et « J'y vais ». Plus aucun « achat » : ni dans
  les options, ni sur la carte, ni dans les mots de Pablito (« je t'offre un cadeau »), ni sur la page d'un message reçu.
- **L'album** : « Tu passes chez l'un d'eux, et elle rejoint ton album » (Pablito, Ce mois-ci et l'album vide). Les
  voix de ces deux bulles et de la 3ᵉ de Personnage, qui parlaient d'achat, attendent leur nouvel enregistrement.
- **Plus tard** : acheter des options (son idée), et les cadeaux des commerçants (non retenu pour l'instant).

### 9.0 terdecies Le réseau des figurines : sa figurine fait sa vie, il est spectateur (5 novembre) — construit

Sa demande : « que cette figurine crée une sorte de réseau social indépendant, où ma figurine va faire sa vie,
rencontrer des gens, discuter, s'amuser, et je suis spectateur de la façon dont elle a interagi avec des amis, des
proches, des inconnus — ce qui me permet de voir les choses différemment, de me réinventer, d'apprendre, de faire de
nouvelles rencontres, de m'améliorer ». Et : « chaque jour, une nouvelle rencontre avec quelqu'un qui ne fait pas
partie de notre entourage », des discussions avec les amis et les proches (« à définir combien maximum »), des
conversations « différentes et intéressantes, sinon on va se lasser », qui font réagir, « pertinentes par rapport à ce
qu'on dit de soi dans la carte de personnalité », et qui finissent toujours par une carte.

- **La rencontre du jour, hors de son entourage** (`rencontreDuJour`) : la toute première, Pablito l'accueille ; ensuite,
  à tour de rôle, le genre qu'il a vu il y a le plus longtemps — un membre de sa ville (s'il a accepté d'en rencontrer :
  il reste alors dans la file, et on peut le lui présenter), un commerçant, un personnage de ClikMe. Le sujet suit
  l'interlocuteur (son métier, son sujet).
- **Les personnages de ClikMe** (`lib/direct/reseau.ts`, `PERSONNAGES`) : Pablito, et neuf personnages **imaginaires**
  — Mado (élue de quartier), Léo (influenceur), Suzie (coach sportive), Gaston (grand-père conteur), Nina (artiste de
  rue), Professeur Pistache (scientifique farfelu), Capitaine Lou (exploratrice), Rosa (cheffe cuisinière), Max (joueur
  passionné). **Jamais de vraie personne** : faire parler un vrai élu ou un vrai influenceur, ce serait lui prêter des
  mots qu'il n'a pas dits. Ils sont dits imaginaires à l'écran (« Ce personnage est imaginaire : il n'existe pas en
  vrai ») ; Mado ne parle jamais de partis, d'élections ni de vote. Le prochain : celui qu'il n'a pas vu depuis le plus
  longtemps, de préférence un qui partage ses goûts (`choisirPersonnage` : Rosa pour la cuisine, Suzie pour le sport…).
  Leur portrait est leur emoji (Pablito : sa figurine).
- **Ses amis et proches** (`discuterAvecUnAmi`) : il lance une discussion quand il veut, **3 par jour**
  (`AMIS_PAR_JOUR`) ; un ami qui vient de faire sa carte : leur discussion arrive aussitôt (« 🎉 Hugo vient d'arriver :
  vos figurines ont discuté ! ▶ Regarder »), sans compter dans les trois. Ces discussions ne remplacent pas la
  rencontre du jour.
- **Chaque jour, une conversation différente** (`FORMATS`, `choisirFormat`) : le défi, plutôt ceci ou cela, et si… ?,
  le conseil, la découverte, le grand rêve, le quiz, la mission secrète, le compliment, le petit pas. Jamais un de ses
  six derniers ; de préférence un qui lui ressemble (un audacieux reçoit plus souvent un défi, un curieux une
  découverte), avec une part de hasard. Sans l'IA, la conversation composée suit quand même le format.
- **« Et toi ? »** : chaque conversation finit par une question pour lui ; sa réponse (300 caractères, ni numéro, ni
  lien, ni mot interdit) est gardée dans ce qu'il a dit de lui (`<habitant>/rencontres.json`, `dit`, les 8 dernières) :
  les conversations suivantes s'appuient dessus, sans jamais le contredire.
- **Toujours une carte souvenir**, et ses réactions (« c'est tout moi » / « jamais de la vie ») comme avant.
- **À l'écran** : « AUJOURD'HUI · UN PERSONNAGE / UN COMMERCE / UN MEMBRE / AVEC UN AMI », le format du jour
  (« 🎲 Le grand rêve »), « 👯 Tes amis et proches » avec « 💬 Discuter » et ce qu'il en reste aujourd'hui, « Et toi ? »
  après la carte souvenir.
- **La 5ᵉ bulle de Pablito sur « Rencontres »** : « Avec qui ? Un commerçant, un membre de ta ville, un personnage… et
  tes amis, quand tu veux 👯 » (enregistrée le 5 novembre).

### 9.0 quaterdecies Ses retours du 5 novembre, l'après-midi — construit

- **« Une fois la figurine faite, le site bug ; je rafraîchis et ça m'amène sur l'accueil »** : la page plantait au
  moment où la figurine arrivait (`destroy is not a function` : un effet de React rendait la promesse que les
  navigateurs récents renvoient de `scrollIntoView`) ; l'écran d'erreur général de ClikMe renvoie à l'accueil. Corrigé,
  et « Ma collection » a son propre écran d'erreur (`collection/error.tsx`, « Recharger » reste sur la page). La
  fabrication n'abandonne plus au bout de dix appels (la page restait figée à 95 %) : elle attend, et une coupure ne
  l'arrête pas.
- **« La faire danser : c'est la photo en entier qui bouge »** : elle danse SUR SON RESSORT (`lib/direct/ressort.ts`).
  La page trouve le fond (sa teinte rose, de proche en proche depuis les bords), le ressort (étroit, entre le socle large
  et le corps large), reconstitue le fond derrière elle ; le socle ne bouge pas, le ressort se tasse et s'étire, le corps
  saute et se balance au-dessus. Pas de ressort trouvé : elle sautille.
- **« C'est la voix d'une femme alors que je suis un homme »** : une voix d'homme (« Chaleureuse ») et une voix de
  femme (« Douce ») ouvertes dès le départ ; la première fois, on lui demande « Ta figurine parle avec… une voix
  d'homme / une voix de femme » — jamais devinée d'après son prénom ; son choix est gardé (`<habitant>/voix.json`).
- **« Celle de ChatGPT est beaucoup plus personnalisée »** : la consigne (`consigneFigurineClient`) demande une tenue
  qui dit qui il est et de petits accessoires, les bras croisés et de l'attitude, un regard qui a du caractère (lèvres
  fermées), des cheveux texturés, un rendu détaillé et un rose vif ; et sa photo s'accompagne d'une question facultative,
  « Ce qui te ressemble : ton métier ou ta passion » (`<habitant>/univers.json`) — sa figurine s'habille en conséquence.
- **Le même jour, plus tard : « encore plus réaliste qu'avant ; on est très loin »** (sa figurine faite, et celle de
  ChatGPT, avec le prompt que ChatGPT lui a donné). Ce qui la rendait réaliste : nos ajouts (les lignes de l'âge, des
  yeux « de leur vraie taille », « jamais un visage rond », des cheveux « aux mèches visibles », « ultra-détaillé ») et
  la fidélité haute, qui recopie la photo. La figurine d'un client suit maintenant LE PROMPT DE CHATGPT, partie par
  partie (`consigneFigurineClient`) : son visage décrit en une phrase anglaise (`Traits.portrait`, écrite par le modèle
  de vision : « A middle-aged man with voluminous, tousled salt-and-pepper hair… »), une peau lisse, des formes
  arrondies et simplifiées, des yeux un peu agrandis, une barbe de dessin animé, les bras croisés, sa tenue (son univers ;
  le tablier de cuir et les outils pour un artisan), une montre, un fond magenta. Le moteur la fait en FIDÉLITÉ BASSE (il
  redessine, comme ChatGPT) ; `FIGURINE_CLIENT_FIDELITE=high` pour revenir à l'autre. Sa bouche ouverte et ses
  expressions restent en fidélité haute (elles recopient sa figurine). « Ce qui te ressemble » se revoit aussi en la
  refaisant. Les figurines des commerçants ne changent pas.
- **« Une option de plus à chaque achat », « Encore 1 achat »** : ces mots avaient déjà quitté la page (PR #74) ; la
  version vue était celle d'avant sa mise en ligne.
- **Les voix** : « Je regarde ta photo… je vois déjà ta figurine ! » (la fabrication) et la 5ᵉ bulle de « Rencontres ».

### 9.0 quindecies LA STRATÉGIE DE « MA COLLECTION » (5 novembre 2026, validée avec le patron) — lots 1 à 3 construits

**La phrase : « Ta figurine, c'est toi. Chaque jour, elle rencontre quelqu'un. Chaque mois, elle change avec toi. Et en
la regardant vivre, tu te découvres. »** Les gens viennent pour SE DÉCOUVRIR grâce à leur figurine ; les commerçants
sont des PARTENAIRES, un plus, pas le centre (« quand on parle des commerçants, c'est étrange »).

- **Pilier 1 — sa figurine du mois** (lot 3) : chaque mois, MÉRITÉE (avoir vécu le mois), une nouvelle figurine de
  lui : le thème du mois, sa tenue, une nouvelle expression, et SA PHRASE DU MOIS, « drôle et bienveillante, comme un
  horoscope qui le connaît », écrite d'après ce qu'il a dit et fait pendant le mois. L'album devient « Mes figurines ».
  Tous les jours, un PETIT MOT du jour (lot 2), qui annonce la rencontre du jour d'après ce qu'il a dit la veille.
- **Pilier 2 — les rencontres-miroirs** (lot 1, ci-dessous) : on se découvre en regardant sa figurine avec un ami, un
  inconnu, un personnage.
- **Pilier 3 — les commerçants partenaires** (lot 4) : on collectionne leur figurine en passant chez eux, pour leurs
  avantages en avant-première (promos avant tout le monde, bons plans).
- **Le connaître mieux** (lot 2) : apprendre en continu (la question du jour, « Et toi ? », « c'est moi / pas moi »,
  sa figurine qui vérifie), tout garder (Supabase), une page « Ce que ta figurine sait de toi » (voir, corriger,
  effacer) ; « Retrouver ma figurine » par e-mail (le compte tient aujourd'hui à un cookie du téléphone).
- **Une seule progression** (lot 3) : tout s'ouvre dès le départ (expressions, voix) ; les étapes deviennent une
  simple liste « Tes premiers pas » ; la figurine du mois est la progression.

**Le lot 1, construit :**
- **La consigne d'un épisode** (`consigneConversation`), après « c'est pas terrible comme discussion » (des phrases
  creuses, un « grand rêve » jamais nommé, sa figurine qui parlait en rafale) : du concret dans chaque réplique (les
  phrases creuses interdites, nommément), une histoire en trois temps, elles s'écoutent, des phrases naturelles, au
  moins deux vrais moments drôles, la figurine A qui parle de ce qu'il aime ; le ton donné par trois répliques. La toute
  première : Pablito l'accueille et lui fait comprendre, en conversation, ce qui va se passer. `OPENAI_RENCONTRE_MODEL`
  pour un modèle plus fort.
- **« 🪞 Ce que ta figurine a révélé de toi »** : une ou deux phrases à la fin de chaque épisode, pour chacun des deux
  (entre deux clients) ; sans IA, son super-pouvoir, à confirmer.
- **Moins de boutons** : rien sous les phrases pendant le direct (il regarde) ; à la fin, « c'est tout moi / jamais de
  la vie » sous les phrases de SA figurine, et une émotion en touchant une phrase.
- **Tout est gardé** (`journal-serveur.ts`) : ses réponses, ses « c'est moi / pas moi », ce que chaque épisode a révélé,
  datés, mois par mois (`<habitant>/journal/<AAAA-MM>.json`) — pour sa phrase du mois et « ce que ta figurine sait de toi ».

**Le lot 2, construit (mieux le connaître : `connaitre.ts`, `connaitre-serveur.ts`, `/api/direct/connaitre`) :**
- **❓ La question du jour** (« Rencontres », sous la rencontre du jour) : 35 questions drôles et rapides
  (`QUESTIONS_DU_JOUR` : un toucher, ou trois mots ; rien de sensible), une par jour, jamais une déjà répondue ; sa
  réponse va dans son journal et dans ce que les conversations lisent.
- **🔮 Le petit mot du jour** (en haut de « Rencontres ») : « drôle et bienveillant, comme un horoscope qui le
  connaît » — il annonce la rencontre du jour, avec un clin d'œil à ce qu'il a dit ; écrit une fois par jour (gardé,
  `<habitant>/mot-du-jour.json`) ; sans IA, composé.
- **🧠 « Ce que ta figurine sait de toi »** (« Personnage », sous sa carte) : sa carte en mots, et tout son journal
  (questions du jour, « Et toi ? », ses « c'est moi / pas moi », ce que ses rencontres ont révélé) ; il efface une
  chose, ou tout (sa carte, sa figurine et ses rencontres restent).
- **🔐 Protéger / retrouver sa figurine** : son adresse e-mail et le code à six chiffres de « Ma Maison »
  (`nouveauCode`, `verifierCode` : trois codes par adresse en quinze minutes, un e-mail « Ma figurine ») ; dans
  « Ma figurine » (protéger) et sous « Crée ta figurine » (« Tu as déjà une figurine sur un autre téléphone ?
  Retrouve-la »). Le bon code : ce téléphone devient le sien (le cookie), et ce qu'il savait ici rejoint son compte —
  sauf si la figurine est sur CE téléphone et pas sur l'ancien compte : c'est alors l'ancien qui rejoint celui-ci (on
  ne perd jamais une figurine). Les essais passent par un faux Resend (le faux Supabase, `RESEND_BASE_URL`).

**Le lot 3, construit (sa figurine du mois, méritée ; tout ouvert dès le départ) :**
- **🗓️ Sa figurine du mois** (`figurine-du-mois.ts`, `figurine-du-mois-serveur.ts`) : MÉRITÉE — dix jours de
  rencontres dans le mois (`JOURS_POUR_LA_FIGURINE`, « 10 jours, ça va ») ; au dixième, elle se fabrique toute seule,
  une fois : sa figurine habillée du thème du mois (les tenues des éditions, `TENUES_EDITION`), avec l'expression du
  mois (`EXPRESSIONS_DU_MOIS` : la galette « fier comme un roi », Noël « émerveillé », l'automne « rêveur »…), le cadre
  et le ressort gardés (`poserAuFormat` / `reprendre`). Sans moteur d'image : sa figurine de tous les jours, avec le
  thème et sa phrase. Deux pages ouvertes ne paient pas deux fois (un verrou de quatre minutes).
- **🔮 Sa phrase du mois** : « drôle et bienveillante, comme un horoscope qui le connaît », pour les semaines à venir,
  écrite d'après son journal du mois (ses réponses, ce que ses rencontres ont révélé) — rien de sensible, jamais le
  genre deviné ; sans IA, composée d'après ce qu'il a dit (« toi qui as dit « … », tu vas oser… »).
- **Rangée** dans le seau privé : `<habitant>/mois/<AAAA-MM>.json` (le thème, l'expression, la phrase, l'image) et
  `<habitant>/mois/<AAAA-MM>.webp`. Route : `GET /api/direct/ma-figurine?mois=1`, `POST { action: "mois" }`.
- **Les écrans** (`figurine-du-mois.tsx`) : « Ce mois-ci » commence par SA figurine du mois (les dix jours en points,
  puis la révélation : la figurine, son visage du mois, sa phrase) — les commerçants viennent après ; l'album commence
  par « Mes figurines du mois » (une par mois vécu), puis « Mes commerçants partenaires » ; dans « Ma figurine », une
  ligne « Ta figurine de novembre · 3/10 jours » et « Comment ça marche ? » (les trois temps de la phrase, les
  commerçants en plus) à la place de « Ce que tu vas débloquer ».
- **Tout est ouvert dès le départ** : les sept visages, toutes les voix, la danse, le cadre doré ; les visages se
  fabriquent à la demande (la joie d'office, chacun des autres la première fois qu'il le choisit :
  `<habitant>/visages.json`), pour ne pas payer sept visages que personne ne regarde. Les étapes ne sont plus qu'une
  liste « 👣 Tes premiers pas » (sans cadenas), qui disparaît une fois tout fait.

**Le lot 4, à faire : les commerçants partenaires** — collectionner leur figurine en passant chez eux donne leurs
avantages en premier (les promos avant tout le monde, les bons plans).

### 9.0 sexdecies Ses retours du 6 novembre — le menu, « Ma figurine », la danse, les visages — construit

- **Le menu du bas** (« très peu moderne, il manque de personnalité ; il faut qu'on voie en un coup d'œil qu'on est
  différent ») : un dock qui flotte ; SA figurine en médaillon pour « Ma figurine » ; « Rencontres », le cœur de
  l'app, en gros bouton rond au milieu (il appelle quand une rencontre attend) ; des icônes dessinées pour ClikMe (une
  figurine sur son ressort, une carte, deux bulles, le mois, l'album).
- **« Ma figurine », en trois temps** (« très compact, ça en devient confus ») : sa figurine en grand, avec ses deux
  gestes posés dessous (🕺 Danser, 🔁 La refaire) ; « Son visage », sur une ligne qui défile ; « 💬 Fais-la parler »,
  une seule carte (sa voix choisie tient sur une ligne : « Voix : Posée · changer ») ; puis, repliés, « 👣 Tes premiers
  pas » (une ligne et le prochain pas) et ses messages. La figurine du mois : une pastille sous le titre.
  « Comment ça marche » est retiré (le guide l'explique déjà, à l'arrivée sur chaque onglet).
- **🕺 La danse en musique** (`musique-danse.ts`, « il faut y associer une musique qu'on entend, autrement c'est
  plat ») : une boucle de quatre mesures composée dans le téléphone (aucune voix, aucun échantillon), à 100 battements
  par minute — la grosse caisse tombe quand le ressort s'écrase (`rythme` cale l'animation sur la musique) ; un
  « boing » de ressort à chaque mesure ; elle se fait discrète quand la figurine parle, et s'arrête quand on change
  d'onglet ou qu'on range le téléphone.
- **Les visages en création** (« toute la carte bouge parce que l'expression n'est pas prête : prévenir qu'elle est en
  cours de création, et ne pas laisser cliquer ») : un visage que le moteur fabrique dit « en création… » et ne se
  choisit pas ; un visage pas encore fait porte une étincelle — le toucher le fait fabriquer, et il s'affiche tout seul
  quand il est prêt (`visagesEnCours`). La figurine ne bouge plus « pour rien ».
- **« Dire 3 fois si c'est bien toi »** quittait les premiers pas (on croyait devoir refaire sa figurine) : à sa place,
  « ❓ Répondre à 3 questions du jour ».

### 9.0 septdecies « Rencontres » : un épisode par jour, en BD, et le métier du commerçant (6 novembre) — construit

Ses mots : « ça manque de personnalité et de vie, alors que ça devrait être l'essentiel » ; « l'organisation est
chaotique… il faut que ça raconte une histoire » ; « que les deux figurines se parlent face à face, ou comme dans une
BD » ; « pas d'effet wow… on a du mal à scroller la conversation jusqu'en bas » ; « en fonction de la personne, c'est
nous qui devons orienter la conversation : avec un ami, on choisit la thématique (dispute, amour, sortie…) ; avec un
coiffeur, « sur vous je verrais bien ce style », et appuyer ici pour l'essayer ; pour un restaurant, le menu du jour ;
à chaque métier un comportement ».

- **Une histoire, dans l'ordre** (`rencontre.tsx`) : « L'épisode du jour » — son AFFICHE (les deux figurines face à
  face, avec qui, le thème, le titre, « ▶ Regarder l'épisode ») ; puis, une fois vu, ce qu'il en reste ; puis « 🎬 Envie
  d'un autre épisode ? » (un ami et un thème, inviter, rencontrer un membre) ; puis ses épisodes d'avant. Le mot du jour
  quitte la page (c'était lui, « défi lancé sans préchauffage… », pris pour le thème) ; la question du jour va dans
  « Personnage », avec « Ce que ta figurine sait de toi ».
- **Le théâtre, en BD** (`Theatre`) : tout l'écran, rien à faire défiler. Les deux figurines face à face, dans des cases
  de BD ; la bulle de celle qui parle, au-dessus d'elle, le texte qui arrive lettre après lettre ; l'onomatopée de son
  geste (« HA HA ! », « CLAP CLAP ! », « QUOI ?! ») ; celle qui écoute s'efface un peu ; le récitatif jaune (le titre) ;
  une barre par réplique, comme une story ; toucher : la suivante (à gauche : la précédente). « FIN » : ce que le
  commerçant propose, sa figurine relookée, la carte souvenir, « 🪞 Ce que ça dit de moi ».
- **Après l'épisode, sur la page** : ce qu'il a proposé (et le lien), ce que sa figurine a révélé de lui, « Et toi ? »,
  leurs impressions (entre deux clients), « 📖 Relire la conversation » (la BD, et « c'est tout moi / jamais de la
  vie »), ce qui a été partagé, la carte souvenir.
- **Les scénarios** (`scenarios.ts`) :
  · avec un AMI, il choisit le thème (`THEMES_AMIS`) : 💥 la dispute (pour rire), 💘 l'amour (version comédie
    romantique, jamais intime), 🎉 la sortie, ✈️ le voyage, 🍕 la bouffe, 🤫 les petits secrets, 🔮 dans 10 ans, 🏆 le
    défi ; un membre de sa ville : un thème au hasard (jamais l'amour) ;
  · chez un COMMERÇANT, son métier donne l'épisode (`scenarioMetier`) : ✂️ le coiffeur propose UN style, 👗 la
    boutique un look, 👓 l'opticien une monture, 🖋️ le tatoueur un petit motif, 💍 le bijoutier un bijou — avec
    « L'essayer sur moi » (`/site-internet/apercu/<slug>?onglet=experience`, l'essai de sa page) ; 🍽️ le restaurant
    compose LE menu de la figurine avec SES vrais plats (ceux qu'il a saisis, sinon sa carte lue sur ses photos : des
    noms, jamais un prix, rien d'inventé) et « Voir sa carte » ; le fleuriste un bouquet, le libraire un livre, la
    boulangerie une gourmandise… ; sa figurine ne promet toujours rien (ni prix, ni offre, ni horaire) ;
  · un personnage de ClikMe garde son sujet et le format du jour.
- **✨ Sa figurine relookée** (`relookerSaFigurine`, l'effet « c'est incroyable ce qu'ils ont fait ») : chez le
  coiffeur, la boutique, l'opticien, le tatoueur, le bijoutier, le moteur d'image redessine SA figurine d'après la
  proposition (la coupe, la tenue…), le reste intact (le cadre, le ressort). Demandée quand il lance l'épisode, prête à
  « FIN » : « AVANT / APRÈS ✨ ». Une seule fois par épisode, un verrou contre deux pages ; sans moteur, la proposition
  seule. Rangée dans `<habitant>/rencontres/<id>.webp`.

### 9.0 octodecies Le mème, et la figurine qui lui ressemble (6 novembre, le soir) — construit

- **🎭 Le mème** (`meme.ts` ; « faire comme un mème ultra moderne : quand quelqu'un reçoit ma figurine, il va vouloir
  la partager ; très facile, sans texte ni blabla ; on le voit directement en action, il parle directement ; et juste un
  bouton « crée ou réponds toi aussi avec ton mème » ») :
  · « 🎭 Créer mon mème » fabrique, DANS LE TÉLÉPHONE (comme les films du Studio), une vidéo verticale de 720 × 1280 :
    sa figurine plein cadre qui arrive d'un coup (zoom, flash), la bouche qui s'ouvre sur sa voix, la tête qui dodeline,
    son visage du moment, l'emoji de ce qu'elle ressent, la danse et sa musique si elle danse ; ses mots en
    sous-titres façon TikTok (quelques mots à la fois, le mot dit en jaune) ; un petit « ClikMe » ; une seconde
    « Crée ton mème · clikme.fr » à la fin. On la voit se fabriquer.
  · Elle part tout droit au seau privé (une adresse d'envoi signée, `<habitant>/meme-<id>.mp4` ; rangée à côté du
    message), puis « 📲 Partager mon mème » : la feuille de partage du téléphone, avec LA VIDÉO (WhatsApp la montre et
    la rejoue) — sans texte ; sinon son lien seul ; « ⬇️ La vidéo » pour l'enregistrer. Le MP4 d'abord (iPhone,
    WhatsApp), le WebM sinon.
  · La page du lien (`/figurine/<id>`) : le mème joue tout de suite, en boucle — avec le son si le navigateur le
    permet, sinon en silence avec ses sous-titres (les navigateurs interdisent le son avant le premier toucher) et le
    son au premier toucher, n'importe où. Un seul bouton, « 🎭 Crée ou réponds avec ton mème » ; dessous, discret,
    « 📲 Partager ce mème » (« il ne peut pas le partager directement dans une conversation WhatsApp ? ») : LA VIDÉO
    elle-même, préparée dès l'ouverture de la page (sur iPhone, la feuille de partage ne s'ouvre que dans le toucher),
    sinon le lien ; « Signaler », tout petit. Reçu comme vidéo dans WhatsApp, il se transfère comme n'importe quelle
    vidéo (appui long, « Transférer »). L'aperçu du lien : « 🎭 Le mème de Léa » et sa figurine. Un message sans vidéo (d'avant) : sa figurine, ses
    mots en sous-titre, qui parle au premier toucher.
  · Les commerces cités dans un message ne se cochent plus (le mème, rien d'autre).
- **La figurine qui lui ressemble** (« c'est joli mais ça ne me ressemble plus du tout ; il faut qu'on me reconnaisse,
  avec les traits exagérés mais reconnaissables ») : le moteur repasse en FIDÉLITÉ HAUTE au visage
  (`FIGURINE_CLIENT_FIDELITE=low` pour revenir à la basse) ; la consigne met la ressemblance d'abord (« si le style et
  la ressemblance s'opposent, la ressemblance ») : la structure de SON visage gardée trait par trait, ses traits vus
  sur la photo toujours écrits, et ce qu'un caricaturiste accentuerait chez lui exagéré d'environ 20 % — le dessin
  animé, oui, mais avec SON visage.

### 9.0 novodecies Le mème, contagieux : le duo, les mèmes prêts, le premier mème, la mesure (6 novembre) — construit

Sa question : « parmi les cinq pages, laquelle a le plus de chance de marcher fort ? » — le mème : c'est la seule page
qui AMÈNE des gens (chaque mème envoyé est une publicité), il plaît en une minute, il colle à une habitude qui existe
(WhatsApp). Ses deux risques : la ressemblance, et la page blanche. Ce qui le rend vital (« d'accord sur tout ») :

- **💬 Répondre en duo** : « 🎭 Crée ou réponds avec ton mème » passe par `/figurine/<id>/repondre` (le geste est
  compté), puis « Ma collection » s'ouvre sur sa figurine avec « ↩️ Tu réponds à Léa ». Son mème devient un DUO : la
  figurine de Léa en haut, qui parle d'abord (sa voix, ses mots), la sienne en bas, qui répond (« ↩ RÉPONSE »), celle
  qui écoute un peu assombrie. Sans figurine, il la crée d'abord : sa réponse l'attend (gardée sur l'appareil). La
  réponse est rattachée au mème d'origine (`repondA`, à côté du message).
- **✨ Les mèmes prêts** (`memes-prets.ts`) : une rangée au-dessus du texte — le mème du jour (une phrase qui change
  chaque matin, la même pour tous), la fête qui approche (la semaine d'avant : Noël, la Saint-Valentin, la fête des
  mères…), le lundi et le vendredi, puis les occasions de toujours (anniversaire, « j'arrive en retard », pardon, bravo,
  merci, bonne nuit, « tu me manques », fou rire). Un toucher : le texte, le visage, la danse — et elle le dit
  aussitôt. Des phrases qui vont à tout le monde (jamais un accord au masculin ou au féminin pour celui qui parle).
- **🎁 Le premier mème, déjà écrit** : tant qu'il n'a rien envoyé, son texte est là (« Salut ! C'est moi… en figurine.
  Avoue, je suis encore mieux en vrai. ») : la voix, écouter, partager.
- **📈 La mesure** (`clik_meme_evenement`, la migration `20261110090000_clik_meme_evenement.sql`, à appliquer à la
  main) : un mème créé, une réponse en duo, une page ouverte (pas les robots des aperçus de lien), « Crée ou réponds »
  touché, un partage, une figurine créée par quelqu'un arrivé par un mème. La page `/admin/humain/memes` : le
  coefficient (nouveaux créateurs par mème envoyé — au-dessus de 1, l'app grandit toute seule), le chemin sur 7 et 30
  jours (ouvert ? touché ? créé ?), jour par jour.

### 9.0 vicies On resserre sur le mème (7 novembre) — étape 1 construite

Ses mots : « le concept part un peu dans tous les sens » ; « collectionner les figurines des commerçants, ça paraît
hors sujet avec la direction qu'on vient de prendre » ; la page du mois « on devrait pouvoir utiliser celle qu'on veut
pour l'envoyer en faisant dire quelque chose ou la transformer en mème » ; « “où les gagner”, gagner quoi ? » ;
« l'album, on a du mal à voir à quoi il sert ». La règle, pour chaque écran : **est-ce qu'il aide à faire un mème, ou
donne une raison d'en envoyer un ?** Sinon, on le transforme ou on le retire. Ce qui est construit (l'étape 1 : rien
de neuf, on resserre) :

- **Trois onglets au lieu de cinq** (`ma-collection.tsx`) : 💬 **Rencontres** (l'épisode du jour, sa figurine du mois
  qui s'y mérite juste dessous, et « 🃏 Mon personnage » à côté, dans une bascule), 🎭 **Créer** au milieu, en gros, avec
  SA figurine dans le bouton, 📥 **Mes mèmes**. Les anciens liens retombent sur le bon (`#album` → « Mes mèmes »,
  `#mois`, `#ou-gagner` → sa figurine du mois dans « Rencontres », `#personnage` → « Mon personnage »).
- **Ce mois-ci et l'album des commerçants quittent l'appli** (`decouvrir.tsx`, `album.tsx` supprimés). Les cartes de
  fidélité commencées restent valables, sur la page de chaque commerçant (`/f/<slug>`) ; son lien mène maintenant à
  « 🎭 Ma figurine qui parle ». Les épisodes d'avant sont listés dans « Rencontres » (plus de cartes souvenirs dans un
  album).
- **🗓️ Ses figurines du mois deviennent des LOOKS** : dans « Créer », « Son look » (de tous les jours, ou une figurine
  du mois). La première fois qu'il en prend une, le moteur lui ouvre la bouche (`fabriquerParleDuLook`, une image,
  `<h>/mois/<AAAA-MM>-p.webp` ; dès sa fabrication s'il reste le temps) ; ensuite elle parle dans ses mèmes, avec son
  visage du mois. Le message garde son look (`look`, à côté du message) : c'est elle que voit celui qui le reçoit, et
  elle encore qui parle en haut d'un duo. « 🎭 Fais-la parler » sous sa figurine du mois, et la pastille « est arrivée »
  de « Créer », la prennent d'un toucher (`vers-le-studio.ts`).
- **📥 Mes mèmes** (`mes-memes.tsx`, `GET ?memes=1`) : « ↩️ On t'a répondu » (les réponses en duo à ses mèmes — une
  marque par réponse dans son dossier, `rep-<son mème>-<la réponse>.json` — avec « Lui répondre »), « 🎭 Mes mèmes »
  (vus combien de fois — `clik_meme_evenement`, sinon ses écoutes — et combien de réponses), « 📥 Reçus » (ceux qu'il a
  ouverts sur ce téléphone, gardés par la page du mème, avec « Répondre »). Ses messages ne sont plus repliés dans
  « Créer ».
- **🎭 « Fais-en un mème »** à la fin d'un épisode : les meilleures répliques de SA figurine ; un toucher, et « Créer »
  s'ouvre avec la réplique écrite.
- **👣 Ses premiers pas** : « Passer chez un commerçant partenaire » devient « ↩️ Répondre en duo à un mème »
  (`<h>/duo.json`, noté à sa première réponse) ; « Envoyer ton premier message » devient « Créer ton premier mème ».

Ce qui vient ensuite (proposé, à décider avec le patron) : l'étape 2 — **le mème du jour du commerçant** (sa figurine
annonce une chose précise chaque jour : le menu du jour, un nouveau vêtement, une coiffure, une promo, un bon plan, une
place libre ; ses mots et ses prix à lui, jamais inventés) et l'onglet **Découvrir** avec les mèmes des commerçants du
coin ; l'étape 3 (construite, 9.0 duovicies) — les mèmes que les gens choisissent de rendre publics (jamais sans leur accord). La voix du
commerçant : un enregistrement de sa voix (la règle d'aujourd'hui), à moins que le patron n'étende l'exception.

### 9.0 unvicies Le mème du jour des commerçants, et « Découvrir » (7 novembre) — étape 2 construite

Ses mots : « pour un commerçant, il pourrait faire de sa figurine une action par jour précise : présenter le menu du
jour, un nouveau vêtement, une coiffure, une promo, des bons plans » ; pour les clients, « découvrir les figurines et
les mèmes des autres ». Ses trois décisions, laissées à ClikMe (« fais le mieux ») : la voix du commerçant est la
sienne, enregistrée (ou la musique) — l'exception ElevenLabs reste celle des clients ; seuls les mèmes des commerçants
sont publics (ceux des clients, jamais sans leur accord) ; les cartes de fidélité commencées restent valables.

- **Au comptoir, « 🎭 Mon mème du jour »** (une carte de l'accueil, `meme-comptoir.tsx` ; `?ouvrir=meme` y mène droit,
  pour un rappel chaque matin) : ce qu'elle annonce (`TYPES_MEME_COMMERCE`, ceux de son métier d'abord — 🍽️ le menu du
  jour, ✂️ la coupe du jour, ✨ nouveau en boutique… puis la promo, le bon plan, une place libre, le mot du jour) ; ses
  mots et ses prix (ClikMe n'invente rien, 160 signes, un gros mot refusé) ; sa voix enregistrée, ou la musique (elle
  danse, ses mots défilent) ; sa figurine du mois, sinon sa figurine, sinon son fantôme (qui ouvre la bouche aussi).
  La vidéo se fabrique sous ses yeux (`meme.ts` : le bandeau « 🍽️ LE MENU DU JOUR » et son nom en haut, son nom à la
  fin), part au seau public, et il la partage telle quelle (statut WhatsApp, story). Cinq par jour au plus. Dans la
  démonstration, elle se fabrique sans rien publier.
- **Sa page publique `clikme.fr/meme/<id>`** (`/m/` était déjà pris par les villes) : la vidéo joue tout de suite,
  « 📍 Voir sa page » (par `/meme/<id>/voir`, compté), « 🎭 Crée ton mème, toi aussi », « 📲 Partager ce mème ».
- **Ce qu'il rapporte**, à son comptoir : vu combien de fois, combien sont allés voir sa page, combien l'ont partagé
  (la table de la mesure, `clik_meme_evenement`, sous `c-<id>` ; la page `/admin/humain/memes` ne les mélange pas aux
  mèmes des clients).
- **🔥 « Découvrir »**, dans l'appli des clients (`decouvrir.tsx`, `GET /api/direct/memes-commerces`) : le fil des mèmes
  du jour des commerçants de sa ville (les trois derniers jours), puis ceux d'ailleurs s'il y en a peu ; chaque vidéo
  joue en silence quand on la voit, un toucher pour le son ; « Voir sa page », « Partager ».
- **Le menu en bas, comme les applis de vidéos** : 🔥 Découvrir · 💬 Rencontres · 🎭 Créer (au milieu) · 📥 Mes mèmes ·
  🃏 Moi (sa carte de personnage, la question du jour).
- **Le stockage, sans table** (rien à migrer) : le seau public `figurines-pros` — la vidéo `<site>/memes/<id>.<ext>`, sa
  fiche `memes/<id>.json`, une fiche par mème dans `memes-du-jour/<ville>/<jour>/` (deux commerçants qui publient en
  même temps ne s'écrasent pas), et ses mèmes à lui `<site>/memes/index.json`.

L'étape 3 (les mèmes des clients dans « Découvrir », avec leur accord) : voir 9.0 duovicies.

### 9.0 duovicies Les mèmes des gens dans « Découvrir », sur leur accord (7 novembre) — étape 3 construite

Le patron a dit « oui » à l'étape 3 : « découvrir les figurines et les mèmes des autres », pas seulement ceux des
commerçants. La règle tient : **un mème de client n'est jamais public sans son accord.**

- **Un geste à lui, à chaque fois** : « 🌍 Le montrer aussi dans « Découvrir » » sous son mème tout juste fait (le
  studio), ou « 🌍 Montrer dans Découvrir » sous chacun de ses mèmes (« Mes mèmes »). On lui demande d'abord son accord
  (`ACCORD_PUBLIC` : « Ton mème — ta figurine, ta voix, tes mots et ton prénom — sera visible par les gens de ta ville
  dans « Découvrir ». Tu pourras le retirer quand tu veux. D'accord ? ») ; « Annuler » : rien ne bouge. Le bouton
  devient « 🌍 Dans Découvrir · retirer » : un toucher, et il quitte « Découvrir » tout de suite.
- **Pour les gens de SA ville seulement** (celle de son compte), ces trois derniers jours. Sans compte, on ne voit que
  les commerçants.
- **Jamais un duo** (il montre aussi la figurine de quelqu'un d'autre : il reste entre eux ; ni bouton, ni route),
  **jamais un mème signalé** (il disparaît du fil, et ne peut plus y revenir), seulement une vidéo.
- **Dans le fil** (`decouvrir.tsx`) : ceux de sa ville d'abord — commerçants et habitants mêlés, les plus récents en
  premier — puis les commerçants d'ailleurs. La carte d'un habitant : « 🎭 Léa », « De ta ville · aujourd'hui ·
  Signaler », « ↩️ Lui répondre » (en duo, `/figurine/<id>/repondre`), « 📲 ». Un liseré doré la distingue de celle
  d'un commerçant.
- **Le stockage, sans table** : `public` (sa ville, le jour, l'heure) dans la fiche à côté du message
  (`<h>/m-<id>.json`, seau privé `figurines-clients`), et une fiche par mème dans `publics/<ville>/<jour>/<id>.json`
  (retirée quand il le retire). La vidéo reste au seau privé : le fil la sert par des adresses signées
  (`memesPublics`, `lib/direct/ma-figurine-serveur.ts` ; `POST /api/direct/ma-figurine { action: "public" }`).
- **Les essais** (`scripts/navigateur/ma-figurine.mjs`) : l'accord demandé (et « Annuler » qui ne fait rien), Hugo de
  Dax qui voit le mème de Léa et peut lui répondre, le duo refusé, le mème d'un autre refusé, rien sans compte, le
  retrait immédiat, et le mème signalé qui quitte le fil.

### 9.0 tervicies « 🎲 Surprends-moi ! » : ClikMe écrit son mème (7 novembre)

Le patron : « laisser la possibilité de créer un mème automatiquement en fonction de ses traits de personnalité :
c'est ClikMe qui le crée en appuyant sur “Surprends-moi !” ». Et seulement ça : un ami ne fait jamais parler la
figurine d'un autre.

- **Un toucher** (« 🎲 Surprends-moi ! », en tête des mèmes prêts du studio) : ClikMe écrit SON mème, le visage qui
  va avec et s'il danse. Il le lit dans une carte : « 🎲 Encore » (un autre, jamais deux fois le même) ou
  « C'est moi ✓ ». **Rien n'est dit tant qu'il ne l'a pas choisi** : la voix n'est fabriquée qu'au « C'est moi ✓ ».
  C'est bien lui qui fait dire ce texte à SA figurine, ce qui reste dans l'exception des voix (`CLAUDE.md`), et on ne
  paie pas une voix pour un texte qu'il jette. Ensuite, c'est un mème comme les autres (il peut le retoucher).
- **D'après sa carte de personnage**, et rien d'autre : ses réponses au questionnaire, ce qu'il aime, sa façon de
  parler, son super-pouvoir, son point faible, sa phrase fétiche. Jamais son prénom, jamais ce qu'il a confié à sa
  figurine (« ce que ta figurine sait de toi ») : un mème part chez d'autres. Sans carte, des répliques pour tous, et
  « 🃏 Fais ta carte de personnage : tes surprises te ressembleront ».
- **L'IA l'écrit** (`meme-surprise-serveur.ts`, la même que la carte de personnage ; `OPENAI_MEME_API_KEY`,
  `OPENAI_MEME_BASE_URL` et `OPENAI_MEME_MODEL` si l'on veut les séparer), sous un angle tiré au sort à chaque fois (sa
  façon de parler, un de ses goûts, sa phrase fétiche…). La consigne : drôle, tendre, de l'autodérision, jamais
  blessant, à la première personne ; jamais un accord au masculin ou au féminin pour celui qui parle ; rien sur
  l'alcool, la santé, le corps, l'âge, la religion, la politique, l'argent, les marques, les personnes réelles, les
  commerces et les prix. **Relu** : 120 signes au plus, aucun mot interdit, rien d'alcoolisé (loi Évin), aucun lien ;
  sinon, une réplique de la réserve.
- **La réserve** (`meme-surprise.ts`, 48 répliques relues une à une) : choisie d'après ses réponses, ses goûts et sa
  phrase fétiche. Elle prend le relais sans clé, quand l'IA dérape, et après ses 10 tirages par l'IA du jour.
  40 surprises par jour au plus, tout compris (`<habitant>/surprises.json`).
- **Les essais** (`scripts/navigateur/ma-figurine.mjs`, avec une fausse IA dans le faux Supabase) : sans carte, une
  surprise pour tous et l'invitation à faire sa carte ; rien n'est écrit ni dit avant son choix ; « Encore » en donne
  une autre ; avec sa carte, l'IA écrit d'après lui (la consigne porte ses goûts et sa phrase, jamais son prénom) ;
  « C'est moi ✓ » : le texte est à lui, une seule voix ; une réponse qui parle d'alcool est écartée ; le plafond du jour.

### 9.0 quatervicies Le premier mème pendant la fabrication, et la mesure du parcours (7 novembre) — lot 1

Ce qui ferait qu'elle soit très utilisée, en quatre lots (le patron : « ok ») : 1. le premier mème en moins d'une
minute après la révélation, et la mesure ; 2. le mème du jour au centre, les réactions, les amis d'abord, la carte sobre
des commerçants ; 3. l'installation sur l'écran d'accueil, puis les notifications (sur iPhone, l'une ne va pas sans
l'autre) ; 4. les commerçants qui jouent le jeu, puis leurs tendances. Ses trois décisions : poster sa réponse au mème
du jour la rend visible par sa ville (l'accord écrit sur le bouton) ; le bandeau « LE MENU DU JOUR » quitte les vidéos
des commerçants (leur nom reste à la fin) ; la notification du mème du jour à 11 h 30, que chacun peut couper.

**Le lot 1** : « les deux minutes de fabrication sont le moment le plus fragile ».

- **⏱️ En attendant : ton premier mème** (`PremierMemePendant`, `ma-figurine.tsx`), sous « On fabrique ta figurine »
  (la fabrication automatique comme l'annonce « dans quelques jours ») : son premier mème déjà écrit, des idées d'un
  toucher (« 🎲 Surprends-moi ! », le mème du jour…), ses mots, sa voix (homme ou femme, puis les quatre). « ▶ L'écouter » :
  sa voix le lit tout de suite — la route lit un texte dès la fabrication (`lireSonTexte`) — et il est gardé sur ce
  téléphone (`clikme-premier-meme-v1`), avec sa voix choisie pour le studio.
- **🎉 À la révélation**, juste sous sa figurine : « La voilà ! Ton premier mème est prêt », son texte, et
  « 🎭 Créer mon premier mème » : un toucher, la vidéo se fabrique (le son s'ouvre dans ce toucher, comme l'iPhone
  l'exige), puis il la partage. Parti, ce qu'il avait préparé est effacé.
- **📈 La mesure** (`parcoursPremierMeme`, la page `/admin/humain/memes`) : ceux qui ont envoyé leur photo ces 30 jours
  — figurine prête, premier mème, mème envoyé (partagé, ou ouvert par quelqu'un) — et le temps entre la figurine prête
  et le premier mème (la médiane, et la part en moins d'une minute). Sans table de plus.
- **Les essais** (`ma-figurine.mjs`) : Zoé prépare son premier mème pendant la fabrication (son texte, une voix de
  femme, « ▶ L'écouter »), sa figurine apparaît, un toucher : le mème est fait avec son texte et sa voix, en moins
  d'une minute après la révélation (13 s ici).

### 9.0 quinvicies Le concours de regard : le prototype du duel du jour (7 novembre)

Le patron sur « Rencontres » : « trop compliqué, long et pas compréhensible » ; puis « l'idée de faire discuter deux
figurines est peut-être bonne, mais la forme n'est pas bonne, c'est ennuyant : il faudrait quelque chose d'amusant à
regarder » ; « est-ce que je peux influencer le résultat ? » ; « à la fin, une carte à collectionner avec les deux
figurines et une phrase, comme un polaroïd qu'on pourrait envoyer ». La piste : **le duel du jour** — des têtes sur
ressort, un mini-jeu de 10 à 20 secondes, un gagnant, un polaroïd. Avant de refaire la page, un prototype à essayer :
`clikme.fr/duel` (pas dans Google, aucun lien dans l'app).

- **La règle** (`lib/direct/duel-regard.ts`) : il garde le doigt posé, sa figurine garde son sérieux ; 🪰 une mouche se
  pose sur elle : il glisse son doigt pour la chasser ; 😜 Pablito louche : il ne bouge surtout pas. La jauge de fou rire
  monte (une mouche pas chassée, un geste pendant la grimace, et la tension qui monte avec le temps) ; à 100, sa
  figurine éclate de rire. Il lève le doigt : il a ri. Il tient plus longtemps que Pablito (10 à 16 s, le même temps
  pour tout le monde ce jour-là) : c'est Pablito qui craque.
- **Sa carte de personnage compte un peu** : son humour au-dessus de 50 lui épargne jusqu'à 15 % du fou rire —
  l'adresse compte bien plus. (La suite : chaque caractéristique, une force en duel.)
- **Le dosage, simulé** : sans réagir, on perd presque 8 fois sur 10 ; en ratant une mouche sur quatre, on gagne
  7 fois sur 10 ; sans rien rater, toujours.
- **Le polaroïd** : les deux figurines au moment de la chute (👑 et 😂), la phrase écrite d'après le duel — à la main
  (Caveat), sans accord de genre, qu'il peut changer —, le score entre eux, « 😐 Concours de regard · le jour ·
  ClikMe ». Une image (JPEG, ~180 Ko) : « 📲 Envoyer le polaroïd » (la feuille de partage du téléphone), sinon
  enregistrée. « 🔁 Revanche ! ».
- **Les sons sont des bruits fabriqués dans le téléphone** (un bourdon qui monte, un cœur, le bzz de la mouche, un
  boing, un « pfff ») : jamais une voix. Pablito présentateur attendrait des enregistrements du patron.
- Sans compte : il joue avec Clik, et on l'invite à créer sa figurine.
- **Les essais** (`scripts/navigateur/duel.mjs`, 19 vérifications) : l'accueil, le doigt levé pendant le décompte, une
  partie sans réagir (elle craque, le polaroïd, la phrase changée, le score), la revanche en chassant chaque mouche
  (Pablito craque), sans compte.

### 9.0 sexvicies Une expression de plus : l'amour 😍 (7 novembre)

Le patron : « on n'a pas l'expression amoureux, qui est assez utile ». Le huitième visage du studio, **😍 Amour**
(`SENTIMENTS`, `ma-figurine.ts`) — un nom, jamais « amoureux » ni « amoureuse » : on ne devine pas le genre.

- **Son visage**, fait par le moteur d'image à la demande, comme les autres (`figurine-expressions-serveur.ts` : des
  yeux rêveurs qui brillent de petits reflets en cœur, les joues qui rosissent, un sourire tendre ; et sa bouche
  ouverte pour parler). Rien n'est fabriqué tant qu'on ne le choisit pas. Pablito aussi l'aura à la première demande.
- **Des cœurs montent autour d'elle** (💗 ❤️ 💕), avec son visage amoureux ou en attendant qu'il soit fait (elle se
  balance alors, le cœur battant) ; et dans la vidéo du mème, 😍 et ses cœurs.
- **Les mèmes prêts** : « 😍 Je t'aime » (« Je t'aime. Voilà, c'est dit. Et ma figurine est tout à fait d'accord. »)
  et la Saint-Valentin prennent ce visage.
- Le sentiment est rangé à côté du message (pas dans la colonne de la table) : rien à migrer.

### 9.0 septvicies ⚡ Mes réactions : sa tête à la place des emojis et des GIF (7 novembre)

Le patron : « la figurine pourrait remplacer les emojis et les GIF classiques : sa propre bibliothèque de réactions —
sa figurine qui explose de rire, qui dit “Sérieusement ?”, qui applaudit, qui est choquée, qui envoie un bisou, qui
fait une grimace ; une rangée “💥 Gags” : le prout avec une barre d'intensité, l'éternuement, elle s'endort, le hoquet.
Au lieu de chercher un GIF générique, il utilise sa propre tête » ; « un clavier de stickers, ou un partage très
rapide ». Ses décisions : avant le lot 2 (le mème du jour) ; une marque ClikMe discrète sur les gags, rien sur les
stickers. Le clavier, lui, demande une app native : on le fera si les envois suivent (le troisième temps).

- **En haut de « Créer »** (`mes-reactions.tsx`, l'ancre `#reactions` — là où l'app installée pourra s'ouvrir) :
  huit réactions (😂 MDR, 🤨 « Sérieusement ? », 👏 Bravo, 😱 « Quoi ?! », 😘 Bisous, 😜, 😍, 👍 « Top ! ») et
  quatre gags.
- **Les réactions sont des stickers** (`sticker.ts`, 512 px, PNG) : sa pose détourée (fond transparent), un liseré
  blanc et une ombre, le mot façon BD. Dessinés d'avance : **un toucher, et la feuille de partage s'ouvre** (le
  téléphone n'aime pas qu'on le fasse attendre). Sans sa pose : sa figurine de tous les jours dans une vignette, et
  l'emoji.
- **Chaque pose, une fois, par le moteur d'image** (`mes-reactions-serveur.ts`) : la première fois qu'il la touche
  (environ une minute ; « ✨ Tout préparer » les fait toutes), à partir de sa figurine — même visage, même cadre, fond
  transparent (`background: transparent`). Rangées avec ses expressions (`r-<pose>.webp`). Un verrou par pose, 12 par
  jour au plus.
- **Les gags sont de petites vidéos carrées** (`gag.ts`, 720 px, 3 à 5 s) qui se fabriquent sous ses yeux, comme les
  mèmes : 💨 le prout (sa jauge d'intensité, de « Pfft » à « Interminable », fait sa durée, son nuage et le bruit ;
  puis le visage gêné et une goutte de sueur), 🤧 l'éternuement, 😴 elle s'endort (des « Z », un ronflement, le
  réveil en sursaut), 🫢 le hoquet (trois « hic ! »). Les bruits sont fabriqués dans le téléphone : jamais une voix.
  « clikme.fr », discret, dans un coin. Sa vraie tête (sa figurine seule et le visage du gag) se prépare pendant qu'il
  choisit ; en attendant, sa figurine de tous les jours et l'emoji.
- **Osé, jamais vulgaire** : le prout est suggéré (un bruit, un nuage, la gêne) — rien de sexuel, rien de dégoûtant.
- **La mesure** : chaque envoi est noté (`clik_meme_evenement`, `r-<clé>`) ; la page `/admin/humain/memes` montre les
  réactions et les gags envoyés, sur 7 et 30 jours.
- **Les essais** (`scripts/navigateur/mes-reactions.mjs`, 15 vérifications) : la grille, le sticker MDR détouré
  (512 px, fond transparent), « Sérieusement ? » en attendant sa pose, les envois comptés, le prout « Interminable »
  avec sa vraie tête, le hoquet avec l'emoji.

### 9.1 L'idée en une phrase

**C'est la carte de fidélité à 10 cases que tous les commerçants comprennent — mais qu'on a envie de montrer.** Chaque
case est une figurine datée, qu'on ne gagne qu'en venant pendant sa période ; la dixième débloque un vrai cadeau ; et
tout se partage.

On la bâtit sur ce qui existe déjà : la famille du commerce et ses pièces (bronze, argent, or : `lib/direct/famille.ts`),
la visite validée au comptoir (le bon « Servie ✓ », le mot du jour noté au carnet), Ma Maison et « Mes familles ».

### 9.2 Les éditions : 10 par an et par commerce

> **Décidé le 3 novembre 2026 : UNE ÉDITION PAR MOIS**, « plus simple pour se repérer qu'avec des saisons ». Douze
> figurines du mois, chacune avec son thème — 👑 Galette des rois (janvier), 💘 Saint-Valentin, 🌸 Printemps, 🐣 Pâques,
> 💐 Fête des mères, 🎶 Fête de la musique, ☀️ Été, 🏖️ Vacances, 🎒 Rentrée, 🎃 Halloween (octobre), 🍂 Automne
> (novembre), 🎄 Noël (décembre) — et les deux éditions rares : quatorze cases. **La figurine d'or reste à 10** (on peut
> en manquer quatre) : toutes les pages disent « à 10 ». Le tableau ci-dessous est la version d'avant (saisons et
> temps forts), gardé pour l'histoire. Le calcul : `EDITIONS_DATEES` et `TOTAL_COLLECTION` de `collection.ts`.

| | Combien | Comment on la gagne |
|---|---|---|
| Les saisons | 4 (hiver, printemps, été, automne) | une visite validée pendant la saison |
| Les temps forts | 4, choisis par le pro (Noël, Halloween, la fête des mères, son anniversaire…) | une visite validée pendant la semaine du temps fort |
| Les éditions rares | 2, numérotées (« n° 7 / 30 ») | seulement en venant sur un **creux** annoncé par sa figurine (« Il me reste une table à 12 h 30 ») |

- **Une figurine = une visite validée au comptoir.** Pas de visite, pas de figurine : c'est la preuve, et c'est ce qui
  remplit les places.
- **Une édition manquée est manquée** : pas de rattrapage, pas d'achat. C'est la vraie rareté, et la raison de venir à
  chaque période.
- **Le rythme du métier** : 10 par an va à un restaurant ; un cabinet où l'on vient 4 fois par an aurait 6 éditions
  (le pro choisit, 6 à 12).

### 9.3 Ce que la collection débloque

| Palier | Ce qu'il gagne | Qui paie |
|---|---|---|
| 3 figurines | un petit plus (un café, une infusion, une bougie) | le pro, peu de chose |
| 6 figurines | **prévenu en premier** des places libres, et la pièce d'or de sa famille | rien : c'est l'ordre d'envoi des messages |
| **10 / 10** (l'année complète) | **le grand cadeau, choisi par le pro dans une liste courte** : un repas pour 2, une séance offerte, un atelier offert… et **la figurine d'or** numérotée (« Collection complète 2027 · n° 7 ») | le pro : un passage offert pour dix payés, comme une carte de fidélité, mais qui fait revenir sur les creux |

- **La preuve est au comptoir** : le carnet du pro montre « Léa · 9 / 10 · il lui manque l'édition rare » ; il valide
  le cadeau comme un bon (« Servie ✓ »). Pas de capture d'écran à croire sur parole.
- Plus tard, **la collection de la ville** : une figurine chez 10 commerces différents → un cadeau de la ville (payé
  par ClikMe ou par les commerces partenaires). C'est elle qui fait découvrir les voisins.

### 9.4 Où l'on collectionne (remplacé par 9.0 : la page de la famille, et « Ma collection »)

- **Une étagère par commerce** : les 10 places de l'année ; celles qui manquent en silhouette, avec le temps qui reste
  pour l'édition en cours (« Édition automne : encore 12 jours »). Et l'étagère de la ville.
- **Sa vitrine publique**, s'il le veut (`clikme.fr/vitrine/<lien>`) : pour la montrer, la partager.
- **Les échanges, plus tard** : seulement les doubles (9.6), entre deux personnes qui le veulent, gratuitement.

### 9.5 La figurine du client : ce qu'il en fait

Il la reçoit **en cadeau** de son commerce (par exemple en passant à l'or, ou à 6 / 10). Ensuite :

1. **Elle parle, avec sa voix** : son petit mot (« Le meilleur magret de Dax ! ») passe dans la vidéo du commerce,
   validé par le pro. Il partage : « je suis dans la vidéo de mon resto ».
2. **Elle s'habille de ses commerces** : chaque collection complète lui donne l'accessoire du commerce — la toque de
   Chez Bergine, le tablier de Nina, la serviette du Cocon. Sa figurine raconte sa vie de quartier ; un accessoire ne
   se gagne qu'avec la collection complète.
3. **Son socle montre son rang** : bronze, argent, or, selon ses familles.
4. **La figurine du mois** : la plus fidèle de chaque commerce passe dans la vidéo du jour.

Sans photo s'il préfère : sa figurine part alors de son fantôme (son look, déjà choisi).

### 9.6 La boucle virale

1. **Les doubles deviennent des invitations.** Une deuxième visite pendant la même édition donne un double, qui ne sert
   qu'à **l'offrir** : « Léa t'offre l'édition automne de Chez Bergine ». L'ami crée son compte, mais la figurine ne
   rejoint sa vitrine **qu'à sa première visite validée** : on gagne toujours en venant, et le commerce a un nouveau
   client. Léa compte un ami amené (c'est déjà un chemin vers l'or).
2. **Chaque figurine gagnée fait une carte à partager** (format story) : « Chez Bergine · 6 / 10 · il me manque
   l'hiver », avec le lien de la famille.
3. **La vidéo du jour montre les figurines des clients** (avec leur accord) : ils la partagent.
4. **Côté commerçants** : chaque carte porte « Figurines ClikMe — vous êtes commerçant ? », vers la démo. Et la
   collection de la ville emmène les clients chez les voisins inscrits : ceux qui ne le sont pas voient leurs clients
   partir.

À mesurer : le taux de partage, les invitations devenues visites, la complétion de chaque édition, les creux remplis
par les éditions rares.

### 9.7 La fabrication automatique

> **Une première version est faite (novembre 2026)** : au comptoir, depuis le Studio, un selfie et son accord → le
> buste généré sur fond transparent, posé sur le ressort et le socle communs → il valide « C'est moi ». Puis **sa
> figurine du mois** (carte « Ma figurine du mois » de l'accueil du comptoir, ou Ma boutique) : son buste validé
> rhabillé pour l'édition du moment, une tenue par édition. Une seule pose, pas encore de bouche ouverte ; les éditions
> une par une, quand elles arrivent, pas d'avance. Chacune validée reste dans **sa collection** (« 🗂 Ma collection »,
> avec sa date et son histoire), et il peut toujours la remettre dans un petit film. Voir
> `outils/clikme-studio/LISEZ-MOI.md`, §14.

- **Le pro** : 3 photos à l'inscription → un buste neutre (cadrage et fond imposés) → les expressions par retouche de
  ce même buste (bouche ouverte, sourire, clin d'œil) → le calage automatique (corrélation de phase, puis seule la
  bouche reprise, comme pour Nina et Élise à la main) → il valide « c'est moi » → ses 10 éditions générées d'avance,
  par lot (une tenue = une retouche du buste), validées d'un coup. Ressort et socle communs ; la plaque (son nom,
  l'édition) est composée par-dessus.
- **Le client** : « Crée ta figurine » dans Ma Maison → un selfie (adulte, accord coché) ou son fantôme → neutre et
  bouche ouverte → il valide. Son petit mot : un vocal de 10 s enregistré dans l'application.
- **Le coût** : quelques euros par génération ; à compter dans l'abonnement (le nombre d'éditions de la formule à 49 €
  est à fixer).

### 9.8 Les garde-fous

- On ne **gagne** une figurine qu'en venant ; on ne l'**achète** jamais ; aucun tirage au sort payant (règles des jeux
  d'argent et des « loot boxes »).
- **Pas de revente, pas de place de marché** : la valeur est dans les cadeaux et la fierté, pas dans l'argent (sinon,
  spéculation et ennuis juridiques). Les échanges : des doubles, gratuitement.
- La rareté est dite et tenue (les numéros sont vrais).
- Les visages : l'accord écrit du pro ; pour les clients, une case jamais cochée d'avance, et jamais de mineurs. Les
  photos et les vocaux sont effacés après la fabrication ; un contrat de traitement avec le fournisseur d'images.
- Rien ne passe dans la vidéo d'un commerce sans que le pro l'ait validé.

### 9.9 Dans quel ordre le construire

| Étape | Quoi | Dépend de |
|---|---|---|
| 1 | Les figurines gagnées au comptoir (la visite validée) et **Ma vitrine** ; les figurines des premiers pros faites à la main | rien de neuf : le carnet et les bons existent |
| 2 | Les paliers 3 / 6 / 10, réglés par le pro, et le cadeau validé au comptoir | l'étape 1 |
| 3 | Les cartes à partager et **les doubles qui invitent** | l'étape 1 |
| 4 | La fabrication automatique des figurines des pros | le choix d'un générateur d'images, et son coût |
| 5 | La figurine du client (selfie, petit mot, accessoires) | l'étape 4 |
| 6 | Les échanges et la collection de la ville | les étapes 3 et 5 |

En parallèle, le chantier 4 (le numéro WhatsApp) : le vocal du pro et les messages des places libres.
