# 🧭 Découvrir : ma télé du jour, et les salons ouverts

Cahier des charges de la page « Découvrir » (17 novembre 2026). Rien n'est codé : ce document dit ce qu'on fait, dans
quel ordre, et ce qui reste à décider.

---

## 1. Le principe

Les trois pages de l'univers se répondent :

| Page | Ce que c'est | Pour qui |
|---|---|---|
| 💬 La messagerie (le salon du duo) | une conversation visuelle qui se souvient de tout | nous deux |
| 🏠 Ma maison | ma pièce, qui se remplit de ce que je garde | moi, et ceux que je reçois |
| 🧭 **Découvrir** | **ma télé du jour, et des salons ouverts à tous, par passion** | **moi, mes proches, et les autres** |

Les utilisateurs viennent de toute la France, et les duos ne vivent pas dans la même ville : **on se retrouve par
passion**, pas par lieu (ni commerçant, ni rencontre de quartier). Une seule exception : **les potins de sa ville**
(5.4), un salon où l'on parle de ce qui s'y passe.

Découvrir a deux étages :

1. **En haut, ma télé du jour, dans ma pièce** (celle de Ma maison) : chaque jour, des vidéos sur mes passions. Je les
   regarde seul, ou j'invite des proches à s'asseoir avec moi : on voit la même vidéo au même moment et on réagit.
2. **En dessous, les salons ouverts** : une pièce par passion (le foot, les séries, les révisions…). On entre, sa
   figurine s'assoit sur une place libre, et on discute avec le moteur du salon du duo : les bulles, les gestes, les
   mèmes.

**Le cœur de la page, et notre argument de communication : on ne regarde jamais une vidéo seul** (4.5). Quand je
regarde une vidéo, les figurines de mes proches qui l'ont vue avant moi sont assises à côté de moi et réagissent à la
seconde où ils ont réagi — même s'ils l'ont vue hier. **« Regarde tes vidéos avec ceux que tu aimes, même quand ils
sont loin. »**

Le fil qui relie tout : **les mêmes passions** font ma télé du jour et les salons ouverts (je regarde un but chez
moi ; un toucher m'emmène dans le salon du foot pour en parler) ; **ce que je garde** (une vidéo, un moment d'un
salon) va dans ma maison ; **quelqu'un que j'apprécie** dans un salon peut devenir un proche, et notre duo s'ouvre.

## 2. Les règles qui ne se discutent pas

- On travaille en français ; on tutoie ; jamais le mot « exemple » à l'écran ; jamais de voix de synthèse.
- **Jamais de message privé à un inconnu.** Pour se parler à deux, il faut être proches tous les deux (« Ajouter en
  proche », accepté des deux côtés) : alors le duo s'ouvre, comme aujourd'hui.
- **Les 15-17 ans et les adultes ne se croisent jamais** dans un salon ouvert : deux maisons de salons séparées
  (`sesDixHuitAns`). Le salon des jeunes parents est réservé aux adultes.
- **Dans un salon ouvert, on ne montre que le prénom et la figurine** : jamais la ville, jamais le nom, jamais la
  maison sans l'accord de son propriétaire.
- **Les vidéos sont toujours lues avec le lecteur officiel** (YouTube, TikTok, Instagram) : jamais téléchargées, jamais
  rangées chez nous.
- **La modération arrive avec les salons ouverts, pas après** (section 6).
- Rien d'alcoolisé, nulle part (les thèmes, les sélections, les décors).

## 3. Les passions

- **Une douzaine de thèmes au départ** (validé par le propriétaire, la liste reste à confirmer) :
  ⚽ Foot et sport · 🎬 Séries et films · 🎵 Musique · 🎮 Jeux vidéo · 🍳 Cuisine · 📚 Révisions et études ·
  👶 Jeunes parents (adultes) · 👗 Mode et beauté · 😂 Humour · ✈️ Voyages · 🐾 Animaux · 🧘 Bien-être.
  Et, pour tout le monde, à part : **🗞️ Les potins de ma ville** (5.4).
- **« Tes passions »** : on en choisit de 3 à 5, la première fois qu'on ouvre Découvrir (et plus tard depuis Moi). Un
  écran, des vignettes, un toucher par passion.
- Rangé dans `<h>/passions.json` : `{ passions: string[], poids: Record<string, number>, le }`. Les poids montent
  quand on regarde une vidéo jusqu'au bout ou qu'on la garde ; ils baissent quand on la passe. Pas d'IA : un simple
  compte.

## 4. Ma télé du jour (le salon privé, dans ma pièce)

**Décision du propriétaire : le salon privé, c'est ma pièce de Ma maison**, avec sa télé (`ma-maison.md`). On ne crée
pas de pièce de plus ; ma maison devient l'endroit où je reçois.

### 4.1 La sélection du jour (YouTube seulement, au départ)

- **Décision du propriétaire : YouTube seulement pour la sélection automatique** ; TikTok et Instagram, seulement les
  liens qu'on colle (4.4). Ces deux plateformes ne laissent pas une appli chercher des vidéos pour quelqu'un.
- **Une sélection par thème et par jour, la même pour tout le monde** (et une pour les 15-17 ans) : l'API YouTube
  permet environ 100 recherches par jour sans demande à Google (une recherche coûte 100 unités sur 10 000) ; faire la
  sélection personne par personne est impossible, et inutile.
- **Chaque nuit** (une tâche planifiée, comme les autres `src/app/api/cron/…`) : pour chaque thème, 3 ou 4 recherches
  (`search.list` : `regionCode=FR`, `relevanceLanguage=fr`, `videoEmbeddable=true`, `safeSearch=strict` pour les
  15-17 ans, publiées dans les 7 derniers jours), puis `videos.list` (1 unité) pour la durée et le droit d'être lue
  ailleurs. On garde une quinzaine de vidéos par thème, entre 30 s et 20 min.
- Rangé dans `decouvrir/selection/<jour>/<theme>.json` (et `<theme>-jeunes.json`).
- **Une page d'administration** (`/admin/humain/decouvrir`) montre la sélection du jour par thème ; l'administrateur
  peut retirer une vidéo (elle disparaît de toutes les télés) ou en ajouter une par son lien.
- **La clé YouTube** (`YOUTUBE_API_KEY`) : à créer par le propriétaire dans Google Cloud et à ranger dans Vercel. Jamais
  dans la discussion.

### 4.2 Regarder

- **Ma télé du jour** = les sélections de mes passions, mêlées selon mes poids, sans ce que j'ai déjà vu. En haut de
  Découvrir, une carte : la vignette de ma pièce, sa télé allumée, « 🎬 8 vidéos t'attendent · foot, cuisine ».
- On entre dans **ma pièce** (le moteur du salon, `creerScene`) : ma figurine assise, la télé dans son emplacement,
  la vidéo dans le lecteur officiel (l'API IFrame de YouTube). « Suivante » ; « 📌 Garder » ; « Envoyer à… » (un proche :
  elle passe sur la télé de notre duo, `tele.ts` existe déjà).
- **Ce que je garde** va dans la vidéothèque de ma maison (un rayon de l'étagère, `ma-maison.md`).
- Sous la vidéo : « 💬 Le salon du foot en parle · 5 personnes » — un toucher, et j'y suis (section 5).

### 4.3 Inviter des proches à s'asseoir

- « Inviter » : la liste de mes proches (ceux d'aujourd'hui, réciproques). Chacun reçoit une invitation (dans
  l'appli, et une notification) : « 🎬 Léa t'invite chez elle à regarder la télé » — « Venir » / « Pas maintenant »
  (comme l'invitation du salon du duo, `salon-du-duo.md` 11.10).
- **Jusqu'à 4 places** (moi et 3 proches ; à confirmer). Chaque figurine s'assoit à sa place ; les bulles, les
  gestes et les mèmes marchent comme dans le duo, entre tous ceux qui sont là.
- **La télé est synchronisée** : c'est moi, l'hôte, qui lance, mets en pause, passe. L'état tient dans un petit
  fichier (`salons-prives/<h>/tele.json` : `{ video, depart, pause?, n }`) ; chacun calcule où en est la vidéo
  (`maintenant − depart`) et se recale s'il dérive de plus de 2 s. Le pouls (`?pouls=`) dit quand `n` change.
- Ce qui se dit pendant la séance reste à ceux qui étaient là (une conversation de groupe, gardée comme celle du duo).

### 4.4 Les liens TikTok et Instagram

- On colle un lien (moi, ou un proche invité) : la vidéo passe sur la télé, dans le lecteur officiel de la plateforme
  (TikTok : son lecteur public ; Instagram : l'oEmbed de Meta, qui demande le jeton de l'application Meta — sinon une
  carte qui ouvre Instagram).
- La synchronisation n'est garantie que pour YouTube ; pour TikTok et Instagram, chacun lance la vidéo de son côté.

### 4.5 ⭐ Jamais seul devant une vidéo (décision du propriétaire, 17 novembre 2026)

**L'idée** : mes réactions à une vidéo sont notées **à la seconde près** (un rire à 0:42, un sursaut à 1:15, « nooon »
à 1:30). Quand un proche regarde la même vidéo plus tard, ma figurine est assise à côté de lui et réagit au même
moment. On regarde ensemble sans être là en même temps — ce qui manque aux gens éloignés (couples à distance,
familles dispersées, amis d'enfance).

**Pourquoi ça marche** : la sélection du jour est **la même pour tout le monde par thème** (4.1) — mes proches ont
souvent vu les mêmes vidéos que moi. Et le moteur sait déjà rejouer (l'arrivée du salon du duo rejoue ce que l'autre a
laissé, `salon-du-duo.md` 11.9) : ici, on rejoue selon le temps de la vidéo, pas l'heure.

**Comment savoir quand on a réagi, sans bouton** — trois niveaux :

1. **Ce que l'appli comprend toute seule (pour tout le monde, dès le départ)** :
   - **ce que je fais de la vidéo** : je la passe avant 15 s → « bof » à ce moment ; je reviens en arrière → « oh ! »
     au début du passage revu ; je la regarde jusqu'au bout → un ❤️ à la fin ;
   - **des gestes sans viser**, n'importe où sur la scène hors de la télé : un toucher → ma figurine rit ; deux
     touchers → un cœur ; un appui long → « oh ! » ;
   - **ce que j'écris ou je dis** : une bulle tapée part à la bonne seconde, et sa réaction se déduit des mots
     (`reactionAuTexte`, `src/app/salon/bulles.ts` : « c'est nul » → bof, « haha » → rire, « ! » → surprise) ; ou je
     garde le doigt appuyé et je le dis : **ma vraie voix** (le talkie existant), rejouée à la seconde chez mes proches
     (jamais dans un salon ouvert au départ, 5.2).
2. **« 📷 Ta figurine fait ta tête » (si je l'accepte ; la fonction phare)** :
   - la caméra avant regarde mon visage pendant la vidéo ; **rien n'est filmé, rien n'est envoyé** : le téléphone
     reconnaît sur place un sourire, un rire, une surprise, une grimace (MediaPipe Face Landmarker, dans le navigateur,
     ses « blendshapes », 5 images par seconde) ; on ne garde que « rire à 0:42 » ;
   - repères de départ (à régler à l'essai) : rire = sourire > 0,6 et bouche ouverte > 0,35 pendant 0,4 s ; surprise =
     sourcils levés > 0,5 et bouche ouverte > 0,3 ; grimace / bof = moue ou nez froncé > 0,4 ; une même réaction au plus
     toutes les 2 s ;
   - si l'on regarde en même temps (4.3), ma figurine copie mes expressions **en direct**, à côté d'eux ;
   - **éteinte par défaut** ; un écran qui explique, un accord clair (la loi européenne sur l'IA demande d'informer
     quand on détecte des émotions) ; une pastille 📷 visible tant qu'elle marche ; un toucher l'arrête. Le message :
     « Ton téléphone voit que tu ris. Il ne garde que ça. »
3. **Le rire entendu au micro : pas maintenant** (le son de la vidéo trompe la détection, et un micro qui écoute en
   continu met mal à l'aise).

**Ce qui est rangé** : `reactions/<video>/<h>.json` — `[{ t, sorte, texte?, vocal?, source, le }]` (`t` en secondes, au
dixième ; `sorte` : rire, sourire, coeur, oh, surprise, bof, grimace, texte, vocal ; `source` : implicite, geste,
camera, ecrit, voix). Seuls **mes proches** les voient (et, dans un salon ouvert, ceux de ce salon : 5.2).

**Le rejouer** : à l'ouverture d'une vidéo, un seul appel rend les réactions de mes proches pour elle ; le lecteur
(l'API IFrame de YouTube, `getCurrentTime`) déclenche chacune à sa seconde : la figurine rit, saute, sa bulle s'ouvre,
sa voix se fait entendre. **Jusqu'à 3 proches assis à côté de moi** (les places de ma pièce, 4.3) — ceux qui ont le
plus réagi ; les autres passent en petites têtes au bord de la télé. **Dans un salon ouvert** : les réactions de tous
ceux qui ont vu la vidéo dans la journée, un stade — des dizaines de petites figurines qui sautent au but.

**Des figurines prêtes à réagir** :
- **tout de suite**, avec le moteur existant : rire (la tête qui sautille), sursauter, pencher la tête, le cœur, le
  « bof » (somnoler un instant), les emojis qui jaillissent ;
- **ensuite, de vraies expressions** : un petit lot de têtes par figurine (sourire, rire bouche ouverte, surprise,
  bof, grimace), fait **une fois**, après « C'est moi ! », comme les calques (`salon-du-duo.md` 11.7), dans la suite
  de l'essai des poses (`docs/reprise.md`, « Les poses de la figurine : l'essai P0 »).

**🎬 « Nos réactions » : la boucle virale** :
- à la fin d'une vidéo où au moins un proche a réagi : « 🎬 Nos réactions » → un clip de 10 s : ma pièce, nos
  figurines au moment le plus fort (la seconde où l'on a le plus réagi), une phrase (« Quand Sam a vu le but 😂 »), un
  carton avec le titre et la chaîne de la vidéo (**jamais ses images** : les droits), le logo ClikMe et clikme.fr ;
- fabriqué côté serveur (comme la vidéo de la figurine pour WhatsApp), partagé par le menu du téléphone (TikTok,
  Instagram, WhatsApp) : **chaque clip partagé montre ce que fait l'appli, avec de vraies têtes** ;
- n'y paraissent que les proches qui l'acceptent (un réglage dans Moi : « Mes réactions peuvent apparaître dans les
  clips de mes proches »).

**L'argument de communication** : « Regarde tes vidéos avec ceux que tu aimes, même quand ils sont loin. » La vidéo
de 15 s : une fille seule sur son canapé lance une vidéo ; les figurines de ses amis, à côté d'elle, éclatent de rire.

## 5. Les salons ouverts

### 5.1 Entrer, s'asseoir

- Sous ma télé : **les salons ouverts**, une carte par thème — la pièce, les figurines de ceux qui sont là par la
  fenêtre, « 6 personnes · ça parle du match ». Mes passions d'abord, puis les autres.
- Chaque thème a **son décor** (une des pièces du catalogue, `ma-maison.md`, section 2) et **sa télé**, qui passe la
  sélection du jour du thème, synchronisée pour tous ceux qui sont là : un repère commun pour parler.
- **8 places par salon.** Quand il est plein, un deuxième s'ouvre (« Le salon du foot · 2 »), et ainsi de suite ; on
  entre toujours dans le plus rempli qui a une place.
- On entre : ma figurine s'assoit sur une place libre. Une place se libère quand on part, ou quand on n'est plus là
  depuis 2 min 30 (la même présence que le duo, `LA_MS`).

### 5.2 Ce qu'on y fait

- **Écrire** (des bulles au-dessus des figurines, comme le duo), **les gestes** (sur une figurine : un coucou, un
  bravo, un rire), **les mèmes** (déjà modérés à la création).
- **Pas au départ** : les vocaux, les photos, les vidéos personnelles (à modérer d'abord ; à reconsidérer plus tard).
- **💬 La conversation** se relit dans une feuille, comme 💬 Messagerie ; elle est gardée **48 h** (à confirmer).
- **L'étagère du salon** : les moments que tout le monde a aimés (un message qui a reçu beaucoup de gestes) y restent,
  sans limite de temps. Chacun peut « 📌 Garder » un moment : il va dans sa maison.
- **Toucher une figurine** : son prénom, ses passions, « 👯 Ajouter en proche » (s'il accepte aussi, le duo s'ouvre),
  « 🏠 Voir sa maison » (seulement s'il l'ouvre aux visites), « Signaler ».

### 5.3 Dans ma maison

- **« Mes salons »** : les salons que je fréquente s'affichent dans ma pièce (des fanions au mur, un par thème), avec
  les moments que j'en ai gardés.

### 5.4 🗞️ Les potins de ma ville (décision du propriétaire, 17 novembre 2026)

- **Un salon par ville** : ce qui s'y passe, **les soirées, les événements**, les nouveautés, les travaux, ce qui ouvre
  et ce qui ferme. On connaît la ville de chacun (l'inscription, `ville_slug`). Le nom affiché : « 🗞️ Les potins de
  Dax ».
- **Par ville quand elle a assez de monde** (une vingtaine d'inscrits, à confirmer), **sinon par département**
  (« 🗞️ Les potins des Landes ») ; il s'ouvre dès que le monde est là. Chacun ne voit que celui de sa ville (ou de
  son département).
- **D'où viennent les potins** (chaque nuit, sur la télé du salon et dans une colonne « Aujourd'hui ») :
  1. **la presse locale** : le flux Google Actualités du nom de la ville (et du département) ; on montre le titre, la
     source et un lien vers l'article, jamais son texte (les droits des journaux) ;
  2. **les soirées et les événements** : OpenAgenda (l'agenda ouvert où publient les villes, les offices de tourisme et
     les associations ; une clé gratuite, `OPENAGENDA_API_KEY`, à ranger dans Vercel) ; les vidéos YouTube récentes qui
     citent la ville ;
  3. **les habitants** : « 🗞️ J'ai vu… » (un lieu, ce qui s'y passe) et « 📅 Une soirée, un événement » (quoi, où,
     quand), modérés avant d'apparaître ;
  4. **les mèmes déposés sur la carte « Autour »** dans cette ville.
- **Les soirées et les événements vont sur l'étagère du salon, rayon « À venir »** (passés, ils s'effacent).
  « 📌 Garder » en met un sur mon étagère : il devient mon prochain rendez-vous (le 📅 du salon du duo), et je peux
  l'envoyer à un proche (« On y va ? »).
- **Les règles** :
  - on parle **des lieux et de ce qui se passe, jamais d'un particulier nommé, jamais de photo de quelqu'un** : la
    modération bloque les prénoms et noms de particuliers avant l'affichage (les commerces, les lieux, les artistes à
    l'affiche, les élus dans leur fonction restent permis) ;
  - **rien d'alcoolisé** : une soirée tournée vers l'alcool (open bar, dégustation, bar à…) n'est ni reprise ni
    acceptée ;
  - **les 15-17 ans** voient les actualités et les événements de leur âge, **sans écrire**.

## 6. La modération et la sécurité (avec les salons ouverts, jamais après)

- **Ce qui est écrit** passe par la modération qui existe déjà (les mots, et la modération des mèmes et d'« Autour »)
  **avant d'apparaître** ; un message refusé ne part pas, et son auteur le voit.
- **« Signaler »** sur une figurine ou un message. Trois signalements de personnes différentes en une heure : la
  personne quitte le salon et ne peut plus entrer dans un salon ouvert pendant 24 h ; l'administrateur est prévenu.
- **« Ne plus voir »** : je ne vois plus les bulles de quelqu'un, partout.
- **Une page d'administration** : les salons en cours, les signalements, exclure quelqu'un des salons ouverts.
- **Les 15-17 ans et les adultes séparés**, le prénom et la figurine seulement, pas de message privé (section 2).
- **Rien n'est demandé de personnel** dans un salon (ni âge exact, ni ville, ni réseau social).

## 7. La vitesse (les règles du salon du duo, section 7)

- Découvrir s'ouvre avec ma télé du jour déjà prête (sa sélection lue en même temps que la page) ; la première vidéo
  démarre en moins d'une seconde.
- Les vignettes des salons ouverts : leurs plaques sont celles du catalogue, à adresse stable et en cache ; le nombre
  de présents arrive par un seul petit appel.
- Entrer dans un salon : la pièce à l'écran tout de suite (comme le duo), les figurines des présents posées en moins
  d'une seconde.

## 8. Ce que ça demande au moteur

- **Le moteur à N places** : aujourd'hui, la scène pose deux figurines (`moi`, `autre`) ; il en faut jusqu'à 4 dans
  ma pièce et 8 dans un salon ouvert. C'est un changement du contrat `src/lib/direct/salon.ts` (une PR qui le dit dans
  son titre) : des places en nombre libre, une figurine par personne présente, les bulles et les gestes adressés à
  une figurine.
- **Les places** : les pièces du catalogue ont deux places relevées ; il faut en relever jusqu'à 8 (canapé, fauteuils,
  poufs) pour les décors des salons ouverts.
- **La télé synchronisée** : la télé du duo (`tele.ts`) devient partageable entre N personnes, l'hôte la mène.

## 9. Les lots, dans l'ordre

| Lot | Contenu | Dépend de |
|---|---|---|
| **D0** | « Tes passions » (l'écran, `passions.json`) ; la sélection YouTube de chaque nuit ; la page d'administration de la sélection | la clé YouTube |
| **D1** | Ma télé du jour, seul, dans ma pièce : regarder, suivante, garder (la vidéothèque de ma maison), envoyer à un proche | D0, Ma maison |
| **D2** | Le moteur à N places (le contrat `salon.ts`) ; inviter des proches ; la télé synchronisée | D1 |
| **D2b ⭐** | Jamais seul devant une vidéo (4.5) : les réactions notées à la seconde (implicites, gestes, écrit, voix), rejouées par les figurines de mes proches ; « 📷 Ta figurine fait ta tête » ; le clip « Nos réactions » | D2 |
| **D2c** | Les expressions du visage de chaque figurine (sourire, rire, surprise, bof, grimace), faites une fois | D2b, l'essai des poses |
| **D3 + D4** | Les salons ouverts (instances de 8, présence, écrire, gestes, mèmes, la télé du thème) **avec** la modération et la sécurité | D2 |
| **D5** | L'étagère des salons, « Mes salons » dans ma maison, « Ajouter en proche » depuis un salon | D3 |
| **D6** | Les liens TikTok et Instagram collés sur la télé | D1 |
| **D7** | 🗞️ Les potins de ma ville : la presse locale, OpenAgenda, YouTube ; le salon par ville ou par département ; « J'ai vu… » et « Une soirée, un événement » ; les événements gardés comme rendez-vous | D3 + D4, la clé OpenAgenda |

Chaque lot : ses essais (route et navigateur, comme le salon du duo), sa section dans ce document, une PR vers `main`.
Avant D0, une **maquette cliquable** (une page d'administration, comme la maquette de la pièce vivante) : la carte
« ma télé du jour », ma pièce avec la télé, l'invitation, la liste des salons ouverts, un salon de 8 figurines.

## 10. Ce qui reste à décider (le propriétaire)

1. ~~Ce que deviennent les deux parties actuelles de Découvrir~~ — **décidé le 17 novembre 2026 : on supprime le
   défilement des mèmes et les vœux** (section 11).
2. **La liste des douze thèmes** (section 3).
3. **Le nombre de places** : 4 dans ma pièce, 8 dans un salon ouvert ?
4. **Les vocaux dans les salons ouverts** : non au départ ?
5. **La durée de la conversation d'un salon ouvert** : 48 h (les moments de l'étagère restent) ?
6. **La clé YouTube** : à créer et à ranger dans Vercel avant D0.
7. **« 📷 Ta figurine fait ta tête »** : permise aux 15-17 ans (avec le même accord) ou réservée aux adultes ? Et le
   réglage « Mes réactions dans les clips de mes proches » : allumé ou éteint par défaut ?
8. **Les potins de ma ville** : le seuil pour avoir son salon de ville (une vingtaine d'inscrits ?) ; la clé
   OpenAgenda, à créer et à ranger dans Vercel avant D7.

## 11. Ce qu'on retire de l'ancienne page (décision du propriétaire, 17 novembre 2026)

**Le défilement des mèmes en plein écran et les vœux sont supprimés.** Pour que l'onglet ne reste jamais vide, on les
retire **dans la PR qui livre la nouvelle page (D1)** : l'ancienne page part, ma télé du jour arrive.

Ce qui part :
- **l'écran** : `src/app/collection/decouvrir.tsx` (le défilement) et `src/app/collection/voeu.tsx` (les bulles, la
  mission, « Fais un vœu », « Mon vœu », « Réponds avec ta tête », « Exaucé ») ; « Mes vœux » dans Moi et le badge du
  vœu sur la carte de personnage ;
- **le serveur** : `src/lib/direct/voeu.ts`, `src/lib/direct/voeu-serveur.ts`, `src/app/api/direct/voeu/route.ts` ;
- **les notifications** : les tâches `/api/cron/voeu-soir` et `/api/cron/voeu-soir-ete` (et leurs lignes dans
  `vercel.json`), la mission de 11 h 30 ;
- **les essais** : `scripts/navigateur/voeu.mjs` (et sa ligne dans `scripts/navigateur/lancer-essais.sh` et dans la
  liste de lint de la CI) ;
- **le tuto** : les trois bulles de Pablito sur Découvrir (`public/collection/pablito/tuto-decouvrir-1..3.mp3`) parlent
  de l'ancienne page ; **le propriétaire enregistrera les nouvelles** (jamais de voix de synthèse), en attendant le tuto
  passe Découvrir.

Ce qui reste :
- **`sesDixHuitAns`** (dans `voeu-serveur.ts`) sert ailleurs (le catalogue des pièces, `salon-serveur.ts` ; la
  séparation des 15-17 ans ici) : on le **déplace** dans un fichier à lui avant d'effacer `voeu-serveur.ts` ;
- **la table `clik_voeu`** (`supabase/migrations/20261111090000_clik_voeu.sql`) : on ne l'efface pas tout de suite (une
  migration qui la supprime viendra un mois plus tard, une fois sûr que rien ne la lit plus) ;
- **les mèmes** eux-mêmes : on les crée toujours (« Créer »), on les envoie à ses proches, on les joue dans les salons ;
  seul le défilement des mèmes d'inconnus disparaît.
