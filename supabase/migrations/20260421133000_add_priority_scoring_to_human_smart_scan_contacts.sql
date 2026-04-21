BEGIN;

ALTER TABLE public.human_smart_scan_contacts
  ADD COLUMN IF NOT EXISTS priority_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS potential_eur numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_action_at timestamptz;

ALTER TABLE public.human_smart_scan_contacts
  DROP CONSTRAINT IF EXISTS human_smart_scan_contacts_priority_score_check;

ALTER TABLE public.human_smart_scan_contacts
  ADD CONSTRAINT human_smart_scan_contacts_priority_score_check
  CHECK (priority_score >= 0 AND priority_score <= 100);

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_contacts_owner_priority
  ON public.human_smart_scan_contacts(owner_member_id, priority_score DESC, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_contacts_owner_potential
  ON public.human_smart_scan_contacts(owner_member_id, potential_eur DESC);

COMMIT;
