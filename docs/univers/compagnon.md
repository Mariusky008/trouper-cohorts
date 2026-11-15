# Le compagnon — un animal qui vit dans l'univers (lot C, cahier des charges, 15 novembre 2026)

**Statut : proposé au propriétaire, pas encore validé.** Écrit après la maquette (`maquettes/compagnon.html`), qu'il a
demandée. Aucun développement n'a commencé. **Qui le construit : la session de l'univers** (la maison, la scène « chez
moi », les visites) ; ce qui touche la scène de la conversation (`proches.tsx`) se fait en prévenant, une seule session
à la fois sur ce fichier.

## 1. Ce que le propriétaire a demandé

Le 15 novembre 2026 :

> « Que penses-tu que dans mon univers, ou l'univers commun aux deux personnes qui discutent ensemble, il y ait un
> animal qui bouge dans la scène pour donner de la vie ? Par exemple, si c'est moi qui contacte quelqu'un, alors c'est
> dans mon univers que la personne vient, donc j'ai eu le choix au départ d'un animal de compagnie : un chat, une
> panthère, un perroquet, etc. Et cet animal, quand la personne est chez moi, bouge, se déplace, ronronne sur mes
> genoux par exemple quand rien ne se passe… »

Puis, après la maquette, ses réponses :

| Question | Sa réponse |
|---|---|
| L'invité peut-il venir avec son propre animal ? | « Si c'est facile, oui : comme ça les deux animaux interagissent ensemble. » |
| Peut-on lui donner un nom ? | Oui. |
| Offert à tous, ou débloqué ? | Offert à tous. |

## 2. En une phrase

Chacun peut avoir **un compagnon** (un chat, un chien, un perroquet…), choisi et nommé en créant son univers ; **chez
soi, c'est le sien qui accueille**, l'invité vient avec le sien, et les deux vivent avec la conversation : ils
réagissent aux messages, jouent ensemble, et viennent sur les genoux quand rien ne se passe.

## 3. Ce que la maquette a montré

`docs/univers/maquettes/compagnon.html` (à ouvrir dans un navigateur, à la largeur d'un téléphone), en huit moments :
choisir et nommer son compagnon ; Sam arrive avec le sien, ils se reniflent ; un message (les oreilles se dressent) ;
un fou rire (il saute) ; le calme (sur les genoux, il ronronne ; l'autre s'endort) ; ils jouent (une pelote) ; chez
Sam (c'est le sien qui accueille, le mien vient avec moi) ; les règles. Les animaux y sont **dessinés** pour la
maquette ; les vrais seraient des figurines animées (section 6).

## 4. Les règles

### 4.1 Le choix et le nom

- **Offert à tous.** Il se choisit **à la fin de la création de son univers**, par Pablito : « Un compagnon chez toi ? Il
  t'attendra, et il accueillera tes proches. » Trois espèces au départ (section 6.1), et « Pas maintenant ».
- **Ceux qui ont déjà leur univers** le voient proposé une fois, dans « Ma maison » (une carte, jamais une fenêtre qui
  bloque).
- **Son nom** : 2 à 16 signes, des lettres, des espaces, des tirets, des apostrophes ; un mot interdit est refusé
  (`motInterdit`, la phrase d'aujourd'hui). Un nom proposé par défaut selon l'espèce (« Moustache », « Pirate »,
  « Coco »), qu'on change.
- **On le change quand on veut** (« 🐾 Mon compagnon », dans « Mon univers ») : une autre espèce, un autre nom, ou plus
  d'animal du tout. Rien n'est perdu ni payant.

### 4.2 Chez qui on est

- **Dans la scène de la conversation « chez moi », dans « Ma maison » et pour mes visiteurs** (`/univers/chez/<clé>`) :
  **mon compagnon accueille.**
- **L'invité vient avec le sien** (s'il en a un). Chez l'autre, c'est l'inverse : son compagnon accueille, le mien vient
  avec moi.
- **Les pièces vivantes** (`piece-vivante.tsx`) : le compagnon de l'hôte peut s'y trouver aussi (plus tard, lot C4).

### 4.3 Ce qu'il fait

Ses gestes viennent de ce qui se passe dans la scène, que le téléphone sait déjà ; **aucun appel au serveur, aucun
modèle, rien qui coûte** :

| Ce qui se passe | Ce qu'il fait |
|---|---|
| L'invité arrive (il ouvre la conversation chez moi) | Mon compagnon dresse les oreilles, va à sa rencontre ; s'il vient avec le sien, ils se reniflent (des cœurs) |
| Un message arrive | Les oreilles se dressent, la tête se tourne vers celui qui parle |
| Une figurine éclate de rire (la tête « fou rire ») | Il sursaute ou saute de joie |
| **Une minute sans rien** (ni message, ni geste) | Il vient sur les genoux de son maître et ronronne (un chat), s'y endort (un chien) ; celui de l'invité s'endort aux pieds du sien |
| De temps en temps, quand la conversation se repose | Les deux jouent (une pelote, une balle), puis se couchent côte à côte |
| On le touche | Il fait un câlin (des cœurs) ; sur les genoux, il ronronne plus fort ; son nom s'affiche |
| La nuit (l'heure du téléphone) | Il dort plus souvent |

- **Rare plutôt que constant** : un geste toutes les 15 à 30 secondes au plus, hors des réactions. Un animal qui bouge
  tout le temps fatigue en deux jours.
- **Il ne cache jamais l'essentiel** : ni le visage d'une figurine, ni une bulle, ni un bouton. Il passe derrière la
  table, ou devant, selon la profondeur (section 6.3).
- **Jamais de corvée** : ni faim, ni tristesse, ni rien qui se dégrade si on ne vient pas. Le compagnon donne envie de
  revenir ; il ne culpabilise pas.
- **Moins d'animations demandées** (le réglage du téléphone) : il reste assis, il cligne des yeux, rien d'autre.

### 4.4 Le son

- Un **vrai bruitage enregistré** (un ronronnement, un petit aboiement de joie, un cri de perroquet), choisi et validé
  par le propriétaire. Ce n'est pas une voix, mais **rien n'est fabriqué par une IA**.
- **Coupé au départ**, il suit le son de la conversation, et il est toujours doux.

## 5. Les données et les routes

- **`<habitant>/compagnon.json`** = `{ espece, nom, choisi_le, version }` ; pas de table, pas de migration. Effacé avec
  le compte.
- **Les vues qui le portent** : la conversation chez quelqu'un (le compagnon de l'hôte, celui de l'invité), « Ma maison »
  (`/api/direct/univers`), la visite (`VueVisite`). Seuls l'espèce et le nom sortent ; ils se voient de ceux qui peuvent
  déjà entrer chez lui.
- **Choisir, renommer, retirer** : une action de la route de l'univers (`compagnon`, avec `espece` et `nom`), vérifiée
  côté serveur (l'espèce connue, le nom valide).
- **Le frein** : `CLIKME_COMPAGNON=0` chez l'hébergeur (plus de compagnon nulle part ; les choix restent rangés).

## 6. La fabrication

### 6.1 Peu d'espèces, bien faites

- **Au départ : le chat, le chien, le perroquet.** La panthère, le lapin, le renard, le hibou viennent ensuite, selon ce
  que les gens choisissent (la mesure, section 8).
- **Un seul pelage par espèce** au départ ; des variantes (tigré, noir, roux…) plus tard.
- **À l'échelle des figurines** : de petits jouets en vinyle, dans leur style (grosse tête, yeux brillants, joues roses).
  Une panthère en bébé, qui tient sur des genoux.

### 6.2 Les animations : un catalogue, pas une fabrication par personne

- Les compagnons sont **les mêmes pour tous** : on les fabrique **une fois**, ils sont servis comme des fichiers de
  l'appli. Aucun coût par personne.
- **Par espèce, sept boucles courtes** (1 à 3 secondes, sans couture), sur fond transparent : assis (la queue, le clin
  d'œil) ; marche ; couché, qui dort ; sur les genoux (ronronne) ; alerte (les oreilles) ; saut de joie ; renifle.
  Plus, pour jouer : bondir sur une pelote.
- **Comment les faire** : une image de référence par espèce, dans le style des figurines (le moteur d'image) ; puis
  chaque boucle par le moteur vidéo déjà branché (`commanderUneVideoGoogle`, `pieces-vivantes-serveur.ts`), sur un fond
  uni ; le fond est retiré **une fois, à la fabrication** (un outil dans `outils/`, avec ffmpeg sur la machine de
  fabrication : l'appli, elle, n'a pas ffmpeg).
- **Les formats** : WebM avec transparence (Chrome, Android) et HEVC avec transparence (Safari, iPhone) ; une image fixe
  si rien ne se lit. 150 à 400 Ko par boucle, gardées en cache.
- **Le risque principal** : des boucles propres, constantes et dans le style, faites par un moteur vidéo. **C'est ce que
  décide le premier essai** (lot C0), avant tout le reste.

### 6.3 Où il se tient

- **Les zones de chaque décor** : où il marche (le sol devant les places), où il se perche (une table, une étagère), où
  il se couche, et les genoux (d'après les places de la fiche, `scene.places`). Le modèle qui repère déjà les places, les
  étagères et les vedettes d'une pièce les repère aussi, une fois le décor fait. Sans zones, une seule ligne de sol
  devant les places.
- **La profondeur** : sur le canapé, il passe derrière la table (le calque de devant) ; au sol ou sur la table, devant.
  Sa taille suit la profondeur.
- **Deux compagnons** : chacun garde sa zone (celui de l'hôte près de l'hôte), et ils se rejoignent pour les gestes à
  deux (se renifler, jouer, dormir côte à côte), quelques petites scènes écrites pour toutes les paires d'espèces.

## 7. Ce qu'on voit, écran par écran

1. **À la fin de la création de son univers** : Pablito, « Un compagnon chez toi ? », les trois espèces (leurs boucles
   « assis »), « Pas maintenant » ; puis « Comment s'appelle-t-il ? » ; « C'est mon compagnon » : il apparaît dans son
   univers, vient s'asseoir, son nom s'affiche.
2. **Dans « Ma maison »** : il vit dans son univers (les gestes rares, la sieste) ; un toucher, un câlin.
3. **Dans la conversation chez moi** : il accueille l'invité (et son compagnon), puis vit avec la conversation (4.3).
4. **Chez l'autre** : son compagnon accueille, le mien est avec moi.
5. **« 🐾 Mon compagnon »**, dans « Mon univers » : changer l'espèce, le nom, ou « Plus de compagnon ».

## 8. Ce qu'on mesure

Dans la page admin des mèmes :

| Mesure | Ce qu'elle dit |
|---|---|
| Part de ceux qui en choisissent un, et quelle espèce | Si l'idée plaît, et quelles espèces fabriquer ensuite |
| Part de ceux qui changent le nom proposé | S'ils s'y attachent |
| Caresses par jour | S'il amuse encore au bout d'une semaine |
| Temps passé dans une conversation, avec et sans compagnon (le frein, sur une partie des gens) | S'il fait rester |
| Retours au bout de 7 jours, avec et sans | S'il fait revenir |

## 9. Les essais

- **Le serveur** : choisir, renommer, retirer ; un nom refusé (trop long, un mot interdit) ; une espèce inconnue ; le
  compagnon de l'hôte et celui de l'invité dans la vue de la conversation ; le frein.
- **Le navigateur** : il apparaît après le choix ; il accueille l'invité ; un message (l'état « alerte ») ; une minute
  sans rien (accélérée dans l'essai) : sur les genoux ; deux compagnons, la scène à deux ; chez l'autre, les rôles
  inversés ; « moins d'animations » : il reste assis ; rien ne déborde, jamais le mot interdit.

## 10. Les phrases à valider

| Où | Phrase |
|---|---|
| Le choix (Pablito) | « Un compagnon chez toi ? Il t'attendra, et il accueillera tes proches. » |
| Le nom | « Comment s'appelle-t-il ? » |
| Valider | « C'est mon compagnon » |
| Ne pas en prendre | « Pas maintenant » |
| La carte dans « Ma maison » | « 🐾 Un compagnon pour ton univers ? » |
| Le réglage | « 🐾 Mon compagnon » ; « Plus de compagnon » |
| Un nom refusé | « Ce nom-là ne passe pas. Essaie autre chose 🙂 » |

## 11. Les choix faits par défaut

Le propriétaire peut revenir sur chacun.

| Point | Choix | L'autre choix |
|---|---|---|
| Les espèces au départ | Chat, chien, perroquet | Plus d'espèces dès le départ, moins finies |
| Le calme avant les genoux | Une minute sans rien | Trente secondes, ou deux minutes |
| La fréquence des gestes | Un toutes les 15 à 30 secondes | Plus vivant, au risque de lasser |
| Le son | Coupé au départ | Allumé, très doux |
| Le pelage | Un par espèce | Le choix du pelage dès le départ |
| Dans les mèmes et les vidéos envoyées | Pas au départ | Le compagnon apparaît aussi dans les mèmes |

## 12. Les lots

| Lot | Ce qu'il livre |
|---|---|
| **C0 — L'essai de fabrication** | Le chat : son image de référence et ses sept boucles, faites par les moteurs, le fond retiré ; montrées sur iPhone et Android, à côté des figurines. Le verdict du propriétaire (le style, la constance, le poids), et le vrai coût. **Rien d'autre ne commence avant.** |
| **C1 — Le choix et le nom** | `compagnon.json`, la route, l'écran de Pablito, la carte de « Ma maison », « Mon compagnon » ; le compagnon assis dans son univers (« Ma maison », les visites). |
| **C2 — La vie dans la scène** | Les gestes (4.3), les zones des décors (6.3), la conversation chez moi, le toucher, la nuit, « moins d'animations ». |
| **C3 — L'invité vient avec le sien** | Deux compagnons, les scènes à deux, chez l'autre. |
| **C4 — La suite** | Le chien et le perroquet (s'ils ne sont pas faits en C0), le son, les pièces vivantes, d'autres espèces selon la mesure. |

**Le coût** : la fabrication, une fois — par espèce, une image de référence (quelques centimes) et une dizaine de
vidéos de quatre secondes, essais compris (environ 0,40 $ chacune) : **5 à 10 $ par espèce**. Ensuite, rien par
personne.
