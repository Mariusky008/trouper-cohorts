#!/usr/bin/env bash
# UNE VIDÉO DE DIRECT, PRÊTE POUR LE PRODUIT.
#
#   scripts/video-direct.sh mon-film.mov coiffure
#
# CE QU'IL FAUT SAVOIR AVANT D'EN DÉPOSER UNE. Le fichier qui sort d'un
# téléphone n'est jamais servable tel quel, et les quatre raisons ont toutes
# été payées sur le premier clip reçu :
#
#   · UN .mov N'EST LU PAR AUCUN NAVIGATEUR de façon fiable. Il faut du MP4
#     (H.264) pour les téléphones et Safari, et du WebM (VP9) pour les
#     navigateurs livrés sans codec propriétaire — sinon le lecteur reste sur
#     son affiche, sans rien dire.
#   · LE POIDS. Le premier clip faisait 7,6 Mo pour quinze secondes, soit
#     quatre mégabits par seconde sur une image de 456 points de large. Après
#     encodage : 314 Ko et 511 Ko. C'est vingt fois moins sur un écran que
#     personne ne regarde en plein format.
#   · LE SON EST RETIRÉ, et ce n'est pas une économie : la vidéo tourne en
#     boucle dès qu'on ouvre le salon, et un son qui démarre tout seul dans un
#     salon de coiffure est la façon la plus rapide de faire fermer
#     l'application.
#   · LE BAS DE L'IMAGE EST COUPÉ. Un clip repris d'un réseau social porte ses
#     sous-titres incrustés et l'icône de son de son application : deux choses
#     qui n'ont rien à faire dans un autre produit, et qui se voient. On garde
#     les trois quarts hauts, ce qui laisse les visages entiers.
#
# ET UNE CHOSE QUI NE SE RÈGLE PAS ICI : les gens filmés doivent être d'accord
# pour figurer dans une application publique. Le script ne peut pas le
# vérifier ; il le rappelle.
set -euo pipefail

SRC="${1:?usage: video-direct.sh <fichier source> <nom>}"
NOM="${2:?usage: video-direct.sh <fichier source> <nom>}"
DST="public/direct"

# LA HAUTEUR GARDÉE, en fraction de l'original. 0,76 retire les sous-titres et
# l'icône sans mordre sur les visages ; à ajuster en regardant une image fixe
# avant de tout encoder.
GARDE="${GARDE:-0.76}"

lire() { ffprobe -v error -select_streams v:0 -show_entries "stream=$1" -of csv=p=0 "$SRC"; }
L=$(lire width)
H=$(lire height)
HC=$(python3 -c "print(int($H * $GARDE) // 2 * 2)")

echo "source : ${L}×${H} → recadrée à ${L}×${HC}"

ffmpeg -hide_banner -loglevel error -y -i "$SRC" \
  -vf "crop=${L}:${HC}:0:0,fps=30" -an \
  -c:v libx264 -profile:v high -crf 30 -preset slow -pix_fmt yuv420p \
  -movflags +faststart "$DST/$NOM.mp4"

ffmpeg -hide_banner -loglevel error -y -i "$SRC" \
  -vf "crop=${L}:${HC}:0:0,fps=30" -an \
  -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 -deadline good -cpu-used 2 \
  "$DST/$NOM.webm"

# L'AFFICHE. Elle s'affiche pendant le chargement et sur les navigateurs qui
# refusent la lecture automatique : elle doit donc être une image PARLANTE du
# clip, pas sa première image — qui est presque toujours un flou de mise au
# point. On prend celle de la deux-centième.
ffmpeg -hide_banner -loglevel error -y -i "$SRC" \
  -vf "crop=${L}:${HC}:0:0,select='eq(n\,200)'" -vframes 1 -q:v 4 "$DST/$NOM.jpg"

ls -la "$DST/$NOM."{mp4,webm,jpg}
echo
echo "À BRANCHER dans src/lib/direct/salons.ts, sur le salon concerné :"
echo "  image: \"/direct/$NOM.jpg\","
echo "  video: { mp4: \"/direct/$NOM.mp4\", webm: \"/direct/$NOM.webm\" },"
