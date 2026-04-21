BEGIN;

CREATE TABLE IF NOT EXISTS public.human_smart_scan_followup_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL REFERENCES public.human_smart_scan_actions(id) ON DELETE CASCADE,
  owner_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.human_smart_scan_contacts(id) ON DELETE CASCADE,
  job_type text NOT NULL DEFAULT 'auto_followup_48h',
  status text NOT NULL DEFAULT 'queued',
  suggested_message text,
  scheduled_for timestamptz NOT NULL,
  processed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_smart_scan_followup_jobs_job_type_check CHECK (job_type IN ('auto_followup_48h')),
  CONSTRAINT human_smart_scan_followup_jobs_status_check CHECK (status IN ('queued', 'processed', 'cancelled'))
);

CREATE UNIQUE INDEX IF NOT EXISTS human_smart_scan_followup_jobs_action_type_unique
  ON public.human_smart_scan_followup_jobs(action_id, job_type);

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_followup_jobs_owner_status_due
  ON public.human_smart_scan_followup_jobs(owner_member_id, status, scheduled_for DESC);

ALTER TABLE public.human_smart_scan_followup_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "human smart scan followup jobs select own or admin"
  ON public.human_smart_scan_followup_jobs
  FOR SELECT
  USING (
    owner_member_id IN (
      SELECT hm.id
      FROM public.human_members hm
      WHERE hm.user_id = auth.uid()
         OR public.is_human_admin()
    )
  );

CREATE POLICY "human smart scan followup jobs insert own or admin"
  ON public.human_smart_scan_followup_jobs
  FOR INSERT
  WITH CHECK (
    owner_member_id IN (
      SELECT hm.id
      FROM public.human_members hm
      WHERE hm.user_id = auth.uid()
         OR public.is_human_admin()
    )
  );

CREATE POLICY "human smart scan followup jobs update own or admin"
  ON public.human_smart_scan_followup_jobs
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

CREATE POLICY "human smart scan followup jobs delete own or admin"
  ON public.human_smart_scan_followup_jobs
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
