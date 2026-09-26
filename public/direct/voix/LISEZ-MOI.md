# Les voix des commerçants

« J'ai besoin, pour certaines annonces, d'avoir de super belles voix bien
naturelles et authentiques pour donner vraiment de l'âme à cette démo. »

## Ce que fait l'écran aujourd'hui

Les trois récits sont **écrits dans les données** (`voix.recit` dans
`src/lib/direct/apercu-habitant.ts`) et l'écran les affiche en grand. Au clic
sur « Écouter », le **téléphone les lit à voix haute** avec la synthèse du
système, et l'écran écrit dessous que c'est une voix de synthèse.

C'est honnête, et ce n'est pas ce qu'il demande. La synthèse du navigateur est
la voix de l'appareil : elle articule, elle ne raconte pas. Aucun réglage ne la
rendra chaleureuse — il n'y a pas de bouton « âme » dans `speechSynthesis`.

## Ce qu'il reste à faire, et c'est une seule ligne par voix

Déposer le fichier ici, puis **décommenter la ligne `extrait:`** déjà écrite
juste en dessous du récit, dans `apercu-habitant.ts`. Le lecteur joue alors
l'enregistrement au lieu de lire, et la mention « voix de synthèse » disparaît
toute seule. Rien d'autre à toucher.

| Fichier à déposer ici | Qui | Consigne de jeu |
|---|---|---|
| `margot-lasagnes.mp3` | Margot, cuisinière du Bocal de Margot | Chaleureuse et souriante, comme si elle parlait à un client. **Une petite pause après « ça mijote doucement »** (les points de suspension du texte la portent). |
| `bergine-magret.mp3` | Jean-Marie, cuisinier de Chez Bergine | Voix d'homme, **petit accent du Sud-Ouest**. Posée, pas pressée. |
| `tablee-basquaise.mp3` | Yann, cuisinier de La Grande Tablée | Voix d'homme, **sans accent**. Simple, directe. |

**L'accent n'est pas écrit dans le texte, et c'est volontaire.** On ne
transcrit pas « putaing » pour faire entendre le Sud-Ouest : un accent écrit se
lit comme une moquerie. Il est dans la consigne de jeu, ici, à côté du fichier.

## Deux façons de les obtenir

1. **Les faire dire par quelqu'un.** Un téléphone récent enregistre assez bien
   dans une pièce sans écho. C'est la seule voie qui donne vraiment « naturel
   et authentique », parce que c'est une vraie voix.
2. **Un service de synthèse de qualité** (ElevenLabs, Play.ht, Azure Neural,
   Amazon Polly Neural — tous ont des voix françaises). Ils se pilotent par une
   clé d'API ou depuis leur site : on colle le texte, on choisit la voix, on
   télécharge le `.mp3`.

## Une règle qui ne bouge pas

**Si un jour un vrai commerçant prend la place d'un de ces commerces de
démonstration, c'est lui qui écrit son texte et c'est lui qu'on enregistre.**
Sa consigne, mot pour mot : « si c'est destiné à représenter une vraie
restauratrice, fais valider les étapes de la recette par elle. » Prêter une
recette inventée à une vraie cuisinière, avec une voix qui n'est pas la sienne,
est exactement ce qu'il faudrait démentir en rendez-vous.
