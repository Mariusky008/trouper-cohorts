BEGIN;

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

COMMIT;
