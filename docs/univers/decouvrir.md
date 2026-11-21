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
| **D1c** ✅ (section 18) | L'accueil de Découvrir comme la maquette : la carte « Ma télé du jour », la phrase, les salons ouverts | D1b |
| **D2** ✅ (section 19) | La séance chez moi : ma pièce, quatre places, inviter trois proches, la télé synchronisée menée par l'hôte (sur le moteur des salons ouverts) ; restent les vocaux et les mèmes entre proches dans la séance | D1, D3 |
| **D2b ⭐** (1re partie ✅, section 21 ; 2e partie ✅, section 22) | Jamais seul devant une vidéo (4.5) : les réactions notées à la seconde (implicites, gestes, écrit, voix), rejouées par les figurines de mes proches ; « 📷 Ta figurine fait ta tête » ; le clip « Nos réactions » | D2 |
| **D2c** (élargi, section 28 : « 📷 Ta figurine, c'est ton visage », lots V0 à V4) | Les expressions du visage de chaque figurine (sourire, rire, surprise, bof, grimace), faites dès « C'est moi ! » ; ta figurine fait ta tête, en direct, sur toutes les vidéos | D2b, les calques (lot S1) |
| **D3 + D4** ✅ (section 18, avancés par le propriétaire avant D2) | Les salons ouverts (instances de 8, présence, écrire, réagir, gestes, la télé du thème) **avec** la modération et la sécurité ; reste : les mèmes dans un salon ouvert | D1c |
| **D5** ✅ (section 20) | L'étagère des salons (❤️, trois cœurs, « 📌 Garder »), « Mes salons » dans ma maison (des fanions), « 👯 Ajouter en proche » et « 🏠 Voir sa maison » depuis une figurine | D3 |
| **D6** (élargi, section 23.3) | TikTok et Instagram : partager une vidéo vers ClikMe (le menu « Partager » sur Android, coller le lien sur iPhone), lue par le lecteur officiel, en portrait | D1 |
| **D8** ✅ (sections 23.1 et 24) | 📺 Mes chaînes YouTube : suivre jusqu'à 10 chaînes, leurs nouvelles vidéos en premier dans ma télé du jour | D1 |
| **D9** ✅ (sections 23.2 et 26) | ✨ Ma passion à moi : une passion écrite librement, une par personne, cherchée sur YouTube dans un budget par nuit | D0 |
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
  donne le son sur iPhone ; ensuite, les vidéos passent dans le même lecteur. Dessous, **ma pièce** (l'image de Ma
  maison, celle de la messagerie depuis le 20 novembre 2026 : `ma-maison.md`, section 22) et **ma figurine assise** ; sans pièce choisie, ma figurine seule.
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
- **« 🏡 Les maisons à visiter »** (celles ouvertes à tout le monde, le lot M4 de Ma maison ; « Les univers à visiter »
  de l'ancienne page) : sous la télé, dans l'onglet — une rangée de vignettes, un toucher pour entrer.
- **Les mèmes des commerçants** : le serveur les range toujours pour leur ville (`/api/direct/memes-commerces`), avec
  leur page `/meme/<id>` ; aucun écran de l'appli ne les montre plus.
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
Découvrir) ; `appli-notif.mjs`, `humeur-reponse.mjs`, `verifier-humeur.mjs`, `personnage.mjs`, `ma-figurine.mjs`,
`meme-commerce.mjs`, `visite-univers.mjs` (« Les maisons à visiter ») adaptés.

## 17. Les retours du 20 novembre 2026

Le propriétaire : « quand je clique sur la vidéo, ça m'amène sur YouTube ». Quand le lecteur de YouTube (son API) ne
répond pas — un bloqueur, un réseau lent —, la télé du jour affichait « ▶ La regarder sur YouTube ». Désormais, le
lecteur tout simple de YouTube (un cadre, sans cookie : `lecteurYouTube`) joue la vidéo **dans l'écran**, comme la
télé du salon : on reste dans la scène ; jamais un lien qui part sur YouTube.

Et : « ça n'a pas du tout le design de la maquette, aucun salon n'apparaît ». C'est vrai : D1 et D1b ne font que **ma
télé du jour** (section 9). Les salons ouverts sont les lots **D3 + D4** (avec la modération, jamais sans) ; la page
d'accueil de la maquette (la carte « Ma télé du jour », puis « Les salons ouverts » par passion, les potins) viendra
avec eux.

**Les essais** : `tele-du-jour.mjs` (YouTube bloqué : « le lecteur tout simple, dans l'écran », « jamais un lien qui
part sur YouTube »).

## 18. Les lots D1c, D3 et D4 : l'accueil, et les salons ouverts (20 novembre 2026)

Le propriétaire, le 20 novembre 2026 : « ça n'a pas du tout le design de la maquette, aucun salon n'apparaît », puis
« fais la page d'accueil de Découvrir avec la télé du jour, puis les salons, et D3 et D4 aussi ». **D3 et D4 passent donc
avant D2** (le moteur à N places du duo) : un salon ouvert a sa propre scène, plus simple — chacun dans son fauteuil (sa
figurine assise de Ma maison), à l'une des huit places.

**D1c, l'accueil** (`tele-du-jour.tsx`, `AccueilDecouvrir`) — l'onglet Découvrir s'ouvre comme la maquette :
- « Découvrir », « ✎ Tes passions » ;
- **la carte « Ma télé du jour »** : ma pièce cadrée sur la télé et ma figurine, « ● Ta télé est allumée », « 🎬 N vidéos
  t'attendent », les thèmes, « ▶ Regarder » — un toucher ouvre ma télé (et l'allume : ce toucher donne le son) ;
  « ‹ Découvrir » y revient ;
- la phrase : « Regarde tes vidéos avec ceux que tu aimes, même quand ils sont loin. » ;
- **« Les salons ouverts · par passion »** : une carte par salon (son décor, « ● N ici » ou « Personne pour l'instant »),
  les miennes d'abord, puis « Les autres salons » ; sans son âge dit : « as-tu 18 ans ou plus ? » d'abord ;
- dessous, « 🏡 Les maisons à visiter », comme avant.
Les potins de ma ville (5.4) restent pour D7 : ils ne s'affichent pas encore (rien de faux à l'écran).

**D3 + D4, les salons ouverts** (`salons-ouverts.ts` : les règles ; `salons-ouverts-serveur.ts` ; la route
`/api/direct/salons-ouverts` ; l'écran `/univers/salons?theme=foot`, `salon-ouvert.tsx`) :
- **Entrer** : le salon le plus rempli du thème qui a une place (celui où l'on est déjà, si on revient) ; huit places ;
  plein : « Le salon du foot · 2 ». Sa figurine s'assoit sur la première place libre (devant, du milieu vers les bords ;
  puis au fond). Présent : vu depuis moins de 2 min 30 ; le téléphone le redit toutes les 30 s ; partir libère la place.
- **Deux maisons** : `adultes` et `jeunes` (`sesDixHuitAns`) — **elles ne se croisent jamais**, le serveur choisit la
  maison, jamais le téléphone. Le salon des jeunes parents : adultes seulement.
- **Le décor** : une pièce du catalogue par thème (`SALONS` ; le salon pour le foot, la chambre musicale pour la musique,
  la cuisine pour la cuisine…), sinon la première prête. **La télé du salon** : la sélection du jour du thème, en boucle
  depuis minuit (heure de Paris), **à la même seconde pour tous** (`positionTele`, l'heure du serveur) ; « ▶ Allumer la
  télé du salon » ; si le lecteur de YouTube ne répond pas, le lecteur tout simple dans l'écran.
- **L'écran** : la télé en grand (16/9, 680 points au plus), la pièce dessous et ses huit places ; le prénom de chacun
  sous sa figurine (« Toi » pour soi) ; les bulles au-dessus des têtes (6 s), les réactions qui sautent, les gestes qui
  volent d'une figurine à l'autre. Sur un ordinateur : la scène à gauche, réagir et écrire à droite.
- **Écrire** (90 signes), **réagir** (😂 ❤️ 😮 😱 👏), **un geste** à quelqu'un qui est là (👋 👏 😂, en touchant sa
  figurine). Doucement : un message toutes les secondes et demie, douze par minute. **Pas de vocal, pas de photo.**
- **La modération, avant que ça parte** (`refusDuMessage`, le téléphone prévient, le serveur refuse quoi qu'il arrive) :
  ni lien, ni adresse, ni numéro, ni réseau social (snap, insta, tiktok, @…), ni question personnelle (âge, ville,
  « tu habites où », « en privé », « envoie une photo »…), ni gros mot, rien d'alcoolisé — « 🚫 Ce message ne part pas :
  … ». Rien de refusé n'est rangé.
- **Toucher une figurine** : son prénom, « Dans ce salon · prénom et figurine seulement », 👋 👏 😂, « 🙈 Ne plus voir »
  (ses bulles disparaissent, partout ; `<habitant>/salons-caches.json`), « 🚩 Signaler » (quatre motifs).
- **Signaler** : trois personnes différentes en une heure (la même qui signale deux fois compte une fois) : la personne
  quitte les salons ouverts pendant 24 heures — son pouls le lui dit, sa place se libère, elle ne rentre plus.
- **💬 La conversation du salon** : les 48 dernières heures, « Avant ton arrivée », « Depuis que tu es là » ; les
  messages plus vieux s'effacent.
- **L'administration** : `/admin/humain/salons` (lien dans l'admin) — les salons en cours (qui y est, les messages des
  dernières 24 h), les signalements de la semaine (le message en cause), les exclusions ; « 🚫 Exclure 24 h »,
  « ↩ Réintégrer ».
- **Fermer sans déployer** : `CLIKME_SALONS_OUVERTS=0` (les cartes disparaissent, on n'entre plus).

**Le rangement** (aucune table : le seau, un fichier par personne et par message — personne n'écrit le fichier d'un
autre) : `decouvrir/salons/<maison>/<thème>-<n>/presents/<q>.json`, `…/messages/<ms>-<q>-<x>.json`,
`decouvrir/signalements/<q>/…`, `decouvrir/exclus/<q>.json`. `<q>` : l'identifiant court de chacun ; son compte n'est
jamais montré.

**Restaient** : les mèmes joués dans un salon ouvert ; l'étagère du salon, « Mes salons » dans ma maison, « 👯 Ajouter en
proche » et « 🏠 Voir sa maison » depuis une figurine (D5, fait : section 20) ; les potins de ma ville (D7) ; D2 (inviter
des proches devant ma télé, fait : section 19).

**Les essais** : `scripts/essai-salons-ouverts-route.mjs` (57 contrôles : l'accueil et l'âge ; entrer, les deux maisons
séparées ; écrire, huit refus ; réagir, un geste, « doucement » ; ne plus voir ; plein à huit, le deuxième salon, la place
libérée ; trois signalements ; l'administrateur ; les messages de plus de 48 h) et `scripts/navigateur/salons-ouverts.mjs`
(sur un iPhone puis un ordinateur : l'accueil, l'âge, les 15-17 ans, entrer, la télé, Sam qui entre et écrit, un refus,
une bulle, une réaction, la fiche, un geste, signaler, la conversation, ne plus voir) ; `tele-du-jour.mjs` passe par la
carte de l'accueil.

## 19. Le lot D2 : la séance chez moi (20 novembre 2026)

Le propriétaire, le 20 novembre 2026 : « D2 et D5 ». **La séance passe par le moteur des salons ouverts** (section 18),
pas par le moteur du duo (`salon.ts`) : la même scène simple — chacun dans son fauteuil, sa figurine assise — dans **ma
pièce** de Ma maison, à **quatre places** (moi et trois proches). Le moteur du duo garde ce qui lui est propre (le
talkie, les mèmes joués, les cadres) ; les apporter dans la séance reste à faire.

- **Y aller** : « 👥 Regarder avec mes proches », sous ma télé du jour (Découvrir) → `/univers/salons?chez=moi`. Ma
  pièce (sinon le salon du catalogue), « 🏠 Chez Léa », moi à la place du milieu. **Ma télé est prête** : la première
  vidéo de ma télé du jour passe (si rien ne passait depuis six heures).
- **👥 Inviter** (en haut, l'hôte seulement) : mes proches **des deux côtés** (`seParlent`), **trois au plus**. Chacun
  reçoit une notification (« 🎬 Léa t'invite devant sa télé », une par proche toutes les dix minutes au plus) et, **tout
  en haut de Découvrir**, la carte « Venir » / « Pas maintenant ». L'invitation tient **six heures** ; sans elle, on
  n'entre pas (ni la page, ni le pouls).
- **La télé menée par l'hôte** : sous la télé, ❚❚ Pause / ▶ Reprendre, ⏭ Suivante, 📺 Choisir (sa télé du jour). Chez
  l'hôte, tout de suite (sans attendre le serveur) ; chez ses proches, au pouls suivant (4 s au plus). L'état :
  `tele.json` `{ video, depart, pause?, n }` — chacun calcule la seconde (`positionSeance`, l'heure du serveur), se recale
  au-delà de **deux secondes** d'écart, et repart s'il s'est arrêté sans que l'hôte l'ait voulu. Chez les invités, le
  lecteur n'a pas de commandes : « C'est Léa qui mène la télé. » Finie : chez l'hôte, la suivante.
- **Entre proches** : les bulles, 😂 ❤️ 😮 😱 👏, les gestes — **rien n'est relu** (comme leur conversation : pas vide,
  90 signes), **rien ne se signale**, pas de « Ne plus voir ». La conversation (💬) reste à ceux qui sont invités.
- **Les salons ouverts fermés** (`CLIKME_SALONS_OUVERTS=0`) : la séance reste possible, l'accueil montre encore les
  invitations.

**Le rangement** : `decouvrir/salons/prives/chez-<q de l'hôte>/` — `presents/`, `messages/` (comme un salon ouvert),
`invites/<q>.json` (qui peut entrer, et depuis quand), `tele.json` ; chez l'invité, `<habitant>/invitations-tele/<q>.json`.
(La section 4.3 prévoyait `salons-prives/<h>/tele.json` : le dossier suit celui des salons ouverts.)

**La route** (`/api/direct/salons-ouverts`) : `entrer-chez` (`chez` : « moi » ou la clé de l'hôte), `tele` (`quoi` :
video, suivante, pause, jouer), `inviter` (`cles`), `pas-maintenant` (`cle`) ; le pouls d'une séance rend aussi `seance`.

**Restent** : les vocaux et les mèmes entre proches dans la séance ; D2b (jamais seul devant une vidéo, 4.5).

## 20. Le lot D5 : l'étagère des salons, « Mes salons », ajouter en proche (20 novembre 2026)

- **❤️ Aimer** : dans un salon ouvert, toucher la bulle de quelqu'un (🤍 → ❤️), ou le cœur d'une ligne de 💬. Un cœur par
  personne et par message (`…/<salon>/aimes/<message>-<q>.json`) ; ses propres mots ne s'aiment pas.
- **🗄️ L'étagère du salon** (en haut) : un message **aimé par trois personnes** y monte, **sans limite de temps**
  (`decouvrir/salons/<maison>/etageres/<thème>/<message>.json` — une étagère par thème, dans chaque maison : les 15-17
  ans ont la leur). « 📌 Garder » : il va **dans ma maison**, sur mon étagère (« « Quel but ! » », Le salon du foot · Ana ;
  les douze ajouts du jour comptent).
- **🏠 Mes salons** : chaque entrée dans un salon ouvert le note (`<habitant>/mes-salons.json`, une fois par heure) ; ma
  maison montre **les six plus récents en fanions** (en haut à gauche, chez moi seulement — pas en visite), un toucher
  ramène au salon.
- **La fiche d'une figurine** (salon ouvert) : **ses passions** ; « **👯 Ajouter en proche** » ; « **🏠 Voir sa maison** »
  si elle est ouverte à tous (sinon « Sa maison est fermée aux visites ») ; puis « Ne plus voir », « Signaler ».
- **👯 Ajouter en proche** : la demande part (`decouvrir/demandes/<habitant>/<q>.json`), avec une notification ; elle
  attend **tout en haut de Découvrir** (« 👯 Ben (Le salon du foot) veut t'ajouter en proche » — « Accepter » / « Non
  merci ») sept jours. Accepter : **proches des deux côtés**, leur conversation s'ouvre dans « Proches ». Deux demandes
  croisées : proches tout de suite. **Dix demandes par jour** au plus.

**La route** : `aimer` (`salon`, `message`), `GET ?etagere=<salon>`, `garder` (`salon`, `moment`), `proche` (`salon`, `q`),
`repondre-proche` (`q`, `oui`) ; l'accueil rend `invitations` et `demandes`. **Ma maison** (`/api/direct/ma-piece`) rend
`salons`.

**Les essais** : `scripts/essai-salons-seance-route.mjs` (47 contrôles : la séance, ses portes fermées, inviter — proches
seulement, trois au plus —, l'invitation, venir, la télé menée par l'hôte, entre proches ; l'étagère, garder, la fiche,
« Mes salons », la demande, l'accepter, les demandes croisées, la limite du jour) et `scripts/navigateur/salons-seance.mjs`
(sur des iPhone : « 👥 Regarder avec mes proches », inviter Sam, sa carte « Venir », la pause et la suivante qui passent
chez lui, un lien entre proches ; ❤️ sur une bulle, l'étagère, garder, la fiche d'Ana, la demande acceptée, le fanion).

## 21. Le lot D2b, première partie : jamais seul devant une vidéo (20 novembre 2026)

Le propriétaire, le 20 novembre 2026 : « on peut faire le premier de ta liste, D2b ». **La fonction phare** (4.5, 12 et 13) :
mes proches qui ont vu la vidéo avant moi sont assis à côté de moi et réagissent à la seconde où ils ont réagi. Cette
première partie fait **les réactions** ; viennent ensuite écrire et parler à la seconde, répondre à un proche, « 💬 Ce
qui s'est dit », la notification « revois-la avec ses réactions » (deuxième partie), « 📷 Ta figurine fait ta tête »
(troisième), le clip « 🎬 Nos réactions » (quatrième).

- **Réagir** (sous la télé du jour, `tele-du-jour.tsx`) : « Réagis : 😂 ❤️ 😮 😱 😴 » — un toucher, la réaction à la seconde
  où en est le lecteur (`getCurrentTime`) ; ma figurine la joue (rire : la tête qui sautille ; ❤️ : elle bat ; 😮 😱 : un
  sursaut ; 😴 : elle somnole) et l'emoji jaillit. Les deux premières fois : « 😂 noté à 0:42 : Sam et Léa le verront à
  cette seconde ». La rangée attend que la télé soit allumée ; avec le lecteur tout simple (YouTube ne répond pas), la
  seconde n'est pas connue : on ne note rien.
- **Les gestes sans viser**, sur la pièce (sous la télé) : un toucher → 😂 ; deux (à 0,32 s près) → ❤️ ; un appui long
  (0,52 s) → 😮. « Un toucher sur la pièce : tu ris · deux : ❤️ · appui long : 😮 » rappelle comment.
- **Ce que l'appli comprend seule** (`implicite`) : passée avant 15 s → 😴 à ce moment ; revenir en arrière de plus de 3 s →
  😮 au début du passage revu (une fois toutes les 10 s au plus) ; vue jusqu'au bout → ❤️ à la fin. La réaction part
  avant « vue », pour que les deux ne s'effacent pas.
- **Mes proches devant ma télé** : à l'ouverture d'une vidéo, un seul appel (`GET ?reactions=<id>`) rend ceux de mes
  proches **des deux côtés** qui l'ont vue — leurs réactions à la seconde, quand ils l'ont vue. **Les trois qui ont le plus
  réagi s'assoient à côté de moi** (à gauche, à droite, un peu au fond ; leur figurine assise de Ma maison, leur prénom,
  « a vu hier soir ») ; les suivants (six au plus) passent en petites têtes au bord de la télé. Celui qui l'a vue sans
  réagir s'assoit quand même, silencieux. Au-dessus du titre : « 👥 2 proches l'ont vue : ils regardent avec toi » ; en
  haut de la pièce, la frise de leurs réactions.
- **Le rejouer** : toutes les 250 ms, la seconde du lecteur ; les réactions entre la seconde d'avant et celle-ci sont
  jouées par la figurine de leur auteur (`aJouer`). Un saut (en avant de plus de 1,5 s, ou en arrière) ne rejoue rien.
- **🫶 Au même moment** : je réagis à 1,8 s près d'une réaction d'un proche → « 🫶 En même temps que Sam ! » (une fois par
  proche et par vidéo). Aucun compte, aucun score (section 13).
- **Je l'ai vue** : à « vue » (jusqu'au bout, ou passée), elle est notée pour mes proches, même sans réaction.

**Le rangement** : `decouvrir/reactions/<vidéo>/<q>.json` = `{ vu, reactions: [{ t, sorte, source, le }] }` — `<q>` :
l'identifiant court de chacun (jamais son compte) ; chacun n'écrit que son fichier ; 80 réactions au plus par vidéo ; la
même sorte à moins de 1,2 s de la précédente ne compte qu'une fois (un doigt qui insiste). Seul le serveur les lit, pour
les proches des deux côtés.

**La route** (`/api/direct/tele-du-jour`) : `GET ?reactions=<id>` → `{ proches: [{ cle, prenom, figurine, vu, reactions }] }`
(la figurine des trois qui s'assoient) ; `POST { action: "reagir", id, t, sorte, source? }` → `{ reaction }` ou
`{ ignoree }` ; une vidéo qui n'est pas à ma télé : 404 ; une sorte inconnue, une seconde négative ou au-delà de la fin :
400. « vue » note aussi qu'on l'a vue (après la réponse). Ce qui est commun : `src/lib/direct/reactions-video.ts` ; le
serveur : `reactions-video-serveur.ts`.

**Les essais** : `scripts/essai-reactions-video-route.mjs` (la même vidéo à quatre télés ; les réactions de Sam à la
seconde, la rafale, les refus ; Inès qui la voit sans réagir ; Max, qui n'est pas proche des deux côtés, jamais montré ;
l'ordre ; aucun identifiant de compte ; la réaction implicite ; chacun son fichier) et `scripts/navigateur/tele-ensemble.mjs`
(sur un iPhone, un faux lecteur qu'on avance à la main : Sam et Inès assis, la frise ; Sam qui rit à 5 s ; un saut qui ne
rejoue rien ; revenir en arrière ; « 🫶 En même temps que Sam ! » ; « noté à 0:40 » ; les trois gestes sans viser ;
⏭ Suivante à 3 s).

**Restent** (D2b) : écrire et parler à la seconde, répondre à un proche au moment même, « 💬 Ce qui s'est dit », garder le
moment partagé, la notification « 🎬 Léa a regardé « … » : revois-la avec ses réactions » (deuxième partie) ; « 📷 Ta
figurine fait ta tête » (troisième) ; le clip « 🎬 Nos réactions » (quatrième) ; puis D2c, les expressions du visage.

## 22. Le lot D2b, deuxième partie : une conversation à travers le temps (20 novembre 2026)

Le propriétaire, le 20 novembre 2026 : « oui, enchaîne sur la 2e partie de D2b ». La première partie faisait réagir ; celle-ci
fait **parler, à la seconde** (section 13) : écrire, répondre à un proche au moment même, relire « 💬 Ce qui s'est dit »,
et la notification qui ramène devant la vidéo. Les vocaux et « 📌 Garder ce moment » viendront ensemble (deuxième partie,
suite) : ils touchent l'un au talkie, l'autre à l'étagère.

- **✍️ Écrire à la seconde** (sous « Réagis ») : « Écris à cette seconde… » — la seconde est celle où j'ai **commencé** à
  écrire (le doigt dans le champ), pas celle où j'envoie ; 90 caractères au plus. Ma figurine le dit en bulle ; sa sorte se
  déduit des mots (« haha », « mdr » → 😂 ; « j'adore » → ❤️ ; « oh non » → 😱 ; « c'est nul », « bof » → 😴 ; sinon 😮),
  pour son animation. Les premières fois : « ✍️ Écrit à 0:12 : Sam le lira à cette seconde ». Chez mes proches, ma figurine
  le dit en bulle à cette seconde. Les mêmes mots envoyés deux fois (à 1,2 s près) ne comptent qu'une fois ; des mots
  différents à la même seconde comptent chacun. Entre proches, rien n'est filtré (comme dans le salon du duo).
- **↩ Répondre à un proche, au moment même** : toucher sa figurine assise (ou sa petite tête au bord de la télé) ouvre
  « ↩ Répondre à Sam, à 0:08 » avec ce qu'il a fait (« « Il va tirer de là ?! » », ou son emoji) : « 😂 Trop drôle »,
  « 😱 Grave ! », « 🙌 Pareil » ou trois mots. On répond à sa réaction **qui vient de jouer** (sinon, la dernière avant
  cette seconde) ; toucher un proche ne compte pas comme un rire sur la pièce. Ma réponse est notée **0,6 s après** sa
  réaction : il la verra juste après la sienne, en bulle « ↩ Grave ! ». « ↩ Sam verra ta réponse à cette seconde ». Une
  réponse **n'est montrée qu'à celui à qui elle répond** (les autres proches ne voient pas nos échanges) ; il peut répondre
  à ma réponse : la conversation continue.
- **💬 Ce qui s'est dit** (à côté de « 👥 2 proches l'ont vue », avec le nombre) : toute la conversation de la vidéo, à ses
  secondes — les réactions et les mots de mes proches, les miens, les réponses (« 0:08 Toi ↩ Sam : « Grave ! » », « 0:08
  Léa ↩ à toi : « Grave ! » », en couleur) ; ce que l'appli a compris seule n'y est pas. **Ce qui vient plus loin que là où
  j'en suis reste caché** : « 🔒 3 réactions plus loin dans la vidéo » (la télé éteinte : tout) ; une vidéo **que j'ai déjà
  vue** montre tout. Toucher une ligne revoit le moment (deux secondes avant ; le lecteur y saute, sans que ce saut compte
  comme « revenir en arrière ») ; la télé éteinte, elle s'allume là.
- **🔔 « ↩ Léa t'a répondu »** : à la première réponse de Léa sur une vidéo, Sam reçoit « ↩ Léa t'a répondu » — « À 0:06 de
  « … » : « Trop drôle » » ; un toucher ouvre la vidéo trois secondes avant. **Une fois par proche et par vidéo** (les
  réponses suivantes l'attendent devant la vidéo).
- **🔔 « 🎬 Léa a regardé « … » »** (décidé par le propriétaire le 19 novembre, section 12) : quand Léa a vu une vidéo et y a
  **réagi** (pas seulement ce que l'appli a compris seule), ceux de ses proches qui l'avaient vue avant elle reçoivent
  « 🎬 Léa a regardé « … » — Revois-la avec ses réactions, à la seconde. » (sinon ses réactions ne leur parviendraient
  jamais). Une fois par proche et par vidéo ; pas à celui à qui elle vient de répondre (il a eu « t'a répondu ») ; celui qui
  ne l'a pas encore vue n'a rien : elle l'attend simplement à côté de lui. Sur le téléphone, une notification par vidéo
  (la suivante remplace la précédente).
- **Ouvrir une vidéo déjà vue** : la notification ouvre `/collection?tele=<id>&t=<s>#decouvrir` — Découvrir s'ouvre sur ma
  télé, **cette vidéo en premier** (même déjà vue : elle ne revient pas d'elle-même dans ma télé du jour), la télé attend
  que je l'allume (le geste qui donne le son), puis elle repart à cette seconde. L'adresse se nettoie. Il faut qu'elle soit
  encore dans ma télé (aujourd'hui ou hier).

**Le rangement** : la même fiche `decouvrir/reactions/<vidéo>/<q>.json`, des réactions qui gagnent `texte` (ce qu'on a
écrit), `a` et `repond` (une réponse : la clé du proche, la seconde de sa réaction) ; et `prevenus` / `repondus` (les clés
des proches déjà prévenus — jamais un compte).

**La route** (`/api/direct/tele-du-jour`) : `GET ?reactions=<id>` rend aussi `miennes` et `vue` (déjà vue) ; une réponse d'un
proche n'y est que si elle est pour moi. `GET ?video=<id>` → `{ video }` (même déjà vue ; 404 si elle n'est plus à ma
télé). `POST { action: "ecrire", id, t, texte }` ; `POST { action: "repondre", id, a, repond, texte, sorte? }` (404 : ce
proche n'est pas des deux côtés, ne l'a pas vue, ou n'a rien fait à cette seconde ; 400 : sans mots) → `{ reaction }` ou
`{ ignoree }`. Les notifications partent après la réponse (`prevenirUnHabitantAppli`, celle de Découvrir).

**Les essais** : `scripts/essai-conversation-video-route.mjs` (écrire, la sorte déduite des mots, les doublons, les 90
caractères ; personne de prévenu tant que personne ne l'a vue avant ; répondre et « ↩ Léa t'a répondu » une seule fois ;
les refus ; « 🎬 Léa a regardé… » à Inès, pas à Sam ni à Max, une seule fois ; les réponses montrées à leur destinataire
seulement ; rouvrir une vidéo déjà vue ; répondre à une réponse ; aucun identifiant de compte) et
`scripts/navigateur/tele-conversation.mjs` (sur un iPhone : « 💬 Ce qui s'est dit · 3 » tout caché, la bulle de Sam à sa
seconde, lui répondre « 😱 Grave ! », écrire « haha trop bien » à la seconde où on a commencé, les quatre lignes et le ❤️
caché, revoir le moment ; Sam qui ouvre la vidéo déjà vue depuis la notification, à 0:06, et lit « ↩ à toi »).

**Restent** (D2b) : les vocaux à la seconde et « 📌 Garder ce moment » (deuxième partie, suite) ; « 📷 Ta figurine fait ta
tête » (troisième) ; le clip « 🎬 Nos réactions » (quatrième) ; puis D2c, les expressions du visage.

## 23. Ne rien rater : mes chaînes, ma passion à moi, TikTok et Instagram (20 novembre 2026)

La question du propriétaire, le 20 novembre 2026 : « Est-ce qu'on pourrait pas mettre le thème qui n'existe pas dans les
choix de départ, ou encore les youtubeurs, instagrameurs ou tiktokeurs que l'on suit, pour être certain de ne pas rater
leurs vidéos ? » **Ses décisions** (même jour) : oui aux trois, dans cet ordre — **mes chaînes YouTube** (D8, jusqu'à 10),
**ma passion à moi** (D9, une par personne), puis **TikTok et Instagram par le partage** (D6, élargi) ; suivre
automatiquement un compte TikTok ou Instagram n'est pas possible (23.3).

### 23.1 📺 Mes chaînes YouTube (lot D8)

- **Suivre une chaîne**, de deux façons :
  - dans « ✎ Tes passions », une deuxième partie « 📺 Tes chaînes » : coller le lien d'une chaîne (`youtube.com/@nom`,
    `youtube.com/channel/UC…`), le lien d'une de ses vidéos (on prend sa chaîne), ou taper `@nom` ;
  - **devant une vidéo de ma télé du jour, « 📺 Suivre cette chaîne »** : un toucher — c'est comme ça qu'on découvre
    les créateurs qu'on aimera.
- **10 chaînes au plus** (décision du propriétaire) ; « 10 au plus : enlève-en une d'abord » ; ✕ pour arrêter de suivre.
  Le serveur retrouve la chaîne (`channels.list`, avec `forHandle` ou `id` : 1 unité) et range son nom et son image.
- **Leurs nouvelles vidéos arrivent en premier dans ma télé du jour**, avant la sélection de mes passions, les plus
  récentes d'abord : « 🆕 Nouvelle vidéo de Squeezie · il y a 2 h ». On les garde 7 jours (puis elles s'en vont, vues
  ou non). Sur la carte de l'accueil : « 🆕 2 nouvelles vidéos de tes chaînes ». Pas de notification au départ
  (YouTube prévient déjà ; on pourra en ajouter une, coupable, si le propriétaire la veut).
- **Les aller chercher coûte presque rien** : chaque nuit (la même tâche que la sélection, et tout de suite quand on
  ajoute une chaîne), pour chaque chaîne suivie par au moins une personne, ses dernières vidéos par la liste « mises en
  ligne » de la chaîne (`playlistItems.list` : 1 unité) ; puis `videos.list` (1 unité pour 50 vidéos) pour la durée, le
  droit d'être lue ailleurs, le direct. Mille chaînes suivies : au plus deux mille unités sur 10 000. (Le flux public
  de la chaîne, gratuit, `youtube.com/feeds/videos.xml?channel_id=…`, reste en réserve si le quota venait à manquer :
  il ne passe pas par la clé, et répond moins sûrement à un serveur.)
- **Les mêmes filtres que la sélection**, sauf la durée : lisible ailleurs, ni en direct ni à venir, pas réservée aux
  adultes (YouTube le dit : jamais montrée, à personne), pas d'alcool dans le titre ; **de 60 s à 60 min** (on a choisi
  ce créateur : ses longues vidéos aussi). Les vidéos de moins de 60 s sont souvent des Shorts, en portrait : elles
  viendront avec le portrait (23.3).
- **Les 15-17 ans** suivent qui ils veulent (comme sur YouTube), avec les mêmes filtres.
- **⭐ Jamais seul** marche pareil : mes proches qui suivent la même chaîne et ont vu la vidéo s'assoient à côté de moi.
  Réagir, écrire, garder, envoyer : comme une vidéo de la sélection (`maVideo` les accepte).
- **Le rangement** : `<h>/chaines.json` = `{ chaines: [{ id, nom, image }], le }` ; `decouvrir/chaines/<id>.json` =
  `{ nom, image, videos: [...], le }` (partagé par tous ceux qui la suivent).
- **L'administration** (`/admin/humain/decouvrir`) : les chaînes les plus suivies ; **retirer une chaîne** (elle ne peut
  plus être suivie, ses vidéos disparaissent de toutes les télés : `decouvrir/chaines-retirees.json`).

### 23.2 ✨ Ma passion à moi (lot D9)

- Dans « ✎ Tes passions », sous les douze vignettes : **« ✨ Ta passion à toi »** — un champ (« la pêche à la mouche »,
  « la K-pop », « les trains »). **Une par personne** (décision du propriétaire), **en plus** de mes 3 à 5 passions ; on
  la change quand on veut.
- **Relue avant d'être gardée** (les filtres des salons ouverts : gros mots, alcool, contenu adulte, un lien, un
  numéro) ; de 3 à 40 caractères ; refusée : « Choisis une autre passion ».
- **Ceux qui écrivent la même chose la partagent** : « La pêche », « la peche » et « pêche » donnent la même clé
  (minuscules, sans accents, sans « le, la, les, l' ») — une seule recherche pour tous.
- **La recherche coûte cher** (100 unités ; la sélection des thèmes en prend déjà 6 900 sur 10 000 chaque nuit) :
  - une recherche **tout de suite** quand quelqu'un la choisit (s'il reste de quoi dans la journée), pour qu'elle ne
    soit pas vide ;
  - puis **refaite tous les trois jours**, dans un **budget de 25 recherches par nuit** (2 500 unités) — les passions
    suivies par le plus de monde d'abord, les autres attendent leur tour ;
  - si le budget est souvent plein, l'administration le dit : le propriétaire demande à Google plus de quota (un
    formulaire, gratuit).
- **Les mêmes filtres que la sélection** (30 s à 20 min, lisible ailleurs, pas d'alcool ; `safeSearch=strict` pour les
  15-17 ans, qui ont leur propre recherche).
- **Dans ma télé du jour**, ses vidéos se mêlent à celles de mes passions, avec son propre poids (qui monte et descend
  pareil) ; l'étiquette : « ✨ La pêche à la mouche ». Elle n'a **pas de salon ouvert** (on y serait trop peu) ; si
  beaucoup de monde la partage un jour, elle pourra devenir un thème.
- **Le rangement** : `<h>/passions.json` gagne `perso: { mots, cle }` ; `decouvrir/perso/<cle>[-jeunes].json` =
  `{ mots, videos, le, gens }`.
- **L'administration** : les passions à soi (les mots, combien de personnes, la dernière recherche) ; **refuser des mots**
  (ils disparaissent pour tout le monde, la personne choisit autre chose).

### 23.3 📱 TikTok et Instagram : par le partage (lot D6, élargi)

- **Suivre un compte TikTok ou Instagram n'est pas possible** : ni l'un ni l'autre ne laisse une appli lire les
  dernières vidéos d'un créateur sans que ce créateur se connecte lui-même ; les contourner est interdit par leurs
  règles, et casserait souvent. On ne le fait pas.
- **Ce qu'on fait : partager une vidéo vers ClikMe.**
  - **Sur Android**, l'appli installée apparaît dans le menu « Partager » de TikTok et d'Instagram (le « share target »
    du manifeste de l'appli) : « 📺 Mettre sur ma télé » ou « 📤 Envoyer à un proche ».
  - **Sur iPhone**, Apple ne le permet pas aux applis web : « Copier le lien » dans TikTok ou Instagram, puis dans ma
    télé « 📋 Coller un lien ».
  - La vidéo partagée arrive **en premier dans ma télé du jour** (48 heures), et mes proches la voient s'ils la partagent
    aussi (ou si je la leur envoie).
- **Le lecteur officiel, en portrait** (le constat du propriétaire : « les jeunes regardent davantage les vidéos
  Instagram et TikTok en mode portrait ») : pour ces vidéos, la télé passe en hauteur (toute la hauteur de l'écran, ma
  pièce et les figurines en bas). TikTok : son lecteur intégré, qui dit à quelle seconde on en est (les réactions à la
  seconde marchent) ; Instagram : l'intégration de Meta (avec le jeton de l'application Meta ; sinon une carte qui ouvre
  Instagram), qui ne le dit pas (on réagit sans seconde, comme avec le lecteur tout simple). Les Shorts de YouTube
  passeront aussi en portrait.
- Toujours le lecteur officiel : jamais une vidéo téléchargée (section 2).

**L'ordre** : D8 (mes chaînes) d'abord — le plus utile et le plus sûr —, puis D9 (ma passion à moi), puis D6.

## 24. Le lot D8 : mes chaînes YouTube (20 novembre 2026)

Le propriétaire, le 20 novembre 2026 : « oui, fusionne et commence D8 ». Ce qui est fait (le détail en 23.1) :

- **📺 Suivre une chaîne** :
  - dans « ✎ Tes passions » (`tes-passions.tsx`), la partie « 📺 Tes chaînes · 2 sur 10 » : coller un lien (`@nom`,
    `/channel/UC…`, le lien d'une de ses vidéos) ou taper un `@nom`, « Suivre » ; ✕ pour ne plus suivre ;
  - devant une vidéo de ma télé du jour, sous son titre, **« 📺 Suivre cette chaîne »** (« ✓ Tu suis … : ses nouvelles
    vidéos arriveront en premier » ; le bouton s'en va).
  - Refusés : ce qui n'est pas une chaîne YouTube (400), une chaîne introuvable (404), la onzième (« 10 au plus :
    enlève-en une d'abord »), une chaîne retirée par l'administrateur (403). Le même `@nom` autrement écrit : déjà suivie.
- **🆕 Dans ma télé du jour**, les nouvelles vidéos de mes chaînes passent **avant** la sélection de mes passions, les
  plus récentes d'abord ; en haut, à la place du thème : « 🆕 Lesbonsplans · il y a 1 h » ; elles n'ont pas de thème
  (vues jusqu'au bout, passées ou gardées, les poids de mes passions ne bougent pas). Sur la carte de l'accueil :
  « 🆕 3 nouvelles vidéos de tes chaînes ». Réagir, écrire, répondre, garder, envoyer, `?video=` : comme les autres.
- **Les filtres** : de 60 s à 60 min, publiées dans les sept derniers jours, lisibles ailleurs, ni en direct ni à venir,
  pas d'alcool dans le titre, **jamais une vidéo réservée aux adultes** (`contentRating.ytRating`, pour la sélection
  aussi désormais).
- **La nuit** (`/api/cron/decouvrir-selection`) : après la sélection des thèmes, les chaînes suivies par au moins une
  personne, cinq à la fois, avec le temps qui reste (`{ chaines: { faites, erreurs } }`).
- **L'administration** (`/admin/humain/decouvrir`, en bas) : « 📺 Les chaînes suivies », les plus suivies d'abord (leurs
  abonnés, leurs vidéos, une panne de YouTube) ; **Retirer**.
- **Le code** : `src/lib/direct/chaines.ts` (partagé : `chaineDuLien`, `ilYa`, les phrases), `chaines-serveur.ts`, la
  route `/api/direct/chaines` (`GET` ; `POST suivre { lien | video }`, `ne-plus-suivre { id }`) ; `selection-serveur.ts`
  prête `appeler` et `details` (avec ses durées) ; une vidéo de la sélection garde l'identifiant de sa chaîne
  (`chaineId`).
- **Les essais** : `scripts/essai-chaines-route.mjs` (suivre par un lien, par un @nom autrement écrit, depuis une vidéo ;
  les refus ; les vidéos en tête, dans l'ordre, et les filtres ; Sam qui suit la même chaîne s'assoit chez Léa ; les
  poids qui ne bougent pas ; dix au plus ; ne plus suivre ; un 15-17 ans ; la nuit ; l'administrateur qui retire ; aucun
  identifiant de compte) et `scripts/navigateur/mes-chaines.mjs` (sur un iPhone : « Suivre cette chaîne », « Tes
  chaînes », la télé qui s'ouvre sur « 🆕 Lesbonsplans · il y a 1 h », la carte de l'accueil). Le faux YouTube connaît
  les chaînes (`/youtube/channels`, `/youtube/playlistItems`, `/__youtube-chaines`).

**Ensuite** : D9 (✨ ma passion à moi), puis D6 (TikTok et Instagram par le partage, en portrait).

## 25. La télé du jour comme la maquette, et les vocaux à la seconde (20 novembre 2026)

Le propriétaire, le 20 novembre 2026, captures à l'appui (la vraie télé du jour, puis la maquette « avec les amis » et
« avec des inconnus ») : « ce n'est pas du tout pareil : il manque la possibilité de laisser des voices avec le micro, le
design du salon n'a rien à voir » — et la maquette elle-même (« Découvrir ClikMe », l'archive). La télé du jour reprend
donc **l'écran « Ma télé » de la maquette** (section 12), avec **ma pièce de Ma maison** (sa décision du 18 novembre) et
ma vraie figurine :

- **La barre du haut** : « ‹ » (dans l'onglet : revenir à l'accueil de Découvrir), **« 🏠 Ma télé »** et, dessous, « 1 sur
  40 · ⚽ Foot et sport » (ou « 🆕 Lesbonsplans · il y a 1 h ») ; **💬** (« Ce qui s'est dit », le nombre en pastille) ;
  **« 👥 Inviter »** (la séance chez moi, lot D2).
- **La télé** en grand écran, ma pièce dessous. Télé éteinte : le titre, la chaîne et la durée en haut de la vignette,
  « ▶ Allumer la télé », et en bas « 👥 2 proches l'ont vue : ils regardent avec toi ». Dans la pièce : « Tu l'ouvres en
  premier : tes réactions attendront tes proches » (personne ne l'a vue), « 🛋️ Voir la pièce » (ou « ⛶ Grand écran ») en
  bas à gauche, « 📺 Suivre cette chaîne » en bas à droite.
- **Dessous, comme la maquette** :
  - la **ligne du temps** : « ↺ » (cinq secondes en arrière, sans que ce saut compte comme un 😮), le temps, la barre
    qui se remplit, **un point par réaction** (une couleur par proche ; les miennes en blanc), la durée ;
  - **« Réagis : 😂 ❤️ 😮 😱 😴 — ou touche la pièce »** ;
  - **les commandes sur une ligne** : « ❚❚ » / « ▶ » (la pause, la lecture), « Suivante › », puis « 📌 Garder »,
    « 📤 Envoyer » ;
  - **« 💬 Le salon du foot en parle · 2 personnes › »** : le salon ouvert du thème (pas pour une vidéo d'une chaîne) ;
  - **« Écris, à cette seconde… » · 🎙️ · « Envoyer »**.
- **🎙️ Les vocaux à la seconde** (section 13.4, décidé par le propriétaire) — sa **vraie voix**, jamais une voix de
  synthèse :
  - **je garde 🎙️ appuyé et je parle** (le micro du salon du duo : la barre ● rouge, le temps, la forme de la voix,
    « ‹ glisse pour effacer » ; une minute au plus) : **la vidéo se met en pause pendant que je parle** (« 🎙️ Tu parles —
    la vidéo t'attend ») et **reprend quand je relâche** ; ma voix part **à la seconde où j'ai commencé** ; « 🎙️ Ta voix,
    à 0:20 : Sam l'écoutera à cette seconde » ;
  - **chez mes proches, à cette seconde**, ma figurine bat (« 🎙️ un vocal ») et « 🎙️ Léa t'a laissé un vocal — ▶ Écouter »
    apparaît : **la vidéo ne s'arrête jamais toute seule** ; s'il écoute, elle se met en pause le temps du message
    (« 🎙️ Léa — la vidéo reprend après »), puis reprend ; sinon, le vocal l'attend dans « 💬 Ce qui s'est dit »
    (« 0:20 Léa 🎙️ un vocal — ▶ Écouter ») ;
  - **le rangement** : la voix dans `decouvrir/vocaux/<vidéo>/<q>-<id>.<ext>` ; la réaction gagne `voix: { id, duree, ext }` ;
    ses proches (des deux côtés) la reçoivent par un lien signé d'une heure (`voix.url`, jamais gardé) ; 20 vocaux par vidéo
    et par personne au plus ;
  - **la route** : `POST { action: "vocal", id, t, son, duree }` (`son` : le fichier en `data:` URL, comme le talkie) →
    `{ reaction }` ; trop court, pas un son : 400 ; une vidéo qui n'est pas à ma télé : 404.
- **Les essais** : `tele-conversation.mjs` (sur un iPhone, un faux micro de Chromium : garder 🎙️ appuyé à 20 s, la vidéo en
  pause pendant qu'elle parle, relâché elle reprend ; chez Sam, « 🎙️ Léa t'a laissé un vocal — ▶ Écouter », la vidéo qui
  continue, ▶ Écouter qui la met en pause puis la relance ; la ligne dans « Ce qui s'est dit ») ;
  `essai-conversation-video-route.mjs` (le vocal de Sam, ses refus, Léa qui l'écoute, Inès qui ne l'entend pas, aucun lien
  gardé) ; `tele-du-jour.mjs`, `tele-ensemble.mjs` et `salons-seance.mjs` suivent le nouvel écran (la barre, la ligne du
  temps, « 👥 Inviter »).

**Restent** : « 📌 Garder ce moment » ; « 📷 Ta figurine fait ta tête » (D2b, troisième partie) ; le clip « 🎬 Nos
réactions » ; D2c ; D9 (✨ ma passion à moi) ; D6.

## 26. Le lot D9 : ma passion à moi (20 novembre 2026)

Le propriétaire, le 20 novembre 2026 : « fais D9 ». Ce qui est fait (le détail en 23.2) :

- **« ✨ Ta passion à toi »**, dans « ✎ Tes passions », sous les vignettes : un champ (« La pêche, la K-pop… »), « Garder »
  — puis la voilà (« ✨ La pêche à la mouche », ✕ pour l'enlever ; « Garder » devient « Changer »). **Une par personne**,
  en plus des 3 à 5 passions ; il faut d'abord ses passions. « ✨ « La pêche à la mouche » : ses vidéos arrivent dans ta
  télé. » (et « elles arrivent bientôt » si le budget du jour est passé).
- **Relue avant d'être gardée** : la relecture des salons ouverts (lien, numéro, adresse, réseau, question personnelle,
  gros mot, alcool) et les mots de l'alcool de la sélection ; de 3 à 40 lettres ; sinon « Choisis une autre passion. ».
- **La même clé pour les mêmes mots** : minuscules, sans accents, sans « le, la, les, l', un, une, des, du, de, d' » —
  « La pêche à la mouche » et « pêche à la mouche » donnent `peche-a-mouche` ; une seule recherche pour tous.
- **La recherche** : ses mots, en France, en français, lisibles ailleurs, **des trente derniers jours** (une passion rare a
  peu de vidéos chaque semaine), `safeSearch=strict` pour les 15-17 ans (qui ont leur fichier, `.jeunes`) ; puis les
  filtres de la sélection (30 s à 20 min, jamais réservée aux adultes, rien d'alcoolisé) ; quinze vidéos au plus.
- **Le budget** : **10 recherches dans la journée** (tout de suite, quand quelqu'un choisit une passion qui n'a pas encore
  de vidéos ou dont les vidéos ont plus de trois jours) et **20 la nuit** (tous les trois jours, les passions suivies par le
  plus de monde d'abord) — avec les 6 900 unités de la sélection, 9 900 sur 10 000. L'administration montre le budget du
  jour ; s'il est souvent plein, le propriétaire demande à Google plus de quota (un formulaire, gratuit).
- **Dans ma télé du jour** : ses vidéos se mêlent à celles de mes passions, avec **son propre poids** (« perso » : il
  monte quand je la regarde jusqu'au bout ou la garde, descend quand je la passe) ; dans la barre, à la place du thème :
  « ✨ La pêche à la mouche » ; pas de salon ouvert. Réagir, écrire, garder, envoyer, `?video=` : comme les autres. Changer
  ses passions ne l'enlève pas.
- **L'administration** (`/admin/humain/decouvrir`, en bas) : « ✨ Les passions à soi » (les mots, 15-17 ans ou non, combien
  de personnes, leurs vidéos, la dernière recherche, une panne de YouTube) ; **Refuser** (ces mots disparaissent pour tout
  le monde : chez celui qui l'avait, « Cette passion n'est plus cherchée : choisis-en une autre »).
- **Le code** : `src/lib/direct/passion-perso.ts` (partagé : `clePassion`, `passionValide`, les phrases),
  `passion-perso-serveur.ts` ; `/api/direct/passions` (`GET` rend `perso` ; `POST { action: "perso", mots }`, des mots
  vides l'enlèvent) ; la nuit (`{ perso: { faites, erreurs, attendent } }`) ; `melanger` mêle des listes sans thème
  (`ListeTele`, `clePoids`).
- **Le rangement** : `<h>/passions.json` gagne `perso: { mots, cle }` (gardé quand il change ses passions) ;
  `decouvrir/perso/<clé>[.jeunes].json` = `{ mots, videos, le, cherche, gens }` (`gens` : des identifiants courts) ;
  `decouvrir/perso-budget.json` ; `decouvrir/perso-refusees.json`.
- **Les essais** : `scripts/essai-passion-perso-route.mjs` (gardée et cherchée tout de suite ; les refus ; la même clé
  sans nouvelle recherche ; mêlée à la télé, son poids ; elle reste quand on change ses passions ; les 15-17 ans ; le budget
  de la journée et la nuit ; l'administrateur qui refuse ; l'enlever ; aucun identifiant de compte) et
  `scripts/navigateur/ma-passion.mjs` (sur un iPhone : « la bière » refusée, « La pêche à la mouche » gardée, sa vidéo dans
  la télé avec « ✨ La pêche à la mouche » dans la barre, ✕).

**Ensuite** : D6 (TikTok et Instagram par le partage, en portrait) ; « 📌 Garder ce moment » ; « 📷 Ta figurine fait ta
tête ».

## 27. Les gradins des salons ouverts (20 novembre 2026, au soir)

Le propriétaire, devant le salon ouvert : « fais-moi une proposition de décor où on peut accueillir les figurines, parce
que même la table, je ne suis pas vraiment fan […] essaie autre chose, qui ira mieux avec le style des figurines, et
mieux au niveau UX ». Sur les trois pistes proposées (le gradin, le grand canapé en arc, les poufs sur un tapis) : « ok
pour le gradin, fais les décors ».

**Le gradin** : un décor par lieu, **huit emplacements face à toi, sur deux marches** — quatre devant, au sol, en bas ;
quatre derrière, sur une marche plus haute. Personne ne cache personne, chaque prénom se lit. Chaque figurine arrive
assise dans son propre fauteuil : un emplacement est donc **un petit tapis rond, vide**, dans le style du lieu (pas un
siège, qui ferait double emploi avec son fauteuil).

| Le lieu | Les passions |
|---|---|
| 🎬 La petite salle de cinéma (velours rouge) | Séries et films, Télé-réalité et people |
| ⚽ La tribune du stade | Foot et sport |
| 🎵 La petite salle de concert | Musique |
| 🎮 La salle d'arcade | Jeux vidéo |
| 🍳 Le comptoir de la cuisine | Cuisine |
| 👗 Le premier rang du défilé | Mode et beauté |
| 😂 Le café-théâtre | Humour |
| 🐾 Le jardin | Animaux |
| 🍥 Le club manga | Manga et anime |
| 📚 La bibliothèque | Révisions et études |
| 👶 Le grand salon cosy | Jeunes parents |

**Fabriqué une fois, validé par le propriétaire** (`/admin/humain/salons`, « 🎭 Les gradins des salons ouverts ») :
- **« Fabriquer »** : le décor, une image carrée (1024 × 1024), dans le style des pièces (`STYLE_PIECES_DUO`), **dessiné
  d'après le plan des huit emplacements** (`PLAN_GRADIN` : IMAGE 1, des tapis gris sur deux marches et, sur chacun, la
  silhouette en pointillé d'une figurine assise, pour l'échelle). L'arrière-plan est doux et un peu plus sombre, pour que
  les figurines ressortent. Rien d'alcoolisé, pas de texte, personne.
- **Encore « Fabriquer »** : le relevé de ses huit emplacements, par un modèle qui voit (exactement huit, chacun dans
  l'image ; rangés dans l'ordre des places : devant, du milieu vers les bords, puis derrière). Sans modèle qui voit, ou
  s'il n'en trouve pas huit : **le plan** (le décor a été dessiné dessus), et la page dit pourquoi.
- La page montre chaque décor avec, sur chaque emplacement, la silhouette numérotée d'une figurine à sa taille : on juge
  d'un coup d'œil. **« ✓ Valider »** : il va dans les salons de ses passions. « Retirer des salons », « ↺ Refaire le
  décor », « ↺ Refaire le relevé », « 📐 Prendre le plan » : il quitte les salons jusqu'à ce qu'on le revalide. « 🛠️
  Tout fabriquer » enchaîne les passages, lieu après lieu (onze décors, puis onze relevés).
- **Seul un gradin validé va dans les salons** ; sinon, le salon garde sa pièce (section 18, image de la messagerie
  depuis le 20 novembre). La carte du salon, sur l'accueil de Découvrir, montre son gradin. La séance chez moi garde
  toujours ma pièce.
- Rangement : `salons-gradins/<lieu>/decor.png`, `releve.json` ({ le, places, source : regard, plan ou main, erreur? }),
  `valide.json` ({ le }). **À faire par le propriétaire, sur le site en ligne** (la clé du moteur d'image n'existe qu'en
  ligne) : « Tout fabriquer », regarder, valider.

**À l'écran** (`salon-ouvert.tsx`) :
- L'image carrée couvre la bande sous la télé, posée sur son sol, **assez petite pour que toutes les têtes se voient**
  (sur un iPhone : 390 points de large, le haut de l'image coupé ; sur un ordinateur : l'image entière en hauteur, ses
  côtés dans sa vignette floue).
- **Tu te vois toujours devant, au milieu (« Toi »)** : ta place et la première s'échangent, pour toi seul — chacun se
  voit au centre du premier rang, les autres autour.
- **Les places libres brillent doucement** (une lueur sur leur tapis, qui respire ; immobile si le téléphone demande
  moins d'animations) : on voit le salon se remplir.
- **Seul** : « Tu ouvres le salon : les places qui brillent attendent les suivants. »

**Les essais** : `essai-salons-gradins-route.mjs` (l'administrateur seul ; onze lieux pour douze passions ; le décor
d'après le plan, carré ; le relevé — sans modèle qui voit, le plan et pourquoi ; pas validé : la pièce ; validé : les
séries ET la télé-réalité dans la salle de cinéma, l'image à adresse stable, les huit places dans l'ordre ; les cartes
de l'accueil ; jamais dans la séance ; refaire le relevé, le plan, des places qui ne tiennent pas, des places dans le
désordre, retirer, refaire le décor) ; `salons-gradins.mjs` (sur un iPhone : la tribune, toutes les têtes visibles, «
Toi » devant au milieu, sept places qui brillent, la phrase quand on est seul ; Sam entre : six places, et sur son
téléphone c'est lui qui est au milieu ; sur un ordinateur ; la page de l'administrateur).

## 28. 📷 « Ta figurine, c'est ton visage » (20 novembre 2026, au soir)

Le propriétaire : « on a tout le squelette de l'app, mais il nous manque le détail qui la rendra complètement
successful » ; puis, sur les pistes proposées : seulement le rire, « c'est très enfermant » ; trop compliqué ; « il
faut un geste qu'on puisse faire sur toutes les vidéos [les gens en regardent des dizaines, parfois 50 ou 100 par
jour] et qui crée quelque chose instantanément » ; enfin « ok », et : « ce qui veut dire que dès l'inscription, à la
création de la figurine, on crée aussi 5 expressions, comme ça ce sera certain d'être créé ? » — oui.

### 28.1 L'idée

**Le geste, c'est ton visage.** Pendant que tu regardes une vidéo, la caméra de devant lit ton visage **sur le
téléphone** ; ta figurine fait **ta tête, à la seconde** : tu éclates de rire, elle éclate de rire ; tu ouvres grand la
bouche, tu fais la grimace, tu tournes la tête vers ton voisin — elle aussi. Rien à toucher, sur toutes les vidéos
(la première comme la centième de la journée), instantané, sans coût à chaque fois.

- **En direct** (les salons ouverts, la séance chez moi) : le gradin s'anime de vraies émotions — huit figurines qui
  rient, sursautent, se tournent les unes vers les autres.
- **En différé** (ma télé du jour, avec mes proches, section 21) : quand Sam regarde plus tard la vidéo que j'ai vue, ma
  figurine, assise à côté de lui, **revit mes vraies réactions** à la seconde près — mon vrai fou rire, pas un émoji.
- **Ensuite** : « 🎬 Nos réactions », le petit clip de nos figurines qui réagissent, à partager (déjà prévu, D2b).

### 28.2 Les expressions : faites une fois, dès « C'est moi ! »

- **Cinq expressions** en plus de son visage habituel : 😊 le sourire, 😂 le rire, 😮 la surprise, 😑 le bof, 😝 la
  grimace. **La tête seulement** (le calque de la tête, lot S1 : sa boîte, son pivot au milieu du cou) : le corps et le
  fauteuil restent les mêmes, le changement ne se voit pas ; une image plus petite, donc moins chère. Chacune est faite
  **d'après la tête de sa figurine** (fidélité haute) : elle reste reconnaissable, la même personne, le même style.
- **Quand** : dans la même chaîne que ses autres images (après la réponse à « C'est moi ! », `fabriquerSesReferences` :
  la bouche ouverte, debout, les calques) — **la personne n'attend rien**, tout est prêt une minute plus tard.
- **Pour être certain qu'elles existent** :
  - un passage raté (le moteur ne répond pas) est **repris tout seul** à sa prochaine ouverture de l'appli ;
  - **ceux qui ont déjà leur figurine** : rattrapés à leur prochaine ouverture, et la nuit par petits paquets ;
  - **une nouvelle image de sa figurine** (une nouvelle tenue) : ses expressions se refont avec ses calques (même
    empreinte que les calques) ;
  - **en attendant**, rien n'est bloqué : sa figurine bouge déjà la tête (le calque), et les émojis restent.
- **Rangement** : à côté de ses calques (`<habitant>/calques/<empreinte>-expression-<nom>.png`), publiées une fois à
  adresse stable (WebP), comme la tête.
- **Coût** : cinq têtes par personne, une seule fois (de l'ordre de quelques dizaines de centimes) — puis plus rien,
  quel que soit le nombre de vidéos regardées.

### 28.3 La lecture du visage : rien ne quitte le téléphone

- Une bibliothèque gratuite qui tourne dans le navigateur (la lecture du visage de Google, MediaPipe, chargée une fois)
  donne, une quinzaine de fois par seconde, ce que fait le visage (le sourire, la bouche ouverte, les sourcils, les yeux)
  et où regarde la tête. L'appli en déduit l'expression du moment et l'inclinaison de la tête.
- **Aucune image ne part** : seulement « 😂 de 1:20 à 1:23 », « tête vers la gauche » — comme les réactions à la seconde
  d'aujourd'hui. La caméra s'arrête dès que l'appli passe en arrière-plan.
- **Un interrupteur** : « 📷 Ma figurine fait ma tête », éteint au départ, proposé une fois avec une phrase claire (« La
  caméra reste sur ton téléphone : on ne garde que tes réactions, jamais ton image »), rangé dans les réglages. Sans
  caméra : les émojis, comme aujourd'hui.
- **Un rire vu compte comme un 😂** (source « visage ») : il nourrit ce qui existe — « 🫶 En même temps que Sam ! », les
  points sur la ligne du temps, « 💬 Ce qui s'est dit ».
- Les règles des salons ne changent pas (prénom et figurine seulement, les 15-17 ans à part) : on ne voit jamais le
  visage de quelqu'un, seulement sa figurine.

### 28.4 Les lots

| Lot | Contenu |
|---|---|
| **V0** — l'essai | Sur la page d'essais de l'administrateur : les cinq expressions de **la figurine du propriétaire** (le moteur d'image, en ligne), et une page où sa figurine fait sa tête devant sa caméra — pour voir l'effet en vrai avant d'aller plus loin. |
| **V1** — les expressions pour tous | Faites dès « C'est moi ! » ; le rattrapage (à l'ouverture, la nuit) ; refaites avec une nouvelle image. **Fait** (28.6). |
| **V2** — ma télé du jour | L'interrupteur ; ma figurine fait ma tête sur mon écran ; mes expressions notées à la seconde, rejouées par ma figurine chez mes proches. |
| **V3** — en direct | Les salons ouverts et la séance chez moi : chacun voit les figurines des autres faire leur tête (d'abord au rythme du pouls, quelques secondes ; puis en temps réel). |
| **V4** — le clip | « 🎬 Nos réactions » : nos figurines qui réagissent, à partager. |

Avec **🎁 « la vidéo offerte »** (chaque jour, chacun de mes proches peut m'offrir une vidéo, une seule ; acceptée par le
propriétaire le même soir), à écrire dans sa propre section quand on la fera.

### 28.5 Le lot V0 : l'essai (20 novembre 2026, au soir) — fait

Le propriétaire : « je peux te donner 4 ou 5 visages d'amis […] pour les mettre dans une maquette d'un salon où il y
aurait une vidéo YouTube ? comme ça je vois si ça marche bien, l'effet wow » ; puis, plutôt que de confier une clé :
« peut-être puis-je le faire de l'admin ». Tout se fait donc en ligne, avec la clé du moteur déjà rangée dans Vercel.

**L'atelier** (`/admin/humain/visage`, lien « 📷 L'essai du visage » sur la page de l'administrateur) :
- jusqu'à **six personnes** : un prénom, une photo de face (réduite sur le téléphone), **son accord** (case à cocher,
  obligatoire), « c'est moi » (une seule à la fois : sa figurine fera ta tête) ;
- (21 novembre 2026, le propriétaire : « quand j'appuie sur ajouter rien ne se passe et je ne vois pas non plus où mettre
  la photo ») la photo se choisit dans une zone bien visible, « 📷 Choisir sa photo » (ou on y glisse la photo depuis
  l'ordinateur), qui montre sa vignette une fois choisie ; « Ajouter » répond toujours : il dit ce qui manque (son
  prénom, sa photo, son accord), et qu'une photo HEIC de l'iPhone ne se lit pas partout (en JPEG ou en PNG, elle passe) ;
- **« 🛠️ Fabriquer »**, une étape par passage (une minute environ chacune) : sa figurine assise (la consigne des
  figurines, `consigneSculptee`, d'après sa photo — **la photo s'efface aussitôt**), sa découpe (le corps et la tête, les
  calques du lot S1, sans moteur), puis ses **cinq expressions** : chacune faite sur la figurine entière (« la tête
  exactement à la même place, de la même taille, sous le même angle : seul le visage change »), puis **sa tête découpée
  au pixel près au même endroit** que la tête habituelle (`decouperFigurine` rend maintenant où il a découpé le corps et la
  tête) ; « 🛠️ Tout fabriquer » enchaîne tout le monde ; ses expressions posées à côté de sa figurine ; « ↺ Refaire les
  expressions » ; « 🗑️ Effacer » (tout) ;
- rangé à part de tout habitant : `essais-visage/<id>/`.

**Le salon d'essai** (`/univers/visage`, l'administrateur seulement, pensé pour le téléphone) :
- en haut, **la vidéo** (le lecteur officiel de YouTube ; pour commencer, la première vidéo de l'humour du jour ; un lien
  collé en change) ; dessous, **le gradin** (la salle de cinéma s'il est validé, sinon un autre gradin validé, sinon un
  fond sombre et les huit tapis du plan) ; sa figurine au premier rang, au milieu (« Toi »), les amis autour ;
- chaque figurine est son corps et sa tête posée dessus ; ses cinq expressions sont des têtes chargées d'avance :
  **changer d'expression est instantané** ; un émoji saute au-dessus de la tête à chaque réaction ;
- **les amis** suivent une piste tirée au sort pour l'essai (un rire, un sourire, une surprise, une grimace, un bof, toutes
  les 6 à 16 secondes, parfois la tête tournée vers son voisin ; environ toutes les 30 secondes, **un fou rire de tout le
  salon**, aux mêmes secondes) — leurs vraies réactions viendront avec le lot V2 ; la page le dit ;
- **« 📷 Ma figurine fait ma tête »** : la caméra de devant, un petit miroir rond pour savoir qu'elle tourne, « Je vois :
  😂 » ; la lecture du visage de Google (MediaPipe 0.10.14, chargée au premier allumage, sur le téléphone : **rien ne
  part**) ; l'expression tenue un instant pour ne pas clignoter (0,2 s pour changer, 0,5 s au moins), la tête penchée (12°
  au plus : au-delà, la tête d'origine dépasse dessous) et tournée, comme dans un miroir ; plus de visage depuis une
  seconde : le visage habituel ;
- ses réactions sont **notées à la seconde de la vidéo** pendant qu'elle passe ; **« ▶ Revoir avec mes réactions »** : la
  vidéo repart du début, sa figurine rejoue ses vraies réactions, la caméra ne compte plus — « comme tes proches la
  verront ».

**À faire par le propriétaire, en ligne** : sur `/admin/humain/visage`, ajouter 4 ou 5 amis (avec leur accord) et
soi-même (« c'est moi »), « 🛠️ Tout fabriquer » (sept étapes par personne), puis « ▶ Ouvrir le salon d'essai » sur son
téléphone.

**Les essais** : `essai-visage-essai-route.mjs` (l'administrateur seul ; l'accord, la photo, le prénom ; six au plus ; la
figurine — la photo effacée —, la découpe, les cinq expressions, la tête découpée de la même taille ; le salon : les
figurines prêtes seulement, « moi » d'abord, une vidéo pour commencer ; « c'est moi », refaire, effacer) ;
`visage-essai.mjs` (sur un iPhone, une fausse caméra, une fausse lecture du visage : les amis réagissent et rient
ensemble ; un sourire, un rire, la tête penchée ; le visage habituel ; « Revoir avec mes réactions » rejoue le rire à la
bonne seconde ; la page de l'administrateur).

**Le retour du propriétaire, le 21 novembre 2026** : « tous les visages sont faits […] j'ai bien toutes les figurines
avec les expressions durant la vidéo » ; mais « pour une ou deux expressions la figurine se double […] Kilian a
apparemment sa figurine de départ et quand il utilise une autre expression elle se juxtapose, et si c'est en biais
alors on voit les deux figurines ». (Pas de textes ni de voix : l'essai ne montre que les expressions.)

- **La cause** : chaque expression est refaite par le moteur sur la figurine entière, puis sa tête est découpée « au
  même endroit » que la tête habituelle. Le moteur ne garde pas toujours le cadrage au pixel près : la tête découpée
  était décalée, et la tête habituelle, restée sur le corps, dépassait — surtout quand la tête penche.
- **Le corps sans sa tête** (`corps-sans-tete.png`) : le salon d'essai pose les têtes sur le corps dont le haut de la
  boîte de la tête est effacé (88 % ; le cou reste, sous la tête qui penche). Ce qui dépasse d'une expression ne laisse
  plus voir l'autre tête. Fait d'office pour les figurines déjà découpées : **rien à refaire** pour que Kilian ne se
  double plus.
- **La tête recalée** (pour les expressions faites désormais) : avant de la découper, la boîte est cherchée sur l'image
  de l'expression — quelques pixels de côté, un peu plus grande ou plus petite — là où sa silhouette colle le mieux à la
  tête habituelle (`recaler`). L'expression entière est gardée (`expression-<expression>.png`) : « Refaire la découpe »
  redécoupe ses têtes sans repasser par le moteur ; « Refaire les expressions » les refait toutes.
- **Si une expression de Kilian reste un peu de travers** (la tête décalée, pas doublée) : « ↺ Refaire les expressions »
  sur sa ligne, puis « Fabriquer » — elles seront recalées.

Les essais : `essai-visage-essai-route.mjs` (le faux moteur décale exprès le cadrage des expressions, de trois points et
deux : la tête recalée colle à la tête habituelle ; l'expression entière gardée ; le corps sans sa tête ; « Refaire la
découpe » redécoupe sans le moteur) ; `visage-essai.mjs` (le corps sans sa tête, fait d'office pour des figurines
découpées avant).


### 28.6 Le lot V1 : les expressions pour tous (21 novembre 2026) — fait

Le propriétaire, à « On lance la suite du visage (les 5 expressions pour tout le monde à « C'est moi ! ») ? » : « Oui ».

**Ce qui se fait, pour chaque habitant qui a sa figurine assise du nouveau style** (le code :
`lib/direct/expressions-figurine-serveur.ts`) :
- **son corps sans sa tête** (le haut de la boîte de sa tête effacé, le cou reste — sans le moteur) ;
- **ses cinq expressions** (😊 😂 😮 😑 😝), **toutes à la fois** : chacune faite par le moteur sur sa figurine entière,
  d'après elle (fidélité haute, qualité moyenne), avec la consigne de l'essai (« la tête exactement à la même place ») ;
  puis **sa tête découpée là où elle est vraiment** (recalée sur sa tête habituelle, de la même taille). Les outils sont
  ceux de l'essai du lot V0, partagés (la consigne, `recaler`, la tête au même endroit, le corps sans sa tête).

**Quand** :
- **après « C'est moi ! »**, avec ses calques (`/api/direct/nouvelle-figurine`, action `valider`, après la réponse) : la
  personne n'attend rien ;
- **s'il en manque, à l'ouverture de l'appli** (le `GET` de `/api/direct/ma-figurine`, après la réponse) — un passage
  raté, **une nouvelle image** de sa figurine (une autre empreinte : ses calques et ses expressions se refont ; celles
  d'avant restent rangées), ou ceux qui avaient leur figurine avant le lot V1 ;
- **la nuit**, par petits paquets (`/api/cron/expressions-figurines`, à 3 h 23 UTC : huit figurines au plus, deux
  à la fois, 280 secondes au plus) — les figurines prêtes de l'appli (`clik_ma_figurine`), les plus récentes d'abord ;
- **un passage raté** se reprend, **pas avant une demi-heure** (même en ouvrant l'appli) : le moteur n'est pas relancé en
  boucle. Un seul passage à la fois par habitant (un verrou de trois minutes).
- Une tête perdue se **redécoupe** dans l'expression entière gardée, sans repasser par le moteur.

**Rangées à côté de ses calques** (`<habitant>/calques/`) : `<empreinte>-expression-<e>.png` (l'expression entière),
`<empreinte>-tete-<e>.png` (sa tête), `<empreinte>-corps-sans-tete.png`, et `<empreinte>-expressions.json`
({ empreinte, tetes: { sourire, rire, surprise, bof, grimace }, corpsSansTete, le, rate?, erreur? } — leurs adresses
stables, publiées une fois en WebP par `imageSalon`, comme ses calques).

**Rien ne change à l'écran pour l'instant** : elles servent au lot V2 (ma figurine fait ma tête dans ma télé du jour,
mes expressions rejouées chez mes proches) et au lot V3 (en direct dans les salons).

**Pour le propriétaire** : sur `/admin/humain/visage`, sous l'essai, **« 📷 Les expressions des habitants »** — combien
de figurines ont leurs cinq expressions (« 12 sur 14 prêtes · 1 en attente · 1 en reprise »), les huit dernières avec
leurs cinq têtes (et ce qui a raté), et **« ▶ Rattraper maintenant »** (le rattrapage de la nuit, tout de suite).

**Le coût** : cinq images moyennes par figurine, une fois (et à chaque nouvelle image de sa figurine) ; la nuit, huit
figurines au plus.

**Les essais** : `essai-expressions-figurine-route.mjs` (Léa ouvre l'appli : ses cinq expressions et son corps sans sa
tête, après la réponse — cinq demandes au moteur, rangées à côté de ses calques, la tête de la taille habituelle, le
visage effacé du corps ; rouverte : rien n'est refait ; une tête perdue : redécoupée sans le moteur ; une nouvelle image :
de nouvelles expressions ; Zoé, un passage raté il y a dix minutes : rien ; la page de l'administrateur ; la nuit :
Zoé rattrapée, Max rien ; « Rattraper maintenant ») ; `essai-nouvelle-figurine-route.mjs` (« C'est moi ! » : ses cinq
expressions suivent) ; `essai-visage-essai-route.mjs` et `visage-essai.mjs` (l'essai du lot V0, avec les outils
partagés). (`essai-bascule-route.mjs` et `ma-figurine.mjs` laissent de côté les demandes des expressions, qui se font
après la réponse et peuvent tomber au milieu.)

## 29. Les salons comme l'essai du visage : le gradin partout, la vidéo qui part seule (21 novembre 2026)

Le propriétaire, captures à l'appui (le salon de l'humour dans sa pièce, avec « ▶ Allumer la télé du salon » ; le salon
d'essai du visage) : « c'est toujours l'ancienne version […] je ne veux pas de ce bouton "allumer" qui sert à rien, je
veux directement quand j'arrive sur le salon que la vidéo se déclenche, donc pas […] beaucoup de choses distrayantes avec
le bouton pause, la barre de progression etc. mais plutôt [une affiche] plus épurée et directe dans l'action ». Puis, à
nos questions : la vidéo démarre seule, en silence, un toucher met le son (« Oui ») ; toujours le gradin, comme l'essai
(« Oui »).

- **Toujours le gradin** (les salons ouverts et la séance chez moi) : le décor validé de la passion s'il y en a un
  (section 27) ; sinon **le fond sombre** de l'essai du visage et les places du plan (`PLAN_GRADIN`, huit) — plus jamais
  la pièce. Chacun se voit devant, au milieu ; les places libres brillent. La séance : **quatre places**, plus grandes
  (`PLAN_SEANCE` : les deux du milieu devant, une de chaque côté). (Le serveur envoie encore la pièce, pour les cartes de
  Découvrir ; l'écran du salon ne s'en sert plus.)
- **La vidéo part toute seule** à l'arrivée, **en silence** (un téléphone ne laisse pas une vidéo démarrer seule avec le
  son) : plus de « ▶ Allumer » ; le lecteur de YouTube **sans ses commandes** (ni barre, ni pause, ni « Plus de
  vidéos » : un voile transparent couvre l'image). **« 🔊 Touche pour le son »** : un toucher n'importe où sur la vidéo
  met le son, l'étiquette s'en va.
- **La séance en pause** : son **affiche**, épurée — l'image de la vidéo, son titre, sa chaîne ; chez l'hôte, « ▶ Lancer
  la vidéo » ; chez ses proches, « Léa va lancer la vidéo ». (L'hôte garde ❚❚ Pause, ⏭ Suivante, 📺 Choisir, sous la
  télé.)

**Les essais** : `salons-ouverts.mjs` (le gradin sans décor : le fond sombre, sept places qui brillent, sa figurine en
grand ; plus de « Allumer » ; la vidéo du moment part seule, en silence ; « 🔊 Touche pour le son » ; un toucher : le son)
; `salons-seance.mjs` (sa télé du jour part seule, en silence ; quatre places ; le son ; en pause : l'affiche, « ▶ Lancer
la vidéo » chez Léa, « Léa va lancer la vidéo » chez Sam) ; `salons-gradins.mjs` (un décor validé : comme avant).

**La suite** (le lot B, décidé le même jour) : « Ma télé du jour » devient ma séance — le même salon à quatre places ; mes
amis qui ont déjà vu la vidéo y rejouent leurs réactions ; une place libre (＋) ouvre mon carnet, ou envoie un lien
WhatsApp qui assoit la personne à cette place (et nous rend proches).

## 30. ⭐ « Ma télé du jour » est mon salon à quatre places (21 novembre 2026, le lot B)

Le propriétaire : « c'est un peu compliqué la différence entre "Ma télé du jour" qui nous donne les vidéos du jour mais on
arrive dans notre salon, et du coup on est perdu entre "Les salons ouverts par passion" et "Ma télé du jour" : je pense
qu'il faut simplifier en ayant la même chose mais avec seulement 4 places pour seulement nos amis, même décor, sauf que
les places libres sont cliquables et ouvrent votre carnet d'adresses pour envoyer une invitation simplement s'ils sont
déjà inscrits sur ClikMe, ou alors une invitation envoyée sur WhatsApp pour nous rejoindre à la place libre ». Puis, à nos
questions : garder les réactions des amis qui ont déjà vu la vidéo (« Oui ») ; celui qui ouvre le lien WhatsApp devient
proche en s'asseyant (« Oui »).

- **La carte « Ma télé du jour »** (Découvrir) : « ▶ Regarder » ouvre **ma séance** (`/univers/salons?chez=moi`) — le même
  salon que ceux des passions (section 29) : **quatre places**, la vidéo qui part seule (ma télé du jour, dans son ordre),
  « 🔊 Touche pour le son ». (Sans vidéos encore : l'écran d'avant, « bientôt ». L'écran d'avant reste aussi celui des
  notifications « revois-la avec ses réactions » : `/collection?tele=<id>`.)
- **⭐ Mes amis qui l'ont déjà vue** (chez moi seulement) : ceux de mes proches qui ont vu cette vidéo s'assoient aux
  places libres — **la dernière reste libre**, pour inviter — « Sam · l'a vue », et **rejouent leurs réactions à leur
  seconde** (l'emoji qui saute, ou leurs mots en bulle). Quand l'un d'eux arrive en vrai, il n'est plus assis en souvenir.
- **➕ Une place libre** (chez moi) : un « ＋ » qui brille ; un toucher ouvre la feuille d'invitation — **mes proches à
  cocher** (trois au plus, la notification et la carte « Venir », comme avant), et **« 📲 Inviter par WhatsApp »** : un
  lien qui **réserve une place** (`/univers/salons?chez=<ma clé>&place=<jeton>`, six heures, une seule personne).
  Celui qui l'ouvre s'assoit à la place libre, et **nous devenons proches des deux côtés** ; je suis prévenu (« 🎬 Tom a
  pris ta place libre »). Sans figurine : « Créer ma figurine », puis « 🎬 Rejoindre ta place » (le même lien). Le lien
  déjà servi : « Ce lien a déjà servi, ou il a plus de six heures : demande-en un autre. »
- **Ma télé du jour apprend toujours** : la vidéo d'avant est notée vue (jusqu'où, jusqu'au bout ?) — elle ne revient
  plus, son thème monte ou descend ; **mes réactions** (😂 ❤️ 😮 😱 👏) restent sur la vidéo, à leur seconde : mes amis
  les verront (😱 devient « Oh non ! », 👏 « J'adore »).

**Le rangement** : `decouvrir/salons/prives/chez-<q>/places/<jeton>.json` ({ h, le, pris?, prisLe? }). **La route**
(`/api/direct/salons-ouverts`) : `place` → `{ lien, prenom }` ; `entrer-chez` prend `place` (le jeton). La page de la
figurine prend `suite` (le lien d'une place : « 🎬 Rejoindre ta place »).

**Les essais** : `essai-regarder-a-deux-route.mjs` (le lien d'une place ; Tom, sans lui, puis avec un faux : refusé ;
avec : assis, et proches des deux côtés ; Zoé avec le même : déjà servi ; Tom revient : sa place l'attend) ;
`salons-seance.mjs` (la carte mène au salon ; Sam, qui l'a déjà vue, assis à côté — « Sam · l'a vue » — et son rire à
2 s ; deux « ＋ » ; la feuille et « 📲 Inviter par WhatsApp » ; Sam arrivé en vrai, plus en souvenir) ; `tele-du-jour.mjs`
(« ▶ Regarder » : le salon à quatre places ; l'écran d'avant par son adresse).

## 31. 📼 Revoir : mes vidéos déjà vues, et ce que mes amis y ont dit depuis (21 novembre 2026)

**La demande du propriétaire** : « lorsque j'ai vu une vidéo et que je l'ai commentée et que je pars et que des amis ou
autre la commentent aussi, alors comment puis-je la revoir ? Peut-être faudrait-il que sur la page Ma maison et
Découverte il y ait l'historique des vidéos regardées, avec une petite modification si de nouveaux commentaires
apparaissent. »

Jusqu'ici, on ne revoyait une vidéo que par la notification « revois-la avec ses réactions ». Maintenant :

- **L'historique** : chaque vidéo de ma télé du jour que je vois (dans ma séance, ou sur l'écran d'avant) y va — la plus
  récente d'abord ; vue de nouveau, elle remonte. Soixante gardées, vingt-quatre montrées. (Une vidéo qui ne se lit pas
  ici n'y va pas.)
- **Ce qui s'y est passé depuis** : quand un de mes proches réagit à une vidéo que j'ai vue (un emoji, ses mots, sa
  voix), elle va dans **ma boîte « à revoir »**, avec son prénom. Elle y reste jusqu'à ce que je la revoie.
- **📼 Sur l'accueil de Découvrir**, sous « Ma télé du jour » : la rangée « 📼 Revoir » (les vignettes, qui défilent) ;
  sur celles où des amis ont réagi depuis, un liseré doré et « 💬 Sam a réagi » (« Sam et Léa ont réagi »…). Rien tant
  qu'aucune vidéo n'est vue.
- **📼 Dans Ma maison** : la puce « 📼 Revoir » (avec le nombre de vidéos où des amis ont réagi) ouvre la même liste en
  feuille (« Tes vidéos déjà vues viendront ici. » tant qu'il n'y en a pas). Et dans **« Pendant ton absence »** : « 💬
  Sam a réagi à « … » », avec « Revoir » ; comptées dans la pastille.
- **Un toucher la rouvre dans mon salon** (`/univers/salons?chez=moi&video=<id>`) : ma séance se cale sur elle, depuis
  le début — mes amis qui l'ont vue y sont assis et **rejouent leurs réactions à leur seconde** (section 30) ; ceux qui
  sont assis là en vrai la revoient avec moi. Seulement une vidéo de ma télé du jour (une autre : la séance ne bouge pas).
  En la revoyant, elle sort de ma boîte.

**Le rangement** : `<habitant>/tele-historique.json` ({ liste: [{ id, titre, chaine, duree, le }] }) et
`<habitant>/tele-revoir.json` ({ videos: { <id>: { titre, de: [prénoms], n, le } } }, trente au plus). **Le code** :
`lib/direct/revoir.ts` (les textes, `lienRevoir`), `lib/direct/revoir-serveur.ts` (`ajouterAHistorique` — appelé par
`noterVue` —, `noterARevoir` — appelé quand un proche réagit, par `reactions-video-serveur` —, `revue`, `maBoiteARevoir`,
`monHistorique`), `app/collection/revoir.tsx` (`RangeeRevoir`, `FeuilleRevoir`). **La route** :
`GET /api/direct/tele-du-jour?historique=1` → `{ historique }` ; `GET ?reactions=<id>` vide la boîte de cette vidéo ;
`entrer-chez` (salons ouverts) prend `video`. Ma maison : `aRevoir` (cinq au plus) dans la vue de ma pièce.

**Les essais** : `essai-regarder-a-deux-route.mjs` (l'historique de Sam ; Léa écrit sur une vidéo qu'il a vue :
« 💬 Léa a réagi », et sa maison le dit ; il la revoit — la réaction de Léa est là — et elle sort de sa boîte ;
`entrer-chez` avec `video` : sa séance se cale dessus, pas sur une vidéo qui n'est pas à sa télé) ; `tele-du-jour.mjs` (la
rangée « 📼 Revoir » sur l'accueil, et son lien) ; `salons-seance.mjs` (le salon rouvert sur la vidéo choisie, et Sam,
assis là, la revoit avec elle) ; `ma-maison-catalogue.mjs` (la puce et sa feuille, vide).
