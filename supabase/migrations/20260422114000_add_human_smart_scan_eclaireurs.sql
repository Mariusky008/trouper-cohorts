BEGIN;

ALTER TABLE public.human_smart_scan_contacts
  ADD COLUMN IF NOT EXISTS is_eclaireur_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS eclaireur_activated_at timestamptz;

CREATE TABLE IF NOT EXISTS public.human_smart_scan_eclaireur_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.human_smart_scan_contacts(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  amount_eur numeric(12,2) NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_smart_scan_eclaireur_events_type_check
    CHECK (event_type IN ('promoted', 'lead_detected', 'lead_signed', 'commission_paid'))
);

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_eclaireur_events_owner_created
  ON public.human_smart_scan_eclaireur_events(owner_member_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_eclaireur_events_contact_created
  ON public.human_smart_scan_eclaireur_events(contact_id, created_at DESC);

COMMIT;
