#!/usr/bin/env bash
# encoder.sh <dossier-des-images> <musique.wav> <sortie.mp4> [leger]
# Images o0000.jpg… à 30 i/s + la musique → MP4 vertical H.264/AAC, lisible partout (yuv420p, faststart).
# Normal : crf 17 (≈ 2,5 Mo/s à cause du grain). « leger » : crf 22 plafonné à 5 Mb/s (≈ 0,5 Mo/s, passe sur WhatsApp),
# à l'œil quasi identique.
set -euo pipefail
IMG="$1"; WAV="$2"; OUT="$3"
if [ "${4:-}" = "leger" ]; then Q="-crf 22 -maxrate 5M -bufsize 10M"; A=160k; else Q="-crf 17"; A=192k; fi
ffmpeg -v error -y -framerate 30 -i "$IMG/o%04d.jpg" -i "$WAV" -c:v libx264 -preset slow $Q -pix_fmt yuv420p -profile:v high -r 30 \
  -c:a aac -b:a $A -movflags +faststart -shortest "$OUT"
ffprobe -v error -show_entries format=duration,size -of compact "$OUT"
