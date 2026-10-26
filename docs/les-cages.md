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
  vitrine (c'est dit : « Ton fantôme et ton prénom sont dans la vitrine de… »), et « Mon prénom dans les vitrines »
  dans les réglages de Ma Maison. Caché, il reste son fantôme et son geste ; lui seul voit encore son prénom.
- **L'ardoise**, sous la vitrine : l'info du moment que le commerçant écrit au comptoir (90 signes), le jour même
  seulement. Dans la démonstration, l'ardoise dit le moment en cours (« En ce moment : Le service du midi »).

Où : dans l'appli des habitants, sous les cages, dès qu'il a libéré son fantôme ; au comptoir, en haut du carnet
(« Ta vitrine, cette semaine », où il voit tous les prénoms, et écrit son ardoise). La démonstration remplit la
vitrine d'un commerce inventé d'une foule inventée (jamais pour un vrai commerçant).

- `src/app/api/direct/vitrine/route.ts` : la vitrine d'un commerce (jamais l'identifiant d'une personne), son
  réglage ; l'ardoise par la route du carnet (`ardoise`).
- `supabase/migrations/20261030090000_clik_vitrine.sql` : `clik_ardoise`, et `human_habitants.prenom_vitrine`.

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
elle, la vitrine s'affiche, mais l'ardoise répond « L'ardoise n'est pas encore activée » et le prénom ne se cache pas. Sans les cages, la carte dit « Bientôt, à la fin de tes vidéos » ; sans les passages, le carnet
s'affiche mais « Passage aujourd'hui » répond « Les passages ne sont pas encore activés. »

## Vérifier

- `node scripts/essai-cages-route.mjs` (lancé aussi par la CI, dans `scripts/navigateur/lancer-essais.sh`) : la
  route contre le faux Supabase.
- `node scripts/essai-carnet-route.mjs` (CI aussi) : le carnet, ses passages, le stop, et « Oui, préviens-les »
  (les numéros, le message gardé, les règles), et le moteur de messages (Ma Maison, la réponse, le stop, « A
  répondu », le silence) et le ticket de Mike, contre le faux Supabase. Hors de 9 h – 20 h 30, il vérifie le refus.
- `node scripts/essai-vitrine-route.mjs` (CI aussi) : la vitrine, les prénoms cachés, « Vous », l'ardoise du jour.
- Le carnet dans le navigateur : `/autour-de-moi/assistante?metier=table`, la carte « Mon carnet ».
- Dans le navigateur : `/autour-de-moi`, Restaurants, Chez Bergine, « Voir toutes les offres + infos », le film
  « En cuisine, pendant le service » jusqu'au bout.
