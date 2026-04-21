# Popey Human Smart Scan - Cloture S1 Prod

## 1) SQL prod a executer

Option recommandee (un seul copier-coller):
- Fichier: `supabase/sql/smart_scan_s1_prod_bundle.sql`

Option alternative (3 migrations dans cet ordre):
- `supabase/migrations/20260421174000_create_human_smart_scan_followup_job_events.sql`
- `supabase/migrations/20260421201000_create_human_smart_scan_external_click_events.sql`
- `supabase/migrations/20260421153000_fix_human_smart_scan_external_click_events_rls.sql`

## 2) Verification SQL post-deploiement

```sql
-- tables presentes
select to_regclass('public.human_smart_scan_followup_job_events') as followup_events_table;
select to_regclass('public.human_smart_scan_external_click_events') as external_click_table;

-- rls active
select relname, relrowsecurity
from pg_class
where relname in (
  'human_smart_scan_followup_job_events',
  'human_smart_scan_external_click_events'
);

-- policies en place
select schemaname, tablename, policyname, cmd
from pg_policies
where tablename in (
  'human_smart_scan_followup_job_events',
  'human_smart_scan_external_click_events'
)
order by tablename, policyname;
```

## 3) QA finale (runbook)

Automatique:
- `npm run e2e:human-suite`
- attendu: `PASSED (3/3)`

Manuel (admin + membre):
- Flux Smart Scan: `qualifier -> CTA -> WhatsApp -> retour -> historique`
- Vérifier dans cockpit:
  - bloc KPI Smart Scan
  - export CSV agrégé
  - export CSV détaillé
- Vérifier absence de doublons après retry/double-clic sur actions critiques.

## 4) Verif audit PII prod

Endpoint admin:
- `GET /api/admin/humain/smart-scan/analytics-pii-audit?days=30`

Interprétation:
- `suspect = 0` attendu
- `disallowedKeys = 0` attendu sur chaque `eventType`
- `suspiciousKeyNames = 0` attendu

Si `suspect > 0`:
- inspecter `samples[]`
- corriger la source front/back qui envoie la clé
- rejouer l’audit après correction

## 5) Definition of done S1

- SQL prod exécuté et vérifié
- E2E suite verte
- QA manuelle flux critique validée
- Audit PII prod sans suspect
