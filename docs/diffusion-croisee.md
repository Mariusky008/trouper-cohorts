# 📣 La diffusion croisée — « votre communication ne s'arrête plus à vos abonnés »

> Décidé le 3 novembre 2026 par le propriétaire : « quand un commerçant crée une vidéo, elle est distribuée dans
> l'admin de deux autres commerçants, qui la reçoivent dans leur espace pour la diffuser automatiquement sur leurs
> réseaux sociaux ».

Une meilleure vidéo ne garantit pas davantage de visibilité. Chaque commerçant devient donc un **média pour les
autres** : sa vidéo passe aussi chez **deux commerçants partenaires**, sur leurs réseaux, en « découverte du
quartier », et les leurs passent chez lui. Ce n'est pas une publicité qui s'impose, c'est une découverte locale :

> Découverte du quartier 📣 À 2 min à pied d'ici, chez Boulangerie Martin : les croissants du jour. Allez voir !

## Les règles

1. **Deux partenaires au plus** par commerce, au départ.
2. **Pas de concurrent direct** associé d'office (pas deux coiffeurs ensemble quand on peut l'éviter).
3. **Réciproque et équilibré** : personne ne diffuse sans être diffusé.
4. **Son accord, explicite** : il coche « J'accepte d'accueillir sur mes réseaux les vidéos de mes deux partenaires,
   et que les miennes passent chez eux » ; rien ne part chez lui sans. **Au plus 2 vidéos de partenaires par semaine**
   sur ses réseaux en automatique (`PLAFOND_PAR_SEMAINE`) ; une vidéo reçue non traitée n'est plus d'actualité au bout
   de 7 jours.

**L'anneau** (`anneauDeDiffusion`) tient les trois premières d'un coup : dans chaque ville, les commerces du réseau sont
mis en cercle, de proche en proche (en partant du plus au nord-ouest, toujours au plus proche des restants) ; chacun
diffuse ses deux voisins de cercle, qui le diffusent en retour — deux reçus, deux donnés pour tout le monde. Deux du
même métier côte à côte sont séparés par échange. Deux commerces seuls dans leur ville se diffusent l'un l'autre ; un
seul n'a personne (« dès qu'un voisin rejoint le réseau… »). Quand un commerce rejoint ou quitte le réseau, le cercle se
refait.

## Le parcours

1. **Au comptoir** : « 📣 Mon réseau de diffusion » (carte de l'accueil, ligne de Ma boutique). Il lit ce que c'est,
   coche son accord, « Rejoindre le réseau ». Il voit ses deux partenaires (nom, métier, à combien de minutes à pied),
   choisit **Automatique** (d'office) ou **Une par une**, ses vidéos **reçues** (diffuser sur mes réseaux, pas
   celle-ci) et **les siennes chez eux** (diffusée le…, en attente, pas diffusée).
2. **Il publie une vidéo** (le Studio, une interview, un épisode : toute annonce avec une vidéo, via
   `/api/site-internet/pro/offer`) : après la réponse, `envoyerAuxPartenaires` la dépose dans la boîte de ses deux
   partenaires. Chez celui qui est en automatique, a des réseaux connectés et n'a pas atteint son plafond, elle part
   tout de suite sur ses réseaux ; sinon, elle l'attend.
3. **L'extrait de 8 secondes** (`studio-extrait.ts`) : pour un film du Studio, au moment de « Publier mon film », s'il
   est dans le réseau, le téléphone REJOUE le film qu'il vient de monter et en enregistre huit secondes — 6,4 s du film
   (après l'intro de la figurine : l'accroche et ses titres, puis ses premiers moments) avec en haut « 📣 Découverte du
   quartier » et en bas le nom du commerce, puis la carte de fin (son nom, « Le film entier sur sa page »,
   « clikme.fr/b/… »). Le son du film suit, et s'éteint sur la dernière seconde. Huit secondes d'attente de plus,
   seulement pour ceux du réseau. Il part à côté du film (`videoPartenaires`) ; c'est lui que reçoivent les partenaires
   — sinon la bande-annonce d'un épisode (`videoReseaux`), sinon la vidéo entière. Raté : ils reçoivent le film entier.
4. **Sur les réseaux de l'hôte** (`publierUneDecouverte`, l'intermédiaire PostPeer de `lib/reseaux`) : sa vidéo en
   Reel (sinon sa photo), la légende de la découverte, le nom, la ville et le métier de l'invité, le lien de SA page
   sur Facebook (Instagram ne clique pas un lien écrit). **Pas sur Google** : un post sur la fiche Google de l'hôte doit
   parler de l'hôte. La « dernière publication » de l'hôte reste la sienne.

## Les fichiers

- `src/lib/direct/diffusion.ts` — la règle, pure : l'anneau, le texte de la découverte, la distance en mots, le
  plafond, le réglage (`metadata.diffusion_croisee` : `{ active, auto, le }`).
- `src/lib/direct/diffusion-serveur.ts` — les commerces du réseau, les partenaires, la boîte (un fichier par vidéo
  reçue dans le seau **privé** `diffusions-croisees`, `<hôte>/<id>.json` : deux écritures ne s'effacent jamais),
  l'envoi.
- `src/lib/reseaux/intermediaire.ts` — `publierUneDecouverte`.
- `src/app/api/site-internet/pro/diffusion-croisee/route.ts` — `etat`, `rejoindre` (avec `accord`), `quitter`, `auto`,
  `diffuser`, `refuser`, contre le jeton pro.
- `src/app/api/site-internet/pro/offer/route.ts` — l'accroche : une annonce avec vidéo part chez les partenaires.
- `src/app/autour-de-moi/assistante/diffusion-comptoir.tsx` — l'écran.
- `src/lib/direct/studio-extrait.ts` — l'extrait de 8 s (le Studio, `studio-comptoir.tsx`, le fait au moment de
  publier ; `envoyerStudio` le dépose à côté du film).
- `scripts/essai-diffusion-route.mjs` — l'essai de la route sur le faux Supabase (dans la CI).

Réglage : `DIFFUSIONS_BUCKET` (le seau, `diffusions-croisees` par défaut). Les réseaux eux-mêmes demandent
`POSTPEER_API_KEY` (comme pour ses propres annonces).

## Pas encore fait

- **L'extrait pour les autres vidéos** : l'interview part chez les partenaires entière, l'épisode avec sa
  bande-annonce ; seul le film du Studio a son extrait de 8 s.
- **Mesurer les résultats** (vues, clics venus d'un partenaire) : rien n'est compté pour l'instant.
- **Au-delà de deux partenaires** : « une place dans un réseau local de visibilité », où ClikMe répartit les contenus
  vers les publics les plus pertinents.
- **Les autres contenus** : les événements des figurines, les jeux concours, les interviews et les nouveautés passent
  déjà s'ils sont publiés avec une vidéo ; les autres (une photo seule) ne partent pas chez les partenaires.
- Ce qui circule : le nom du commerce, son métier, sa ville, son texte, sa photo et sa vidéo — ce qu'il a lui-même
  publié. Aucune donnée de client.
