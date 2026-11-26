# 👥 Mes groupes

L'onglet « Mes groupes » a pris la place d'« Autour » dans le menu le 26 novembre 2026 (décision du propriétaire, après
une discussion avec un ami : les salons sont vides quand on arrive le premier ; les rendez-vous concentrent les gens).

- Maquette validée (G0) : https://claude.ai/artifact/Syeeh2D6NSQTSiKYA9RuE1 (planches Mes groupes, ＋ Proposer, l'intérieur
  d'un groupe).
- Plan de développement : https://claude.ai/artifact/V2kVBjXJz1pVNdx4kFEM4N

## Ce qui est décidé

- **Menu** : Découvrir · Mes groupes · Messages · Ma maison. Autour devient une tuile 📍 de Ma maison ; son écran et son
  adresse (`#autour`) ne changent pas, et « Ma maison » reste allumé dans le menu quand on y est.
- **Découvrir**, c'est rencontrer par hasard, tout de suite. **Mes groupes**, c'est retrouver, à une heure. Les salons
  ouverts à tous restent seulement dans Découvrir ; le fil montrera parfois une pièce « On se retrouve ? » (lot G2).
- **Les quatre rangées** (noms validés) : Mes groupes actifs · Propositions de groupes · Avec mes proches · Tous mes
  groupes. Une rangée sans rien dedans n'est pas montrée : jamais une rangée vide, jamais un chiffre inventé.
- **Avec mes proches** : seulement l'existant, déplacé — ma télé du jour (ma séance à 4 places), les invitations devant la
  télé d'un proche, les séances en cours chez mes proches, les demandes de proche.
- Groupes ouverts aux inconnus : adultes seulement. Pas de votes chiffrés, pas de points. Le mot « famille » est déjà pris
  dans le code (les fantômes des commerces) : ne pas l'employer pour les groupes.
- Pas de migration : comme les salons, tout est rangé en fichiers JSON dans le stockage.

## Les lots

| Lot | Contenu | État |
| --- | --- | --- |
| G0 | Maquette | ✅ validée le 26 novembre 2026 |
| G1 | L'onglet, « Avec mes proches » (l'existant), Autour en tuile | ✅ fait (#295) |
| G2 | ＋ Proposer, Propositions de groupes, la pièce « On se retrouve ? » du fil | ✅ fait (#296) |
| G3 | Les rappels (cron toutes les 5 minutes) | ✅ fait (#297) |
| G4 | « On garde ce groupe ? », Tous mes groupes | ✅ fait (#298) |
| G5 | Rendez-vous (Je viens / Absent / Plus tard) et Discussion | ✅ fait (#299) |
| G6 | La sélection du jour, les rôles qui tournent | ✅ fait (#300) |
| G7 | Le journal | fait (PR à suivre) |
| G8 | Le groupe qui grandit | à faire |

## G1, dans le code

- `src/app/collection/mes-groupes.tsx` : l'écran (`#groupes`, `#mes-groupes`). « ＋ Proposer » ouvre ma séance
  (`/univers/salons?chez=moi`) en attendant le lot G2.
- `GET /api/direct/mes-groupes` → `{ invitations, demandes, seances }` (`mesInvitations`, `mesDemandes`,
  `seancesDesProches` de `salons-ouverts-serveur.ts`). Les gestes passent par la route des salons, comme avant
  (`pas-maintenant`, `repondre-proche`, `rejoindre`).
- La pastille de l'onglet : les invitations et les demandes qui attendent un geste (préparée en douce, `prechauffer`).
- Le haut du fil de Découvrir ne montre plus les invitations ni les demandes (seulement la surprise d'une visite). La
  page « Tous les salons » les garde encore, le temps que les essais navigateur suivent.
- La séance chez un proche reste aussi une pièce du fil (« Demander à les rejoindre »).

## G2, dans le code

- `src/lib/direct/groupes.ts` (partagé) : la proposition telle que l'écran la voit, l'heure de Paris (`aParis`,
  `quandLisible` : « Ce soir 21 h », « Demain 20 h 30 », « Samedi 21 h »), l'entrée (dix minutes avant, deux heures
  après), la modération du nom et du mot (celle des salons), les phrases. Vérifié sans téléphone :
  `node scripts/verifier-groupes.mjs`.
- `src/lib/direct/groupes-serveur.ts` : un fichier par personne dans le seau — `groupes/propositions/<id>.json`,
  `groupes/places/<id>/<q>.json`, `groupes/horaires/<id>/<q>.json`, `groupes/signalements/<id>/<q>.json`.
- La route `/api/direct/mes-groupes` : `GET` ajoute `propositions` et `adulte` ; `POST` `proposer`, `confirmer`,
  `laisser`, `autre-heure` (celui qui propose : il prend l'heure), `retirer`, `signaler`, `entrer`. Essai :
  `scripts/essai-mes-groupes-route.mjs`.
- L'écran « ＋ Proposer » : `src/app/collection/proposer-groupe.tsx` (la carte en aperçu pendant qu'on la fait). La
  rangée « Propositions de groupes » et la feuille « 🕘 Un autre horaire ? » : `mes-groupes.tsx`.
- Le fil de Découvrir : une pièce `rdv` (« 📣 On se retrouve ? »), la prochaine proposition ouverte à tout le monde
  d'un autre, où il reste une place, ses passions d'abord ; « Je confirme ma place » sans quitter le fil.

Les règles :

- **Qui voit quoi.** Tout le monde : les adultes seulement (celui qui propose et celui qui regarde). Entre proches : les
  proches de celui qui propose, des deux côtés. Les 15-17 ans ne proposent et ne voient qu'entre proches.
- **Jamais de zéro.** Celui qui propose a sa place : une proposition montre au moins « 1/8 ».
- **Maintenant et pour tout le monde** : pas de proposition, on va au salon de la passion.
- **À l'heure dite** (dix minutes avant, deux heures après), « ▶ Entrer » : tout le monde → le salon de la passion dans
  Découvrir ; entre proches → la séance de celui qui propose (`preparerLeRendezVous` dans `salons-ouverts-serveur.ts` :
  ceux qui ont leur place y sont invités, la télé se cale sur la vidéo choisie quand l'hôte entre).
- Trois propositions à venir par personne ; trois signalements et la proposition disparaît ; `CLIKME_GROUPES_OUVERTS=0`
  met en pause les propositions ouvertes à tout le monde (celles entre proches restent).
- Les rappels (« Ta Soirée foot commence dans 10 minutes ») : voir G3.

## G3, dans le code

- `rappelerLesGroupes` (`lib/direct/groupes-serveur.ts`) : pour chaque proposition dont l'heure tombe entre quinze minutes
  avant et trente minutes après (`RAPPEL_AVANT_MS`, `RAPPEL_APRES_MS`), une notification « 🔔 Soirée foot commence dans
  10 minutes » à chacun de ceux qui ont leur place, une seule fois par heure de rendez-vous (`groupes/rappels/<id>.json`
  garde l'heure déjà rappelée ; si l'heure change, un nouveau rappel partira). Le toucher ouvre `/collection#groupes`.
- Une autre heure proposée : celui qui propose l'apprend tout de suite (« 🕘 Zoé propose demain 21 h à la place »).
  Celui qui propose prend une autre heure : ceux qui ont leur place l'apprennent (« 🕘 Soirée foot passe à … »), leur
  place est gardée.
- La route `GET /api/cron/groupes-rappels` (garde `CRON_SECRET`). Elle est appelée toutes les cinq minutes par GitHub
  (`.github/workflows/clikme-groupes-rappels.yml`), parce que Vercel en offre gratuite n'accepte qu'une tâche par jour.
  Le secret `CRON_SECRET` du dépôt GitHub doit être le même que sur Vercel ; la variable `CLIKME_URL` change l'adresse
  du site si besoin (par défaut `https://www.clikme.fr`). En offre Pro, on pourra passer la tâche dans `vercel.json`.
- Essai : `scripts/essai-groupes-rappels-route.mjs` (de vrais téléphones abonnés au faux service de notifications ;
  `?dans=<minutes>` fait comme si le temps avait passé, seulement pour les essais ou avec `CRON_SECRET`).

## G4, dans le code

- **« On garde ce groupe ? »** : quarante-cinq minutes après l'heure d'une proposition, et pendant deux jours
  (`GARDER_DES_MS`, `GARDER_JUSQUA_MS`), la carte devient la carte de fin pour ceux qui y avaient leur place (deux au
  moins) : leurs figurines, une coche ✓ pour ceux qui ont gardé, « 💛 Garder ce groupe ». Ceux qui gardent forment le
  groupe : il naît au deuxième (`MEMBRES_MIN`), il garde le nom, le mot et la passion de la proposition
  (`idDuGroupe` : « g-<id de la proposition> »). Celui qui garde le premier voit « ✓ Gardé · Le groupe naît dès qu'un
  autre le garde aussi. »
- **Un groupe avec mes proches** (« ＋ Créer », ou la carte ＋ au bout d'« Avec mes proches » tant que je n'ai aucun
  groupe) : un nom, une passion, des proches (ceux avec qui je parle), un mot. Le groupe existe tout de suite pour moi ;
  mes proches le voient dans « Tous mes groupes » (« 👥 Léa te propose ce groupe ») avec une notification, et le gardent
  ou disent « Non merci ».
- **Trois groupes au plus** par personne pour commencer (`GROUPES_MAX`), dit seulement quand on l'atteint.
- **Rangées** : « Mes groupes actifs » (seulement ceux où quelqu'un est dans le salon, cachée sinon), « Tous mes
  groupes » (la table de chacun, ses membres autour ; « ● 2 dans le salon » ou « 🕑 Passage de Zoé à 14 h »). Un groupe
  n'est visible que par ses membres.
- **Son espace** (`groupe-espace.tsx`) : son identité (passion, nom, mot), son salon attitré (qui y est, sinon le dernier
  passage, « Entrer »), puis ses onglets (G6 : 🎬 Aujourd'hui ; G5 : 📅 Rendez-vous, 💬 Discussion ; G7 : 📖 Journal ; 👥
  Membres).
- **Son salon** : `/univers/salons?groupe=<id>` (action `entrer-groupe` de la route des salons, `entrerAuGroupe`). C'est
  un salon privé (« groupe-<id> », dans `decouvrir/salons/prives/`), à ses membres seulement, comme un salon ouvert de
  sa passion : le gradin, les vidéos de la passion, huit places, la conversation. Il ne dépend pas de l'interrupteur
  des salons ouverts. En entrant, on laisse son passage.
- **Stockage** (`groupes-chemins-serveur.ts`) : `groupes/groupes/<id>.json` (l'identité, écrite une fois),
  `groupes/membres/<id>/<q>.json` (chacun écrit la sienne), `groupes/miens/<q>.json` (mes groupes),
  `groupes/invites/<id>/<q>.json` et `groupes/invitations/<q>/<id>.json` (les proches invités),
  `groupes/passages/<id>/<q>.json`.
- Route : `GET /api/direct/mes-groupes` renvoie aussi `groupes` ; `POST` `garder`, `creer-groupe`, `garder-groupe`,
  `non-merci`. Essai : `scripts/essai-groupes-gardes-route.mjs`.

## G5, dans le code

- **📅 Rendez-vous** (`groupe-vie.tsx`, `groupes-vie-serveur.ts`) : les habitudes du groupe — chaque jour (« 🌙 Le
  rendez-vous du soir · chaque soir · 21 h »), chaque semaine (« La découverte du mercredi ») — et les séances
  exceptionnelles (une seule fois, ⭐). N'importe quel membre en pose un (« ＋ Un rendez-vous » : son nom, chaque jour /
  chaque semaine et son jour / une seule fois et son jour, l'heure) ; six au plus (`RDV_MAX`) ; celui qui l'a posé le
  retire. Pour sa prochaine fois (`prochaineFois`, ouverte jusqu'à deux heures après l'heure), chacun répond ✓ Je viens,
  Absent ou Plus tard (« Tu retrouveras la séance et ses réactions plus tard ») ; on voit les têtes de ceux qui
  viennent, jamais un nombre. À l'heure (dix minutes avant), la carte a « Entrer » vers le salon du groupe.
- **Le rappel** : la tâche des cinq minutes (G3) prévient aussi ceux qui ont dit « Je viens » : « 🔔 Le rendez-vous du
  soir commence dans 10 minutes », une fois par fois (`groupes/rappels-rdv/<groupe>/<rdv>.json`).
- **La table** d'un groupe, dans Tous mes groupes, dit « 📅 Prochain : Le rendez-vous du soir · Ce soir 21 h ».
- **💬 Discussion** : quelques mots entre deux rencontres, 90 signes, la modération des salons (liens, numéros, questions
  personnelles…). Le nom d'un rendez-vous peut dire « rendez-vous » (refusé dans les salons ouverts) : c'est le mot du
  groupe.
- **💡 Une idée de séance** (dans la discussion) : son nom, son jour, son heure. Elle arrive dans la discussion (« Une
  séance « … » ? », « Partant ! ») ; à deux partants (`PARTANTS_MIN`), elle entre dans les rendez-vous (« ⭐ « … » arrive
  dans les rendez-vous »).
- **Stockage** : `groupes/rdv/<id>/<rdv>.json` (écrit par celui qui le pose), `groupes/reponses/<id>/<rdv>/<q>.json`
  (chacun la sienne, avec la fois à laquelle elle répond), `groupes/discussion/<id>/<message>.json`. Une séance
  exceptionnelle passée s'efface à la lecture suivante.
- Route : `GET /api/direct/mes-groupes?groupe=<id>` → `{ vie }` (membres seulement) ; `POST` `rdv-ajouter`,
  `rdv-repondre`, `rdv-retirer`, `ecrire-groupe`. Essai : `scripts/essai-groupes-vie-route.mjs`.

## G6, dans le code

- **🎬 Aujourd'hui** (le premier onglet de l'espace d'un groupe ; `groupe-jour.tsx`, `groupes-jour-serveur.ts`) :
  « Aujourd'hui : ⚽ foot ». La sélection du jour : la vidéo que chaque membre propose aujourd'hui (« ＋ Proposer la
  mienne » : de sa télé du jour, ou un lien YouTube, et « Pourquoi elle ? »), sa tête sur la vignette et son mot ; puis
  les nouveautés de la passion (la sélection du jour des salons : trois quand personne n'a rien proposé, deux sinon).
- **🙋** : chacun lève la main pour celles qu'il veut ce soir ; on voit les têtes, jamais un nombre. À deux mains
  (`ENVIES_RETENUE`), « ✓ Ce soir » : la vidéo ouvre la télé du salon du groupe (`videosRetenues`, lue par
  `entrerAuGroupe`), avant les vidéos de la passion. Celui qui propose a la main levée d'office.
- **Ce soir, chacun son rôle** (`rolesDuJour`) : 🎬 La vidéo, 💬 Le sujet, 🔎 La découverte, 📅 La prochaine — autant
  de rôles que de membres (quatre au plus) ; chaque jour, chacun prend le suivant (l'ordre des membres est fixe). Pas de
  points. « C'est ton tour » : 🎬 ouvre « Ma vidéo du jour », 🔎 la même avec un lien, 💬 la discussion, 📅 « ＋ Un
  rendez-vous ».
- **Stockage** : `groupes/jour/<id>/<jour>/<q>.json` (ma vidéo du jour et mon mot), `groupes/envies/<id>/<jour>/<q>.json`
  (mes 🙋, avec les fiches des vidéos pour que le salon puisse les passer).
- Route : `GET /api/direct/mes-groupes?groupe=<id>` renvoie aussi `aujourdhui` ; `POST` `jour-proposer`,
  `jour-retirer`, `jour-envie` (`{ video, oui }` → `retenue` quand ma main est la deuxième). Essai :
  `scripts/essai-groupes-jour-route.mjs`.

## G7, dans le code

- **📖 Journal** (`groupe-journal.tsx`, `groupes-journal-serveur.ts`) : notre histoire sur une ligne de temps, du plus
  récent (en haut) à la naissance du groupe (tout en bas, en rose), rangée par jour (« Aujourd'hui », « Hier »,
  « Mardi », « Le 12 novembre »). Seulement ce qui s'est vraiment passé, lu dans ce que le groupe a déjà rangé :
  - ✨ « Le groupe est né » (« après « Soirée foot » », ou « créé par Léa ») ; 👋 « Sam a rejoint le groupe » (les
    fiches des membres, sans les fondateurs) ;
  - 📅 « Nouveau rendez-vous : … » (« chaque soir · 21 h · posé par Léa ») ; 💡 « L'idée de Zoé est devenue une
    séance » (à son deuxième « Partant ! ») ;
  - 🎬 « La vidéo de Léa, choisie pour la séance » (deux 🙋, les sept derniers jours ; sa vignette, son mot) ;
  - 🛋️ les séances : le nom du rendez-vous, « Ils étaient là » et leurs têtes.
- **Qui était là** : en entrant dans le salon du groupe à l'heure d'un rendez-vous (dix minutes avant, deux heures
  après), `entrerAuGroupe` appelle `noterPresence`, qui écrit `groupes/journal/<id>/<fois>-<q>-<rdv>.json` (une fois par
  séance et par personne). C'est le seul fichier propre au journal ; tout le reste est relu.
- Les moments de la séance (le fou rire, le débat, celle qui a tout fait réagir) viendront quand le salon les
  retiendra : rien n'est inventé en attendant.
- Route : `GET /api/direct/mes-groupes?groupe=<id>&journal=1` → `{ journal }` (membres seulement ; lu à l'ouverture de
  l'onglet). Essai : `scripts/essai-groupes-journal-route.mjs`.
