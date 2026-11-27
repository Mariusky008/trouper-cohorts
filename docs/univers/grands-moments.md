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

## 3. Les lots

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
- **R4 — la page du moment** (`clikme.fr/m/…`) : l'aperçu dans WhatsApp, la vidéo trois secondes avant, la figurine qui
  rejoue, « Réagis avec ta figurine ».
- **R5 — la vidéo de 4 secondes** pour TikTok et les Reels.
