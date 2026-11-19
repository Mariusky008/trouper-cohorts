# 🧭 Découvrir : ma télé du jour, et les salons ouverts

Cahier des charges de la page « Découvrir » (17 novembre 2026 ; les décisions du propriétaire reportées le 18 novembre,
section 10). Rien n'est codé : ce document dit ce qu'on fait, et dans quel ordre. **Plus rien n'attend le propriétaire
avant la maquette et D0.**

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

- **Douze thèmes au départ** (le propriétaire a laissé le choix, 17 novembre 2026 : ceux qui ont chaque jour des
  vidéos françaises fraîches, et de quoi parler) :
  ⚽ Foot et sport · 🎬 Séries et films · 🎵 Musique · 🎮 Jeux vidéo · 📺 Télé-réalité et people · 😂 Humour ·
  🍳 Cuisine · 👗 Mode et beauté · 🍥 Manga et anime · 🐾 Animaux · 📚 Révisions et études · 👶 Jeunes parents
  (adultes).
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
- **La clé YouTube** (`YOUTUBE_API_KEY`) : **créée par le propriétaire** (Google Cloud, l'API « YouTube Data API v3 »
  activée, la clé restreinte à elle) **et rangée dans Vercel**. Jamais dans la discussion.

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
- **Jusqu'à 4 places** (moi et 3 proches). Chaque figurine s'assoit à sa place ; les bulles, les
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

1. **Ce que l'appli comprend toute seule (pour tout le monde, dès le départ)** — et, ajoutée après l'essai de la
   maquette (19 novembre : sans elle, on ne trouve pas comment réagir), **une rangée de réactions sous la télé**
   (😂 ❤️ 😮 😱 😴), notées à la seconde comme le reste :
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
un vocal s'annonce, et on choisit de l'écouter (section 13). **Jusqu'à 3 proches assis à côté de moi** (les places de ma pièce, 4.3) — ceux qui ont le
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
  clips de mes proches ») — **allumé par défaut** (décidé le 17 novembre 2026), **éteint par défaut pour les 15-17 ans**
  (un clip partagé sort de l'appli).

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
- **Pas au départ** (décidé le 17 novembre 2026) : **les vocaux** (une voix ne se modère pas avant d'être entendue, et
  c'est le premier outil du harcèlement), les photos, les vidéos personnelles ; à reconsidérer après un mois de salons
  ouverts, avec les chiffres de la modération. **Entre proches, dans ma pièce, les vocaux restent permis.**
- **💬 La conversation** se relit dans une feuille, comme 💬 Messagerie ; elle est gardée **48 h**.
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
- **Par ville quand elle a assez de monde** (une vingtaine d'inscrits), **sinon par département**
  (« 🗞️ Les potins des Landes ») ; il s'ouvre dès que le monde est là. Chacun ne voit que celui de sa ville (ou de
  son département).
- **D'où viennent les potins** (chaque nuit, sur la télé du salon et dans une colonne « Aujourd'hui ») :
  1. **la presse locale** : le flux Google Actualités du nom de la ville (et du département) ; on montre le titre, la
     source et un lien vers l'article, jamais son texte (les droits des journaux) ;
  2. **les soirées et les événements** : OpenAgenda (l'agenda ouvert où publient les villes, les offices de tourisme et
     les associations ; une clé gratuite, `OPENAGENDA_API_KEY`, créée et rangée dans Vercel) ; les vidéos YouTube récentes qui
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
| **D0** ✅ (section 14 ; attend la clé YouTube) | « Tes passions » (l'écran, `passions.json`) ; la sélection YouTube de chaque nuit ; la page d'administration de la sélection | la clé YouTube |
| **D1** ✅ (section 15) | Ma télé du jour, seul, dans ma pièce : regarder, suivante, garder (la vidéothèque de ma maison), envoyer à un proche | D0, Ma maison |
| **D1b** ✅ (section 16) | Ma télé du jour dans l'onglet Découvrir ; le retrait de l'ancienne page (section 11) | D1 |
| **D2** | Le moteur à N places (le contrat `salon.ts`) ; inviter des proches ; la télé synchronisée | D1 |
| **D2b ⭐** | Jamais seul devant une vidéo (4.5) : les réactions notées à la seconde (implicites, gestes, écrit, voix), rejouées par les figurines de mes proches ; « 📷 Ta figurine fait ta tête » ; le clip « Nos réactions » | D2 |
| **D2c** | Les expressions du visage de chaque figurine (sourire, rire, surprise, bof, grimace), faites une fois | D2b, l'essai des poses |
| **D3 + D4** | Les salons ouverts (instances de 8, présence, écrire, gestes, mèmes, la télé du thème) **avec** la modération et la sécurité | D2 |
| **D5** | L'étagère des salons, « Mes salons » dans ma maison, « Ajouter en proche » depuis un salon | D3 |
| **D6** | Les liens TikTok et Instagram collés sur la télé | D1 |
| **D7** | 🗞️ Les potins de ma ville : la presse locale, OpenAgenda, YouTube ; le salon par ville ou par département ; « J'ai vu… » et « Une soirée, un événement » ; les événements gardés comme rendez-vous | D3 + D4, la clé OpenAgenda |

Chaque lot : ses essais (route et navigateur, comme le salon du duo), sa section dans ce document, une PR vers `main`.
Avant D0, une **maquette cliquable** : faite le 19 novembre 2026 (section 12).

## 10. Les décisions (le propriétaire, 17 novembre 2026)

- **Le défilement des mèmes et les vœux** : supprimés (section 11).
- **Les douze thèmes** : choisis (section 3).
- **Les places** : 4 dans ma pièce, 8 dans un salon ouvert.
- **Les vocaux dans les salons ouverts** : pas au départ (5.2).
- **La conversation d'un salon ouvert** : gardée 48 h ; les moments de l'étagère restent.
- **La clé YouTube** : créée et rangée dans Vercel (`YOUTUBE_API_KEY`).
- **« 📷 Ta figurine fait ta tête »** : permise aux 15-17 ans avec le même accord (rien n'est filmé ni gardé, seulement
  la réaction) ; le réglage « Mes réactions dans les clips de mes proches » : allumé par défaut, éteint pour les 15-17
  ans (4.5).
- **Les potins de ma ville** : un salon de ville à partir d'une vingtaine d'inscrits, sinon le département ; la clé
  OpenAgenda créée et rangée dans Vercel (`OPENAGENDA_API_KEY`).

**Plus rien n'attend le propriétaire avant la maquette et D0.**

**L'ordre décidé le 18 novembre 2026** : d'abord **finir la messagerie** (le salon du duo, lots S3 à S8 :
`salon-du-duo.md`, section 9), puis **Ma maison** (`ma-maison.md`, M2 et la suite), puis Découvrir (la maquette, puis
D0 et la suite) — D1 a besoin de Ma maison (ma pièce et sa télé).

## 11. Ce qu'on retire de l'ancienne page (décision du propriétaire, 17 novembre 2026)

**Le défilement des mèmes en plein écran et les vœux sont supprimés.** Pour que l'onglet ne reste jamais vide, on les
retire **dans la PR qui met la nouvelle page dans l'onglet** : l'ancienne page part, ma télé du jour arrive. **Fait le
19 novembre 2026 (le lot D1b, section 16).**

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
  de l'ancienne page ; **le propriétaire enregistrera les nouvelles** (jamais de voix de synthèse) : réécrites, elles
  s'affichent sans voix en attendant (section 16).

Ce qui reste :
- **`sesDixHuitAns`** (dans `voeu-serveur.ts`) sert ailleurs (le catalogue des pièces, `salon-serveur.ts` ; la
  séparation des 15-17 ans ici) : on le **déplace** dans un fichier à lui avant d'effacer `voeu-serveur.ts` (fait :
  `majorite-serveur.ts`) ;
- **la table `clik_voeu`** (`supabase/migrations/20261111090000_clik_voeu.sql`) : on ne l'efface pas tout de suite (une
  migration qui la supprime viendra un mois plus tard, une fois sûr que rien ne la lit plus) ;
- **les mèmes** eux-mêmes : on les crée toujours (« Créer »), on les envoie à ses proches, on les joue dans les salons ;
  seul le défilement des mèmes d'inconnus disparaît.

## 12. La maquette cliquable (19 novembre 2026)

Une page privée du propriétaire : `https://claude.ai/artifact/9KcRDhzyFm1z4BNetdnf4y` ; sa source :
`docs/univers/maquettes/decouvrir.html` (à ouvrir dans un navigateur, à la largeur d'un téléphone). Les figurines y
sont dessinées (aucune vraie tête), les vidéos aussi (dans l'appli, c'est le lecteur officiel de YouTube) ; rien ne part.

Ce qu'on y joue :

- **« Tes passions »** (3.) : les douze vignettes, de 3 à 5, « 🗞️ Les potins de Dax : pour tout le monde, en plus ».
- **L'accueil** : la carte « Ma télé du jour » (la pièce, la télé allumée, « 🎬 3 vidéos t'attendent », « Sam, Léa et 2
  proches en ont déjà vu : ils regarderont avec toi »), la phrase de communication, les salons de mes passions, les
  potins de ma ville, les autres salons.
- **Ma télé du jour, dans ma pièce** (4.2, 4.5) : ma figurine au centre ; Sam, Léa et Noé assis, « a vu hier soir »,
  qui réagissent **à la seconde** où ils ont réagi (le sourire, « Il va tirer de là ?! », le « oh ! », le saut au but,
  « NOOON 😱 », la voix de Sam) ; Inès en petite tête au bord de la télé ; les réactions de chacun en points sur la
  ligne du temps. Les gestes sans viser (un toucher : je ris ; deux : un ❤️ ; appui long : « oh ! »), écrire à la
  seconde, 🎙️ ma voix ; ce que l'appli comprend seule (passer avant 15 s : « bof » ; revenir en arrière : « oh ! » ; aller
  au bout : ❤️). La troisième vidéo, que personne n'a vue : « Tu l'ouvres en premier : tes réactions attendront tes
  proches ».
- **Réagir soi-même** (ajouté après le premier essai du propriétaire, le 19 novembre : « je ne saisis pas comment je
  fais pour réagir moi-même ») : la rangée « Réagis : 😂 ❤️ 😮 😱 😴 » sous la télé, à côté des gestes sans viser ; sur
  ma figurine, « 😂 noté à 0:07 » ; les premières fois, « Sam, Léa, Noé et Inès le verront à cette seconde ».
- **👀 « Ce que Sam verra »** (à la fin de la vidéo) : la vidéo rejouée du côté de Sam — Sam au centre, ma figurine
  (« Alex ») assise à côté, qui réagit à mes secondes. **Décidé par le propriétaire (19 novembre 2026)** : si Sam l'a
  déjà vue, une notification « 🎬 Alex a regardé « … » : revois-la avec ses réactions » (sinon, mes réactions ne lui
  parviendraient jamais) ; si Sam ne l'a pas encore vue, ma figurine l'attend simplement à côté.
- **Partager le moment comme si on était ensemble** (section 13) : 🫶 « En même temps que Léa ! », ↩ répondre à la
  réaction d'un proche en le touchant, 📌 garder le moment partagé, 💬 « Ce qui s'est dit » sur la vidéo, les vocaux
  qu'on choisit d'écouter.
- **📷 « Ta figurine fait ta tête »** : l'écran d'accord, la pastille, ma figurine qui refait ma tête aux moments forts
  (imitée dans la maquette).
- **👥 Inviter** (4.3) : trois proches au plus ; ce qu'ils reçoivent ; ceux qui sont là entrent et s'assoient « en
  direct », les autres gardent l'invitation (et leurs réactions d'avant restent assises).
- **🎬 « Nos réactions »** : le clip de 10 secondes (ma pièce, nos figurines au moment le plus fort, la phrase, le carton
  titre et chaîne, ClikMe et clikme.fr), « Partager ».
- **Un salon ouvert** (5.) : le salon du foot · 2 (le premier est complet), 8 places, ma figurine entre et s'assoit,
  « Bienvenue 👋 », la conversation qui vit, les gestes entre figurines, la télé du thème à la même seconde pour tous,
  **le stade** au but (« 🏟️ 214 l'ont vu aujourd'hui »). Toucher une figurine : son prénom, ses passions, 👋 👏 😂,
  « 👯 Ajouter en proche », « 🏠 Voir sa maison » (ou « fermée aux visites »), « Ne plus voir », « Signaler ». Écrire :
  un lien, un numéro, un réseau, un mot ou une question personnelle ne partent pas. 💬 la conversation (48 h), 🗄️
  l'étagère du salon (📌 Garder : il va dans ma maison, et le fanion s'accroche à mon mur).
- **🗞️ Les potins de Dax** (5.4) : la télé du salon passe la presse locale ; « 📰 Aujourd'hui » (la presse, les
  soirées, les vidéos, les mèmes d'« Autour ») ; « 📅 À venir » (📌 Garder : mon prochain rendez-vous, « On y va ? » à un
  proche) ; « J'ai vu… » et « Une soirée, un événement » (relus avant d'apparaître ; une soirée tournée vers l'alcool est
  refusée).
- **⚙︎ Les réglages de la maquette** : voir Découvrir comme un adulte ou à 15-17 ans (les salons à part, sans le salon
  des jeunes parents, les potins en lecture seule, les clips éteints par défaut) ; recommencer depuis « Tes passions ».

## 13. Partager le moment, comme si on était ensemble (19 novembre 2026)

Le constat du propriétaire, après la maquette : « voir que untel a mis un smiley à 4 min 32 ne va pas créer
d'émulation ». Trois pistes ont été jouées ; **ses décisions** :

- **Pas de défi** (« ne pas rire ») : « trop enfantin ». **Pas de score** (« Avec qui tu ris le plus », « même humour à
  78 % ») : « l'intérêt doit être plutôt le partage du moment, comme si on était ensemble ».

Ce que la maquette joue maintenant :

1. **🫶 Au même moment** : réagir à la même seconde qu'un proche (à 1,8 s près) : « 🫶 En même temps que Léa ! », les
   deux figurines se tapent dans la main. Aucun compte. À la fin : « À 0:21, vous avez réagi ensemble : toi, Sam, Léa,
   Noé et Inès » — **📌 Garder ce moment** : il va sur mon étagère (Ma maison) et dans nos salons du duo.
2. **↩ Répondre à un proche, au moment même** : toucher sa figurine (« À 0:11 : « Il va tirer de là ?! » ») ; « 😂 Trop
   drôle », « 😱 Grave ! », « 🙌 Pareil » ou trois mots ; ce proche verra ma réponse à cette seconde, juste après sa
   réaction, et reçoit « Alex t'a répondu ». Une conversation à travers le temps, accrochée à la vidéo.
3. **💬 Ce qui s'est dit** (en haut de « Ma télé » et à la fin) : toute la conversation de la vidéo, à ses secondes
   (réactions, mots, réponses, vocaux) ; toucher une ligne revoit le moment ; ce qui vient plus loin reste caché
   (« 🔒 3 réactions plus loin dans la vidéo »).
4. **🎙️ Les vocaux (décidé par le propriétaire)** : **la vidéo ne s'arrête jamais toute seule** (« sinon elle s'arrête
   tout le temps si quelqu'un est bavard ») : « 🎙️ Sam t'a laissé un vocal — ▶ Écouter » ; l'écouter met la vidéo en
   pause le temps du message, puis elle reprend ; sinon, il attend dans « 💬 Ce qui s'est dit » (« ▶ Écouter »). **Quand
   je laisse un vocal**, la vidéo se met en pause pendant que je parle et reprend quand je relâche.
5. **🎭 Sa vraie tête** (proposé, sans avis encore) : avec « 📷 Ta figurine fait ta tête », le mouvement de sa tête
   quelques secondes (des chiffres, jamais une image), rejoué par sa figurine (au but : la tête qui part en arrière, les
   bras levés, le fou rire). Il faut, pour l'appli, les expressions de chaque figurine (D2c).

**📺 Le grand écran** (le propriétaire, 19 novembre : « l'écran de la télé ne va-t-il pas être trop petit pour voir les
vidéos ? ») : par défaut, la télé prend **toute la largeur du téléphone** (la vidéo en 16/9, 390 points au lieu de 246),
la pièce et les figurines juste dessous ; « 🛋️ Voir la pièce » la remet dans son meuble, « ⛶ Grand écran » l'agrandit
(seulement pour ce moment : on revient toujours en grand écran). Pareil dans les salons ouverts. Plus grand encore, plus tard : le téléphone tourné en largeur (la
vidéo plein écran, les figurines en petit sur le bas de l'image).

**Dans les salons ouverts** (même retour du propriétaire : « je n'ai aucun moyen de réagir si ce n'est écrire ») : la
rangée « Réagis : 😂 ❤️ 😮 😱 👏 », et un ou deux autres du salon réagissent avec moi ; et « 💬 La conversation du
salon » montre tout ce qui s'est dit **avant mon arrivée** (gardé 48 heures), puis depuis que je suis là.

## 14. Le lot D0 : ce qui est fait (19 novembre 2026)

**« Tes passions »** — l'adresse d'essai `/univers/passions` (que la nouvelle page Découvrir ouvrira la première fois, au
lot D1, et plus tard « Moi ») : les douze vignettes (onze avant 18 ans : le salon des jeunes parents est réservé aux
adultes, d'après `<habitant>/majeur.json`), un toucher par passion, « 3 sur 5 », « 5 au plus : enlève-en une d'abord »,
« C'est parti » (de 3 à 5) : « C'est noté ». Rangé dans `<habitant>/passions.json` = { passions, poids, le } ; les poids
d'avant restent quand on change d'avis. `GET`/`POST /api/direct/passions`.

**La sélection de la nuit** — `/api/cron/decouvrir-selection`, à 2 h 7 UTC (`vercel.json`), 280 secondes au plus :
pour chaque thème, ses trois recherches YouTube (`search.list` : `regionCode=FR`, `relevanceLanguage=fr`,
`videoEmbeddable=true`, publiées dans les sept derniers jours ; `safeSearch=strict` pour les 15-17 ans, `moderate`
sinon), mêlées une à une, puis `videos.list` : on ne garde que les vidéos publiques, lisibles ailleurs, ni en direct ni à
venir, entre 30 secondes et 20 minutes, dont le titre ne parle pas d'alcool ; quinze par thème. 12 thèmes pour les
adultes, 11 pour les 15-17 ans : 69 recherches, environ 6 900 des 10 000 unités du jour. Rangé dans
`decouvrir/selection/<jour>/<thème>[-jeunes].json`. Une panne de YouTube : la sélection d'avant reste, l'erreur est
notée (et visible dans l'administration). Le serveur : `selection-serveur.ts` ; les thèmes et leurs recherches :
`decouvrir.ts`.

**L'administration** — `/admin/humain/decouvrir` (lien dans l'admin) : la sélection du jour par thème, « Adultes » /
« 15-17 ans », chaque vidéo (sa vignette, son titre, sa chaîne, sa durée) ; **Retirer** (elle disparaît de toutes les
télés du jour, et ne revient plus les nuits suivantes : `decouvrir/retirees.json`) ; **Ajouter** par son lien (en tête
du thème, pour les deux variantes ; elle reste quand le thème est refait) ; **↻ Refaire** un thème, ou tous. Sans la
clé, la page le dit.

**Ce qui attend le propriétaire : la clé YouTube.** Dans Google Cloud : un projet, l'API « YouTube Data API v3 »
activée, une clé d'API restreinte à cette API ; puis dans Vercel (Settings › Environment Variables) :
`YOUTUBE_API_KEY`. Ensuite, la sélection se fait chaque nuit, ou tout de suite depuis l'administration (« ↻ Refaire tous
les thèmes »). Jamais la clé dans la discussion.

**Les essais** : `scripts/essai-decouvrir-route.mjs` (33 contrôles : les passions — sans compte, 15-17 ans, de 3 à 5,
les jeunes parents ; la nuit — 23 sélections, 69 recherches et leurs filtres, quinze vidéos, ni bière, ni 45 minutes, ni
vidéo qui ne se lit pas ailleurs ; l'administrateur — retirer, ajouter, refaire) et `scripts/navigateur/tes-passions.mjs`
(19 contrôles : l'écran sur iPhone ; la page d'administration). Le faux YouTube est dans le faux Supabase
(`YOUTUBE_API_BASE_URL`) : rien ne part chez Google.

**Ensuite : D1** — ma télé du jour, seul, dans ma pièce (le lecteur officiel de YouTube dans la télé de Ma maison, en
grand écran ; suivante, garder, envoyer à un proche), qui remplace l'ancienne page Découvrir (section 11).

## 15. Le lot D1 : ma télé du jour (19 novembre 2026)

**L'adresse d'essai `/univers/tele`** (pensée pour le téléphone ; dans les essais, l'administrateur seul, comme les autres
adresses d'essai de l'univers). Depuis le lot D1b (section 16), c'est aussi l'onglet Découvrir de l'appli.

**Ce qu'on y fait** :
- **Pas encore de passions** : « Tes passions » d'abord (l'écran du lot D0), puis la télé.
- **La télé en grand écran** (section 13) : toute la largeur, en 16/9, avec le lecteur officiel de YouTube
  (`youtube-nocookie.com`, chargé une fois : `chargerYouTube`, `tele-duo.tsx`). « ▶ Allumer la télé » est le geste qui
  donne le son sur iPhone ; ensuite, les vidéos passent dans le même lecteur. Dessous, **ma pièce** (le panorama de Ma
  maison, centré sur ma figurine) et **ma figurine assise** ; sans pièce choisie, ma figurine seule.
- En haut : « 🎬 40 vidéos t'attendent », le thème de la vidéo (« ⚽ Foot et sport ») ; dessous : son titre, sa chaîne,
  sa durée.
- **⏭ Suivante** ; une vidéo finie : la suivante arrive toute seule. Une vidéo qui refuse d'être lue hors de YouTube :
  « Celle-ci ne se lit pas ici : la suivante arrive ».
- **📌 Garder** : elle va à la télé de ma maison (« Ajouter chez moi », un clip avec son lien YouTube et « Vu sur ma télé
  du jour · la chaîne ») : « 📌 Gardée : elle est à la télé de ta maison », puis « Déjà chez toi ».
- **📤 Envoyer à…** : la liste de mes proches (ceux qui m'ont ajouté aussi) ; un toucher : un message écrit dans notre
  conversation (« 🎬 le titre » et son lien), **mis sur la télé de notre duo** (`mettreALaTele`), et la notification
  habituelle (« 🔗 Léa t'a envoyé un lien ») : « 📤 Envoyée à Sam : elle passe sur votre télé ».
- **🛋️ Voir la pièce** : la vidéo glisse dans la télé de ma pièce (sa zone relevée, `emplacements.tele`), le même
  lecteur, sans s'arrêter ; **⛶ Grand écran** : elle en ressort. On arrive toujours en grand écran.
- À la fin : « Tu as tout vu pour aujourd'hui. Ta télé se remplit chaque nuit : reviens demain. » ; avant la première
  sélection : « Ta télé s'allume bientôt ».

**Ce qui m'attend** (`tele-du-jour-serveur.ts`) : les sélections de la nuit de mes passions — celles des 15-17 ans si je
n'ai pas déclaré mes 18 ans, jamais le salon des jeunes parents avant —, celles de la veille tant que la nuit n'est pas
passée ; **mêlées** par un tourniquet pondéré (`melanger`, `tele-du-jour.ts`) : chaque thème avance de sa part (1 au
départ, entre 0,3 et 3), celui qui est le plus en avance passe une vidéo ; les thèmes que je regarde le plus reviennent
plus souvent, sans faire disparaître les autres. Sans doublon, sans ce que j'ai vu (les 400 dernières), 40 au plus.

**Les poids** (dans `<habitant>/passions.json`, un simple compte, bornés de −5 à 12) : regardée jusqu'au bout, +1 ;
gardée, +2 ; passée avant 15 secondes, −1 ; illisible : rien. Ce que j'ai vu : `<habitant>/tele-du-jour.json`.

**La route** : `GET /api/direct/tele-du-jour` → `{ tele }` ; `POST { action: "vue", id, fin?, secondes?, illisible? }`,
`{ action: "garder", id }`, `{ action: "envoyer", id, a }`. Une vidéo qui n'est pas à ma télé (aujourd'hui ou hier,
dans mes passions) : 404 — on ne garde ni n'envoie autre chose.

**Les essais** : `scripts/essai-tele-du-jour-route.mjs` (25 contrôles : sans compte, sans passions ; quarante vidéos de
mes passions, mêlées dès les trois premières ; vue, passée, illisible ; le foot très regardé revient plus souvent ;
garder, deux fois, une vidéo étrangère ; envoyer à Sam — le message, leur télé, Sam la voit — et à Max, qui n'est pas
un proche ; Noé, 15 ans) et `scripts/navigateur/tele-du-jour.mjs` (29 contrôles, sur iPhone, avec un faux lecteur de
YouTube : le grand écran en 16/9, la pièce et la figurine, allumer, suivante, finie, garder, envoyer, voir la pièce).

**En ligne, il faut** : que Supabase soit de nouveau ouvert (bridé depuis le 19 novembre, `reprise.md`), la clé
`YOUTUBE_API_KEY` rangée dans Vercel, et une première sélection (la nuit, ou « ↻ Refaire tous les thèmes » dans
`/admin/humain/decouvrir`).

**Ensuite** : l'onglet Découvrir et le retrait de l'ancienne page (le lot D1b, section 16) ; puis D2 (inviter des
proches, la télé synchronisée).

## 16. Le lot D1b : l'onglet Découvrir, et l'ancienne page qui part (19 novembre 2026)

Le propriétaire, le 19 novembre : « tu peux faire : l'onglet Découvrir (et le retrait de l'ancienne page : les mèmes en
plein écran et les vœux) ».

**L'onglet** (`ma-collection.tsx`, `#decouvrir`) : `TeleDuJourEcran` en mode onglet (`onglet`) — sous la barre du haut,
sans prendre tout l'écran ; la note (« 📌 Gardée… ») et la feuille « Envoyer à… » passent devant le menu du bas. Pas
encore de passions : « Tes passions » d'abord, là aussi (son bouton « C'est parti » au-dessus du menu).

**Ce qui est parti** (section 11) : `app/collection/decouvrir.tsx` (le fil, la carte du mème du jour, « Les univers à
visiter » — ils sont dans Ma maison depuis M4) ; `app/collection/voeu.tsx`, `lib/direct/voeu.ts`, `voeu-serveur.ts`,
la route `/api/direct/voeu` ; les tâches `/api/cron/voeu-soir` et `voeu-soir-ete` (et leurs lignes dans `vercel.json`) ;
la mission dans la notification de 11 h 30 ; « Mes vœux » et le badge « 🌟 A exaucé » dans Moi ;
`scripts/navigateur/voeu.mjs`. Et, puisque le fil des mèmes de la ville n'existe plus nulle part : « 🌍 Poster sur le fil
de ta ville » et « 🔥 Poster ma réponse (visible par les gens de Dax) » dans « Créer », « 🌍 Montrer dans Découvrir »
dans « Mes mèmes » (le serveur garde ses règles, `action: "public"`, mais aucun écran ne s'en sert).

**Ce qui a changé de place** :
- **Le mème du jour** : la notification de 11 h 30 (`#jour`) ouvre **« Créer » sur le thème du jour** (son titre, ses
  trois idées), l'adresse restant `#jour` (`versLeStudio(…, { garderAdresse: true })` — sans lui, l'adresse passait à
  `#figurine` et revenait à `#jour`, sans fin). L'appli posée sur l'écran d'accueil, à sa première ouverture : « 🔔
  Dernière étape : le mème du jour » est là, sur le thème du jour.
- **Les anciens liens** `#voeu`, `#mission`, `#reponses` : « Découvrir ».
- **L'étape « ✨ Faire un vœu »** (un cadeau de ClikMe, `etapes.ts`) devient **« 📺 Choisir tes passions »** (elle mène
  à Découvrir) ; ceux qui avaient fait un vœu, ou répondu à trois questions du jour, la gardent.
- **L'humeur douce** (tristesse, colère, « oh non ») : le geste « ✨ Faire un vœu » devient « 💬 Écrire à un proche » ;
  deux phrases qui parlaient de vœu sont réécrites (« Un proche peut peut-être aider. Un petit mot ? » ; « Si ça peut
  aider, écris à un proche. Sinon, je reste là. ») ; une réponse gardée avec l'ancien geste est relue avec le nouveau.
- **Ses 18 ans** : `majorite-serveur.ts` (`sesDixHuitAns`, `direSesDixHuitAns`) ; ils se lisent aussi dans
  `<habitant>/adulte.json` (déclaré pour ouvrir son univers à tous). La question « As-tu 18 ans ? » n'a plus d'écran
  (elle était dans « Mon vœu ») : sans réponse, le salon des jeunes parents reste caché. À reposer, si besoin, dans
  « Tes passions ».
- **Le tuto** : les trois bulles de Découvrir sont réécrites pour la télé (`tuto.tsx`) ; elles s'affichent sans voix
  jusqu'à ce que le propriétaire enregistre **`tuto-decouvrir-tele-1`**, **`-2`** et **`-3`** :
  1. « Ici, c'est ta télé du jour : les vidéos de tes passions, choisies pour toi chaque nuit. »
  2. « Pas pour toi ? « Suivante ». Elle te plaît ? « Garder » : elle va à la télé de ta maison. »
  3. « Et pour la partager, « Envoyer à… » un proche : elle passe sur votre télé, dans votre salon. »

**Ce qui reste** : la table `clik_voeu` (une migration la supprimera un mois plus tard) ; ce que la figurine du mois lit
des vœux du mois (rien de neuf ne s'y ajoute) ; les mèmes eux-mêmes, envoyés aux proches et joués dans les salons.

**Les essais** : `tele-du-jour.mjs` (l'onglet : la télé en grand écran sous la barre du haut, la note au-dessus du
menu) ; `meme-du-jour.mjs` réécrit (`#jour` ouvre « Créer » sur le thème, ses trois idées ; les anciens liens ouvrent
Découvrir) ; `appli-notif.mjs`, `humeur-reponse.mjs`, `verifier-humeur.mjs`, `personnage.mjs`, `ma-figurine.mjs`
adaptés.
