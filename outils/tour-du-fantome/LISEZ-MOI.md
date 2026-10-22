# Le tour du fantôme — les cinq démos pour les commerçants

Ce dossier fabrique les cinq pages « Le tour du fantôme », publiées comme artefacts claude.ai. Il est la
**référence** : on modifie ici, puis on republie. Rien ici ne fait partie de l'application ni n'est servi
sur clikme.fr (le dossier est hors de `public/` et exclu du déploiement par `.vercelignore`).

| Tour | Dossier | Page publiée |
|---|---|---|
| Restaurant (Chez Bergine) | `tour/` | https://claude.ai/artifact/PNE42Bh4RcW7yJUQ2e2oZ5 |
| Vêtements (Maison Lou) | `tour-vetements/` | https://claude.ai/artifact/KbADXsnQA55uqkSQEVbXR5 |
| Coiffure (Salon Clara) | `tour-coiffure/` | https://claude.ai/artifact/HjzV4zwSsUHTpNcBSnQXFG |
| Librairie (La Page d'Alice) | `tour-librairie/` | https://claude.ai/artifact/GrCdASNbis5crVFVUrf9P2 |
| Bijouterie (Atelier Inès) | `tour-bijouterie/` | https://claude.ai/artifact/LtmrpKqY5rbcqGc7WA1DkX |

## Ce qu'il y a dedans

- `tour*/` : la page à publier (`index.html`), sa base (`index.avant-episode2.html`) et tout ce qu'elle
  charge (photos, voix, films).
- `recu/` : les voix reçues (enregistrements ElevenLabs « Mike »), brutes et découpées.
- `voix-intro/court/` : les voix de l'intro et `temps.json` (l'instant de chaque mot).
- `accueil2/page/g-restaurant-salue.webp` : le fantôme du restaurant qui salue.
- `outils/` : les scripts.

## Refaire les pages

Il faut Python 3 avec numpy, et ffmpeg, appelé par un lien `ffmpeg` dans ce dossier (non versionné) :

```sh
D=outils/tour-du-fantome
ln -s "$(command -v ffmpeg)" $D/ffmpeg
python3 -I $D/outils/tour-episode2.py $D    # la base → index.avant-intro.html (le mode « épisode »)
python3 -I $D/outils/tour-intro3.py $D      # + l'intro (chapitres 1 et 2, voix de voix-intro/court)
python3 -I $D/outils/tour-promesses.py $D   # + « Pendant la nuit » (03), « Quand vous passerez la main » (04), fins de chat
python3 -I $D/outils/tour-direct.py $D      # + « Pourquoi autant de monde ? » à l'étape du Direct
```

Les quatre scripts se lancent **dans cet ordre**. Chacun repart de `index.avant-episode2.html`, on peut
donc les relancer autant qu'on veut. Conséquence : une retouche faite à la main dans `index.html` est
écrasée au passage suivant. On retouche dans les scripts, ou dans `index.avant-episode2.html` pour la base.

Pour une nouvelle voix de l'intro : remplacer `voix-intro/court/<nom>.mp3`, mettre son texte dans
`outils/mesurer-intro2.py` (et dans `tour-intro3.py`), lancer `python3 -I $D/outils/mesurer-intro2.py $D`,
puis les quatre scripts.

## Vérifier

```sh
python3 -m http.server 8790 --bind 127.0.0.1 --directory outils/tour-du-fantome &
node $D/outils/essai-telephone.mjs <dossier de sortie> tour 414x747 tout   # l'intro et les chapitres 03/04, en captures
node $D/outils/essai-etape.mjs <dossier de sortie> tour 414x747 direct 28  # une étape de la démo, par son id
node $D/outils/essai-fins.mjs <dossier de sortie>/                         # les deux fins de conversation
```

Il faut Playwright avec Chromium. Le Chromium de Playwright ne lit pas les mp4 (h264) : les films restent
noirs pendant les essais, sauf à poser des copies webm dans `intro/zz-webm/` (non fournies).
`outils/planche.py` assemble des captures en planche (il demande OpenCV).

## Publier

Avec l'outil Artifact d'un Claude :

1. **Lire** d'abord la page (action `read` sur son lien). Pour pouvoir la modifier, il faut qu'elle
   réponde qu'on peut l'éditer (« writer »). Ce droit se donne par le menu **Partager** de la page, à
   l'adresse e-mail exacte du compte claude.ai, en modification.
2. **Publier** `<tour>/index.html` sur le **même lien** (`url`), en ajoutant dans `files` les fichiers
   nouveaux ou changés (une nouvelle voix, une image). Un lien = un tour.

## Règles du projet

- **Jamais de voix de synthèse du téléphone.** Toutes les voix du fantôme sont des enregistrements
  ElevenLabs (« Mike ») fournis par le propriétaire. Une réplique pas encore enregistrée s'écrit au rythme
  estimé, sans son.
- **Ne jamais inventer les mots ni les prix d'un vrai commerçant.** Les commerces des démos sont fictifs,
  et les chiffres d'exemple sont toujours marqués « exemple ».
- **Droits à vérifier.** Les images de la boulangerie (`tour/episode.mp4`, `tour/episode.jpg`,
  `tour/episode-fin.jpg`) viennent de la vidéo YouTube d'« Eva ». La question des droits n'est pas
  réglée : ne pas les copier dans `public/` ni les diffuser ailleurs que dans le tour avant accord.
