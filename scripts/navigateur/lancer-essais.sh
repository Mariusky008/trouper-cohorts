#!/usr/bin/env bash
# 🔁 L'ESSAI DE LA ROUTE ET LES ESSAIS NAVIGATEUR DE L'ÉCHANGE, chacun sur un faux Supabase neuf.
#
# Suppose l'app déjà lancée sur ESSAI_BASE (http://localhost:3821 par défaut), branchée sur le faux
# Supabase (NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321) et avec ECHANGES_SEUIL_VILLE=3.
# Le port 54321 doit être libre : ce script lance et arrête lui-même le faux Supabase.
set -uo pipefail
cd "$(dirname "$0")/../.."

FAUX=""
arreter() { if [ -n "$FAUX" ]; then kill "$FAUX" 2> /dev/null; wait "$FAUX" 2> /dev/null; FAUX=""; fi; }
trap arreter EXIT
neuf() {
  arreter
  node scripts/faux-supabase.mjs > /tmp/faux-supabase.log 2>&1 &
  FAUX=$!
  for _ in $(seq 1 40); do
    curl -fs -o /dev/null http://127.0.0.1:54321/rest/v1/human_vitrine_sites && return 0
    sleep 0.5
  done
  echo "Le faux Supabase ne répond pas :"; cat /tmp/faux-supabase.log; exit 1
}

echec=0
for essai in scripts/essai-echanges-reseau.mjs scripts/navigateur/echanges-moitie.mjs scripts/navigateur/echanges-equipe.mjs scripts/navigateur/echanges-factures.mjs; do
  neuf
  if node "$essai" > /tmp/essai.log 2>&1; then
    echo "  ok   $essai ($(grep -c '^  ok' /tmp/essai.log) vérifications)"
  else
    echo "ÉCHEC $essai :"
    grep -E 'ÉCHEC|Error|Timeout' /tmp/essai.log | head -10
    tail -15 /tmp/essai.log
    echec=1
  fi
done
exit $echec
