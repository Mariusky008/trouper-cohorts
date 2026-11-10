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
  resto ! »). Accord clair, réservée aux 15 ans et plus (§ 9.0 tertricies).
- **Elle parle, avec sa voix** : son petit mot devient un avis parlé (« Le meilleur magret de Dax ! », dit par sa
  figurine). C'est la meilleure preuve sociale qui soit, et il la partage. Garde-fous : sa voix à lui, jamais
  fabriquée ; rien ne passe dans la vidéo du commerce sans que le commerçant l'ait validé ; le vocal sert au rendu
  puis il est effacé (c'est une donnée personnelle) ; réservée aux 15 ans et plus. Plus tard : l'envoyer à un ami (un
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
- **Le droit à l'image** → pour le pro, son visage, avec son accord écrit ; pour les clients, un accord clair, et
  15 ans ou plus (§ 9.0 tertricies).
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
(Le 9 novembre, la joie faite d'office l'avait portée à 4 : voir 9.0 undevicies.)

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

### 9.0 octovicies Le lot 2 : le mème du jour au centre, 😂 ❤️ 🔥, les proches d'abord, la carte sobre des commerçants (7 novembre)

- **🔥 Le mème du jour** (`theme-du-jour.ts`) : chaque jour, le même thème pour tout le monde (« Ton excuse pour être
  en retard », « Si tu étais un animal »… 42 thèmes, tous différents pendant six semaines), chacun avec **trois idées
  de réponse** (première personne, sans accord de genre, rien d'alcoolisé). En haut de **« Créer »** (« 🔥 Je réponds
  avec ma figurine » : le studio s'ouvre sur le thème et ses idées ; « 🎲 Surprends-moi ! » y répond aussi, d'après sa
  carte) et de **« Découvrir »**.
- **Poster sa réponse la rend visible par les gens de sa ville** : c'est écrit sur le bouton (« 🔥 Poster ma réponse
  (visible par les gens de Dax) ») — sa décision : l'accord, c'est ce geste. Une réponse par personne et par jour (la
  nouvelle remplace l'ancienne) ; il la retire quand il veut. Rangé sans table : `du-jour/<ville>/<jour>/<id>.json`, et
  la sienne `<habitant>/du-jour/<jour>.json`.
- **Tu postes, puis tu vois** : les réponses des autres n'apparaissent qu'après la sienne (« 👀 Réponds, et tu verras
  les réponses de Dax »). **De vrais chiffres seulement** : « 6 réponses à Dax » ; moins de cinq, « Sois parmi les
  premiers à répondre ».
- **😂 ❤️ 🔥** (`reactions-memes.ts`) sous chaque mème de « Découvrir » (les gens et les commerçants) : une par personne
  (il la change, ou la retire), avec un compte seulement ; il faut un compte. Dans **« Mes mèmes »**, il voit celles
  qu'ont reçues les siens. Rangé sans table : `reac/<mème>/<habitant>.<réaction>.json`.
- **Les proches d'abord** : ceux avec qui il a fait un duo (`<habitant>/proches.json`, noté à chaque duo, des deux
  côtés) et ses amis des Rencontres — leurs mèmes passent en premier (« 👯 Proche », un liseré vert), dans le fil comme
  dans les réponses du jour (la sienne en tête).
- **La carte sobre des commerçants** : la même carte que les gens — « 🍽️ Chez Bergine » (un toucher : sa page, compté),
  sans bandeau ni gros bouton rose. **Le dosage** : un commerçant après chaque groupe de cinq mèmes des gens, jamais
  deux à la suite (un seul tant que les gens sont moins de cinq). Le bandeau « LE MENU DU JOUR » quitte aussi les
  nouvelles vidéos des commerçants (leur nom reste à la fin).
- **Les essais** (`scripts/navigateur/meme-du-jour.mjs`, 20 vérifications) : le thème dans « Créer » et « Découvrir »,
  « Sois parmi les premiers », les réponses cachées avant la sienne, un seul commerçant sur deux, Léa qui répond (le
  thème, ses idées, sa voix, « Poster ma réponse (visible par les gens de Dax) »), « 5 réponses à Dax », la sienne
  d'abord, puis Léa la proche, 😂 puis ❤️ (une seule), 🔥 au commerçant, ❤️ 1 dans « Mes mèmes », sans compte, le retrait.

### 9.0 novovicies Le lot 3 : ClikMe sur l'écran d'accueil, et le mème du jour à 11 h 30 (7 novembre)

- **L'appli** (`app/collection/manifest.webmanifest`) : posée sur l'écran d'accueil depuis `/collection`, elle s'ouvre
  sur `/collection` (et plus sur clikme.fr), sous le nom « ClikMe », sans la barre du navigateur, avec le signe ClikMe.
- **L'installer** (`lib/direct/appli-collection.ts`, `app/collection/mon-telephone.tsx`) :
  - **iPhone** : Safari n'a pas de bouton « Installer ». « 📲 Installer » montre les trois gestes (Partager, « Sur
    l'écran d'accueil », Ajouter).
  - **Android** : c'est la vraie proposition du téléphone, gardée pour le moment où il touche « Installer ».
  - **Dans Instagram, TikTok…** : rien ne s'installe ; on lui dit d'ouvrir ClikMe dans son navigateur.
- **SA figurine dans l'appli posée, même sans les cookies de Safari** : sur iPhone, l'appli de l'écran d'accueil a ses
  propres cookies, et rien ne garantit qu'elle reçoive ceux de Safari. Avant d'installer, la page se recharge donc sur
  `/collection?appli=<jeton>`, et le manifeste ouvrira cette adresse. À la première ouverture, le jeton pose le cookie
  de sa figurine (`appli-collection-serveur.ts`). Il sert une seule fois et vaut 24 h ; il est rangé dans le seau,
  `appli/<jeton>.json`. Il n'agit que dans l'appli posée, jamais dans un onglet.
- **🔔 Le mème du jour, vers 11 h 30** (`/api/cron/meme-du-jour`) :
  - Le thème est en titre (« 🐶 Si tu étais un animal »), suivi de « Le mème du jour : réponds avec ta figurine 🎭 ».
    Le chiffre de sa ville n'apparaît que s'il est vrai (au moins cinq réponses).
  - Rien n'est envoyé à qui a déjà répondu.
  - L'envoi a lieu une fois par jour (`notif/envois/<jour>.json`).
  - Deux tâches planifiées, car Vercel compte en UTC : 10 h 30 UTC (l'hiver) et 9 h 30 UTC (l'été,
    `meme-du-jour-ete`). Celle qui ne tombe pas entre 11 h et midi à Paris ne fait rien.
  - Un téléphone qui a abandonné son abonnement (404, 410) est effacé.
- **Demandée au bon moment, une fois** :
  - juste après sa réponse au mème du jour : « 🔔 Demain, un nouveau thème. Je te préviens vers 11 h 30 ? » ;
  - à la première ouverture de l'appli posée sur l'iPhone : « 🔔 Dernière étape : le mème du jour ».

  « Plus tard » est retenu une semaine. Un « C'est réglé ! » arrive tout de suite : la preuve que ça marche.
- **Il la coupe dans « Moi »** (« 📱 ClikMe sur ton téléphone ») : l'appli posée ou pas (« Installer »), et
  l'interrupteur du mème du jour. Sur iPhone, une notification n'existe que dans l'appli posée, et l'écran le dit.
- **Rangé sans table** : `notif/abonnes/<habitant>.json` (sa ville, cinq téléphones au plus). Ce sont les clés VAPID des
  salons (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_APP_EMAIL`) ; sans elles, rien ne part et
  rien ne casse. Le service worker (`public/collection-sw.js`) n'affiche que les notifications, sans aucun cache. Il est
  à la racine pour que sa portée couvre `/collection` elle-même.
- **Les essais** (`scripts/navigateur/appli-notif.mjs`, 29 vérifications) passent par un faux service de notifications
  (`PUSH_ESSAI_ORIGINE`), et chaque notification est déchiffrée comme le ferait le téléphone. Ils couvrent :
  - Nina sur iPhone : rien avant sa réponse, puis « Installer », le rechargement avec son jeton, les trois gestes, et
    le manifeste qui ouvre l'appli sur son jeton ;
  - l'appli posée, avec ses cookies vides : sa figurine retrouvée, le jeton usé ;
  - « Dernière étape », puis « C'est réglé ! » reçu chiffré et signé ;
  - l'envoi de 11 h 30 : le thème en titre, rien pour Tom (qui a déjà répondu), le téléphone abandonné effacé ;
  - la coupure et le rallumage dans « Moi » ;
  - Android (la vraie proposition) et Instagram.

  En CI, les clés VAPID sont fabriquées à chaque passage ; aucune n'est écrite dans le dépôt.

### 9.0 tricies 📍 Autour de moi : le serveur (lot A, 7 novembre)

La maquette validée par le propriétaire, les règles et le plan complet sont dans `docs/reprise.md`, section 4. Le
serveur :
- **Deux sortes de lieux** :
  - les commerces clients, avec leurs coordonnées (`human_vitrine_sites.latitude/longitude`) ;
  - les zones « Ailleurs » : la position de celui qui dépose est arrondie à une maille d'environ 500 m, et seule la
    zone est gardée, avec un petit nom libre. Une adresse est refusée.
- **Qui le voit** : tout le monde, ses proches, ou lui seul. C'est écrit dans le nom du fichier, si bien qu'une liste
  du dossier suffit pour compter ce que chacun peut voir.
- **Au plus trois mèmes** par personne, par lieu et par jour. Un mème n'est posé qu'à un endroit : le reposer
  ailleurs le déplace.
- **Le petit mot** : ni gros mot, ni alcool.
- **Les dépôts refusés** : un duo, un mème signalé, le mème d'un autre.
- **Les réponses** : une réponse (`reponseA`) vise un mème du même lieu, visible par celui qui répond ; les deux sont
  liés.
- **Le profil** se demande par une clé publique, jamais par l'identifiant de l'habitant. Il ne montre que les mèmes
  « tout le monde » et leurs lieux, jamais une position.
- Les essais : `scripts/essai-autour-route.mjs` (29 vérifications, avec la réponse dans une zone ci-dessous).
- **Répondre dans une zone « Ailleurs »** (ajouté avec le lot B) : on peut déposer dans une zone **qui a déjà des
  mèmes**, par son identifiant, sans donner sa position. Une zone vide se crée seulement depuis sa position.
- **Le petit nom d'une zone** : celui de son **premier** mème (le plus ancien) **que l'on peut voir**. Y répondre ne la
  renomme pas, et celui qui ne voit pas une soirée « pour les proches » ne voit pas non plus son petit nom.

### 9.0 untricies 📍 Autour de moi : l'écran (lot B, 7 novembre)

**« Autour » prend la place de « Rencontres » dans le menu du bas** ; le titre de l'écran est « Autour de moi »
(`src/app/collection/autour.tsx`, `autour-carte.tsx` ; l'adresse `#autour`).

« Rencontres » quitte le menu mais **reste à son adresse** (`#rencontre`). Le lien d'invitation d'un ami (`?ami=`) y
mène toujours, et sa figurine du mois s'y mérite encore. À décider plus tard : l'effacer, ou lui donner une entrée.

- **La carte** :
  - MapLibre GL (`maplibre-gl` 6.14.0, version exacte), chargé seulement à l'ouverture de l'onglet ;
  - les tuiles OpenFreeMap (style « liberty »), repeintes en sombre aux couleurs de ClikMe une fois chargées ;
  - les commerces : une goutte avec le visage d'une figurine et le nombre de mèmes ;
  - les zones « Ailleurs » : un cercle jaune en pointillés, son petit nom ;
  - « ◎ Ma position » : un point blanc, vu de lui seul, jamais envoyé tel quel ;
  - la recherche d'un lieu, « ＋ Déposer mon mème », et en bas « Les derniers mèmes autour de toi ».
- **Sans carte** (pas de réseau, pas de WebGL, style refusé ou trop lent, 12 s) : la liste des lieux à la place.
- **Sans figurine** (donc sans ville) : on l'invite à créer sa figurine.
- **Le lieu** : son nom, « n mèmes déposés ici », l'éventail des trois derniers, « ▶ Découvrir », « La conversation du
  moment », « ＋ Déposer mon mème ici ». Ni étoiles, ni avis, ni horaires.
- **Le swipe** :
  - une grande carte (la vidéo du mème, muette, en boucle) et la suivante dessous ;
  - glisser à droite (100 px) = J'aime, la réaction ❤️ de toujours ; à gauche = passer ;
  - les boutons ✕ Passer, ❤ J'aime, « Répondre avec ma figurine », Partager ;
  - le prénom mène au profil ; « ↳ Réponse à … » quand c'en est une ; ⋯ pour signaler (deux touchers).
- **Déposer, ou répondre** (un seul écran) :
  - 1 · Où ? : le lieu, les commerces les plus proches, ou « ✨ Ailleurs » et un petit nom ;
  - 2 · Quel mème ? : un des siens en vidéo (pas un duo), ou « ＋ Nouveau mème », qui ouvre « Créer » ;
  - 3 · Un petit mot, si on veut ; 4 · Qui le voit ? ;
  - puis « C'est publié ! », « Voir mon mème », « Partager hors de ClikMe ».
- **Le profil** : sa figurine sur le rose, ses lieux, ses mèmes « tout le monde » ; jamais sa position.
- **Le « worker » de MapLibre** : la bibliothèque le cherche à côté d'elle, ce que le paquetage de l'appli (webpack) ne
  sait pas faire. On lui donne l'adresse du fichier, que webpack sert tel quel :
  `setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href)`.
- Les essais : `scripts/navigateur/autour.mjs` (35 vérifications).
  - L'essai sert lui-même un style sans tuiles : le réseau de la CI ne sort pas.
  - Il refuse les tuiles pour vérifier la liste de secours.
  - Il lance Chromium avec `--enable-unsafe-swiftshader` (WebGL sans carte graphique).

### 9.0 duotricies « Rencontres » effacé (7 novembre)

Sa réponse à « l'effacer, ou lui garder une entrée ailleurs ? » (après qu'« Autour » a pris sa place dans le menu) :
**effacer**. Ce qui est parti :

- l'onglet et ses adresses : `#rencontre` et `#rencontres` ouvrent « Créer », comme le lien d'un ami (`?ami=<code>`) ;
- l'épisode du jour (Pablito, les commerçants et leur métier, les personnages imaginaires, les amis et leurs thèmes, les
  membres de la ville et la file des membres), le théâtre en BD, les impressions entre clients, les cartes souvenirs,
  la figurine relookée d'un épisode, « Fais-en un mème » d'un épisode, « Et toi ? » ;
- le petit mot du jour (il annonçait la rencontre du jour ; il n'était plus affiché depuis le 6 novembre) ;
- les fichiers : `app/collection/rencontre.tsx`, `app/api/direct/rencontre/`, `lib/direct/rencontre.ts`,
  `rencontre-serveur.ts`, `scenarios.ts`, `reseau.ts` ;
- les voix de Pablito sur « Rencontres » (`rencontres-1` à `-5`), et les bulles 5 à 7 de son accueil (`accueil-5` à
  `-7`), qui en parlaient ; la dernière bulle (« Allez, à toi de jouer ! ») garde son enregistrement (`accueil-8`,
  donné par la bulle elle-même).

Ce qui en dépendait, et ce qu'il devient :

- **Sa figurine du mois** se mérite en **10 jours sur ClikMe dans le mois** (sa présence, notée à chaque visite de la
  page, `presence.json`, gardée sur 62 jours : `joursDePresence`, `etapes-serveur.ts`) — c'étaient 10 jours de
  rencontres. Sa progression et sa révélation (`MaFigurineDuMois`) sont dans **« Moi »**, sous sa carte ; `#mois`,
  `#edition`, `#ou-gagner` y mènent ; « 🔥 Le mème du jour › » remplace « 💬 Ma rencontre du jour › ». L'écran dit
  « 3/10 jours sur ClikMe ».
- **Ses premiers pas** : « Ta première rencontre », « Un ami qui te rejoint », « Rencontrer un membre », « 5 épisodes »
  ne sont plus proposés ; ceux qu'il avait franchis comptent encore dans ses cadeaux (`anciennes`) : il ne perd rien.
- **La question du jour** et **« Ce que ta figurine sait de toi »** restent, dans « Moi ». Ce qu'il dit de lui est
  rangé par `ce-qu-il-a-dit-serveur.ts`, toujours dans `<habitant>/rencontres.json` (`dit`), pour ne rien perdre.
- **Ses proches** (`prochesDe`) lisent toujours ses amis d'alors (`rencontres.json`, `amis`) : rien n'y est plus écrit.
- Les données déjà rangées (rencontres, cartes souvenirs, invitations, file des membres) ne sont pas effacées.
- Les essais : `scripts/navigateur/personnage.mjs` remplace `personnage-rencontre.mjs` (la carte, la question du jour,
  ce qu'elle sait, retrouver sa figurine ; et « Rencontres » n'existe plus : ni menu, ni adresse, ni route) ;
  `ma-figurine.mjs` (sa figurine du mois dans « Moi », sur des jours de présence), `famille-page.mjs` et `autour.mjs`
  ajustés.

### 9.0 tertricies 🔞 La figurine, réservée aux 15 ans et plus (7 novembre)

Rien ne demandait l'âge, alors qu'« Autour » montre des mèmes avec un visage, rattachés à des lieux de la ville. Sa
décision, après qu'on lui a présenté trois seuils (18 ans pour tout ; 15 ans pour la figurine et 18 ans pour la ville ;
15 ans pour tout) : **15 ans pour tout** — le minimum légal pour consentir seul à l'usage de ses données (la majorité
numérique, en France), en sachant que des jeunes de 15 ans poseront alors leur visage sur la carte de la ville. Un seul
nombre, `AGE_MINIMUM` (`lib/direct/ma-figurine.ts`), et tous les textes en découlent.

- **À la création** : une seconde case, jamais cochée d'avance, sous « C'est bien moi sur la photo » : « J'ai 15 ans
  ou plus. » Sans elle, le bouton reste gris, et la route refuse la photo (`ERREUR_AGE`) — sans compte, aucun compte
  n'est ouvert. Ce qu'il a déclaré est noté dans `<habitant>/majeur.json` (`{ le, age: 15 }`).
- **Ceux qui avaient déjà leur figurine** : le serveur refuse de montrer un de leurs mèmes dans la ville tant qu'ils
  n'ont pas déclaré leur âge — déposer dans « Autour » (`deposer`, `autour-serveur.ts`), le montrer dans « Découvrir »
  ou poster sa réponse au mème du jour (`rendreMemePublic`) : réponse 403 avec `age: true` (`SANS_AGE`). L'écran pose
  alors la question, une fois (`demanderSonAge`, `app/collection/age.ts`) : « Tu as 15 ans ou plus ? » ; s'il dit oui,
  c'est noté (`{ action: "majeur" }`, route `ma-figurine`) et son geste repart tout seul ; sinon, « Réservé aux 15 ans
  et plus. » Retirer un mème de la ville reste toujours possible.
- **Ce qui ne change pas** : ses mèmes envoyés à ceux qu'il choisit (un lien, un duo) ne demandent rien de plus.
- **C'est une déclaration**, pas une vérification : personne ne vérifie un âge sur une simple case. Elle engage celui qui
  coche, et elle prouve qu'on a posé la question.
- Les essais : `essai-autour-route.mjs` (sans son âge, refusé ; déclaré, noté ; sans compte, rien à noter) ;
  `ma-figurine.mjs` (la case, la route qui refuse sans elle, son âge noté, et la question à une ancienne figurine avant
  « Découvrir ») ; `autour.mjs` (la question au premier dépôt de Sam) ; `meme-du-jour.mjs` (la question quand Léa poste
  sa réponse).

### 9.0 quatertricies 📍 Répondre « avec sa tête », depuis « Autour » (7 novembre)

Le premier point de la suite d'« Autour ». Avant, on ne répondait (ou ne déposait) qu'avec un mème déjà fait ;
« ＋ Nouveau mème » ouvrait « Créer », et on perdait son dépôt en route.

- Dans le dépôt, **« ＋ Nouveau mème · avec ma tête »** garde son dépôt de côté (le lieu, le mème auquel il répond, son
  petit mot, qui le voit : `app/collection/depot-autour.ts`) et ouvre le studio **pour ce lieu** (`versLeStudio`, son
  champ `autour`).
- Le studio le dit en haut : « ↩️ Ta réponse pour 🍽️ Le Petit Bistrot » (ou « 📍 Ton mème pour … »), avec « Choisis ta
  tête, écris ta phrase ou « 🎲 Surprends-moi ! » ». Il fait son mème comme d'habitude (sa tête, sa voix, sa phrase).
  « ✕ » le libère (son dépôt est oublié). Un duo en cours est laissé : un duo ne va pas sur la carte.
- Son mème prêt, **« 📍 Répondre avec ce mème · Le Petit Bistrot › »** (ou « 📍 Le déposer ») remplace « 🌍 Le montrer
  aussi dans Découvrir » : un toucher, et « Autour » rouvre son dépôt, **le nouveau mème déjà choisi**, son petit mot et
  « qui le voit » gardés. Il n'a plus qu'à publier (l'âge, les trois par lieu et par jour : comme avant).
- Si « Autour » n'était pas encore ouvert (une page rechargée), le dépôt attend le temps de la visite
  (`sessionStorage`).
- L'essai : `scripts/navigateur/autour.mjs` — Léa répond au Petit Bistrot avec un mème qu'elle fait au studio, son
  petit mot et « Mes proches » gardés, puis publié (43 vérifications).

### 9.0 quintricies 👯 Le profil d'« Autour » : « Ajouter en proche » et « Lui répondre » (7 novembre)

Le troisième point de la suite d'« Autour » (le deuxième, les regroupements « +9 » sur la carte, attend qu'il y ait
beaucoup de lieux : le propriétaire, le 7 novembre). Sous la figurine de quelqu'un, sur son profil :

- **« 👯 Ajouter en proche »** : il entre dans SES proches (`<habitant>/proches.json`, par la clé du profil, jamais
  l'identifiant : `devenirProche`, `autour-serveur.ts`). Le bouton devient « ✓ Dans tes proches » ; un toucher de plus
  l'en retire (de ses proches, et de ses amis des Rencontres d'avant s'il y était). La note dit ce que ça fait : « Léa
  voit ce que tu déposes pour « Mes proches » ».
- **« ↩️ Lui répondre »** : le dépôt s'ouvre en réponse à son dernier mème (« pour tout le monde »), là où il l'a
  déposé ; avec « ＋ Nouveau mème · avec ma tête » (9.0 quatertricies) s'il veut le faire exprès.
- Sans compte, ou sur son propre profil, ni l'un ni l'autre.

**La règle de « Mes proches » change, pour que s'ajouter ne donne rien à voir.** Avant, un mème déposé pour « Mes
proches » se montrait à quiconque avait son auteur dans SES proches à lui : avec un bouton « Ajouter en proche » sur
chaque profil, n'importe qui aurait vu les soirées de n'importe qui. Désormais, c'est **la liste de l'auteur** qui
compte : un mème « Mes proches » se montre à son auteur et à ceux que L'AUTEUR a dans ses proches (ses duos, ceux qu'il
a ajoutés, ses amis des Rencontres d'avant). Pour les duos, rien ne change (ils sont proches l'un de l'autre). « Ses
proches d'abord », dans « Découvrir » et le swipe, reste sa liste à lui (un ordre, pas un accès).

Les essais : `essai-autour-route.mjs` (Sam ajoute Léa : il ne voit pas sa soirée ; Léa ajoute Sam : il la voit ; pas
soi-même, pas un profil inconnu, pas sans compte ; retirés, plus rien) ; `autour.mjs` (le profil : ajouter, retirer,
« Lui répondre »).

### 9.0 sextricies 🖼️ La photo du lieu, en haut de sa page (7 novembre)

Le quatrième point de la suite d'« Autour » (la maquette en montrait une). En haut de la page d'un commerce, sur toute la
largeur, sa photo — choisie comme pour sa page de famille (`app/f/[slug]`) : **sa couverture ClikMe** (faite, et s'il
n'est pas revenu à l'originale), sinon **sa devanture**, **sa salle**, ou **la première photo de sa fiche Google**
(`photoDuCommerce`, `autour-serveur.ts`). Une adresse https seulement : jamais une photo à lui en `data:`, bien trop
lourde ici. Le nom, l'activité et le nombre de mèmes passent dessus, sur un dégradé.

- Seulement sur la page du lieu (`memesDuLieu`), pas sur la carte : la carte reste légère.
- Sans photo (une zone « Ailleurs », un commerce sans photo), ou si elle ne se charge pas : la page garde son fond, avec
  son emoji en grand (🍽️, 🥖, ✨…).
- Les essais : `essai-autour-route.mjs` (la couverture d'abord ; revenu à l'originale : la devanture ; puis Google ;
  sinon rien ; pas de photo pour une zone ni sur la carte) ; `autour.mjs` (la photo du Petit Bistrot sur toute la
  largeur ; la boulangerie, sans photo : son emoji).

### 9.0 septtricies 🛡️ La modération des mèmes signalés (7 novembre)

Le cinquième point de la suite d'« Autour » commence par la modération (avant « on a répondu à ton mème » et la
réponse du commerçant depuis son comptoir). Un mème signalé (« ⋯ Signaler ») disparaît aussitôt, partout ; il attend sur
la page admin **`/admin/humain/figurines-clients`**, section « Mèmes signalés » (`lib/direct/moderation-serveur.ts`) :

- on le voit **tel que les gens l'ont vu** : sa vidéo, ses mots, sa voix, son auteur, et **où il était montré** — un lieu
  d'« Autour » (son nom, et qui pouvait le voir), avec **le petit mot du dépôt** (« Son petit mot : … »), « Découvrir »
  (sa ville), les réponses au mème du jour ; ou « envoyé à quelqu'un (un lien) » ;
- **« Remettre »** (signalé à tort) : il revient là où il était ;
- **« Retirer pour de bon »** : il quitte aussi la carte (son dépôt effacé : `retirerDepot`), « Découvrir » et le mème du
  jour (ses fiches effacées : `retirerDeLaVille`) — avant, il restait caché, mais compté.
- **La carte ne compte plus un mème signalé** (`memesCaches`) : avant, un lieu affichait « 3 » pour deux mèmes visibles.

L'essai : `autour.mjs`, avec une vraie session d'administration (le jeton « faux-admin » du faux Supabase, l'administrateur
dans `admins`) — le croissant de Hugo, signalé : la boulangerie compte 0 ; la page le montre (vidéo, mots, « Autour :
Boulangerie du Marché (pour tout le monde) ») ; retiré pour de bon, son dépôt quitte la carte ; un mème de Léa signalé à
tort, remis, revient au Petit Bistrot.

### 9.0 octotricies ↩️ « Hugo t'a répondu ! » : la notification des réponses (7 novembre)

La suite du point 5 d'« Autour ». Quand quelqu'un répond à un de ses mèmes — dans « Autour » (un dépôt avec
`reponseA`) ou en duo —, l'auteur reçoit une notification, s'il a les notifications de ClikMe :

- **« ↩️ Hugo t'a répondu ! »** — « 🍽️ Le Petit Bistrot · avec sa figurine. Viens voir 👀 » (ou « ✨ Soirée chez
  Max ») ; le toucher ouvre « Autour » **sur sa réponse** (`/collection?autour=<lieu>&meme=<id>#autour` : le swipe du
  lieu, à cette carte ; l'adresse redevient propre).
- **« ↩️ Hugo t'a répondu en duo ! »** — « Avec sa figurine, à côté de la tienne » ; le toucher ouvre « Mes mèmes ».
- **Un interrupteur à part dans « Moi »** : « Quand on répond à tes mèmes », sous « Le mème du jour, vers 11 h 30 ».
  **Allumé d'office pour tous ceux qui ont les notifications, anciens abonnés compris** (la décision du propriétaire,
  le 7 novembre) ; chacun le coupe (`reponses: false` dans sa fiche `notif/abonnes/<habitant>.json`), et le mème du jour
  reste allumé.
- Jamais à soi-même ; **jamais pour une réponse qu'il ne pourrait pas voir** (« Moi seul » ; « Mes proches » s'il n'en
  est pas) ; **dix par jour au plus** (`notif/reponses/<habitant>/<jour>.json`).
- L'envoi part après la réponse (`after`), jamais bloquant : `prevenirDUneReponse`, `appli-collection-serveur.ts`
  (le même envoi chiffré que le mème du jour ; un téléphone abandonné est effacé).

Les essais : `essai-autour-route.mjs` (Léa abonnée, avec un faux téléphone : Hugo lui répond au Petit Bistrot, puis
dans sa soirée — deux notifications, déchiffrées ; coupé : plus rien ; une réponse « Moi seul » : rien) ;
`ma-figurine.mjs` (la réponse en duo) ; `autour.mjs` (le toucher sur la notification ouvre la réponse) ;
`appli-notif.mjs` (l'interrupteur dans « Moi » : allumé d'office, coupé, rallumé). Les outils du faux téléphone
(`telephone`, `recus`) sont dans `scripts/navigateur/commun.mjs`.

### 9.0 novotricies 🏛️ Les lieux publics nommés (7 novembre)

Le point 6 d'« Autour ». Les Arènes, les Halles, la Fontaine Chaude… : des lieux de la ville où l'on dépose son mème
**comme chez un commerçant** (sur la carte, une goutte avec son emoji ; sa page ; le swipe ; les réponses ; les trois
par lieu et par jour). Type `public`, identifiant `p-<le-nom>` (`idLieuPublic`, `lib/direct/autour.ts`).

- **Leur position n'est jamais écrite de mémoire** : une position fausse mettrait les mèmes au mauvais endroit. L'admin
  les place lui-même, sur la vraie carte : **`/admin/humain/lieux-publics`** (un lien depuis l'admin) — un nom (des noms
  sont suggérés pour Dax : les Arènes, les Halles, la Fontaine Chaude, les berges de l'Adour, le parc Théodore-Denis, la
  cathédrale ; `LIEUX_PUBLICS_SUGGERES`), un emoji, **un toucher sur la carte** (zoomer bien), « 📍 Placer ce lieu ». Les
  commerces sont des points gris, pour se repérer ; le même nom le déplace ; « Retirer » le fait quitter la carte (les
  mèmes qui y étaient ne se montrent plus). Sans carte, on tape la latitude et la longitude.
- Rangés dans le seau, `lieux-publics/<ville>.json` (`placerLieuPublic`, `retirerLieuPublic`, `lieuxPublicsDe`,
  `autour-serveur.ts`) ; la route `/api/admin/direct/lieux-publics`, réservée à l'admin.
- Côté « Autour » : `lieuxFixesDe` = les commerces + les lieux publics, partout où l'on cherchait un commerce (la carte,
  le dépôt, la page du lieu, le profil, la modération, la notification de réponse). Sa page dit « Un lieu de la ville »,
  sans photo (son emoji en grand) ; « Où ? » le propose parmi les lieux tout près.

**À faire par le propriétaire** : placer les lieux de Dax sur `/admin/humain/lieux-publics` (rien n'est placé d'avance).

Les essais : `essai-autour-route.mjs` (l'admin seulement ; « Les Arènes » placé, sur la carte avec son emoji ; Léa y
dépose ; un lieu public inconnu : refusé ; retiré : il quitte la carte) ; `autour.mjs` (la page admin : les noms
suggérés, un toucher sur la carte donne la position, placé, puis retiré).

### 9.0 decitricies 🗂️ « Créer » refait : le studio et ses tiroirs (7 novembre)

Un ami du propriétaire a essayé l'appli : « l'onglet Créer est très mal architecturé ». Il faisait 2 200 px de haut sur
un téléphone : le titre, la figurine du mois, le mème du jour, les huit réactions et les gags, PUIS la figurine, ses
visages, « Fais-la parler », les premiers pas et « Ne perds jamais ta figurine ». Son idée, « Studio & Tiroirs » :
réduire la charge cognitive, supprimer le défilement. Ce qui a changé (`StudioMoi`, `ma-figurine.tsx`) :

- **Sa figurine reste en vue** (collée sous la barre du haut quand la page descend ; elle rapetisse pendant qu'il écrit),
  avec **trois gestes** dessous, qui ouvrent chacun leur **tiroir** par-dessus la page (un toucher ailleurs ou « Échap »
  le referme) :
  - **Visage** : ses looks (ses figurines du mois) et ses huit visages, en une ligne qui défile ; le bouton montre son
    visage du moment, et un point qui tourne quand un visage ou un look se prépare ;
  - **Animer** : « 🕺 Danser » (en musique, et dans son mème) et **les gags** (le prout, l'éternuement, elle s'endort, le
    hoquet) — un gag ouvre l'onglet « Réactions & gags », déjà choisi (`EVT_GAG`, `mes-reactions.tsx`) ;
  - **La refaire** (s'il lui en reste aujourd'hui).
- **Deux onglets** : **« 💬 Fais-la parler »** (le mème du jour en une ligne, « 🔥 Je réponds » à droite — caché quand son
  mème est déjà pour quelque chose : un duo, le thème, un lieu d'« Autour » ; puis son texte, « 🎲 Surprends-moi ! », sa
  voix, « Écouter », « Créer mon mème ») et **« ⚡ Réactions & gags »** (`MesReactions`). L'adresse choisit l'onglet :
  `#reactions` ouvre le second, `#jour` le premier (`EVT_ANCRE`, envoyé par `ma-collection.tsx`).
- **Son mème monte dans une feuille**, en bas de l'écran (`Feuille`) : il s'y fabrique sous ses yeux, puis « **Ton mème
  est prêt ✅** » — la vidéo, « 📲 Partager », « 🔗 Le lien » (copié), « ⬇️ La vidéo », et le geste qui compte :
  **« 🌍 Poster sur le fil de Dax »** (c'est « Découvrir », dit dessous ; l'accord est toujours demandé), ou sa réponse
  au mème du jour, ou « 📍 Le déposer » pour « Autour ». Fermée, « ✅ Ton mème est prêt · le revoir » la rouvre.
- **En bas, repliés** : sa figurine du mois (une ligne) et « 👣 Tes premiers pas ».
- **« Ne perds jamais ta figurine »** est devenu **un cadenas doré, « 🔒 Sauvegarder »**, en haut à côté de son prénom,
  tant que son adresse ne la protège pas : il ouvre la même feuille, avec l'adresse et le code (`ProtegerFigurine`).
- Plus de grand titre « Fais-la parler. » : l'onglet le dit. Sur un ordinateur, sa figurine est à gauche (collée), le
  reste à droite.

Les essais : `ma-figurine.mjs` (les gestes, les tiroirs fermés puis ouverts — huit visages, la danse et quatre gags —,
un toucher ailleurs les ferme ; deux onglets ; la page descend, sa figurine reste juste sous la barre ; le cadenas doré
ouvre « Ne perds jamais ta figurine » ; son mème monte dans la feuille, « Poster sur le fil de Dax » ; fermée, « le
revoir » la rouvre ; « Échap » la ferme) ; `mes-reactions.mjs` (`#reactions` ouvre l'onglet ; « Animer » → « Le prout »
ouvre l'onglet, le prout choisi).

### 9.0 undecitricies 🧹 Le retour du 8 novembre, lot A : alléger, effacer, la bonne tête, de vraies fenêtres

Le propriétaire a repris l'appli page par page (huit points). Le lot A :

- **« Créer » s'allège encore** : « 👣 Tes premiers pas » est parti (« on peut supprimer cette section maintenant ») ;
  la carte du **mème du jour** aussi (« ça parasite la page, et on l'a déjà dans Découvrir ») — elle vit dans
  « Découvrir », `#jour` y mène (la notification de 11 h 30 aussi), avec l'invitation « je te préviens demain ? ».
  (Le studio lit seulement la ville du jour, pour « Poster sur le fil de Dax ».)
- **🗑️ Effacer un mème** (« Mes mèmes ») : une poubelle sur chacun des siens ; une fenêtre le lui redemande ; il
  quitte tout — « Découvrir », le mème du jour, la carte d'« Autour » —, son lien ne mène plus à rien, sa vidéo et sa
  voix sont effacées du seau (`effacerMonMeme`, `moderation-serveur.ts` ; la route `ma-figurine`, `action: "effacer"`,
  seulement le sien).
- **🎭 La bonne tête sur chaque vignette** (« j'ai toujours la même tête sur tous mes mèmes ») : son look, sinon le
  visage qu'il avait choisi pour ce mème (la joie, la colère…), sinon sa figurine (`apercuMeme`, donc « Mes mèmes »,
  « Découvrir » et « Autour » à la fois).
- **🪟 De vraies fenêtres** (« plein de boîtes d'information en haut des écrans, pas designées ») : `window.confirm`
  (« www.clikme.fr indique… ») est remplacé partout dans l'appli par une fenêtre de ClikMe, en bas de l'écran
  (`fenetre.tsx` : `demanderOui`, `accordPublic`, `signalerOui`) — l'accord pour « Découvrir », l'âge, signaler,
  effacer. Les essais y répondent avec `repondreFenetre` (`scripts/navigateur/commun.mjs`). (Restent celles de
  l'admin, qui ne sont pas l'appli.)

Les essais : `ma-figurine.mjs` (plus de premiers pas ; la vignette montre la joie ; Hugo efface son duo — la fenêtre,
la vidéo effacée, le lien en 404 — et Léa ne peut pas effacer celui d'un autre ; l'accord et l'âge dans les fenêtres),
`meme-du-jour.mjs` (« Créer » ne répète plus le mème du jour ; `#jour` ouvre « Découvrir »), `appli-notif.mjs`,
`autour.mjs`, `personnage.mjs`.

### 9.0 duodecitricies 📍 Le retour du 8 novembre, lot B : « Autour »

Ses mots : « j'ai tapé “la gare”, la carte n'a pas bougé » ; « quand je clique sur un de mes mèmes, il faut que ce
soit beaucoup plus clair qu'on a choisi ce mème » ; « je mets “chez moi” et ça marche, mais ça n'indique aucun lieu » ;
et la page du lieu, « vraiment très mauvais UX : il faut qu'elle soit complètement wow et addictive, qu'on veuille y
revenir et découvrir plus de mèmes du lieu ».

- **🔎 Chercher n'importe quel endroit** : la recherche trouve toujours les lieux de ClikMe (« Sur ClikMe »), et
  maintenant les endroits de la ville (« Sur la carte » : la gare, une rue, un parc). Un toucher : la carte y vole, une
  épingle à son nom, et en bas « 📍 Gare de Dax · ＋ Déposer ici ». Le géocodeur : Photon (OpenStreetMap, komoot),
  gratuit et sans clé, appelé par le serveur (`lib/direct/geocodeur-serveur.ts`, `GET /api/direct/autour?chercher=`),
  penché vers le centre de la carte et gardé à 25 km ; `GEOCODEUR_URL` le remplace (les essais : un faux, dans le faux
  Supabase — rien ne part chez komoot). Y déposer en fait une **zone** « quelque part par ici » (environ 500 m), au nom
  de l'endroit (jamais un numéro de rue) : jamais l'endroit exact.
- **📍 Le lieu refait** : en haut, sa photo, son nom, ses chiffres (les mèmes, les ❤️, la distance) et les visages de
  ceux qui y ont déposé ; **« à la une »** : son mème le plus aimé (sinon le dernier), qui joue tout de suite, en grand ;
  « ▶ Découvrir les N mèmes » ; la conversation du moment ; **le mur** de tous ses mèmes (un toucher : le swipe part de
  celui-là ; « NOUVEAU » sur ceux du jour) ; **« 📍 Juste à côté »** : les lieux voisins qui ont des mèmes, du plus près
  au plus loin. À la fin du swipe, « Tu as tout vu ici 🎉 » propose **« 📍 Continuer »** vers le plus proche : la boucle.
  Sans mème : « ✨ Personne n'a encore déposé de mème ici — le premier, ce sera le tien ? ».
- **＋ Le dépôt, clair** : « Où ? » se cherche aussi (les lieux de ClikMe et les endroits de la ville). Dès qu'il a
  choisi — un lieu, un endroit, ou « Ailleurs, là où je suis » —, une petite carte montre **« 📍 Ton mème apparaîtra
  ici »** (une épingle pour un lieu, le cercle « quelque part par ici » pour une zone), et le bouton dit « Publier · Gare
  de Dax ». **Le mème choisi se voit en grand**, qui joue, « ✓ Ton mème » ; dans la rangée, il est coché et les autres
  pâlissent. « Publier » sans lieu : « Choisis d'abord où le déposer… », et l'écran remonte à « Où ? ».
- Sur la carte, un lieu qui a des mèmes n'est plus jamais caché sous un lieu vide.

Les essais : `essai-autour-route.mjs` (« la gare » : celle de Dax, pas celle de Bordeaux, trop loin ; sans centre de
carte : les deux ; trop court : rien) et `autour.mjs` (le lieu refait, « à la une » qui passe au plus aimé, le mur, « Juste
à côté », « Continuer », le dépôt clair, « la gare » de bout en bout : la carte, l'épingle, le dépôt, la zone).

### 9.0 tredecitricies 👆 Le retour du 8 novembre, lot C : « Découvrir » en swipe

Ses mots : « page “Découvrir”, ça serait mieux un système de swipe plutôt que scroller vers le bas, non ? » — oui.

- **Une page par mème, en plein écran** ; un geste vers le haut, le suivant — comme dans les applis de vidéos. Le
  document « s'aimante » à chaque page (`scroll-snap`, seulement quand « Découvrir » est ouvert), et une page à la
  fois (`scroll-snap-stop`) : on ne saute jamais un mème.
- **La première page : le mème du jour** — son emoji en grand, le thème, les chiffres, « 🔥 Je réponds avec ma
  figurine » ; « ⌃ Glisse vers le haut ». Une fois sa réponse postée : « ✓ Tu as répondu : glisse pour voir les N
  réponses », et ces réponses sont les pages suivantes (« 🔥 le thème » en haut de chacune) ; puis le fil (les gens de
  sa ville, les commerçants dosés) ; à la fin, **« 🎉 Tu as tout vu pour aujourd'hui »** : « 🎭 Faire mon mème »,
  « ⌃ Revoir depuis le début ».
- **Sur chaque page** : le nom en bas à gauche (« 👯 Proche · aujourd'hui · Signaler ») ; à droite, la colonne 😂 ❤️ 🔥
  (avec leurs comptes), « ↩️ Répondre », « 📲 Partager » — au-dessus du menu. La vidéo joue quand on la voit ; un
  toucher, le son. **Le mème en entier** (720 × 1280 : ses mots vont jusqu'aux bords, rogner l'écran les couperait),
  et autour, sa propre image floutée.

L'essai : `meme-du-jour.mjs` (une page par mème, de la hauteur de l'écran ; un geste, une page — pas entre deux ; le
thème en haut des réponses, les réactions au-dessus du menu ; « Tu as tout vu » ; « Revoir depuis le début »). Les
autres essais de « Découvrir » passent sans changement (`meme-commerce`, `ma-figurine`, `appli-notif`).

### 9.0 quattuordecitricies 🎬 Le retour du 8 novembre, lot D : trois façons de le dire

Le constat de l'ami du propriétaire : les mèmes se ressemblent tous, et dans la maquette, les trois propositions ne
changeaient que par le fond — la figurine gardait la même tête. Une interprétation doit changer **le visage, le
cadrage et le graphisme**, en accord avec la phrase ; et **la catégorie est une aide, pas une obligation**.

- **La phrase d'abord.** Dans « Créer » (« 💬 Fais-la parler »), sous sa phrase : « Ce que tu veux exprimer », six
  intentions **facultatives** — 😂 Faire rire, 😍 Émotion, 🙄 Réagir, 💪 Affirmer, 🤫 Sous-entendre, 🎉 Célébrer. Sans
  phrase, un toucher en propose une (« J'ai eu mon permis !!! ») et un autre toucher la suivante ; avec une phrase,
  l'intention ne fait qu'orienter les visages.
- **« ✨ Trois façons de le dire »** : trois vignettes, dessinées par **le même code que la vidéo** (`apercuRendu`,
  dans `meme.ts`) — ce qu'on voit, c'est ce qui partira :
  - 😂 **Humour, la BD** : une case penchée sur une page tramée, la bulle où ses mots s'écrivent au fil de sa voix (le
    mot fort en rose), l'onomatopée qui éclate (« HAHA ! », « PFF… », « BAM ! ») ;
  - 🎭 **Dramatique, le cinéma** : un gros plan sur son visage qui avance doucement, la pénombre, les bandes noires,
    « CLIKME PRÉSENTE », le mot fort en géant quand il le dit, la phrase en sous-titre ;
  - 🌀 **Décalé, l'affiche** : deux couleurs franches en diagonale, sa figurine en polaroïd, ses mots en très gros qui
    tombent un à un, le dernier en étiquette rose.
- **Chacune avec SON visage** de la figurine (parmi les sept : joie, colère, tristesse, euphorie, rire, grimace,
  amour). Les règles (`lib/direct/rendus.ts`) répondent tout de suite ; un petit modèle de texte
  (`rendus-serveur.ts`, les mêmes réglages que « 🎲 Surprends-moi », 60 appels par personne et par jour) les remplace
  après une pause dans la frappe : il ne lit que la phrase, jamais le prénom. « 🎲 Trois autres » fait tourner les
  visages et les couleurs, sans rappeler le modèle.
- **Un toucher choisit** : sa figurine prend ce visage (un visage pas encore fait — « ✨ nouvelle tête » — se fait
  alors, comme dans « Visage »), et son mème prendra ce graphisme. Un autre toucher : le mème simple, comme avant.
  Rien n'est choisi d'office. Celle qu'il a choisie reste à sa place quand « Trois autres » change les deux autres ;
  son choix vaut pour SA phrase (une autre phrase : plus rien de choisi, et le modèle la relit). Les mèmes à deux et
  ceux des commerçants gardent leur propre mise en page.
- **La mesure** : le graphisme choisi est gardé à côté du message (`rendu` : `bd`, `cinema` ou `affiche`).

Les **attitudes** (se tenir la tête, rigoler en douce…) ont suivi le même jour : 9.0 quindecitricies.

L'essai : `trois-rendus.mjs` (la route : trois visages, le modèle ne lit que la phrase, « Trois autres » sans le
modèle ; l'écran : six intentions, trois vignettes toutes différentes, le cinéma et ses bandes noires, « Dramatique »
choisi → la tête de la tristesse et un mème fabriqué en cinéma ; « Célébrer » sans phrase en propose une, puis la
suivante ; une autre phrase, plus rien de choisi ; « Trois autres » garde celle qui est choisie ; un second toucher
pour revenir au mème simple). Les autres essais de « Créer » passent
sans changement (`ma-figurine`, `personnage`, `meme-du-jour`, `autour`…).

### 9.0 quindecitricies 🙆 Ses attitudes : tout son corps parle (8 novembre, l'étape 2)

L'étape 2 des « Trois façons de le dire » : l'ami du propriétaire voulait aussi l'**attitude** (« Humour : elle
rigole en douce ; Dramatique : elle se tient la tête »). Six attitudes (`ATTITUDES`, dans `lib/direct/ma-figurine.ts`),
chacune avec le visage qui va avec :

| | Attitude | À l'écran |
|---|---|---|
| 🤦 | la tête dans les mains | « Oh non » |
| 🤭 | le rire en douce, la main devant la bouche | « En douce » |
| 🙅 | les bras croisés, pas convaincue du tout | « Bras croisés » |
| 🙌 | les poings levés, victorieuse | « Victoire » |
| 🤫 | un doigt sur la bouche, l'air entendu | « Chut » |
| 🫶 | un cœur avec les mains | « Cœur » |

- **Comme un visage** : deux images de SA figurine (bouche fermée, bouche ouverte), faites par le moteur d'image à la
  demande — au premier toucher —, une seule fois, et rangées avec ses visages. La consigne laisse bouger ses bras et
  ses mains, et seulement eux (`GARDER_POSE`) : la même personne, la même tenue, le même cadre, et elle reste entière
  dans l'image. Quand sa main cache sa bouche (le rire en douce, le chut), **une seule image** sert pour parler : un
  appel au moteur de moins. Au plus dix images par figurine, pour les six.
- **Dans le tiroir « Visage »** : ses huit visages, puis une rangée « Son attitude » ; un seul choix pour les deux. Une
  attitude pas encore faite porte l'étincelle ✨ ; touchée, elle se fabrique (« Ta figurine apprend cette attitude… »).
- **Dans « Trois façons de le dire »** : les intentions proposent des attitudes là où elles racontent le mieux — les
  bras (croisés, victoire, cœur) en BD et sur l'affiche, qui la montrent en entier ; le cinéma, en gros plan, garde le
  visage et les mains près de la tête :

  | Intention | 😂 BD | 🎭 Cinéma | 🌀 Affiche |
  |---|---|---|---|
  | Faire rire | 🤭 en douce | 🤦 oh non | 😜 grimace |
  | Émotion | 😄 joie | 😍 amour | 🫶 cœur |
  | Réagir | 🙅 bras croisés | 🤦 oh non | 😜 grimace |
  | Affirmer | 🙌 victoire | 😠 colère | 🤩 euphorie |
  | Sous-entendre | 🤫 chut | 😠 colère | 🙅 bras croisés |
  | Célébrer | 🤩 euphorie | 😍 amour | 🙌 victoire |

  Le petit modèle de texte les connaît aussi, et reçoit en indice celles de l'intention choisie. Une attitude pas encore
  faite : « ✨ nouvelle attitude » sur sa vignette.
- **Partout ailleurs, rien à changer** : une attitude voyage comme un visage (le message la garde à côté de lui, la
  page de celui qui le reçoit, la vidéo du mème). Le guide Pablito et « 🎲 Surprends-moi » restent à leurs sept visages.

L'essai : `attitudes.mjs` (la route : « Faire rire » propose le rire en douce, la tête dans les mains, la grimace, et
la fausse IA connaît les attitudes ; le tiroir : huit visages, puis six attitudes, « Oh non » → son image ; les trois
façons avec leurs attitudes ; la BD choisie → elle rit en douce, gardé à côté du message ; chez celui qui le reçoit,
la vidéo du mème, et sans vidéo, sa figurine qui se tient la tête). La fabrication elle-même (le moteur d'image n'est
pas branché dans les essais) a été vérifiée à part, avec un faux moteur : « Oh non », deux appels (la pose, puis la
bouche) ; « En douce », un seul.

### 9.0 sedecitricies 🎙️ Le talkie-walkie des figurines : l'onglet « Proches » (8 novembre, étapes 1 à 4)

Le propriétaire et son ami, après en avoir parlé (une maquette, puis deux retours) : « laisser un message à quelqu'un,
et la mascotte agit comme traducteur visuel de ce que j'aurais dit oralement ». Pas d'appels : des messages. « Ne
transformez pas ClikMe en une application de messagerie classique » : c'est une petite pièce de théâtre entre deux
figurines. La règle est dans `lib/direct/talkie.ts` ; le serveur, `talkie-serveur.ts` ; la route, `/api/direct/proches` ;
l'écran, `app/collection/proches.tsx`.

- **« Proches » remplace « Moi » dans le menu** ; « Moi » (sa carte, sa figurine du mois, son téléphone, ses réglages)
  est sous son prénom, en haut (`#moi` et `#personnage` y mènent toujours). La pastille de « Proches » : ses messages
  non lus.
- **Ses proches, vivants** : leurs figurines qui respirent, « 2 messages », « Là maintenant », la dernière chose dite,
  « 🎙️ Lui parler ». Ceux qui l'ont ajouté sans qu'il les ait ajoutés : « L'ajouter aussi ». Ceux qu'il a ajoutés et qui
  ne l'ont pas encore fait : « En attente ». **On ne se parle qu'entre proches dans les deux sens** (`ajoute-par.json`
  dit qui l'a ajouté). Ses proches arrivent par le duo, par le profil d'« Autour », et par **son lien**
  (`/collection?proche=<clé>` : « Léa veut être ton proche » → « Ajouter Léa »). Un proche se désigne toujours par sa
  clé de profil, jamais par son identifiant.
- **Lui parler** : il touche le micro et parle naturellement, 20 secondes au plus ; sa figurine l'écoute (sa bouche suit
  le volume de sa voix). Puis **« Ta figurine a compris ça »** : sa voix part à la transcription (`whisper-1`, en
  français, ses phrases datées — `OPENAI_TALKIE_API_KEY` / `OPENAI_TALKIE_BASE_URL` / `OPENAI_TALKIE_MODEL`, sinon la clé
  du moteur d'image), découpée en deux à quatre répliques ; le petit modèle de texte de « Surprends-moi » propose **trois
  têtes** pour chacune (« je suis mort » : le fou rire, l'épuisement, le choc), parmi celles qu'il peut jouer ; sans lui,
  des règles (ses mots). La première est prise d'office, un toucher la change, « Autre » montre toutes les siennes ;
  « ▶ Voir ce que ça donne » ; **rien ne part sans « Envoyer à Léa »**. Rien n'est gardé avant. Sans transcription :
  une seule réplique, sans texte, il choisit la tête. Ses mots passent le filtre (`motInterdit`).
- **Ses premières têtes** (`TETES_DE_DEPART` : la joie, le fou rire, la colère, la tête dans les mains) se font dès son
  premier message, une fois : les propositions ne prennent que celles-ci et celles qu'il a déjà — jamais une tête qui
  ferait fabriquer des images à chaque message. Tant qu'une tête n'est pas faite, elle la joue en bougeant (son émoji).
- **Chez l'autre** : « 🎙️ Zoé t'a parlé ! » (une notification, 30 par jour au plus) ; le lien ouvre leur conversation. Sa
  figurine le dit : sa voix, sa bouche, **la tête de chaque réplique au bon moment** (`onTemps` de `FigurineQuiParle`),
  les sous-titres. **La scène** : leurs deux figurines face à face, celle qui parle s'avance ; ▶ joue ses nouveaux
  messages à la suite ; « Tout rejouer » ; « Juste le son » ; la liste des messages (un toucher en rejoue un) ;
  « Lui répondre ». « ⋯ » : signaler son dernier message (il ne le voit plus ; `moderation/paroles/`), ou le retirer de
  ses proches.
- **« Là maintenant »** : ClikMe ouvert il y a moins de 2 min 30 (la page le dit toutes les minutes tant qu'elle est
  visible). C'est le seul statut — jamais « vu il y a 20 min ». Il le coupe dans « Moi » (« Montrer à mes proches quand
  je suis là »).
- **Le seau** : un fichier par message (`fils/<a>_<b>/m/<instant>-<qui>-<id>.json`, pour qu'aucun ne se perde quand deux
  partent en même temps), sa voix à côté (`fils/<a>_<b>/s/`). 100 messages et 40 transcriptions par jour et par personne.
- **La mesure, chaque semaine** (`/admin/humain/memes`, sans migration : `clik_meme_evenement`, `t-<conversation>-<qui>`,
  écarté des chiffres des mèmes) : messages envoyés, personnes qui ont parlé (et plusieurs fois dans la semaine),
  messages écoutés, conversations (et d'au moins trois échanges), taux de réponse.

**Pas encore** : l'étape 5, WhatsApp (sa figurine part à quelqu'un qui n'a pas ClikMe ; pour répondre, une figurine
provisoire en un selfie) ; le « mode express » (toucher une tête pendant qu'il parle), en option ; « Écrire » dans la
conversation (une voix le dit) ; les appels — pas avant longtemps.

L'essai : `talkie.mjs` (Zoé et Léa proches, Nico d'un seul côté ; la route refuse ceux qui ne se sont pas ajoutés tous
les deux, un son vide, une tête inconnue ; l'onglet, la pastille, les cartes ; la conversation et le message de Léa,
écouté avec sa joie ; un faux micro, la fausse transcription, trois têtes par réplique, la seconde changée ; l'aperçu
joue 🤦 puis 🤩 ; envoyé, rangé, Léa prévenue ; chez Léa, la figurine de Zoé fait chaque tête au bon moment ; « Juste
le son » ; le signalement ; « L'ajouter aussi » ; « Là maintenant » coupé ; le lien de Léa ; la mesure, sans un
identifiant).

### 9.0 septendecitricies 📲 Le talkie-walkie par WhatsApp : l'étape 5 (9 novembre)

Un message de figurine à quelqu'un qui n'a pas ClikMe, et la façon la plus simple de lui répondre (la maquette « L'étape
5 », validée par le propriétaire : « ok on passe au code de l'étape 5 »). Le moteur du bouche-à-oreille : chaque message
est une invitation, faite par un ami. Rien à régler chez Meta : c'est un lien, partagé par le téléphone (`wa.me`).

- **Chez celui qui l'envoie** (« Proches ») : « Quelqu'un n'a pas ClikMe ? — 🎙️ Lui parler par WhatsApp ». Il parle
  comme à un proche (`Parler`, le même écran), « Ta figurine a compris ça », **son prénom** (facultatif : « Karim, Zoé
  t'a laissé un message »), « Envoyer par WhatsApp » ; puis « Ton message est prêt ! » : « L'envoyer sur WhatsApp »
  (le texte « Karim, écoute ce que ma figurine a à te dire 😄 » et le lien), « Copier le lien », « Une autre appli ».
  (Depuis 9.0 duovicies : au téléphone, sa vidéo, et d'autres mots.)
  **Trois liens par jour** (chaque réponse fait fabriquer une figurine).
- **Le lien** (`clikme.fr/t/<id>`, `app/t/[id]`) : l'aperçu dans WhatsApp montre sa figurine et « 🎙️ Zoé t'a laissé un
  message avec sa figurine » (une vraie carte depuis 9.0 duovicies) ; la page la fait parler sans rien installer (sa voix, la tête de chaque réplique au bon
  moment, les sous-titres). Privé (seul qui a le lien le voit), jamais dans les moteurs de recherche, **effacé au bout
  de trente jours** (à la première lecture d'après ; sa voix reste si quelqu'un a répondu : elle ouvre leur
  conversation). Son auteur y voit « C'est ton message » (et le renvoie).
- **Répondre, sans compte** : « Réponds-lui avec ta figurine » → son selfie, son prénom, deux cases obligatoires (« C'est
  bien moi », « 15 ans ou plus ») ; son compte s'ouvre (`ma-figurine`, « photo », avec `lien` : dans la ville de qui
  lui a écrit) et **sa figurine se fabrique PENDANT qu'il dit sa réponse** (son selfie à l'écran, « Ta figurine
  arrive… ») : quand elle est prête, ce qu'il a dit est compris (« Ta figurine a compris ça », ses premières têtes) ;
  « Envoyer à Zoé ». Qui a déjà sa figurine répond tout de suite.
- **Ils deviennent proches** (répondre vaut accord) : le message d'origine ouvre leur conversation, sa réponse suit ;
  « C'est parti ! », « Ne perds jamais ta figurine » (son e-mail, s'il veut : le compte vient après), « Ouvrir ClikMe »
  (leur conversation). L'auteur est prévenu : « 🎙️ Karim t'a répondu avec sa figurine ! — Sa toute première » ; sa
  carte dit « Nouveau, grâce à toi » une semaine. **Cinq personnes au plus** peuvent répondre à un même lien (et
  devenir ses proches) : un lien qui circule trop loin s'arrête là.
- **Le seau** : `liens/<id>.json` et sa voix ; `<habitant>/liens-jour.json` ; `<habitant>/provisoire.json` (son compte
  est né d'un lien) ; `<habitant>/venus.json` (ceux que ses liens ont fait venir).
- **La mesure** (`w-<lien>` dans `clik_meme_evenement`, sur `/admin/humain/memes`) : liens envoyés, ouverts (pas par
  un robot d'aperçu, pas par son auteur), figurines commencées pour répondre, réponses.

**Pas encore, à décider** : effacer au bout de trente jours les comptes nés d'un lien et jamais sauvegardés (ils sont
marqués ; rien ne les efface encore, et l'écran ne le promet pas).

L'essai : `talkie-whatsapp.mjs` (Zoé l'envoie par WhatsApp — le lien prêt, wa.me ; l'aperçu, et le robot qui ne compte
pas ; Karim, sans compte : il écoute 🤦 puis 😂, son selfie, deux cases, son compte à Dax, sa réponse dite pendant que
sa figurine se fabrique, « C'est parti ! » ; proches, leur conversation, Zoé prévenue, « Nouveau, grâce à toi » ; Zoé
devant son propre lien ; Léa, qui a déjà sa figurine ; trois liens par jour ; un lien de plus de trente jours s'efface).

### 9.0 duodevicies 🧭 Le tuto : Pablito fait visiter, sous le logo (9 novembre)

Le propriétaire : « quand je clique sur le logo ClikMe, je devrais avoir plutôt un tuto des pages et des
fonctionnalités ; tous les Pablito qui expliquent par page, comme ça ils peuvent disparaître des pages et libérer un peu
de place » ; puis : « la première fois, juste un message de bienvenue ; pour tout le reste : si tu as besoin de plus
d'infos, tu pourras toujours cliquer ici ». La maquette (le canvas « Le tuto ») et chaque bulle sont validées le même
jour ; sa voix est enregistrée par lui (`public/collection/pablito/tuto-*.mp3`, la liste : `TUTO_ENREGISTRES` dans
`lib/direct/guide.ts` ; toutes enregistrées ; une bulle à venir s'écrirait sans voix).

- **La bienvenue** (`app/collection/tuto.tsx`) : à la toute première arrivée (pas encore de figurine), une seule fois sur
  ce téléphone, trois bulles ; à la troisième, la lumière se pose sur le logo (« Besoin de plus d'infos sur les
  fonctionnalités ? Touche ici, quand tu veux : je te fais visiter. ») ; puis « 📸 Je crée ma figurine ».
- **Plus aucune fenêtre dans les pages** : l'accueil de « Créer », « Découvrir », « Mes mèmes » et les deux de « Moi »
  sont partis, avec leurs boutons « Pablito t'explique » (« Lancer le test » et « Créer ma figurine » restent dans la
  page de « Moi »). Restent sa voix pendant la fabrication de la figurine et les questions du test : elles accompagnent
  ce qu'on fait.
- **Le logo ouvre la visite** : une carte par page (Créer, Découvrir, Autour, Mes mèmes, Proches, Moi), « ✓ Vue » une
  fois visitée, « Tout visiter » puis « Continuer la visite » ; un point rose sur le logo jusqu'à la première ouverture.
- **Une page : sur la vraie page.** L'écran s'assombrit, sauf ce dont il parle (cherché dans la page, sans cesse : elle
  se charge, défile ; rien à montrer — une page vide — : la bulle parle sans lumière ; la carte d'« Autour », trop
  grande, sous un voile léger). « Suivant », « Passer », « Échap » ; à la fin, « La suite : <la page d'après> » ou
  « C'est compris » (la page est alors « Vue »). « Retour » pendant une page arrête la visite.
- **Retenu sur le téléphone** : `clikme-tuto-bienvenue`, `clikme-tuto-visite`, `clikme-tuto-vues` (qui avait vu l'ancien
  accueil de Pablito n'a pas la bienvenue).

L'essai : `tuto.mjs` (un nouveau venu : ses trois bulles et leurs voix, la lumière sur le logo, « Je crée ma figurine »,
une seule fois ; Inès, qui a sa figurine : le point rose, la visite et ses six pages, « Créer » montrée bouton par bouton,
la suite sur « Découvrir », « Échap », « Créer » vue, « Retour » qui arrête, plus aucune fenêtre dans les pages).

### 9.0 undevicies 💶 Le prix d'une figurine (9 novembre)

Le propriétaire : « j'ai l'impression que ça coûte très cher : en faisant 3 ou 4 créations, j'en ai eu pour 50
centimes ». Le compte était juste : une figurine, c'était 4 images du moteur, toutes en qualité « high » (la plus
chère), au format 1024 × 1536 — sa figurine, sa bouche ouverte, puis sa joie fermée et ouverte, faites d'office.

- **Sa joie n'est plus faite d'avance** (`visagesVoulus`, `lib/direct/ma-figurine-serveur.ts`) : comme les autres
  visages, elle se fabrique la première fois qu'il la choisit (ou qu'un mème prêt, une des trois façons de le dire, la
  demande). Une figurine, c'est 2 images ; qui s'arrête à la création n'en paie plus que 2.
- **La qualité « high » pour l'image qui crée, seulement** (`qualiteFigurine`, `qualiteSuite`,
  `lib/direct/figurine-expressions-serveur.ts`) : sa figurine à partir de sa photo (la ressemblance s'y joue) et sa
  figurine du mois (une nouvelle tenue). Tout ce qui part d'une figurine déjà dessinée et n'en change que le visage, la
  bouche ou les bras — sa bouche ouverte, ses visages, ses attitudes, ses réactions, la bouche de son look — passe en
  « medium » : environ quatre fois moins cher, et montré à 900 pixels au plus.
- **Réglages** : `FIGURINE_QUALITE` (l'image qui crée, `high` par défaut), `FIGURINE_QUALITE_SUITE` (le reste, `medium`
  par défaut ; `high` pour revenir à l'ancien prix si la bouche ouverte, en parlant, se distinguait trop de sa figurine).
- **Le prix d'une figurine, en images « high »** : 4 avant ; 1 « high » + 1 « medium » maintenant (environ 1,25), soit
  à peu près 70 % de moins. Le vrai prix se lit dans l'Usage du compte OpenAI, modèle par modèle.

Les figurines des commerçants (`figurine-pro-serveur.ts`, `FIGURINE_QUALITE`) ne changent pas.

### 9.0 vicies 🛠️ L'atelier de Pablito : patienter avec le sourire (9 novembre)

Le propriétaire : « lorsqu'on appuie sur une émotion, une expression… qui n'est pas encore faite, une pop-up pour dire :
en cours de fabrication, et une fois faite elle sera à vous pour toujours. Elle doit être vraiment marrante et sympa à
regarder : c'est un peu long, il faut arriver à les faire patienter avec le sourire. » (La joie n'étant plus faite
d'avance — 9.0 undevicies —, la première attente arrive plus tôt.)

- **Où** : un visage ou une attitude pas encore faits (l'étincelle ✨), touchés dans la feuille « Son visage, au choix » (le tiroir « Visage » avant 9.0 unvicies) — ou demandés
  par un mème prêt, une des trois façons de le dire. Un visage déjà à l'atelier (il tourne) se touche aussi : la fenêtre
  se rouvre, sa barre où elle en était (`app/collection/atelier.tsx`, `AtelierPablito`).
- **À l'atelier** : « 🛠️ À l'atelier — Pablito fabrique ta tête « Joie » » (« ton attitude « Victoire » ») ; Pablito
  s'entraîne à faire sa tête (il passe d'une grimace à l'autre), ses outils tournent autour de lui (🔨 🎨 ✏️ 🪄) ; ce
  qu'il fait s'écrit, une phrase toutes les 4,5 s (« Je sors la pâte à modeler… », « Je m'entraîne à faire ta tête devant
  le miroir 🪞 », « Je vérifie que c'est bien toi… Oui, c'est bien toi. », « Pause café de l'artiste ☕ Deux secondes,
  promis. »…, puis, si c'est plus long, « Ça arrive, ça arrive… 🥁 ») ; une barre rayée qui avance vite puis ralentit, et
  ne touche le bout que quand c'est prêt ; « Environ une minute ». **On peut le chatouiller** (« Psst… touche-le, pendant
  qu'il travaille 😏 ») : il rit, et il râle (« Hé ! Ça chatouille ! », « Arrête, je vais rater ton sourcil ! », « Encore
  une fois et je te dessine une moustache. »…). « 💝 Une fois faite, elle est à toi **pour toujours** : plus jamais
  d'attente pour celle-là. » « Je fais autre chose en attendant » la ferme (la feuille reste ouverte) : la fabrication
  continue, et sa tête s'affichera toute seule.
- **Tadaaa** : « Ta tête « Joie » est prête ! », sa nouvelle tête — la sienne — qui saute dans la fenêtre, des
  confettis, le tampon « À toi pour toujours » ; « 😄 Je l'essaie ! » : elle se joue en haut, sous ses yeux.
- **Un pépin** : Pablito tout triste, « Oups, petit pépin à l'atelier », et ce que le serveur a dit (« La fabrication des
  figurines est en pause de notre côté… »).
- **Sans voix** : Pablito ne parle qu'avec les enregistrements du propriétaire, et il n'y en a pas pour l'atelier.

L'essai : il faut le moteur d'image pour qu'un visage soit « à créer », et la CI n'en a pas — l'atelier a été vu en vrai
sur l'appli construite, branchée sur un faux moteur qui met 12 s par image (« Joie » à créer, l'atelier, la
chatouille, les phrases et la barre qui avancent, fermé puis rouvert, « Tadaaa », « Je l'essaie ! », puis le moteur à
court de crédit : le pépin).

### 9.0 unvicies 🪜 « Créer » en trois étapes (9 novembre)

L'ami du propriétaire, devant la page « Créer » : trop de boutons côte à côte (🎲 Surprends-moi, 🔥 le mème du jour, dix
phrases, ✨ trois façons, les tiroirs « Visage », « Animer », « La refaire »…), et on ne voit pas **à quoi elle sert**. Sa
proposition, reprise dans la maquette (le canevas « Créer »), puis ses trois derniers ajustements : l'en-tête qui se fait
mince en défilant, « je choisis moi-même » en lien bien à part, et un retour tout de suite quand on touche une réaction.
Rien n'est retiré : tout est rangé (`app/collection/ma-figurine.tsx`).

- **En haut** : sa figurine, et dessous « Elle montre ton mème en direct ». Au téléphone, elle ne reste plus collée en
  haut : quand elle sort de l'écran, une **vignette** se glisse juste sous la barre du haut — sa figurine en petit,
  « Ton mème · 😢 Tristesse · 👩 … » (ce qu'il a choisi, sur une ligne), un point qui tourne si un visage se prépare ; un
  toucher et la page remonte (`.tf-mini`, un `IntersectionObserver`). À l'ordinateur, la colonne de gauche reste collée,
  sans vignette.
- **Deux onglets, nommés par ce qu'on veut faire** : « 💬 Faire un mème » (au lieu de « Fais-la parler ») et « ⚡ Répondre
  vite » (au lieu de « Réactions & gags »).
- **① Ce qu'elle dit** — « Ta phrase, ou ta voix : c'est elle qui la dira. » : « ✍️ J'écris · 🎙️ Avec ma voix », sa
  phrase, puis **un seul bouton** « 🎲 Pas d'idée ? — Je t'en propose une, ou des phrases toutes prêtes ». Il ouvre une
  feuille : « Choisis : ça remplit ta phrase, et tu peux tout changer après. », 🎲 Surprends-moi (« Une phrase drôle,
  inventée pour toi » ; sa carte surprise s'affiche dans la feuille), 🔥 Le mème du jour (« Le même thème pour toute ta
  ville, aujourd'hui »), et « Des phrases toutes prêtes » (les dix du jour). Un toucher sur une phrase : la feuille se
  ferme, la phrase est écrite. Le premier mème déjà écrit (« 🎁 ») reste, la première fois.
- **② Comment elle le dit** — « Choisis le ton : je te propose trois mèmes. » : les six tons (facultatifs), puis les
  trois vignettes, nommées par leur façon : « 😂 En BD · 🎭 En film · 🌀 En affiche » (`FACONS`, `trois-rendus.tsx`) ;
  « 🎲 Trois autres » reste. Dessous, en lien doré souligné, bien à part : « 🎭 Ou je choisis son visage moi-même ». Il
  ouvre la feuille « 🎭 Son visage, au choix — Ce qu'elle ressent pendant qu'elle parle. » : son look, « Son humeur » (les
  huit visages), « Son attitude » (les six), la note de l'atelier, et « C'est bon, je garde ce visage ». Ce qu'il a pris
  s'écrit sous le lien (« 😢 Tristesse », « 🤦 Oh non »).
- **③ Sa voix** — « Celle qui lira ta phrase. » : « 👨 Voix d'homme · 👩 Voix de femme » (puis les voix, comme avant),
  « ▶ Écouter » en petit dans l'en-tête de l'étape, et « 🕺 Elle danse en parlant » (un interrupteur ; « En musique, et
  dans ton mème »). Avec sa propre voix, l'étape s'appelle « Elle danse ? » et ne garde que la danse.
- **Le but, écrit sur le bouton** : « 🎬 Créer mon mème — Une vidéo à envoyer où tu veux ». Plus besoin d'avoir écouté
  avant : le bouton fait lire la phrase si elle ne l'a pas encore été, puis fabrique le mème (`creerMonMeme`). Sans
  phrase : « Écris d'abord ce qu'elle doit dire, à l'étape ①. » ; sans voix : « Choisis d'abord sa voix, à l'étape ③. »
  (et la page descend jusqu'à l'étape ③). Le mème prêt : « ✅ Ton mème est prêt · le revoir ».
- **⚡ Répondre vite** : « Ta tête à la place des emojis — Un toucher, c'est envoyé : dans WhatsApp, à un proche, où tu
  veux. » ; les gags (ils étaient dans le tiroir « Animer ») : « 💥 Un gag, en petite vidéo — Pour détendre une
  conversation. ». **Un toucher se voit tout de suite** : la case saute, et un bandeau monte en bas — « 😂 « Mort de
  rire » est prêt ! Choisis à qui l'envoyer. », puis « ✓ « Mort de rire » est parti ! » (ou « est enregistré : envoie-le
  où tu veux. ») ; fermé sans rien choisir, il s'efface (`mes-reactions.tsx`).
- **« Refaire ma figurine »** quitte « Créer » : elle est dans « Moi », repliée (« Elle ne te ressemble pas ? Une
  nouvelle, ou une autre photo. »), avec son métier ou sa passion et les mêmes deux chemins qu'avant
  (`RefaireMaFigurine`).
- **Le tuto de « Créer »** suit les étapes : ① (`tuto-creer-1`), « Pas d'idée ? Choisis ce que tu veux dire… » sur l'étape
  ② (`tuto-creer-3`), « Visage » sur le lien « je choisis moi-même » (`tuto-creer-2`), puis une bulle nouvelle sur
  l'étape ③ et le bouton : « Choisis sa voix, fais-la danser si tu veux… puis touche « Créer mon mème » : il part où tu
  veux. » — **à enregistrer** (`tuto-creer-4b`) ; d'ici là, elle s'écrit sans voix (une bulle peut nommer son son :
  `EtapeTuto.son`).

Les essais : `ma-figurine.mjs` (les trois étapes, la vignette, les deux feuilles, le bouton sans écoute, la danse,
« Refaire » dans « Moi »), `attitudes.mjs`, `trois-rendus.mjs`, `mes-reactions.mjs` (le bandeau), `tuto.mjs`.

### 9.0 duovicies 🎬 Le message par WhatsApp, en vidéo (9 novembre)

Le propriétaire, devant le message reçu (une carte grise, sans image, « Écoute ce que ma figurine a à te dire 😄 » et le
lien) : « le message que quelqu'un reçoit n'est pas du tout encourageant ou beau, ça ne donne pas envie de cliquer
dessus. Et il n'y a aucun moyen que le message reçu sur WhatsApp s'ouvre directement sur WhatsApp au lieu que ce soit un
lien ? » Une page ne s'ouvre jamais dans WhatsApp : un lien ouvre le navigateur. Une vidéo, si — elle se joue dans la
conversation. Proposé, puis « oui ».

- **Sa vidéo, dans WhatsApp** (au téléphone qui sait partager un fichier : `navigator.canShare({ files })`) : dès que
  le lien est prêt, sa figurine qui dit son message devient une vidéo — sa voix, **la tête de chaque réplique au bon
  moment**, ses mots posés sur le temps de leur réplique ; en haut « 🎙️ Un message pour Karim — de Zoé », à la fin
  « 💬 Réponds-moi avec ta figurine — clikme.fr » (`fabriquerMeme`, l'option `repliques` de `lib/direct/meme.ts`). Elle
  se fabrique sous ses yeux, sans bruit (il vient de s'entendre), le temps de son message : « 🎬 Ta vidéo se
  prépare… 42 % », puis « 📲 L'envoyer en vidéo sur WhatsApp » (le partage du téléphone : un second toucher, le
  téléphone l'exige). Sa légende : « 🎙️ Karim, je t'ai laissé un message avec ma figurine ! Réponds-moi avec la
  tienne 👉 <le lien> » (`texteAvecVideo`) : le lien ne sert plus qu'à répondre. Puis « C'est parti ! » (« La
  renvoyer »). « Envoyer le lien seulement » et « Copier le lien » restent. La vidéo ne quitte pas son téléphone (elle
  n'est rangée nulle part). Le son s'ouvre pendant qu'il touche « Envoyer par WhatsApp » (sinon elle serait muette).
- **Sans partage de fichier** (un ordinateur), ou si la vidéo rate (« La vidéo n'a pas pu se faire : envoie le lien… ») :
  le lien, comme avant.
- **Le texte du lien** : « Karim ! 🎙️ Ma figurine a un message pour toi, écoute 👇 » (`texteDuLien`).
- **Son aperçu, une vraie carte** (`app/t/[id]/apercu/route.tsx`, l'`og:image`) : l'image d'avant était sa figurine en
  .webp derrière une adresse signée d'une heure — WhatsApp ne la montrait pas. Maintenant une carte 1200 × 630, en JPEG
  léger (quelques dizaines de ko), à une adresse qui ne change pas : « ClikMe · pour Karim », « **Zoé** t'a laissé un
  message avec sa figurine », « ▶ Écouter son message », sa figurine en grand (recadrée sur sa tête) avec un micro et
  un gros ▶. Titre : « 🎙️ Zoé t'a laissé un message » ; texte : « Touche pour écouter sa figurine, puis réponds avec la
  tienne. » Un lien effacé : la même carte, sans figurine (« Ce message s'est effacé »).

**Le 10 novembre, l'essai sur son iPhone** : « les textes sortent de leur espace, ils sont superposés et cachent le
visage » ; « la vidéo est sous un voile blanc transparent, on ne voit pas la figurine en entier » (sa vignette, dans la
conversation). Le bandeau d'annonce des commerçants (penché, qui arrive en rebond) débordait du cadre et tombait sur son
visage, l'emoji par-dessus ; et la première image de la vidéo — celle dont WhatsApp fait la vignette — était le flash
blanc de l'arrivée, sur une figurine zoomée. Le message a maintenant **sa propre mise en page** (`message` dans
`fabriquerMeme`, `leMessage`) : un bandeau droit et immobile, « 🎙️ Message de Zoé », « pour Karim » dessous, centré à la
main et rétréci jusqu'à tenir ; sa figurine un peu plus petite et plus bas (entière, son visage au milieu) ; l'emoji à
côté de son visage ; ses mots sur son corps (aux trois quarts de la hauteur : au-dessus de la légende que WhatsApp pose
sur le bas) ; **ni zoom ni flash** : la première image est nette et complète.

**À savoir** : WhatsApp lui-même ne s'essaie pas d'ici. Sur certains iPhone, la légende d'une vidéo partagée peut
arriver à part, ou pas du tout : à vérifier sur un vrai téléphone. Un aperçu déjà vu, WhatsApp le garde en mémoire : les
liens d'avant ce changement gardent leur carte grise.

L'essai : `talkie-whatsapp.mjs` (le texte du lien ; la carte de l'aperçu : 1200 × 630, JPEG, moins de 300 ko, et celle
d'un lien inconnu ; un téléphone qui sait partager une vidéo — son partage imité : sa vidéo se fabrique sous ses yeux,
« L'envoyer en vidéo sur WhatsApp », le partage reçoit une vidéo MP4 et sa légende, « C'est parti ! »).

### 9.0 tervicies 🪜 « Créer » écran par écran (10 novembre)

Le propriétaire, après 9.0 unvicies : « c'est mieux, mais j'aurais quand même aimé qu'on ne voie qu'une section après
l'autre… c'est encore très confus, tous ces écrans quand on fait défiler vers le bas : ne faudrait-il pas qu'il y ait
juste un écran, on valide une action, alors un autre écran arrive ? » (et la réflexion de son ami : une seule question
à l'écran, l'effet « tunnel magique », plus de bouton caché en bas). Retenu, avec deux ajustements : **pas d'écran de
choix au départ** (les deux onglets « Faire un mème · Répondre vite » le font déjà : on arrive sur l'étape ①), et
**« Répondre vite » ne change pas** (c'est déjà un seul écran, un toucher envoie).

- **Sa figurine reste en haut** (l'aperçu en direct de son mème, un peu plus petite qu'avant : la place pour l'étape) ; dessous, **une seule étape** à l'écran (`etape`), qui
  glisse du bon côté quand on avance ou qu'on revient.
- **La barre des étapes** : « 1 Sa phrase · 2 Le ton · 3 Sa voix » (avec sa propre voix : « 1 Ta voix · … · 3 La danse ») ; celle
  à l'écran en rose, celles faites cochées ✓ ; un toucher rouvre une étape (on saute la ② quand on veut).
- **En bas, toujours à portée** (collé au-dessus du menu) : « Suivant ➔ » ; à la ②, « ‹ Retour » et « Passer ➔ » (elle
  est **facultative** : son titre le dit, « Facultatif : choisis le ton, je te propose trois
  mèmes. ») ; à la ③, « ‹ Retour » et « 🎬 Créer mon mème ». On ne passe la ① qu'avec une phrase, ou sa voix enregistrée.
- Le contenu des étapes ne change pas (9.0 unvicies) : ① sa phrase et « 🎲 Pas d'idée ? » ; ② le ton, les trois façons,
  « Ou je choisis son visage moi-même » ; ③ sa voix et « Elle danse en parlant ». « Créer mon mème » sans phrase ramène
  à la ①.
- **Le tuto** ouvre l'étape dont il parle (une bulle peut demander à la page de montrer quelque chose :
  `EtapeTuto.ouvrir`, l'événement `EVT_TUTO_OUVRIR`).
- Les essais ouvrent une étape comme on le fait au doigt (`etapeCreer` dans `scripts/navigateur/commun.mjs`).
- **« Ta figurine du mois » quitte le bas de « Créer »** (le propriétaire, le même jour : « elle encombre et prend de la
  place sur cette section ») : sa progression se suit dans « Moi » (`MaFigurineDuMois`), et quand elle est arrivée, son
  look se prend dans « Son visage, au choix » (`ApercuDuMois` est parti).
- **Rien ne dépasse de l'écran quand une étape glisse** : en arrivant de côté, elle débordait de 17 px le temps de son
  animation (la page pouvait bouger de côté ; l'essai `appli-notif` l'a vu en CI). `.tf-moi` coupe ce qui dépasse
  (`overflow-x: clip`, qui garde le bas collé au-dessus du menu) ; `ma-figurine.mjs` le mesure pendant le glissement.

### 9.0 quattervicies ✏️ « Créer » sur un seul écran (10 novembre)

Le propriétaire, après 9.0 tervicies, avec sa maquette (« ClikMe — Créer, nouvelle version ») : « que penses-tu plutôt
de ce flow pour la page “Créer”, afin de simplifier, qu'on ait tout sur un écran sans scroller, et moins de
distraction ? ». Retenu, avec ses réponses à nos questions :

- **La voix : sa propre voix, ou que de l'écrit.** « L'idée, c'est justement que la personne comprenne : soit elle
  enregistre sa propre voix, soit c'est que de l'écrit, parce que la voix d'un autre, c'est trop étrange. » Dans
  « Créer », plus aucune voix de synthèse : plus de choix de voix (homme, femme), plus d'« Écouter » ni de lecture d'une
  phrase prête ou de « Surprends-moi ». **Un mème écrit** a ses mots en grand, et sa figurine danse en musique
  (`fabriquerMeme` sans `son`, 4 à 12 s selon la longueur : `dureeSansVoix`) ; au serveur part un silence (un WAV
  8 kHz, `silenceWav`), pour que le message garde sa forme. **Avec sa voix** : il s'enregistre (15 s au plus).
- **Un seul écran**, de haut en bas : sa figurine **« En direct »**, avec **sa bulle** (ce qu'elle va dire, au fil de
  la frappe) et **le nom de sa tête** dessous ; la rangée **« Son visage »** (ses looks du mois, « Normal », ses sept
  humeurs, puis ses six attitudes : une vignette chacun, qui glisse ; à l'ordinateur, sur deux lignes) ; **« Ce qu'elle
  dit »** (sa phrase, « 🎙️ Avec ma voix » / « ✍️ Plutôt l'écrire », « 🎲 Pas d'idée ? », le compteur) ; **« 🎬 Créer
  mon mème »** ; puis un lien, **« ⚡ Ou réagir en un toucher : ta tête à la place des emojis »**, qui ouvre ses
  réactions et ses gags dans une feuille (`MesReactions` ; `#reactions` l'ouvre aussi). Plus d'onglets, plus d'étapes,
  plus de vignette qui suit en défilant.
- **Sa figurine se fait plus petite sur un petit téléphone** (« ok ») : sa hauteur suit celle de l'écran
  (`--tf-haut`), pour que tout tienne entre la barre du haut et le menu. Mesuré : un iPhone 14 (dans l'appli comme dans
  Safari, avec ses barres), un grand iPhone, un Android, un iPhone SE dans l'appli. Seul l'iPhone SE dans Safari, avec
  ses barres, défile encore un peu.
- **Les bandeaux restent** (« ok ») : répondre à un mème (en duo), le mème du jour, un lieu d'« Autour ».
- **« Ton mème est prêt », dans une feuille** : la vidéo, et **« Sa version » à côté** (pour un mème écrit) — la
  vidéo simple, en BD, en film, en affiche (`TroisRendus`, dessinées d'après sa phrase ; « 🎲 Trois autres »). Un
  toucher : **son mème se refait sous ses yeux, à la même place** (le même message, le même lien : la vidéo est
  renvoyée au seau par-dessus l'autre), avec la tête de cette version si elle est faite. **« Une petite animation
  addictive »** (« ok ») : le clap qui claque, ce que fait l'équipe (« Silence… on tourne ! », « Pablito ajoute des
  paillettes »…), la barre qui brille, le cadre qui pulse ; et une étincelle quand elle est prête. **Avec sa voix** :
  pas de version, mais **« 🕺 Elle danse en parlant »**, un interrupteur, qui refait le mème en dansant. Puis :
  « 📲 Partager » (la vidéo telle quelle), 🔗 son lien, ⬇️ la vidéo ; « 🌍 Poster sur le fil de Dax » ; **« ✏️ Changer la
  phrase »** (« ok ») ramène à « Créer », sa phrase sous le doigt.
- **Le serveur** : `meme-pose` reçoit les réglages du mème refait (`reglages : { rendu, danse, sentiment }`) — sa
  version, la danse et sa tête sont gardées à côté du message (et sa tête dans la table, pour la vignette de « Mes
  mèmes »).
- **Le tuto** suit l'écran : ce qu'elle dit, la rangée de ses visages, « Pas d'idée ? », puis « Créer mon mème » et
  « Réagir » ; la dernière bulle est réécrite, en attendant son enregistrement (`tuto-creer-4c`, sans voix d'ici là).
  Les bulles n'ouvrent plus d'étape (`EVT_TUTO_OUVRIR` est parti).
- Partis avec les étapes : « Son visage, au choix » (la feuille), les tons (« Faire rire »…, encore connus du serveur),
  le premier mème lu d'avance pendant la fabrication (`PremierMemePendant`, plus montré depuis le 9 novembre), et
  `etapeCreer` dans les essais.

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
- Les visages : l'accord écrit du pro ; pour les clients, une case jamais cochée d'avance, et 15 ans ou plus (§ 9.0 tertricies). Les
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
