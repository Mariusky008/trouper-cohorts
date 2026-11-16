# « Ma maison » — la pièce de chacun : le cahier des charges

**Statut : écrit le 16 novembre 2026 au soir, d'après les décisions du propriétaire du même jour (section 1).** Les deux
sessions le lisent avec `docs/univers/salon-du-duo.md` : la même pièce sert au salon du duo et à la maison de chacun. On
le change par une PR qui le dit dans son titre, et l'autre session en est prévenue (`docs/reprise.md`).

**Ce que ce cahier remplace.** L'univers fabriqué pour chacun (la conversation avec Pablito qui le décrit, les
ambiances, le décor généré, l'univers vivant en vidéo, le décor du mois : `feuille-de-route.md`, lots 3 et 4, et
`docs/reprise.md`, 0 sexies) sort du parcours. Le code reste, éteint ; ceux qui ont déjà un univers le gardent tant
qu'ils n'ont pas choisi une pièce (section 3).

---

## 1. Les décisions du propriétaire (16 novembre 2026, au soir)

Après les maquettes « Ma maison » (la chambre de Camille, 15 ans ; la maison d'un adulte avec sa vraie figurine) :

> « Ne devrions-nous pas uniformiser les univers ? C'est-à-dire : au départ on choisit son univers en fonction de son
> âge, donc pas besoin de parler à Pablito de sa vie pour qu'il fabrique un univers ; on choisit juste parmi les
> univers disponibles, et après l'inscription on arrive dans notre univers, où on va pouvoir y placer des choses ; et si
> on ne place rien, elles viendront s'y mettre quand on est sur la messagerie et qu'on garde des choses pour les mettre
> dans son univers. »
>
> « La pièce du duo — il y en a huit — doit être aussi une pièce solo qu'on aura choisie […] avec un siège au centre,
> comme pour la maison de Camille, qui est top ; donc garder cette pièce comme neuvième […] et avoir tout autour de
> nous, et donc pas de deuxième ou troisième pièce pour le moment. »

Puis, à nos deux questions :

> Le salon du duo devient-il une pièce large ? « Non, pas forcément, elle est bien comme tu l'as faite sur la maquette,
> mais peut-être faudrait-il refaire les images pour qu'elles aient les mêmes proportions et dimensions, et intègrent
> les mêmes éléments que tu as faits sur la maquette du salon du duo. »
>
> Les figurines posées sur la pièce (et non peintes dans une image du duo) ? « OK. »

Et sur « Découvrir » (« quand je mets quelque chose dans ma maison, ça l'envoie automatiquement dans Découvrir ? ») :
non, rien n'y part sans un geste (section 8) ; c'est déjà la règle de l'appli pour les mèmes et les univers.

**Ce qui est décidé :**

1. **Un catalogue de neuf pièces, le même pour tous** : les huit du salon du duo (`PIECES_DUO`) et la chambre musicale
   (la maison de Camille), fabriquées une fois.
2. **Chaque pièce a deux images** : en hauteur pour le salon du duo, cadrée comme la maquette du salon ; en largeur
   pour la maison de chacun, qu'on parcourt au doigt, le centre libre (section 2).
3. **Une seule pièce par personne**, pour le moment.
4. **À l'inscription, on choisit sa pièce** ; l'âge donne l'ordre des propositions. Pablito ne fabrique plus rien
   (section 3).
5. **Les figurines sont posées sur la pièce**, avec leur fauteuil : seule au centre chez soi, à deux aux deux places
   dans le salon du duo. Rien n'est généré à l'ouverture (section 4).
6. **La maison se remplit toute seule** avec ce qu'on garde dans ses conversations, et à la main avec « ＋ Ajouter chez
   moi » (sections 5 et 6).
7. **Rien ne part dans « Découvrir » sans un geste** (section 8).

---

## 2. Le catalogue : neuf pièces, deux images chacune

| Clé | La pièce | Pour | Proposée d'abord |
|---|---|---|---|
| `salon` | Le salon | entre amis | adultes |
| `cuisine` | La cuisine | en famille | adultes |
| `terrasse` | La terrasse | l'été, les vacances | adultes |
| `chambre` | La chambre vue mer | les confidences | adultes |
| `cafe` | Le café | les habitués | tous |
| `hangar` | Le hangar | les plus jeunes | 15–19 ans |
| `newyork` | L'appart à New York | les plus jeunes | 15–19 ans |
| `rue` | La rue | les plus jeunes | 15–19 ans |
| `chambre-musicale` | La chambre musicale (celle de Camille) | les plus jeunes | 15–19 ans |

Les huit premières existent déjà en hauteur (`src/lib/direct/pieces-duo.ts`, la page `/admin/humain/piece-du-duo`) ;
elles sont à refaire (2.2). La neuvième vient de l'image donnée par le propriétaire (2.3).

**Fait (lot M0, 16 novembre 2026)** : la page de l'admin `/admin/humain/univers-essais`, section « Les neuf pièces »,
fabrique tout (2.4).

### 2.1 Les emplacements : les mêmes partout

Chaque pièce, dans ses deux images, a **les mêmes emplacements**, ceux de la maquette du salon du duo. C'est ce qui
permet de ranger n'importe quoi dans n'importe quelle pièce, et de changer de pièce sans rien perdre :

- **la télé**, assez grande pour qu'un clip s'y voie (les liens, les clips, les films) ;
- **la platine** (la chanson du moment) ;
- **trois cadres vides** au mur (les photos) ;
- **l'étagère**, vide, au mur (les souvenirs : les mots, les rendez-vous, les mèmes, les pochettes, les affiches) ;
- **la fenêtre**, avec du ciel visible (la météo, la nuit) ;
- **deux lampes au moins** (elles éclairent la nuit) ;
- **la table basse** (le talkie, les objets posés, les surprises) ;
- **le coin du chat** ;
- **les places** : en hauteur, deux places proches, tournées l'une vers l'autre, en bas au milieu, de part et d'autre
  de la table basse ; en largeur, **le centre**. Les places sont **un sol libre** (un tapis) : le fauteuil vient avec la
  figurine (section 4) — c'est « le siège au centre » de la pièce solo.

Dans le relevé (`EmplacementsDuo`, `pieces-duo.ts`), la table basse est `table` et les lampes `lampes` (des boîtes) ;
les cadres sont trois. Une place tracée à la main est la boîte de la figurine assise **dans son fauteuil**, de la tête
au sol.

Les objets sont grands (la décision du 16 novembre pour les pièces des plus jeunes : « ça fait petit, la télé ou le
cadre »), chacun à part, et la pièce ne contient personne.

### 2.2 Les deux images

- **En hauteur (le salon du duo)** : 1024 × 1536 (2 : 3), **les proportions et le cadrage de la maquette du salon** : la
  pièce entière, les deux places en bas au milieu, la télé, l'étagère et les cadres au mur, la fenêtre sur le côté, la
  table basse entre les places. On refait les huit, avec ces éléments.
- **En largeur (la maison)** : **un panorama de 3584 × 1024** (3,5 pour 1 — plus large que le 21 : 9 prévu : le moteur
  ne fait pas plus de 1536 × 1024 d'un coup, on reprend donc la machinerie de la maison en panorama,
  `pieces-serveur.ts`). Trois images du moteur : **le centre** (1536 × 1024), **fait à partir de l'image en hauteur**
  (la même pièce, vue plus large), une place libre au milieu, la télé au mur du fond, les trois cadres, la table basse ;
  puis **la gauche** (la fenêtre, l'étagère, une lampe) et **la droite** (la platine, le coin du chat, l'autre lampe),
  la toile prolongée avec un masque ; puis **le panorama**, assemblé en fondu, sans moteur. En faisant glisser, on
  découvre la pièce « tout autour ».
- **Chacune dans les trois lumières** (matin, soir, nuit) : en hauteur comme aujourd'hui (`lumiere-<moment>.png`) ; en
  largeur, chaque partie retouchée (les côtés d'après le centre déjà retouché, pour qu'il n'y ait pas de raccord), puis
  assemblée (`panorama-<moment>.webp`).
- **Le relevé** (`releve.json`, tracé à la main sur la page de l'admin) : les emplacements de 2.1, en fractions de
  l'image ; en largeur, en fractions du panorama, et **une seule place : le centre** (sa boîte donne l'échelle de la
  figurine). Les alertes « objet petit » se mesurent en pixels, comme en hauteur.
- **Rangement** : `pieces-duo/<piece>/` (en hauteur, comme aujourd'hui, et `fabrique.json` : la version de la consigne,
  3 — une pièce sans est « ancienne consigne ») et `pieces-duo/<piece>/large/` (`centre.png`, `gauche.png`,
  `droite.png`, `panorama.webp`, les mêmes suffixés `-<moment>`, `releve.json`).
- **Coût** : environ 2 € la pièce (trois images en hauteur, neuf en largeur), soit une vingtaine d'euros pour les neuf,
  une seule fois pour tous.

### 2.3 La neuvième : la chambre musicale

L'image du propriétaire (la chambre de Camille) contient le personnage, et pas de télé. On en fait, sur la même page de
l'admin et à partir de cette image : **la pièce vide** (sans personne, le centre libre), **une télé ajoutée** au mur, la
version en hauteur, et les trois lumières. Le propriétaire dépose l'image sur la page : elle n'est pas dans le dépôt.

**Fait** : « 🖼️ Déposer l'image » sur sa carte (réduite dans le téléphone, rangée en `source.png`) ; la pièce en
hauteur est une retouche de cette image (la personne et ce qui est dessiné par-dessus retirés, la télé et les éléments
qui manquent ajoutés) ; sa largeur se fait d'après la pièce en hauteur, avec l'image déposée en seconde référence (pour
en voir plus). Déposer une autre image efface ce qui en était fait.

### 2.4 Sur la page de l'admin

`/admin/humain/univers-essais`, section « 🛋️ Les neuf pièces » :

1. **« Refaire les anciennes »** : les pièces faites avec la consigne d'avant (sans `fabrique.json`) sont effacées, puis
   tout se refait. Le salon du duo (`/univers/salon`) montre la pièce par défaut tant qu'elle n'est pas refaite.
2. **La chambre musicale** : « 🖼️ Déposer l'image ».
3. **« Faire ce qui manque »** : pour chaque pièce, en hauteur (la pièce, son relevé, ses deux autres lumières), puis en
   largeur (douze étapes, une par passage). Une image prend une à deux minutes : garder la page ouverte.
4. **Juger**, puis **« ✋ Ajuster à la main »** : en hauteur (les deux places, la table basse, les lampes, les trois
   cadres…) et en largeur (« 🌅 Les pièces en largeur » : le panorama défile au doigt, et un curseur le fait défiler
   pendant qu'on trace). « Refaire la gauche » (ou la droite) refait ce côté et ce qui en dépend.

Les essais : `scripts/essai-pieces-duo-route.mjs`.

---

## 3. L'inscription : « Choisis ta pièce »

**Aujourd'hui** : le selfie, la figurine, la conversation avec Pablito, l'univers fabriqué (une minute), puis le premier
proche. **Désormais** :

1. le selfie et **la figurine assise** (inchangés) ;
2. **« Choisis ta pièce »** : les neuf vignettes (l'image en largeur, réduite), dans l'ordre de l'âge déclaré
   (`src/app/collection/age.ts`) : pour les 15–19 ans, le hangar, New York, la rue, la chambre musicale d'abord ; pour
   les adultes, le salon, la terrasse, la cuisine, la chambre d'abord. **Toutes sont proposées à tous** : l'âge range,
   il n'interdit pas. Un toucher montre la pièce en grand (on peut la faire glisser) ; « Je m'installe ici » ;
3. **on arrive chez soi**, tout de suite : la figurine au centre, la pièce vide, et une phrase : « Ta maison se remplit
   toute seule avec ce que tu gardes dans tes conversations. Tu peux aussi y mettre ce que tu veux : ＋ » ;
4. le premier proche (inchangé).

- **Pablito** accueille toujours (son texte), mais ne fabrique plus la pièce.
- **Ceux qui ont déjà un univers généré** le gardent ; une carte « Choisis ta pièce » leur est proposée une fois, dans
  « Ma maison ». Leurs objets suivent (les emplacements sont les mêmes).
- **Changer de pièce, plus tard** : dans « Ma maison », ⚙️ « Changer de pièce » (la même liste) ; tout ce qui est posé
  suit, emplacement par emplacement.

---

## 4. La figurine posée

**Les calques de la figurine, faits une fois** (quand la figurine est validée, et pour chaque nouvelle tenue), par le
serveur, avec `sharp` (quelques secondes, aucun appel au moteur d'image) :

- **le corps** : la figurine entière avec son fauteuil, la tête d'origine comprise (elle reste dessous : quand la tête
  bouge un peu, on ne voit jamais le vide), le détourage nettoyé (on ne garde que la plus grande silhouette : l'image
  de la figurine assise laisse parfois des traînées sur les côtés) ;
- **la tête** : tout ce qui est au-dessus du col, **avec la main si elle touche le visage** (la pose « menton dans la
  main ») ; son **pivot** au milieu du cou ;
- **la bouche et les joues** (là où tombent le talkie, la marque 💋, le rouge aux joues) : devinées dans la tête, ou
  posées à la main.

C'est exactement la forme `CalqueFigurine` du contrat commun (`src/lib/direct/salon.ts`) : **le contrat ne change
pas**. Ce qui change, c'est d'où viennent les calques : de la figurine, et non plus de la découpe d'une image du duo.

**La pose** :

- **chez soi** : au `centre` du relevé en largeur, à l'`echelle` de la pièce, de face ;
- **dans le salon du duo** : aux deux places du relevé en hauteur, tournées l'une vers l'autre (`sens`) ;
- **l'intégration** : une ombre au sol sous le fauteuil ; une teinte légère selon la pièce et le moment (plus chaude le
  soir, plus sombre la nuit, éclairée par les lampes) ; la maquette « maison adulte » l'a fait avec un simple filtre.

**Les calques du duo** (`CalquesDuo` : la plaque, `a`, `b`) se composent donc à l'ouverture, sans attente : la plaque est
l'image en hauteur dans la lumière du moment ; `a` et `b` sont les calques des deux figurines, leurs boîtes calculées
d'après les places et l'échelle. **Plus aucune image n'est générée quand on ouvre une conversation ou sa maison.**

---

## 5. La maison qui se remplit toute seule

Ce que je garde dans une conversation va **chez moi**, à son emplacement, avec « gardé avec Léa ». Ce que Léa garde va
chez elle. Garder, c'est un geste de chacun.

| Ce que je garde | D'où | Où ça va chez moi | Ce qu'on voit |
|---|---|---|---|
| 📷 une photo | une photo envoyée dans le salon ; « La mettre dans mon univers » | un cadre : le premier libre, sinon le plus ancien est remplacé (tous restent dans l'album du cadre) | la photo dans le cadre, teintée comme la pièce |
| 🎵 une chanson | un lien de chanson | la platine (la dernière gardée) ; les autres en pochettes sur l'étagère | le disque, la pochette ; un toucher : l'extrait, le lien |
| 🎬 un clip, un film, une vidéo | un lien, une vidéo, « Mettre à la télé » | la télé (la dernière) ; les autres dans la vidéothèque (un rayon de l'étagère) | éteinte, l'affiche ; un toucher : elle passe |
| 📌 un mot, une promesse, un rendez-vous | 📌 Garder sur une bulle | l'étagère, à son rayon | une petite carte, un objet |
| 😂 un mème | un mème rangé | l'étagère, rayon « Nos fous rires » | sa carte ; un toucher : il se rejoue |
| ✨ un souvenir commun | le défi à deux | chez les deux (un cadre ou l'étagère) | avec ✨ |

- **Un seul geste, deux endroits** : 📌 Garder, dans le salon, range sur **l'étagère du duo** (salon-du-duo.md, 4.10)
  **et** chez moi. La photo accrochée dans un cadre du salon du duo reste au duo ; « la garder » la met aussi chez moi.
- **À ma prochaine arrivée dans ma maison** : « ✨ 3 choses gardées avec Léa » ; la caméra passe sur chacune (comme la
  maquette), puis la maison est à moi.
- **Retirer** : un appui long sur un objet, « Le ranger » (il retourne dans la liste) ou « L'enlever ».

---

## 6. « ＋ Ajouter chez moi »

Pour mettre soi-même ce qui compte, sans conversation (la maquette « maison adulte ») :

| Quoi | Où ça va |
|---|---|
| 🖼️ une photo de son téléphone | un cadre |
| 🎬 un film, 📺 un clip (titre, lien YouTube s'il y en a un, un mot) | la vidéothèque, la télé |
| 🎵 une chanson | la platine |
| 📚 un livre, 🍲 une recette, ✈️ un voyage, 🏅 une fierté, ✨ autre chose | l'étagère, à son rayon |

Rien d'obligatoire : « une photo de temps en temps suffit à faire vivre la maison ».

---

## 7. Les visites

Inchangées dans leur principe (lot 6 de la feuille de route : qui peut entrer, frapper à la porte, laisser une
surprise). Les maquettes ajoutent ce qui fait revenir, **plus tard** (lot M5) : les nouveautés du jour (la chanson, la
photo, la question), la question du jour (sa réponse se découvre après la sienne), la surprise posée dans la pièce, le
défi à deux qui devient un souvenir commun, l'humeur montrée par la figurine, « Pendant ton absence » côté habitant —
**sans aucun compteur de visites**.

---

## 8. « Découvrir » : rien sans un geste

- **Par défaut, la maison n'est visible que des proches** qui peuvent entrer (le réglage « qui peut entrer », lot 6).
- **« Ouverte à tout le monde »** reste un choix (18 ans et plus déclarés, comme aujourd'hui) : la pièce et la figurine
  apparaissent alors dans « 🏡 Les univers à visiter ». **Même ouverte, ce qui vient d'une conversation (les photos
  gardées, les mots, les mèmes du duo) ne se montre qu'aux proches** : pour les autres, un cadre garde son tableau, et
  l'étagère ne montre que ce que l'habitant a ajouté lui-même.
- **Plus tard** : « 🌍 Faire découvrir » sur un objet précis, par choix, jamais pour un objet venu d'une conversation.

---

## 9. La vitesse

Le budget et les règles du salon du duo valent ici (`salon-du-duo.md`, section 7) : l'image en largeur en WebP, deux
tailles (le téléphone, l'ordinateur), des URL stables en cache ; les calques de la figurine petits (moins de 80 Ko) ;
« Ma maison » s'ouvre en moins de 400 ms ; seulement `transform` et `opacity` pour animer ; rien sur le réseau pendant
une animation.

---

## 10. Les lots

| Lot | Contenu | Session | Dépend de |
|---|---|---|---|
| **M0 — Les images du catalogue** ✅ | la page de l'admin : les huit refaites en hauteur (2.2) ; la largeur faite d'après la hauteur ; la chambre musicale (2.3) ; les relevés (le centre, son échelle) — le code est fait (2.4) ; les images, le propriétaire les lance | univers | — |
| **S1 — Les calques** (salon-du-duo.md, section 9, modifié) | les calques de chaque figurine (section 4) ; leur pose aux places et au centre ; `CalquesDuo` composé à l'ouverture | messages et bienvenue | S0 |
| **M1 — La maison** | l'écran « Ma maison » : la pièce en largeur au doigt, la figurine au centre, les emplacements, toucher les objets ; ⚙️ changer de pièce | univers | M0, S1 |
| **M2 — La maison qui se remplit** | 📌 Garder → chez moi ; « La mettre dans mon univers » et la télé → chez moi ; « ✨ gardé avec … » à l'arrivée ; ＋ Ajouter chez moi | univers | M1, S6 |
| **M3 — L'inscription** | « Choisis ta pièce » ; l'âge ; Pablito ne fabrique plus ; la carte pour les anciens univers | messages et bienvenue | M0 |
| **M4 — Découvrir** | ce qu'une maison ouverte montre aux autres (section 8) | univers | M2 |
| **M5 — Les visites, la suite** | nouveautés du jour, question, surprise, défi à deux, humeur, « Pendant ton absence » | univers | M2 |

Tout derrière un interrupteur (`MA_MAISON_CATALOGUE`, éteint) jusqu'à ce que le propriétaire l'ait jouée sur son
téléphone. Chaque lot : ses essais (une route contre le faux Supabase, un essai navigateur au format téléphone), sa
section ici, une PR, la CI au vert, puis le message au propriétaire.

---

## 11. Les maquettes

Des pages privées du propriétaire (elles contiennent sa figurine ; elles ne sont pas dans le dépôt) :

- **La chambre de Camille, 15 ans** : `https://claude.ai/artifact/25KL2Ju7aJGnMepVPYb9Ym` (la neuvième pièce, la visite,
  les clips et les films) ;
- **La maison d'un adulte, avec sa vraie figurine** : `https://claude.ai/artifact/GMFdPBEP19QcbYrN2nFctk` (trois pièces :
  la décision 3 n'en garde qu'une ; la figurine posée, la télé, la vidéothèque, « ＋ Ajouter chez moi ») ;
- **Choisir sa pièce, et la maison qui se remplit** : `https://claude.ai/artifact/Dp1ZFerbsyK7ntkALZv5Pp` (section 12).

## 12. La maquette de ces décisions

`https://claude.ai/artifact/Dp1ZFerbsyK7ntkALZv5Pp` : « Choisis ta pièce » (les neuf, l'ordre selon l'âge, l'aperçu en
largeur), l'arrivée chez soi (la figurine posée au centre, la pièce vide), le salon avec Léa réduit à six messages
(📌 Garder sous une photo, une chanson, un clip, un rendez-vous, un mot, un mème), « 🏠 Rentrer chez moi » (chaque
chose vient se ranger à sa place, la caméra passe sur chacune, « Gardé avec Léa »), toucher ce qui est posé, « ＋ Ajouter
chez moi », et ⚙️ (qui peut entrer ; « Voir comme un inconnu » : ce qui vient des conversations disparaît).

Une seule pièce y a déjà son image en largeur avec tous ses emplacements (la pièce cosy du propriétaire, en attendant
les vraies du lot M0) ; les autres vignettes sont dessinées. La platine y est remplacée par une pochette posée contre
le meuble (la pièce n'a pas de platine) : les images refaites en auront une.
