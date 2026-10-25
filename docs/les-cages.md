# 🔓 Les trois cages, à la fin du film d'un commerçant

> « Une belle vidéo, tout le monde sait en faire. Moi, je fais réagir. À la fin de votre vidéo, chacun libère
> son fantôme de sa cage. »

C'est l'étape 1 du passage de la démo (`outils/tour-du-fantome`) dans l'application ; l'étape 2, le carnet au
comptoir, est plus bas. Les étapes suivantes : « Oui, préviens-les » (Mike), les messages, le ticket de Mike.

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

## L'activer en production

**Les deux tables doivent être créées une fois** : coller le contenu de
`supabase/migrations/20261026090000_clik_cages.sql` dans Supabase → SQL Editor → Run. Il se rejoue sans casser.
Tant que ce n'est pas fait, les cages s'affichent et se gardent dans le téléphone, mais rien n'arrive chez le
commerçant ; un numéro donné reçoit « Ce n'est pas encore possible chez ce commerçant. Réessayez plus tard. »

**Le carnet demande en plus** `supabase/migrations/20261027090000_clik_visites.sql` (les passages), à coller de la
même façon. Sans les cages, la carte dit « Bientôt, à la fin de tes vidéos » ; sans les passages, le carnet
s'affiche mais « Passage aujourd'hui » répond « Les passages ne sont pas encore activés. »

## Vérifier

- `node scripts/essai-cages-route.mjs` (lancé aussi par la CI, dans `scripts/navigateur/lancer-essais.sh`) : la
  route contre le faux Supabase.
- `node scripts/essai-carnet-route.mjs` (CI aussi) : le carnet, ses passages et le stop, contre le faux Supabase.
- Le carnet dans le navigateur : `/autour-de-moi/assistante?metier=table`, la carte « Mon carnet ».
- Dans le navigateur : `/autour-de-moi`, Restaurants, Chez Bergine, « Voir toutes les offres + infos », le film
  « En cuisine, pendant le service » jusqu'au bout.
