# ✨ « Ma figurine », au centre de Ma maison (chantier ouvert le 25 novembre 2026)

Le propriétaire, le 25 novembre 2026 : « cette figurine dans ma maison doit être vraiment le centre de notre attention
puisque c'est elle que les gens verront partout ». Puis, devant la maquette : « je ne vois pas les possibilités pour
l'utilisateur de faire évoluer sa figurine et comment on fait ? » — d'où l'écran « Mon double du jour », et un lot à
part, « Elle change toute seule ».

La maquette (lot 0), validée le 25 novembre (« oui », « les deux ») :
https://claude.ai/artifact/AAQV8sh6SN382BxzbLF31r

## 1. Les lots

| Lot | Ce qu'il fait | État |
|---|---|---|
| 0 | La maquette | ✓ validée le 25 novembre |
| 1 | Ma maison épurée, le bouton « ✨ Ma figurine », l'écran « Mon double du jour », la même figurine partout | ✓ fusionné le 25 novembre (#282) ; section 2 |
| — | « Elle change toute seule » : la série 🔥 (une auréole à 7 jours), l'accessoire de sa passion, le cœur-souvenir « offert par Sam » — des calques posés par-dessus, sans nouvelle image | ✓ fusionné le 25 novembre (#283) ; section 3 |
| 2 | « Pendant ton absence » : sa figurine raconte sa journée, de vrais prénoms, de vrais chiffres | ✓ fusionné le 25 novembre (#284) ; section 4 |
| 3 | L'image à partager : « Ma figurine du jour » | section 5 |
| 4 | Le bonjour avec SA voix (jamais de voix de synthèse) | à faire |
| 5 | La collection | à faire |

Les habits : plus tard. Chaque lot : une PR, ses essais route et navigateur, ce document, et le « oui » du propriétaire.

## 2. Lot 1 : la figurine au centre

### 2.1 Ma maison, épurée (`app/collection/maison-catalogue.tsx`)

- **Les fanions « Mes salons » partent** (en haut de la pièce). Les salons où l'on va restent retenus
  (`mes-salons.json`, `MaMaisonVue.salons`) : rien n'est perdu, ils ne sont plus affichés.
- **« Aujourd'hui, si tu veux » part, chez soi** (« 📺 Ma télé », « ❓ Question », « 📼 Revoir ») : la question du jour
  et les vidéos à revoir vont dans « Pendant ton absence », en bas de la feuille (`PendantTonAbsence`, `toujours`). En
  visite, la rangée reste (les nouveautés du jour, sa question).
- **Sa figurine brille au centre** (`.mmc-halo`) ; la toucher la fait sautiller, puis ouvre son double du jour.
- **Dessous, LE bouton « ✨ Ma figurine »** (`.mmc-double`, le plus gros de la page), avec sa pastille « ● À préparer
  aujourd'hui » tant que son double n'est pas prêt aujourd'hui. Puis les trois autres, en tuiles plus petites :
  « Pendant ton absence », « Ajouter chez moi », « Mes proches ».

### 2.2 L'écran « Mon double du jour » (`app/collection/mon-double.tsx`)

En plein écran, au-dessus de la maison : « ‹ Ma maison », « Mon double du jour — C'est elle que tout le monde voit », sa
figurine en grand (son halo, l'étiquette de sa tête, sa pancarte), puis cinq onglets :

1. **😊 Sa tête du jour** : « Mon humeur (…) » (par défaut) ou une de ses **sept** expressions. Elle la garde partout
   jusqu'à minuit (l'heure de Paris).
2. **🪧 Sa pancarte** : UNE phrase (80 signes), visible partout jusqu'à ce qu'on la change. **C'est aussi son mot du
   jour dans Autour** (la même phrase, dans les deux sens). Des idées toutes prêtes (`IDEES_MOT_DU_JOUR`). Les mots
   interdits et l'alcool sont refusés (« Ça, ta figurine ne le dit pas »). « Sans pancarte » l'enlève.
3. **🪞 Le miroir** : la caméra (rien n'est enregistré) ; sa figurine copie sa tête en direct (`useMaTete`,
   `FigurineVivanteVue`) ; « 📌 Garder cette tête pour aujourd'hui ».
4. **💃 Ses réactions** : danser, rire, coucou, bravo, j'adore, oh ! — on les essaie ici ; dans le fil ou un salon, elle
   les fait pour de vrai.
5. **🗓️ Sa figurine du mois** (`MaFigurineDuMois`, comme avant).

En bas, **« ✓ C'est moi aujourd'hui »** : son double est prêt, la pastille s'en va jusqu'à demain. Choisir une tête ou
écrire sa pancarte le prépare aussi.

### 2.3 Rangé dans le seau (`lib/direct/mon-double-serveur.ts`)

`<habitant>/mon-double.json` = `{ tete?: { jour, e }, pancarte?: { mot, le }, pret?: jour }`.

- `teteChoisieDuJour` est **LA** tête qu'il fait partout aujourd'hui : celle choisie ce jour-là, sinon celle de son
  humeur du jour (section 27 de `ma-maison.md`), sinon l'habituelle. `teteDuJour` (la messagerie, la maison, le fil,
  les salons), `figurineVivante` (la séance, la télé) et Autour la lisent : **une seule source**.
- Le choix d'hier ne vaut plus aujourd'hui ; la pancarte, si (jusqu'à ce qu'on la change).

La route : `GET /api/direct/mon-double` (son double, sa figurine vivante pour le miroir) ; `POST` avec
`{ action: "tete", e }` (`"humeur"` : revenir à celle de son humeur), `{ action: "pancarte", texte }` (vide : l'enlever),
`{ action: "pret" }`.

### 2.4 Partout (la même tête, la même pancarte)

- **Chez soi** et **en visite** (`MaMaisonVue.tete`, `MaMaisonVue.double.pancarte`) : la tête du jour se voit
  maintenant aussi chez ceux qui ne sont pas ses proches (son humeur et sa table restent pour ses proches).
- **Le fil de Découvrir** (`SilhouetteFil.pancarte`) : la tête y était déjà (`teteDuJour`).
- **Les salons ouverts** (`PresentSalon.tete`, `PresentSalon.pancarte`) : sa tête du jour sur son corps, sa pancarte au-
  dessus.
- **Autour** : sa tête « humeur » est sa tête du jour ; poser sa figurine avec un mot du jour écrit sa pancarte, et
  l'écran d'Autour reprend sa pancarte comme mot du jour.
- **La pancarte** (`app/collection/pancarte.tsx`) : une planchette crème, écrite à la main, tenue au-dessus de sa tête
  par un petit bâton, la même partout.

### 2.5 Ce qui attend (dit honnêtement)

- **Sa figurine du mois comme figurine « partout »** : c'est une image debout, d'une seule pièce ; la tête du jour se
  pose sur la figurine assise en calques. Les deux ne vont pas ensemble : elle reste dans l'onglet « Du mois ».
- **Dans un salon ouvert, sa tête est prise à l'entrée** : si on la change pendant qu'on y est, les autres la verront à
  la prochaine entrée.

### 2.6 Les essais

- `scripts/essai-mon-double-route.mjs` : sa tête (l'humeur par défaut, un choix, retour à l'humeur, le choix d'hier),
  sa pancarte (refus des mots interdits et de l'alcool, 80 signes, vide), « prêt », et partout : sa maison, sa visite,
  le fil, Autour (dans les deux sens), un salon ouvert.
- `scripts/navigateur/mon-double.mjs` : la maison épurée, le gros bouton et sa pastille ; toucher sa figurine ouvre son
  double ; une tête, une pancarte (une refusée), une réaction, sa figurine du mois ; « ✓ C'est moi aujourd'hui » : la
  pastille s'en va, sa figurine rit avec sa pancarte ; Sam la voit pareille en visite.
- Mis à jour : `ma-maison-catalogue.mjs` (plus de fanions ni de rangée « Aujourd'hui » ; « 📼 Revoir » dans « Pendant
  ton absence » ; toucher sa figurine ouvre son double), `ma-maison-question.mjs` (sa question du jour, chez soi, dans
  « Pendant ton absence »), `salons-seance.mjs` (plus de fanions : « Mes salons » reste retenu).

## 3. « Elle change toute seule » (25 novembre 2026)

Le propriétaire, devant la maquette (« Comment je fais évoluer ma figurine ») : « qu'elle change toute seule avec le
temps ? », puis « oui ok si c'est pas trop coûteux ». **Rien ne se fabrique** : des détails dessinés par-dessus sa
figurine, posés dans la boîte de sa tête (`boite`, celle de ses calques), comme sa tête du jour. Toujours d'après de
vraies données (`lib/direct/ornements.ts`, `ornements-serveur.ts`, l'écran `app/collection/ornements.tsx`) :

| Ce qu'elle porte | D'après | Quand |
|---|---|---|
| 🔥 sa flamme, « 🔥 5 » | ses jours de suite sur ClikMe (`presence.json`, noté à l'ouverture de l'appli, déjà compté pour la figurine du mois) | à partir de 2 jours ; un jour manqué, elle repart (tant qu'il n'est pas encore venu aujourd'hui, celle d'hier compte encore) |
| 😇 son auréole dorée, au-dessus de sa tête | la même série | à partir de 7 jours de suite |
| 🎧 l'accessoire de sa passion du moment | le salon ouvert où il va le plus ces trente derniers jours (`mes-salons.json`), sinon sa première passion (`passions.json`) | il change quand sa passion du moment change |
| ❤️ un petit cœur sur sa poitrine, « 🎁 offert par Sam » ou « ❤️ vu avec Sam » | son dernier souvenir avec un proche : une surprise ouverte (`deciderSouvenir`), une vidéo vue ensemble (`poserSouvenirCommun`) — rangé dans `<habitant>/coeur.json` (le prénom, jamais le compte) | quinze jours |

**Les accessoires** (`ACCESSOIRES`) : sur sa tête, 🎧 le casque (musique), 🎮 le casque à micro (jeux vidéo), 👨‍🍳 la
toque (cuisine), 🐾 des oreilles (animaux), 👑 une couronne (mode), 🍥 un bandeau (manga) ; à son cou, ⚽ l'écharpe
(foot) ; sinon un badge épinglé : 🍿 séries, ⭐ télé-réalité, 😂 humour, 📚 révisions, 👶 jeunes parents.

**Partout** : sa maison (chez lui et en visite, avec les étiquettes « 🔥 8 » et « 🎁 offert par Sam »), son double du
jour (et, sous ses têtes, « ✨ Ce qu'elle porte toute seule » : pourquoi, en une ligne chacun), le fil (`FigurineAssise` :
les étiquettes quand elle est assez grande), les salons ouverts (sans étiquettes, c'est petit). Une figurine de
l'ancien style (sans calques) : seules les étiquettes.

**Ce qui attend** : Autour (les figurines posées dans la ville) ne les porte pas encore ; une passion « à soi » (le lot
D9) n'a pas d'accessoire.

**Les essais** : `scripts/essai-ornements-route.mjs` (8 jours de suite, l'auréole et le casque dans la boîte de sa tête ;
la surprise de Sam ouverte : le cœur partout — son double, sa maison, la visite, le fil, un salon ; Sam : un jour, sa
passion déclarée, l'écharpe, un salon trop ancien ne compte plus ; Hugo : rien ; un cœur de seize jours, un jour
manqué) ; `scripts/navigateur/ornements.mjs` (chez elle : l'auréole au-dessus de sa tête, le casque dessus, le cœur sur sa
poitrine, « 🔥 8 », « 🎁 offert par Sam » ; son double dit pourquoi ; Sam la voit pareille).

## 4. Lot 2 : « Pendant ton absence », sa figurine raconte sa journée (25 novembre 2026)

Le propriétaire : « Sa figurine raconte sa journée : qui m'a fait coucou, qui est passé chez moi, combien m'ont vue dans
les salons. Des prénoms, des vrais chiffres, jamais inventés. »

**Où** : en haut de la feuille « 🛎️ Pendant ton absence » (le bouton de Ma maison), sa figurine, et à côté sa bulle,
« 👀 Ma journée, racontée par ta figurine ». Elle parle à la première personne, de la journée (l'heure de Paris) :

- 👋 « Sam et Hugo m'ont fait coucou » (`<habitant>/monde/coucous.json` ; une personne une fois) ;
- 🚪 « Visite de Sam chez toi » (`<habitant>/monde/visites.json` ; des prénoms, jamais un nombre de visites, comme la
  règle de la section 7 de `ma-maison.md`) ;
- 👀 « 12 personnes m'ont vue dans les salons », et dessous « Dont Hugo, Zoé et Nina » (les trois derniers).
- Rien : « Aujourd'hui, personne ne m'a encore vue. Assieds-toi dans un salon : on me verra. »

**Ceux qui l'ont vue dans les salons** (nouveau : `<habitant>/ma-journee.json` = { jour, salons: { <identifiant court> :
prénom } }) : à chaque entrée dans un salon ouvert ou une séance (`entrerAuSalon`, `entrerChez`), celui qui entre voit
ceux qui sont là, et ils le voient — noté des deux côtés (`noterVusAuSalon`, `journee-figurine-serveur.ts`). Une
personne compte une fois par jour ; à minuit, on repart de zéro. Jamais un compte : l'identifiant court des salons et
le prénom.

Le pied de la feuille dit maintenant : « Des prénoms et de vrais chiffres, rien d'inventé : seulement ce qui s'est
passé. »

**Les essais** : `scripts/essai-journee-figurine-route.mjs` (d'abord rien, ce qu'il restait d'hier ne compte pas ; un
coucou compté une fois, une visite ; au salon du foot, Léa, Hugo et Zoé se voient tous, Léa rerentre sans que personne
compte deux fois ; jamais un compte) ; `scripts/navigateur/journee-figurine.mjs` (la bulle, sa figurine, les trois
lignes) ; `ma-maison-vie.mjs` (« Visite de Sam chez toi »).

## 5. Lot 3 : l'image à partager, « Ma figurine du jour » (25 novembre 2026)

Le propriétaire : « 📸 l'image à partager "Ma figurine du jour" (tête du jour, pancarte, "Mon double sur ClikMe") ».

**Où** : dans « Mon double du jour », en bas à gauche de sa figurine, « 📸 Mon image du jour ». Une feuille monte :
« Ton image se prépare… », puis l'image, et « 📲 Partager » (la feuille de partage du téléphone : WhatsApp, Instagram,
SMS… avec le fichier `ma-figurine-du-jour.png` et « Mon double du jour, sur ClikMe ✨ ») ou « ⬇️ Enregistrer » (le
fichier se télécharge ; c'est aussi ce que fait « Partager » sur un téléphone qui ne partage pas de fichiers).
`app/collection/image-du-double.tsx`.

**L'image** (`GET /api/direct/mon-double/image`, la sienne seulement ; PNG, 1080 × 1350, le format d'une publication ;
jamais gardée en cache) :

- en haut, « Ma figurine du jour » et la date en mots (« Mercredi 25 novembre », l'heure de Paris) ;
- au milieu, sur son halo doré, sa figurine avec **sa tête du jour** (celle choisie, sinon celle de son humeur) : son
  corps sans sa tête et la tête posée dans la boîte de sa tête, exactement comme l'écran (`figurineDuJourEnImage`,
  `image-du-double-serveur.ts`) ; une figurine de l'ancien style : son image entière ;
- **sa pancarte** au-dessus de sa tête, la planchette crème penchée et son bâton (en Poppins : l'écriture à la main de
  l'écran n'existe pas côté serveur) ;
- **ce qu'elle porte toute seule** (section 3) : l'auréole, l'accessoire de sa passion, le cœur — les mêmes dessins que
  l'écran (`piecesDesOrnements`, `app/collection/ornements.tsx`), sauf le petit badge emoji ; dessous, « 7 jours de
  suite » et « offert par Sam » / « vu avec Sam » s'il les a (de vraies données) ;
- en bas, « Mon double sur ClikMe ».

Sans compte : 401. Sans figurine : 404 et « Ta figurine n'est pas encore prête : ton image arrive avec elle. » (jamais
une image vide). La même image à chaque fois pour la même journée (rien de tiré au hasard).

`vueDuDouble` (ce que l'écran montre) est passé de la route `/api/direct/mon-double` à `image-du-double-serveur.ts`,
pour servir aux deux.

**Les essais** : `scripts/essai-image-du-double-route.mjs` (401, 404, le PNG 1080 × 1350, le même deux fois ; le rire
change l'image, revenir à son humeur la redonne ; la pancarte se voit au-dessus de sa tête ; sept jours de suite :
l'auréole et « 7 jours de suite » ; le cœur, plus après quinze jours ; l'ancienne figurine) ;
`scripts/navigateur/image-du-double.mjs` (sur un iPhone : le bouton, l'aperçu, « Partager » avec le fichier,
« Enregistrer », « Fermer »).
