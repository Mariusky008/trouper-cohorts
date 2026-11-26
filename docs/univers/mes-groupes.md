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
| G1 | L'onglet, « Avec mes proches » (l'existant), Autour en tuile | ✅ ce lot |
| G2 | ＋ Proposer, Propositions de groupes, la pièce « On se retrouve ? » du fil | à faire |
| G3 | Les rappels (cron toutes les 5 minutes) | à faire |
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
