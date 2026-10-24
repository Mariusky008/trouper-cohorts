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

## Jamais « exemple » à l'écran

Les commerces des tours sont fictifs, leurs chiffres et leurs cadeaux inventés : aucun écran ne porte le mot
« exemple » (ni le ticket, ni la notification de la nuit, ni le livre, ni l'intro, ni les cartes). Seule la voix
de « Moins de dépenses » dit « Par exemple, un dîner pour deux… » : c'est sa phrase enregistrée.

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
python3 -I $D/outils/tour-trois.py $D       # + « Les trois fantômes » et « Mike, votre assistant » (restaurant, vêtements, coiffure)
```

Les neuf scripts se lancent **dans cet ordre**. Le tour lunetier a d'abord sa propre base, tirée de celle de la
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
change : photos, voix et mots restent ceux de la démo. Il reste sur ce téléphone le temps de la visite, sans être envoyé.
Le temps pour créer et publier une annonce est toujours le même, 1 min 30 en moyenne (pas le chrono de la démo) : il
s'affiche dans le ticket de fin de « Plus de clients » et dans la conclusion. Le ticket dit aussi « Commission : 0 € » :
ClikMe n'en prend aucune.

**Sous le projecteur, les chiffres de Dax** : le restaurant garde « …devant plus de 1 000 personnes qui cherchent où
manger ce midi » (juste). Les autres métiers disent quatre phrases : combien de Dacquois cherchent ce qu'il vend
chaque jour (vêtements 900, coiffure 380, librairie 250, bijouterie 60, lunettes 40 à 50), « Pour capter ces …
personnes… », puis la diffusion sur ses réseaux et sur ClikMe (« plus de 1 000 Dacquois… chaque jour »). Les voix :
`recu/dax/<métier>-1.mp3` et `-2.mp3` (`recu/lunettes/voix/` pour le lunetier, et pour les phrases 3 et 4, communes).
Le lunetier les a dans sa base (`tour-lunettes.py`), les quatre autres par `tour-dax.py`.

**Les trois fantômes** (restaurant, vêtements, coiffure, par `tour-trois.py`, d'après le prototype
`outils/trois-fantomes`) : deux étapes de plus dans « Plus de clients ».

- **À la fin de sa vidéo** (à la place des trois petits fantômes d'avis) : trois cages, « J'adore », « Je viendrai »,
  et la troisième du métier (« J'y vais », « De côté », « Aujourd'hui »). Le fantôme de Camille s'envole se placer dans la
  vitrine du commerce : devant, à la porte, ou dedans. « Et s'il promet de venir, son prénom s'écrit dans votre carnet.
  Le jour où c'est calme, vous pourrez le relancer d'un geste. » Le carnet s'ouvre, et la carte de la promesse
  (« Jean-Marie vous préviendra · d'un jour calme · son petit plus : le café offert ») : on ne peut pas obliger le
  commerçant à offrir un cadeau, c'est lui qui choisit.
  « Ça me tente » mène à la demande (table, mise de côté, rendez-vous). Camille se repère dans la foule : premier
  rang (ou première place), un peu plus grande, halo rose, « Vous · Camille » (en salle : « Vous · 15 h 30 ») ; à son
  arrivée, la foule s'efface un instant.
- **Son comptoir, après WhatsApp : Mike, son assistant.** Une conversation, à la place de « Mardi, 11 h, la salle est à
  moitié vide » : ClikMe ne connaît pas ses réservations. Mike ne dit donc que ce que ClikMe sait ; ce qu'il ne peut pas
  savoir, c'est le commerçant qui le lui dit, d'un appui. Seul Mike parle (sa voix ElevenLabs) ; le commerçant répond par
  des bulles et des appuis, comme dans l'app. Le visiteur de la démo joue le commerçant.
  0. **La transition, sa fiche** (pour qu'on sache qui est Mike en arrivant de WhatsApp) : « La réservation est faite,
     mais mon travail continue. Je suis Mike, votre assistant : comme un employé de plus. Je fais vos vidéos, je relance
     vos clients, j'organise votre semaine. Quand je sens qu'il faut agir, je vous le propose : vous n'avez qu'à dire
     oui. » Ses trois métiers s'allument à mesure (Vos vidéos, Vos clients, Votre semaine), puis « Il vous propose ·
     vous dites oui ». La fiche se range dans sa barre (« Mike, en ligne ») et la conversation commence, « Mardi · 11 h ».
  1. « Bonjour Jean-Marie. 11 personnes ont promis de venir après votre vidéo. Aucune n'est encore passée. » Le carnet
     (Lou : 9, Clara : 10, les carnets de leurs tours).
  2. « Si c'est calme aujourd'hui, je peux les prévenir pour vous. On le fait ? » Deux bulles à toucher : « Pas
     aujourd'hui » et « Oui, préviens-les ». Sa réponse s'écrit : « Oui, c'est calme ce midi : préviens-les ! ».
  3. « Voici le message. Il ne part qu'à eux, jamais à toute la ville. Touchez « Envoyer ». » Le message prêt à partir
     s'affiche dans le fil (à qui, le texte) avec « Envoyer aux 11 personnes ». Plus de « Appeler mes promesses »,
     qui faisait penser au téléphone.
  4. Leurs réponses arrivent une à une.
  5. « Quand leur bon est scanné au comptoir, vous savez qu'ils sont venus grâce à votre vidéo. »

  Le ticket de « Plus de clients » suit **dans le comptoir de Mike** (plus sur WhatsApp), par-dessus la conversation :
  « Ce que Mike a fait pour vous », avec une ligne de plus, « +4 tables un midi calme » (« +4 clientes », « +4
  rendez-vous »), puis les boutons de la suite. Retirés (trop long) : « Un j'aime s'oublie… » et son bilan, et « Et
  votre prochaine vidéo… On la cale jeudi ? ». Chiffres et cadeaux inventés (commerces fictifs). Le cadeau de promesse,
  c'est le commerçant qui le choisit, s'il le veut. Si on touche une bulle avant la fin d'une réplique, Mike se tait
  et sa bulle s'écrit d'un coup.

Les voix sont dans `recu/trois/`. Communes : `trois-1`, `trois-4`, `mike-assistant` (la fiche), `mike-question`,
`mike-message` et `mike-scan`. Par métier : `mike-bonjour-<métier>` (« Bonjour Jean-Marie… ») et `trois-2-<métier>`, suivie de « Touchez
une cage. », pris à la fin de la version du restaurant. Tant que `recu/trois/<nom>.mp3` manque, la réplique s'écrit au
rythme estimé, sans son (`estimer()` dans `tour-trois.py`) : il suffit de poser le fichier et de relancer la chaîne.
Ne servent plus : `trois-3`, `vitrine-1` à `-6`, `creux-1-<métier>`, `creux-2`, `creux-3`, `mike-appeler`,
`mike-promesse` et `mike-video` (les versions précédentes). Les images sont copiées dans chaque tour : les
fantômes des habitants (`tf/`), l'intérieur (`tf-interieur.webp`) et son fantôme qui salue (`tf-hote.webp`).

**L'intro** : « Qui a le temps de filmer, monter, publier et animer les réseaux sociaux ? » (nouvel enregistrement) a
une quatrième tuile, « Animer les réseaux sociaux », qui s'allume sur « animer ». La voix étire « de… » avant
« filmer » : le repérage automatique se trompait d'un demi-temps, donc les instants de ses mots sont relevés à
l'écoute (`CALES` dans `outils/mesurer-intro2.py`). Dans « Et ça tombe plutôt bien… »
(`intro-4b`), le début est prononcé très vite dans l'enregistrement. Le « ding » de la phrase d'avant tombait dessus ;
il est maintenant joué avant, et la pause entre les deux phrases est plus longue.

Pour une nouvelle voix de l'intro : remplacer `voix-intro/court/<nom>.mp3`, mettre son texte dans
`outils/mesurer-intro2.py` (et dans `tour-intro3.py`), lancer `python3 -I $D/outils/mesurer-intro2.py $D`,
puis les neuf scripts.

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
node $D/outils/essai-parcours.mjs <dossier de sortie> tour 414x747 clients voix   # toute la démo, comme un commerçant
node $D/outils/essai-actions.mjs <dossier de sortie> tour 414x747 clients creux 60 '[[1000,"quand","#mk-oui"],[1000,"quand","#tv-envoyer"]]'
```

`essai-parcours.mjs` joue toute la page 2 (vue `clients` ou `depenses`, façon `voix`, `spe` ou `episode`) en
touchant le fantôme dès qu'il a fini de parler : il dit la durée de chaque étape et les erreurs de la page (« aucune
erreur » attendu ; 2 min environ). À lancer sur les trois façons après chaque changement d'une scène. `essai-actions.mjs`
photographie une étape chaque seconde, avec des appuis (« quand » attend que le bouton se montre). L'étape de Mike
s'appelle `creux`, celle des cages `trois`.

Il faut Playwright avec Chromium. Le Chromium de Playwright ne lit pas les mp4 (h264) : les films restent
noirs pendant les essais, sauf à poser des copies webm dans `intro/zz-webm/` (non fournies).
`outils/planche.py` assemble des captures en planche (il demande OpenCV).

## Publier

Avec l'outil Artifact d'un Claude :

1. **Lire** d'abord la page (action `read` sur son lien). Pour pouvoir la modifier, il faut qu'elle
   réponde qu'on peut l'éditer (« writer »). Ce droit se donne par le menu **Partager** de la page, à
   l'adresse e-mail exacte du compte claude.ai, en modification.
2. **Publier** `<tour>/index.html` sur le **même lien** (`url`), en ajoutant dans `files` les fichiers
   nouveaux ou changés (une nouvelle voix, une image), et `null` pour un fichier qui ne sert plus. Un lien = un tour.

Le prototype « Les trois fantômes » (`outils/trois-fantomes/`) a son propre lien, privé :
https://claude.ai/artifact/GzdV7YsCpbRwXYzYce4Ae6 .

## Reprendre le travail (une autre session, un autre compte)

Tout ce qu'il faut est dans le dépôt : les pages, les voix, les scripts, les essais et ces deux LISEZ-MOI (celui-ci et
`outils/trois-fantomes/LISEZ-MOI.md`). À faire avant :

- **GitHub** : la nouvelle session doit avoir accès au dépôt `Mariusky008/trouper-cohorts`.
- **Les pages publiées** : elles appartiennent au compte claude.ai qui les a créées. Pour qu'un autre compte les mette
  à jour sur le même lien, partagez chacune (les 6 tours et le prototype) en **modification** à son adresse e-mail
  (menu Partager). Sans ce droit, il ne peut que publier de nouveaux liens.
- **Le premier message à la nouvelle session** : « Lis `outils/tour-du-fantome/LISEZ-MOI.md` et
  `outils/trois-fantomes/LISEZ-MOI.md` avant de commencer. »

La façon de travailler :

- Le propriétaire travaille en français : on lui répond en français, en le vouvoyant. Il essaie sur iPhone, iPad et Mac.
- On travaille sur une branche, puis une PR vers `main`, fusionnée. Les pages temporaires d'essai (`src/app/zz-*`,
  `public/zz-*`) ne sont jamais commitées.
- Une nouvelle voix arrive en mp3 (ElevenLabs, « Mike »). Elle se range dans `recu/…`, son texte s'écrit **mot pour
  mot** dans le script (les chiffres en tête de mot sont lus en lettres : `EN_LETTRES`), puis on relance la chaîne :
  `outils/alignement.py` cale les mots sur l'enregistrement, sans reconnaissance vocale. Vérifiez à l'oreille que le
  texte est bien celui qui est dit.
- Après une modification : relancer la chaîne, `essai-parcours.mjs` sur les tours touchés, puis republier.
- Les essais GitHub (« ClikMe — vérifications ») s'annulent quand un nouvel envoi arrive sur la même branche avant
  leur fin (`cancel-in-progress`) : GitHub affiche alors une croix rouge sur le commit précédent, sans que rien n'ait
  échoué. Ce qui compte, ce sont les coches de la PR et de `main`.

En suspens (attend la réponse du propriétaire) : dans le prototype, fondre le petit mot, le conseil et la fourchette
verte en un seul « mot » ; et faire des écussons les pins des commerces, la tournée de Dax devenant le nombre de pins.

## Règles du projet

- **Jamais de voix de synthèse du téléphone.** Toutes les voix du fantôme sont des enregistrements
  ElevenLabs (« Mike ») fournis par le propriétaire. Une réplique pas encore enregistrée s'écrit au rythme
  estimé, sans son.
- **Ne jamais inventer les mots ni les prix d'un vrai commerçant.** Les commerces des démos sont fictifs, leurs
  chiffres et leurs cadeaux inventés, et **jamais le mot « exemple » à l'écran** (voir plus haut). Ne jamais publier
  une page qui se fait passer pour une vraie marque ou un vrai commerce.
- **Droits à vérifier.** Les images de la boulangerie (`tour/episode.mp4`, `tour/episode.jpg`,
  `tour/episode-fin.jpg`) viennent de la vidéo YouTube d'« Eva ». La question des droits n'est pas
  réglée : ne pas les copier dans `public/` ni les diffuser ailleurs que dans le tour avant accord.
