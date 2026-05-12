BEGIN;

CREATE TABLE IF NOT EXISTS public.human_voice_outbound_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  phone_e164 text NOT NULL,
  source text NOT NULL DEFAULT 'api',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued',
  attempt_count integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  not_before_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  provider_call_sid text,
  last_error text,
  call_started_at timestamptz,
  call_ended_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_voice_outbound_queue_status_check CHECK (
    status IN ('queued', 'scheduled', 'calling', 'in_progress', 'completed', 'failed', 'cancelled', 'blocked')
  ),
  CONSTRAINT human_voice_outbound_queue_attempts_check CHECK (attempt_count BETWEEN 0 AND 20),
  CONSTRAINT human_voice_outbound_queue_max_attempts_check CHECK (max_attempts BETWEEN 1 AND 20)
);

CREATE INDEX IF NOT EXISTS idx_human_voice_outbound_queue_dispatch
  ON public.human_voice_outbound_queue(status, not_before_at, created_at);

CREATE INDEX IF NOT EXISTS idx_human_voice_outbound_queue_owner_created
  ON public.human_voice_outbound_queue(owner_member_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_human_voice_outbound_queue_provider_call
  ON public.human_voice_outbound_queue(provider_call_sid)
  WHERE provider_call_sid IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.human_voice_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid REFERENCES public.human_voice_outbound_queue(id) ON DELETE SET NULL,
  owner_member_id uuid REFERENCES public.human_members(id) ON DELETE CASCADE,
  phone_e164 text,
  direction text NOT NULL DEFAULT 'system',
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_voice_events_direction_check CHECK (direction IN ('inbound', 'outbound', 'status', 'system'))
);

CREATE INDEX IF NOT EXISTS idx_human_voice_events_owner_created
  ON public.human_voice_events(owner_member_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.human_voice_call_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid NOT NULL REFERENCES public.human_voice_outbound_queue(id) ON DELETE CASCADE,
  provider_call_sid text,
  recording_sid text,
  recording_url text,
  transcript text,
  summary text,
  qualification jsonb NOT NULL DEFAULT '{}'::jsonb,
  outcome text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_human_voice_call_artifacts_queue
  ON public.human_voice_call_artifacts(queue_id);

CREATE TABLE IF NOT EXISTS public.human_voice_agent_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'default',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_human_voice_agent_configs_owner_name
  ON public.human_voice_agent_configs(owner_member_id, name);

CREATE INDEX IF NOT EXISTS idx_human_voice_agent_configs_owner_active
  ON public.human_voice_agent_configs(owner_member_id, is_active);

ALTER TABLE public.human_voice_outbound_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_voice_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_voice_call_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_voice_agent_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "voice queue select own or admin" ON public.human_voice_outbound_queue;
CREATE POLICY "voice queue select own or admin"
  ON public.human_voice_outbound_queue
  FOR SELECT TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_voice_outbound_queue.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "voice queue insert own or admin" ON public.human_voice_outbound_queue;
CREATE POLICY "voice queue insert own or admin"
  ON public.human_voice_outbound_queue
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_voice_outbound_queue.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "voice queue update own or admin" ON public.human_voice_outbound_queue;
CREATE POLICY "voice queue update own or admin"
  ON public.human_voice_outbound_queue
  FOR UPDATE TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_voice_outbound_queue.owner_member_id
        AND hm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_voice_outbound_queue.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "voice events select own or admin" ON public.human_voice_events;
CREATE POLICY "voice events select own or admin"
  ON public.human_voice_events
  FOR SELECT TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_voice_events.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "voice artifacts select own or admin" ON public.human_voice_call_artifacts;
CREATE POLICY "voice artifacts select own or admin"
  ON public.human_voice_call_artifacts
  FOR SELECT TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      JOIN public.human_voice_outbound_queue q ON q.id = human_voice_call_artifacts.queue_id
      WHERE hm.id = q.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "voice agent configs select own or admin" ON public.human_voice_agent_configs;
CREATE POLICY "voice agent configs select own or admin"
  ON public.human_voice_agent_configs
  FOR SELECT TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_voice_agent_configs.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "voice agent configs insert own or admin" ON public.human_voice_agent_configs;
CREATE POLICY "voice agent configs insert own or admin"
  ON public.human_voice_agent_configs
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_voice_agent_configs.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "voice agent configs update own or admin" ON public.human_voice_agent_configs;
CREATE POLICY "voice agent configs update own or admin"
  ON public.human_voice_agent_configs
  FOR UPDATE TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_voice_agent_configs.owner_member_id
        AND hm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_voice_agent_configs.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

COMMIT;
