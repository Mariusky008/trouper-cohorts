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
| 1 | Ma maison épurée, le bouton « ✨ Ma figurine », l'écran « Mon double du jour », la même figurine partout | ce document, section 2 |
| — | « Elle change toute seule » : la série 🔥 (une auréole à 7 jours), l'accessoire de sa passion, le cœur-souvenir « offert par Sam » — des calques posés par-dessus, sans nouvelle image | juste après le lot 1 |
| 2 | « Pendant ton absence » : de vrais noms, de vrais chiffres | à faire |
| 3 | L'image à partager | à faire |
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
