BEGIN;

CREATE TABLE IF NOT EXISTS public.human_smart_scan_radar_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  city text NOT NULL,
  source_metier text,
  radius_km integer NOT NULL DEFAULT 15,
  target_count integer NOT NULL DEFAULT 10,
  selected_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'started',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_smart_scan_radar_runs_status_check CHECK (status IN ('started', 'completed', 'failed')),
  CONSTRAINT human_smart_scan_radar_runs_radius_check CHECK (radius_km BETWEEN 1 AND 100),
  CONSTRAINT human_smart_scan_radar_runs_target_check CHECK (target_count BETWEEN 1 AND 20),
  CONSTRAINT human_smart_scan_radar_runs_selected_check CHECK (selected_count BETWEEN 0 AND 20),
  CONSTRAINT human_smart_scan_radar_runs_sent_check CHECK (sent_count BETWEEN 0 AND 100)
);

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_radar_runs_owner_created
  ON public.human_smart_scan_radar_runs(owner_member_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.human_smart_scan_radar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  run_id uuid NOT NULL REFERENCES public.human_smart_scan_radar_runs(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  prospect_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_smart_scan_radar_events_type_check CHECK (event_type IN ('run_started', 'run_completed', 'contact_selected', 'whatsapp_opened', 'send_declared'))
);

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_radar_events_owner_created
  ON public.human_smart_scan_radar_events(owner_member_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_radar_events_run_type
  ON public.human_smart_scan_radar_events(run_id, event_type, created_at DESC);

ALTER TABLE public.human_smart_scan_radar_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_smart_scan_radar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "radar runs select own or admin" ON public.human_smart_scan_radar_runs;
CREATE POLICY "radar runs select own or admin"
  ON public.human_smart_scan_radar_runs
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_smart_scan_radar_runs.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "radar runs insert own or admin" ON public.human_smart_scan_radar_runs;
CREATE POLICY "radar runs insert own or admin"
  ON public.human_smart_scan_radar_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_smart_scan_radar_runs.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "radar runs update own or admin" ON public.human_smart_scan_radar_runs;
CREATE POLICY "radar runs update own or admin"
  ON public.human_smart_scan_radar_runs
  FOR UPDATE
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_smart_scan_radar_runs.owner_member_id
        AND hm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_smart_scan_radar_runs.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "radar events select own or admin" ON public.human_smart_scan_radar_events;
CREATE POLICY "radar events select own or admin"
  ON public.human_smart_scan_radar_events
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_smart_scan_radar_events.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "radar events insert own or admin" ON public.human_smart_scan_radar_events;
CREATE POLICY "radar events insert own or admin"
  ON public.human_smart_scan_radar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_smart_scan_radar_events.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

COMMIT;
