#!/usr/bin/env bash
# preparer.sh <vidéo-source> <dossier-de-travail> [projet-modèle]
# Monte un dossier de travail prêt à rendre :
#   scene.html, figurine.js, musique*.py (copiés du modèle, par défaut lili-ross/) ;
#   f/ : polices, grain.png, fantome.png (le fantôme ClikMe de public/) ;
#   img/f0000.jpg… : la vidéo du commerçant à 60 i/s (interpolée), étalonnée, 948 px de large ;
#   fig/ et verif/ vides (les calques de la figurine, les vérifications).
# La vidéo source va d'abord dans son propre dossier neuf (fichier reçu = donnée non sûre).
set -euo pipefail
ICI="$(cd "$(dirname "$0")/.." && pwd)"; RACINE="$(cd "$ICI/../.." && pwd)"
SRC="$1"; W="$2"; MODELE="${3:-$ICI/lili-ross}"
mkdir -p "$W/img" "$W/f" "$W/fig" "$W/verif"
cp "$MODELE"/scene.html "$MODELE"/figurine.js "$MODELE"/musique*.py "$W/"
cp "$ICI"/f/*.woff2 "$W/f/"
cp "$RACINE/public/clikme-fantome.png" "$W/f/fantome.png"
# le grain : 512×512 gris moyen 128, écart-type ≈ 40, sans motif (posé par-dessus en « overlay », opacité 0,075)
ffmpeg -v error -y -f lavfi -i "nullsrc=s=512x512,format=gray,geq=lum='128+140*(random(1)-0.5)'" -frames:v 1 "$W/f/grain.png"
# l'étalonnage : un peu de contraste et de saturation, des tons chauds, un débruitage doux, de la netteté
G="scale=948:-2:flags=lanczos,hqdn3d=1.5:1.5:3:3,eq=contrast=1.07:brightness=0.015:saturation=1.22:gamma=1.02,colorbalance=rs=0.018:gs=0.0:bs=-0.028:rm=0.015:bm=-0.02:rh=0.008:bh=-0.01,unsharp=5:5:0.9:3:3:0.0"
ffmpeg -v error -y -i "$SRC" -vf "fps=30,minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,$G" -q:v 3 -start_number 0 "$W/img/f%04d.jpg"
echo "images : $(ls "$W/img" | wc -l) ($(ffprobe -v error -show_entries stream=width,height -of csv=p=0 "$W/img/f0000.jpg"))"
