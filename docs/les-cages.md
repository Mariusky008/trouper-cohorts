# 🔓 Les trois cages, à la fin du film d'un commerçant

> « Une belle vidéo, tout le monde sait en faire. Moi, je fais réagir. À la fin de votre vidéo, chacun libère
> son fantôme de sa cage. »

C'est l'étape 1 du passage de la démo (`outils/tour-du-fantome`) dans l'application. Les étapes suivantes :
le carnet au comptoir, « Oui, préviens-les » (Mike), les messages, le ticket de Mike.

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

## L'activer en production

**Les deux tables doivent être créées une fois** : coller le contenu de
`supabase/migrations/20261026090000_clik_cages.sql` dans Supabase → SQL Editor → Run. Il se rejoue sans casser.
Tant que ce n'est pas fait, les cages s'affichent et se gardent dans le téléphone, mais rien n'arrive chez le
commerçant ; un numéro donné reçoit « Ce n'est pas encore possible chez ce commerçant. Réessayez plus tard. »

## Vérifier

- `node scripts/essai-cages-route.mjs` (lancé aussi par la CI, dans `scripts/navigateur/lancer-essais.sh`) : la
  route contre le faux Supabase.
- Dans le navigateur : `/autour-de-moi`, Restaurants, Chez Bergine, « Voir toutes les offres + infos », le film
  « En cuisine, pendant le service » jusqu'au bout.
