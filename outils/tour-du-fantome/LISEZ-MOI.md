# Le tour du fantôme — les six démos pour les commerçants

Ce dossier fabrique les pages « Le tour du fantôme » (un tour par métier, et la démo courte). Il est la **référence** : on modifie ici, on pousse
sur `main`, et le site les met en ligne tout seul, à `clikme.fr/tours/<métier>` (voir « Publier »). Le
bouton « Voir la démo » de la page des commerçants (`public/commercants/`) mène à ces adresses.

| Tour | Dossier | Sur le site | Ancien artefact claude.ai (plus mis à jour) |
|---|---|---|---|
| Restaurant (Chez Bergine) | `tour/` | https://www.clikme.fr/tours/restaurant | https://claude.ai/artifact/PNE42Bh4RcW7yJUQ2e2oZ5 |
| Vêtements (Maison Lou) | `tour-vetements/` | https://www.clikme.fr/tours/vetements | https://claude.ai/artifact/KbADXsnQA55uqkSQEVbXR5 |
| Coiffure (Salon Clara) | `tour-coiffure/` | https://www.clikme.fr/tours/coiffure | https://claude.ai/artifact/HjzV4zwSsUHTpNcBSnQXFG |
| Librairie (La Page d'Alice) | `tour-librairie/` | https://www.clikme.fr/tours/librairie | https://claude.ai/artifact/GrCdASNbis5crVFVUrf9P2 |
| Bijouterie (Atelier Inès) | `tour-bijouterie/` | https://www.clikme.fr/tours/bijouterie | https://claude.ai/artifact/LtmrpKqY5rbcqGc7WA1DkX |
| Lunetier (Les Lunettes de Margaux) | `tour-lunettes/` | https://www.clikme.fr/tours/lunettes | https://claude.ai/artifact/9R2sn9qYN141C4f54T2Q3C |
| Massage (Le Cocon d’Élise) | `tour-massage/` | https://www.clikme.fr/tours/massage | — |
| **Démo courte, 45 s** (Chez Bergine) | `tour-court2/` (deuxième version) | https://www.clikme.fr/tours/court | — |
| **Démo des entrepreneurs** (Nina, céramiste · Claire, sophrologue) | `tour-entrepreneurs2/` (deuxième version) | https://www.clikme.fr/tours/entrepreneurs (`?v=local` : Claire) | — |

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
python3 -I $D/outils/tour-pause.py $D       # + le bouton pause (les six tours)
```

Le tour massage a d'abord sa base, tirée de celle de la coiffure, et ses films :
`python3 -I $D/outils/tour-massage.py $D` (ses photos et ses voix, `recu/massage/`, mesurées), puis
`node $D/outils/films-massage.mjs` (ses trois films, d'après `outils/films-massage/film.html`), puis à nouveau
`tour-massage.py` (qui lit leur durée), avant la chaîne. Voir « Le tour massage » plus bas.

Les dix scripts se lancent **dans cet ordre**. Le tour lunetier a d'abord sa propre base, tirée de celle de la
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
  0. **La transition, sa fiche** (pour qu'on sache qui est Mike en arrivant de WhatsApp), avec sa voix
     (`recu/trois/mike-assistant.mp3`) : « La réservation est faite, mais mon travail continue. Je fais vos vidéos,
     relance vos clients, organise votre semaine et quand je sens qu'il faut agir, je vous le propose et vous n'avez
     qu'à dire oui. » « Comme un employé de plus » est écrit sur la fiche, sous son nom. Ses trois métiers s'allument
     à mesure (Vos vidéos, Vos clients, Votre semaine), puis « Il vous propose · vous dites oui ». La fiche se range
     dans sa barre (« Mike, en ligne ») et la conversation commence, « Mardi · 11 h ».
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
l'écoute (`CALES` dans `outils/mesurer-intro2.py`).

**« Je fais réagir »** (à la place de « Et ça tombe plutôt bien… je sais surtout les raconter et créer l'envie de les
partager », `intro-4b`, qui ne sert plus) : ce qui fait la différence avec une vidéo ordinaire, en quatre voix et trois
scènes, après « Et une histoire, ça se partage. »
- `intro-4c` « Une belle vidéo, tout le monde sait en faire. Moi, je fais réagir. » : sur la fin de la vidéo, l'écran
  s'assombrit et la carte « Et vous ? » arrive avec ses trois cages (le dessin de l'étape des trois fantômes), qui
  disent ce qu'elles veulent dire (« J'adore : on comprend pas ») : « J'adore la vidéo », « Je viendrai un jour »,
  « Je réserve aujourd'hui » (resto, coiffure) ou « Je passe aujourd'hui » (le troisième élément de `QR`).
- `intro-4d` « À la fin de votre vidéo, au lieu d'un like banal, votre client potentiel peut libérer un fantôme de sa
  cage. Et c'est là que mon vrai travail
  commence : je leur pose des questions, je les fais parler de vous. » : UNE cage, comme dans la vraie vie : sur
  « client », Camille touche « Je viendrai » ; sur « libérer », son fantôme s'envole avec son prénom (les deux autres
  cages pâlissent) ; sur « commence », ce que son fantôme lui propose (`QR` dans `tour-intro3.py` : il en reste peu,
  « tu viens avec une amie ? », un petit plus qui coûte peu au commerçant ; pas « quand », elle vient de dire qu'elle
  viendrait ; au resto, « le chef vous fait goûter son nouveau dessert » : un café gourmand, c'est trop cher à
  offrir, un café seul, trop peu) ; sur
  « parler », sa réponse (« Oui ! Avec ma sœur 😍 »). L'écran de la vidéo s'éteint sous la carte, et « Monté par
  ClikMe » et les compteurs de la vidéo s'effacent : « il y a énormément à regarder, le message est noyé ».
- `intro-4e` « Sur Instagram, vous voyez qui a aimé. Mais écrire à chacun pour créer du lien, qui a le temps ? » :
  « ♥ 214 j'aime », les noms qui défilent ; sur « chacun », « ✉ à écrire » sur chacun et « 0 message écrit sur 214 » ;
  sur « temps », « Pas le temps. » et « 214 messages à écrire, chaque jour ».
- `intro-4f` « Moi, je le fais. Chacun par son prénom, au bon moment. Si bien que le jour où ils poussent votre porte,
  ils se sentent déjà comme des habitués. » : « Vos fantômes : 214 ont libéré leur fantôme sur votre vidéo » (ceux
  qui ont ouvert une cage sur ClikMe, pas les j'aime d'Instagram) ; sur « prénom », un message chacun, par son
  prénom, « ✓ envoyé », et le compteur jusqu'à 214 ; sur « porte », la façade du commerce (comme la scène de l'étape
  des trois fantômes : enseigne, store, vitrine, porte ; `FACADE` dans `tour-intro3.py`), son fantôme qui sort de la
  porte, et Camille (son fantôme de la cage) qui arrive avec sa sœur ; sur « habitués », il l'appelle par son prénom
  (« Camille ! On t'attendait 😊 », sur le store pour laisser voir la salle). Au resto, le chef porte une toque (un
  dessin, `I_TOQUE`, posé sur sa casquette) et la vitrine montre une vraie salle (la bande du milieu de
  `public/direct/table/restaurant/salle.webp`, recadrée par ffmpeg en `tour/si-interieur.webp`).
Instagram, les prénoms et la façade prennent la scène, comme les voisins (« les animations sont toutes petites par
rapport aux précédentes ») : leurs tailles suivent `--u`, un px d'une carte de 340 px à l'échelle de la scène.
Les fantômes des cages sont ceux des habitants (`outils/trois-fantomes/a/g`), copiés dans chaque tour en `si-g1` à
`si-g3`.

**Du chapitre 1 au chapitre 2** (`intro-5a`, juste avant la carte « Moins de dépenses ») : « Voilà comment je vous
amène des clients, et comment je les fais revenir. Maintenant, voyons comment je fais baisser vos dépenses. » La scène
`bilan` : la ligne « 01 Plus de clients » reçoit « Nouveaux clients » (sur « amène ») puis « Ils reviennent » et sa
coche (sur « revenir ») ; sur « maintenant », la ligne « 02 Moins de dépenses » arrive en or, et s'allume sur
« dépenses ». La carte du chapitre 2 qui suit est plus courte (1,7 s au lieu de 2,3 : la voix vient de l'annoncer).
La barre de l'intro a une case par réplique : 10 au chapitre 1 (la transition comprise), 2 au chapitre 2.

**La pause** (`tour-pause.py`) : un bouton ⏸ en haut de l'intro (à côté de « Passer ») et dans la barre du bas de la
démo (à côté de « i ») ; au clavier, Espace ou P. Pour répondre à une question du commerçant : la page entière se fige
(sa voix, ses mots, ses animations, les films, les minuteries) et « Reprendre » la relance au même instant. Pendant la
pause, un voile retient les appuis. Le script remplace, avant tout le reste, les minuteries de la page par des
minuteries qui savent s'arrêter, ignore le temps passé en pause (`performance.now`, `requestAnimationFrame`),
arrête sa voix (et la relance du même instant), suspend le contexte audio, et met en pause les animations CSS et
les films en cours. Chaque étape est à part, la voix d'abord : sur Safari, mettre en pause certaines animations en
boucle lève une erreur, qui arrêtait tout le reste (l'écran figé, sa voix qui continuait, pas de « Reprendre »).
Une animation qui refuse la pause est figée à vitesse nulle. `essai-pause.mjs … safari` rejoue ce cas.

Pour une nouvelle voix de l'intro : remplacer `voix-intro/court/<nom>.mp3`, mettre son texte dans
`outils/mesurer-intro2.py` (et dans `tour-intro3.py`), lancer `python3 -I $D/outils/mesurer-intro2.py $D`,
puis les dix scripts. (Il appelle `python3` lui-même : celui du `PATH` doit avoir numpy.)

## La démo courte : « Le fantôme en 45 secondes »

Publiée aujourd'hui dans sa deuxième version (`tour-court2/`, plus bas). La première (`tour-court/`), décrite
ici, reste dans le dépôt sans être publiée.

La bande-annonce des tours, pour les commerçants : 45 secondes, un seul geste (toucher la cage), puis le tour complet
si l'on veut (« Voir le tour complet · 2 min »). Faite par `outils/tour-court.py` d'après le modèle
`outils/tour-court.html` (on retouche le modèle ou le script, jamais `tour-court/index.html`) :

```sh
/usr/bin/python3 -I outils/tour-du-fantome/outils/tour-court.py outils/tour-du-fantome
```

Une promesse, puis trois preuves de plus en plus fortes, chacune sur une voix (`recu/court/demo1-a…g.mp3`, lues mot
pour mot) :

| Voix | Ce qui est dit | À l'écran |
|---|---|---|
| A | « Libérez votre fantôme. » | la cage s'ouvre, son fantôme (le chef, sa toque) sort et vole vers nous |
| B | « Une photo le matin. Des clients le jour même. » | sa façade, son fantôme à la porte ; 9 h 02, la photo du chef qui tend son plat ; 12 h 30, les clients arrivent, « +4 tables ce midi » |
| C | « Je fais votre film… et je le publie partout. » | les photos se montent en film (« Le plat du jour »), puis Instagram, Facebook, Google, WhatsApp et Le Direct se cochent |
| D | « Une vidéo, vous savez la faire. Moi, je vous ramène ceux qui l'ont regardée. » | la même vidéo, côte à côte : seule (« ♥ 214 », « Aucun prénom ») ou avec son fantôme (les cages, « 38 prénoms ») |
| E | « Au lieu d'un like, ils libèrent un fantôme. » | le « J'aime » barré, les trois cages, Camille ouvre « Je viendrai un jour » ; puis la nuée : 38 fantômes sur sa façade, « 12 ont promis de venir » |
| F | « Puis j'écris à chaque personne un message rien qu'à elle. Je la connais un peu mieux à chaque réponse… jusqu'au jour où elle pousse votre porte. » | sa fiche se remplit (en semaine, à prévenir) au fil des messages du moteur (`moteur-messages.ts`), chacun « ✓ Vous avez dit oui » ; un mardi calme, sur son WhatsApp : « Il reste une table ce midi » ; « J'arrive ! » ; la porte, « Camille ! On t'attendait 😊 », « Est venue » ; « Et pareil pour les 37 autres. » |
| G | « Votre fantôme vous attend. » | le ticket de la semaine, « Créer mon espace · gratuit » (`/commercants#creer`), le tour complet, « Revoir » |

- **Les mots à l'instant où ils sont dits** : chaque voix est égalisée (même volume) et ses mots calés sur
  l'enregistrement, pour les sous-titres mot à mot (la vidéo se regarde souvent sans le son) et pour caler les gestes
  de la page. Quand une réplique a autant de phrases que de morceaux de voix, ils vont un pour un (`caler()` de
  `outils/voix_courtes.py`, commun aux deux démos courtes) ; sinon, `alignement.py`.
- **Le son** passe par le navigateur (Web Audio) : les voix à leur instant, et une petite musique et des bruits
  (la cage, l'appareil photo, les messages, la nuée) composés dans la page, sans droits.
- **Son nom** : « ✎ Pour qui est cette démo ? », comme dans les tours (le même, gardé le temps de la visite). Il
  s'affiche sur l'enseigne, le film et le ticket ; la note du bas dit alors « Chiffres imaginaires » (et
  « Commerce et chiffres imaginaires » sans nom).
- **La pause** : le bouton ⏸ en bas à droite, Espace ou P.
- **Pour en faire une vidéo** : `…/index.html?video` démarre seule (sans le bouton pause) ; il faut un navigateur
  qui laisse jouer le son sans geste.
- Les images sont celles du tour du restaurant (`tour/`), copiées par le script.

Vérifier : servir `public/` après `node scripts/poser-tours.mjs`, puis jouer la page en entier dans Playwright
(touchez la cage avec `force` : elle se balance) et regarder les captures ; « aucune erreur » attendu.

### La deuxième version (`tour-court2/`, publiée à /tours/court)

Un nouveau scénario et un nouveau moteur. Le moteur : une scène fixe de 1080 × 1920 mise à l'échelle de l'écran, une
seule caméra qui voyage dans un grand décor (la cage, le téléphone, la foule, la façade), tout piloté par une seule
ligne de temps GSAP 3.13 (`recu/gsap/`, gratuit même en usage commercial) ; les étincelles, la poussière d'or et les
cœurs sont dessinés sur une toile en fonction du temps seulement. On peut donc dessiner n'importe quel instant, et en
faire une vidéo MP4 avec le son :

```sh
/usr/bin/python3 -I outils/tour-du-fantome/outils/tour-court2.py outils/tour-du-fantome
node outils/tour-du-fantome/outils/rendre-video.mjs http://…/tour-court2/index.html sortie.mp4 30 1.5
```

(la page, ouverte avec `?rendu`, dessine l'instant demandé et calcule son propre son hors ligne ; ffmpeg assemble). Les
voix : `recu/court/v2-1…6.mp3` et `demo1-g.mp3`, lues mot pour mot.

| Voix | Ce qui est dit | À l'écran |
|---|---|---|
| — | (avant de toucher) | la cage se balance, Mike frappe : « Libérez-moi ! » ; toucher la cage ou n'importe où |
| 1 | « Merci ! Je suis Mike, votre futur fantôme préféré. » | la cage explose (rayons, onde, étincelles), Mike jaillit en traînée, se pose, la toque lui tombe sur la tête, « Mike » |
| 2 | « Avec quelques photos, je fais une très belle vidéo de votre commerce, puis je la publie partout pour que tout le monde la voie. » | quatre photos arrivent, plongent dans le téléphone et deviennent un film (« Le plat du jour », « Monté par Mike ») ; Instagram, Facebook, Google, WhatsApp et le Direct en sortent et se cochent ; les vues montent |
| 3 | « Mais ce n'est pas là que je suis le plus fort. C'est juste après. » | les réseaux s'éteignent, le film file en avance rapide jusqu'à sa fin |
| 4 | « À la fin de la vidéo, chaque personne peut libérer son fantôme pour dire ce qu'elle en pense : “J'adore la vidéo”, “Je passerai un jour, c'est sûr”, ou “Je passe aujourd'hui”. » | la caméra plonge dans les trois cages ; trois doigts ; à chaque choix dit, sa cage s'allume et ses fantômes en sortent ; la caméra recule : 21, 12 et 5 |
| 5 | « Et à partir de là, mon vrai travail commence. » | la foule s'assombrit, Mike au milieu, en grand ; la batterie se tait, puis repart |
| 6 | « J'écris à chaque personne qui a libéré son fantôme, pour faire connaissance. Je la connais un peu mieux à chaque réponse… jusqu'au jour où elle pousse votre porte. » | un message part vers chacun des 38 ; la caméra s'approche de Camille, la conversation monte et sa fiche se remplit ; un mardi calme, sur votre WhatsApp ; « J'arrive ! » ; la façade, la porte s'ouvre, « Camille ! On t'attendait 😊 », « Camille est venue, grâce à votre vidéo » |
| 7 | « Votre fantôme vous attend. » | Mike, « Créer mon espace · gratuit » (vers `/inscription`, la page d'inscription pour tout le monde), « Revoir » (pas de lien vers les tours complets : ils parlent des dépenses, qui demandent une ville ouverte) |

Le calage des voix aide `caler()` (`coupures`, `liees`, dans `tour-court2.py`) : l'enregistrement se tait aussi
devant un « p » ou un « t » (« elle | pousse »), pas seulement aux virgules.

## La démo des entrepreneurs : « Libère ton fantôme »

Publiée aujourd'hui dans sa deuxième version (`tour-entrepreneurs2/`, plus bas). La première (`tour-entrepreneurs/`),
décrite ici, reste dans le dépôt sans être publiée.

Pour ceux qui ne sont pas commerçants : pas de vitrine, pas de Direct (leur ville n'est pas forcément ouverte) ; tout
se passe sur leurs réseaux et sur leur page ClikMe. ClikMe s'adresse à tout le monde en France, et chacun à sa
mesure : deux variantes, choisies avant de toucher la cage (ou `?v=local` dans l'adresse).

- **Nina, céramiste**, envoie ses créations : toute la France (la carte s'allume, ses colis partent vers 14 villes).
- **Claire, sophrologue**, reçoit près de chez elle : sa ville (la carte zoome sur Annecy, le cercle de 20 km et
  ses communes).

```sh
/usr/bin/python3 -I outils/tour-du-fantome/outils/tour-entrepreneurs.py outils/tour-du-fantome
```

Le même habillage et la même mécanique que la démo courte (`outils/tour-entrepreneurs.html`, ses voix
`recu/court/demo2-a…h.mp3` et les deux promesses `demo2-promesse-createur|local.mp3`), dans cet ordre : qui (« Libère
ton fantôme. » ; « Il porte ton métier, et il travaille pour toi. » : le fantôme ClikMe enfile la salopette de son
métier), pour qui (la promesse de la variante, la carte), comment (« Une photo… et chaque jour, une nouvelle vidéo,
publiée sur tous tes réseaux. » : sa semaine de sept vidéos, Instagram, TikTok, Facebook, son statut WhatsApp, sa page ;
l'écran partagé ; les cages et la nuée devant sa page, avec leurs villes), puis Camille, un message rien qu'à elle à
chaque fois un peu mieux (`moteur-messages.ts`), « jusqu'au jour où elle devient ta cliente » (📦 « Commandé, envoi à
Lyon » ; 📅 « Jeudi 10 h »), « Et elle revient. », et le ticket de sa semaine. Son nom (« Pour qui est cette démo ? »)
remplace celui de Nina ou de Claire : sur sa page, son adresse, les messages de son fantôme et le ticket.

**Ses photos** (`recu/entrepreneurs/createur|local/`) sont au propriétaire ; la personne de l'atelier a donné son
accord. Le coffret est recadré (ses deux filigranes « leboncoin », en haut). Pas utilisées : la devanture « Julie Z
céramique » (le nom d'un vrai commerce, sous celui de Nina, qui n'a pas de boutique) et le geste de massage
(`geste-dos.jpg`, pas celui d'une sophrologue).

**Ce que le produit ne fait pas encore** pour ces entrepreneurs (la démo le montre) : la page web sans appli et ses
cages, le lien depuis Instagram (étapes 4 et 5 du prototype), l'inscription sans fiche Google, leurs réponses quand
le message part sur WhatsApp (pour que le fantôme apprenne), et « Vendu » ou « Venue » noté par eux. Le bouton
« Créer ma page » mène pour l'instant à l'inscription des commerçants (`/commercants#creer`).

### La deuxième version (`tour-entrepreneurs2/`, publiée à /tours/entrepreneurs)

Le scénario et le moteur de la deuxième démo des commerçants (`tour-court2/`, plus haut), en « tu », avec ses deux
variantes (`?v=local` : Claire ; choisir sur l'écran de départ recharge la page). Faite par
`outils/tour-entrepreneurs2.py` d'après `outils/tour-entrepreneurs2.html` ; les cartes viennent de `outils/cartes.py`
et les petites cages de `outils/decor.py` (communs avec la première version et avec les commerçants).

```sh
/usr/bin/python3 -I outils/tour-du-fantome/outils/tour-entrepreneurs2.py outils/tour-du-fantome
node outils/tour-du-fantome/outils/rendre-video.mjs "http://…/tour-entrepreneurs2/index.html?v=local" sortie.mp4 30 1.5
```

| Voix | Ce qui est dit | À l'écran |
|---|---|---|
| `e2-1` | « Merci ! Je suis Mike, ton futur fantôme préféré. » | la cage explose, Mike (dans la salopette de son métier) jaillit, « Mike » |
| `e2-2` | « Avec quelques photos, je fais une très belle vidéo de ton activité, puis je la publie partout pour que tout le monde la voie. » | ses quatre photos, son film (« Sortie du four · L'atelier de Nina », « Un moment pour soi · Claire, sophrologue »), Instagram, Facebook, Google, WhatsApp et sa page ClikMe |
| promesse | « Tu envoies tes créations ? Je te fais connaître dans toute la France. » / « Tu reçois près de chez toi ? Je te fais connaître dans ta ville. » | la carte : les courbes partent de son atelier vers 14 villes ; ou le cercle de 20 km autour d'Annecy s'ouvre et ses communes s'allument |
| `v2-3` | « Mais ce n'est pas là que je suis le plus fort. C'est juste après. » | retour au téléphone, le film file en avance rapide |
| `e2-4` + choix | « À la fin de la vidéo, chaque personne peut libérer son fantôme pour te dire ce qu'elle en pense : » puis « “J'adore la vidéo”, “Un jour, je craque”, ou “Je le veux”. » / « …“Un jour, je prends rendez-vous”, ou “Je prends rendez-vous”. » | les trois cages de son métier, en grand ; à chaque choix dit, ses fantômes sortent : 21, 12, 5 |
| `v2-5` | « Et à partir de là, mon vrai travail commence. » | la foule s'assombrit, Mike au milieu |
| `e2-6` | « J'écris à chaque personne qui a libéré son fantôme, pour faire connaissance. Je la connais un peu mieux à chaque réponse… jusqu'au jour où elle devient ta cliente. » | un message vers chacun, la conversation avec Camille (pour offrir, les bleus ; ou en semaine, le matin), sur ton WhatsApp ; la carte : le colis part vers Lyon (« Commandé · envoi à Lyon »), ou Camille vient au cabinet (« Jeudi 10 h ») |
| `demo2-h` | « Ton fantôme t'attend. » | « Créer ma page · gratuit » (vers `/inscription`), « Voir avec Claire » (ou Nina), « Revoir » |

À savoir : GSAP ignore une position donnée seulement au départ d'un `fromTo` (`{ x, y, opacity: 0 }` → `{ opacity: 1 }`) ;
on la pose avant, avec `gsap.set`.

## Le tour massage

« Le Cocon d’Élise » (fictif), massage détente musculaire, ayurvédique, kobido : fait pour une démonstration dans un
salon de massage. Tiré du tour coiffure (les rendez-vous, les créneaux, Mike au comptoir) par `tour-massage.py`, comme
le lunetier l'a été de la bijouterie. Tout ce qui lui est propre :
- `recu/massage/photos/` : m1 (le massage, dos et épaules), m2 (la cabine), m3 (les mains, l'huile), m4 (le kobido ;
  coupée en haut, une marque brodée y dépassait), geste, boutique ;
- `recu/massage/voix/` : ses répliques de Mike (`massage-clients-*`, `massage-episode-*`) et `elise.mp3`, la voix de la
  praticienne qui répond à la question 1 ; `recu/dax/massage-1|2.mp3` (« environ 150 personnes… ») ;
  `recu/trois/mike-bonjour-massage.mp3`, `trois-2-massage.mp3` ; `recu/depenses/brut/massage2.mp3` (la question de
  « Moins de dépenses » est celle de la coiffure, sa voix sert telle quelle) ;
- son fantôme : celui du bien-être de l'application (`public/direct/double/pied/bien-etre`) ;
- ses films : montés par `films-massage.mjs` sur le gabarit `outils/films-massage/film.html` (la carte titre, ses
  photos qui s'animent, ses mots sous-titrés mot à mot, la carte de fin et son prix ; une nappe douce composée par le
  navigateur, aucun droit). Le film de notre spécialiste n'a pas de voix : son récit s'écrit en sous-titres.
Une réplique pas encore enregistrée s'écrit au rythme estimé, sans le son ; une photo manquante est remplacée par
celle de la coiffure, et `tour-massage.py` le dit (« EN ATTENTE »).

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
node $D/outils/essai-pause.mjs <dossier de sortie> tour [414x747 safari]      # la pause : dans l'intro, puis pendant que Mike parle
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

**Pousser sur `main` suffit.** À chaque déploiement Vercel, `scripts/poser-tours.mjs` (appelé en `prebuild`)
recopie les six dossiers dans `public/tours/<métier>/` (non versionné) et ajoute à chaque page l'en-tête
qu'un artefact recevait à la publication (doctype, encodage, viewport) et `noindex` (les commerces sont
fictifs). `clikme.fr/tours/<métier>` redirige vers `…/index.html` (`next.config.ts`), où les chemins
relatifs des images et des voix tombent juste. `.vercelignore` n'envoie que les six dossiers des tours, sans
leurs `index.avant*.html` (ni les voix brutes, ni les scripts). Si un dossier manque, la compilation échoue
exprès : le site en ligne reste celui d'avant, plutôt qu'une démo en 404.

Pour voir le résultat avant de pousser : `node scripts/poser-tours.mjs`, puis le site en local
(`npm run dev`), et `http://localhost:3000/tours/restaurant`.

Les anciens artefacts claude.ai restent en ligne mais ne sont plus mis à jour : ils appartiennent au compte
qui les a créés, et le partage « en modification » à un autre compte n'y donne que la lecture (essayé).

Le prototype « Les trois fantômes » (`outils/trois-fantomes/`) a son propre lien, privé :
https://claude.ai/artifact/GzdV7YsCpbRwXYzYce4Ae6 .

## Reprendre le travail (une autre session, un autre compte)

Tout ce qu'il faut est dans le dépôt : les pages, les voix, les scripts, les essais et ces deux LISEZ-MOI (celui-ci et
`outils/trois-fantomes/LISEZ-MOI.md`). À faire avant :

- **GitHub** : la nouvelle session doit avoir accès au dépôt `Mariusky008/trouper-cohorts`.
- **Les tours** sont servis par le site : rien à transmettre, `main` suffit (voir « Publier »).
- **Le prototype** reste un artefact claude.ai : il appartient au compte qui l'a créé. Entre deux comptes séparés,
  le partage « en modification » ne donne que la lecture (essayé avec les tours) : un autre compte le publiera sur
  un nouveau lien, depuis `outils/trois-fantomes/`.
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
- Après une modification : relancer la chaîne, `essai-parcours.mjs` sur les tours touchés, puis pousser sur `main` : le site les met en ligne.
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
