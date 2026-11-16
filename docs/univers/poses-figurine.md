# Les poses de la figurine — l'essai P0 (16 novembre 2026)

**Statut : essai réservé à l'administrateur, à juger par le propriétaire.** Rien ne change pour les habitants.

## 1. Ce que le propriétaire a demandé

Après la maquette de la messagerie visuelle (la scène du duo vivante : bulles, gestes, télé, nuit, météo, le chat), la
question « quand tu dis "on lance les poses des figurines", tu veux dire quoi ? », puis : « attaque aussi les figurines ».

Aujourd'hui, chaque figurine n'existe que dans **une seule image, assise dans son fauteuil**. Elle peut respirer, se
pencher, danser sur place ; mais si elle se déplace, on voit le fauteuil vide derrière elle. Les idées de son ami (se
lever, aller à la télé, rejoindre l'autre pour un câlin, prendre un souvenir sur l'étagère) demandent deux choses :

1. **des poses** de chaque figurine, sur un fond transparent, faites une fois ;
2. **des endroits** dans chaque pièce : son siège, devant la télé, près de l'étagère, à côté de l'autre.

## 2. L'essai

**Où** : `/admin/humain/univers-essais`, « 🧍 Les poses de ta figurine (P0) ». Sur la figurine de ce téléphone (celle
du propriétaire, du nouveau style).

**Les neuf poses** (`POSES_FIGURINE`, `lib/direct/poses-figurine.ts`) : debout ; qui marche (deux pas, qui
s'enchaînent) ; assise sans fauteuil, tournée de trois quarts ; de dos (elle regarde la télé) ; qui danse ; qui fait
coucou ; une tasse de chocolat chaud ; les bras ouverts (un câlin).

- **« Debout » d'abord**, d'après la figurine assise : le moteur invente une fois ses jambes et ses chaussures.
- **Les autres d'après la figurine assise ET la pose debout** (le visage et la tenue de l'une, les jambes et
  l'échelle de l'autre) ; le second pas aussi d'après le premier.
- Chacune est détourée au plus près (le bas de l'image, ce sont ses pieds) et rangée à part :
  `poses-figurine/<empreinte de la figurine>/<pose>.png`. Une nouvelle figurine (sa tenue du mois) : de nouvelles poses.
- Environ 0,20 $ la pose, 1,80 $ les neuf (`lib/direct/poses-figurine-serveur.ts`,
  `app/api/admin/direct/poses-figurine`).

**La scène** : dans une pièce du duo déjà faite (vide), sa figurine assise à la place de gauche. Les gestes : 🧍 se
lever, 📺 aller à la télé (elle y marche, puis la regarde, de dos), 💃 danser, 📚 aller à l'étagère, 🤗 rejoindre l'autre
place (les bras ouverts), 👋 coucou, ☕ un chocolat chaud, 🪑 s'asseoir ; « ▶ Tout jouer » les enchaîne.

**Les endroits** (`ancresDeLaPiece`) viennent du relevé de la pièce (`releve.json`, section 8 de `piece-du-duo.md`) :
sa place est celle de gauche ; ses pieds, debout, sont là où ils pendent assise ; devant la télé ou l'étagère, un peu
plus loin (plus haut dans l'image, un peu plus petite) ; à côté de l'autre, juste à gauche de son siège. « Voir les
endroits » les montre. Une pièce sans télé ni étagère posées le dit.

**Son avis** : « 👍 C'est bien ma figurine, dans chaque pose », « 😐 Presque : un détail change », « 👎 Ce n'est plus
elle », et un mot — rangé avec ses poses (`avis.json`).

## 3. Ce qu'on juge

1. **La ressemblance d'une pose à l'autre** : le visage, la coiffure, la tenue, les chaussures. C'est le vrai risque.
2. **Les tailles** : chaque pose a sa hauteur, comparée à la pose debout (`taille` : les bras levés dépassent la tête ;
   assise, elle est plus petite). Si une pose paraît trop grande ou trop petite dans la scène, ce chiffre se règle.
3. **La marche** : deux images qui alternent, et un petit rebond. Si elle fait « autocollant qui glisse », la suite
   serait une boucle vidéo par pose (comme le chat : la pose sur un fond vert, retiré dans le téléphone, environ 0,40 $).

## 4. Ce qui viendra après son avis (rien n'est commencé)

- **Les poses pour tous** : faites à la création de la figurine (puis à chaque tenue du mois), dans l'ordre de l'essai.
- **La messagerie visuelle** : la scène du duo y gagne les déplacements (se lever, aller à la télé, rejoindre l'autre).
- **À trancher avec l'image du duo** (`piece-du-duo.md`, section 10 : les deux figurines peintes une fois dans la pièce,
  fixes) : une figurine qui se lève laisse son siège ; il faudrait alors la pièce avec l'autre seule. À décider après
  l'essai, avec la session des messages.

## 5. Les essais

`scripts/essai-poses-figurine-route.mjs` (les gardes, « debout » d'abord, d'après quoi chaque pose se fait, le second
pas après le premier, refaire, l'avis, une nouvelle figurine) et `scripts/navigateur/poses-figurine.mjs` (la dernière
pose faite à l'écran, la scène : se lever, aller à la télé, danser, rejoindre l'autre, s'asseoir, tout jouer, les
endroits, une pièce sans télé, l'avis gardé).
