# L'interview du fantôme — les éléments

Ce dossier nourrit `/autour-de-moi/essai-interview` : le reporter de ClikMe pose
une à quatre questions au chef devant le téléphone, puis le téléphone monte la
vidéo lui-même (ardoise, craie, reporter, photos et vidéos du chef, son).

## Ce qui est ici

| Fichier | Quoi |
|---|---|
| `reporter-0.webp` … `reporter-3.webp` | Le reporter de ClikMe, bouche fermée → grande ouverte, même cadre. Tirés de l'image fournie : le faux damier « transparent » entre le micro et le corps a été retiré, la bouche d'origine rouverte à quatre hauteurs. |
| `chef-0.webp` … `chef-3.webp` | Le fantôme du chef du Bordeaux (moustache, clin d'œil) — à sa place quand il ne veut pas se montrer. Même méthode ; fermée, la bouche devient un sourire sous la moustache. |
| `ardoise.webp`, `ardoise-bande.webp` | L'ardoise entière (ouverture, fin, fond sans photo) et la bande d'ardoise sous l'image. |
| `grain-craie.webp` | Le grain qui donne aux lettres la matière de la craie (tuile 256 px). |
| `kalam-400.woff2`, `kalam-700.woff2` | La police « à la craie » (Kalam, licence SIL OFL 1.1). |
| `gril.mp3`, `craie.mp3`, `cloches.mp3`, `souffle.mp3` | Les sons du décor, fabriqués (aucune banque de sons). |
| `voix/*.mp3` | Les répliques du reporter **de secours** (voir plus bas). |

## La voix du reporter

C'est **Liam, d'ElevenLabs** — la voix du fichier du magret de Jean-Marie
(« Liam — Energetic Social Media Creator », réglages 100 / 50 / 75, modèle v3).
Le serveur la fabrique à la demande (`/api/direct/interview/voix`), réplique par
réplique, et le réseau de Vercel la garde en cache. Réglages sur Vercel :
`ELEVENLABS_API_KEY` (déjà là), `INTERVIEW_VOIX_ID` pour changer de voix,
`INTERVIEW_VOIX_MODELE` pour changer de modèle.

Si le serveur ne peut pas la fabriquer, **toutes** les répliques passent sur les
fichiers de `voix/`, une voix de synthèse locale — jamais un reporter qui change
de voix entre deux questions. L'écran d'essai dit laquelle a parlé.

C'est la voix **du reporter**, pas celle du chef : on ne prête jamais au
commerçant une voix ou une phrase qu'il n'a pas dite (voir
`public/direct/voix/LISEZ-MOI.md`). Le chef parle avec **sa propre voix**,
enregistrée par son téléphone — même quand c'est son fantôme qui est à l'écran.

## La cloche (restaurants)

Quand le restaurant a une photo de son plat, la vidéo s'ouvre, après le bonjour
du reporter, sur **l'étape 1 de l'expérience du restaurant**
(`boutique/experience-table.tsx`) : la même salle, le même fantôme assis avec le
nom du restaurant brodé sur sa casquette et son tablier, le même titre, la même
cloche de cuivre. La cloche se soulève toute seule, comme quand on la touche,
puis vient l'étape 2 : le plat en grand — sa scène quand le restaurant en a une
(l'assiette servie, son fantôme derrière, comme le magret du Bordeaux), sinon sa
photo en pleine largeur — avec « Le coup de cœur du chef », son nom et son prix.
Puis on revient à l'interview. Les images
viennent de `public/direct/table/restaurant/` et `public/direct/double/assis/`,
rien n'est copié ici. Dans l'application, la photo sera celle qu'il a mise au
comptoir ; sur la page d'essai, on la choisit.

## Au comptoir d'un restaurant

L'interview s'ouvre aussi depuis le comptoir du restaurant (« En interview », à
côté de « En photos »). Elle y prend son nom, son plat du jour (celui publié,
sinon le dernier de sa vitrine), la photo pour la cloche, et **son fantôme à
lui** — ses poses en pied « repos », « parle-1 », « parle-2 » servent de bouche.

Le reporter ne nomme que Le Bordeaux, dont il a la réplique : pour les autres,
`bonjour-chef` et `a-demain-chef` disent la même chose sans nom de lieu. La
route de la voix n'accepte toujours aucun texte libre ; le nom du restaurant est
écrit sur l'ardoise.

## Les autres métiers

Coiffeur, onglerie, boutique de vêtements, opticien, fleuriste, atelier de
création, librairie et bar ont leur interview : leurs questions, leur bonjour
et leur au revoir sont dans `SCRIPTS` (`src/lib/direct/interview-fantome.ts`),
sans « chef », sans « plat », sans cloche, et l'ardoise dit « Aujourd'hui
chez… » (« Ce soir au… » pour un bar). Le gril ne grésille qu'en cuisine.
Leurs textes sont validés : l'interview s'ouvre au comptoir de chacun. Un
métier qu'on ajoute à `SCRIPTS` sans le mettre dans `INTERVIEW_VALIDEE` ne
s'ouvre qu'au comptoir de démonstration (`/autour-de-moi/assistante?metier=…`).

Leurs voix de secours se fabriquent avec
`node scripts/fabriquer-voix-secours-interview.mjs` (espeak-ng, français,
150 mots/minute, comme les premières) ; `npm run verifier:interview-metiers`
vérifie que chaque réplique a la sienne.

## Pour un autre commerçant

Son fantôme en deux images au moins (bouche fermée, bouche ouverte, **exactement
la même pose**). Une réplique nommée (comme celles du Bordeaux) se crée dans
`src/lib/direct/interview-fantome.ts`, avec son fichier de secours dans `voix/`.
Changer un texte → changer `VERSION_VOIX` dans `interview-montage.ts`, sinon le
cache resservirait l'ancienne voix.
