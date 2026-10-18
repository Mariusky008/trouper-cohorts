# L'interview du fantôme — les éléments

Ce dossier nourrit `/autour-de-moi/essai-interview` : le reporter de ClikMe pose
une à quatre questions au chef devant le téléphone, puis le téléphone monte la
vidéo lui-même : l'émission **Face au fantôme**, comme les épisodes de
Jean-Marie et de Lou (`outils/face-au-fantome/`) — le clic et son nom en géant,
une carte par question, ses réponses en plein écran avec ses mots qui
s'allument un à un, les réponses courtes qui frappent, le coup de zoom sur son
plat, la carte de fin avec le prix et le bouton, une musique et la même petite
mélodie à chaque fin. Le dessin et les sons : `src/lib/direct/interview-signature.ts` ;
le plan et l'enregistrement : `src/lib/direct/interview-montage.ts`.

**La musique et les sons sont fabriqués dans le téléphone**, note par note
(une boucle house de huit mesures à 118 battements par minute) : aucun fichier,
aucune licence de banque de sons à respecter dans chaque vidéo de chaque
commerçant.

## Ce qui est ici

| Fichier | Quoi |
|---|---|
| `reporter-0.webp` … `reporter-3.webp` | Le reporter de ClikMe, bouche fermée → grande ouverte, même cadre. Tirés de l'image fournie : le faux damier « transparent » entre le micro et le corps a été retiré, la bouche d'origine rouverte à quatre hauteurs. |
| `chef-0.webp` … `chef-3.webp` | Le fantôme du chef du Bordeaux (moustache, clin d'œil) — à sa place quand il ne veut pas se montrer. Même méthode ; fermée, la bouche devient un sourire sous la moustache. |
| `ardoise.webp` | L'ardoise de l'écran du direct, en mode fantôme (le plat écrit dessus) — plus dans le montage. |
| `kalam-400.woff2`, `kalam-700.woff2` | La police « à la craie » de cette ardoise (Kalam, licence SIL OFL 1.1). |
| `cloches.mp3`, `souffle.mp3` | Les sons de la cloche du restaurant, fabriqués (aucune banque de sons). |
| `fantome/*.mp3`, `fantome/index.json` | **La voix du fantôme** : ses 97 répliques enregistrées (voir plus bas). |

## La voix du reporter

C'est **la voix du fantôme**, celle des épisodes « Face au fantôme » : ses
répliques ont été enregistrées sur ElevenLabs et coupées une à une, dans
`fantome/` (97 phrases ; `fantome/index.json` dit d'où vient chaque coupe).
L'interview les retrouve par leur texte (`src/lib/direct/voix-fantome.ts`).

Les questions du jour viennent du planning (`interview-planning.ts`, plus de
cent phrases par métier) : la plupart ne sont pas encore enregistrées. Le
serveur les fait dire par **la même voix** (`/api/direct/interview/voix`, qui
n'accepte que les textes validés du métier), dès que son identifiant est
réglé sur Vercel : `INTERVIEW_VOIX_ID` (avec `ELEVENLABS_API_KEY`), et
`INTERVIEW_VOIX_MODELE` pour changer de modèle. Changer de voix → monter
`VERSION_VOIX` dans `interview-montage.ts`.

**En attendant, une phrase sans voix s'écrit** : à l'écran pendant
l'interview, le temps de la lire, et sur la carte de la question dans le
montage. Il n'y a plus de voix de secours (la synthèse locale, « malade et
très métallique ») ni de voix de remplacement : un reporter qui change de
voix d'une question à l'autre, c'est pire qu'une question écrite.
L'écran d'essai dit combien de phrases ont été dites, et combien écrites.

Ce que le fantôme dit à chaque interview — où poser le téléphone, « Dernière
question ! », le merci, l'au revoir de chaque métier — est enregistré :
`npm run verifier:interview-metiers` le vérifie.

C'est la voix **du reporter**, pas celle du chef : on ne prête jamais au
commerçant une voix ou une phrase qu'il n'a pas dite (voir
`public/direct/voix/LISEZ-MOI.md`). Le chef parle avec **sa propre voix**,
enregistrée par son téléphone — même quand c'est son fantôme qui est à l'écran.

## La cloche (restaurants)

Quand le restaurant a une photo de son plat, la vidéo passe, après son nom en
géant, par **l'étape 1 de l'expérience du restaurant**
(`boutique/experience-table.tsx`) : la même salle, le même fantôme assis avec le
nom du restaurant brodé sur sa casquette et son tablier, le même titre, la même
cloche de cuivre. La cloche se soulève toute seule, comme quand on la touche,
puis vient l'étape 2 : le plat en grand — sa scène quand le restaurant en a une
(l'assiette servie, son fantôme derrière, comme le magret du Bordeaux), sinon sa
photo en pleine largeur — avec « Le coup de cœur du chef », son nom et son prix.
Puis viennent les questions. Les images
viennent de `public/direct/table/restaurant/` et `public/direct/double/assis/`,
rien n'est copié ici. Dans l'application, la photo sera celle qu'il a mise au
comptoir ; sur la page d'essai, on la choisit.

## Au comptoir d'un restaurant

L'interview s'ouvre aussi depuis le comptoir du restaurant (« En interview », à
côté de « En photos »). Elle y prend son nom, son plat du jour (celui publié,
sinon le dernier de sa vitrine), la photo pour la cloche, et **son fantôme à
lui** — ses poses en pied « repos », « parle-1 », « parle-2 » servent de bouche.

Le reporter ne nomme aucun restaurant : sa voix ne dit que des textes fixes,
et aucun nom tapé par quelqu'un n'y passe. Le nom du restaurant est écrit en
géant dans le titre, et sur la carte de fin.

## Les autres métiers

Coiffeur, onglerie, boutique de vêtements, opticien, fleuriste, atelier de
création, librairie et bar ont leur interview : leurs questions, leur bonjour
et leur au revoir sont dans `SCRIPTS` (`src/lib/direct/interview-fantome.ts`),
sans « chef », sans « plat », sans cloche, et la carte de fin dit « Aujourd'hui
chez… » (« Ce soir au… » pour un bar).
Leurs textes sont validés : l'interview s'ouvre au comptoir de chacun. Un
métier qu'on ajoute à `SCRIPTS` sans le mettre dans `INTERVIEW_VALIDEE` ne
s'ouvre qu'au comptoir de démonstration (`/autour-de-moi/assistante?metier=…`).

Leurs questions du jour viennent du planning de la semaine
(`src/lib/direct/interview-planning.ts`) : le produit, la rubrique du jour (le
geste, l'origine, ceci ou cela, la question d'un client, le défi, pour qui, le
portrait), le jour de l'année, la chute. `npm run verifier:interview-metiers`
vérifie que leurs phrases de chaque interview sont enregistrées.

## Pour un autre commerçant

Son fantôme en deux images au moins (bouche fermée, bouche ouverte, **exactement
la même pose**). Changer un texte → changer `VERSION_VOIX` dans
`interview-montage.ts`, sinon le cache resservirait l'ancienne synthèse.
