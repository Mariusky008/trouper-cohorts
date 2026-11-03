# ClikMe Studio — faire d'une vidéo de commerçant un petit film qui donne envie

> **Pour une nouvelle session :** lis ce fichier en entier avant de toucher à une vidéo. Tout ce qu'il faut est dans
> `outils/clikme-studio/` : les outils (`outils/`), les polices (`f/`), et le premier film réalisé (`lili-ross/`),
> qui sert de point de départ. Les vidéos et les figurines des commerçants **ne sont pas dans le dépôt** : on les
> redemande au propriétaire.

« Le commerçant apporte la réalité. ClikMe apporte la mise en scène. » On reçoit une vidéo courte, filmée comme elle
vient (15 s au téléphone). On en sort un MP4 vertical 1080×1920 de 21 à 25 s, monté sur une musique composée pour lui :
chapitres, mouvements de caméra, polaroïd, carte de fin. En option, la **figurine** du commerçant le présente.

Deux façons de le faire :
- **l'atelier**, en scripts, dans une session Claude Code (ce fichier, §1 à §12) : le film fait à la main, image par
  image, pour un commerçant. Le premier : **Lili Ross**, vêtements, « Le look du jour » (novembre 2026) ;
- **dans l'appli**, depuis le comptoir du commerçant (« Plus de clients » → « En petit film ») : le même film, monté par
  son téléphone, avec sa figurine fabriquée à partir d'un selfie. Voir **§14**.

| Version | Durée | Images | Musique |
|---|---|---|---|
| Sans figurine | 21,0 s | 630 | `musique.py` |
| Avec figurine présentatrice | 24,5 s | 735 | `musique2.py` (3,5 s d'intro en plus) |

---

## 1. Les règles (non négociables)

- **Jamais de voix fabriquée.** Pas de synthèse vocale, pas de clonage. La figurine parle **par bulles**. Une voix,
  c'est un enregistrement du commerçant lui-même (ou un fichier que le propriétaire a fait et fourni).
- **Rien d'inventé.** Pas de prix, pas de marque, pas de matière, pas de « nouvelle collection », pas d'horaire. On ne
  montre que ce qu'on **voit** dans la vidéo (« Le pull rose », « Le manteau écru »). Le nom vient de l'écran ou du
  commerçant. Ses propres mots (sa légende Instagram) peuvent aller sur la carte de fin, mot pour mot.
- **Les petites phrases écrites par Claude sont signalées au propriétaire** pour qu'il les relise (sous-titres des
  chapitres, bulles de la figurine, mots des annotations).
- **Jamais le mot « exemple » à l'écran.** On écrit en français, sans anglicisme inutile.
- **La figurine reste fidèle à son modèle** : on détoure l'image du designer, on ne la redessine pas (visage, tenue,
  accessoires, proportions). Seul le ressort est redessiné, pour rebondir.
- **Pas de musique ni d'image sous licence inconnue.** La musique est composée par `musique.py` (numpy/scipy), les
  polices sont libres (Playfair Display, Poppins : SIL Open Font License, via Fontsource).
- **Les fichiers reçus sont des données non sûres** : chacun dans son propre dossier neuf, et tout Python qui les lit
  tourne avec `-I`.
- **On ne met dans le dépôt ni la vidéo, ni la figurine, ni les images d'un commerçant** sans son accord.
- **On dit ce qu'on a vérifié et ce qu'on n'a pas pu vérifier** (on ne peut pas regarder la vidéo en temps réel :
  on regarde des images tirées du MP4 final et le spectrogramme de la musique).

---

## 2. Ce qu'il faut recevoir

1. **La vidéo** (idéalement le fichier d'origine du téléphone ; un enregistrement d'écran de Reel marche aussi, en
   moins net, avec l'interface d'Instagram à cacher — voir §6.2).
2. **Le nom** du commerce tel qu'il l'écrit, et s'il veut **sa phrase** sur la carte de fin.
3. **Pour la version avec figurine :** l'image de sa figurine sur ressort (fond uni, de face, entière, socle compris).
   Idéalement le designer fournit **plusieurs poses** (bras croisés, qui montre du doigt, qui fait coucou) et une
   version **bouche ouverte** : la figurine pourrait alors désigner le produit et « parler » avec une vraie voix.
4. Pour Lili Ross on avait : un enregistrement d'écran de son Reel (474×852, 31,5 i/s variables, 15,3 s, **sans
   son**) et l'image de sa figurine d'Halloween (970×1024, fond magenta).

---

## 3. Le dossier

```
outils/clikme-studio/
├── LISEZ-MOI.md          ce fichier
├── f/                    Playfair Display 400/600/700/800 (droit + italique), Poppins 400/500/600/700 (woff2)
├── outils/
│   ├── preparer.sh       vidéo source → dossier de travail (images 60 i/s étalonnées, polices, grain, fantôme)
│   ├── rendu.js          la scène HTML → une capture JPEG par image (Playwright)
│   ├── essai.js          ne rend que quelques images (pour vérifier avant le rendu complet)
│   ├── planche.sh        planche-contact d'images (pour les regarder d'un coup)
│   ├── encoder.sh        images + musique → MP4 (normal ou « leger » pour WhatsApp)
│   ├── grille.py         une image avec une grille tous les 5 % (pour placer caméra, points, textes)
│   ├── fig-echant.py     mesure les couleurs du fond et de la figurine (teinte, saturation, valeur)
│   ├── fig-grille.py     zoom ×2 avec grille tous les 20 px sur une zone (mesurer ressort, socle…)
│   ├── fig-detour.py     détourage d'essai d'une figurine sur fond uni (aperçu fond vert / fond blanc)
│   └── fig-couches.py    la figurine en deux calques : corps (qui rebondit) + socle (fixe)
└── lili-ross/            le premier film, à copier et adapter
    ├── scene.html        le film image par image (textes, caméra, polaroïd, fin) — 21 s
    ├── figurine.js       la figurine présentatrice (intro, passages, polaroïd, fin) — ajoute 3,5 s devant
    ├── musique.py        la bande-son du film seul (21 s)
    └── musique2.py       la bande-son avec la figurine (24,5 s)
```

Le dossier de travail (dans le scratchpad, jamais dans le dépôt) ressemble à :

```
travail/
├── scene.html  figurine.js  musique.py  musique2.py
├── f/     polices + grain.png + fantome.png
├── img/   f0000.jpg … : la vidéo du commerçant, 60 i/s, 948 px de large (numéro = round(seconde × 60))
├── fig/   lili-corps.png  lili-socle.png  apercu-couches.jpg
├── verif/ planches, spectrogrammes
└── rendu/ o0000.jpg … : le film, 1080×1920, 30 i/s
```

---

## 4. L'atelier : ce qu'il faut dans la session

- `ffmpeg` / `ffprobe` (présents).
- Chromium + Playwright (présents dans les sessions cloud : `require("playwright")` marche ; sinon
  `/opt/node-tools/node_modules/playwright` et `/opt/pw-browsers/chromium`, déjà prévus dans `rendu.js`).
  **Ne pas** lancer `playwright install`.
- Un Python avec numpy, scipy, OpenCV, Pillow (pour la musique et la figurine) :
  ```bash
  S=<scratchpad>; python3 -m venv $S/venv-img && $S/venv-img/bin/pip install -q numpy scipy opencv-python-headless pillow
  ```
- La police d'emoji Noto Color Emoji (présente) pour 👋 😍 💗 🤎 dans les textes.
- Un serveur HTTP local pour la scène (en `file://`, Chromium bloque les polices). Le proxy de la session intercepte
  `localhost` : toujours `curl --noproxy '*'` et `NO_PROXY='*'` devant `node`.

---

## 5. La recette, pas à pas

```bash
D=/home/user/trouper-cohorts/outils/clikme-studio      # le dépôt
S=<scratchpad>                                          # ex. /tmp/claude-0/…/scratchpad
W=$S/studio-<commerce>                                  # le dossier de travail

# 0) les fichiers reçus, chacun dans son dossier neuf
mkdir -p $S/recu-video && cp <la vidéo reçue> $S/recu-video/source.mov
mkdir -p $S/recu-figurine && cp <l'image reçue> $S/recu-figurine/source.jpg

# 1) le dossier de travail (≈ 2 min 30 pour 15 s de vidéo : l'interpolation à 60 i/s est lente)
bash $D/outils/preparer.sh $S/recu-video/source.mov $W

# 2) regarder la vidéo : planche-contact des moments, grille pour mesurer (positions en % de l'image)
cd $W && bash $D/outils/planche.sh verif/source.jpg 237 7 img/f0096.jpg img/f0150.jpg …   # numéro = seconde × 60
$S/venv-img/bin/python -I $D/outils/grille.py img/f0912.jpg verif/grille.jpg 600

# 3) adapter scene.html (et figurine.js) au commerçant — voir §8

# 4) (avec figurine) les calques
$S/venv-img/bin/python -I $D/outils/fig-echant.py $S/recu-figurine/source.jpg           # couleurs du fond
$S/venv-img/bin/python -I $D/outils/fig-grille.py $S/recu-figurine/source.jpg verif/fig-bas.jpg 290 680 710 1024
#    → reporter les mesures en tête de fig-couches.py (copie dans $W si on change les réglages), puis :
$S/venv-img/bin/python -I $D/outils/fig-couches.py $S/recu-figurine/source.jpg $W/fig lili   # → fig/lili-*.png

# 5) servir et vérifier quelques images
cd $W && (nohup python3 -m http.server 8977 --bind 127.0.0.1 >/dev/null 2>&1 &)
curl --noproxy '*' -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8977/scene.html     # 200
mkdir -p $W/essai1 && NO_PROXY='*' node $D/outils/essai.js "http://127.0.0.1:8977/scene.html" $W/essai1 60 285 540 720
cd $W/essai1 && bash $D/outils/planche.sh $W/verif/essai1.jpg 270 6 $(ls)       # puis regarder verif/essai1.jpg

# 6) la musique (puis volume normalisé : -14 LUFS, crête -2 dB)
$S/venv-img/bin/python -I $W/musique2.py $W/musique-brute.wav        # musique.py pour la version sans figurine
ffmpeg -v error -y -i $W/musique-brute.wav -af loudnorm=I=-14:TP=-2:LRA=11 -ar 44100 $W/musique.wav

# 7) le rendu complet (≈ 0,2 s par image : 2 min 30 pour 735 images ; en arrière-plan)
mkdir -p $W/rendu && NO_PROXY='*' node $D/outils/rendu.js "http://127.0.0.1:8977/scene.html" $W/rendu
#    version sans figurine : …/scene.html?sans-figurine (630 images)

# 8) l'encodage : la version normale et la version légère (WhatsApp)
bash $D/outils/encoder.sh $W/rendu $W/musique.wav $W/<commerce>-studio.mp4
bash $D/outils/encoder.sh $W/rendu $W/musique.wav $W/<commerce>-studio-leger.mp4 leger

# 9) vérifier le MP4 final (§10), puis l'envoyer au propriétaire (SendUserFile)
```

**Les deux versions avec la même scène :** `scene.html` charge `figurine.js` sauf si l'adresse contient
`?sans-figurine`. `rendu.js` lit la durée annoncée par la page (`window.DUREE_TOTALE` : 21 sans, 24,5 avec).
La musique doit suivre : `musique.py` (21 s) sans figurine, `musique2.py` (24,5 s) avec.

**Ne pas supprimer de dossier dans le scratchpad pendant le travail** (la sécurité de la session bloque les `rm`
larges) : refaire un essai dans un dossier neuf (`essai2/`, `rendu2/`…).

---

## 6. Comment marche la scène (`scene.html`)

### 6.1 Le principe

Une page HTML de 1080×1920 qui n'a **aucune animation CSS** : tout est calculé à partir du temps.
`window.poser(T, n)` pose l'instant `T` (en secondes, `n` = numéro de l'image, pour le grain) et attend que les images
soient décodées. `rendu.js` appelle `poser(n/30)` puis fait une capture, pour chaque image. Le résultat est donc
**exactement reproductible**, image par image, et on peut vérifier n'importe quel instant avec `essai.js`.

Petits outils en tête du script : `seg(t, a, b)` (avancement 0→1 entre a et b), `lerp`, des courbes d'accélération
(`oCub`, `oQui`, `iCub`, `ioCub`, `oBack` qui dépasse un peu), `pts(t, [[t,v]…])` (interpolation par points),
`hasard(n)` (pseudo-aléatoire fixe).

### 6.2 La vidéo du commerçant et la caméra

- Les images sources sont dans `img/` à 60 i/s : `nomImage(s)` donne l'image de la seconde `s` de la source.
- **La carte des temps** `CARTE_S` dit, pour chaque instant `T` du film, quelle seconde `s` de la source montrer.
  C'est là qu'on fait les ralentis (pente < 1), les accélérations (pente > 1), le retour arrière (s qui descend), et
  qu'on choisit les meilleurs moments. Lili Ross :

  | Film T | Source s | Rôle |
  |---|---|---|
  | 0 → 2,0 | 14,2 → 15,2 | **l'accroche** : la fin, au ralenti ×0,5, assombrie, titre « Le look du jour » |
  | 2,0 → 2,5 | 15,2 → 1,55 | **retour arrière** (images fantômes, lignes, tremblement, ◀◀) |
  | 2,5 → 4,5 | 1,55 → 3,05 | 01 · Le pull rose (& la ceinture) |
  | 4,5 → 6,5 | 3,9 → 4,9 → 6,25 | 02 · Le foulard fleuri (coup de zoom à 5,7) |
  | 6,5 → 8,5 | 6,35 → 7,6 → 8,3 | 03 · Le manteau écru (le tourbillon accéléré, puis ralenti) |
  | 8,5 → 10,5 | 8,35 → 8,75 → 9,9 | 04 · Le bonnet rose (zoom sur le visage) |
  | 10,5 → 12,5 | 10,6 → 12,4 → 13,55 | 05 · Le sac à dos noir |
  | 12,5 → 14,5 | 13,6 → 15,2 | « Et voilà. » (recul de caméra) |
  | 14,5 → | 15,2 figée | le déclic, le polaroïd, puis la carte de fin |

- **Cadrage** : l'image est posée en plein écran avec `W0 × H0` px, décalée de `L0, T0`. Pour Lili (enregistrement
  d'écran) : `W0=1274, H0=2290, L0=-97, T0=-11.5` et on ne montre jamais sous `BAS = 84,3 %` de la hauteur source,
  là où commence l'interface d'Instagram (nom, légende ; elle commence vers 86 %). **Avec un fichier d'origine sans
  interface** : `W0=1080`, `H0 = 1080 × hauteur/largeur`, `L0=0`, `T0=0`, `BAS=1`.
- **Zoom** : `camera(T)` donne un zoom `z` et un point fixe `(fx, fy)` en fraction de l'image source ;
  `placeVideo` garde ce point immobile à l'écran (`left = Px − fx·W0·z`, `top = Py − fy·H0·z`) puis empêche de
  voir un bord ou l'interface (`left ≤ 0`, `left + W0·z ≥ 1080`, `top ≤ 0`, `top + BAS·H0·z ≥ 1920`). Chaque chapitre
  a sa poussée lente (1,0 → 1,06…) et parfois un coup de zoom bref (1,035 → 1,16 en 0,16 s au foulard).
- **Les coupes** (`COUPES`, une par mesure de musique, toutes les 2 s) : un zoom flouté (échelle ×1,28, flou 14 px,
  léger glissement) 0,12 s avant et 0,14 s après, plus un flash blanc à 25 %. *Pas* de glissement latéral pur : il
  laisse voir un bord noir.
- **Les flashs** (`#flash`) : chacun **borné dans le temps** (`if (T >= …)`), sinon il blanchit tout ce qui précède.
- Par-dessus : un assombrissement (l'accroche), un dégradé haut/bas pour la lisibilité des textes, un vignettage, le
  **grain** (`f/grain.png` en « overlay » à 7,5 %, déplacé à chaque image), les lignes du retour arrière.
- **Empilement** : `#plan` (la vidéo) a `z-index:0`. Sans ça, les images (z 1–2) passent par-dessus les calques
  d'assombrissement qui n'ont pas de z-index.

### 6.3 Les textes

- **Accroche** : petit « LILI ROSS » qui se resserre, « Le look / du jour » en Playfair italique 200 px qui monte
  ligne par ligne, « pièce par pièce » ; sortie floutée et grossie à 1,72–2,0 s.
- **En-tête des chapitres** : le nom + une barre de 5 segments qui se remplit.
- **Chapitres** (en bas à gauche, au-dessus des 420 px du bas où Instagram pose sa légende) : grand numéro en contour,
  titre en Playfair italique 96 px qui monte d'un masque, sous-titre en Poppins capitales rose, petit trait qui pousse.
- **Le polaroïd** (14,5 s) : flash + déclic, l'image figée passe du plein écran à une carte blanche (fenêtre 560×825,
  bord 22 px, bas 110 px avec « Lili Ross · le look du jour » manuscrit), tournée de −2,5°, sur fond rose poudré,
  titre « Le look complet ». Puis **5 annotations, une par temps** (15,5 / 16 / 16,5 / 17 / 17,5 s) : un point qui
  apparaît sur la pièce (`APPELS` : position en fraction de l'image figée, recalculée avec la rotation de la carte), un
  trait qui se dessine, le nom de la pièce et trois mots. Les points se placent avec `grille.py` sur l'image figée.
- **La carte de fin** (≈ 18,7 s) : « LE LOOK DU JOUR », le nom en Playfair italique 190 px avec un reflet qui passe,
  un filet, **la phrase du commerçant** (sa légende), « Réalisé avec ClikMe Studio » + le fantôme. Avec figurine, le
  texte remonte pour lui laisser la place (`#cadre.avec-figurine #fin`).
- Couleurs : prune `#3A1F2E`, rose `#FFB8CC` / `#C7708C` / `#B4657E`, fond `#F6D9DE → #EFC7CF`.

---

## 7. La figurine (`figurine.js`)

### 7.1 Les calques

L'image du designer est détourée par la couleur du fond (fond uni saturé : on le reconnaît à sa teinte et à sa
saturation, mesurées avec `fig-echant.py`), affinée par GrabCut, puis les reflets du fond sur les bords sont retirés.
`fig-couches.py` en tire deux PNG de même taille (la « boîte ») :

- `<nom>-corps.png` : tout ce qui est au-dessus du ressort (coupé sous l'ourlet) ;
- `<nom>-socle.png` : le socle **redessiné comme un cylindre** (ellipse du dessus + flanc + ellipse du dessous, mesurés
  rangée par rangée), plus ce qui est posé dessus (les bottes). Le détourage seul rongeait le bord du socle.

**Le ressort d'origine disparaît au détourage** (le métal reflète le fond). `figurine.js` le redessine en SVG :
11 spires (demi-ellipses : l'arrière sombre, l'avant en dégradé acier) le long d'une courbe qui part droite du socle
et rejoint le corps, si bien qu'il s'étire, se tasse et se plie avec lui. Tous les réglages propres à une figurine
sont en tête de `fig-couches.py` (boîte, coupe du corps, ellipses du socle, objets posés) et de `figurine.js`
(`FW, FH` = taille de la boîte ; `BAS` = pied du ressort ; `ATT` = point d'attache sous le corps).

### 7.2 Le mouvement

`etat(T)` dit où est la figurine : position du bas du socle à l'écran `(X, Y)`, échelle `s`, longueur du ressort `L`
(1 = repos), penché `phi` (degrés), hauteur du sol (pour l'ombre). Le corps est déplacé au bout du ressort et tourné
de `1,25 × phi`. Les rebonds sont des oscillations amorties (`ressortAmorti`, `tangage`), plus un léger balancement.

| T (avec figurine) | Ce qu'elle fait |
|---|---|
| 0 → 0,3 | tombe du haut de l'écran (fond rose, halo de lumière, étoiles) |
| 0,3 | atterrit : le ressort se tasse et rebondit, elle oscille |
| 0,55 | bulle « Coucou ! 👋 » |
| 1,5 | « Coucou » monte, bulle « Bienvenue chez Lili Ross ! » |
| 2,82 → 3,0 | les bulles s'en vont, elle se tasse sur son ressort |
| 3,0 → 3,4 | elle saute hors de l'écran ; à 3,5 le film commence sur un flash |
| 9,05 → 9,95 | passe par la droite pendant le foulard, penchée vers lui : « Ce foulard ! 😍 » |
| 12,55 → 13,9 | même chose pendant le bonnet : « Et ce bonnet ! 💗 » |
| 18,72 → 21,8 | tombe en bas à droite du polaroïd, rebondit à chaque annotation |
| 21,82 → 22,42 | se tasse puis saute jusqu'à la carte de fin (en grandissant) |
| 22,85 → fin | bulle « À très vite ! 👋 » |

Le film d'origine est simplement décalé : `poser(T)` pose la figurine puis le film à `T − 3,5`. Les bulles
(`BULLES`) se recalent pour ne jamais sortir de l'écran et pointent vers la tête (`cible`).

---

## 8. Adapter à un nouveau commerçant

1. **Regarder toute la vidéo** (planche-contact toutes les 0,5 s) et noter les moments forts en secondes : chaque
   geste, chaque pièce/produit qui apparaît, le plus beau plan final, les passages flous ou trop rapides.
2. **Écrire le découpage** avant de coder, et le montrer au propriétaire si le commerce change de nature :
   l'accroche (le meilleur plan, au ralenti), 4 à 6 chapitres d'une mesure (2 s) chacun, le final, le polaroïd.
3. Dans `scene.html` :
   - `CARTE_S` (les moments), `CHAPITRES` (numéro, titre, sous-titre, zoom, point fixe), `COUPES` ;
   - la géométrie (§6.2) selon que c'est un fichier d'origine ou un enregistrement d'écran ;
   - les textes : le nom (« Lili Ross » est écrit à plusieurs endroits : en-tête, accroche, titres, polaroïd, fin),
     l'accroche, « Et voilà. », la phrase de fin ;
   - `APPELS` (points et libellés du polaroïd) mesurés sur l'image figée, `APPEL_Y` ;
   - les couleurs si l'univers du commerce s'y prête mal.
4. Dans `figurine.js` : les réglages de la boîte, les phases d'`etat(T)` (surtout les deux passages, à caler sur les
   bons produits), les bulles.
5. Dans `musique.py` / `musique2.py` : la structure suit le découpage (accroche 0–2 s, retour arrière 2–2,5, groove
   2,5–12,5 avec un « whoosh » 0,2 s avant chaque coupe, montée 12,5–14,5, déclic 14,5, une note par annotation,
   accord final). Si on change les temps de la scène, changer les mêmes temps ici.
6. Les mots : courts, concrets, sans superlatif inventé. Tout ce qu'on écrit soi-même est listé au propriétaire.

---

## 9. La musique

- Composée note par note dans `musique.py` : 120 BPM (un temps = 0,5 s, une mesure = 2 s = un chapitre), accords
  fa maj7 – sol 6 – mi m7 – la m7 ; instruments synthétisés (grosse caisse, clap, charleston, basse, piano
  électrique FM, nappe en dents de scie, pizzicato, souffles, montée, rembobinage, déclic photo, « pop », étincelles),
  compression rythmique (la nappe et la basse s'effacent sous la grosse caisse), réverbération, écho, limiteur doux.
- `musique2.py` = la même, décalée de `D = 3,5 s`, plus l'intro de la figurine (une petite comptine en fa puis do,
  chute, « boing » du ressort, deux « pop » pour les bulles, tassement, saut) et ses bruitages dans le film (passages,
  atterrissages, saut vers la fin, dernière bulle). Attention : le compte des mesures et des temps se fait **depuis
  le début du film** (`mesure(T)` et `groove` retirent `D`), sinon les accords et les claps se décalent.
- Toujours normaliser après : `loudnorm=I=-14:TP=-2:LRA=11` (≈ -14 LUFS, crête -2 dB).
- Vérifier avec un spectrogramme :
  `ffmpeg -t 4.5 -i musique.wav -lavfi showspectrumpic=s=900x300:legend=1:scale=log:fscale=log verif/spectre.png`.

---

## 10. Vérifier avant d'envoyer

- Tirer ~25 images **du MP4 final** (pas du dossier `rendu/`) aux instants clés et en faire 2 ou 3 planches :
  ```bash
  for t in 0.5 1.8 3.2 5.0 9.4 13.0 18.1 19.2 20.6 22.1 23.5 24.4; do ffmpeg -v error -y -ss $t -i film.mp4 -frames:v 1 -q:v 3 v/t$t.jpg; done
  ```
- Regarder : textes lisibles et entiers, rien ne sort de l'écran, l'interface d'Instagram jamais visible, pas de
  flash qui blanchit un passage, les transitions (le polaroïd qui part, la carte de fin qui arrive) propres.
- `ffprobe` : durée exacte (21,0 / 24,5 s), 1080×1920, 30 i/s, piste audio présente. Volume :
  `ffmpeg -i film.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:"` (≈ -14 LUFS, crête ≈ -2 dB).
- Comparer la version légère et la normale sur un recadrage (elles doivent être quasi identiques).
- Dire au propriétaire : ce qui a été vérifié, que la vidéo n'a pas été vue en temps réel, les phrases à relire,
  ce qui limite la qualité (source floue, enregistrement d'écran, pas de son).

---

## 11. Pièges déjà rencontrés

| Symptôme | Cause | Solution |
|---|---|---|
| Polices absentes, page blanche | page ouverte en `file://` | servir en HTTP (`python3 -m http.server`) |
| `curl` renvoie 000 vers `127.0.0.1` | le proxy de la session | `curl --noproxy '*'`, `NO_PROXY='*' node …` |
| L'accroche est toute blanche | un flash non borné dans le temps | `if (T >= début)` devant chaque flash |
| L'assombrissement ne se voit pas | la vidéo (z-index 1) passe au-dessus | `#plan{z-index:0}` |
| Bord noir pendant les coupes | glissement latéral de l'image | zoom flouté à la place |
| Libellés qui passent à la ligne / débordent | colonne trop étroite | `white-space:nowrap`, taille réduite, colonne décalée |
| Bulles coupées à droite | largeur inconnue d'avance | mesurer `offsetWidth` à chaque image et recaler |
| Le polaroïd sort lentement et se mêle à la fin | sortie trop longue | sortie en 0,3 s, fin qui arrive après |
| Carte de fin vide au milieu (sans figurine) | mise en page pensée pour la figurine | `#cadre.avec-figurine` seulement avec figurine |
| Ressort disparu au détourage | le métal reflète le fond | ressort redessiné en SVG |
| Bord du socle rongé, puis bande rose dessous | reflets du fond, image coupée en bas | socle redessiné en cylindre géométrique |
| Petits défauts pendant les gestes rapides | l'interpolation à 60 i/s | accélérer ces passages dans `CARTE_S` |
| Fichier normal lourd (≈ 2,5 Mo/s) | le grain | version « leger » (crf 22, 5 Mb/s max), quasi identique |
| `rm -rf` refusé dans le scratchpad | sécurité de la session | travailler dans un dossier neuf |

---

## 12. Temps et tailles (Lili Ross)

- Préparation (interpolation 60 i/s + étalonnage, 15 s de source) : ≈ 2 min 30.
- Rendu : ≈ 0,2 s par image (630 images ≈ 2 min, 735 ≈ 2 min 30).
- Encodage (préréglage `slow`) : ≈ 1 min par version.
- Sans figurine : 52 Mo / 10 Mo (légère). Avec figurine : 56 Mo / 12 Mo (légère, envoyée au propriétaire).

---

## 13. Pour aller plus loin (idées)

- **Dans l'appli** : partir du moteur de montage déjà dans le téléphone (`src/lib/direct/interview-montage.ts`) et de
  la transcription (`/api/direct/transcrire`) ; une V1 à 3 gestes (choisir les moments, valider les mots, choisir
  avec ou sans figurine) et 2 sorties (Reel, Story). La voix off : celle du commerçant, enregistrée, jamais fabriquée.
  Une case de consentement pour les personnes filmées. Un contrôle qualité avant publication.
- **La figurine actrice** : avec plusieurs poses (montrer, coucou) et une bouche ouverte, elle peut désigner le produit
  et parler avec la voix enregistrée du commerçant (bouche qui bouge au rythme du son, comme dans `/collection`).
- **Les modes de présence** (au choix du commerçant) : seulement au début, en interaction avec le produit, seulement à
  la fin en signature, plusieurs apparitions, ou aucune. Règle : la vraie vidéo vend le produit, la figurine lui donne
  une personnalité.

---

## 14. Dans l'appli : le Studio du comptoir (novembre 2026)

Le film de l'atelier, fait par le téléphone du commerçant, sans personne derrière. **Même scène, mêmes temps, mêmes
courbes** que `lili-ross/scene.html` et `figurine.js` (21 s, ou 24,5 avec la figurine), redessinés sur une toile.

### Ce que fait le commerçant (quatre gestes)

1. **Sa vidéo** : il filme (10 à 20 s conseillées ; 4 s au moins, une minute au plus) ou en choisit une.
2. **Ses cinq moments** : l'appli coupe sa vidéo en cinq parts égales et propose le début de chacune ; il peut déplacer
   un moment (il touche l'image, un curseur), et écrit **ce qu'on y voit** (« Le pull rose »). Un moment sans mots n'a
   que son numéro. Il peut changer le titre (« Le look du jour » par défaut, selon son métier) et ajouter sa phrase pour
   la carte de fin.
3. **Avec ou sans sa figurine.** S'il n'en a pas, il la fabrique ici : un selfie, son accord coché, une minute.
4. **Le montage**, sous ses yeux (le film se joue une fois et s'enregistre), puis il le revoit, le **publie** (Le
   Direct, sa page, ses réseaux en Reel si c'est du MP4 — `envoyerStudio`) ou le **garde sur son téléphone**.

### Ce qui change par rapport à l'atelier

| L'atelier (à l'œil) | L'appli (sans regarder) |
|---|---|
| `CARTE_S` choisie moment par moment | cinq moments répartis (il peut les déplacer) ; chaque chapitre joue 2 s de son moment, ralenti s'il y a moins de 2 s jusqu'au suivant (`plansDuFilm`) |
| un point de zoom par chapitre, mesuré | le même point pour tous : un peu au-dessus du centre (`POINT`), cinq mouvements de caméra différents |
| sous-titres des chapitres écrits par Claude | pas de sous-titre : seulement ses mots |
| points posés sur les pièces du polaroïd | la liste de ses mots à droite du polaroïd, une étoile chacun, un par temps |
| bulles écrites pour Lili (« Ce foulard ! ») | ses mots repris : « Le foulard fleuri ! 😍 », « Et le bonnet rose ! 💗 » (moments 2 et 4) ; sans mots : « Regardez ! 😍 », « J'adore ! 💗 » |
| figurine détourée à la main, en deux calques | son buste généré, sur **le ressort et le socle communs** (`public/studio/socle.webp`) |
| musique en Python, normalisée | la même partition en Web Audio (`studio-musique.ts`), ≈ -14 LUFS mesurés |
| MP4 1080×1920 | 720×1280 (le format des vidéos de l'appli) ; MP4 H.264 sur iPhone, WebM ailleurs |

### L'extrait de 8 secondes pour ses partenaires de diffusion

S'il est dans le réseau de diffusion croisée (`docs/diffusion-croisee.md`), « Publier mon film » prépare d'abord un
**extrait de 8 secondes** (`studio-extrait.ts`, `monterExtrait`) : le téléphone rejoue le film qu'il vient de monter
(après l'intro de la figurine), en garde 6,4 s avec « 📣 Découverte du quartier » et le nom du commerce, puis une carte
de fin (« Le film entier sur sa page », son adresse). C'est lui qui part chez ses deux partenaires ; ses propres
réseaux reçoivent le film entier.

### Les fichiers

- `src/lib/direct/studio.ts` : les temps du film, les moments proposés, les plans, les mots par métier, les bulles,
  le texte de l'annonce (partagé, sans navigateur).
- `src/lib/direct/studio-musique.ts` : la musique (Web Audio, hors du temps).
- `src/lib/direct/studio-montage.ts` : le dessin image par image (`dessiner`), les deux lecteurs qui se relaient,
  les images figées (retour arrière, polaroïd), l'enregistrement. `poserUneImage` pose le film à un instant donné
  (pour vérifier sans tout monter).
- `src/app/autour-de-moi/assistante/studio-comptoir.tsx` : l'écran ; `figurine-comptoir.tsx` : la figurine.
- `public/studio/` : les polices de l'atelier (Playfair Display italique, Poppins ; licences jointes) et le socle.

### La figurine à partir d'un selfie

- `src/lib/direct/figurine-pro.ts` : la règle et **la consigne envoyée au moteur d'image** (fonction pure, à relire).
- `src/lib/direct/figurine-pro-serveur.ts` : le moteur (celui de l'essayage, `moteur-image.ts`, avec ses replis), le
  détourage, le stockage.
- `src/app/api/site-internet/pro/figurine/route.ts` : `etat`, `fabriquer`, `valider`, `fabriquer-edition`,
  `valider-edition`, contre le jeton pro.
- **Où il la fait** : **« 🪀 Ma figurine du mois »**, une carte de l'accueil du comptoir et une ligne de Ma boutique
  (écran `MaFigurine`) ; et toujours depuis le Studio, au moment de choisir « avec sa figurine ».
- **Le style ClikMe, celui des figurines faites à la main** (`STYLE` de `figurine-pro.ts`) : une caricature 3D tendre
  et drôle, la **tête énorme** sur un petit corps, un grand sourire, deux ou trois **accessoires de son métier**
  (`METIER`), une résine peinte très nette. Le premier essai réel rendait un buste réaliste sur une coupelle en bois :
  « on est loin de la figurine cartoony ».
- On ne fait générer **que le buste, jusqu'aux hanches** (pas de coupelle : le ressort part de sous ses vêtements, dans
  l'aperçu comme dans le film), sur **fond transparent** ; un moteur qui ne sait
  pas en rendre reçoit un **fond vert d'incrustation uni**, retiré par `detourerSurFondUni` (remplissage depuis les
  bords sur la teinte — une clé de couleur simple ronge les visages ; le magenta est trop près de la peau).
- **Son selfie n'est jamais gardé.** Rien ne passe dans une vidéo avant son « C'est moi ». Trois essais par jour.
- **Ses traits en mots** (`decrireTraits`, `QUESTION_TRAITS`, `traitsEnMots`) : avant de fabriquer, le modèle de vision
  du dressing (`regarderImage`) décrit le selfie — couleur et coiffure des cheveux, barbe, forme du visage, sourcils,
  yeux, nez, âge, signes distinctifs, lunettes ou non — et la consigne les écrit noir sur blanc (« SES TRAITS, VUS SUR LA
  PHOTO »). Troisième essai réel : en fidélité basse, sans eux, des cheveux gris poivre et sel devenaient bruns et la
  barbe de trois jours disparaissait. Ces mots restent avec sa figurine (`validee.traits`) pour l'habiller sans la
  changer ; le selfie, lui, n'est pas gardé. Sans réponse en 35 s, on fabrique sans eux.
- **🔍 Voir en grand** (`VoirEnGrand`) : sous chaque figurine proposée ou validée, la figurine ENTIÈRE (sur son ressort
  et son socle) à la taille de l'écran, et l'image seule à ouvrir pour zoomer avec les doigts — pour la juger avant de
  dire « C'est moi ». Le buste seul, en grand, avait l'air d'une caricature peinte.
- **La figurine ENTIÈRE, deux propositions, et Gemini** (cinquième essai réel : « c'est pas moi et ça fait plus photo /
  peinture que figurine », avec sa figurine d'Halloween en exemple, faite avec Gemini). Ce qui fait une figurine : un
  objet entier photographié en studio. Le moteur fabrique donc la figurine ENTIÈRE — tronquée à la taille, le ressort
  métallique apparent, le socle rond en bois, des chaussures et un objet de son métier posés dessus — d'après une
  consigne écrite en anglais sur le modèle du prompt Gemini du propriétaire (`consigneFigurine`). Le fichier finit par
  `-entiere.png` (`SUFFIXE_ENTIERE`) : l'aperçu le montre tel quel (il se balance), le film aussi (`dessinerEntiere` ;
  les bustes d'avant gardent le ressort et le socle communs). À chaque essai, DEUX propositions parties en même
  temps : Gemini (`genererParGemini` : fond vert retiré, format 2:3, `gemini-3-pro-image-preview` puis
  `gemini-2.5-flash-image`, ou `GEMINI_FIGURINE_MODEL`) et OpenAI en fidélité « high » — sans clé Gemini, OpenAI
  « high » et « low ». Il choisit « Laquelle te ressemble ? » ; la voie choisie est notée (`modele`, et un
  `[figurine] choisie` dans les journaux) : ses choix diront laquelle garder. Une fabrication coûte donc deux images.
- **Le rendu « jouet miniature »** (sixième essai réel : la forme était la bonne, mais « elle me ressemble et fait pas
  figurine » — un vrai homme photographié) : `MATIERE` dit un jouet en résine d'une vingtaine de centimètres, la peau
  lisse et un peu brillante sans pores, les cheveux en mèches brillantes, la barbe en petits points peints, les
  vêtements SCULPTÉS et peints ; la photo est une photo MACRO de miniature, avec de petits reflets sur la résine.
- **« par Gemini » / « par OpenAI »** sous chaque proposition et dans sa vue en grand (`voies`) : il dit lequel lui
  ressemble, lequel fait figurine.
- **Pas de jambes** (septième essai réel : « il y a les jambes en trop » — un pantalon et des chaussures plantées sur le
  socle) : les chaussures posées sur le socle y faisaient mettre des pieds. La consigne dit maintenant « NO LEGS, NO
  TROUSERS, NO FEET », le ressort seul entre le corps et le socle, et des chaussures VIDES à côté.
- **🎨 Une image de référence de style, facultative** (`FIGURINE_REFERENCE_URL`, une adresse https) : elle part en
  seconde image avec chaque fabrication, aux deux moteurs, et la consigne (`AVEC_REFERENCE`) dit qu'on n'en prend que le
  style — jamais le visage, la tenue ni les accessoires. Jamais dans le dépôt, et seulement une image qu'on a le droit
  d'envoyer aux moteurs (un visage dont la personne est d'accord, ou une figurine sans vrai visage).
- **Un objet, et son expression à lui** (quatrième essai réel : « c'est joli mais ça fait pas avatar figurine et ça me
  ressemble pas, et sur la photo je ne souris pas ») : la consigne dit la matière (`MATIERE` — pas une illustration ni
  une peinture numérique, un jouet sculpté : cheveux en mèches pleines, barbe peinte, peau lisse satinée, reflets de
  studio) ; elle n'impose plus de sourire ni d'yeux agrandis (`EXPRESSION` : s'il ne sourit pas, elle ne sourit pas),
  et son expression est l'un de ses traits décrits.
- **Seulement dans SON comptoir** (ouvert par son lien pro : `commerce.reel`). Dans la visite du comptoir (sans lien
  pro), rien ne se fabrique : l'écran le dit dès le début, avant qu'il prenne son selfie. Et le bouton gris dit
  toujours pourquoi (« D'abord ton selfie », « Coche la case… », « Trois figurines aujourd'hui… »).
- Stockage : le seau public `figurines-pros` (créé au premier dépôt), `<site>/etat.json` et les images.

### Sa figurine du mois (l'édition du moment)

- **L'édition** est celle de la collection (`EDITIONS_DATEES`, `editionsDuMoment` de `collection.ts`) : **une par
  mois**, avec son thème — Halloween 🎃 en octobre, Automne 🍂 en novembre, Noël 🎄 en décembre, Galette des rois 👑 en
  janvier… (`docs/figurines.md`, 9.2).
- Une fois **sa** figurine validée, il l'**habille pour l'édition** : son buste validé est renvoyé au moteur d'image
  avec la consigne `consigneEdition` (`figurine-pro.ts`) — même visage, même pose, mêmes proportions, même cadrage ;
  **seuls la tenue et les accessoires changent**, ceux de `TENUES_EDITION`, généreux comme sur la figurine d'Halloween
  du propriétaire (pour Noël : bonnet de Père Noël, pull de Noël, écharpe rayée, sucre d'orge, paquet cadeau). Ces
  tenues sont à relire.
- Route : `fabriquer-edition` (compte dans les trois essais du jour), puis `valider-edition` (« Elle est parfaite »).
  Rangée dans `etat.json` sous `editions["automne-2026"]` : une édition manquée est manquée. S'il refait sa figurine
  avec un nouveau selfie, celle de l'édition en cours est à rhabiller (elle portait l'ancien visage).
- **Le Studio prend la figurine du mois** quand elle est validée, sinon sa figurine de tous les jours
  (`figurineDuMoment`).

### Sa collection de figurines

- **Chaque figurine qu'il valide y entre et n'en sort plus** (`etat.collection`, `ajouterALaCollection`) : sa figurine
  de tous les jours (`cle: "selfie"`), et chaque figurine du mois avec les dates de son édition. Quand il refait sa
  figurine ou que l'édition passe, l'ancienne reste. Celles validées avant la collection y sont rangées à la lecture.
- **Où** : « 🗂 Ma collection », en bas de l'écran « Ma figurine » : une vignette par figurine, son mois de création,
  et une pastille (« Dans tes films », « En ce moment », « Édition finie »).
- **Sa fiche** (on touche une vignette) : elle en grand, et son histoire en trois lignes (`histoireDeLaFigurine`,
  `figurine-pro.ts`) — **sa création** (« Créée en novembre 2026 »), **pendant son édition** (« jusqu'au 20 décembre :
  tes clients la gagnent en venant chez toi… »), **après** (« elle ne se gagne plus ; elle reste dans ta collection, et
  tu peux toujours la mettre dans un petit film »). Puis « 🎬 Faire un petit film avec elle » : le Studio s'ouvre avec
  elle (`figurineDepart`).
- **Dans le Studio**, au choix « Avec ta figurine ? » : s'il en a plusieurs, « Laquelle ? » — toute sa collection,
  celle du moment choisie d'office.
- Réglages (variables d'environnement, toutes facultatives) : `OPENAI_API_KEY` (sans elle, la fabrication répond
  « pas encore branchée »), `OPENAI_IMAGE_MODEL` (impose un moteur), `FIGURINE_QUALITE` (`high` par défaut),
  `FIGURINE_FIDELITES` (les fidélités d'OpenAI, `high,low` par défaut), `GEMINI_API_KEY` (la voie Gemini),
  `GEMINI_FIGURINE_MODEL` (impose un modèle Gemini), `FIGURINE_SANS_GEMINI=1` (sans la voie Gemini),
  `FIGURINE_REFERENCE_URL` (l'image de référence de style, voir plus haut),
  `FIGURINE_ESSAIS_PAR_JOUR` (3), `FIGURINES_PROS_BUCKET`.
- **La fidélité à l'image d'entrée : basse (`low`).** En `high` (le premier réglage), le moteur recopie le selfie : un
  visage photographique collé sur un petit corps, et pour l'édition l'ancienne tenue gardée (« pas très automne »,
  3 novembre 2026). En `low`, il réinterprète : la caricature sculptée et peinte, et la tenue vraiment changée. La
  consigne met le STYLE en premier (« pas une photo : sculpté et peint »), la ressemblance ensuite.

### Vérifier

Une page d'essai temporaire (`src/app/zz-studio/page.tsx`, jamais commitée) qui pose le film à des instants donnés
(`poserUneImage`) ou le monte en entier, avec une vidéo d'essai faite par ffmpeg (`testsrc2`, 12 s, WebM : le Chromium
des sessions ne lit pas le H.264) ; puis Playwright : captures, et le film enregistré récupéré pour `ffprobe` et
`ebur128`. La route de la figurine se simule dans Playwright (`page.route`) : le moteur d'image n'est pas joignable
depuis une session.

### Pas encore fait

- La figurine fabriquée (et celle du mois) ne remplace pas encore son double dans **la collection des clients** (`FIGURINES` de
  `figurines-commerces.ts`, faite à la main) ni sur sa page.
- Une seule pose (bras croisés), pas de bouche ouverte : elle parle par bulles. Les poses multiples et la bouche
  (`docs/figurines.md`, 9.7) viendront avec des retouches du même buste.
- Les modes de présence de la figurine (seulement au début, seulement à la fin…) : un seul pour l'instant, celui de
  Lili Ross.

