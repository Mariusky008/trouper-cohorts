# Le salon du duo — la messagerie visuelle : le cahier des charges commun aux deux sessions

**Statut : écrit le 16 novembre 2026, à la demande du propriétaire ; le découpage du travail (section 9) est proposé,
à valider par lui.** Les deux sessions le lisent avant de toucher à la conversation entre deux proches. On le change
par une PR qui le dit dans son titre, et l'autre session en est prévenue (par le propriétaire, ou dans `docs/reprise.md`).

Le propriétaire, après avoir joué la maquette : « c'est super tout ça, maintenant il va falloir le faire exactement
pareil sur l'appli… un cahier des charges extrêmement bien conçu pour bien intégrer toutes ces fonctionnalités, et que
ça soit vraiment rapide quand on l'utilise, sans avoir de lags ».

**La maquette de référence** : une page privée du propriétaire, « Salon du duo »
(`https://claude.ai/artifact/NaRVjbvPi2PGJmG3poai7n`, version 10 et suivantes ; une session la lit avec l'outil
Artifact, `action: "read"`). Elle n'est pas dans le dépôt : elle contient des images de figurines faites d'après des
personnes. **Quand ce texte et la maquette divergent, la maquette fait foi pour ce qu'on voit et ce qu'on touche ; ce
texte fait foi pour l'architecture, les données et la vitesse.**

---

## 1. Le principe, en une phrase

**La pièce est la conversation.** On n'ouvre pas une liste de messages : on entre dans le salon que l'on partage avec un
proche, et tout s'y joue — ses gestes, ses mots, sa voix, ses mèmes, ses photos, ses clips, vos souvenirs. Rien ne
renvoie vers un autre écran au design d'avant (l'ancien studio des mèmes, l'ancien fil) : tout se fait dans le salon,
et tout se retrouve dans 💬 Messagerie.

## 2. Les règles qui ne se discutent pas

1. **Une seule bulle par figurine** : le dernier message de chacun, au-dessus de sa tête. Tout le reste est dans
   💬 Messagerie (une feuille qui monte), à sa date.
2. **Répondre coûte un toucher** : un geste, un mème prêt, un 📌, un « Range-le ».
3. **Ce que fait l'un se voit chez l'autre**, en direct s'il est là, à son arrivée sinon (section 4.1).
4. **Jamais de voix fabriquée** (`CLAUDE.md`) : un vocal, c'est la voix enregistrée de la personne ; un mème est écrit,
   ou dit avec sa propre voix. Les seuls sons ajoutés sont des bruits (le « kssht » du talkie, son bip, un clap) et de
   courtes musiques de mème, jamais une voix.
5. **Les textes de l'écran** : on tutoie ; jamais le mot « exemple » ; rien d'alcoolisé ; jamais le genre deviné (pas
   d'accord au masculin ou au féminin pour celui qui parle — « elle » ne désigne que « la figurine »).
6. **La vitesse est une fonctionnalité** (section 7) : la pièce s'ouvre en moins d'une seconde, rien ne saccade, aucune
   animation n'attend le réseau.

## 3. L'écran, de haut en bas

| Zone | Ce qu'il y a | Dans l'appli aujourd'hui |
|---|---|---|
| **En-tête** | ‹ retour ; l'avatar et le prénom de l'autre ; sous le prénom, sa présence (« Là, maintenant » avec un point vert, ou « Dernière visite à 8 h 13 ») ; 📚 le nombre de souvenirs (ouvre l'étagère) ; 🔥 les jours de suite | la présence existe (`presence`, le réglage « Montrer à mes proches quand je suis là ») |
| **La scène** | la pièce du duo, les deux figurines assises, les objets (télé, cadres, étagère, table, lampes, fenêtre, coin du chat) ; en haut à droite les puces de l'heure (🌅 Le soir) et de la météo (🌧️ Pluie fine · 9°), le 📅 prochain rendez-vous ; en bas à droite 💬 Messagerie avec le nombre de non-lus ; un petit message en haut (« toast ») pour ce qui se passe | les pièces du duo, leurs trois lumières et l'image du duo existent (`piece-du-duo.md`) ; la scène actuelle (`proches.tsx`) n'en est pas encore faite |
| **Les onglets** | 💌 Petites attentions · 🛋️ Ensemble · 🎭 Mèmes | — |
| **La barre de puces** | les gestes ou les mèmes de l'onglet choisi, qui défilent de côté | les panneaux et les réactions (`vivant.ts`) |
| **La saisie** | ＋ (envoyer) ; « Écris à Camille… » ; à droite 🎙️ (appuyé : un vocal), qui devient ➤ dès qu'on écrit | la barre ＋ / Écrire / micro existe (lots M1 à M3) |

**Les feuilles** (elles montent du bas, un voile derrière, une seule à la fois ; on ferme en touchant le voile ou la
poignée) : 💬 Messagerie ; Envoyer à Camille (le ＋) ; Mettre à la télé ; Accrocher une photo au mur ; Ton mème ; Votre
étagère (et la fiche d'un souvenir) ; la loupe d'un cadre.

---

## 4. Les fonctionnalités, une par une

Pour chacune : ce qu'on voit, les données, le serveur, et quand c'est réussi (« ✅ »).

### 4.1 L'arrivée : « depuis ta dernière visite »

- **La notification** dit tout ce qui attend : « 😘 Camille t'a laissé un bisou, un mème, 2 messages et un vocal dans
  votre salon ».
- **En ouvrant**, la pièce rejoue ce que l'autre a laissé depuis ma dernière visite, **dans cet ordre** : ses gestes
  (le bisou, rejoué par sa figurine), ce qu'elle a posé (la tulipe sur la table, avec un éclat), **son mème** (joué par
  sa figurine, section 4.7), ses messages (une bulle chacun, l'un après l'autre : seul le dernier reste), **son vocal**
  (posé sur la table, le talkie-walkie qui clignote : on le touche pour l'écouter, section 4.6), puis un rappel de
  l'étagère par ma figurine (« Psst… dans 3 jours, l'anniversaire de Camille 🎂 »).
- **Au plus 12 secondes** en tout ; au-delà, on garde les plus récents et le reste est dans 💬. Un toucher n'importe où
  passe la suite (tout est déjà dans 💬).
- **L'autre n'est pas là** : sa figurine somnole (zZz), la tête penchée. Quand l'autre arrive (il ouvre la conversation),
  sa figurine se réveille, sursaute, fait coucou ; la mienne se tourne vers elle et sourit ; le chat vient sur mes
  genoux.
- **Données** : `GET /api/direct/proches?depuis=<cle>` rend les événements depuis ma dernière visite de ce duo (gestes,
  objets posés, mèmes, messages, vocaux non écoutés, rappels), du plus ancien au plus récent ; la dernière visite est
  notée côté serveur à l'ouverture.
- ✅ Les deux téléphones montrent la même chose ; rien n'est rejoué deux fois ; ouvrir une conversation sans rien de
  neuf ne rejoue rien.

### 4.2 Écrire

- La bulle part de ma figurine (elle parle : la tête sautille le temps de la phrase). L'autre figurine réagit à ce qui
  est dit : ❤️ 😘 « bisou », « je t'aime » → elle rougit, des cœurs, elle penche la tête ; 😂 « haha », « mdr » → elle rit
  (la tête secouée, des traits de rire) ; une question → elle penche la tête, un « ? » ; un « ! » → elle sursaute.
- « … » au-dessus de la figurine de celui qui écrit (existe : `prepare`, `vivant.ts`).
- Ce qui ressemble à un goût (« j'adore… »), une date (« le 19 novembre ») ou une promesse : ma figurine propose
  « Je le range sur votre étagère ? » (existe : l'étagère, lots E1 à E4).
- ✅ La bulle apparaît dans les 100 ms qui suivent ➤, avant même la réponse du serveur.

### 4.3 La bulle et 💬 Messagerie

- **Une bulle par figurine**, placée au-dessus de sa tête, **jamais coupée** par la caméra (elle est posée hors de la
  caméra, là où la caméra montre la tête). Les bulles de « Ta figurine » (ce que dit l'IA : un rappel, « Je le range ? »)
  ont un cadre doré et s'effacent seules, sauf si elles attendent une réponse.
- **📌 dans le coin de chaque bulle** (section 4.10).
- **💬 Messagerie** : toute la conversation, par jour ; les gestes y sont des lignes (« 😘 Camille t'a envoyé un bisou
  · 8 h 13 », « Revoir ») ; les vocaux s'y écoutent ; les mèmes s'y revoient (« ▶ Revoir » ferme la feuille et la
  figurine le rejoue dans le salon) ; chaque message a son 📌.
- ✅ La feuille s'ouvre en moins de 100 ms (elle est déjà construite) ; elle défile sans saccade sur 500 messages.

### 4.4 Les gestes

Deux onglets (la maquette les montre tous) :

- **💌 Petites attentions** : 👋 Coucou · 😘 Bisou · 🤜 Check · 🪶 Chatouilles · 🌷 Une fleur.
- **🛋️ Ensemble** : 🤗 Câlin · ☕ Un café · 🎶 Danser · 📺 Un clip (la feuille de la télé) · 📸 Photo à deux · 🖼️ Accrocher
  (la feuille des cadres) · 🎁 Surprise.

Chaque geste est **une petite mise en scène de 1,5 à 3 s**, jouée chez les deux : le bisou vole d'une figurine à
l'autre et laisse une marque 💋 sur la joue, qui rougit ; le check se fait poing contre poing avec un éclair ; le café
pose une tasse qui fume sur la table ; danser allume la boule (lumières) et les deux dansent ; la photo à deux fait un
flash et accroche la photo au mur… L'autre répond souvent par un geste (un bisou rendu, un croissant posé).
**Les objets posés restent sur la table** (une tulipe, une tasse) et se touchent (« Camille a laissé une tulipe ·
8 h 12 »).

- L'appui long sur une bulle garde **les six réactions avec le corps** d'aujourd'hui (👏 😂 ❤️ ✋ 🤦 😮, `vivant.ts`) ; les
  **panneaux** (« MDR », « J'arrive ! »…) deviennent des gestes de l'onglet 💌 (à valider par le propriétaire,
  section 10).
- ✅ Le geste part au toucher (sans attendre le serveur) ; s'il est refusé, il se défait et on le dit.

### 4.5 La vie propre des figurines, et le chat

- **Au repos**, chaque figurine respire (le corps), la tête sur son ressort se balance doucement et, toutes les 5 à 10 s,
  penche un peu ; de temps en temps elles se regardent, s'étirent.
- **Si personne ne fait rien** pendant une vingtaine de secondes alors que l'autre n'est pas là, la scène peut jouer son
  arrivée spontanée (section 4.1) — seulement dans la maquette ; dans l'appli, c'est sa vraie arrivée.
- **Le chat** (le compagnon, `compagnon.md`) : dans son panier, il dort, s'éveille, dresse les oreilles à chaque
  message ; on le touche, il ronronne ; il vient sur mes genoux quand l'autre arrive ou quand tout est calme. Dans la
  maquette il est dessiné ; dans l'appli, ce sont ses boucles (lot C0), si le propriétaire les valide.
- ✅ Rien ne bouge plus d'une chose à la fois au repos ; tout s'arrête quand la page est cachée.

### 4.6 Le talkie-walkie (le vocal)

- **On garde 🎙️ appuyé et on parle.** La barre devient : ● rouge, le temps (0:04), la forme de la voix en direct,
  « ‹ glisse pour effacer » ; le bouton grossit, rouge.
- **Dans la scène** : ma figurine lève un talkie-walkie à sa bouche (il suit sa tête), sa lumière est verte, la tête
  parle au rythme de ma voix (le niveau du micro), et des ondes partent vers l'autre.
- **Si l'autre est là**, son talkie est à son oreille (lumière orange) : elle m'entend **en direct**. **Sinon**, à
  l'envoi, mon talkie se pose **sur la table**, couché, sa lumière rouge clignote avec une pastille 🎙️ : il l'attend.
  Quand elle arrive, sa figurine le prend et l'écoute.
- **On relâche** : « kssht », le petit bip de fin, la bulle du vocal (▶, la forme de la voix, la durée). **On glisse à
  gauche** : effacé. **Un toucher trop court** : « Garde le micro appuyé et parle, comme un talkie-walkie. »
- **Écouter** un vocal (▶ sur la bulle, dans 💬, ou le talkie posé sur la table) : la figurine de celui qui a parlé
  reprend son talkie et le dit — la tête suit la voix enregistrée —, les barres se colorent au fil de la lecture ;
  l'autre figurine écoute (elle penche la tête).
- **Ce qu'il a dit, écrit** sous la bulle (la transcription, qui existe : `transcrire`). Elle sert aussi au 📌 et à
  « Je le range ? » (« Ce soir je rentre vers 19 h : on regarde la suite de notre série ? » → 📺 « Notre série, ce soir »
  dans « À venir »).
- **Données** : le vocal (fichier audio), sa durée, **ses niveaux** (un nombre de 0 à 1 toutes les 60 ms, mesurés
  pendant l'enregistrement, envoyés avec le vocal : moins d'1 Ko, ils dessinent la forme et font parler la tête sans
  décoder l'audio), sa transcription, écouté ou non (pour le talkie sur la table).
- ✅ L'enregistrement démarre en moins de 150 ms après l'appui (le micro est déjà autorisé) ; la bulle apparaît au
  relâché, l'envoi se fait derrière ; 60 s au plus.

### 4.7 Les mèmes

- **Où les trouver** : l'onglet 🎭 Mèmes (et « 🎭 Un mème » dans le ＋). Les puces : **Du jour** (le mème du jour,
  `memes-prets.ts`, avec ✨), **✍️ Le mien**, **🎙️ Ma voix**, puis les mèmes prêts (Fou rire, Tu me manques, Je t'aime,
  Bravo, Retard, Café, Je danse…).
- **Un toucher sur un mème prêt, et il est joué** : la caméra s'approche de ma figurine, un **projecteur** s'allume (le
  reste de la pièce s'assombrit, un faisceau tombe d'en haut), un clap 🎬 « Action ! », le texte arrive **mot à mot dans
  une bulle de BD** au-dessus d'elle, avec la tête qui va avec (fou rire : elle rit, des 😂 ; amour : des cœurs, elle
  rougit ; euphorie : étincelles, elle bondit ; grimace : 😜 ; tristesse : 💧 ; colère : 💢 💨) et une petite musique ;
  « Coupez ! », la pièce revient. Il en reste **une carte dans ma bulle** (la vignette de ma figurine, la phrase, « ▶
  Revoir », « 📤 » pour WhatsApp).
- **✍️ Le mien** : la feuille « Ton mème » — des idées (les mèmes prêts), ce que dit ma figurine (120 signes), sa tête
  (😂 😄 🤩 😍 😜 😢 😠), « 🎶 Elle danse », « 🎙️ Le dire avec ma voix » (gardé appuyé), « 🎬 Action ! ».
- **Chez l'autre** : s'il est là, il le voit en direct ; sinon, **ma figurine le lui joue à son arrivée** (section 4.1).
  Il rit (😂 qui s'envolent) et peut **répondre en mème** : sa figurine joue le sien (le « duo »). Sur la carte de son
  mème : ▶ et 😂 ❤️ 🔥.
- **Ranger un duo** : après un échange de mèmes, ma figurine propose « Je le range ? » ; le duo devient une claquette 🎬
  dans le rayon **« Nos fous rires »** de l'étagère ; sa fiche a « ▶ Le revoir », qui rejoue les deux mèmes dans le
  salon.
- **Un mème est une donnée, pas une vidéo** : texte, tête, danse, et la voix s'il y en a une. Il est joué en direct par
  le moteur de la scène, chez les deux. **La vidéo n'est fabriquée que pour la partager** (📤 WhatsApp) : le même moteur
  joue le mème dans une toile hors écran, enregistrée (`MediaRecorder`) — dans le décor du salon — puis partagée.
- **L'ancien studio** (« ＋ Nouveau › Créer un mème », `meme-pour.tsx`) reste pour les mèmes hors d'une conversation
  (« Découvrir », WhatsApp) ; dans la conversation, il n'est plus jamais ouvert.
- ✅ Du toucher au « Action ! » : moins de 700 ms ; aucun téléchargement pendant le mème.

### 4.8 ＋ Envoyer

La feuille « Envoyer à Camille », six cases : **🎭 Un mème** (la feuille « Ton mème ») · **🎙️ Un vocal** (rappelle de
garder le micro appuyé) · **📷 Photo** (« elle peut aller au mur ») · **🎬 Vidéo** (« elle peut passer à la télé ») ·
**🔗 Lien** (YouTube, une chanson, un site) · **📎 Fichier** (un PDF, un document…). Et « Rien sous la main ? Essaie avec
une photo, un lien YouTube ou une chanson » (maquette seulement).

Ce que devient chaque envoi (la bulle porte l'action, un toucher de l'envoyeur) :

| Envoi | Dans la bulle | L'action |
|---|---|---|
| Photo | la photo | « 🖼️ L'accrocher au mur ? » → elle s'envole dans un cadre (4.9) |
| Vidéo | la vidéo, muette | « 📺 La mettre à la télé ? » → elle passe à la télé |
| Lien YouTube | la carte du lien | « 📺 La mettre à la télé ? » |
| Chanson (Spotify, Deezer, Apple Music, SoundCloud) | la carte | « 🎵 La ranger dans votre univers ? » → elle s'envole sur l'étagère (« Ce qu'on aime ») |
| Film (Netflix, Prime Video, Disney+, Canal+, Allociné, IMDb, Arte, France.tv, Mubi, Max, Apple TV, Paramount+, Crunchyroll) | la carte | « 📺 À la télé ce soir ? » → l'affiche « Ce soir » à la télé, et « Notre film » proposé dans « À venir » |
| TikTok, Instagram | la carte | « 📺 À la télé ? » → « ils s'ouvrent dans leur appli » |
| Fichier | une carte (l'icône selon le type, le nom, la taille) | — |

Existe déjà : les messages écrits, photos, vidéos, liens et leurs aperçus (lots M1 à M3, `ecrit-serveur.ts`,
`photo-serveur.ts`, `video-serveur.ts`),
« Le ranger dans mon univers » (`ranger-univers.ts`). À ajouter : les films, les fichiers.

### 4.9 Les objets de la pièce

- **📺 La télé** (`tele-duo.tsx`, `tele.ts`, existe) : de loin, elle montre ce qui passe ; un toucher, la caméra
  s'approche ; « ▶ Allumer » ; les réactions 😂 😍 🔥 👏 😮 qui s'envolent ; « Camille regarde aussi » (ou « l'a regardé
  à 8 h 12 · 😂 ×3 »). **« Un clip » (🛋️ Ensemble) ouvre « Mettre à la télé »** : un champ « Colle un lien : YouTube,
  une chanson, un film… » (YouTube : la vidéo ; une chanson : sa pochette ; un film : son affiche « Ce soir »), « 📱 Une
  vidéo de ton téléphone », puis « Ou l'un de vos clips ».
- **🖼️ Les cadres** : « Accrocher » (🛋️ Ensemble) ouvre « Accrocher une photo au mur » — « 📷 Une photo de ton
  téléphone », « 📸 Prendre une photo maintenant », « Ou l'une de vos photos ». La photo s'envole dans **un cadre vide
  d'abord**, puis, les cadres pleins, chacun son tour. **Toucher un cadre** : sa photo en grand (« Accrochée par toi ·
  aujourd'hui ») et « 🖼️ Une autre photo ici » pour changer celle-là.
- **📚 L'étagère au mur** : les souvenirs y sont posés (leur emoji, dans les fentes de la planche) ; un toucher ouvre
  « Votre étagère » (4.10).
- **La table** : ce qu'on y pose (fleur, tasse, croissants, le talkie d'un vocal en attente).
- **Les lampes, la fenêtre** : la lumière et la météo (4.11).
- ✅ Un objet touché réagit en moins de 100 ms ; la caméra glisse en 1,5 s au plus.

### 4.10 L'étagère : les souvenirs du duo

Existe en grande partie (lots E1 à E4 : `etagere.ts`, `etagere-serveur.ts`, `/api/direct/etagere`, `docs/univers/etagere.md`).
Ce que la maquette ajoute ou fixe :

- **La feuille « Votre étagère »** : « ✨ Bien éclairée · vous vous êtes parlé 6 jours sur 7 », trois compteurs
  (souvenirs, promesses tenues, votre blague), puis un meuble en bois à **quatre rayons** : **Nos fiertés**, **À venir**,
  **Ce qu'on aime** et, nouveau, **Nos fous rires** (les blagues, les fous rires, les mèmes). Un rayon vide dit « rien
  encore ». Une étiquette écrite à la main sous chaque emoji. La règle en bas, plus « Et vous pouvez tout garder
  vous-même : 📌 sur une bulle ».
- **La fiche d'un souvenir** : son emoji, son titre, son détail, la citation, « Dit par Camille · lun. 2 nov., 22:31 »,
  « Noté par vos figurines · IA · visible de Camille et toi », le rappel (« ⏰ Ta figurine te le rappellera le jour
  venu »), « Retirer » ; pour un mème, « ▶ Le revoir ».
- **« Je le range ? »** (l'IA, une ou deux fois par conversation au plus, existe) puis **« 📌 Noté ! »** : un panneau
  brandi par la figurine de celui qui l'a dit, l'emoji s'envole vers sa fente, l'autre figurine dit une phrase de la
  banque.
- **📌 Garder (nouveau, demandé par le propriétaire : « j'ai peur que l'IA passe à côté d'éléments à garder »)** : un 📌
  dans le coin de **chaque bulle** (les miennes, les siennes, les vocaux, les mèmes) et de **chaque message de 💬**. Un
  toucher : l'IA traduit la bulle en souvenir — une date, une promesse, un goût, une fierté, un fou rire, ou simplement
  « vos mots » (💬) —, écrit son étiquette courte (« Voir la mer, samedi »), et le range avec « 📌 Noté ! ». Le 📌 devient
  ✓ ; un second toucher dit « C'est déjà sur votre étagère ». Un vocal est rangé par sa transcription ; un mème, comme
  un mème (rejouable). **Pas de limite** pour ce qu'on garde soi-même ; on retire depuis la fiche.
  - **Serveur** : `POST /api/direct/etagere { action: "garder", avec, message }` (l'identifiant du message, du vocal ou
    du mème) → le classement par l'IA (la même consigne que les notes de l'étagère, sans le filtre « une ou deux par
    conversation ») → `{ ok, souvenir }`. Un même message ne se garde qu'une fois.
  - **Vocabulaire** : un genre `mot` et un rayon `rires` s'ajoutent (`etagere.ts`) ; une blague va dans `rires`.
- **Le rappel** : ma figurine le dit à l'arrivée (« Psst… dans 3 jours, l'anniversaire de Camille 🎂 ») et l'objet de
  l'étagère saute.
- ✅ « 📌 Noté ! » se joue au toucher ; le souvenir est sur l'étagère des deux.

### 4.11 La lumière, l'heure, la météo

- **L'heure** : la pièce prend la lumière du moment (matin, soir, nuit : `momentDuoDe`, les trois images existent).
  La puce (🌅 Le soir) la change pour essayer (maquette) ; dans l'appli, c'est l'heure du téléphone.
- **La nuit** : les lampes de la pièce **éclairent vraiment** (une carte de lumière en « multiplication » sur l'image,
  plus de petits halos sur les abat-jour et la bougie, la lueur de la télé qui scintille) ; jamais un voile gris ni un
  carré sombre. Dehors, la lune, des étoiles qui scintillent, quelques fenêtres allumées.
- **La météo du jour**, à la fenêtre seulement (dans les carreaux, jamais sur les rideaux ni dedans) : 🌧️ pluie fine, ☀️
  soleil (un rayon qui entre, de la poussière qui danse dedans), ❄️ neige, ⛈️ orage (un éclair, un grondement). La puce
  dit « Pluie fine · 9° ». **Source** : Open-Meteo (gratuit, sans clé) sur la ville de celui qui regarde (`ville_slug`),
  lue au plus une fois par heure par ville, en cache serveur.
- **Données de la pièce à ajouter au relevé** (`releve.json`, section 8 de `piece-du-duo.md`) : les carreaux de la
  fenêtre en polygone (`fenetreCoins`), les lampes (`lampes` : leurs points), la table (`table` : la zone où l'on pose),
  les fentes de l'étagère (`fentes`), à poser à la main (« ✋ Ajuster à la main »).
- ✅ La nuit reste lisible (on voit les deux visages) ; la pluie ne tombe jamais dans la pièce.

### 4.12 La flamme, le rendez-vous, la présence

- **🔥** : les jours de suite où vous vous êtes parlé ; elle monte d'un cran au premier échange du jour (« 🔥 12 jours de
  suite ! »).
- **📅** : le prochain rendez-vous (de l'étagère, « À venir ») en puce ; un compte à rebours le jour venu.
- **La présence** : « Là, maintenant » ; « … » quand l'autre écrit, 🎙️ quand il enregistre.

---

## 5. Les calques de la scène : comment les figurines peuvent vivre dans l'image du duo

**Le problème.** L'image du duo (`piece-du-duo.md`, section 10) est une seule image : la pièce et les deux figurines
assises, peintes ensemble. Elle est belle (le contact, la lumière, les ombres), mais **figée** : sa section 10.3 le dit
(« plus de bouche qui parle »). La maquette, elle, fait vivre les figurines : la tête sur un ressort qui parle, rit,
rougit, porte un talkie ; le corps qui respire, se penche, danse.

**La solution : découper l'image du duo en calques, une fois, au moment où elle est faite.** C'est ce que la maquette a
fait à la main (détourage, fond reconstitué) ; dans l'appli c'est plus simple, car on sait déjà tout :

1. **La plaque** (le fond) = **la pièce elle-même**, dans la même lumière (`decor.png` ou `lumiere-<moment>.png`) : l'image
   du duo n'est que la pièce, avec les figurines recollées dans leur silhouette (`recoller`) ; derrière elles, c'est
   donc exactement la pièce.
2. **Le masque de chaque figurine** = sa silhouette posée sur le collage (`poserLesFigurines` la connaît : `presence`),
   élargie de la marge déjà peinte (`zonePeinte`), séparée en deux (celle de gauche, celle de droite).
3. **La tête** : dans la silhouette de la pose (connue, détourée), le **cou** est la ligne la plus étroite dans la
   moitié haute ; tout ce qui est au-dessus est la tête ; **le pivot** est le milieu du cou. Le corps garde le cou
   (quelques points de plus sous la ligne) pour qu'une tête qui penche ne laisse pas voir la pièce.
4. **Les fichiers**, faits par le serveur juste après l'image du duo, rangés à côté : `…-corps-a.webp`, `…-tete-a.webp`,
   `…-corps-b.webp`, `…-tete-b.webp` (avec transparence, recadrés au plus près) et `…-calques.json` :

   ```json
   { "plaque": "pieces-duo/salon/lumiere-soir.png",
     "a": { "corps": { "fichier": "…-corps-a.webp", "boite": [x, y, l, h] },
            "tete": { "fichier": "…-tete-a.webp", "boite": [x, y, l, h], "pivot": [px, py] },
            "bouche": [x, y], "joues": [[x, y], [x, y]] },
     "b": { … } }
   ```

   Tout en fractions de l'image, comme le relevé. La bouche et les joues (là où tombent le talkie, la marque 💋, le
   rouge aux joues) se lisent dans la tête par le même modèle qui voit que le relevé, ou se posent à la main.
5. **Sans calques** (une ancienne image, un échec) : l'image du duo, fixe, et les bulles. Rien ne casse.

Coût : rien de plus chez le moteur d'image ; quelques secondes de calcul (`sharp`) par image du duo.

**Plus tard (les poses, `poses-figurine.md`)** : se lever, aller à la télé, rejoindre l'autre demandent les poses de
chaque figurine et un siège vide. Ce n'est pas dans ce cahier ; on y reviendra après le verdict du propriétaire sur
l'essai P0.

---

## 6. Le moteur de la scène (dans le téléphone)

**Un seul module, sans React** (`src/lib/direct/salon-moteur.ts` ou `src/app/salon/moteur.ts`), que l'écran pilote :

```ts
const scene = creerScene(conteneur, { plaque, calques, emplacements, moment, reduit });
scene.geste("bisou", "moi");          // une mise en scène (promesse résolue à la fin)
scene.parle("cam", niveau);           // la tête suit une voix (0 à 1)
scene.talkie("moi", "emet" | "ecoute" | null);
scene.jouerMeme("moi", meme);         // projecteur, BD, tête, musique
scene.viser("duo" | "tele" | zone);   // la caméra
scene.poser("🌷", "cam", indice);      // un objet sur la table
scene.detruire();
```

- **Une seule boucle `requestAnimationFrame`** pour tout : les ressorts des têtes et des corps (la physique de la
  maquette : `TETES`, `FIGS`), les particules et les acteurs (une toile `canvas`), la caméra. **Jamais un `setState` de
  React par image** : React affiche les feuilles, les bulles et les boutons ; le moteur bouge les calques par
  `transform` (translate, rotate, scale) seulement.
- **Les effets** (cœurs, étoiles, traits, anneaux, emojis, lettrage BD, panneau « 📌 Noté ! ») sont ceux de la maquette :
  on les reprend tels quels (ils sont réglés).
- **Les bulles** sont du HTML hors de la caméra, placées d'après la position des têtes (jamais coupées).
- **Les sons** : un seul `AudioContext`, créé au premier toucher (iPhone) ; le volume suit le mode silencieux du
  téléphone (Web Audio est coupé par l'interrupteur de l'iPhone : c'est voulu).
- **Accessibilité** : `prefers-reduced-motion` → les mises en scène se réduisent à leur fin (comme la maquette, `reduit`) ;
  tout ce qui se touche est un bouton avec son nom.

## 7. La vitesse : le budget, et les règles pour le tenir

### 7.1 Le budget

| Mesure | Objectif | Où |
|---|---|---|
| Ouvrir une conversation déjà vue (toucher → pièce et figurines) | **< 400 ms** | iPhone 11, 4G |
| L'ouvrir la première fois | **< 1,5 s** (la plaque floutée tout de suite, < 100 ms) | iPhone 11, 4G |
| Un geste, un mème, une bulle, après le toucher | **< 100 ms** pour que ça commence | tous |
| Images par seconde pendant un geste | **≥ 55**, aucune image de plus de 50 ms | iPhone 11, un Android moyen (Galaxy A14) |
| Réactivité à un toucher (INP) | **< 200 ms** | tous |
| Un geste de l'un, vu chez l'autre | **< 1 s** (puis < 500 ms avec le temps réel, 7.4) | deux téléphones |
| Poids de la première vue (plaque + 4 calques + code de la scène) | **< 900 Ko** | — |

### 7.2 Les images : petites, stables, en cache

- **Des URL qui ne changent pas.** Aujourd'hui chaque lecture signe de nouvelles adresses (`signer(…, 3600)`) : le
  navigateur ne retrouve jamais rien en cache et retélécharge tout à chaque ouverture — c'est la première source de
  lenteur. **Règle** : un fichier de la scène a un nom qui contient son empreinte (il ne change jamais) et se sert par
  une route (`/api/direct/salon/fichier/<empreinte>`) avec `Cache-Control: private, max-age=31536000, immutable`, ou
  par une URL signée longue (7 jours) gardée côté serveur et réutilisée. Une nouvelle image = un nouveau nom.
- **Le bon format, la bonne taille** : WebP (qualité 80) ; deux largeurs (720 et 1080 points), choisies selon l'écran
  (`srcset`) ; les calques recadrés au plus près. Une vignette floue de la plaque (≈ 1 Ko, en base64) part avec la
  liste des conversations : elle s'affiche immédiatement.
- **Le service worker** (`public/sw.js`, existe) garde les fichiers de la scène et le code du salon (« stale while
  revalidate » pour le code, « cache first » pour les fichiers à empreinte).
- **Le préchargement** : sur « Chez moi », quand la liste s'affiche, on précharge dans les temps morts
  (`requestIdleCallback`) la plaque et les calques des deux conversations les plus récentes ; au premier contact du
  doigt sur une conversation (`pointerdown`), la sienne.
- **Les décodages hors de l'affichage** : `img.decode()` avant de montrer un calque ; jamais une image de 1536 points
  décodée pendant une animation.

### 7.3 L'animation : seulement ce qui ne coûte rien

- `transform` et `opacity` seulement, sur peu de couches (`will-change` sur les 4 calques et la caméra, pas ailleurs).
- **Pas de `filter: blur()` ni d'ombre floue sur une grande surface** (très cher sur iPhone) ; les halos sont des
  dégradés. Un seul mélange (`mix-blend-mode`) en plein écran au plus : la carte de lumière de la nuit — à mesurer
  sur l'iPhone 11, sinon une image de nuit déjà éclairée.
- **Dans la boucle** : aucune lecture de mise en page (`getBoundingClientRect`, `offsetWidth`) ; les tailles se lisent
  au redimensionnement seulement. La toile des effets limitée à 2 × la densité de l'écran.
- **La page cachée** (`visibilitychange`) : la boucle, les sons, les vidéos s'arrêtent.
- **Le mode léger, automatique** : si la moyenne des images dépasse 20 ms pendant 2 s, la scène retire la poussière, la
  pluie fine (elle garde quelques gouttes), divise les particules par deux, et ne le dit pas.
- **La vidéo du chat** : le vert retiré **par la carte graphique** (WebGL, un petit shader), pas par `getImageData` image
  par image (aujourd'hui, `compagnon-vivant.tsx` : trop cher en continu à côté du reste) ; ou des boucles déjà
  détourées (WebM avec transparence ailleurs, HEVC avec transparence sur iPhone) si on peut les fabriquer.

### 7.4 Le réseau : jamais sur le chemin d'une animation

- **Tout part tout de suite à l'écran** (« optimiste ») : la bulle, le geste, le mème, « 📌 Noté ! » ; l'envoi suit ; un
  échec défait proprement et le dit (« Pas envoyé : réessaie »).
- **Les envois lourds en arrière-plan** : un vocal se téléverse pendant que sa bulle est déjà là ; une photo est réduite
  dans le téléphone avant (`reduire-image.ts`, existe).
- **Écouter l'autre, sans attendre** : aujourd'hui, la conversation se relit toutes les 4 s (`useVivant`) et « il
  prépare » part toutes les 5 s. **Étape 1** (tout de suite) : un « pouls » minuscule (`GET /api/direct/proches?pouls=<cle>`,
  < 300 octets : le dernier numéro d'événement, sa présence, « écrit / enregistre ») relu **toutes les 1,5 s quand les
  deux sont là**, toutes les 10 s sinon, jamais page cachée ; on ne relit le reste que si le numéro a changé. **Étape 2**
  (un lot à part, avec une revue de sécurité) : le temps réel de Supabase (déjà utilisé ailleurs, `chat-box.tsx`) sur
  un canal par duo, ouvert avec un jeton court signé par le serveur pour cet habitant ; le pouls reste en secours.
- **Une seule requête à l'ouverture** pour tout ce qu'il faut voir (la pièce, les calques, les 30 derniers messages,
  l'étagère, ce qui s'est passé depuis la dernière visite, la météo), mise en cache côté serveur quelques secondes ;
  le reste de 💬 se charge en faisant défiler.

### 7.5 Le code

- Le salon est **un morceau à part** (`next/dynamic`), chargé à l'ouverture d'une conversation, préchargé sur « Chez
  moi » ; aucune bibliothèque lourde (le moteur de la maquette fait moins de 40 Ko compressé).
- Les feuilles (Messagerie, Ton mème, Mettre à la télé…) se construisent à la première ouverture, puis restent.

### 7.6 Mesurer

- Des marques (`performance.mark`) : `salon:toucher`, `salon:plaque`, `salon:pret`, `geste:debut`, `geste:fin` ; un
  compteur d'images par seconde (pendant les gestes seulement) ; envoyés par lots à la mesure existante, une fois par
  ouverture (jamais pendant une animation).
- Une page admin « ⚡ La vitesse du salon » : l'ouverture (médiane, 90 %), les images par seconde, par modèle de
  téléphone.
- **Les essais de vitesse en CI** (Playwright, le processeur ralenti ×4, `--trace off`) : l'ouverture d'une conversation
  déjà vue < 800 ms ; pendant un geste, aucune image de plus de 50 ms.

---

## 8. Les données et les routes (ce qui existe, ce qui s'ajoute)

| Quoi | Existe | S'ajoute |
|---|---|---|
| La conversation (`/api/direct/proches`) | `?fil=`, `?vivant=`, `?presence=`, actions `geste`, `prepare`, `presence`, apartés | `?ouvrir=<cle>` (tout en une fois, 7.4), `?pouls=<cle>`, `?depuis=<cle>` (4.1), `action: "vu"` (dernière visite) |
| Les gestes | panneaux, réactions (`vivant.ts`) | les 12 gestes de la maquette (`GESTES` : `cat` attentions / ensemble), les objets posés sur la table |
| Les vocaux (`talkie-serveur.ts`, `/api/direct/transcrire`) | enregistrer, envoyer, transcrire | `niveaux` (60 ms), `ecoute` (pour le talkie sur la table) |
| Les mèmes (`memes-proches-serveur.ts`) | le mème envoyé à un proche (une vidéo) | le mème-donnée (`texte`, `humeur`, `danse`, `voix?`), joué dans le salon ; la vidéo seulement au partage |
| L'étagère (`/api/direct/etagere`) | noter, ranger, retirer, déposer, rappels | `action: "garder"` (📌), le genre `mot`, le rayon `rires`, les mèmes rangés (`memes`) |
| La télé (`/api/direct/tele`) | le dernier lien YouTube, les clips de secours | ce que l'un y met (un lien, une vidéo, une affiche de film, une pochette), vu des deux |
| Les cadres | « La mettre dans mon univers » (`ranger-univers.ts`) | les photos accrochées dans la pièce du duo (par cadre), changer celle d'un cadre |
| La pièce (`pieces-duo`) | décor, trois lumières, relevé, image du duo | `fenetreCoins`, `lampes`, `table`, `fentes` ; les calques (section 5) |
| La météo | — | `/api/direct/salon?meteo=<ville>` (Open-Meteo, une heure de cache) |

---

## 9. Les lots, leur ordre, et qui fait quoi (proposé)

Tout se construit **derrière un interrupteur** (`SALON_DU_DUO`, éteint) : d'abord à une adresse d'essai pour
l'administrateur (`/univers/salon?avec=<cle>`), sur ses vraies conversations ; on l'allume quand le propriétaire l'a
jouée sur son téléphone. L'ancienne conversation (`proches.tsx`) reste en place jusque-là.

**Les fichiers** : un dossier neuf, `src/app/salon/`, un fichier par lot ; **le contrat commun**
`src/lib/direct/salon.ts` (les types, l'API du moteur, la liste des gestes) ne change que par une PR qui le dit. Une
seule session à la fois par fichier.

| Lot | Contenu | Session | Dépend de |
|---|---|---|---|
| **S0 — Le socle et la vitesse** | le contrat `salon.ts` ; le moteur (6) repris de la maquette ; les URL stables et le cache (7.2) ; `?ouvrir=` ; le préchargement ; les mesures (7.6) ; l'adresse d'essai | messages et bienvenue | — |
| **S1 — Les calques** | la découpe de l'image du duo (5) ; les emplacements ajoutés (`fenetreCoins`, `lampes`, `table`, `fentes`) et leur tracé à la main | messages et bienvenue (elle fait l'image du duo) | S0 |
| **S2 — La conversation** | les bulles, 💬 Messagerie, écrire, les réactions au texte, la présence et le pouls (7.4, étape 1), l'arrivée (4.1) | messages et bienvenue | S0, S1 |
| **S3 — Les gestes et la vie** | les 12 gestes, les objets sur la table, la vie propre, le chat (dessiné, puis le compagnon) | univers | S0, S1 |
| **S4 — Le talkie-walkie** | 4.6 entier, le talkie sur la table, les niveaux | univers | S2 |
| **S5 — Les mèmes** | 4.7 entier, la vidéo au partage | univers | S2 |
| **S6 — Les objets et l'étagère** | la télé et « Mettre à la télé », les cadres et « Accrocher », l'étagère (📌 Garder, Nos fous rires, les mèmes rangés), ＋ Envoyer et les films | univers | S2 |
| **S7 — La lumière et la météo** | la nuit éclairée, la météo à la fenêtre, l'heure | univers | S1 |
| **S8 — La bascule** | les essais de vitesse sur vrais téléphones, l'avis du propriétaire, l'interrupteur allumé, l'ancien écran retiré | les deux | tout |
| **S9 — Le temps réel** | 7.4, étape 2 | messages et bienvenue | S2 |

**Chaque lot** : ses essais (une route contre le faux Supabase, un essai navigateur au format téléphone, ajoutés à
`lancer-essais.sh`), sa doc (une section ici), une PR vers `main`, la CI au vert, puis le message au propriétaire avec
ce qu'il peut essayer.

## 10. Ce qui reste à décider par le propriétaire

1. **Le découpage du travail** de la section 9.
2. **Les panneaux** (« MDR », « J'arrive ! »…) : deviennent-ils des gestes de l'onglet 💌, ou disparaissent-ils ?
3. **Le chat** : le dessiné de la maquette pour commencer, ou attendre le verdict sur le compagnon (C0) ?
4. **Les pièces** : la maquette n'a qu'un salon ; l'appli en a huit (`PIECES_DUO`). Tout ce cahier marche dans
   chacune (par leurs emplacements) ; à confirmer que l'invitation à changer de pièce (`piece-du-duo.md`, section 12)
   reste.
5. **Le temps réel** (7.4, étape 2) : à faire tout de suite après S2, ou plus tard.
