BEGIN;

CREATE TABLE IF NOT EXISTS public.human_whatsapp_blacklist (
  owner_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  phone_e164 text NOT NULL,
  reason text NOT NULL DEFAULT 'stop_keyword',
  source text NOT NULL DEFAULT 'webhook',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (owner_member_id, phone_e164)
);

CREATE TABLE IF NOT EXISTS public.human_whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_member_id uuid REFERENCES public.human_members(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  language_code text NOT NULL DEFAULT 'fr',
  category text NOT NULL DEFAULT 'MARKETING',
  status text NOT NULL DEFAULT 'draft',
  body_text text NOT NULL DEFAULT '',
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  quick_replies jsonb NOT NULL DEFAULT '[]'::jsonb,
  meta_template_id text,
  provider_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_whatsapp_templates_status_check CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'paused')),
  CONSTRAINT human_whatsapp_templates_category_check CHECK (category IN ('MARKETING', 'UTILITY', 'AUTHENTICATION')),
  CONSTRAINT human_whatsapp_templates_lang_check CHECK (char_length(language_code) BETWEEN 2 AND 10),
  CONSTRAINT human_whatsapp_templates_name_check CHECK (char_length(template_name) BETWEEN 3 AND 80)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_human_whatsapp_templates_owner_name_lang
  ON public.human_whatsapp_templates(owner_member_id, template_name, language_code);

CREATE TABLE IF NOT EXISTS public.human_whatsapp_outbound_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  phone_e164 text NOT NULL,
  template_name text NOT NULL,
  language_code text NOT NULL DEFAULT 'fr',
  vars jsonb NOT NULL DEFAULT '[]'::jsonb,
  quick_reply_payload jsonb NOT NULL DEFAULT '[]'::jsonb,
  source text NOT NULL DEFAULT 'api',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued',
  attempt_count integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 4,
  random_delay_ms integer NOT NULL DEFAULT 0,
  not_before_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  provider_message_id text,
  last_error text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_whatsapp_outbound_queue_status_check CHECK (
    status IN ('queued', 'scheduled', 'sending', 'sent', 'delivered', 'read', 'failed', 'cancelled', 'blocked')
  ),
  CONSTRAINT human_whatsapp_outbound_queue_lang_check CHECK (char_length(language_code) BETWEEN 2 AND 10),
  CONSTRAINT human_whatsapp_outbound_queue_attempts_check CHECK (attempt_count BETWEEN 0 AND 20),
  CONSTRAINT human_whatsapp_outbound_queue_max_attempts_check CHECK (max_attempts BETWEEN 1 AND 20),
  CONSTRAINT human_whatsapp_outbound_queue_delay_check CHECK (random_delay_ms BETWEEN 0 AND 600000)
);

CREATE INDEX IF NOT EXISTS idx_human_whatsapp_outbound_queue_dispatch
  ON public.human_whatsapp_outbound_queue(status, not_before_at, created_at);

CREATE INDEX IF NOT EXISTS idx_human_whatsapp_outbound_queue_owner_created
  ON public.human_whatsapp_outbound_queue(owner_member_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_human_whatsapp_outbound_queue_provider_msg
  ON public.human_whatsapp_outbound_queue(provider_message_id)
  WHERE provider_message_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.human_whatsapp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid REFERENCES public.human_whatsapp_outbound_queue(id) ON DELETE SET NULL,
  owner_member_id uuid REFERENCES public.human_members(id) ON DELETE CASCADE,
  phone_e164 text,
  direction text NOT NULL DEFAULT 'inbound',
  event_type text NOT NULL,
  classification text,
  message_text text,
  provider_message_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_whatsapp_events_direction_check CHECK (direction IN ('inbound', 'outbound', 'status')),
  CONSTRAINT human_whatsapp_events_classification_check CHECK (
    classification IS NULL OR classification IN ('positive', 'negative', 'stop', 'neutral')
  )
);

CREATE INDEX IF NOT EXISTS idx_human_whatsapp_events_owner_created
  ON public.human_whatsapp_events(owner_member_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_human_whatsapp_events_provider_msg
  ON public.human_whatsapp_events(provider_message_id);

ALTER TABLE public.human_whatsapp_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_whatsapp_outbound_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_whatsapp_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whatsapp blacklist select own or admin" ON public.human_whatsapp_blacklist;
CREATE POLICY "whatsapp blacklist select own or admin"
  ON public.human_whatsapp_blacklist
  FOR SELECT TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_whatsapp_blacklist.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "whatsapp blacklist insert own or admin" ON public.human_whatsapp_blacklist;
CREATE POLICY "whatsapp blacklist insert own or admin"
  ON public.human_whatsapp_blacklist
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_whatsapp_blacklist.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "whatsapp blacklist update own or admin" ON public.human_whatsapp_blacklist;
CREATE POLICY "whatsapp blacklist update own or admin"
  ON public.human_whatsapp_blacklist
  FOR UPDATE TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_whatsapp_blacklist.owner_member_id
        AND hm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_whatsapp_blacklist.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "whatsapp templates select own or admin" ON public.human_whatsapp_templates;
CREATE POLICY "whatsapp templates select own or admin"
  ON public.human_whatsapp_templates
  FOR SELECT TO authenticated
  USING (
    public.is_human_admin()
    OR owner_member_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_whatsapp_templates.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "whatsapp templates insert own or admin" ON public.human_whatsapp_templates;
CREATE POLICY "whatsapp templates insert own or admin"
  ON public.human_whatsapp_templates
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_human_admin()
    OR owner_member_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_whatsapp_templates.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "whatsapp templates update own or admin" ON public.human_whatsapp_templates;
CREATE POLICY "whatsapp templates update own or admin"
  ON public.human_whatsapp_templates
  FOR UPDATE TO authenticated
  USING (
    public.is_human_admin()
    OR owner_member_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_whatsapp_templates.owner_member_id
        AND hm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_human_admin()
    OR owner_member_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_whatsapp_templates.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "whatsapp queue select own or admin" ON public.human_whatsapp_outbound_queue;
CREATE POLICY "whatsapp queue select own or admin"
  ON public.human_whatsapp_outbound_queue
  FOR SELECT TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_whatsapp_outbound_queue.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "whatsapp queue insert own or admin" ON public.human_whatsapp_outbound_queue;
CREATE POLICY "whatsapp queue insert own or admin"
  ON public.human_whatsapp_outbound_queue
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_whatsapp_outbound_queue.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "whatsapp queue update own or admin" ON public.human_whatsapp_outbound_queue;
CREATE POLICY "whatsapp queue update own or admin"
  ON public.human_whatsapp_outbound_queue
  FOR UPDATE TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_whatsapp_outbound_queue.owner_member_id
        AND hm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1 FROM public.human_members hm
      WHERE hm.id = human_whatsapp_outbound_queue.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "whatsapp events select own or admin" ON public.human_whatsapp_events;
CREATE POLICY "whatsapp events select own or admin"
  ON public.human_whatsapp_events
  FOR SELECT TO authenticated
  USING (
    public.is_human_admin()
    OR (
      owner_member_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.human_members hm
        WHERE hm.id = human_whatsapp_events.owner_member_id
          AND hm.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "whatsapp events insert own or admin" ON public.human_whatsapp_events;
CREATE POLICY "whatsapp events insert own or admin"
  ON public.human_whatsapp_events
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_human_admin()
    OR (
      owner_member_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.human_members hm
        WHERE hm.id = human_whatsapp_events.owner_member_id
          AND hm.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "whatsapp events update own or admin" ON public.human_whatsapp_events;
CREATE POLICY "whatsapp events update own or admin"
  ON public.human_whatsapp_events
  FOR UPDATE TO authenticated
  USING (
    public.is_human_admin()
    OR (
      owner_member_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.human_members hm
        WHERE hm.id = human_whatsapp_events.owner_member_id
          AND hm.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    public.is_human_admin()
    OR (
      owner_member_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.human_members hm
        WHERE hm.id = human_whatsapp_events.owner_member_id
          AND hm.user_id = auth.uid()
      )
    )
  );

COMMIT;
