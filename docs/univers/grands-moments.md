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
