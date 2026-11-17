# ClikMe

Ce dépôt contient l'application ClikMe (Next.js, `src/`) et des outils à côté (`outils/`).

**Si vous travaillez sur les tours du fantôme ou le prototype « Les trois fantômes »**, lisez d'abord
`outils/tour-du-fantome/LISEZ-MOI.md` et `outils/trois-fantomes/LISEZ-MOI.md`.

**Si vous montez une vidéo de commerçant (ClikMe Studio : l'atelier ou le Studio du comptoir, avec ou sans sa
figurine, faite à partir d'un selfie)**, lisez d'abord `outils/clikme-studio/LISEZ-MOI.md`.

**Si vous reprenez le travail d'une autre session** (l'appli `/collection` : mèmes, mème du jour, notifications, et
le chantier « Autour de moi »), lisez d'abord `docs/reprise.md` : où on en est, et ce qu'il reste à faire.

**Si vous travaillez sur le chantier « Univers »** (la nouvelle figurine assise, la conversation, l'univers personnel
de chacun, les visites), lisez d'abord `docs/univers/vision.md` (les textes du propriétaire), puis
`docs/univers/feuille-de-route.md` (les décisions, l'architecture, les lots).

**Si vous travaillez sur la conversation entre deux proches** (le salon du duo, la messagerie visuelle : les bulles,
les gestes, le talkie-walkie, les mèmes dans la pièce, la télé, les cadres, l'étagère, la vitesse), lisez d'abord
`docs/univers/salon-du-duo.md` : le cahier des charges commun aux deux sessions.

**Si vous travaillez sur « Ma maison »** (la pièce de chacun, le catalogue des neuf pièces, l'inscription « Choisis ta
pièce », la maison qui se remplit avec ce qu'on garde), lisez d'abord `docs/univers/ma-maison.md`.

**Si vous travaillez sur « Découvrir »** (ma télé du jour dans ma pièce, les passions, les salons ouverts par thème),
lisez d'abord `docs/univers/decouvrir.md`.

Règles communes :

- On travaille en français.
- Une branche, puis une PR vers `main`.
- Jamais de voix de synthèse : les voix sont des enregistrements fournis par le propriétaire. Une seule exception,
  décidée par lui le 4 novembre 2026 : le texte qu'un client fait dire à SA figurine (« Ma collection »), lu par une
  voix ElevenLabs côté serveur (`src/lib/direct/voix-figurine-serveur.ts`). Jamais la voix du téléphone. Depuis le
  10 novembre 2026, « Créer » ne s'en sert plus : un mème est écrit (sans voix), ou dit avec la propre voix du client.
- Jamais le mot « exemple » à l'écran.
