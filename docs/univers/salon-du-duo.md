# Le salon du duo — la messagerie visuelle : le cahier des charges commun aux deux sessions

**Statut : écrit le 16 novembre 2026, à la demande du propriétaire ; ses réponses aux cinq questions (section 10) le
même jour : le découpage du travail est validé.** Les deux sessions le lisent avant de toucher à la conversation entre deux proches. On le change
par une PR qui le dit dans son titre, et l'autre session en est prévenue (par le propriétaire, ou dans `docs/reprise.md`).

> **⚠️ Mis à jour le 16 novembre 2026 au soir : lire d'abord la section 12.** Les pièces deviennent **un catalogue de
> neuf** (les huit, plus la chambre musicale), le même pour le salon du duo et pour la maison de chacun ; **leurs images
> sont refaites** aux proportions et avec les éléments de la maquette ; **les figurines sont posées** sur la pièce (plus
> de découpe de l'image du duo : la section 5 change, **le contrat `salon.ts` ne change pas**). La maison de chacun a
> son cahier : `docs/univers/ma-maison.md`.

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
| **Les onglets** | 💌 Petites attentions · 🛋️ Ensemble · 🎭 Mèmes ; **toucher l'onglet ouvert replie la barre de puces** (la scène s'agrandit d'autant), un toucher sur un onglet la rouvre ; le choix est gardé sur le téléphone (le propriétaire, le 16 novembre 2026 : « si je désélectionne Petites attentions, ne plus avoir les icônes dessous pour agrandir l'image globale ») | — |
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

- **💌 Petites attentions** : 👋 Coucou · 😘 Bisou · 🤜 Check · 🪶 Chatouilles · 🌷 Une fleur, puis **les huit panneaux
  d'aujourd'hui** (`PANNEAUX`, `vivant.ts`) : 😂 MDR · 🏃 J'arrive ! · 📞 Rappelle-moi · 👏 Bravo ! · 😴 Pas dispo · 💭 Je
  pense à toi · 🙏 Merci ! · 🌙 Ce soir ? — la figurine brandit sa pancarte, vue des deux, comme aujourd'hui (décidé par
  le propriétaire le 16 novembre 2026).
- **🛋️ Ensemble** : 🤗 Câlin · ☕ Un café · 🎶 Danser · 📺 Un clip (la feuille de la télé) · 📸 Photo à deux · 🖼️ Accrocher
  (la feuille des cadres) · 🎁 Surprise.

Chaque geste est **une petite mise en scène de 1,5 à 3 s**, jouée chez les deux : le bisou vole d'une figurine à
l'autre et laisse une marque 💋 sur la joue, qui rougit ; le check se fait poing contre poing avec un éclair ; le café
pose une tasse qui fume sur la table ; danser allume la boule (lumières) et les deux dansent ; la photo à deux fait un
flash et accroche la photo au mur… L'autre répond souvent par un geste (un bisou rendu, un croissant posé).
**Les objets posés restent sur la table** (une tulipe, une tasse) et se touchent (« Camille a laissé une tulipe ·
8 h 12 »).

- L'appui long sur une bulle garde **les six réactions avec le corps** d'aujourd'hui (👏 😂 ❤️ ✋ 🤦 😮, `vivant.ts`).
- ✅ Le geste part au toucher (sans attendre le serveur) ; s'il est refusé, il se défait et on le dit.

### 4.5 La vie propre des figurines, et le chat

- **Au repos**, chaque figurine respire (le corps), la tête sur son ressort se balance doucement et, toutes les 5 à 10 s,
  penche un peu ; de temps en temps elles se regardent, s'étirent.
- **Si personne ne fait rien** pendant une vingtaine de secondes alors que l'autre n'est pas là, la scène peut jouer son
  arrivée spontanée (section 4.1) — seulement dans la maquette ; dans l'appli, c'est sa vraie arrivée.
- **Le chat** : **celui de l'essai C0** (`compagnon.md`, ses huit boucles vidéo sur fond vert, le vert retiré dans le
  téléphone) — le propriétaire, le 16 novembre 2026 : « celui qu'on a conçu déjà sur l'admin est mieux que celui de la
  maquette ». Il se place au coin du chat de la pièce (`emplacements.chat`, un point : aussi simple que le dessiné) et
  sur mes genoux (au-dessus de ma place) ; ses boucles : il dort, il s'assoit, il marche (il traverse la pièce), il
  dresse les oreilles à chaque message, il saute de joie à un fou rire, il ronronne sur mes genoux (son vrai son
  enregistré). On le touche, il ronronne. Le vert retiré par la carte graphique (7.3).
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

### 4.13 La pièce : la choisir au départ, en changer

Le propriétaire, le 16 novembre 2026 : « il faut pouvoir changer de pièce, ou choisir la pièce que l'on veut au départ
de la conversation ».

- **Au départ d'une conversation** (la toute première fois avec ce proche, ou en démarrant une conversation depuis
  « Chez moi » / « ＋ Nouveau ») : « Où vous installez-vous ? » — les vignettes du catalogue (`ma-maison.md`, section 2 :
  salon, cuisine, terrasse, chambre vue mer, café, hangar, appart à New York, rue, et la chambre musicale), **la pièce
  de celui qui invite en premier** (celle qu'il a choisie pour sa maison), un toucher et on y est. Les autres fois, on
  rouvre dans la dernière pièce du duo.
- **🚪 Changer de pièce, à tout moment** (en haut de la scène) : la même liste. Si l'autre est là, c'est une invitation
  (« Camille t'invite sur la terrasse » — « Venir » / « Pas maintenant », comme dans la maquette de la pièce,
  `piece-du-duo.md` section 12) ; s'il n'est pas là, la pièce change, et il arrivera dans la nouvelle (« ✨ Léa vous a
  installés sur la terrasse »).
- **Ce qui suit la pièce** : les objets posés sur la table, les photos des cadres et ce qui passe à la télé restent ceux
  du duo (ils changent de pièce avec lui) ; l'étagère est la même partout.
- **La vitesse** : les images de chaque pièce (dans la lumière de l'heure) se préchargent une à une après l'ouverture ;
  les figurines étant posées (section 5), **toute pièce s'ouvre tout de suite**, même jamais visitée (< 300 ms) : plus
  d'attente « Vos figurines s'installent… ».

---

## 5. Les calques de la scène : comment les figurines peuvent vivre dans l'image du duo

> **⚠️ Remplacé le 16 novembre 2026 au soir (section 12, décision 7) : les figurines sont posées.** On ne découpe plus
> l'image du duo : **la plaque** est l'image de la pièce du catalogue (en hauteur, dans la lumière du moment) ; **les
> calques de chaque figurine** (son corps avec son fauteuil, sa tête et son pivot, la bouche, les joues) sont faits
> **une fois par figurine** (`ma-maison.md`, section 4) et posés aux deux places du relevé, tournés l'un vers l'autre.
> Le format des calques (`CalquesDuo`, ci-dessous, et le contrat `salon.ts`) **ne change pas** ; seules leurs boîtes
> sont calculées d'après les places et l'échelle de la pièce au lieu d'être découpées. Le texte qui suit garde
> l'ancienne méthode pour mémoire.

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
| Un geste de l'un, vu chez l'autre | **< 2 s** avec le pouls (7.4, étape 1) ; < 500 ms avec le temps réel (étape 2) | deux téléphones |
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
| La pièce du duo (`/api/direct/salon`) | — | `fils/<paire>/piece.json` ; `?pieces=<cle>` (le catalogue, scènes entières), actions `piece` et `venir` (l'invitation) ; dans le pouls : `piece`, `invitation`, `refus` (11.10) |
| La pièce (`pieces-duo`) | décor, trois lumières, relevé, image du duo | le catalogue de neuf, en hauteur et en largeur (`ma-maison.md`, M0) ; `fenetreCoins`, `lampes`, `table`, `fentes`, `centre`, `echelle` ; les calques de chaque figurine, posés (section 5) |
| La météo | — | `/api/direct/salon?meteo=<ville>` (Open-Meteo, une heure de cache) |

---

## 9. Les lots, leur ordre, et qui fait quoi (validé par le propriétaire le 16 novembre 2026)

Tout se construit **derrière un interrupteur** (`SALON_DU_DUO`, éteint) : d'abord à une adresse d'essai pour
l'administrateur (`/univers/salon?avec=<cle>`), sur ses vraies conversations ; on l'allume quand le propriétaire l'a
jouée sur son téléphone. L'ancienne conversation (`proches.tsx`) reste en place jusque-là.

**Les fichiers** : un dossier neuf, `src/app/salon/`, un fichier par lot ; **le contrat commun**
`src/lib/direct/salon.ts` (les types, l'API du moteur, la liste des gestes) ne change que par une PR qui le dit. Une
seule session à la fois par fichier.

| Lot | Contenu | Session | Dépend de |
|---|---|---|---|
| **S0 — Le socle et la vitesse** | le contrat `salon.ts` ; le moteur (6) repris de la maquette ; les URL stables et le cache (7.2) ; `?ouvrir=` ; le préchargement ; les mesures (7.6) ; l'adresse d'essai | messages et bienvenue | — |
| **S1 — Les calques** | ~~la découpe de l'image du duo~~ **les calques de chaque figurine, faits une fois, et leur pose aux places** (5, et `ma-maison.md` section 4) ; les emplacements ajoutés (`fenetreCoins`, `lampes`, `table`, `fentes`) et leur tracé à la main | messages et bienvenue | S0 ; les images refaites : M0 (`ma-maison.md`, univers) |
| **S2 — La conversation** | les bulles, 💬 Messagerie, écrire, les réactions au texte, la présence et le pouls (7.4, étape 1), l'arrivée (4.1), choisir la pièce et en changer (4.13) | messages et bienvenue | S0, S1 |
| **S3 — Les gestes et la vie** | les 12 gestes et les 8 panneaux, les objets sur la table, la vie propre, le chat (le compagnon de l'essai C0) | univers | S0, S1 |
| **S4 — Le talkie-walkie** | 4.6 entier, le talkie sur la table, les niveaux | univers | S2 |
| **S5 — Les mèmes** | 4.7 entier, la vidéo au partage | univers | S2 |
| **S6 — Les objets et l'étagère** | la télé et « Mettre à la télé », les cadres et « Accrocher », l'étagère (📌 Garder, Nos fous rires, les mèmes rangés), ＋ Envoyer et les films | univers | S2 |
| **S7 — La lumière et la météo** | la nuit éclairée, la météo à la fenêtre, l'heure | univers | S1 |
| **S8 — La bascule** | les essais de vitesse sur vrais téléphones, l'avis du propriétaire, l'interrupteur allumé, l'ancien écran retiré | les deux | tout |
| **S9 — Le temps réel** | 7.4, étape 2 — seulement si le propriétaire trouve le délai du pouls gênant (section 10) | messages et bienvenue | S2 |

**Chaque lot** : ses essais (une route contre le faux Supabase, un essai navigateur au format téléphone, ajoutés à
`lancer-essais.sh`), sa doc (une section ici), une PR vers `main`, la CI au vert, puis le message au propriétaire avec
ce qu'il peut essayer.

## 10. Les décisions du propriétaire (16 novembre 2026)

1. **Le découpage du travail** (section 9) : « oui ».
2. **Les panneaux** : ils deviennent des gestes de 💌 Petites attentions (4.4).
3. **Le chat** : celui de l'essai C0, « mieux que celui de la maquette » (4.5) — il se place aussi simplement (un point).
4. **Les pièces** : « oui, il faut pouvoir changer de pièce, ou choisir la pièce que l'on veut au départ de la
   conversation » (4.13).
5. **Le temps réel** : la question lui a été réexpliquée (un geste de l'un vu chez l'autre en 1 à 2 s avec le pouls,
   ou en moins d'une demi-seconde avec le temps réel) ; « oui, ok, je suis d'accord » : le pouls (S2) d'abord ; le temps
   réel (S9) seulement s'il trouve le délai gênant en jouant le salon à deux, sur deux téléphones.

---

## 11. Le socle : le contrat, le moteur, l'adresse d'essai (lot S0a, 16 novembre 2026)

### 11.1 Le contrat commun : `src/lib/direct/salon.ts`

Ce que les deux sessions partagent, et qui ne change que par une PR qui le dit dans son titre :

- **Les mots de la scène** : `Qui` (`"moi"` / `"autre"`), `Point` et `Zone` (en fractions de l'image de la pièce, comme
  le relevé), `Sens` (1 : tournée vers la droite ; −1 : vers la gauche).
- **Les calques** (section 5) : `CalqueImage` (`fichier`, `boite`, et `decoupe` : la partie de l'image à montrer, toute
  l'image sinon), `CalqueFigurine` (`corps`, `tete` avec son `pivot`, `bouche?`, `joues?`), `CalquesDuo`.
- **Les gestes** (4.4) : `GESTES` (les 12 de la maquette, `cat` attentions / ensemble) et `PUCES_GESTES` (les 20 puces
  du plateau : les 5 attentions, les 8 panneaux de `vivant.ts` en `panneau-<cle>`, les 7 à faire ensemble).
- **L'API du moteur** : `Scene` (`viser`, `figurine(q)`, `parle`, `fx`, `sons`, `repere`, `milieu`, `geste`, `attendre`,
  `surImage`, `occupee`, `reduit`, `leger`, `detruire`), `CommandesFigurine` (les ressorts : `pencher`, `gonfler`,
  `sursaut`, `secouer`, `parler`, `rire` pour la tête ; `pencherCorps`, `rapprocher`, `bondir`, `danser`, `endormir`,
  `reveiller` pour le corps), `EffetsScene` (`part`, `acteur`, `eclatCoeurs`, `etincelles`, `anneau`, `jaillir`,
  `traitsDeRire`, `zZz`, `texteQuiMonte`, `lettrage`, `secousse`, `flash`, `rougir`, `marqueBisou`), `SonsScene`
  (`bruit`, `note`, `kssht`, `bipFin`, `clac`, `jingle`), `Particule`, `Acteur`, `Repere` (`tete`, `haut`, `bouche`,
  `joue`, `cote`, `main`), `Vue` (`"piece"`, `"duo"`, une zone, ou un point et une échelle), `OptionsScene`.
- **Le registre des mises en scène** : `enregistrerMiseEnScene(cle, jouer)` et `miseEnSceneDe(cle)`. Une mise en scène
  est une fonction `async (scene, de) => …` qui ne touche qu'à l'API ci-dessus ; `scene.geste(cle, de)` les joue l'une
  après l'autre et rend la main à la fin.

**Écrire un geste (lot S3), en trois lignes** : dans son fichier (`src/app/salon/gestes.ts`),

```ts
enregistrerMiseEnScene("coucou", async (s, de) => {
  s.figurine(de).sursaut(0.6);
  s.fx.jaillir("👋", s.repere(de, "cote"));
  await s.attendre(900);
});
```

puis une ligne dans `src/app/salon/mises-en-scene.ts` (`import "./gestes";`) : le salon et l'adresse d'essai importent
ce fichier, et ont ainsi toutes les mises en scène. Le talkie (S4), les mèmes (S5), les objets sur la table (S3, S6)
font de même ; ce qui doit vivre à chaque image (une aiguille, un niveau de voix) s'accroche à `scene.surImage`. S'il
manque au moteur une commande, elle s'ajoute au contrat par une PR qui le dit.

### 11.2 Le moteur : `src/app/salon/moteur.ts`

`creerScene(conteneur, options)` rend une `Scene`. Il est repris de la maquette validée, sa physique et ses effets tels
quels (ils sont réglés) :

- **Le DOM** : la scène, un « secoueur » (la secousse), la caméra, la pièce ; dans la pièce, la plaque, une figurine par
  côté (son corps, et dedans sa tête, qui tourne autour de son pivot), la toile des effets (au plus deux fois la densité
  de l'écran) et une couche pour le lettrage. La pièce couvre la scène (« cover »), un peu plus de place laissée en bas
  qu'en haut (`cadrageVertical`, 0,3) ; elle se remet en place à chaque changement de taille.
- **Les repères** (où tombent les effets) se lisent dans les calques : le haut de la tête (l'ancre des bulles), la
  bouche et les joues (celles des calques, ou devinées dans la boîte de la tête, du côté de l'autre), le côté, la main.
- **La caméra** : une transition CSS de 1,5 s, toujours dans la pièce (jamais de bord vide). À chaque changement de vue
  ou de taille, `surAncres` donne la place, à l'écran, du haut de chaque tête : les bulles (S2) sont du HTML hors de la
  caméra, posées là.
- **Une seule boucle** : les têtes, puis les corps, puis la toile (rien à effacer quand elle est vide), puis ce qui est
  accroché par `surImage`. La page cachée : la boucle et les sons s'arrêtent, et repartent à son retour.
- **Le mode léger** : si les images durent en moyenne plus de 20 ms pendant 2 s, une particule sur deux, et `surLeger`
  prévient l'écran. **`prefers-reduced-motion`** : plus de balancement ni de particules, des mises en scène réduites à
  leur fin (`scene.reduit`).
- **Les sons** : un seul `AudioContext`, créé au premier toucher ; des bruits et de courtes musiques, jamais une voix.
- **`detruire()`** : la boucle, les minuteries, les écouteurs, le son, le DOM ; une mise en scène en cours s'arrête là.

### 11.3 L'adresse d'essai : `/univers/salon` (administrateur)

`src/app/univers/salon/page.tsx` et `src/app/salon/essai-moteur.tsx`. La pièce et les deux figurines choisies dans
l'essai du collage (`/admin/humain/univers-essais`, « L'effet collage ») : la pièce vide en plaque ; chaque posée
découpée au cou (à 42 % de sa hauteur) en deux calques, posée comme le collage la pose — en attendant les vrais calques
du lot S1. Moi à gauche (tournée vers la droite), l'autre à droite. Dessous, un tableau qui fait jouer chaque ressort
de la tête et du corps, chaque effet (et un bisou qui vole d'une figurine à l'autre, pour les acteurs), chaque son, la
caméra (la pièce, le duo, une tête), et les 20 gestes : un geste sans mise en scène le dit. Deux points (bleu, rose)
montrent les ancres des bulles ; la cadence s'affiche (images par seconde). La vraie conversation (`?avec=<cle>`)
arrivera avec S2.

**L'essai** (`scripts/navigateur/salon-moteur.mjs`, un iPhone, le faux Supabase) : un visiteur renvoyé ; deux figurines
en deux calques chacune, dans l'écran ; les têtes qui vivent seules ; « Rire » (les allers-retours, mesurés image par
image) ; « Bondir » ; les cœurs sur la toile puis la toile effacée ; le lettrage qui arrive et repart ; le bisou qui
vole, sa marque et le rouge aux joues ; la caméra sur le duo, les ancres qui suivent, le retour sur la pièce ; un geste
sans mise en scène ; « Recommencer la scène » (une seule scène) ; la page cachée (tout s'arrête, puis repart) ; la plus
longue image pendant un moment chargé (une mesure : les seuils viennent avec S0b) ; « réduire les animations » ; ni
débordement, ni erreur, ni le mot interdit.

### 11.4 La vitesse : les images à adresse stable, `?ouvrir=`, le préchargement, les mesures (lot S0b)

- **Les images à adresse stable** (`src/lib/direct/salon-fichiers-serveur.ts`, `imageSalon(supabase, chemin)`) : une image
  du stockage (la plaque ; les calques du lot S1) devient, une fois, des fichiers nommés par l'empreinte de son contenu
  (`salon/fichiers/<empreinte>-<largeur>.webp` : 128 bits, impossible à deviner), en WebP qualité 80, en deux largeurs
  au plus (720 et 1080 points, jamais plus que la source ; la transparence gardée), avec une vignette floue
  (`data:`, une centaine d'octets). Un index par source (`salon/index/…json`) retient sa version (date et taille, lues
  dans la liste du dossier) : rien n'est refait tant qu'elle ne change pas ; une nouvelle image donne une nouvelle
  adresse, l'ancienne reste lisible. Le type, `ImageSalon` (le contrat) : `src` (la plus grande), `srcset`, `largeur`,
  `hauteur` (l'image d'origine), `flou`.
- **La route** `GET /api/direct/salon/fichier/<empreinte>-<largeur>.webp` : `Cache-Control: private, max-age=31536000,
  immutable`, un `ETag` (304 quand le téléphone l'a déjà) ; une session d'habitant ou d'administrateur suffit — le nom,
  que seuls les deux du duo reçoivent, en est la clé, comme pour une adresse signée. (Le service worker ne touche pas
  aux requêtes : le cache du navigateur suffit ; la règle « cache first » du 7.2 pourra s'ajouter à `public/sw.js`.)
- **`GET /api/direct/proches?ouvrir=<clé>`** (`src/lib/direct/salon-serveur.ts`, `ouvrirSalon`) : `{ ouverture }` —
  le fil (`?fil=`), la vie (`?vivant=`, ce qu'elle fait après la réponse compris) et la scène (`SceneSalon` : la pièce,
  la lumière de l'heure de Paris — celle de la pièce si cette lumière n'est pas faite —, la plaque à adresse stable, les
  places en points d'assise, les emplacements ; `calques` avec le lot S1 ; `null` tant que la pièce n'est pas faite), en
  une requête. La pièce : le salon, tant que le duo n'en a pas choisi une (S2, 4.13). Le type : `OuvertureSalon`.
- **Côté téléphone** (`src/app/salon/ouvrir.ts`) : `ouvrir(cle)` (une requête, partagée avec un préchargement, gardée
  20 s) ; `prechargerImage(img)` (téléchargée et décodée hors de l'affichage, la même adresse que la scène : jamais
  deux téléchargements) ; `precharger(cle)`, `prechargerQuandLibre(cles)` (`requestIdleCallback`) ; les marques
  `salon:toucher`, `salon:plaque`, `salon:pret`, `mesures()` et `envoyerMesures(deja)` (une fois par ouverture, 2 s
  après, par `sendBeacon`).
- **⚡ La vitesse du salon** (`POST /api/direct/salon { action: "vitesse", plaque, pret, deja, ecran }` ; l'appareil lu
  dans le navigateur : iPhone, Android, autre) : notée par jour (`salon/vitesse/<jour>.json`, 500 au plus ; deux en même
  temps, l'une peut se perdre — c'est une mesure). `GET /api/direct/salon?vitesse=1` (administrateur) : les sept derniers
  jours, la médiane et les 90 % (déjà vue, la première fois), par appareil — affichés au bas de l'adresse d'essai.
- **L'adresse d'essai** : « Tes conversations » (préchargées : les deux premières dans un temps mort, chacune au premier
  contact du doigt) ; `?avec=<clé>` ouvre la vraie conversation comme le salon l'ouvrira — la vignette floue, la pièce,
  puis la scène — et affiche ses temps (« première fois » ou « déjà vue sur ce téléphone »).

**Les essais** : `scripts/essai-salon-route.mjs` (qui peut ouvrir ; la scène `null` puis faite ; la plaque, ses deux
largeurs, sa vignette ; le fichier en WebP, gardé un an, 304, les noms refusés ; rouvrir : la même adresse, rien de
refait ; une nouvelle image : une nouvelle adresse ; la mesure) et `scripts/navigateur/salon-ouvrir.mjs` (le
préchargement avant le toucher ; la pièce préchargée servie telle quelle ; la vignette floue ; les temps ; la mesure
partie une fois ; « déjà vue » ; un nouvel onglet : la pièce vient du cache, rien de téléchargé ; **le processeur ralenti
×4 : une conversation déjà vue prête en moins de 800 ms, la requête comprise** — 115 ms ici). La plus longue image
pendant des effets, ralenti ×4, est mesurée (33 à 50 ms ici) : le seuil « aucune image de plus de 50 ms pendant un geste »
s'essaiera sur les gestes eux-mêmes (lot S3).

### 11.5 Les calques, découpés dans l'image du duo (lot S1, première partie)

- **La découpe** (`decouperCalques`, `src/lib/direct/pieces-duo-collage-serveur.ts`), sans moteur d'image (quelques
  calculs de `sharp`) : la plaque est la pièce elle-même, dans la même lumière ; chaque figurine est ce que l'image du duo
  a peint dans SA silhouette — les poses replacées comme le collage les place, la zone peinte du duo (la même que pour le
  recollage) et, pour savoir à qui est un pixel, la zone de chacune. Les couleurs sont celles de l'image rendue,
  retrouvées sous le fondu du recollage (`duo = pièce × (1 − p) + rendu × p`) : posés sur la pièce, les calques redonnent
  l'image du duo (l'essai : 9 pixels sur 6 144 s'en écartent, à cause du WebP).
- **Le cou** (`couDeLaPose`) : la ligne la plus étroite de la silhouette de la pose, entre le quart et 55 % de sa hauteur,
  si elle est nettement plus étroite que la tête (sinon — des cheveux longs sur les épaules — à 42 %). La tête : tout ce
  qui est au-dessus, le cou compris (3 % de la hauteur sous la ligne, fondu sur deux points) ; le corps : tout ce qui est
  dessous, en gardant 2 % au-dessus de la ligne (une tête qui penche ne laisse pas voir la pièce). Le pivot : le milieu du
  cou. La bouche et les joues ne sont pas encore lues : le moteur les devine dans la boîte de la tête.
- **Une fois** (`calquesDuCollage`) : à la première demande après l'image du duo, rangés à côté d'elle
  (`<duo>-corps-a.png`, `-tete-a`, `-corps-b`, `-tete-b`, `<duo>-calques.json`), puis relus. Une nouvelle image du duo (de
  nouvelles places, une autre lumière) a un autre nom : ses calques se refont.
- **`GET /api/admin/direct/pieces-duo/collage?calques=1`** (administrateur) : `{ calques: CalquesSalon }` — la plaque et
  les quatre calques à adresse stable (11.4), leurs boîtes et les pivots en fractions ; `null` tant que l'image du duo
  n'est pas faite. Le type `CalquesSalon` s'ajoute au contrat.
- **L'adresse d'essai** prend les vrais calques dès que l'image du duo du collage est faite (« 🎭 Les vrais calques »),
  sinon la découpe provisoire des posées (« ✂️ Découpe provisoire »).

**Les essais** : `scripts/essai-pieces-duo-collage-route.mjs` (la plaque et les quatre calques à adresse stable ; la
tête au-dessus du corps, le cou dans les deux, le pivot au cou ; posés sur la pièce, ils redonnent l'image du duo ;
découpés une fois) et `scripts/navigateur/salon-moteur.mjs` (l'image du duo faite par le faux moteur : la page passe
aux vrais calques, chargés à adresse stable, les têtes vivent).

**Dépassé le soir même** (section 12, décision 7) : les figurines sont posées, on ne fait plus l'image du duo de chaque
paire. Cette découpe reste pour l'adresse d'essai et pour mesurer.

### 11.6 Les carreaux de la fenêtre et les fentes de l'étagère (lot S1)

- **Le relevé de la pièce** (`EmplacementsDuo`, `src/lib/direct/pieces-duo.ts`) gagne deux emplacements, facultatifs :
  `fenetreCoins` (les carreaux de la fenêtre, un polygone de 3 à 12 points : la météo ne tombe que dedans, lot S7) et
  `fentes` (8 points au plus : les souvenirs s'y posent sur l'étagère, lot S6). `emplacementsValides` les vérifie (ce qui
  est faux est laissé de côté) ; `?ouvrir=` les donne dans la scène. **La table basse et les lampes** (`table`, `lampes` :
  des boîtes) viennent du lot M0 de la session de l'univers, et se tracent sur la page des pièces.
- **Leur tracé à la main** : sur l'adresse d'essai, « ✋ Les emplacements du salon » (`src/app/salon/emplacements-salon.tsx`)
  — la pièce choisie, les carreaux touchés point par point, chaque fente d'un toucher (la table et les lampes montrées en
  pointillés, pour repère) ; « Effacer cette zone », « Enregistrer ».
- **`POST /api/direct/salon { action: "emplacements", piece, fenetreCoins?, fentes? }`** (administrateur ;
  `poserEmplacementsSalon`, `src/lib/direct/salon-serveur.ts`) : **seulement ces deux-là** changent dans le relevé — les
  autres zones (la table et les lampes comprises), les places et leur lecture (`ajuste`) restent. (L'action « ajuster »
  de la page des pièces refait tout le relevé « à la main ».) La page des pièces, elle, garde ces deux emplacements quand
  on y retouche les autres.

**Les essais** : `scripts/essai-salon-route.mjs` (pour l'administrateur seulement ; posés ; une fente hors de l'image et
une fenêtre de deux points laissées de côté ; le reste du relevé intact, la table et les lampes de la page des pièces
comprises ; une pièce aux places relevées garde leur lecture ; la scène les donne) et
`scripts/navigateur/salon-moteur.mjs` (les carreaux point par point, trois fentes, « Enregistrer », dans le relevé, le
reste intact).

**La suite du lot S1** (section 12) : les calques de chaque figurine, faits une fois (`ma-maison.md`, section 4), et
leur pose aux deux places de la pièce, `CalquesDuo` composé à l'ouverture — fait, section 11.7.

### 11.7 Les calques de chaque figurine, faits une fois, et leur pose (lot S1, troisième partie)

- **D'où** : sa figurine assise dans son fauteuil (sa fiche, `references.assise`, le nouveau style `collection-1`).
- **La découpe** (`src/lib/direct/calques-figurine-serveur.ts`, `sharp` seulement, aucun moteur d'image) :
  - **le corps** : la plus grande silhouette seule (les traînées du détourage écartées), recadrée au plus près, la tête
    d'origine comprise ;
  - **la tête et ses repères** (sa boîte, le pivot au cou, la bouche, les joues) : relevés une fois par le modèle qui voit
    s'il est branché (`regarderImage`, une analyse d'image, quelques millièmes d'euro : la tête avec la main si elle
    touche le visage, jamais le fauteuil), vérifiés (`reperesValides`) ; sinon **estimés par la silhouette** : le crâne
    (la ligne la plus large du premier tiers), le cou (la plus étroite ensuite, entre 22 % et 55 % de la hauteur, sinon
    à 40 %), la tête dans la largeur du crâne (pour ne pas emporter les accoudoirs) ;
  - **le calque de la tête** : ce que sa boîte contient, fondu sur deux points en bas.
- **Rangés et publiés une fois** : `<habitant>/calques/<empreinte>-corps.png`, `-tete.png` et `.json` ; publiés en WebP
  à adresse stable (`imageSalon` : le corps en 360 et 720 points, la tête en 180 et 360 — `LARGEURS_CALQUES`, moins de
  80 Ko). Le `.json` garde les repères (dans le cadre de la figurine : de 0 à 1 sur la boîte du corps) **et les
  adresses** : ouvrir une conversation ne demande qu'une lecture par figurine. Une nouvelle tenue (une nouvelle image) a
  une autre empreinte : de nouveaux calques, les anciens restent (un téléphone qui les a encore).
- **Quand** : après « C'est moi ! » (`POST /api/direct/nouvelle-figurine { action: "valider" }`, après la réponse) ; pour
  une figurine validée avant, juste après la première ouverture d'une conversation où ils manquent (`aDecouper`,
  `after()`) ; ou sur demande (ci-dessous).
- **La pose** (`src/lib/direct/figurine-calques.ts`, partagé) : `poserFigurine(f, place, piece, { tracee, taille })` rend
  la forme `CalqueFigurine` du contrat (**inchangé**), en fractions de la pièce — la boîte au milieu de la place, à la
  `taille` voulue (de la tête au sol) ; sur une place relevée (un point d'assise), ce point aux 68 % de sa hauteur
  (`ANCRE_FAUTEUIL`) ; sur une place tracée (de la tête au sol), le sol de la place ; la largeur suit son rapport et
  celui de la pièce. **Pour « Ma maison »** (session de l'univers) : `calquesDeFigurine(supabase, h)` puis
  `poserFigurine(f, centre, piece, { tracee: true })`.
- **À l'ouverture d'une conversation** (`ouvrirSalon`) : les calques des deux figurines se lisent en même temps que le
  reste, posés aux deux places à la même taille (`hauteurDuo`) — `scene.calques.a` la mienne, à gauche ; `b` la sienne,
  à droite. Tant que l'une manque : la scène sans calques. Le téléphone précharge les quatre calques avec la plaque
  (`imagesDe`, `src/app/salon/ouvrir.ts`).
- **Sur l'adresse d'essai** : `?avec=<clé>` pose les deux figurines (le `sens` dit vers où chacune se penche ; l'image
  n'est pas retournée) ; « 🎭 Les calques de ta figurine » (`POST /api/direct/salon { action: "calques" }`, l'habitant ;
  `src/app/salon/apercu-calques.tsx`) montre le corps, la tête découpée, et les repères dessinés dessus.
- **Ce qui reste** : regarder la vraie figurine dans la vraie pièce (le propriétaire, sur `/univers/salon`) ; l'ombre au
  sol et la teinte du moment (`ma-maison.md`, section 4) viendront avec la conversation (S2).

**Les essais** : `scripts/essai-calques-figurine-route.mjs` (sans session, sans figurine du nouveau style ; la traînée
écartée ; la tête dans la largeur du crâne jusqu'au cou, le pivot, la bouche et les joues ; les fichiers rangés, le corps
recadré, la tête sans rien du fauteuil ; servis en WebP transparent, gardés un an ; redemandés : rien n'est refait ; à
l'ouverture : découpés après la réponse, puis posés aux deux places, à la même taille, la mienne à gauche ; une nouvelle
tenue) et `scripts/navigateur/salon-ouvrir.mjs` (la première ouverture les découpe, la suivante les pose, la tête vit ;
l'aperçu des calques).

### 11.8 La conversation : l'écran, les bulles, écrire, 💬 Messagerie (lot S2, première partie)

**À l'adresse d'essai** `/univers/salon?avec=<clé>` (l'administrateur, sur ses vraies conversations ; on y arrive aussi
par « Tes conversations ») : **le salon du duo lui-même** (`src/app/salon/salon.tsx`, `SalonDuDuo`), à la place du
tableau d'essai. Sans `avec`, le banc d'essai du moteur ne change pas.

- **L'en-tête** : ‹ retour, l'avatar et le prénom de l'autre, sa présence (« Là, maintenant », un point vert ; sinon
  « Pas là pour l'instant » — l'heure de sa dernière visite viendra avec le pouls).
- **La scène** : la pièce et les deux figurines posées (lots S0 et S1) ; **une bulle par figurine** — le dernier
  message de chacun, seul (un écrit : son texte ; un vocal, une photo, une vidéo : « 🎙️ Un vocal · 0:07 », « 📷 Une
  photo »…) —, au-dessus de sa tête, **posée hors de la caméra** aux ancres que le moteur donne (`surAncres` écrit
  quatre variables de style : jamais un rendu par image), sa pointe vers la tête, jamais coupée ; « 💬 Messagerie » en
  bas à droite, avec ses non-lus ; le petit message en haut (« toast »).
- **Écrire** : ➤ → la bulle part de ma figurine **tout de suite** (15 ms mesurées, avant la réponse du serveur), sa tête
  sautille le temps de la phrase ; 450 ms plus tard, la figurine de l'autre réagit à ce qui est dit, comme la
  maquette (`reactionAuTexte`, `src/app/salon/bulles.ts`) : ❤️ 😘 « bisou », « je t'aime » → elle rougit, des cœurs, elle
  penche la tête ; 😂 « haha », « mdr » → elle rit ; une question → elle penche la tête, un « ? » ; un « ! » → elle
  sursaute ; sinon elle penche un peu la tête ; l'autre absent, sa figurine bouge à peine. L'envoi suit
  (`POST /api/direct/proches { action: "ecrire" }`, lot M1) ; **un échec défait la bulle, rend le texte à la saisie et
  le dit** (« Pas envoyé : réessaie. »).
- **💬 Messagerie** : la feuille monte du bas (un voile derrière ; le voile ou la poignée la ferment), **construite à
  l'ouverture** (5 ms mesurées) : toute la conversation par jour (« Aujourd'hui », « Hier », « lundi 14 novembre »), les
  écrits et leurs liens, les vocaux qu'on écoute (▶, leurs mots), les photos, les vidéos, les mèmes en lignes ; « Toi ·
  8 h 13 » sous chacun ; les non-lus remis à zéro.
- **La vitesse** : processeur ralenti ×4, la plus longue image pendant « je t'aime ❤️ » (la bulle, la tête qui parle,
  les cœurs) est de 67 ms environ (17 ms à vitesse normale) — le seuil de 50 ms s'essaiera sur les gestes (S3).

**La suite du lot S2** : le pouls et l'arrivée (section 11.9) ; puis la pièce du duo qu'on choisit au départ et dont on
change (4.13).
**Pas encore** : le ＋ et le 🎙️ de la saisie (S6, S4), les onglets et les puces (S3), le 📌 des bulles (S6).

**Les essais** : `scripts/navigateur/salon-conversation.mjs` (iPhone : la bulle de l'autre, seule, au-dessus de sa tête,
dans la scène ; les non-lus ; ➤ en moins de 100 ms, la tête de l'autre qui rit, le message parti pour de bon ; la
feuille en moins de 100 ms, les trois messages dans l'ordre, « Aujourd'hui », le voile qui la ferme ; un envoi refusé :
la bulle défaite, le texte rendu, « Pas envoyé ») ; `scripts/navigateur/salon-ouvrir.mjs` (l'ouverture, refaite sur cet
écran).

### 11.9 Le pouls et l'arrivée (lot S2, deuxième partie)

- **Le pouls** (7.4, étape 1 ; `src/lib/direct/pouls-serveur.ts`) : `GET /api/direct/proches?pouls=<clé>` →
  `{ n, la, ecrit?, vu? }`, une vingtaine d'octets, jamais gardé en cache.
  - `n` : le numéro du dernier événement du duo, noté dans `fils/<paire>/pouls.json` par `battre` après chaque message
    (vocal, écrit, photo, vidéo), mème, geste et message effacé (la route le fait battre après sa réponse) ;
    « il prépare » ne le fait pas battre ;
  - `la` : l'autre est là (ClikMe ouvert dans les 2 min 30, s'il se montre) ; sinon `vu`, l'heure de sa dernière
    visite (rien s'il ne se montre pas) ;
  - `ecrit` : il écrit (`prepare.json`, frais de moins de 9 s).
  Quatre petites lectures en parallèle ; qui parle à qui est gardé une minute en mémoire.
- **Dans le salon** (`src/app/salon/salon.tsx`) :
  - le pouls bat **toutes les 1,5 s quand l'autre est là, toutes les 10 s sinon, jamais page cachée** (il repart dès
    que la page revient) ; la conversation n'est relue (`?fil=`) que si `n` a changé ;
  - **ses messages arrivent en direct** : sa bulle, sa figurine qui le dit, la mienne qui réagit aux mots ; les
    non-lus montent si 💬 est fermée ;
  - **sa présence** en haut : « Là, maintenant », « Dernière visite à 8 h 13 », « … hier à … », « … lundi 14 novembre » ;
  - **« … »** au-dessus de sa figurine quand il écrit ; et chez lui quand j'écris (redit toutes les 5 s, arrêté à
    l'envoi ou quand la saisie se vide) ;
  - je suis là : la page le dit toutes les minutes ;
  - **il arrive** : sa figurine se réveille et fait coucou (le geste « coucou » s'il est enregistré, sinon 👋), la
    mienne se tourne vers elle ; **il part** : sa figurine somnole.
- **L'arrivée** (4.1) : ce qu'il a laissé depuis ma dernière visite — ses messages et ses mèmes pas encore vus, que
  le serveur marque `nouveau` une fois (rien n'est rejoué deux fois, et une conversation sans rien de neuf ne rejoue
  rien) —, **rejoué un à un** : sa bulle, sa figurine qui le dit, la mienne qui réagit ; 1,4 à 3 s chacun, **12 s au
  plus** (au-delà, les plus récents ; le reste est dans 💬) ; **un toucher sur la scène passe la suite** ; le dernier
  reste. Puis, s'il n'est pas là, sa figurine somnole. (Le cahier prévoyait `?depuis=` : les marques `nouveau` de
  `?ouvrir=` suffisent, dans la même requête.)
- **Pas encore** : rejouer ses gestes (S3), le vocal posé sur la table (S4), le mème joué par sa figurine (S5), le
  rappel de l'étagère (S6) ; la notification qui dit tout ce qui attend (« un bisou, un mème, 2 messages… ») viendra
  avec la bascule (S8).

**Les essais** : `scripts/essai-salon-pouls-route.mjs` (qui peut le lire ; moins de 300 octets ; la présence, sa
dernière visite, celui qui ne se montre pas ; « il écrit » ; le pouls qui bat pour un message, un panneau, un
effacement, et pas pour « il prépare ») ; `scripts/navigateur/salon-pouls.mjs` (iPhone : l'arrivée rejouée dans l'ordre
en moins de 12 s, le dernier qui reste ; « Dernière visite à … » ; 10 s puis 1,5 s quand il arrive ; « … » ; son
message en direct, les non-lus, la réaction ; « … » chez lui quand j'écris ; la page cachée sans pouls ; un toucher
qui passe l'arrivée).

### 11.10 La pièce du duo, la flamme, l'en-tête, l'ombre et la teinte (lot S2, troisième partie)

Le contrat `salon.ts` s'est complété (la PR le dit dans son titre) : `SceneSalon` gagne `choisie?` (le duo a choisi sa
pièce) et `installePar?` (qui l'y a installé : `"moi"` / `"autre"`) ; `OuvertureSalon` gagne `flamme?`
(`Flamme = { jours, moi, lui }`) ; s'ajoutent `PieceDuSalon` et `CataloguePieces`, et l'option `moment` du moteur.

- **La pièce du duo** (4.13 ; `src/lib/direct/salon-serveur.ts`) : `fils/<paire>/piece.json`
  `{ piece, le, par8, invitation? }`. À l'ouverture (`?ouvrir=`), la scène est celle de la pièce du duo ; sinon celle de
  sa maison (`ma-maison.md`) ; sinon le salon — avec `choisie: false`, qui ouvre « Où vous installez-vous ? ».
- **Les routes** (`/api/direct/salon`, l'habitant) :
  - `GET ?pieces=<clé>` → le catalogue : **les pièces prêtes, chacune avec sa scène entière** (sa plaque dans la
    lumière de l'heure, ses places, les deux figurines posées) — la sienne d'abord (`proposee`), puis l'ordre du
    catalogue selon son âge ; et la pièce du duo (`piece`, ou `null`) ;
  - `POST { action: "piece", cle, piece }` : la première fois, ou si l'autre n'est pas là (2 min 30), **la pièce
    change** (`{ piece }`) ; s'il est là, **une invitation** (`{ invitation: true }`), qui vaut 2 minutes ; une pièce
    inconnue → 400, pas encore faite → 409 ;
  - `POST { action: "venir", cle, oui }` : « Venir » (la pièce change pour les deux ; c'est celui qui a invité qui les a
    installés) ou « Pas maintenant » (celui qui a invité le voit une minute) ; une invitation périmée, déjà répondue ou
    la sienne → 410.
- **Le pouls** dit aussi la pièce du duo, l'invitation qui m'attend, le refus de la mienne (`piece?`, `invitation?`,
  `refus?` ; la fiche lue à chaque battement, rien de plus à faire battre).
- **Dans le salon** (`src/app/salon/salon.tsx`) :
  - **« Où vous installez-vous ? »** la toute première fois : les vignettes des pièces prêtes, sa maison d'abord
    (« ✓ Ta pièce ») ; un toucher et on y est (« ✨ Vous voilà · 🛋️ Le salon ») ;
  - **🚪 la pièce, en haut à gauche de la scène, à tout moment** : « Changer de pièce » (« ✓ Vous êtes ici ») ; l'autre
    n'est pas là : on y est tout de suite, il arrivera dans la nouvelle (« ✨ Léa vous a installés · … » chez lui) ;
    il est là : « 🚪 Tu invites Sam · 🍳 La cuisine… », et chez lui une carte « 🚪 Léa t'invite · 🍳 La cuisine »
    — **Venir** / **Pas maintenant** ; il vient : la pièce change chez les deux (« ✨ Sam vous rejoint · … ») ; il
    refuse : « Sam préfère rester ici pour l'instant » ;
  - **toute pièce s'ouvre tout de suite** (< 300 ms ; l'essai en mesure une vingtaine) : le catalogue arrive 0,6 s
    après l'ouverture avec toutes les scènes, les plaques se préchargent une à une ; changer, c'est montrer la scène ;
  - un pouls parti avant ou pendant un changement de ma main ne dit pas la pièce (il ramènerait l'ancienne).
- **L'en-tête** (4.12) : **📚** le nombre de leurs souvenirs (l'étagère) ; **🔥** leurs jours de suite (l'heure de Paris,
  les jours où tous les deux ont écrit, comptés sur les noms des messages : aujourd'hui compte dès que les deux ont
  écrit), qui **monte d'un cran au premier échange du jour** (« 🔥 2 jours de suite ! ») ; **📅** en puce en haut à
  droite de la scène, le prochain rendez-vous de l'étagère (« À venir ») : « 🎬 Ciné · dans 3 jours », « demain »,
  « aujourd'hui » (en rose, le jour venu).
- **L'ombre et la teinte** (`ma-maison.md`, section 4 ; `src/app/salon/moteur.ts`) : une ombre au sol sous chaque
  figurine (`.sc-ombre`, 82 % de la largeur du corps) ; la teinte du moment de la plaque (`data-moment` sur la scène :
  plus chaude le soir, plus sombre la nuit, rien le matin).
- **Pas encore** : démarrer une conversation depuis « Chez moi » / « ＋ Nouveau » (la bascule, S8) ; les objets de la
  table, les cadres et la télé qui suivent le duo d'une pièce à l'autre (S3, S7) ; le compte à rebours du jour venu.

**Les essais** : `scripts/essai-salon-pieces-route.mjs` (le catalogue, sa maison d'abord, seulement les pièces prêtes,
figurines posées ; la première ouverture, `choisie: false` ; la flamme ; 400, 409 ; le choix direct, `installePar` ;
l'invitation, le refus, « Venir » ; une invitation périmée → 410) et `scripts/navigateur/salon-pieces.mjs` (deux
iPhone : « Où vous installez-vous ? », la terrasse d'abord ; 📚 2, 📅 « Ciné · dans 3 jours », 🔥 1 ; les deux ombres,
la teinte ; le salon en moins de 300 ms ; l'autre absent : tout de suite ; l'invitation chez lui, la carte qui tient
dans la scène ; « Pas maintenant », puis réinvité, « Venir » : la cuisine chez les deux ; ils s'écrivent : 🔥 2 ; ni
débordement, ni erreur, ni le mot interdit). Les essais `salon-ouvrir`, `salon-conversation` et `salon-pouls` partent
d'un duo déjà installé dans le salon.

## 12. Les décisions du 16 novembre 2026 au soir : un catalogue, des figurines posées, la maison de chacun

Après les maquettes « Ma maison », le propriétaire a simplifié les univers. Le détail, et les mots du propriétaire :
`docs/univers/ma-maison.md`, section 1. **Ce qui change ici :**

6. **Un catalogue de neuf pièces, le même pour tous** : les huit de `PIECES_DUO` et la chambre musicale (la maison de
   Camille). La même pièce sert au salon du duo (son image en hauteur) et à la maison de chacun (son image en largeur).
   Plus d'univers fabriqué pour chacun, plus de conversation avec Pablito pour le fabriquer.
7. **Les figurines sont posées** (« OK ») : plus de découpe de l'image du duo, plus d'attente à la première visite
   d'une pièce. Section 5 (remplacée) ; **le contrat `salon.ts` ne change pas** (`CalquesDuo` garde sa forme).
8. **Le salon du duo reste en hauteur**, « comme sur la maquette », mais **ses images sont refaites** « pour qu'elles
   aient les mêmes proportions et dimensions, et intègrent les mêmes éléments que la maquette » : la télé, l'étagère et
   les trois cadres au mur, la fenêtre, les lampes, la table basse, le coin du chat, deux places libres en bas au milieu
   (`ma-maison.md`, 2.1 et 2.2 ; lot M0, session de l'univers).
9. **La pièce du duo, au départ** : celle de celui qui invite (sa maison) ; on en change comme avant (4.13).

**Pour la session des messages et de la bienvenue** : le lot **S1** devient « les calques de chaque figurine, et leur
pose » (section 9) — plus simple, et sans moteur d'image ; l'adresse d'essai `/univers/salon` peut déjà poser les
figurines ainsi (c'est ce qu'elle fait en attendant). **L'inscription change** (« Choisis ta pièce » au lieu de la
conversation qui fabrique l'univers) : lot **M3** de `ma-maison.md`, dans cette session. **Pour la session de
l'univers** : les images du catalogue (**M0**), puis « Ma maison » (**M1, M2, M4, M5**).

**La section 11.5** (la découpe de l'image du duo, faite le même jour, avant cette décision) reste utile pour l'adresse
d'essai et pour mesurer ; **la question qu'elle laisse ouverte est tranchée** : on ne fait plus l'image du duo de chaque
paire (« environ 0,55 € la première fois ») ; la suite de S1, ce sont les calques de chaque figurine, faits une fois, et
leur pose aux places de la pièce (`ma-maison.md`, section 4).
