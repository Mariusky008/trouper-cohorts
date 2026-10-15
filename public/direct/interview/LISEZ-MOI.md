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
et la photo du plat apparaît dessous ; puis on revient à l'interview. Les images
viennent de `public/direct/table/restaurant/` et `public/direct/double/assis/`,
rien n'est copié ici. Dans l'application, la photo sera celle qu'il a mise au
comptoir ; sur la page d'essai, on la choisit.

## Pour un autre commerçant

Son fantôme en deux images au moins (bouche fermée, bouche ouverte, **exactement
la même pose**), et ses répliques : le nom du commerce change dans « Bonjour »
et « À demain » (`src/lib/direct/interview-fantome.ts`). Changer un texte →
changer `VERSION_VOIX` dans `interview-montage.ts`, sinon le cache resservirait
l'ancienne voix.
