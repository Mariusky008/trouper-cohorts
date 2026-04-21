# Popey Human Smart Scan QA Checklist (S1)

## Pré-requis
- Migrations SQL exécutées:
  - `20260421174000_create_human_smart_scan_followup_job_events.sql`
  - `20260421201000_create_human_smart_scan_external_click_events.sql`
- Variables E2E configurées:
  - `HUMAN_E2E_SPHERE_EMAIL`
  - `HUMAN_E2E_SPHERE_PASSWORD`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Flux critique à valider
- Parcours: `qualifier -> CTA -> WhatsApp -> retour -> historique`
- Idempotence: double clic et retry réseau sur `outcome`, `followup-job`, `external-click`, `analytics-event`
- Cohérence data: progression, historique, et KPI admin alignés

## Checks manuels (smoke)
- Ouvrir `/popey-human/entrepreneur-smart-scan-test`
- Qualifier un contact (opportunité + température + tag communauté)
- Envoyer une action WhatsApp puis revenir dans l’app
- Vérifier:
  - Historique visible et à jour
  - Aucune duplication d’événement
  - KPI cockpit Smart Scan incrémentés

## Checks automatisés
- Lancer la suite:
  - `npm run e2e:human-suite`
- Lancer uniquement Smart Scan:
  - `npm run e2e:human-smart-scan`

## Critères de sortie Sprint 1
- Aucun échec sur la suite E2E Human
- Flux critique Smart Scan validé au moins une fois en manuel
- Exports CSV cockpit fonctionnels (agrégé + détaillé)
