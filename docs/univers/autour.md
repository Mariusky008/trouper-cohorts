# 📍 « Autour de moi » : je pose ma figurine dans la ville

Le 22 novembre 2026, le propriétaire a validé la maquette des cinq écrans (« Ok pour autour »), puis : « tu peux faire
autour de moi en attendant ». Ce document décrit le nouvel « Autour ». Pour l'ancien, celui des mèmes laissés dans la
ville, voir `docs/reprise.md`, section 4, et `docs/figurines.md`, 9.0.

## 1. L'idée

Avant, on laissait **des mèmes** dans les lieux de la ville. Maintenant, on y pose **sa figurine** : assise, avec la
tête de son humeur du jour, et un **mot du jour** dans sa bulle (« Qui vient prendre un café ? »). Elle y reste
**24 heures**, et on peut la retirer quand on veut. Les autres la voient sur la carte. Ils lui répondent en posant leur
propre figurine à côté de la sienne.

## 2. Les écrans (`app/collection/autour.tsx`)

- **La carte** (`autour-carte.tsx`, MapLibre, inchangée).
  - Chaque lieu porte les têtes des figurines posées aujourd'hui et leur nombre. « Ailleurs », ce sont des zones floues,
    jamais une épingle.
  - La feuille du bas, « Posées autour de toi aujourd'hui », montre les dernières figurines posées, avec leur mot du
    jour en premier.
  - « ＋ Poser ma figurine ».
- **Le lieu.**
  - Les figurines y sont assises, chacune avec son mot dans sa bulle. Une réponse s'assoit juste à côté de celle à qui
    elle répond (« ↳ à côté de Léa »).
  - La mienne porte « Toi ». En bas : « Ta figurine est ici · encore 21 h », puis « Changer mon mot du jour », ou
    « Poser la mienne ici » si je n'y suis pas.
- **Poser ma figurine**, dans cet ordre :
  1. **Où.** Un lieu de la liste : un commerce client ou un lieu public placé par l'admin. Ou « Ailleurs » : on lui
     donne un petit nom (« Soirée chez Max »).
  2. **Quelle tête.** Mon humeur du jour, ou une de mes expressions prêtes.
  3. **Le mot du jour**, 80 signes au plus. Des idées à toucher : « Qui vient prendre un café ? », « Je garde une
     place »…
  4. **Qui la voit** : tout le monde, mes proches, ou moi seul.

  L'aperçu montre ma figurine assise avec sa bulle. Sans mot du jour, rien ne part.
- **La fiche d'une figurine** (au toucher) :
  - le prénom, et « Posée à Le Petit Bistrot · il y a 2 h · encore 22 h » ;
  - « Répondre avec ma figurine » ;
  - « 🏠 Voir sa maison » (`/univers/chez/<profil>`) ;
  - « 👯 L'ajouter en proche » ;
  - « Signaler ».

  Sur la mienne : « Retirer ma figurine ».
- **Sans carte** (les tuiles refusées) : la liste des lieux, avec leurs figurines.
- **Sans figurine** : on m'invite à la créer.
- **La notification** « ↩️ Sam t'a répondu ! » (« 🍽️ Le Petit Bistrot · avec sa figurine ») mène à `/collection?autour=<lieu>&pose=<id>#autour`, qui
  ouvre le lieu.

## 3. Les règles

- **Jamais une position précise.**
  - On choisit un lieu de la liste.
  - Ou « Ailleurs » : le téléphone dit où l'on est, et le serveur l'arrondit tout de suite en une zone d'environ
    500 m (`zoneDe`). La position n'est gardée nulle part telle quelle. La zone se montre à son centre.
  - Le petit nom d'« Ailleurs » ne peut pas être une adresse (`nomLieuPropre`).
- **24 heures.** L'identifiant d'une pose porte son heure (`idDePose`). Passées 24 h, elle ne se montre plus, sans qu'on
  ait à ouvrir un seul fichier.
- **Une seule par lieu.** La reposer au même endroit remplace l'ancienne, et ça ne compte pas dans la limite du jour.
- **Trois par jour**, au plus.
- **Le mot du jour** est obligatoire. Les mots interdits et les mots d'alcool sont refusés, comme partout.
- **Qui la voit** : `tous`, `proches` (les proches de son auteur) ou `moi`. C'est la même règle que les mèmes d'avant
  (`regardDe`, `visible`).
- **Répondre** : seulement à une figurine du même lieu, encore là, que je peux voir, et pas la mienne. Son auteur est
  prévenu s'il peut voir la mienne.
- **Signaler** : celui qui signale ne la voit plus. Au troisième signalement de trois personnes différentes, elle s'en
  va. On ne signale pas la sienne.
- **L'âge** : 15 ans et plus, comme pour tout le reste (`docs/reprise.md`, 5 ter).
- **La tête et le corps.**
  - La tête est celle de l'humeur du jour, ou l'expression choisie, à condition qu'elle ait été découpée sur les
    calques d'aujourd'hui. Sinon, c'est sa tête habituelle.
  - Le corps, c'est la figurine sans sa tête (`calques.sansTete`). Sans calques, on montre sa figurine d'une seule image.
    Une figurine de l'ancien style (une seule image, sans « assise ») se pose aussi : elle se montre entière.

## 4. Le rangement (le seau `figurines-clients`)

| Chemin | Contenu |
| --- | --- |
| `autour-fig/<ville>/<lieu>/<pose>.<qui>.<habitant>.json` | `{ id, h, le, qui, mot, tete, nomLieu?, reponseA? }` |
| `<habitant>/autour-fig/<pose>.json` | `{ ville, lieu, qui }` : les siennes, pour les retirer |
| `<habitant>/autour-fig-jour/<jour>.json` | `{ n }` : le compte du jour |
| `autour-fig-signal/<pose>.json` | `{ par, lieu, ville, h }` |
| `<habitant>/autour-fig-caches.json` | `{ ids }` : celles qu'il a signalées |

## 5. Le code

- `lib/direct/autour.ts` (partagé) :
  - `POSES_PAR_JOUR`, `POSE_MS`, `MOT_DU_JOUR_MAX`, `IDEES_MOT_DU_JOUR` ;
  - les types `FigurinePosee`, `MesTetes`, `TeteChoisie` ;
  - `idDePose`, `heureDePose`, `poseEnCours`.
- `lib/direct/autour-serveur.ts` :
  - `carteDesFigurines`, `figurinesDuLieu`, `mesTetes` ;
  - `poserSaFigurine`, `retirerSaFigurine`, `signalerUneFigurine`.
- La route `/api/direct/autour` :
  - GET `?figurines=1[&lieu=]` et `?mesTetes=1` ;
  - POST `poser`, `retirer-pose`, `signaler-pose`.
- Les anciennes actions, celles des mèmes, restent en place. Les lieux publics placés par l'admin servent tels quels.

## 6. Les essais

- **`scripts/essai-autour-figurines-route.mjs`**, par les routes :
  - les têtes, et ce qui est refusé : pas de mot, de l'alcool, une adresse en petit nom ;
  - la tête du rire sur la carte, la figurine assise sur ses calques ;
  - la réponse à côté, « Mes proches », une zone sans position ;
  - une seule pose par lieu, trois par jour ;
  - la fin passées 24 h, trois signalements, retirer ;
  - 403 sans compte.
- **`scripts/navigateur/autour.mjs`**, sur un iPhone :
  - la carte, le lieu, la fiche ;
  - répondre avec une idée, retirer, poser « Ailleurs » ;
  - signaler ;
  - sans carte, sans figurine, la notification, les lieux publics de l'admin.

## 7. Pour plus tard (pas dans ce lot)

- Le salon du coin : on choisit d'y entrer, avec des protections.
- Le souvenir commun : « Le même jour, au même endroit ».
