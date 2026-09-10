#!/usr/bin/env bash
# 💅 METTRE LE MOTEUR ET LE MODÈLE DE L'ESSAI D'ONGLES À LEUR PLACE.
#
# ═══ POURQUOI CES FICHIERS NE SONT PAS DANS LE DÉPÔT ══════════════════════
#
# ILS PÈSENT DIX-NEUF MÉGAOCTETS. Un dépôt les porterait dans CHAQUE clone, pour
# toujours, y compris chez qui ne touchera jamais à l'onglerie — et Git ne sait
# pas oublier un binaire. Ils sont donc reconstitués depuis `node_modules` et
# depuis Google, et `public/mediapipe/` est ignoré.
#
# ET ILS SONT SERVIS DEPUIS CHEZ NOUS, PAS DEPUIS UN CDN TIERS. La photo de la
# main ne quitte jamais le téléphone — c'est tout l'intérêt d'un modèle qui
# tourne en local — et aller chercher le modèle chez un tiers dirait à ce tiers
# QUI ouvre un mur d'onglerie et quand. On paie l'hébergement pour ne pas avoir
# à l'expliquer.
#
# LE SCRIPT EST VERSIONNÉ PARCE QUE `direct-build.sh` L'A DÉJÀ ÉTÉ POUR CETTE
# RAISON : ce qui sert à fabriquer le produit appartient au produit.
set -euo pipefail
cd "$(dirname "$0")/.."

DEST=public/mediapipe
SRC=node_modules/@mediapipe/tasks-vision/wasm
MODELE=https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task

mkdir -p "$DEST"

if [ ! -d "$SRC" ]; then
  echo "✗ @mediapipe/tasks-vision manque. Lancez : npm install" >&2
  exit 1
fi

# Le moteur, en deux versions : SIMD pour les navigateurs récents, et son repli
# pour les autres. `FilesetResolver` choisit tout seul, à condition de trouver
# les quatre fichiers sous les noms qu'il attend.
for f in vision_wasm_internal.js vision_wasm_internal.wasm \
         vision_wasm_nosimd_internal.js vision_wasm_nosimd_internal.wasm; do
  cp -f "$SRC/$f" "$DEST/$f"
done

# Le modèle. Téléchargé une fois ; on ne le reprend pas s'il est déjà là.
if [ ! -s "$DEST/hand_landmarker.task" ]; then
  echo "· téléchargement du modèle de main…"
  curl -sSfL --retry 3 --max-time 180 -o "$DEST/hand_landmarker.task.part" "$MODELE"
  mv "$DEST/hand_landmarker.task.part" "$DEST/hand_landmarker.task"
fi

du -sh "$DEST" | sed 's/^/✓ /'
