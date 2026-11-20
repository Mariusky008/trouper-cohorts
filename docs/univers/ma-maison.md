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

`/admin/humain/univers-essais`, section « 🛋️ Les neuf pièces » (depuis le 17 novembre, une **marche à suivre** en haut
de la section dit les gestes dans l'ordre, selon où on en est ; une pièce « ancienne consigne » n'a plus qu'un bouton,
« 🔁 Refaire cette pièce », qui l'efface et la refait en entier ; déposer l'image de la chambre musicale la fait
aussitôt) :

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

**Fait (lot S1, `salon-du-duo.md`, section 11.7)** : `calquesDeFigurine(supabase, h)`
(`src/lib/direct/calques-figurine-serveur.ts`) rend les calques de sa figurine, à adresse stable, dans le cadre de la
figurine ; `poserFigurine(f, centre, piece, { tracee: true })` (`src/lib/direct/figurine-calques.ts`) les pose au
centre de sa maison, dans la forme `CalqueFigurine`.

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
| **M1 — La maison** ✅ | l'écran « Ma maison » : la pièce en largeur au doigt, la figurine au centre, les emplacements, toucher les objets ; ⚙️ changer de pièce — fait (section 13), derrière l'interrupteur | univers | M0, S1 |
| **M2 — La maison qui se remplit** ✅ (sections 15 et 16) | 📌 Garder → chez moi ; « La mettre dans mon univers » et la télé → chez moi ; « ✨ gardé avec … » à l'arrivée ; ＋ Ajouter chez moi | univers | M1, S6 |
| **M3 — L'inscription** ✅ | « Choisis ta pièce » ; l'âge ; Pablito ne fabrique plus ; la carte pour les anciens univers — fait (section 14), derrière l'interrupteur | messages et bienvenue | M0 |
| **M4 — Découvrir** ✅ (section 17) | ce qu'une maison ouverte montre aux autres (section 8) | univers | M2 |
| **M5 — Les visites, la suite** ✅ (sections 18 et 19 ; le défi à deux attend le propriétaire, 19.1) | nouveautés du jour, question, surprise, défi à deux, humeur, « Pendant ton absence » | univers | M2 |

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

## 13. Le lot M1 : ce qui est fait (16 novembre 2026)

**À l'adresse d'essai `/univers/maison`** (l'administrateur, sur son téléphone d'habitant : sa figurine), en plein écran.
Dans l'onglet « Ma maison » quand l'interrupteur `MA_MAISON_CATALOGUE` (`src/lib/direct/ma-maison.ts`) sera allumé ;
d'ici là, l'onglet garde l'univers d'aujourd'hui.

- **Sans pièce** : « Choisis ta pièce » — les pièces prêtes (leur panorama fait, lot M0), dans l'ordre de l'âge (« 18 ans
  ou plus ? » : non → le hangar, New York, la rue, la chambre musicale d'abord ; sinon le salon, la terrasse, la
  cuisine, la chambre d'abord). Un toucher : la pièce en grand, qu'on fait glisser ; « Je m'installe ici ».
- **Chez soi** : le panorama dans la lumière de l'heure de Paris (la sienne si cette lumière n'est pas faite), à
  adresse stable (WebP, 1792 et 3584 points, la vignette floue d'abord ; servi par la route des fichiers du salon) ; on
  arrive la figurine au milieu de l'écran ; « Ta maison se remplit toute seule… » et « ← Glisse pour faire le tour → »,
  partis au premier glissement.
- **La figurine** : sa figurine assise dans son fauteuil, **détourée au plus près une fois** (`<habitant>/ma-piece/
  figurine.png`, refaite quand sa figurine change), posée au centre du relevé en largeur (sa boîte, de la tête au sol ;
  sinon un centre par défaut), une ombre au sol, la teinte du moment (plus chaude le soir, plus sombre la nuit), une
  respiration ; un toucher : elle sautille. **En attendant les calques du lot S1** (la tête qui bouge), elle est posée
  entière.
- **Les emplacements** (relevés à la main sur la page de l'admin) se touchent : une bulle dit ce que chacun accueillera
  (la télé, la platine, un cadre, l'étagère, la table basse, le coin du chat) ; la fenêtre dit l'heure qu'il est ; une
  lampe s'allume et s'éteint.
- **⚙️ « Changer de pièce »** : la même liste, sa pièce marquée « ✓ Ta pièce ».
- **Le serveur** : `src/lib/direct/ma-maison-serveur.ts` ; **la route** `GET/POST /api/direct/ma-piece` (la sienne
  seulement : le cookie d'habitant ; l'administrateur seul tant que l'interrupteur est éteint) ; sa pièce dans
  `<habitant>/ma-piece/piece.json`. Rien n'est généré (aucun moteur d'image).
- **Les essais** : `scripts/essai-ma-maison-route.mjs`, `scripts/navigateur/ma-maison-catalogue.mjs` (iPhone).

**À savoir** : le panorama fait 1024 pixels de haut ; en plein écran sur un iPhone (844 points de haut, 3 pixels par
point), il est agrandi environ 2,5 fois. S'il paraît flou sur les vraies images, on pourra faire chaque partie en plus
grand (lot M0) ou réduire un peu la hauteur de la scène.

---

## 14. Le lot M3 : « Choisis ta pièce », ce qui est fait (16 novembre 2026)

Derrière l'interrupteur `MA_MAISON_CATALOGUE` (éteint). **D'ici là, l'administrateur l'essaie en le demandant**, sur son
téléphone d'habitant : `/univers/figurine?piece=1`, `/univers?piece=1` ; sans `?piece=1`, son parcours et celui de tout
le monde ne changent pas. (Le module : `src/lib/direct/choisis-ta-piece.ts` ; côté serveur, `choisis-ta-piece-serveur.ts`.)

- **Après « C'est moi ! »** (`/univers/figurine`) : « Maintenant, choisis ta pièce : ta figurine y sera chez elle. » et
  « 🏠 Choisis ta pièce » — au lieu de « Découvrir ton univers » (la conversation avec Pablito). Le bouton mène au
  choix : l'adresse d'essai `/univers/maison` aujourd'hui ; l'onglet « Ma maison » (`/collection#maison`) une fois
  l'interrupteur allumé. Le choix lui-même est celui du lot M1 (les neuf, dans l'ordre de l'âge ; un toucher la montre
  en grand ; « Je m'installe ici ») ; on arrive chez soi, sa figurine au centre, et la phrase « Ta maison se remplit
  toute seule… ». Le premier proche : inchangé (l'onglet « Messages »).
- **L'accueil `/univers`** (et `/univers/monde`) : sa figurine faite, sans univers (ou l'univers pas encore créé) —
  « Ta pièce t'attend », « 🏠 Choisis ta pièce », au lieu de « Parler avec Pablito » et « Créer mon univers ». Sans
  figurine : « D'abord ta figurine, assise dans son fauteuil. Ensuite, tu choisis ta pièce. »
- **Pablito ne fabrique plus**, l'interrupteur allumé : `/univers/conversation` renvoie au choix de la pièce ;
  `POST /api/direct/univers { action: "creer" }` répond 410 (« Pablito ne fabrique plus d'univers : choisis ta
  pièce. »). Les retouches d'un univers déjà fabriqué restent possibles.
- **Ceux qui ont déjà un univers fabriqué** (l'onglet « Ma maison », l'interrupteur allumé ; à essayer aujourd'hui sur
  `/univers/maison?onglet=1`) : ils le gardent, avec la carte « 🏠 Nouveau : choisis ta pièce » (« Une pièce tout autour
  de toi… Ton univers reste à toi tant que tu n'as pas choisi. ») — « Choisir ma pièce » ouvre le choix (avec ✕ : on
  revient à son univers) ; « Plus tard » : la carte ne revient plus sur ce téléphone, un lien discret « 🏠 Choisir une
  pièce » reste sous son univers. Sa pièce choisie, l'onglet la montre. Leurs objets suivront avec le lot M2 (les
  emplacements sont les mêmes).
- **La bienvenue** : le chemin montré devient « Ton selfie › Ta figurine › Ta pièce › Tes proches », l'interrupteur
  allumé. **À enregistrer par le propriétaire avant d'allumer** : la bulle de Pablito `tuto-univers-6` dit encore « …
  puis on discute cinq minutes, et je dessine les premiers endroits de ton univers ». Proposition : « Par toi ! Un
  selfie pour ta figurine, puis tu choisis ta pièce, et elle se remplit avec ce que tu gardes. » (jamais de voix de
  synthèse : elle reste telle quelle jusqu'à son enregistrement).

**Les essais** : `scripts/navigateur/choisis-ta-piece.mjs` (iPhone : sans `?piece=1`, le parcours d'aujourd'hui ; après
« C'est moi ! », « Choisis ta pièce » et plus la conversation ; l'accueil ; le choix sans ✕, le hangar d'abord pour 16
ans ; chez elle ; un ancien univers : la carte, « Plus tard » retenu, le lien, ✕, le salon d'abord pour un adulte, sa
pièce, plus de carte). Toujours verts : `nouvelle-figurine.mjs`, `univers-monde.mjs`, `visite-univers.mjs`,
`ma-maison-catalogue.mjs`, `tuto.mjs`.


---

## 15. Le lot M2, première partie : la maison montre ce qu'on a gardé (19 novembre 2026)

Derrière l'interrupteur `MA_MAISON_CATALOGUE` (éteint) : à l'adresse d'essai `/univers/maison` (l'administrateur, sur son
téléphone d'habitant), et dans l'onglet quand il sera allumé.

- **Ce qui va chez moi** (`objetsDeMaMaison`, `etagere-serveur.ts`) : ce que j'ai déposé ou rangé « dans mon univers »
  (ma propre étagère : les photos, les chansons, les vidéos de « 🖼️ La mettre dans mon univers ? », « 🎵 Le ranger dans
  mon univers ? »), et, sur nos étagères partagées, **ce que j'ai gardé moi-même** (📌 Garder dans le salon, un duo de
  mèmes rangé dans « Nos fous rires ») — avec le prénom du proche. **Ce que Léa garde va chez elle**, pas chez moi ; ce
  que j'ai retiré de chez moi (`caches`) non plus. Rien n'est recopié : la maison lit les étagères.
- **Où chaque chose se pose** (`placerChezMoi`, `ma-maison.ts`), dans l'ordre où je les ai gardées : une photo dans le
  premier cadre libre, sinon à la place de la plus ancienne (qui reste dans « Mon étagère ») ; **la dernière chanson sur
  la platine** (le disque tourne, sa pochette posée à côté) ; **la dernière vidéo à la télé** (son affiche, ▶) ; les
  autres chansons et vidéos, les mots, les promesses, les mèmes **sur l'étagère** (les six derniers, en petites cartes
  ou en pochettes). Un emplacement que la pièce n'a pas relevé : l'objet reste dans « Mon étagère ». Les images prennent
  la teinte du moment (plus chaudes le soir, plus sombres la nuit).
- **Un toucher sur un objet** : son titre, « Gardé avec Sam » (ou « Mis chez toi ») et ce qu'en dit l'étagère ;
  « ▶ Écouter » ou « ▶ Regarder » (son lien, une page web seulement) ; une photo : « 🔍 La voir en grand ». Un emplacement
  vide garde sa bulle du lot M1 (ce qu'il accueillera).
- **✨ L'arrivée** (`arriveeChezMoi`) : ce que j'ai gardé avec mes proches depuis ma dernière visite, et qui est dans la
  pièce — « ✨ 2 choses gardées avec Sam » (« avec Léa et Sam ») ; la caméra passe sur chacune (quatre au plus, l'objet
  s'éclaire), puis revient sur ma figurine ; un toucher arrête la visite. Ensuite la visite est retenue
  (`<habitant>/ma-piece/vu.json`, `POST /api/direct/ma-piece { action: "vu" }`) : en revenant, plus d'annonce. Rien de
  nouveau : pas d'annonce. La phrase « Ta maison se remplit toute seule… » ne s'affiche plus dès qu'il y a quelque chose.
- **La route** : `GET /api/direct/ma-piece` rend aussi `maison.contenu` (`{ cadres, platine, tele, etagere, total }`) et
  `maison.vuLe`.

**La deuxième partie du lot M2** : section 16.

**L'essai** : `scripts/navigateur/ma-maison-remplie.mjs` (iPhone, 27 contrôles : la route — les deux cadres, la plus
ancienne photo remplacée, la platine et son lien, la télé, l'étagère gardée avec Sam, le mot de Sam absent ; l'écran — les
six objets à leur place, la photo posée sur son cadre, « ✨ 2 choses gardées avec Sam » au milieu, la caméra sur chacune,
la visite retenue, un cadre et « La voir en grand », la platine et « Écouter », le mot « Gardé avec Sam », un emplacement
vide, revenir sans annonce). Toujours verts : `ma-maison-catalogue.mjs`, `essai-ma-maison-route.mjs`,
`choisis-ta-piece.mjs`.

---

## 16. Le lot M2, deuxième partie : « ＋ Ajouter chez moi », et l'enlever (19 novembre 2026)

- **＋ en haut de la pièce** (à côté de ⚙️) : « Qu'est-ce que tu mets chez toi ? », neuf choix (`AJOUTS_MAISON`,
  `ma-maison.ts`) — 🖼️ une photo, 🎬 un film, 📺 un clip, 🎵 une chanson, 📚 un livre, 🍲 une recette, ✈️ un voyage,
  🏅 une fierté, ✨ autre chose ; « Rien d'obligatoire : une photo de temps en temps suffit à faire vivre la maison. »
  - **Une photo** : choisie dans le téléphone, réduite dans le téléphone (1 600 pixels au plus), recopiée par le serveur
    (900 pixels, WebP, `<habitant>/univers/objets/<id>.webp`) ; une légende si l'on veut. Elle va dans un cadre (le
    premier libre, sinon à la place de la plus ancienne).
  - **Un film, un clip, une chanson** : un nom, un lien si l'on veut (YouTube, Spotify…) — son titre (si l'on n'en a pas
    écrit) et son image (l'affiche, la pochette) viennent de la page, recopiés chez nous ; sans image, il va quand même à
    la télé ou sur la platine (un emoji à la place). Un mot si l'on veut.
  - **Le reste** : un nom, un mot si l'on veut ; sur l'étagère.
  - « Mettre chez moi » : la maison revient avec lui à sa place, « ✓ C'est chez toi, dans un cadre » (« à la télé »,
    « sur la platine », « sur l'étagère »), et la caméra va le voir. Les mêmes limites qu'un dépôt sur son étagère (douze
    par jour, quatre-vingts au plus) ; rien de grossier ni d'alcoolisé (`motPasse`).
  - Le serveur : `ajouterChezMoi` (`etagere-serveur.ts`), `POST /api/direct/ma-piece { action: "ajouter", quoi, titre?,
    lien?, mot?, image? }` → `{ maison, id }`. Tout est rangé sur **sa propre étagère** (« Mon étagère » le voit aussi).
- **🗑️ Un appui long sur un objet** : « L'enlever de chez moi ». Ce qu'on a ajouté ou rangé soi-même disparaît (comme
  « Retirer » sur son étagère, sa copie d'image avec lui : « Il disparaît de chez toi. ») ; ce qu'on a gardé dans une
  conversation **reste sur l'étagère partagée** (« Il reste sur votre étagère, avec Sam. ») mais plus chez soi.
  `enleverDeChezMoi`, `POST /api/direct/ma-piece { action: "enlever", id }` → `{ maison }`.
- **Plus tard** : « Le ranger » (le sortir de la pièce sans l'enlever de son étagère) ; « la garder » sur une photo reçue
  dans le salon (aujourd'hui, seul celui qui l'a envoyée peut la mettre chez lui).

**L'essai** : `scripts/navigateur/ma-maison-remplie.mjs` (45 contrôles au total : en plus de la section 15 — ＋ et ses
neuf choix ; sans photo, refusé ; une photo choisie, en aperçu, « dans un cadre », à la place de la plus ancienne ; une
chanson sans nom ni lien refusée, puis avec son lien « sur la platine » ; un livre et son mot ; l'appui long sur le mot
gardé avec Sam — enlevé de chez elle, toujours sur leur étagère ; sur le livre — parti de son étagère aussi ; la route
refuse un choix inconnu, ne trouve pas un objet inconnu).

---

## 17. Le lot M4 : la maison en visite (19 novembre 2026)

La section 8 (« Découvrir » : rien sans un geste). Derrière l'interrupteur `MA_MAISON_CATALOGUE` : allumé, la page de
visite (`/univers/chez/<clé>`) montre la pièce du catalogue de celui qui en a une ; d'ici là, elle la montre à qui n'a
pas d'univers fabriqué, ou quand on la demande (`?piece=1`, l'essai).

- **🚪 Qui peut entrer** (en haut de sa pièce, à côté de ＋ et ⚙️ ; son emoji dit le choix) : **👯 Mes proches**
  (d'office — ils voient tout ce qu'il a gardé), **🌍 Tout le monde** (« J'ai 18 ans ou plus » à cocher, une fois ; la
  maison entre dans « 🏡 Les univers à visiter », avec la vignette de sa pièce), **🔒 Moi seul** (personne n'entre ; elle
  quitte « Les univers à visiter »). « 👀 Voir ma maison comme mes visiteurs ». `<habitant>/ma-piece/visibilite.json` ;
  `POST /api/direct/ma-piece { action: "visibilite", v, adulte? }` (`choisirVisibiliteMaison`, `visites-serveur.ts`).
- **La maison en visite** (`maisonVisitee`, `GET /api/direct/ma-piece?chez=<clé>`, l'écran `VisiteDeLaMaison`) : sa
  pièce en plein écran, « 🏠 Chez Léa », sa figurine au centre, ses objets à leur place. **Ses proches voient tout** ;
  **les autres seulement ce qu'il a ajouté lui-même** (« ＋ Ajouter chez moi », un dépôt sur son étagère) — jamais ce qui
  vient d'une conversation (les photos rangées, les mots gardés, les mèmes du duo) : un cadre garde alors son tableau.
  Un objet touché : « Mis par Léa · … » ou « Gardé avec Sam ». Ni ＋, ni ⚙️, ni 🚪, ni l'appui long, ni l'arrivée chez
  quelqu'un d'autre. Fermée : « La maison de Léa est ouverte à ses proches seulement. » / « Léa garde sa maison pour soi,
  pour l'instant. »
- **🚪 Frapper à la porte** : comme pour les univers (une visite notée par jour, Léa prévenue une fois par jour,
  « ✓ Léa saura que tu as frappé ») — les visites (`chezQui`, `universOuvert`, `universPublics`) savent désormais entrer
  dans une pièce du catalogue (`maisonOuUnivers`).

**L'essai** : `scripts/navigateur/ma-maison-visite.mjs` (28 contrôles : Sam voit tout, Zoé trouve la maison réservée ; 🚪
« 👯 » d'office, trois choix, « Tout le monde » refusé sans « 18 ans ou plus », puis 🌍 et « Les univers à visiter » ;
Zoé : le livre seul, cadres vides, « Chez Léa », ni ＋ ni ⚙️, « Mis par Léa », la figurine de Léa, frapper et la visite
notée ; Sam : les trois ; « 🔒 Moi seul » : fermée même pour Sam, sortie de « Découvrir », frapper refusé). Toujours
verts : `ma-maison-remplie.mjs`, `ma-maison-catalogue.mjs`, `visite-univers.mjs`, `essai-visites-route.mjs`.

---

## 18. Le lot M5, première partie : la maison qui vit (19 novembre 2026)

La section 7 (« ce qui fait revenir ») — **sans aucun compteur de visites**.

- **🙂 L'humeur du jour** (celle du rituel, `<habitant>/humeur.json`, le jour même) : une étiquette au-dessus de sa
  figurine (« 😂 Fou rire ») — chez soi, et chez lui pour ses proches seulement.
- **🚪 « Pendant ton absence »** : à l'arrivée chez soi, qui a frappé depuis sa dernière visite — « 🚪 Sam a frappé à ta
  porte pendant ton absence » (« Sam et Zoé ont frappé… », trois prénoms au plus, jamais un nombre) —, puis « ✨ 2 choses
  gardées avec Sam » (la caméra passe dessus).
- **🎁 La surprise posée** : en visite chez un proche, « 🎁 Laisser une surprise » — un objet (un bouquet, une tasse de
  café, un livre, un ballon…) et un petit mot ; elle se pose **emballée sur sa table basse** (« 🎁 Léa la trouvera en
  rentrant » ; « Ta surprise attend qu'on l'ouvre »). Chez soi : le paquet bouge doucement ; un toucher : « 🎁 Sam t'a
  laissé un cadeau », « Ouvrir » — « 💐 Un bouquet », « De Sam · « Pour toi » » — « ✓ Le garder sur ma table » ou
  « Non merci ». Gardé, il reste sur la table (quatre au plus) ; ses proches l'y voient. Ce sont les souvenirs du lot 6
  des visites (`<habitant>/monde/souvenirs.json`, `laisserSouvenir`, `deciderSouvenir`) : « Chez moi » les découvre aussi
  (`mesVisites` connaît désormais les maisons du catalogue).
- **✨ Les nouveautés du jour** : en visite chez un proche, ce qu'il a mis chez lui aujourd'hui — « ✨ Nouveau chez Léa
  aujourd'hui : Le Petit Prince » — et la caméra va le voir.
- Le serveur : `vieDeLaMaison` (`ma-maison-serveur.ts`) ; `maMaison` rend `humeur`, `absence`, `table` ; `maisonVisitee`
  rend aussi `peutLaisser`, `mesCadeaux`, `nouveaux`.

**L'essai** : `scripts/navigateur/ma-maison-vie.mjs` (22 contrôles : chez Léa, Sam voit son humeur, « Nouveau chez Léa
aujourd'hui » et la caméra, laisse un bouquet et un mot ; Léa rentre — « Sam a frappé à ta porte pendant ton absence »,
sans nombre ; le paquet emballé ; « Ouvrir », « De Sam · « Pour toi » », « Le garder » ; son humeur chez elle ; Sam
revient et voit son bouquet sur la table).

## 19. Le lot M5, deuxième partie : la question du jour en visite (19 novembre 2026)

Les maquettes : « la question du jour — sa réponse se découvre après la sienne ».

- **Chez un proche qui a répondu ce matin à sa question du jour** (le lot 2a, `connaitre-serveur.ts`) : une pastille
  « 💬 La question du jour de Léa ». Un toucher : la question, ses réponses à toucher (ou trois mots à écrire), « Réponds
  d'abord : tu découvriras ensuite la réponse de Léa ». La sienne n'est **ni à l'écran ni envoyée** au téléphone tant
  qu'on n'a pas répondu. « Répondre » : « Toi : 🏖️ Plage », « Léa : 🏔️ Montagne ». On revient : les deux y sont encore.
  Pendant ce temps, frapper et la surprise s'effacent (une seule bulle à la fois).
- **Chez soi** : à l'arrivée, après « Pendant ton absence », « 💬 Sam a répondu à ta question du jour » (trois prénoms au
  plus, seulement ce qui est arrivé depuis sa dernière visite) ; la pastille « 💬 Ta question du jour » : la question et
  ce que chacun y a répondu (les plus récents d'abord).
- **Entre proches seulement** (un visiteur qui n'est pas un proche ne la voit pas, et la route le refuse) ; une réponse
  par visiteur et par jour (la nouvelle remplace l'ancienne) ; les mêmes refus que la question du jour (les choix, la
  longueur, pas de lien, les mots qui ne passent pas). Elle ne compte pas dans son journal : c'est celle de son hôte.
- Le serveur : `question-maison-serveur.ts` (`questionChezLui`, `repondreChezLui`, `questionChezMoi`) ;
  `<habitant>/ma-piece/reponses/<jour>.json` = { cle, reponses: [{ de, texte, le }] } ; `maMaison` et `maisonVisitee`
  rendent `question` ; `POST /api/direct/ma-piece` { action: "repondre", chez, texte } rend la visite mise à jour.

**L'essai** : `scripts/navigateur/ma-maison-question.mjs` (22 contrôles : chez Léa, Sam voit la pastille, la question et
ses quatre choix, la réponse de Léa cachée — ni à l'écran ni dans ce que le serveur envoie ; « 🏖️ Plage », « Répondre »,
« Toi » puis « Léa » ; une réponse hors des choix refusée ; ✕ ; il revient et les retrouve ; Zoé, qui n'est pas sa
proche, refusée ; Léa rentre : « Sam a répondu à ta question du jour », « Sam : 🏖️ Plage » ; plus d'annonce ensuite).

### 19.1 Ce qui attend le propriétaire : le défi à deux

La section 7 et les maquettes parlent d'un « défi à deux qui devient un souvenir commun », sans dire lequel. Plutôt que de
l'inventer, il attend la décision du propriétaire : quel défi (une photo à prendre chacun de son côté ? une question à
deviner l'un sur l'autre ? un mème à faire à deux ?), et ce qu'il devient dans la maison (un cadre ? un objet sur
l'étagère, « ✨ gardé avec … » ?).

## 20. Allumé pour tous (19 novembre 2026)

Le propriétaire, après une nouvelle inscription : « après la figurine je n'arrive pas au choix de mon “ma maison”, je
suis encore sur l'ancien concept d'univers où Pablito me pose des questions ». **`MA_MAISON_CATALOGUE = true`** :

- après « C'est moi ! », **« 🏠 Choisis ta pièce »** mène à l'onglet « Ma maison » (`/collection#maison`), qui s'ouvre
  sur le choix (les neuf, dans l'ordre de l'âge) ; l'accueil `/univers` dit pareil ; `/univers/conversation` y renvoie ;
  Pablito ne fabrique plus d'univers (`creer` : 410) ;
- ceux qui ont déjà un univers fabriqué le gardent, avec la carte « 🏠 Nouveau : choisis ta pièce » (section 14) ;
- la bienvenue montre « Ton selfie › Ta figurine › Ta pièce › Tes proches », et sa dernière bulle devient « Par toi ! Un
  selfie pour ta figurine, puis tu choisis ta pièce, et elle se remplit avec ce que tu gardes. » — **sans voix tant que
  le propriétaire ne l'a pas enregistrée** (`tuto-univers-6b`, jamais de voix de synthèse).

**Le frein** (comme « Univers pour tous ») : `CLIKME_MA_MAISON=0` éteint, « 1 » allume, sinon l'interrupteur
(`src/lib/direct/interrupteurs-serveur.ts`). Le serveur décide ; les pages passent sa valeur aux écrans (`/collection` :
`maison` ; `/univers/figurine`, `/univers`, `/univers/monde` : l'adresse de « Choisis ta pièce », `versSaPiece`). La CI
et le serveur d'essai tournent freinés ; `choisis-ta-piece.mjs` essaie l'allumé sur une seconde app (« Univers pour
tous » et « Ma maison » allumés, comme en ligne).

## 21. Les retours du 20 novembre 2026

Le propriétaire : « quand j'ai mis un film sur ma télé et que j'appuie sur lecture, ça ne marche pas ; il faut que
j'appuie sur "Regarder" et ça m'amène sur YouTube au lieu de rester dans la scène » ; « je n'apparais pas dans la scène
en mode téléphone » ; « le mode panorama n'est pas bon : ça reprend le même plan et ça le double ».

- **📺 La télé joue dans la pièce.** Toucher la télé (son ▶) : la vidéo YouTube qu'on y a mise passe sur son écran, à sa
  place dans le panorama (le lecteur tout simple de YouTube, sans cookie : `lecteurYouTube`, `lib/direct/tele.ts`) ; la
  bulle dit « ⏹ Éteindre la télé ». « ▶ Regarder » fait de même pour toute vidéo YouTube de la maison. Un lien qui n'est
  pas YouTube (une autre plateforme) s'ouvre toujours à part : on ne peut pas le jouer dans la scène.
- **Ma figurine au milieu, sur un téléphone.** La largeur du panorama est posée avant que son image arrive : sans elle,
  le défilement restait collé à gauche et la figurine hors de l'écran. On recentre encore à l'image suivante, tant qu'on
  n'a pas bougé.
- **Le panorama doublé.** Le côté recopiait la télé et son meuble (la pièce en hauteur, sa référence, les montre) : la
  consigne du côté (`consigneLargeCote`) dit maintenant qu'il est une autre partie de la pièce, sans télé, sans meuble
  de télé, sans cadre, sans table basse ni fauteuil, et que la pièce en hauteur ne sert que pour le style. **À faire par
  le propriétaire** : sur `/admin/humain/univers-essais`, la chambre musicale, « Refaire la droite » (et la gauche si
  elle double aussi) — ses lumières et le panorama se refont avec.

**Les essais** : `ma-maison-remplie.mjs` (la télé touchée : le film joue sur son écran, à la place de l'écran ; « ⏹
Éteindre la télé » ; aucun lien vers YouTube).
