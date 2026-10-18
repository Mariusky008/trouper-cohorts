#!/usr/bin/env bash
# 🔁 LES ESSAIS SQL DE L'ÉCHANGE — sur une base Postgres jetable, jamais la vraie.
#
# Reconstruit la base `essai_echanges` avec toutes les migrations de l'échange
# (`*_echanges_*.sql`, dans l'ordre ; la dernière une seconde fois, pour vérifier
# qu'elle se rejoue sans casser), puis lance chaque `scripts/essai-echanges-*.sql`.
# Un essai réussi finit par « TOUT EST BON » ; sinon le script s'arrête en erreur.
#
# La connexion se règle avec les variables habituelles de psql (PGHOST, PGUSER,
# PGPASSWORD…). Sur le poste : `su postgres -c "bash scripts/essais-sql-echanges.sh"`.
# Sur GitHub : voir `.github/workflows/clikme-verifications.yml`.
set -euo pipefail
cd "$(dirname "$0")/.."

BASE=essai_echanges
psql -q -d postgres -c "DROP DATABASE IF EXISTS $BASE" -c "CREATE DATABASE $BASE"
# Ce que Supabase fournit et que les migrations supposent : ses trois rôles, et la table des sites.
psql -q -v ON_ERROR_STOP=1 -d "$BASE" <<'SQL'
DO $$ BEGIN CREATE ROLE anon; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE service_role; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE public.human_vitrine_sites (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text);
SQL

migrations=$(ls supabase/migrations | grep _echanges_ | sort)
for f in $migrations $(echo "$migrations" | tail -1); do
  if ! psql -q -v ON_ERROR_STOP=1 -d "$BASE" -f "supabase/migrations/$f" > /dev/null 2> /tmp/essai-migration.err; then
    echo "ÉCHEC de la migration $f :"; cat /tmp/essai-migration.err; exit 1
  fi
done

echec=0
for t in reseau equipe factures moitie offres signalements; do
  sortie=$(psql -q -v ON_ERROR_STOP=1 -d "$BASE" -f "scripts/essai-echanges-$t.sql" 2>&1 || true)
  ok=$(echo "$sortie" | grep -c 'ok' || true)
  if echo "$sortie" | grep -q 'TOUT EST BON'; then
    echo "  ok   $t : $ok vérifications, tout est bon"
  else
    echo "ÉCHEC $t :"; echo "$sortie" | grep -E 'ÉCHEC|ERROR|ERREUR' | head -5
    echec=1
  fi
done
exit $echec
