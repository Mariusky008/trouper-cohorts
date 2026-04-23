BEGIN;

ALTER TABLE public.human_smart_scan_contacts
  ADD COLUMN IF NOT EXISTS is_eclaireur_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS eclaireur_activated_at timestamptz;

COMMIT;
