BEGIN;

ALTER TABLE public.human_smart_scan_actions
  ADD COLUMN IF NOT EXISTS client_event_id text;

CREATE UNIQUE INDEX IF NOT EXISTS human_smart_scan_actions_owner_client_event_unique
  ON public.human_smart_scan_actions(owner_member_id, client_event_id)
  WHERE client_event_id IS NOT NULL;

COMMIT;
