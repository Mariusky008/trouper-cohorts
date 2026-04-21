BEGIN;

ALTER TABLE public.human_smart_scan_actions
  ADD COLUMN IF NOT EXISTS whatsapp_opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS template_version text,
  ADD COLUMN IF NOT EXISTS followup_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS outcome_status text,
  ADD COLUMN IF NOT EXISTS outcome_notes text;

ALTER TABLE public.human_smart_scan_actions
  DROP CONSTRAINT IF EXISTS human_smart_scan_actions_outcome_status_check;

ALTER TABLE public.human_smart_scan_actions
  ADD CONSTRAINT human_smart_scan_actions_outcome_status_check
  CHECK (
    outcome_status IS NULL
    OR outcome_status IN ('pending', 'replied', 'converted', 'not_interested')
  );

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_actions_owner_followup_due
  ON public.human_smart_scan_actions(owner_member_id, followup_due_at DESC);

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_actions_owner_outcome
  ON public.human_smart_scan_actions(owner_member_id, outcome_status);

ALTER TABLE public.human_smart_scan_alerts
  DROP CONSTRAINT IF EXISTS human_smart_scan_alerts_type_check;

ALTER TABLE public.human_smart_scan_alerts
  ADD CONSTRAINT human_smart_scan_alerts_type_check
  CHECK (alert_type IN ('hot_ideal_unshared_24h', 'high_priority_no_response_48h'));

COMMIT;
