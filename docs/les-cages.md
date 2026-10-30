# 🔓 Les trois cages, à la fin du film d'un commerçant

> « Une belle vidéo, tout le monde sait en faire. Moi, je fais réagir. À la fin de votre vidéo, chacun libère
> son fantôme de sa cage. »

C'est l'étape 1 du passage de la démo (`outils/tour-du-fantome`) dans l'application ; l'étape 2 (le carnet au
comptoir), l'étape 3 (« Oui, préviens-les », Mike), l'étape 4 (le moteur de messages) et l'étape 5 (le ticket de
Mike) sont plus bas.

## Ce que voit l'habitant

À la fin du film d'un commerçant (son interview, sur un moment de sa journée), les trois cages remplacent
les trois avis « J'aime pas / Sympa / J'adore ». Chacune contient **son** fantôme :

| Cage | Ce qu'elle veut dire | Ce qui suit |
|---|---|---|
| J'adore la vidéo | il aime, il n'a rien promis | le commerçant le saura ; rien n'est demandé |
| Je viendrai un jour | il a envie, pas de date | « Vous voulez qu'il vous prévienne sur WhatsApp quand une table se libère ? » (facultatif) |
| Je réserve / Je passe aujourd'hui | c'est décidé | la réservation du moment, ou « Demandez à… » sur WhatsApp |

« Je réserve » pour les restaurants, bars, coiffeurs et ongleries ; « Je passe » ailleurs. Le fantôme et le
prénom ne sont demandés que s'ils n'ont jamais été donnés (les mêmes questions que partout dans l'application).
Le numéro n'est demandé qu'avec « un jour » : c'est le commerçant qui écrira, depuis **son** WhatsApp, jamais
ClikMe. « Aujourd'hui » n'en a pas besoin : c'est l'habitant qui le prévient, et le commerçant a son numéro par
le message.

## Où c'est

- `src/lib/direct/cages.ts` : les trois cages, leurs libellés par métier, le numéro nettoyé (format `wa.me`).
- `src/app/autour-de-moi/cages-fantomes.tsx` : les cages dessinées, le fantôme qui s'envole, la question WhatsApp.
- `src/app/autour-de-moi/apercu-habitant.tsx` : `donnerCage`, `whatsappCage`, `aujourdhuiCage` ; le choix est gardé
  dans le téléphone (`clikme-cages-v1`) et, chez un vrai commerçant (`/ville/<ville>`), envoyé à la route.
  L'application de démonstration (`/autour-de-moi`) ne garde que dans le téléphone.
- `src/app/api/direct/cage/route.ts` : la route. Le film doit être celui du commerce.
- `supabase/migrations/20261026090000_clik_cages.sql` : `clik_cage` (une cage par personne et par film, avec son
  prénom et son fantôme) et `clik_contact` (son numéro et son accord, ou son stop, pour ce commerce).

## 📒 Le carnet, au comptoir (étape 2)

Le commerçant voit qui a libéré son fantôme à la fin de ses vidéos. Sur l'accueil du comptoir, sous « Publier une
annonce », la carte **Mon carnet** : quelques fantômes, et combien dans chaque cage (« 3 aujourd'hui · 4 un jour ·
5 j'adore », en rose quand quelqu'un a dit « aujourd'hui »). Un appui ouvre le carnet, en trois groupes (les mots des
cages) :

- une ligne par personne : son fantôme, son prénom (« Sans prénom » s'il n'en a pas donné), depuis quand, combien
  de vidéos elle a vues jusqu'au bout. La cage montrée est celle qu'elle a libérée **en dernier** ;
- « 📲 À prévenir sur WhatsApp » si elle a laissé son numéro — le numéro lui-même n'arrive jamais au comptoir ;
- **Passage aujourd'hui** : elle est venue. Un passage par jour ; un second appui l'enlève ;
- **A dit stop** (seulement pour celles à prévenir) : elle a répondu stop sur WhatsApp. Après confirmation, son
  numéro est effacé ; seule elle peut redire oui, en le laissant à nouveau à la fin d'une vidéo.

La démonstration (`/autour-de-moi/assistante`) a un carnet de prénoms inventés, et ses gestes restent dans le
téléphone. Un vrai commerçant (son lien pro `/p/…`) lit le sien en base.

- `src/lib/direct/carnet.ts` : la ligne du carnet, les groupes, les chiffres de la carte, le carnet inventé.
- `src/app/autour-de-moi/assistante/carnet-comptoir.tsx` : `useCarnet`, la carte de l'accueil, l'écran.
- `src/app/api/site-internet/pro/carnet/route.ts` : `lire`, `passage`, `stop` (jeton pro).
- `supabase/migrations/20261027090000_clik_visites.sql` : `clik_visite`, un passage par personne et par jour.

## 📲 « Oui, préviens-les » : Mike (étape 3)

Mike, l'assistant du comptoir (le fantôme du métier, comme dans les tours), propose ; le commerçant dit oui ; les
messages partent de **son** WhatsApp, à ceux qui ont demandé à être prévenus, et à eux seuls.

- **En haut de l'accueil**, la carte de Mike : « 3 personnes attendent ton signal. Une table libre aujourd'hui ? Je
  les préviens sur ton WhatsApp. » — « Oui, préviens-les » ou « Pas aujourd'hui » (elle revient demain). Elle ne se
  montre que s'il y a quelqu'un à prévenir aujourd'hui, et entre 9 h et 20 h 30. Le carnet la propose aussi.
- **L'écran** : il dit ce qui est vrai aujourd'hui — quand (ce midi, ce soir, demain… et l'heure s'il veut), combien
  de places ou de créneaux s'il le sait, un petit plus s'il en veut un (« Rien, juste prévenir » par défaut), tu ou
  vous (gardé ; tu par défaut, comme le carnet de messages). Mike écrit un message par personne ; il se relit et se
  change. « Envoyer à Manon » ouvre WhatsApp sur sa conversation, le message prêt : il n'a qu'à toucher Envoyer.
- **Le premier message** dit qui écrit et pourquoi (« Bonjour Manon, c'est La Table de Margot ! Tu nous as demandé de
  te prévenir à la fin de notre vidéo : c'est le moment 😊 ») ; les suivants vont droit au fait. Une seule question,
  à la fin.
- **Les règles du carnet de messages** (`src/lib/direct/previens-les.ts`, revérifiées par la route) : deux messages
  par semaine au plus et pas deux le même jour ; rien avant 9 h ni après 20 h 30 ; un petit plus au plus un message
  sur cinq, jamais deux fois le même à la même personne ; jamais d'alcool offert (loi Évin) ; les places, c'est lui
  qui les donne, ou on n'en parle pas.

La démonstration n'a pas de numéros (prénoms inventés) : « Envoyer » montre le message parti, rien ne s'ouvre.

- `src/lib/direct/previens-les.ts` : les « quand », les petits plus par métier, les règles, le message.
- `src/app/autour-de-moi/assistante/previens-les.tsx` : la carte de Mike et l'écran.
- La route du carnet : `numeros` (les numéros de ceux qui veulent être prévenus, lus seulement à l'ouverture de
  l'écran) et `envoye` (le message envoyé, gardé après avoir revérifié les règles).
- `supabase/migrations/20261028090000_clik_messages.sql` : `clik_message`, les messages envoyés et leur petit plus.

## 💬 Le moteur de messages (étape 4)

Le carnet de messages du fantôme (trente messages, cinq règles) devient des modèles pour tous les métiers
(`src/lib/direct/moteur-messages.ts`). Pour chaque personne du carnet, selon sa cage, le moment et ce qu'on sait
d'elle, Mike propose **un** message — ou se tait, et dit pourquoi :

| Situation | Message de Mike | Ses réponses |
|---|---|---|
| Premier message, « J'adore » | « Merci Camille ! Margot a vu passer ton fantôme : ça fait plaisir. Toi, plutôt viande ou poisson ? » (la question change selon le métier) | Viande · Poisson |
| Premier message, « Un jour » | « Merci ! Tu nous as promis de venir un jour 😊 Je te fais signe dès qu'une table se libère. Plutôt en semaine ou le week-end ? » | En semaine · Le week-end |
| Elle a répondu | « Noté : poisson ! Je le dis à Margot. Je te fais signe quand il y a du nouveau de ce côté-là ? » | Oui ! · Pas besoin |
| Trois de ses vidéos aimées, pas venue | l'invitation douce, « l'envers du décor » | Avec plaisir · Peut-être |
| « Un jour », un mois après | « Ton fantôme s'impatiente ! » | Un midi · Un dîner |
| « Aujourd'hui », pas venue après deux jours | « Pas de souci… je te garde une place une prochaine fois ? » | Oui, bientôt · Plus tard |
| Après une visite | « Merci pour ta visite ! Alors, verdict ? » ; à la troisième, « tu fais partie de la maison » | |
| Deux messages sans réponse | la porte ouverte, une fois | J'ai envie |

Il se tait : après un stop (définitif) ; deux messages par semaine au plus, pas deux le même jour ; un message
sans réponse → rien d'autre dans la semaine ; trois sans réponse → plus rien jusqu'à son prochain fantôme ;
« aujourd'hui » → rien avant sa visite. Jamais deux fois le même modèle, jamais d'offre ici (le petit plus, c'est
« Oui, préviens-les »). Ces règles valent aussi pour les invitations WhatsApp de l'étape 3.

- **Au comptoir**, la carte de Mike dit aussi « J'ai préparé 10 messages pour ton carnet » → l'écran « Les messages de
  Mike » (`messages-de-mike.tsx`) : chaque message se relit et se change, avec ses réponses à toucher ; « Oui,
  envoie », « Pas celui-là » (de côté pour aujourd'hui), ou « Oui, envoie les N ». En bas, ceux à qui Mike ne dit
  rien, avec la raison. Tu ou vous : le même choix que « Oui, préviens-les ». Le carnet le propose aussi.
- **Dans le carnet**, « 💬 A répondu : Poisson » ; et pour un message WhatsApp, « A répondu sur WhatsApp » (ClikMe
  ne lit pas son WhatsApp : c'est ce qui remet le silence à zéro).
- **Chez l'habitant**, dans Ma Maison, « 💬 Mes messages » (`mes-messages.tsx`) : le visage du fantôme du commerce,
  son nom, le message, ses réponses d'un appui (une fois) ; « Ne plus recevoir ses messages » (plus rien de ce
  commerce, ni ici ni sur WhatsApp) et « Reprendre ». Rien quand il n'y a pas de message. Une pastille rose sur
  l'onglet Ma Maison compte les messages qui attendent sa réponse (avant celles des surprises et des favoris) ;
  elle s'éteint dès qu'il répond.
- **La démonstration** : au comptoir, le carnet inventé a un historique (Chloé a répondu « Poisson », Louis deux
  fois sans réponse, Emma attend…). Dans l'appli des habitants (`/autour-de-moi`), libérer son fantôme à la fin du
  film d'un commerce de la démonstration dépose dans Ma Maison le message que Mike aurait proposé
  (`messages-maison.ts`) — jamais pour un vrai commerçant.
- Les routes : celle du carnet (`maison`, `repondu`) et `src/app/api/direct/messages/route.ts` (l'habitant : lire,
  répondre, stop, reprendre). La migration `supabase/migrations/20261029090000_clik_messages_maison.sql` ajoute à
  `clik_message` le canal, le modèle, les réponses proposées et la réponse.

## 🧾 Le ticket de Mike (étape 5)

Le ticket de « Plus de clients » des tours (« Grâce à vos promesses : +4 tables un midi calme »), au comptoir, avec ce
que ClikMe sait vraiment des **sept derniers jours** — rien d'inventé ni d'estimé (`src/lib/direct/ticket-mike.ts`) :

- 👻 les fantômes libérés à la fin de ses vidéos, cage par cage ;
- 🚶 les personnes venues (les passages qu'il a notés dans son carnet) ;
- 📲 « Grâce à tes promesses » : celles venues le jour même ou le lendemain d'une invitation « Oui, préviens-les » —
  « +3 tables un jour calme » (« +3 rendez-vous », « +3 clients » selon le métier) ; la ligne n'apparaît que s'il y
  en a ;
- 💬 les messages de Mike envoyés, et les réponses ;
- 👁 les vues de sa page (les chiffres du comptoir) ; 🤝 la commission ClikMe : 0 €, toujours.

Sur l'accueil, sous « Mon carnet », la carte « Ce que Mike a fait pour toi » (« 3 venus · 11 fantômes libérés · cette
semaine »), avec un point rose tant qu'il ne l'a pas ouverte depuis sept jours ; rien quand ses deux semaines sont
vides. La feuille montre « Cette semaine » et « La semaine d'avant », et mène au carnet. La démonstration calcule son
ticket sur le carnet inventé (Nathan, venu le lendemain de son invitation : « +1 table un jour calme »). Un vrai
commerçant le lit par la route du carnet (`ticket`) — aucune table de plus.

- `src/app/autour-de-moi/assistante/ticket-mike.tsx` : la carte et la feuille.

## 🏪 La vitrine du commerce (prototype « Les trois fantômes », étape 1)

La scène du prototype (`outils/trois-fantomes`) dans l'application : la façade dessinée, l'enseigne à son nom, le
store, la vitrine sur sa salle (sa photo), le carnet, la porte et son fantôme qui salue, le trottoir. Les fantômes
libérés à la fin de ses vidéos s'y posent (`src/lib/direct/vitrine-fantomes.ts`, `src/app/autour-de-moi/vitrine-fantomes.tsx`) :

- « J'adore la vidéo » sur le trottoir (ils sautillent), « Je viendrai un jour » à la porte (leurs prénoms s'écrivent au
  carnet de la façade), « Aujourd'hui » à table derrière la vitre. Les sept derniers jours, une place par personne
  (sa dernière cage) ; ceux qui ne tiennent pas font le « +N ».
- Son propre fantôme au premier rang, sur un halo rose, « Vous · Rose ». Un fantôme touché dit son prénom, son geste
  et quand (« Tom · 🍽️ a réservé aujourd'hui · à l'instant »).
- **Les prénoms** (décision du 26 octobre) : visibles, et chacun peut cacher le sien — « Cacher mon prénom » sous la
  vitrine (c'est dit : « Ton fantôme et ton prénom sont dans cette vitrine »), et « Mon prénom dans les vitrines »
  dans les réglages de Ma Maison. Caché, il reste son fantôme et son geste ; lui seul voit encore son prénom.
- **L'ardoise**, sous la vitrine : l'info du moment que le commerçant écrit au comptoir (90 signes), le jour même
  seulement. Dans la démonstration, l'ardoise dit le moment en cours (« En ce moment : Le service du midi »).

Où : dans l'appli des habitants, sous les cages, dès qu'il a libéré son fantôme ; au comptoir, en haut du carnet
(« Ta vitrine, cette semaine », où il voit tous les prénoms, et écrit son ardoise). La démonstration remplit la
vitrine d'un commerce inventé d'une foule inventée (jamais pour un vrai commerçant).

- `src/app/api/direct/vitrine/route.ts` : la vitrine d'un commerce (jamais l'identifiant d'une personne), son
  réglage ; l'ardoise par la route du carnet (`ardoise`).
- `supabase/migrations/20261030090000_clik_vitrine.sql` : `clik_ardoise`, et `human_habitants.prenom_vitrine`.

## 💌 Les petits mots (prototype « Les trois fantômes », étape 2)

Sous la vitrine d'un commerce où il a libéré son fantôme, l'habitant écrit un petit mot au commerçant — un par
jour —, ou en choisit un dans la liste (gentils par construction, un peu de son métier : `src/lib/direct/petits-mots.ts`).
Le commerçant les lit tous au comptoir, dans « Vos petits mots » (une carte sur l'accueil, « 2 nouveaux ») :

- **💛 Coup de cœur** : le mot passe dans sa vitrine — sous l'ardoise (« Le coup de cœur de la maison »), et son
  auteur porte un 💛. Il peut le retirer.
- **🎁 Offrir…** : un petit quelque chose (« le dessert », ses suggestions selon le métier, ou ce qu'il écrit) —
  jamais d'alcool (loi Évin), un cadeau par mot. L'habitant le trouve dans Ma Maison : « Ton mot m'a fait chaud au
  cœur. Le dessert est pour moi. Montre ce message au comptoir. » C'est une surprise : rien n'est promis. En haut
  de l'écran, ce qu'il a offert ce mois-ci.
- **La modération, c'est lui** : un mot écrit ne se voit dans la vitrine qu'après son 💛 ; un mot de la liste s'y
  voit tout de suite. Touché, un fantôme montre son mot dans sa bulle.

La démonstration : au comptoir, quatre mots inventés (Camille a écrit, Chloé a déjà eu le café) ; dans l'appli
des habitants, la foule inventée porte des mots de la liste, et son propre mot reste dans le téléphone.

- `src/app/api/direct/mot/route.ts` : écrire (un par jour, seulement avec son fantôme chez ce commerce).
- La route du carnet : `mots`, `coeur`, `offrir` ; la vitrine (`api/direct/vitrine`) montre les mots visibles et
  le coup de cœur ; `api/direct/messages` rend à l'habitant les 💛 et les cadeaux (`reponses`).
- `src/app/autour-de-moi/assistante/petits-mots.tsx` : la carte et l'écran du comptoir.
- `supabase/migrations/20261031090000_clik_mots.sql` : `clik_mot`.

## 🧵 Les écussons (prototype « Les trois fantômes », étape 3)

Brodés, cousus sur le bas du corps de son fantôme : ils se voient dans toutes les vitrines, et la bulle de qui le
touche les nomme. Trois, qu'on peut gagner aujourd'hui (`src/lib/direct/ecussons.ts`) :

- **🤝 Parole de fantôme** : il a promis de venir (« Je viendrai un jour » ou « aujourd'hui »), puis le commerçant a
  noté son passage au carnet — le jour même ou après, jamais avant la promesse.
- **📍 Le pin du commerce** : un par commerce où il a tenu parole. Dans la vitrine de ce commerce, son fantôme porte
  son pin (« Pin de la maison ») ; ailleurs, seulement la parole.
- **💛 Coup de cœur** : un de ses petits mots a eu le 💛 d'un commerçant (ou un cadeau).

« Ambassadeur » viendra avec le partage, « Bon conseil » avec les conseils : on ne montre pas un écusson qu'on ne
peut pas gagner. Dans Ma Maison, « 🧵 Mes écussons » : son fantôme en grand avec ses écussons, puis les trois —
gagnés en couleur, avec les commerces ; les autres en pointillés, avec la façon de les gagner. Un écusson tout neuf
se coud sous ses yeux, une fois (le téléphone retient ceux qu'il a vus).

La démonstration : dans l'appli des habitants, la foule inventée porte des écussons ; dans Ma Maison, tout est en
pointillés (personne n'a noté son passage, et c'est vrai). Au comptoir, sa vitrine coud la parole et le pin à qui
a promis puis est passé, d'après son carnet.

- La vitrine (`api/direct/vitrine`) calcule les écussons de chaque fantôme ; `api/direct/ecussons` rend à
  l'habitant ses pins et ses coups de cœur (les commerces), pour Ma Maison.
- `src/app/autour-de-moi/mes-ecussons.tsx` : Ma Maison ; `Ecussons` dans `vitrine-fantomes.tsx` : la broderie.
- **Aucune nouvelle table** : tout vient des cages, des passages et des petits mots.

## 👻 La famille d'un commerce : sa page publique `clikme.fr/f/<lien>` (chantier 1)

« Rejoins ma famille de fantômes ! Tu m'aides à me faire connaître, je te gâte ! » : la fin de sa vidéo du jour,
le lien de sa bio et le QR de son comptoir mènent ici. Sans compte et sans appli :

- **L'accueil** : sa vidéo (son annonce en cours, sinon sa dernière publication filmée ; sinon sa photo, sinon son
  fantôme qui salue), la foule d'aujourd'hui, le record à battre (« Plus que 4 pour battre le record »), et les
  trois cages avec son fantôme à soi. La famille encore vide : « Sois le tout premier fantôme de… ».
- **La fiche**, à la première cage : son fantôme (touche pour changer), son prénom, son petit mot s'il veut (la
  liste du métier, ou le sien). « Entrer dans la famille ». Qui est déjà de la famille n'a rien à retaper.
- **La famille** : « Tu es le fantôme n°48 de… » (l'ordre d'arrivée : sa première cage ici), son écusson bronze,
  argent ou or cousu à son numéro, ce qui le fait monter, la vitrine (« Toi · Camille », les fantômes, leurs petits
  mots), « 💬 Mes bons plans sur WhatsApp » vers le numéro de ClikMe (le message pour Mike est déjà écrit), et
  « 📣 Il en manque 3 : inviter un ami » — son lien porte son code (`?de=`). Revenir le même jour rouvre sa famille.

**Les paliers sont dans `PALIERS`, et seulement là** (`src/lib/direct/famille.ts`) : une condition suffit.
Aujourd'hui, argent = 1 visite notée au comptoir **ou** 7 jours de cage ; or = 5 visites **ou** 3 amis amenés.
Changer un chiffre change la page et la route à la fois.

- **Seulement pour un commerce client** (`est_client`) : on n'invite personne dans la famille d'un prospect, et la
  page elle-même ne sert de « film » (`FILM_PAGE`) qu'à un client.
- La foule du jour : une ligne par personne, par commerce et par jour (`clik_presence`), écrite par la route des
  cages. Le record à battre : le plus grand jour d'avant. Qui l'a amené : posé son premier jour seulement.
- Le bouton WhatsApp ne paraît que si le numéro de ClikMe est réglé : variable `CLIKME_WHATSAPP` sur Vercel
  (« +33 6 … »). Sans elle, il reste l'invitation.
- `src/app/f/[slug]/page.tsx` (le chargement) et `famille.tsx` (le dessin) ; `api/direct/famille` (la foule, le
  record, son numéro, son écusson) ; `src/lib/direct/famille-serveur.ts`.
- `supabase/migrations/20261101090000_clik_famille.sql` : `clik_presence`.

**La famille partout (chantier 2)** :

- **Dans toutes les vitrines** (la page de la famille, l'appli, le comptoir), chaque fantôme porte son écusson de
  la famille : la couleur de son palier, cousue à son numéro. Sa bulle dit « Fantôme n°12 · 🥈 Argent ». La foule
  inventée de la démonstration a les siens. Les écussons d'avant (parole, pin, coup de cœur) restent.
- **Son palier monte** (une visite notée au comptoir, son 7ᵉ jour de cage, son 3ᵉ ami) : à sa prochaine visite de
  la page, « 🥈 Tu passes Argent ! Tu as les bons plans plus tôt. », et l'écusson se recoud. Une fois : le
  téléphone retient le dernier palier vu.
- **« 👻 Mes familles » dans Ma Maison** (vraie ville seulement) : chaque commerce où il a libéré son fantôme, son
  numéro, son palier, ce qui le fera monter, et un lien vers sa page pour revenir ouvrir la cage du jour.
- **Les prénoms** (`src/lib/direct/prenom.ts`) : des lettres seulement, pas de lien, pas de gros mot (cherchés mot à
  mot : « Constance » passe). La page le dit avant d'envoyer ; la route des cages, elle, garde la cage sans le
  prénom, pour ne jamais bloquer l'appli.
- Une seule lecture de la famille d'un commerce (`lireFamille`) sert à la page, à la vitrine et à Ma Maison.

**Au comptoir : « Ma famille » (chantier 3a)** :

- **En tête de l'accueil**, la carte « 👻 Ma famille » : « Aujourd'hui 3 · record 5 », une jauge, « +2 nouveaux · Plus
  que 3 pour le record » (ou « 🎉 Record battu ! »).
- **L'écran « Ma famille »** : la foule du jour, hier, les nouveaux, le total ; son lien `clikme.fr/f/<lien>` à copier
  (« Voir ma page » l'ouvre avec `?moi=1`, qui ne compte pas) ; combien en or, en argent, en bronze, la règle des
  paliers (écrite depuis `PALIERS`) et ses fidèles par leur prénom ; son parcours des sept derniers jours : sa page
  ouverte → un fantôme libéré → venus pour de vrai, en pourcentages (WhatsApp s'y ajoutera au chantier 4).
- **📌 Le mot du jour** : il épingle un des petits mots d'aujourd'hui ou d'hier ; il s'affiche en haut de sa page
  publique, avec le prénom (s'il n'est pas caché) et le numéro de son auteur. Un par jour.
- **Le carnet** montre le numéro et le palier de chacun (« Léa n°1 🥇 »).
- `src/app/autour-de-moi/assistante/famille-comptoir.tsx` ; `api/site-internet/pro/famille` (« lire », « epingler ») ;
  `familleAuComptoir`, `motDuJour`, `epinglerMot` dans `famille-serveur.ts`.
- `supabase/migrations/20261102090000_clik_famille_comptoir.sql` : le compteur `famille` (les ouvertures de sa page)
  et `clik_mot.epingle_le`.

**Ce que les paliers apportent pour de vrai (chantier 3b)** :

- **🔔 Le bon plan** (« Il me reste des tables ») : il l'écrit dans « Ma famille » (une idée de son métier, ou le
  sien, 90 signes), pour 1 heure, 3 heures ou jusqu'à ce soir. Sur sa page, **ses fantômes d'or le voient tout de
  suite, l'argent 20 minutes après, le bronze 40 minutes après** (`OUVERTURE_BON_PLAN` dans `famille.ts`, aussi
  facile à changer que les paliers). **Le serveur ne donne le texte qu'à l'heure de chacun** : avant, « 🔒 le tien
  s'ouvre à 12 h 45 », et la page se relit à cette heure-là ; à qui n'est pas de la famille, « ouvre une cage pour
  l'avoir ». Un seul en cours : un nouveau remplace l'ancien ; « C'est complet » le retire. Jamais de promotion
  d'alcool (loi Évin). Bientôt aussi sur WhatsApp, dans le même ordre (chantier 4).
- **🎁 Je te gâte** : ce qu'il peut offrir à sa famille ce mois-ci (« 10 × le café »). Il l'offre sur leurs petits
  mots (🎁 Offrir…, qui le propose en premier) ; au-delà, la route refuse (« tu as offert tes 10 × le café »). Sa page
  dit « encore 7 × le café à offrir : un petit mot peut te le faire gagner », tant qu'il en reste. Jamais d'alcool.
- `api/site-internet/pro/famille` (« bon-plan », « bon-plan-retirer », « gate ») ; la route publique de la famille
  rend le bon plan à l'heure de son palier, et ce qui reste à offrir ; la route du carnet compte les cadeaux.
- `supabase/migrations/20261103090000_clik_bons_plans.sql` : `clik_bon_plan` et `clik_gate`.

**🚀 Son départ (chantier 6)** : trois chemins mènent à sa famille, et le comptoir les lui fait faire un par un, dans
« Ma famille » :

1. **Son lien en premier dans sa bio** (`clikme.fr/f/<lien>`, à copier), avec « Comment, réseau par réseau ? »
   (Instagram, Facebook, TikTok, WhatsApp Business, Google).
2. **Son carton QR sur son comptoir** : `/f/<lien>/carton`, à imprimer en carton de comptoir (A6) ou en affiche de
   vitrine (A5) — son nom, son fantôme qui salue, « Ses fantômes ont les bons plans en premier », le QR de sa page.
   Seulement pour un commerce client, comme sa page.
3. **Le dire à la fin de ses vidéos** : « Rejoins ma famille de fantômes : le lien est dans ma bio ! »

Chaque geste se coche (ce téléphone le retient) ; tant que ce n'est pas fini, la carte « Ma famille » de l'accueil
dit « 🚀 Ton départ : 1/3 ». Ensuite, son lien reste en petit, avec son carton et sa page. Pas de migration.

**🎁 La surprise du chef** : le commerçant écrit ses surprises du jour au comptoir, dans « Ma famille » (« 4 × Une
table de 11 h à 11 h 30 à −25 % », « 4 × Le café offert »…, six au plus, de 1 à 50 chacune, jamais d'alcool). Sur sa
page `/f/<lien>`, sa famille a une cage dorée : l'ouvrir tire une surprise au hasard parmi celles qui restent (une par
personne et par jour, gardée : rouvrir ne la change pas) ; « Je prends ça » la lui donne et en retire une du stock
(jamais deux fois la dernière) ; « Non merci » la laisse aux autres, sans autre tirage ce jour-là ; une fois prise, c'est **un bon** : un code de quatre signes et un QR, l'heure qui défile et un
reflet qui passe (une capture d'écran ne passe pas), valable aujourd'hui ; le commerçant le scanne avec l'appareil photo
(`/f/<lien>/bon/<code>` : sur son téléphone, reconnu par son comptoir, « Servie » d'un geste ; ailleurs, rien du bon),
ou touche « Servie » dans sa liste au comptoir. **Servie = une venue** (`clik_visite`) : son palier, et un client amené ; plus de stock, « Toutes les surprises du jour sont parties ». Pas de priorité de
palier : le premier qui ouvre tire. Le comptoir voit qui a pris quoi (prénom, numéro). `surprisesDuJour`,
`fixerSurprises`, `ouvrirSurprise`, `prendreSurprise`, `surprisesPrises` (`famille-serveur.ts`) ; « surprises » et
« surprises-lire » (route du comptoir) ; « surprise-ouvrir » et « surprise-prendre » (`api/direct/famille`).
`supabase/migrations/20261105090000_clik_surprises.sql`.

**🎬 La famille dans toutes ses vidéos (chantier 5)** : le film photo du reporter, l'interview et l'épisode
s'ouvrent et se ferment pareil, sans rien à choisir (`src/lib/direct/famille-video.ts`) :

- **Le début : le produit d'abord.** La vidéo s'ouvre directement sur ses images ; l'invitation est un **bandeau
  rose par-dessus** pendant les 3 premières secondes (`BANDEAU_FAMILLE`, `dessinerBandeauFamille`) : son fantôme,
  « Rejoins ma famille de fantômes ! » et « Je te gâte : lien dans ma bio ». Plus d'écran d'ouverture
  (`OUVERTURE_FAMILLE = 0`, l'ancienne carte reste dans le code si on veut y revenir).
- **La fin** (4,8 s, `FIN_FAMILLE`), après la carte postale : « La famille d'hier · 23 fantômes · Record : 29 » (ou
  « Record battu ! ») ; ses fantômes, chacun avec la couleur de son palier ; un qui s'avance avec son petit mot, son
  prénom et son numéro ; puis les trois cages, « Libère ton fantôme », « Lien dans ma bio » et son lien. Hier vide :
  la famille de la semaine. Famille encore vide : son fantôme invite à être le tout premier.
- **🎞️ Le Reel du jour (~9 s)**, monté tout seul juste après l'interview, des mêmes prises (`reel-du-jour.ts` pour
  les règles, `reel-dessin.ts` pour l'image, `reel-montage.ts` pour l'enregistrement) : l'accroche (la photo de son
  plat qui arrive de près, son plat en géant, son prix) ; **une phrase qu'il a dite**, avec sa voix et ses mots qui
  s'allument (`phraseDuReel` : celle qui nomme son plat ou son prix d'abord, jamais une phrase où il hésite, jamais
  écrite à sa place ; sans son, le Reel se fait sur sa photo) ; puis **la cage dorée** qui tombe, tremble et se
  soulève sur un cadeau : « 3 surprises du chef · aujourd'hui · une par personne » — **le vrai stock** du jour
  (`FamilleVideo.surprises`, ce qu'il reste) ; sans surprise aujourd'hui, pas de cage ni de chiffre : son fantôme
  et « Rejoins ma famille ». Le chemin : « Lien dans ma bio » (« Écris FANTÔME en commentaire » seulement quand
  l'envoi automatique du lien en message privé sera branché sur son compte : `motCle`, pas encore utilisé).
  Seulement avec sa famille (commerce client ou démonstration). « Publier partout » : l'interview dans Le Direct et
  sur sa page, **le Reel sur ses réseaux** (`videoReseaux`) ; s'il n'a pas pu partir, ses réseaux prennent
  l'interview, comme avant.
- **« Envoie ça à… »** dans la légende Instagram et Facebook de toutes ses publications (`ligneDEnvoi`) : « Envoie ça
  à la personne avec qui tu viens ce midi 👇 » (ce soir après 15 h) au restaurant et au bar, « Envoie ça à
  quelqu'un qui va adorer 👇 » ailleurs. Jamais sur Google.
- **Le prénom ne passe jamais sans son accord** : la vidéo part sur ses réseaux, bien plus public que sa page. Le
  fantôme y est toujours (sans rien qui dise qui c'est) ; le prénom, le numéro et le petit mot seulement pour qui a
  coché, sur la fiche de la page, « Mon prénom et mon petit mot peuvent apparaître dans ses vidéos » (une case jamais
  cochée d'avance), et dont le prénom n'est pas caché partout. Le mot, seulement s'il est déjà public (de la liste,
  avec son 💛, ou épinglé). On change d'avis sur sa page : « Retirer mon prénom » / « Montrer mon prénom ».
- Seulement pour un commerce client (`est_client`) : sans lui, ses vidéos se montent comme avant. Une démonstration
  a sa famille inventée (`familleVideoDemo`). Si la famille ne vient pas, la vidéo se monte sans elle.
- `api/site-internet/pro/famille` (« video », `familleDeLaVideo`) ; `api/direct/famille` (POST « video » : l'accord) ;
  `api/direct/cage` (`video`, depuis la fiche) ; `reporter-film.ts`, `interview-montage.ts`, `episode-montage.ts`.
- `supabase/migrations/20261104090000_clik_accord_video.sql` : `clik_accord`.

## L'activer en production

**Les deux tables doivent être créées une fois** : coller le contenu de
`supabase/migrations/20261026090000_clik_cages.sql` dans Supabase → SQL Editor → Run. Il se rejoue sans casser.
Tant que ce n'est pas fait, les cages s'affichent et se gardent dans le téléphone, mais rien n'arrive chez le
commerçant ; un numéro donné reçoit « Ce n'est pas encore possible chez ce commerçant. Réessayez plus tard. »

**Le carnet demande en plus** `supabase/migrations/20261027090000_clik_visites.sql` (les passages), et « Oui,
préviens-les » `supabase/migrations/20261028090000_clik_messages.sql` (les messages envoyés), à coller de la même
façon. Sans la seconde, « Envoyer » ouvre bien WhatsApp, mais répond « Les messages ne sont pas encore activés. »
Le moteur de messages demande enfin `supabase/migrations/20261029090000_clik_messages_maison.sql` (après celle des
messages) ; sans elle, « Oui, envoie » répond « Les messages dans Ma Maison ne sont pas encore activés. »
La vitrine demande `supabase/migrations/20261030090000_clik_vitrine.sql` (l'ardoise et le réglage du prénom) ; sans
elle, la vitrine s'affiche, mais l'ardoise répond « L'ardoise n'est pas encore activée » et le prénom ne se cache pas.
Les petits mots demandent `supabase/migrations/20261031090000_clik_mots.sql` ; sans elle, « Envoyer » répond « Les
petits mots ne sont pas encore activés » et la carte du comptoir ne paraît pas. Sans les cages, la carte dit « Bientôt, à la fin de tes vidéos » ; sans les passages, le carnet
s'affiche mais « Passage aujourd'hui » répond « Les passages ne sont pas encore activés. »
La famille demande `supabase/migrations/20261101090000_clik_famille.sql` (la foule du jour) ; sans elle, la page
`/f/<lien>` marche (les cages se gardent, le numéro et l'écusson se voient), mais la foule se compte d'après les
cages du jour, le record ne paraît pas, et ni les jours de cage ni les amis amenés ne comptent pour les paliers.
Le comptoir de la famille demande ensuite `supabase/migrations/20261102090000_clik_famille_comptoir.sql` (après
celle des compteurs de diffusion et celle des petits mots) ; sans elle, « Ma famille » s'affiche, mais « Ont ouvert
ta page » dit « Pas encore mesuré » et le mot du jour « arrive bientôt ».
Les bons plans et « Je te gâte » demandent `supabase/migrations/20261103090000_clik_bons_plans.sql` ; sans elle, « Ma
famille » dit « Les bons plans arrivent bientôt », et les cadeaux des petits mots restent sans limite.
L'accord pour les vidéos demande `supabase/migrations/20261104090000_clik_accord_video.sql` ; sans elle, personne n'a
donné son accord : les vidéos montrent les fantômes sans prénom, et « Montrer mon prénom » répond « Ce choix n'est pas
encore possible. »
La surprise du chef demande `supabase/migrations/20261105090000_clik_surprises.sql` ; sans elle, la cage dorée ne
paraît pas et le comptoir n'en parle pas.

## Vérifier

- `node scripts/essai-cages-route.mjs` (lancé aussi par la CI, dans `scripts/navigateur/lancer-essais.sh`) : la
  route contre le faux Supabase.
- `node scripts/essai-carnet-route.mjs` (CI aussi) : le carnet, ses passages, le stop, et « Oui, préviens-les »
  (les numéros, le message gardé, les règles), et le moteur de messages (Ma Maison, la réponse, le stop, « A
  répondu », le silence) et le ticket de Mike, contre le faux Supabase. Hors de 9 h – 20 h 30, il vérifie le refus.
- `node scripts/essai-vitrine-route.mjs` (CI aussi) : la vitrine, les prénoms cachés, « Vous », l'ardoise du jour, et
  les petits mots (un par jour, la modération, le 💛, offrir sans alcool, les réponses dans Ma Maison), et les
  écussons (la parole tenue, jamais avant la promesse ; le pin seulement chez ce commerce ; le coup de cœur ; Ma
  Maison de chacun ; un numéro d'écran qui ne bouge pas quand un autre arrive).
- `node scripts/essai-famille-route.mjs` (CI aussi) : la foule du jour, une fois par jour ; le numéro ; l'ami amené
  (le premier jour seulement) ; le record d'avant ; les paliers ; jamais pour un prospect ; la page ; le numéro et
  le palier dans la vitrine ; Mes familles ; les prénoms refusés.
- `node scripts/navigateur/famille-comptoir.mjs` (CI aussi) : la route du comptoir (la foule, les paliers, les
  fidèles, le parcours, épingler, « Je te gâte » et sa limite, le bon plan palier par palier) puis l'écran « Ma
  famille », le carnet, ses petits mots, et sur la page le mot du jour, le bon plan fermé et ce qui reste à offrir ;
  son carton QR (A6, A5, le QR de sa page) et les trois gestes de son départ.
- `node scripts/navigateur/famille-video.mjs` (CI aussi) : l'accord (la case jamais cochée d'avance, changer d'avis),
  la route « video » (le prénom et le mot seulement avec l'accord, jamais d'identifiant, la semaine, jamais pour un
  prospect), puis le début et la fin dessinés image par image (ce qui s'écrit, rien de ce qui ne doit pas s'écrire).
  Les montages complets ne s'y jouent pas : il y faut des photos, une caméra et une voix.
- `node scripts/navigateur/famille-surprise.mjs` (CI aussi) : la surprise du chef — jamais d'alcool, une par
  personne, rouvrir ne change rien, la dernière ne part qu'une fois, plus de stock ; la cage dorée dans un téléphone
  et la saisie au comptoir.
- `node scripts/navigateur/famille-page.mjs` (CI aussi) : la page dans un téléphone, de l'accueil à la famille, le
  retour le même jour, l'ami venu par le lien, « Tu passes Argent », les écussons de la vitrine, la famille vide.
- Le carnet dans le navigateur : `/autour-de-moi/assistante?metier=table`, la carte « Mon carnet ».
- Dans le navigateur : `/autour-de-moi`, Restaurants, Chez Bergine, « Voir toutes les offres + infos », le film
  « En cuisine, pendant le service » jusqu'au bout.
