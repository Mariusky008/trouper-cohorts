# Le tour du fantôme — les six démos pour les commerçants

Ce dossier fabrique les six pages « Le tour du fantôme », publiées comme artefacts claude.ai. Il est la
**référence** : on modifie ici, puis on republie. Rien ici ne fait partie de l'application ni n'est servi
sur clikme.fr (le dossier est hors de `public/` et exclu du déploiement par `.vercelignore`).

| Tour | Dossier | Page publiée |
|---|---|---|
| Restaurant (Chez Bergine) | `tour/` | https://claude.ai/artifact/PNE42Bh4RcW7yJUQ2e2oZ5 |
| Vêtements (Maison Lou) | `tour-vetements/` | https://claude.ai/artifact/KbADXsnQA55uqkSQEVbXR5 |
| Coiffure (Salon Clara) | `tour-coiffure/` | https://claude.ai/artifact/HjzV4zwSsUHTpNcBSnQXFG |
| Librairie (La Page d'Alice) | `tour-librairie/` | https://claude.ai/artifact/GrCdASNbis5crVFVUrf9P2 |
| Bijouterie (Atelier Inès) | `tour-bijouterie/` | https://claude.ai/artifact/LtmrpKqY5rbcqGc7WA1DkX |
| Lunetier (Les Lunettes de Margaux) | `tour-lunettes/` | https://claude.ai/artifact/9R2sn9qYN141C4f54T2Q3C |

## Ce qu'il y a dedans

- `tour*/` : la page à publier (`index.html`), sa base (`index.avant-episode2.html`) et tout ce qu'elle
  charge (photos, voix, films).
- `recu/` : les voix reçues (enregistrements ElevenLabs « Mike »), brutes et découpées ; `recu/depenses/brut/`
  la question (`<métier>.mp3`) et le coût réel de l'offre (`<métier>2.mp3`, dit à l'étape de l'offre) de « Moins de dépenses ».
- `recu/lunettes/` : les photos (allégées) et les voix du tour lunetier ; `recu/depenses/brut/lunettes*.mp3` ses deux
  phrases de « Moins de dépenses ».
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
python3 -I $D/outils/tour-promesses.py $D   # + « Pendant la nuit » (03), « Quand vous passerez la main » (04), fins de chat, écran du oui
python3 -I $D/outils/tour-direct.py $D      # + « Pourquoi autant de monde ? » à l'étape du Direct
python3 -I $D/outils/tour-gestes.py $D      # + les 4 photos en un seul appui
python3 -I $D/outils/tour-depenses.py $D    # + « Moins de dépenses » : la question du métier, le coût réel à l'offre
python3 -I $D/outils/tour-sien.py $D        # + son nom (« Pour qui est cette démo ? ») et son temps (le ticket de « Plus de clients »)
python3 -I $D/outils/tour-dax.py $D         # + sous le projecteur, combien de Dacquois cherchent ce qu'il vend (sauf le restaurant)
```

Les huit scripts se lancent **dans cet ordre**. Le tour lunetier a d'abord sa propre base, tirée de celle de la
bijouterie : `python3 -I $D/outils/tour-lunettes.py $D` (ses images, ses voix mesurées, sa page de base), à
relancer avant la chaîne si l'on change la bijouterie ou ses textes. Chacun repart de `index.avant-episode2.html`, on peut
donc les relancer autant qu'on veut. Conséquence : une retouche faite à la main dans `index.html` est
écrasée au passage suivant. On retouche dans les scripts, ou dans `index.avant-episode2.html` pour la base.

L'écran du oui (à la toute fin) : ses répliques sont dans `TEXTES` de `tour-promesses.py` (`oui-a`, `oui-nuit`,
`oui-main`, `oui-b`) ; leurs enregistrements se posent dans `recu/oui/<nom>.mp3`. Il coche toujours les quatre
promesses, et ne vient que quand on touche « Passer à la conclusion » : après un chapitre (03 ou 04), on revient
au chat, où le chapitre vu se coche. L'offre (prix, essai,
engagement) se règle dans `OFFRE` du même script : vide, rien ne s'affiche.

**Le jour de la démo, son nom** : avant de tendre le téléphone, touchez « ✎ Pour qui est cette démo ? » en haut de la
page 1 et tapez le nom de son commerce. Il s'affiche sur la page 1 (« Préparé pour… »), sur sa boutique et dans sa
notification (chapitre 03), sur le livre de son commerce (chapitre 04) et dans le titre de la conclusion. Seul le nom
change : photos, voix et mots restent ceux de l'exemple. Il reste sur ce téléphone le temps de la visite, sans être envoyé.
Le temps pour créer et publier une annonce est toujours le même, 1 min 30 en moyenne (pas le chrono de la démo) : il
s'affiche dans le ticket de fin de « Plus de clients » et dans la conclusion. Le ticket dit aussi « Commission : 0 € » :
ClikMe n'en prend aucune.

**Sous le projecteur, les chiffres de Dax** : le restaurant garde « …devant plus de 1 000 personnes qui cherchent où
manger ce midi » (juste). Les autres métiers disent quatre phrases : combien de Dacquois cherchent ce qu'il vend
chaque jour (vêtements 900, coiffure 380, librairie 250, bijouterie 60, lunettes 40 à 50), « Pour capter ces …
personnes… », puis la diffusion sur ses réseaux et sur ClikMe (« plus de 1 000 Dacquois… chaque jour »). Les voix :
`recu/dax/<métier>-1.mp3` et `-2.mp3` (`recu/lunettes/voix/` pour le lunetier, et pour les phrases 3 et 4, communes).
Le lunetier les a dans sa base (`tour-lunettes.py`), les quatre autres par `tour-dax.py`.

Pour une nouvelle voix de l'intro : remplacer `voix-intro/court/<nom>.mp3`, mettre son texte dans
`outils/mesurer-intro2.py` (et dans `tour-intro3.py`), lancer `python3 -I $D/outils/mesurer-intro2.py $D`,
puis les huit scripts.

## Les films du lunetier

Son interview (`message.mp4`, 30 s : l'intro, puis derrière l'étui) est l'épisode 14 de « Face au fantôme », monté
comme celui du restaurant : `outils/face-au-fantome/margaux/` (le reporter pose deux questions, Aurore répond avec la
voix de Margaux, sous-titres mot à mot, « CRISTAL » en plein écran, ralenti sur « en cinq minutes », carte de fin) :

```sh
node outils/face-au-fantome/margaux/preparer.cjs
DOSSIER=margaux FFMPEG=$D/ffmpeg node outils/face-au-fantome/rendu.mjs tout
$D/ffmpeg -i outils/face-au-fantome/margaux/face-au-fantome.mp4 -vf scale=540:960 -c:v libx264 -crf 25 -c:a aac -b:a 128k \
  -movflags +faststart $D/tour-lunettes/message.mp4      # affiche message.jpg à 4,6 s, message-fin.jpg à la fin
```

Les deux autres (`specialiste.mp4`, `episode.mp4`, avec leur affiche et leur dernière image) ont été montés par le
vrai moteur de l'application, comme ceux des autres tours métier : deux pages temporaires (`zz-film`, `zz-episode`,
jamais commitées) sur un serveur local, à partir des 4 photos et du geste ; l'épisode à partir de « rushes » fabriqués
depuis ces photos. Puis H.264 pour Safari. Ils sont rangés dans `tour-lunettes/` : `tour-lunettes.py` lit leur durée.

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
