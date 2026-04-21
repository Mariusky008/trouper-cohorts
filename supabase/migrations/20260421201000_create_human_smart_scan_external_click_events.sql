BEGIN;

CREATE TABLE IF NOT EXISTS public.human_smart_scan_external_click_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('linkedin', 'whatsapp_group')),
  target_url text NOT NULL,
  context text NOT NULL DEFAULT 'cockpit' CHECK (context IN ('cockpit', 'profile', 'other')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_external_click_events_owner_created
  ON public.human_smart_scan_external_click_events(owner_member_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_external_click_events_owner_source_created
  ON public.human_smart_scan_external_click_events(owner_member_id, source, created_at DESC);

ALTER TABLE public.human_smart_scan_external_click_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "human smart scan external clicks select own or admin" ON public.human_smart_scan_external_click_events;
CREATE POLICY "human smart scan external clicks select own or admin"
  ON public.human_smart_scan_external_click_events
  FOR SELECT
  USING (owner_member_id = auth.uid() OR public.is_human_admin());

DROP POLICY IF EXISTS "human smart scan external clicks insert own or admin" ON public.human_smart_scan_external_click_events;
CREATE POLICY "human smart scan external clicks insert own or admin"
  ON public.human_smart_scan_external_click_events
  FOR INSERT
  WITH CHECK (owner_member_id = auth.uid() OR public.is_human_admin());

COMMIT;
