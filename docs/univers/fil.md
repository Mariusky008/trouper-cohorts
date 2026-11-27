# 🎞️ Découvrir : le fil « de pièce en pièce »

## 1. D'où ça vient

Le 23 novembre 2026, après trente minutes sur l'appli, le propriétaire : « je n'ai pas ce sentiment de simplicité
d'utilisation qui fait que dès la première seconde on sait quoi faire, et qu'après quelques secondes on ne veut plus en
partir, comme sur le fil d'actualité de Facebook, TikTok ou Instagram ».

Une première maquette proposait un fil de vidéos. Sa réponse : « c'est exactement la même chose que TikTok […] la
différence pour nous, c'est que je vois quelque chose avec d'autres personnes, je vois leur réaction, et je peux
découvrir leur maison ». La maquette refaite, « de pièce en pièce », est validée, ainsi que le découpage en quatre lots.

**L'idée** : on ne fait pas défiler des vidéos. On passe de pièce en pièce, et on y voit des gens (là, ou ce qu'ils y ont dit aujourd'hui). La
vidéo n'est que la raison d'être ensemble : ce qu'on regarde, ce sont les gens, leurs réactions, leur maison.

## 2. Les décisions du propriétaire

- **Le fil remplace la page Découvrir** : l'onglet garde son nom, et c'est la forme de la page qui change.
- **La figurine se fait à l'inscription**, avec le choix de sa pièce (« les gens adorent se voir en figurine »). Le fil
  ne la demande pas.
- **La séance entre proches et les salons existent déjà** : le fil les ouvre, il ne les refait pas.
- **Le mème du jour n'existe plus** ; l'humeur du jour, oui.
- **Les maisons d'inconnus** (lot F2) : seulement celles des personnes qui l'acceptent, et chez ceux qui partagent une
  de leurs passions. La question se pose à l'inscription, juste après le choix de la pièce (« Qui peut venir voir ta
  pièce ? »), et un interrupteur dans Ma maison permet de changer d'avis. Les 15-17 ans restent entre eux.
- **Tous les salons sont dans le fil, même vides** (le propriétaire, le 23 novembre 2026, en ouvrant Découvrir sur
  « Personne en direct pour l'instant » : « on ne me propose pas de salon, même s'il est vide, sur le même mode, sans
  avoir à aller sur le bouton « Tous les salons », qui posait justement problème côté simplicité ? »). D'abord ceux où il
  y a quelqu'un ; puis les autres, « Sois le premier ». On ne montre jamais assis quelqu'un qui n'y est pas : un salon
  vide montre ce qui s'y est dit aujourd'hui, avec le prénom et l'heure.
- **Jamais une fausse réponse** : dans la maquette, quelqu'un répondait tout seul (« Bienvenue ! ») ; en vrai, une
  réponse vient toujours d'une vraie personne.

## 3. Le lot F1 : ce qui est fait

**L'écran** (`app/collection/fil-decouvrir.tsx`) :

- L'onglet Découvrir s'ouvre sur un fil plein écran. On glisse vers le haut, et chaque écran s'arrête net sur une pièce.
- La première fois, une seule consigne s'affiche : « Glisse : de pièce en pièce, de salon en salon » et
  « Touche deux fois : ta figurine réagit, et on la voit ». Elle s'en va au premier geste.
- **Sa figurine est au bord de la pièce**, en bas à droite (« Toi »), avec la tête de son humeur du jour.
- **Toucher deux fois l'écran** (ou toucher sa figurine) : elle réagit.
  - Dans un salon, pour de vrai : elle s'assoit dans le gradin le temps qu'on y est, et sa réaction part au salon
    (😂, ou 💃 dans celui de la musique). L'écran dit « Les 2 te voient » (« Sam te voit » ; dans un salon vide, « Les
    suivants te verront » : elle y est la première, et le prochain qui entre la voit).
  - Quand on glisse plus loin, elle quitte le salon.
  - Ailleurs, elle saute, et rien ne part.
- **Les pièces** :

  | Pièce | Ce qu'on y voit | Bouton |
  | --- | --- | --- |
  | 🛋️ Un salon en direct | sa télé (ce qui passe), son gradin, les figurines de ceux qui y sont, leurs dernières bulles | « M'asseoir » |
  | 🎵 Le salon de la musique | la même chose ; les figurines dansent ; « 🎵 Le choix de Léa » ou « 📻 La radio du salon » | « Entrer danser » |
  | 📍 Une figurine posée dans Autour | sa figurine assise, son mot du jour en grand, le lieu, combien d'heures il lui reste | « M'asseoir à côté » (le lieu, dans Autour) |
  | ☀️ L'humeur de ses proches | leurs figurines qui en font la tête ; les humeurs douces d'abord (« Un mot de toi, et sa journée change ») | « Répondre à Sam » (Messages, sa conversation) |
  | 🪑 Un salon sans personne | « ✨ Sois le premier » ; sa télé (ce qui passe) ; son gradin vide ; les dernières bulles de la journée (« Zoé · il y a 2 h », « Qui a une recette de crêpes ? ») ; « Zoé y était aujourd'hui. Assieds-toi : les suivants te verront. » (musique : « La radio tourne. Entre danser… ») | « M'asseoir » |

- **En haut** : rien qu'une pastille, s'il y en a une (« 🎬 Sam t'invite devant sa télé », une visite qui attend). Le
  bouton « Tous les salons » est parti le 26 novembre 2026 au soir (le propriétaire : « quand je clique dessus j'arrive sur
  l'ancien design et concept : il faut l'enlever ») ; l'ancienne page (ma télé du jour, les salons par passion,
  `#salons`) ne s'ouvre plus que par les anciens liens, avec « ‹ Le fil » pour revenir.
- **« Quoi de neuf ? »** (26 novembre 2026, la maquette validée par le propriétaire :
  https://claude.ai/artifact/YT3qagN9r2jdPZNZBdXhAW ; `app/collection/quoi-de-neuf.tsx`) : tout en haut du fil, une rangée
  de cartes comme les stories de Facebook, qui s'en va en glissant vers la première pièce. D'abord « Ton humeur » (« ＋ »
  tant qu'il ne l'a pas dite : elle ouvre « Ton humeur du jour »), puis ses proches qui ont dit la leur aujourd'hui (leur
  figurine qui en fait la tête ; un rond rose tant qu'il ne l'a pas regardée). Sans proche qui l'a dite : les maisons
  ouvertes de ceux qui partagent une de ses passions (« ⚽ Foot, comme toi »). Toucher une carte : sa figurine du jour en
  grand, sa pancarte, et « Réagis avec ta figurine », pour de vrai :
  - un proche : 🤗 un câlin, 💭 « Je pense à toi », ❤️, 😂 (les gestes de leur conversation), « Lui répondre », « Voir sa
    maison » ;
  - quelqu'un à découvrir (le propriétaire : « l'idée, c'est vraiment de créer des liens avec des inconnus ») : 👋 Coucou,
    « ⚽ Allez ! » (l'emoji de leur passion), 😂 Je ris, 👏 Bravo — sa figurine apparaît dans sa pièce en le faisant (le
    coucou de la maison ouverte, un de chaque par jour ; répondre répond à tous) ; « Frapper à sa porte », le salon de leur
    passion.

  Toucher à droite : la suivante. L'humeur de ses proches n'est plus une pièce du fil. Depuis le 27 novembre 2026, la
  rangée est toujours là, au moins avec « Ton humeur » (« Dis à tes proches comment tu vas » quand personne d'autre n'y
  est) ; et si elle arrive après le fil gardé en mémoire, le fil remonte la montrer (sur un ordinateur, le navigateur
  restait accroché à la première pièce et la rangée se cachait au-dessus).
- **Les vidéos se lancent seules** (26 novembre 2026, « comme sur YouTube : quand je scrolle, je vois le début de la
  vidéo avec le son ») : la télé de la pièce à l'écran joue, une seule à la fois dans toute l'appli
  (`app/collection/apercu-video.tsx`, aussi dans les « Propositions de groupes » de Mes groupes). Le son : les navigateurs
  l'interdisent tant qu'on n'a pas touché la page ; avant, « 🔇 Touche pour le son » ; après le premier toucher, chaque
  vidéo qui démarre a le son ; « 🔊 » le coupe pour les suivantes (on s'en souvient). Un iPhone ne donne le son qu'au
  lecteur qu'on a touché : depuis le 27 novembre 2026, dans le fil et dans la rangée des propositions
  (`data-apercu-scene`), c'est UN SEUL lecteur qui passe d'une télé à l'autre (posé par-dessus celle qui joue, il change
  seulement de vidéo), et le son donné une fois reste pour les suivantes.
- **Sans âge dit** : la question « as-tu 18 ans ou plus ? » d'abord, puis les salons arrivent.
- **Rien du tout** (les salons fermés par l'interrupteur) : « Personne en direct pour l'instant », avec « 📍 Poser ma
  figurine ». Avec les salons ouverts, cela n'arrive plus : il y a toujours les salons vides.
- **Le fil vit** :
  - il se recharge toutes les 30 secondes, sans bouger sous le doigt : les pièces déjà là gardent leur place et se
    mettent à jour, les nouvelles s'ajoutent à la fin ;
  - dans un salon où sa figurine est entrée, les bulles arrivent toutes les 6 secondes ;
  - ce que le fil montrait il y a moins de dix minutes s'affiche tout de suite à l'ouverture.

**L'ordre** (simple ; le lot F4 l'a affiné, section 7) : les salons de ses passions où il y a quelqu'un, l'humeur de ses proches,
Autour, les autres salons où il y a quelqu'un — un de chaque à tour de rôle (`ordreDuFil`), pour que deux pièces de la même
sorte ne se suivent pas quand il y en a d'autres. Puis les salons sans personne : ses passions, la musique, puis les autres
dans l'ordre du catalogue (seize pièces au plus).

**Les adresses** :

- `#decouvrir` : le fil ;
- `#salons` (et `#tous-les-salons`) : l'ancienne page ;
- `?tele=<id>#decouvrir`, le lien d'une vidéo à revoir dans une notification : il s'ouvre dans ma télé du jour, donc
  dans « Tous les salons » ;
- les anciens liens `#voeu`, `#mission` et `#reponses`, le bouton « 📺 Ma télé » de Ma maison, l'étape « Choisir tes
  passions », la page « Découvrir » de la visite guidée, la notification « demande de proche » : « Tous les salons ».

## 4. Le code

- `lib/direct/fil-decouvrir.ts` (partagé) : les types (`FilVue`, `PieceFil`, `SalonFil`, `AutourFil`, `HumeurFil`),
  `ordreDuFil`, `reactionDuFil`, les phrases (`PHRASES_FIL`).
- `lib/direct/fil-decouvrir-serveur.ts` : `filDecouvrir`, qui lit ce qui existe déjà, sans rien ranger de nouveau.
  - Les salons viennent de `salonsEnDirect` (`salons-ouverts-serveur.ts`) :
    - en direct : pour chaque thème, le plus rempli ; ses présents, lui exclu ; les bulles des dix dernières minutes,
      sans ceux qu'il ne veut plus voir ;
    - sans personne (lui exclu) : le premier salon du thème, et ses `traces` (les trois dernières bulles des dernières
      24 h, `TRACES_MS`, ni les siennes, ni celles de ceux qu'il ne veut plus voir) ;
    - pour tous : le gradin, la télé, le morceau proposé.
  - Les figurines posées viennent d'Autour : les deux plus récentes de sa ville, pas les siennes, assises.
  - L'humeur des proches : ceux à qui il parle, qui l'ont dite aujourd'hui, avec la tête de leur humeur
    (`teteDeLaMaison`).
  - Sa figurine (`silhouetteDuFil`), la première invitation devant une télé, le nombre de demandes de proche.
- La route `GET /api/direct/fil-decouvrir` → `{ fil }`. Réagir passe par la route des salons : `entrer`, puis `ecrire`
  une réaction ; `sortir` quand on glisse plus loin.
- `ma-collection.tsx` : l'onglet Découvrir (le fil, `#o-decouvrir`) et la vue « Tous les salons » (`#o-salons`).

**Les essais** :

- `scripts/essai-fil-decouvrir-route.mjs` :
  - l'ordre et le contenu de chaque pièce ;
  - la cuisine (sa passion, elle y est seule) dans le fil, avec ce que Zoé y a dit ; puis tous les autres salons, vides ;
  - jamais un salon des 15-17 ans chez les adultes (ni l'inverse), jamais un compte ;
  - réagir depuis le fil (Sam la voit) ;
  - « ne plus voir » ; l'invitation ; sans âge ; 401.
- `scripts/navigateur/fil-decouvrir.mjs` (un iPhone) :
  - le salon en direct, la consigne, toucher deux fois (Sam la voit pour de vrai) ;
  - glisser : sa figurine quitte le salon ;
  - « Répondre à Sam » ouvre la conversation ;
  - Autour, la musique ;
  - la cuisine sans personne : « Sois le premier », la bulle de Zoé ; toucher deux fois : « Les suivants te verront »,
    elle s'y assoit, et Hugo, qui entre, la voit ;
  - « Tous les salons » et « ‹ Le fil », le lien `?tele=`, sans âge.
- Les essais de l'ancienne page de Découvrir l'ouvrent maintenant par `#salons`, dans `#o-salons`.

## 5. Le lot F2 : les maisons ouvertes (25 novembre 2026)

**Qui peut venir voir ta pièce ?** Un quatrième choix s'ajoute à ceux de Ma maison (👯 Mes proches, 🌍 Tout le monde, 🔒
Moi seul) : **🧭 « Aussi ceux qui aiment ce que j'aime »** (`passions`, `ma-maison.ts` : `VISIBILITES_DE_MAISON`). Sa
pièce entre alors dans le fil de ceux qui :

- ne sont pas ses proches (ils l'ont déjà) ;
- sont de **sa tranche d'âge** : les 15-17 ans entre eux, les adultes entre eux. Un âge jamais dit : la question
  d'abord, jamais devinée ;
- partagent **au moins une de ses passions**.

« Tout le monde » (adultes seulement, le lien) comprend ce choix-là. Ils voient seulement ce qu'il a ajouté lui-même,
jamais ce qui vient de ses conversations, et ne peuvent pas lui laisser de surprise (réservé aux proches, comme avant).

**À l'inscription**, juste après le premier choix de sa pièce, la feuille « 🚪 Qui peut venir voir ta pièce ? » : « 👯
Mes proches seulement » ou « 🧭 Aussi ceux qui aiment ce que j'aime » (`QuestionPorte`, `ajouter-chez-moi.tsx`). Il
change d'avis dans Ma maison, 🚪 « Qui peut entrer » : c'est l'interrupteur.

**Dans le fil**, une pièce « maison » (`MaisonFil`) : sa pièce, sa figurine, « ⚽ Foot et sport, comme toi », « Chez Zoé ».

- **🚪 Frapper à sa porte** : la visite, qui existe (`/univers/chez/<clé>`).
- **👋 Lui faire coucou** (ou toucher deux fois) : sa figurine apparaît dans la pièce de l'autre (« 👋 Coucou ! »), qui
  est prévenu. Une fois par jour chez la même personne. Il répond (« 👋 Lui répondre ») ou la laisse (« Pas
  maintenant ») : la figurine s'en va. S'il répond, celui qui a fait coucou est prévenu, et son fil dit « 👋 Zoé t'a
  répondu ! ». Jamais une fausse réponse : rien ne répond à sa place.

**La surprise d'une visite** (décidé avec le propriétaire le 25 novembre 2026, quand l'appli s'est mise à s'ouvrir sur
le fil) : en haut du fil, « 🎁 Sam t'a laissé un cadeau » ou « 🚪 Léa a frappé à ta porte », qui ouvre « Messages », où
on la découvre.

**Le code** :

- `ma-maison.ts` : `VisibiliteMaison`, `ouverteAuFil`, `PHRASES_PORTE`, `CoucouVu` ;
- `visites-serveur.ts` : `passionEnCommun` (la règle), `peutEntrer` et `maisonVisitee` (qui entre),
  `choisirVisibiliteMaison` (409 `{ age }` sans âge dit ; `majeur` : sa réponse), `maisonsPourLeFil`, `faireCoucou`,
  `repondreCoucou`, `coucousRecus` ;
- le seau : `maisons/ouvertes.json` (`{ liste: [{ h, le, m }] }`, `m` : « adultes » ou « jeunes », un premier tri ; la
  règle est revérifiée à chaque lecture) ; `<h>/monde/coucous.json` (`coucous-serveur.ts`) ;
- les routes : `POST /api/direct/visites { action: "coucou", cle }` ; `POST /api/direct/ma-piece { action: "coucou",
  id, oui }` ; `maison.coucous` dans ce que rend `ma-piece` ;
- l'écran : `fil-decouvrir.tsx` (la pièce « maison », la surprise en haut), `maison-catalogue.tsx` (la figurine du
  coucou dans sa pièce, sa carte ; la question après le premier choix), `ajouter-chez-moi.tsx` (`QuestionPorte`, l'âge
  dans « Qui peut entrer »).

**L'essai** : `scripts/essai-maisons-ouvertes-route.mjs` (qui voit quelle maison, les 15-17 ans, la porte, le coucou et
sa réponse, la pièce refermée, la surprise).

## 6. Le lot F3 : mes proches en direct (25 novembre 2026)

**Dans le fil** :

- **La séance en cours chez un proche** (il n'y est pas ; deux au plus) arrive en premier : « Chez Léa, en direct »,
  ce qui passe à sa télé, sa pièce avec les figurines de ceux qui y sont (l'hôte d'abord), « Léa et Sam regardent
  ensemble » (seul : « Léa regarde sa télé », « Sam regarde chez Léa »).
- **Déjà invité** : « 🛋️ M'asseoir avec eux ». **Sinon** : « 🙋 Demander à les rejoindre ». L'hôte reçoit une
  notification (« 🙋 Zoé aimerait vous rejoindre ») ; la carte dit « Demande envoyée à Léa » (une demande par heure).
- **Chez l'hôte, devant sa télé** : « 🙋 Zoé aimerait vous rejoindre », avec sa figurine ; « Lui faire une place »
  (l'invitation habituelle : notification, « Venir », la carte du fil devient « M'asseoir avec eux ») ou « Pas
  maintenant » (la demande s'en va, rien n'est dit à l'autre : jamais une fausse réponse).
- **Seulement chez ses proches** (des deux côtés) ; tous partis, la séance quitte le fil et on ne peut plus demander.

**Faire signe** : dans un salon ou une séance, au-dessus de la figurine de celui qui vient d'arriver (après moi, depuis
moins d'une minute et demie), un 👋 ; un toucher, et le geste « coucou » part vers lui (une fois). Celui qui est entré
depuis le fil (en touchant deux fois l'écran) le voit sur sa figurine : « 👋 Sam te fait signe ».

**Le code** :

- `salons-ouverts-serveur.ts` : `seancesDesProches`, `demanderARejoindre`, `laisserLaDemande` ; le pouls de l'hôte rend
  `rejoindre` ; `inviterChezMoi` efface la demande. La demande : `decouvrir/salons/prives/chez-<q>/rejoindre/<q>.json`.
- les routes : `POST /api/direct/salons-ouverts { action: "rejoindre", chez }` → `{ invite? | demande? }` ;
  `{ action: "laisser-demande", cle }`.
- l'écran : `fil-decouvrir.tsx` (`PieceSeance`, « 👋 Sam te fait signe »), `salon-ouvert.tsx` (la demande chez l'hôte,
  le 👋 au-dessus de celui qui arrive).

**Les essais** : `scripts/essai-proches-en-direct-route.mjs`, `scripts/navigateur/proches-en-direct.mjs`.

## 7. Le lot F4 : l'ordre du fil (25 novembre 2026)

Le propriétaire : « d'abord ses proches en direct, puis ses passions, puis les maisons, puis Autour ; rien ne revient
deux fois de suite ».

- **L'ordre** (`ordreDuFil`, `fil-decouvrir.ts`) :
  1. ses proches en direct : leurs séances, puis les salons ouverts où un proche est en ce moment (« 👋 Sam et Hugo sont
     là », des deux côtés) ;
  2. l'humeur de ses proches ;
  3. les salons de ses passions où il y a quelqu'un ;
  4. les maisons ouvertes ;
  5. Autour ;
  6. les autres salons où il y a quelqu'un ;
  7. les salons sans personne (ses passions, la musique, le reste).
- **Rien ne revient deux fois de suite** : à chaque pas, la première pièce de cet ordre qui n'est pas de la même sorte
  que la précédente (un salon, une séance, une maison, Autour, l'humeur). S'il ne reste qu'une sorte, elles se suivent.
- Seize pièces au plus, comme avant.

**Les essais** : `scripts/verifier-fil.mjs` (sans téléphone, dans « Types et lint ») ; `essai-fil-decouvrir-route.mjs` et
`navigateur/fil-decouvrir.mjs` (« 👋 Sam et Hugo sont là »).

## 8. La pièce du salon refaite (25 novembre 2026)

**Le constat du propriétaire, captures à l'appui** (téléphone et ordinateur) : en glissant, on voit la vidéo, puis plus
rien jusqu'au bouton « M'asseoir ». Le gradin d'un salon n'a pas encore d'image validée : le plan des places s'affichait
sur un fond vide. La maquette « Découvrir, le fil repensé » est validée (« ok let's go »), avec une consigne : « il faut
éviter trop d'infos avant qu'on rentre dans le salon : la vidéo et les sièges vides ou remplis, avec le siège qui m'est
destiné, c'est suffisant » (la rangée « À suivre sur la télé » de la maquette est donc retirée).

- **La pièce** (`.fd-salle`) : un mur, un sol, la télé du salon en haut ; devant elle, les huit places (`PLAN_GRADIN`).
- **Sans gradin validé, chaque place libre est un fauteuil vide** (`data-fauteuil`). Les places prises montrent leurs
  figurines, et on ne montre jamais assis quelqu'un qui n'y est pas. Avec un gradin validé, c'est son image qui donne
  les places, comme avant.
- **« Ta place »** (`data-ta-place`) : la première place libre, dans l'ordre du salon (celle que le salon lui donnera).
  Sa silhouette y est dessinée en pointillés roses, au-dessus d'un fauteuil qui brille. La toucher ouvre le salon,
  comme « M'asseoir ». Une fois sa figurine entrée (toucher deux fois l'écran), elle s'y assoit (« Toi ») ; sa
  réaction et « Les 2 te voient » s'affichent au-dessus de sa place.
- **Dans un salon, sa figurine n'est plus au bord de l'écran** : elle a sa place dans la pièce. Ailleurs (Autour,
  l'humeur des proches, une maison, une séance), elle reste en bas à droite.
- **En bas** : le nom du salon, une ligne (« 6 places libres », « Zoé y était aujourd'hui… »), « M'asseoir », et
  « Inviter » : le lien du salon par le partage du téléphone, sinon copié (« Lien copié : envoie-le à qui tu veux »).
- **Sur un ordinateur (1 000 points et plus)** : la pièce à gauche, en grand ; à droite, le nom du salon, sa ligne et
  les deux boutons, l'un sous l'autre.
- Les bulles de ce qui s'est dit aujourd'hui restent (la décision du 23 novembre).

**Les essais** : `scripts/navigateur/fil-decouvrir.mjs` (« Ta place », les six fauteuils libres du salon du foot, les
huit de la cuisine vide, « Inviter », « Toi » après s'être assise, sa figurine au bord seulement hors des salons, et sur
un ordinateur la pièce à gauche et le salon à droite) ; `proches-en-direct.mjs` trouve sa figurine par « Toi ».

## 9. Plus d'écran entre « M'asseoir » et le salon (25 novembre 2026)

**Le constat du propriétaire** : « quand on clique sur M'asseoir, j'ai d'abord un écran complètement inutile qui
stipule le thème, comme Séries et films, et qui fait perdre du temps pour rien. » Cet écran (« 🎬 Séries et films … »)
attendait que le téléphone ait chargé la page, puis demandé au serveur de faire entrer sa figurine.

- **Le serveur entre avant d'envoyer la page** (`src/app/univers/salons/page.tsx`, `entreeDuServeur`) : la même
  entrée que l'action `entrer` (un salon) ou `entrer-chez` (une séance). La page arrive avec le salon prêt et sa place
  prise. Il n'y a plus d'aller-retour en plus.
- **Le temps que le téléphone reprenne la page** (une fraction de seconde), on voit la pièce encore vide : le titre du
  salon et la télé noire, jamais le thème en grand (`SalonOuvert`, `initial`).
- Les autres écrans ne changent pas : son âge à dire, sa figurine à créer (sans compte, arrivé par un lien), exclu.
  Si l'entrée échoue côté serveur, le téléphone la refait lui-même, comme avant.
- **L'heure de la télé** : l'heure du serveur (`tele.maintenant`) date d'avant l'arrivée de la page. Quand le navigateur
  a chargé cette page-ci, on l'avance du temps écoulé depuis la réponse (`aCetteHeure`), pour que tout le monde reste
  à la même seconde. Arrivé par une navigation de Next (sans recharger), le délai est court et on n'y touche pas.
- **Dans le fil**, « M'asseoir », « Ta place » et « M'asseoir avec eux » d'une séance réagissent tout de suite au toucher : ils
  battent doucement pendant que le serveur fait entrer sa figurine (`data-part`).

**L'essai** : `scripts/navigateur/salons-ouverts.mjs` vérifie qu'en entrant dans le salon du foot, on ne voit jamais
l'écran du thème et que le téléphone n'envoie aucune demande d'entrée. Sans ce changement, l'essai échoue.

## 10. La fiche d'une figurine, dans un salon : sa figurine comme dans Ma maison (25 novembre 2026)

**Le propriétaire** : « quand on clique sur une figurine dans le salon et que les options s'ouvrent, je veux qu'on voie
la figurine telle qu'elle a été faite dans Ma maison, avec pancarte s'il y en a une ». Avant, la fiche montrait une
petite image (64 points), sans sa tête du jour ni sa pancarte.

- **En haut de sa fiche, sa figurine en grand** (170 points ; `FigurineEnGrand`, `salon-ouvert.tsx`). Elle est comme au
  centre de sa maison (`docs/univers/ma-figurine.md`) :
  - sa tête du jour posée sur son corps ;
  - ce qu'elle porte toute seule (l'auréole, l'accessoire de sa passion, le cœur), cette fois avec leurs étiquettes
    (« 🔥 8 », « 🎁 offert par Léa ») ;
  - sa pancarte au-dessus ;
  - le halo qui brille et le souffle de Ma maison.
- **Dessous, rien ne change** : son prénom, « prénom et figurine seulement », ses passions, les gestes, « 👯 Ajouter en
  proche », sa maison, « Ne plus voir » et « Signaler ».
- **Une figurine de l'ancien style** (une seule image) : l'image en grand, sa pancarte et ses étiquettes.
- Dans un salon comme dans une séance chez un proche : la même fiche.
- Les données étaient déjà là (`PresentSalon.tete`, `pancarte`, `ornements`, posés par « Ma figurine », #282 et #283) :
  rien ne change côté serveur. Comme dans le salon, sa tête et sa pancarte sont celles qu'il avait en entrant.

**L'essai** : `scripts/navigateur/fiche-salon.mjs`. Sam a :

- sa tête du jour (il rit) et sa pancarte ;
- huit jours de suite ;
- le foot comme passion ;
- un cœur offert par Léa.

Il est au salon du foot. Léa le touche, et sa fiche montre sa figurine en grand avec sa tête du jour, sa pancarte,
l'auréole, l'écharpe, le cœur, leurs étiquettes et le halo. La pancarte tient dans la feuille, et l'étiquette du cœur ne
cache pas son prénom. Dessous restent les gestes et « Ajouter en proche », et un geste referme la fiche. (Le faux moteur
d'images rend des images transparentes : pour la capture, son corps et sa tête sont redessinés.)

## 11. Décidé aussi

- **Décidé par le propriétaire (25 novembre 2026) : l'appli s'ouvre sur le fil de Découvrir**, plus sur « Messages »
  (`ma-collection.tsx`, à l'ouverture sans adresse). Trois exceptions : pendant que sa figurine se fabrique, rien ne
  change ; l'appli tout juste posée sur l'écran d'accueil s'ouvre sur « Messages », pour proposer les notifications de
  ses proches (une fois ; « Plus tard » est retenu une semaine) ; un nouveau venu, sans figurine encore, arrive sur
  « Messages », où la bienvenue l'accueille. Les surprises des visites (un cadeau, un toc toc) se
  découvrent en ouvrant « Messages ». Essai : `scripts/navigateur/bascule-univers.mjs`.
