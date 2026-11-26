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
| G2 | ＋ Proposer, Propositions de groupes, la pièce « On se retrouve ? » du fil | ✅ ce lot |
| G3 | Les rappels (cron toutes les 5 minutes) | fait (PR à suivre) |
| G4 | « On garde ce groupe ? », Tous mes groupes | à faire |
| G5 | Rendez-vous (Je viens / Absent / Plus tard) et Discussion | à faire |
| G6 | La sélection du jour, les rôles qui tournent | à faire |
| G7 | Le journal | à faire |
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
