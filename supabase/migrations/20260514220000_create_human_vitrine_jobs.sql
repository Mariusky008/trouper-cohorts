BEGIN;

CREATE TABLE IF NOT EXISTS public.human_vitrine_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'queued',
  city text NOT NULL DEFAULT '',
  metiers text[] NOT NULL DEFAULT ARRAY[]::text[],
  batch_size int NOT NULL DEFAULT 5,
  max_rating numeric NOT NULL DEFAULT 3.5,
  dry_run boolean NOT NULL DEFAULT false,
  error_reason text,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_vitrine_jobs_status_check CHECK (
    status IN ('queued', 'running', 'done', 'error')
  )
);

CREATE INDEX IF NOT EXISTS idx_human_vitrine_jobs_status_created
  ON public.human_vitrine_jobs(status, created_at DESC);

ALTER TABLE public.human_vitrine_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "human vitrine jobs admin read" ON public.human_vitrine_jobs;
CREATE POLICY "human vitrine jobs admin read"
  ON public.human_vitrine_jobs
  FOR SELECT
  TO authenticated
  USING (public.is_human_admin());

DROP POLICY IF EXISTS "human vitrine jobs admin write" ON public.human_vitrine_jobs;
CREATE POLICY "human vitrine jobs admin write"
  ON public.human_vitrine_jobs
  FOR ALL
  TO authenticated
  USING (public.is_human_admin())
  WITH CHECK (public.is_human_admin());

NOTIFY pgrst, 'reload schema';

COMMIT;
