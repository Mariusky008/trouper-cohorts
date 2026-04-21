BEGIN;

-- 1) followup job events
CREATE TABLE IF NOT EXISTS public.human_smart_scan_followup_job_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.human_smart_scan_followup_jobs(id) ON DELETE SET NULL,
  action_id uuid NOT NULL REFERENCES public.human_smart_scan_actions(id) ON DELETE CASCADE,
  owner_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.human_smart_scan_contacts(id) ON DELETE CASCADE,
  operator_member_id uuid REFERENCES public.human_members(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_smart_scan_followup_job_events_event_type_check
    CHECK (event_type IN ('copied', 'marked_replied', 'marked_converted', 'marked_not_interested', 'ignored'))
);

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_followup_events_owner_created
  ON public.human_smart_scan_followup_job_events(owner_member_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_followup_events_action
  ON public.human_smart_scan_followup_job_events(action_id, created_at DESC);

ALTER TABLE public.human_smart_scan_followup_job_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "human smart scan followup events select own or admin" ON public.human_smart_scan_followup_job_events;
CREATE POLICY "human smart scan followup events select own or admin"
  ON public.human_smart_scan_followup_job_events
  FOR SELECT
  USING (
    owner_member_id IN (
      SELECT hm.id
      FROM public.human_members hm
      WHERE hm.user_id = auth.uid()
         OR public.is_human_admin()
    )
  );

DROP POLICY IF EXISTS "human smart scan followup events insert own or admin" ON public.human_smart_scan_followup_job_events;
CREATE POLICY "human smart scan followup events insert own or admin"
  ON public.human_smart_scan_followup_job_events
  FOR INSERT
  WITH CHECK (
    owner_member_id IN (
      SELECT hm.id
      FROM public.human_members hm
      WHERE hm.user_id = auth.uid()
         OR public.is_human_admin()
    )
  );

DROP POLICY IF EXISTS "human smart scan followup events update own or admin" ON public.human_smart_scan_followup_job_events;
CREATE POLICY "human smart scan followup events update own or admin"
  ON public.human_smart_scan_followup_job_events
  FOR UPDATE
  USING (
    owner_member_id IN (
      SELECT hm.id
      FROM public.human_members hm
      WHERE hm.user_id = auth.uid()
         OR public.is_human_admin()
    )
  )
  WITH CHECK (
    owner_member_id IN (
      SELECT hm.id
      FROM public.human_members hm
      WHERE hm.user_id = auth.uid()
         OR public.is_human_admin()
    )
  );

DROP POLICY IF EXISTS "human smart scan followup events delete own or admin" ON public.human_smart_scan_followup_job_events;
CREATE POLICY "human smart scan followup events delete own or admin"
  ON public.human_smart_scan_followup_job_events
  FOR DELETE
  USING (
    owner_member_id IN (
      SELECT hm.id
      FROM public.human_members hm
      WHERE hm.user_id = auth.uid()
         OR public.is_human_admin()
    )
  );

-- 2) external click events
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

-- 3) fixed RLS (human_members mapping, not auth.uid direct compare)
DROP POLICY IF EXISTS "human smart scan external clicks select own or admin" ON public.human_smart_scan_external_click_events;
CREATE POLICY "human smart scan external clicks select own or admin"
  ON public.human_smart_scan_external_click_events
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_external_click_events.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human smart scan external clicks insert own or admin" ON public.human_smart_scan_external_click_events;
CREATE POLICY "human smart scan external clicks insert own or admin"
  ON public.human_smart_scan_external_click_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_external_click_events.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

COMMIT;
