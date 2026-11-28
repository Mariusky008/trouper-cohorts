# 🎆 Les grands moments des figurines (27 novembre 2026)

Le propriétaire, le 27 novembre 2026 : « lorsqu'on regarde une vidéo, le marqueur principal de ClikMe, c'est les réactions
des figurines, et pour le moment elles sont beaucoup trop légères […] c'est pourtant le moteur et la signature de ClikMe ».
Deux choses : des réactions beaucoup plus marquées, et pouvoir **envoyer le moment** (là où on a réagi dans la vidéo) à
quelqu'un, sur WhatsApp, Instagram, TikTok…

Maquette validée le 27 novembre 2026 : https://claude.ai/artifact/UMLWowMEFXrAd68ktmsAbE (faite à partir de ses images
Gemini : figurine grossie au centre, visage coloré, flammes et aura, bulle, émojis, confettis, les autres autour).

## 1. Ce qui est décidé

- **La figurine qui réagit prend la scène** : elle quitte son fauteuil et grossit au centre (les trois quarts de la
  pièce), fait la tête de l'émotion (ses sept têtes existent déjà : rien de nouveau à fabriquer), son visage se colore
  (sur sa tête seulement), une aura s'allume derrière elle, des émojis jaillissent, une bulle de BD crie le mot. Les
  autres s'assombrissent et se tournent vers elle. 3 secondes. Pas de son ajouté (ni bruitage, ni voix de synthèse).
- **Six émotions** dans la rangée « Réagis » : 😂 le fou rire, ❤️ j'adore, 😱 le choc, 😠 la colère, 😢 la tristesse,
  👏 bravo (😮 « Oh ! » s'en va ; un ancien 😮 joue le choc). Salon de la musique : 🔥 🎶 💃 ❤️ 😂 restent ; 🔥 joue
  « Ça brûle » (flammes dorées), 💃 🎶 gardent leur danse.
- **La bulle** (choix 1 du propriétaire) : ce qu'on a écrit juste avant (5 s au plus), sinon un cri de l'émotion
  (MDR !!!, QUOI ?!, MAIS NON !!!…) — le même pour tous (tiré de l'identifiant du message).
- **Le lien** (choix 2) : la page du moment sur ClikMe (la vidéo trois secondes avant, la figurine qui rejoue,
  « Réagis avec ta figurine »).
- **La vidéo de 4 secondes** (choix 3, « oui on fait ça ») : fabriquée sur le téléphone (canvas + MediaRecorder, MP4),
  rien à payer ; la miniature YouTube relayée par notre serveur pour pouvoir la dessiner. Repli : l'image.
- **On ne copie pas l'image du lecteur YouTube** (impossible : il est fermé aux autres sites). L'image du moment montre
  la miniature officielle de la vidéo et l'heure exacte (« à 2:47 »).
- **Seulement ses propres réactions** se partagent.

## 2. Les signatures (`lib/direct/grands-moments.ts`, `MOMENTS`)

| Émotion | Tête | Couleur | Autour | Geste |
| --- | --- | --- | --- | --- |
| 😂 Le fou rire | rire | jaune-orangé | 😂 🤣 🎉 ✨, confettis | elle sautille |
| ❤️ J'adore | sourire | rose | cœurs qui montent | elle flotte |
| 😱 Le choc | surprise | violet électrique | ⚡ ❗ 💥, rayons, la pièce tremble | elle bondit |
| 😠 La colère | colère | rouge | 🔥 💢 qui montent, la pièce tremble | elle tremble |
| 😢 La tristesse | tristesse | bleu | 🌧️ et gouttes qui tombent | elle s'affaisse |
| 👏 Bravo | sourire | or | 👏 ⭐ ✨, confettis | elle saute |
| 🔥 Ça brûle (musique) | rire | orange | 🔥 🎵 ✨ qui montent | elle sautille |

Une figurine sans expressions prêtes : sa tête du jour (colorée), sinon son image.

## 3. La salle qui vit (lot R2, fait)

- **Une vedette à la fois** : la scène prise, on attend son tour (trois au plus, 6 s au plus) ; en attendant, sur place,
  sa couleur autour de lui (2,2 s) et son émoji au-dessus de sa tête.
- **×2 ×3** : la même émotion touchée encore pendant son moment — elle grandit, sa bulle aussi, d'autres émojis
  jaillissent, la pièce tremble (trois fois à ×3), 1,6 s de plus. Chez moi, tout de suite ; pour les autres, le téléphone
  regroupe les touchers (un message toutes les 1,6 s au plus, après la réponse du précédent — le serveur en compte 1,5) :
  la réaction porte `n` (2 ou 3).
- **🫶 Au même moment** : la même émotion à 1,8 s d'écart, deux figurines côte à côte au centre.
- **Les souvenirs des proches** (la séance) : leur réaction rejouée à sa seconde prend la scène aussi (assis en
  souvenir : la vedette « f:<clé> » ; sur sa propre figurine s'il est là).
- **Ma télé du jour** : ma figurine ou celle d'un proche assis à côté prend la scène (😂 ❤️ 😮 😱 ; 😴 reste petit). Des
  mots restent une bulle à côté de sa tête : on y répond.

## 4. Les lots

- **R1 — le grand moment** (salon ouvert et séance) : `GrandMoment` (`app/univers/salons/grand-moment.tsx`), une vedette
  à la fois (si la scène est prise, la réaction saute au-dessus de sa tête comme avant), la teinte du visage
  (`Teinte`, `figurine-vivante.tsx`), six émotions. La figurine vivante de chacun est demandée en entrant (le salon
  ouvert aussi, plus seulement la séance).
- **R2 — la salle qui vit** : la file d'attente (on passe au centre juste après), la version « sur place » pendant ce
  temps, ×2 ×3 en touchant vite la même émotion, 🫶 deux proches au même moment côte à côte ; les souvenirs des proches
  rejoués à leur seconde (séance) et ma télé du jour.
- **R3 — l'image du moment** (story 1080 × 1920, faite par le serveur comme « Ma figurine du jour ») et « 📸 Envoyer ce
  moment » (8 s après son grand moment, et dans « 💬 Ce qui s'est dit ») ; feuille de partage du téléphone, sinon
  enregistrer l'image et copier le lien.
- **R4 — la page du moment** (`clikme.fr/moment/…`) : l'aperçu dans WhatsApp, la vidéo trois secondes avant, la figurine qui
  rejoue, « Réagis avec ta figurine ». Fait : `src/app/moment/[id]/rejouer.tsx` — la miniature (relayée par
  `/api/direct/moment/<id>/miniature`) et « ▶ Revoir le moment » ; un toucher, la vidéo repart trois secondes avant, avec
  le son ; à la seconde de la réaction, la figurine (`/figurine`, gardée à part) prend la scène (le même `GrandMoment`).
  YouTube ne répond pas, ou tarde (6 s de plus) : la miniature reste et le moment se joue quand même.
- **R5 — la vidéo de 4 secondes** pour TikTok et les Reels. Fait : `src/app/univers/salons/video-du-moment.ts` — le
  téléphone la fabrique lui-même (aucun coût serveur) : un canevas 720 × 1280 filmé par `captureStream` + `MediaRecorder`,
  en MP4 s'il sait (iPhone, Chrome récent), sinon WebM. La miniature et « à 2:47 », la figurine qui surgit à 0,6 s et
  grandit (aura, rayons, son geste), la bulle à 1 s, les émojis et les confettis, « Léa a réagi à… » et l'adresse en
  bas. Elle se fait pendant qu'on regarde l'image (le partage doit partir d'un toucher), puis « 🎬 Envoyer la vidéo » ;
  sans feuille de partage pour les vidéos, elle s'enregistre. Le téléphone ne sait pas filmer : pas de bouton, l'image
  reste. Jamais de son.

## 5. Envoyer ma réaction (retours du 27 novembre)

Maquette validée : https://claude.ai/artifact/AnQNbCwmVhrcjhMYxojvYA. Le bouton « 📸 Envoyer ce moment » en haut à droite de
la scène n'était pas compris. À la place :

- **La carte sous ma figurine** (`.so-carte-envoi`, `[data-carte-envoi]`) monte pendant mon grand moment : la petite image
  de ma réaction (la vignette de la vidéo, ma figurine sur la couleur de l'émotion), « Ta réaction à 2:17 est prête » et
  « Envoyer à un ami ». Une barre rose montre le temps qui reste (3 s + 8 s), puis elle s'efface.
- **La feuille « Envoie ta réaction »** : « Image | Vidéo 4 s » (la vidéo se fait pendant qu'on regarde), un grand aperçu,
  WhatsApp, Story, TikTok, Autre, puis Enregistrer et Copier le lien. Un site ne peut pas ouvrir lui-même la story
  Instagram ou TikTok : ces boutons ouvrent la feuille de partage du téléphone AVEC le fichier. Sans feuille de partage
  pour un fichier (un ordinateur) : WhatsApp envoie le lien, les autres enregistrent le fichier et disent quoi en faire.
- **L'aperçu du lien** (WhatsApp, iMessage…) : `/api/direct/moment/<id>/apercu`, 1200 × 630 en JPEG (~30 Ko). L'image
  story (plus d'un mégaoctet) n'était pas affichée par WhatsApp, qui ne gardait que le texte.

## 6. La vidéo de ma réaction, en montage (27 novembre, V1)

marius trouvait la vidéo de 4 s presque pareille que l'image. Choisi : un vrai montage, puis sa voix (V2, maquette d'abord).
V1 (`video-du-moment.ts`, `MONTAGE`) dure 5 s :

1. **Le moment arrive** (0 à 1,6 s) : la télé en grand, qui s'approche, et le compteur qui monte (0:26… 0:27… 0:28…). Ma
   figurine est assise, sage, en bas.
2. **Le flash** (1,6 s) : l'écran blanchit et tout tremble. La télé recule en haut, ma figurine explose à l'écran (rayons,
   aura, son geste), sa bulle claque, et les émojis et les confettis jaillissent.
3. **La fin** (4,2 s) : « Et toi, tu réagis comment ? » et l'adresse du moment.

Toujours sans son dans V1. V2 : 3 s de sa vraie voix (« 🎙 Dis-le »), posées au moment du flash (section 7).

## 7. 🎙 « Dis-le » : sa voix dans la vidéo de sa réaction (V2, validé le 28 novembre)

Le propriétaire a validé le plan le 28 novembre 2026 (« validé » ; l'écran 4 de la maquette des grands moments n'était
pas lisible depuis la session qui l'a codé : le plan suivait cette doc).

- **Où** : dans la feuille « Envoie ta réaction », côté « Vidéo », sous l'aperçu : « 🎙 Dis-le », et dessous « 3 s de ta
  voix, au moment où ta figurine explose ».
- **Le micro** : un toucher, et il écoute (« Parle ! 3 s », le compte qui descend, « ■ C'est dit » pour finir avant) ; au
  bout de 3 s, il s'arrête tout seul (`VOIX_MOMENT`, `lib/direct/moment-partage.ts` : 3 s au plus, 0,5 s au moins —
  sinon « Je n'ai rien entendu : recommence »). Micro refusé : « Le micro n'a pas répondu : autorise-le… ».
- **La vidéo refaite** (« Ta voix entre dans la vidéo… », 5 s : le téléphone la filme en temps réel) : sa voix part au
  flash (1,6 s), quand sa figurine explose. Puis « Avec ta voix ✓ », « ▶ Réécouter » (du début, avec le son),
  « ↺ Recommencer », « Sans ma voix » (la vidéo muette revient). C'est elle qui part dans WhatsApp, Story, TikTok, Autre
  et Enregistrer.
- **Sa bouche suit sa voix** : à la création du moment, le serveur garde aussi sa figurine bouche ouverte (sa tête qui
  parle posée sur son corps, `moments/<id>-parle.png` ; `/api/direct/moment/<id>/figurine?bouche=1`). Dans la vidéo, elle
  passe devant quand sa voix est forte (`boucheOuverte`, `lib/direct/bouche.ts`), comme pour le bonjour. Sans tête qui
  parle (404) : sa figurine bat sur sa voix.
- **Rien ne part au serveur** : la vidéo est fabriquée par le téléphone ; sa voix n'est que dans la vidéo qu'il envoie
  lui-même. Jamais de voix de synthèse, jamais de bruitage.
- **Le format** : H.264 d'abord (ce que TikTok, Instagram et WhatsApp lisent partout), avec de l'AAC (iPhone, Chrome),
  sinon de l'Opus ; sinon WebM. Le téléphone ne sait pas mettre le son dans la vidéo : « Ton téléphone ne sait pas mettre
  le son dans la vidéo : elle reste muette. »
- **L'iPhone** : le son du téléphone est réveillé dans le toucher « Dis-le » lui-même (sinon Safari le garde endormi, et
  la vidéo serait muette).
- **Le code** : `app/univers/salons/envoyer-moment.tsx` (le micro, la réécoute), `video-du-moment.ts` (`VoixDuMoment`, la
  piste de son, la bouche), `lib/direct/moment-partage-serveur.tsx` (`cheminParleMoment`), `image-du-double-serveur.ts`
  (`parle`, la tête posée à la place).
- **Les essais** :
  - `navigateur/salons-ouverts.mjs` : le faux micro du navigateur (ses bips) ; « Dis-le », « Parle ! », l'arrêt à 3 s ;
    la vidéo refaite, et son son décodé : rien avant 1,4 s, sa voix après 1,6 s ; Réécouter (le son), Sans ma voix ;
  - `essai-expressions-figurine-route.mjs` : un moment de Léa garde sa figurine bouche ouverte (la même taille, sa tête
    qui parle) ; un moment inconnu : 404.
