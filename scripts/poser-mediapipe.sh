#!/usr/bin/env bash
# 💅 METTRE LE MOTEUR ET LE MODÈLE DE L'ESSAI D'ONGLES À LEUR PLACE.
#
# ═══ CE QUI EST VERSIONNÉ ET CE QUI NE L'EST PAS, ET POURQUOI CE PARTAGE ══
#
# LE MOTEUR (onze mégaoctets) VIENT DE `node_modules`. Il est donc garanti
# présent à la compilation, où que ce soit, sans réseau — le recopier ici est un
# `cp`, et le versionner alourdirait chaque clone pour rien.
#
# LE MODÈLE (sept mégaoctets et demi) EST DANS LE DÉPÔT, et ça a été payé cher.
# Il était téléchargé ici, par ce script, appelé par `direct-build.sh` — MAIS LA
# PRODUCTION NE LANCE PAS `direct-build.sh`, elle lance `next build`. En ligne,
# `/mediapipe/…` répondait donc 404, l'essai d'ongles levait une exception, et
# l'écran retombait sur la photo du catalogue sans rien dire. « J'ai pris la
# photo de ma main et au résultat j'ai la photo des ongles de la photo que j'ai
# choisie. »
#
# DEUX LEÇONS, ET ELLES SONT DANS LE CODE MAINTENANT : ce script est appelé en
# `prebuild` dans `package.json`, donc par TOUTE compilation ; et un fichier dont
# dépend une fonctionnalité en ligne ne se télécharge pas au moment de compiler,
# il voyage avec le code.
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
