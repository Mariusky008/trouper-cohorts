# La démo « humaine » — le texte final (30 octobre)

Écrit par le propriétaire, pour `docs/passation.md` 5.2. Un mois chez un commerce **inventé** (Chez Bergine, le
restaurant des démos), raconté par le propriétaire (« P », sa photo façon CV en haut, la bouche qui bouge) et Mike
(« M »). On vouvoie : la démo parle aux commerçants démarchés. `[ton prénom]` : il dit le sien.

**Toutes les voix sont réenregistrées** (le propriétaire, et Mike sur ElevenLabs), même celles qui existaient : rien
de l'ancienne démo n'est repris. Les chiffres à l'écran sont inventés et écrits « objectif », jamais « exemple ».

| # | Qui | Ce qui est dit (au mot près) | À l'écran |
|---|---|---|---|
| 1 | P | « Bonjour ! Moi, c'est [ton prénom]. Mon métier ? Faire en sorte que les gens ne se contentent plus de regarder votre commerce sur leur téléphone… mais qu'ils poussent votre porte. » | sa carte CV arrive en haut ; un téléphone qu'on fait défiler, puis une porte qui s'ouvre |
| 2 | M | « Et moi ! Je suis Mike, votre futur fantôme préféré. » | Mike jaillit de sa cage ; la carte dit « Mon assistant » |
| 3 | P | « On a 30 jours pour transformer votre communauté en clients. Je vous montre ? » | « 30 jours », un calendrier |
| 4 | P | « Jour 1 : je viens chez vous. Quelques photos, deux ou trois questions… et Mike s'occupe du reste. » | « Jour 1 » ; l'interview « Face au fantôme » dans le téléphone |
| 5 | M | « Avec quelques photos, je fais une très belle vidéo où je mets à l'honneur votre menu du jour, puis je la publie partout pour que tout le monde la voie. » | la vidéo en plein téléphone, puis Instagram, Facebook, Google, Le Direct |
| 6 | P | « Mais ce n'est pas là qu'il est le plus fort. C'est juste après. » | |
| 7 | M | « À la fin de la vidéo, chaque personne peut libérer son fantôme pour dire ce qu'elle en pense : "J'adore la vidéo", "Je passerai un jour, c'est sûr", ou "Je passe aujourd'hui". » | les trois cages apparaissent |
| 8 | M | « Et moi, je leur réponds ! Petit à petit, je découvre leurs envies, leurs habitudes… et je leur donne une bonne raison de pousser votre porte. Et pour les plus fidèles, ceux qui ouvrent en premier ma cage dorée, je les bichonne avec des petites surprises. » | les cages s'ouvrent, des fantômes apparaissent ; la cage dorée, les surprises découvertes |
| 9 | M | « Chaque jour, une nouvelle vidéo invite à rejoindre votre famille de fantômes. Elle grandit devant votre porte. » | la famille devant la porte, qui grandit |
| 10 | P | « À la fin du mois, on fait le bilan ensemble : chaque bon validé à votre comptoir, c'est un client que je vous ai amené. » | « Fin du mois » ; le bon, « Servie ✓ » ; le bilan « Objectif du mois » (chiffres inventés) |
| 11 | M | « Et voilà : pas de blabla, pas de fausses promesses. » | |
| 12 | M | « On n'est pas là pour vous apporter des vues. On est là pour vous apporter des clients. » | en grand |
| 13 | P | « 1 mois gratuit, un mois pour faire mes preuves, alors, on commence ? » | son contact (son numéro à toucher), « Revoir » ; puis, si elle est enregistrée, sa mère |

Durée visée : environ 1 min 05.

## Les enregistrements — REÇUS (30 octobre)

Rangés dans `outils/tour-du-fantome/recu/humain/` sous leur numéro (`01-p.mp3` … `13-p.mp3`), d'après l'ordre de
l'archive : Mike (« Mike - Young, Fragile and unsure ») de 18 h 57 à 19 h 00, le propriétaire (« Adrien Clairon -
Podcast Narrator ») de 19 h 08 à 19 h 10 — les deux sur ElevenLabs. La durée de chacune colle à son nombre de
syllabes. Une de trop : `piece-dor-p-non-utilisee.mp3` (9,5 s, 19 h 09 min 40), sans doute l'ancienne réplique de la
pièce d'or, retirée du texte. La 5 dure ce que dure la phrase sans le doublon (« une très belle vidéo » une fois) :
à confirmer à l'écoute. Aucune transcription automatique ici (les modèles ne se téléchargent pas) : l'écoute du
propriétaire fait foi.


- **Le propriétaire** : 1, 3, 4, 6, 10, 13. **Mike** (ElevenLabs, même voix que d'habitude) : 2, 5, 7, 8, 9, 11, 12.
- Un fichier par réplique, nommé par son numéro et sa voix : `01-p.mp3`, `02-m.mp3`, … `13-p.mp3`.
- Une pièce calme, toujours à la même distance du micro ; une demi-seconde de silence avant et après ; si une phrase
  est ratée, refaire tout le fichier plutôt qu'une coupe au milieu.
- **Pour l'essai des deux bouches** : sa photo (de face, fond neutre) et `01-p.mp3`. Pour la vraie bouche filmée, en
  plus : une vidéo de la bouche qui dit la réplique 1 (1080p, face caméra, lumière égale, sans bouger) et l'accord
  écrit de la personne filmée.

## La démo construite (30 octobre)

`outils/tour-du-fantome/tour-humain/` (script `outils/tour-humain.py`, voir le LISEZ-MOI du tour), à publier à
`clikme.fr/tours/humain`. Environ 1 min 37 : les voix reçues durent 84 s à elles seules. **Le 31 octobre**, ses six
répliques sont réenregistrées avec **sa voix clonée** (ElevenLabs, « jean ») : elles remplacent les premières dans
`recu/humain/` (01, 03, 04, 06, 10, 13 ; l'ancienne voix reste dans l'historique git). Le propriétaire y est sa
**figurine sur ressort** (depuis la sixième passe ; avant, sa tête sur un corps de fantôme) ; Mike, le fantôme des
démos.

| # | Ce qui se voit |
|---|---|
| 0 | **avant « Bonjour ! »** : sa carte dit « Élu meilleur community manager 2026* », une médaille « N°1 » au coin ; « *par sa mère » tombe dessus comme un tampon ; **le polaroïd de sa mère** arrive (« Maman 💕 ») et elle le dit elle-même : « T'es le meilleur, mon fils ! » (sa voix, mot à mot dans une bulle ; son visage passe du neutre au sourire, au rire) ; lui, sur sa photo, est surpris puis en rit ; des cœurs, elle s'en va |
| 1 | sa carte de CV : **sa photo se met à parler** ; sur « Mon métier ? » **sa tête sort de la photo** (la carte, sans tête, vacille et tombe) et devient sa figurine sur ressort, qui salue, un clin d'œil bouche en « o » ; **un fil façon Instagram** qu'on fait défiler de plus en plus vite (double-tap ♥, elle louche dessus) : « ❤️ 2 304 j'aime »… « 🚪 0 client » ; sur « poussent votre porte » le fil s'arrête, la photo devient une porte qui s'ouvre, deux fantômes y entrent : « 1 client », « 2 clients » ; son grand rire |
| 2 | la cage de Mike tombe à côté d'elle, il s'y agite (elle y jette un œil) ; **comme un diable de sa boîte**, il jaillit tout en haut, hors du cadre, retombe, s'écrase et rebondit — **« TADAM ! »** façon bande dessinée ; elle sursaute (« oh ! ») ; sa toque lui tombe sur la tête (bonk, des étoiles) ; sa carte « Mike · Mon assistant » se retourne |
| 3 | **une éphéméride** : on en arrache les pages, de plus en plus vite, jusqu'au 30 (entouré) ; des « j'aime » qui deviennent des fantômes sur « en clients » ; ses bras s'ouvrent, un clin d'œil sur « Je vous montre ? » |
| 4 | une page neuve retombe sur l'éphéméride, le tampon « JOUR 1 » ; la façade de Chez Bergine, quatre éclairs, quatre photos ; le téléphone : « Face au fantôme », question 2 sur 3 ; Mike tombe au pied du téléphone |
| 5 | les photos plongent dans le téléphone, le film « Monté par Mike », « Votre menu du jour, à l'honneur », les réseaux, les vues, les cœurs |
| 6 | elle revient et regarde Mike ; le film file en avance rapide |
| 7 | les trois cages, trois doigts, les trois groupes de fantômes |
| 8 | un message vers chacun ; la conversation avec Camille (en semaine, poisson) ; « Il reste une table ce midi » sur son WhatsApp ; la porte s'ouvre, « Camille est venue » ; la cage dorée (« La surprise du chef », 0/15 → 3/15), les fidèles et leur pièce cousue, les trois premiers et leur surprise |
| 9 | la vidéo du jour « Rejoins ma famille de fantômes », la famille devant la porte, « Record battu » |
| 10 | l'éphéméride revient, le mois passe en quelques pages arrachées, le 30 entouré ; « Le bilan du mois », le bon de Léa tamponné « Servie ✓ », « +1 client amené », « Objectif du mois : 27 clients amenés » (plus sage que 120, à la demande du propriétaire) |
| 11 | Mike en grand ; des bulles « bla bla » qui se bousculent puis se dégonflent ; trois notifications de « gourous » (applis inventées : « Deviens viral en 24 h, garanti ! », « +10 000 abonnés en 7 jours », « Ma méthode secrète : 997 € ») que le tampon « BIDON » écrase |
| 12 | « 👁 12 480 vues » barré ; elle revient à côté de Mike ; une porte, des fantômes qui entrent, « Des clients » |
| 13 | elle et Mike ; « 1 mois gratuit · pour faire mes preuves », son rire ; **son contact** : « Jean-Philippe · 📞 06 22 12 96 75 » (on le touche pour l'appeler) ; « On commence · 1 mois gratuit » (vers `/inscription`), « Revoir » |

Son prénom et son numéro (`PRENOM`, `TELEPHONE` dans le script) : confirmés par le propriétaire le 31 octobre.
Partout : un léger voile sur les bords de l'image.

**Troisième passe (31 octobre, après son essai sur téléphone : « ça saute », « le son se perd », « la tête et le
corps ne vont pas ensemble »)** : la page joue une bande-son d'un bloc (`son.mp3`) ; elle est allégée (plus de flou,
plus de calque par élément) ; sa tête est nettoyée de son liseré rose, son cou (et le col de sa chemise) rentre dans
le corps du fantôme comme dans un costume, et le corps penche avec sa tête ; Mike rebondit sur sa voix.

**Quatrième passe (31 octobre : « au démarrage, ma mère qui dit : t'es le meilleur, mon fils », « la vidéo bug
beaucoup », alors que sa 4G est au maximum)** : l'ouverture avec sa mère (la ligne 0 ci-dessus ; sa voix est un
fichier ElevenLabs qu'il a fourni, ses trois photos aussi). Les saccades ne venaient pas du réseau : un iPhone devait
composer une dizaine de calques plein écran à chaque image, et sauter dans un film à images clés espacées. **La page
joue maintenant une vidéo** (`demo.mp4`, rendue depuis la page, son compris) ; l'animation en direct, allégée, ne
sert que si la vidéo ne vient pas, et reprend la main à la fin pour que son numéro se touche.

**Cinquième passe (31 octobre)** : le sceau de sa carte, sérieux (pour faire vrai) ; plus de « 1 min 40 · avec le
son » au départ ; la façade de Chez Bergine refaite, le soir, accueillante ; le film de Mike défile de nouveau dans la
vidéo (il restait figé : le rendu ne servait pas la page par morceaux) ; la cage dorée et son cadeau refaits ; « pas de
blabla, pas de fausses promesses » refait (bulles qui se dégonflent, notifications de « gourous » tamponnées
« BIDON ») ; plus de QR code à la fin. **La fin avec sa mère** est prête : il reste son enregistrement.

**Sixième passe (31 octobre : « les gens me disent que mon personnage, ma tête sur un corps de fantôme, n'est pas
terrible ; ce serait mieux un mini corps »)** : sa figurine devient **un jouet sur ressort à son image** (buste en
gilet, ressort, socle en bois), d'après les six images qu'il a faites (neutre, parle, clin d'œil, rire bras ouverts,
louche bras croisés, salut). Elle rebondit et penche sur sa voix, change de tête sans changer de geste, rebondit à
chaque geste ; sur « Mon métier ? », sa vraie tête sort de sa carte et devient le jouet dans l'éclair, et il salue.
Les deux démos (restaurant, atelier). Il manque la bouche en « o » (la page prend « parle »).

## À garder en tête

- **La 8** (« Et moi, je leur réponds ! ») montre ce que fera la sonnette WhatsApp (chantier 4), pas encore branchée :
  la brancher avant de démarcher en nombre.
- **La 8** dit « les plus fidèles, ceux qui ouvrent en premier ma cage dorée » : aujourd'hui, la cage dorée n'a pas de
  priorité de palier (le premier qui l'ouvre gagne, nouveau venu compris). À mettre d'accord : « les plus rapides »
  dans le texte, ou une priorité des fidèles dans l'app.
- **Le prix** (5.5) : la promesse « vous ne payez que si je vous amène des clients » n'est plus dans le texte ; à
  remettre quand le prix sera fixé.
