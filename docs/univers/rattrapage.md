# ⏪ Le rattrapage d'une séance

Demandé par le propriétaire le 27 novembre 2026 : il avait raté la séance d'un groupe la veille au soir (un « 🎬 Essai »)
et pensait pouvoir la voir quand même. Le mode « Rattrapage » : revoir la vidéo de la séance, voir les réactions et les
mots de ceux qui étaient là à leur seconde, réagir à son tour (« ⏪ vu en rattrapage »), et que le groupe le sache, sans
pression d'être là en direct.

- Maquette validée le 27 novembre 2026 : https://claude.ai/artifact/RkhHfxYRdXh9Mft4fXmyS2 (le lendemain sur Mes groupes,
  le salon en rattrapage, un souvenir qui prend la scène, ce que le groupe voit).

## Ce qui est décidé

- **Une séance** : une fois d'un rendez-vous d'un groupe gardé (son salon, à l'heure : dix minutes avant, deux heures
  après), ou l'essai d'une proposition pour ceux qui y sont entrés par « ▶ Entrer ».
- **Sept jours** pour la rattraper ; ensuite elle s'efface. Un groupe : ses membres. Un essai : celui qui propose et ceux
  qui avaient leur place.
- **Le grand moment** se montre avec les têtes de ceux qui ont réagi, jamais un nombre (la règle des groupes).
- **Une seule notification douce par rattrapage**, seulement si l'on a réagi ou écrit ; la règle de bruit des groupes
  (rien de 22 h à 9 h) ; un interrupteur dans Moi.
- Les réactions sont celles des grands moments (`docs/univers/grands-moments.md`) : un souvenir prend la scène à sa
  seconde ; la même émotion à la même seconde, c'est 🫶 côte à côte.
- La séance du 26 novembre (celle que le propriétaire a ratée) ne se rattrape pas : les salons ne gardaient que l'heure
  de chaque message, pas la seconde de la vidéo, et 48 h seulement. Tout commence au lot T1.

## Les lots

| Lot | Contenu | État |
| --- | --- | --- |
| T0 | Maquette | ✅ validée le 27 novembre 2026 |
| T1 | Noter la séance : chaque réaction et chaque mot, avec la vidéo et sa seconde ; lire les séances | ✅ fait (#326) |
| T2 | Le salon en rattrapage (la vidéo, les marques sur la barre, les souvenirs qui prennent la scène, les mots à leur seconde) | ✅ fait |
| T3 | Réagir en décalé : les six émotions, « Ajouter à la séance », « ⏪ vu en rattrapage » | ✅ fait |
| T4 | Ce que le groupe voit : la discussion, le journal, la notification douce, mes réactions quand ils revoient | |
| T5 | Les entrées : la carte de l'essai, Absent / Plus tard, le journal, Activité 🛎️ | |

## T1, dans le code

- `src/lib/direct/rattrapage.ts` (partagé) : la clé d'une séance (`<groupe>/<fois>-<rdv>` ou `<proposition>/<heure>-essai`),
  `ouValide` (l'identifiant YouTube et la seconde), `grandMoment` (l'émotion qui a fait réagir le plus de monde dans les
  mêmes cinq secondes), `aLaSeconde` (« 2:15 »).
- `src/lib/direct/rattrapage-serveur.ts` : le rangement, dans le seau —
  `groupes/seances/<clé>.json` (la séance : nom, emoji, heure, les vidéos de sa télé),
  `groupes/seances/<clé>/la/<q>.json` (j'y étais), `groupes/seances/<clé>/traces/<ms>-<q>-<hex>.json` (une réaction ou
  un mot, avec `video` et `t`), `groupes/seance-en-cours/<q>.json` (la séance où je suis, son salon, jusqu'à quand).
- **Qui note** : `entrerAuGroupe` (via `noterPresence`, qui rend maintenant les séances en cours) et « ▶ Entrer » d'une
  proposition (`entrer`, `groupes-serveur.ts`) appellent `entrerDansLaSeance`. Puis `ecrireAuSalon` appelle
  `noterDansLaSeance` : seulement dans le salon de la séance (« groupe-… », « chez:<q> », « theme:<thème> ») et tant
  qu'elle dure. Le téléphone dit où en est la vidéo (`ou: { video, t }`, `ouEnEstLaTele` dans `salon-ouvert.tsx`) ;
  sans `ou`, rien n'est noté (on ne devine pas une seconde).
- **La route** `GET /api/direct/rattrapage?de=<groupe|proposition>` → `{ seances }` ; `?seance=<clé>` → `{ seance }`
  (ses vidéos, ses traces, les figurines ; 410 après sept jours). Jamais un compte.
- Essai : `scripts/essai-rattrapage-route.mjs`.

## T2, dans le code

- **L'écran** : `/univers/rattrapage?seance=<clé>` (`app/univers/rattrapage/page.tsx`, `app/collection/rattrapage.tsx`).
  En haut « ⏪ Rattrapage », le nom de la séance et son heure (« Hier · 21 h ») ; la vidéo dans le lecteur de YouTube
  (s'il ne se charge pas, un simple cadre) ; plusieurs vidéos : des onglets.
- **La barre** : les marques des réactions (deux trop proches n'en font qu'une, sinon on ne pourrait pas les toucher) ;
  toucher une marque emmène la vidéo trois secondes avant.
- **Les fauteuils** : ceux qui étaient là en « souvenir » (pâlis), moi « Toi · en rattrapage » (allumé en rose), les
  absents grisés (les membres du groupe, ou ceux qui avaient leur place à l'essai ; la route les donne : `absents`, `moi`).
- **Le grand moment** : le lecteur dit sa seconde quatre fois par seconde ; quand elle passe celle d'une réaction, la
  figurine de celui qui l'a faite prend la scène (`GrandMoment`, comme au salon : la file, ×2 ×3, 🫶 côte à côte). Un saut
  (une marque touchée, un retour en arrière) ne rejoue rien.
- **Ce qui s'est dit** arrive à sa seconde, jamais avant (« 🔒 La suite arrive à sa seconde, pas avant. »).
- Essai : `scripts/navigateur/rattrapage.mjs` (un faux lecteur YouTube dont on règle la seconde).

## T3, dans le code

- **Sous le salon en rattrapage** : les six émotions des grands moments et « Écris au groupe… » avec « Ajouter à la
  séance ». La réaction ou le mot se pose à la seconde où j'en suis dans la vidéo ; « ✓ Ton 😂 est ajouté à la séance, à
  2:15. Le groupe le verra. » ; dans le fil : « Toi · à 2:15 · ⏪ vu en rattrapage » ; ma figurine prend la scène (et si
  un souvenir joue la même émotion à ce moment : 🫶 côte à côte).
- **La route** : `POST /api/direct/rattrapage { action: "reagir", seance, sorte, cle?, texte?, ou }` → `{ trace }`
  (`reagirEnDecale`) : ceux qui peuvent rattraper la séance, pendant ses sept jours ; la vidéo doit être celle de la
  séance ; un mot passe la modération des salons (90 signes) ; une à la fois (1,5 s, douze par minute :
  `groupes/seance-rattrapage/<q>.json`). La trace porte `rattrapage: true` et ma figurine (`src`) : la liste des séances
  dit « rattrapée par … », et ceux qui la revoient voient ma figurine réagir.
