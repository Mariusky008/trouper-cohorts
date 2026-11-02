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
   avec « 🏆 Défi de la famille · 3 tables · Complet ✅ » (la mission de la famille), et l'album « Ma collection · 6 / 24 ».
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

### 9.1 L'idée en une phrase

**C'est la carte de fidélité à 10 cases que tous les commerçants comprennent — mais qu'on a envie de montrer.** Chaque
case est une figurine datée, qu'on ne gagne qu'en venant pendant sa période ; la dixième débloque un vrai cadeau ; et
tout se partage.

On la bâtit sur ce qui existe déjà : la famille du commerce et ses pièces (bronze, argent, or : `lib/direct/famille.ts`),
la visite validée au comptoir (le bon « Servie ✓ », le mot du jour noté au carnet), Ma Maison et « Mes familles ».

### 9.2 Les éditions : 10 par an et par commerce

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
