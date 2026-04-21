BEGIN;

-- Lot 1 - Smart Scan data foundation
-- Scope: Popey Human Smart Scan core tables + indexes + RLS policies.

CREATE TABLE IF NOT EXISTS public.human_smart_scan_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  city text,
  company_hint text,
  phone_hash text,
  phone_last4 text,
  source text NOT NULL DEFAULT 'smart_scan',
  is_favorite boolean NOT NULL DEFAULT false,
  trust_level text,
  trust_level_set_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_smart_scan_contacts_trust_level_check
    CHECK (trust_level IS NULL OR trust_level IN ('family', 'pro_close', 'acquaintance'))
);

CREATE TABLE IF NOT EXISTS public.human_smart_scan_qualifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.human_smart_scan_contacts(id) ON DELETE CASCADE,
  owner_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  heat text NOT NULL DEFAULT 'tiede',
  opportunity_choice text,
  community_tags text[] NOT NULL DEFAULT '{}',
  estimated_gain text NOT NULL DEFAULT 'Faible',
  qualified_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_smart_scan_qualifications_contact_owner_unique
    UNIQUE (contact_id, owner_member_id),
  CONSTRAINT human_smart_scan_qualifications_heat_check
    CHECK (heat IN ('froid', 'tiede', 'brulant')),
  CONSTRAINT human_smart_scan_qualifications_opportunity_check
    CHECK (
      opportunity_choice IS NULL
      OR opportunity_choice IN (
        'can-buy',
        'ideal-client',
        'can-refer',
        'opens-doors',
        'identified-need',
        'no-potential'
      )
    ),
  CONSTRAINT human_smart_scan_qualifications_gain_check
    CHECK (estimated_gain IN ('Faible', 'Moyen', 'Eleve'))
);

CREATE TABLE IF NOT EXISTS public.human_smart_scan_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.human_smart_scan_contacts(id) ON DELETE CASCADE,
  owner_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  message_draft text,
  send_channel text NOT NULL DEFAULT 'whatsapp',
  status text NOT NULL DEFAULT 'drafted',
  sent_at timestamptz,
  validated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_smart_scan_actions_action_type_check
    CHECK (action_type IN ('passer', 'eclaireur', 'package', 'exclients')),
  CONSTRAINT human_smart_scan_actions_channel_check
    CHECK (send_channel IN ('whatsapp', 'other')),
  CONSTRAINT human_smart_scan_actions_status_check
    CHECK (status IN ('drafted', 'sent', 'validated_without_send'))
);

CREATE TABLE IF NOT EXISTS public.human_smart_scan_daily_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  session_date date NOT NULL DEFAULT (timezone('utc', now()))::date,
  daily_goal integer NOT NULL DEFAULT 10,
  opportunities_activated integer NOT NULL DEFAULT 0,
  target_potential_eur numeric(12,2) NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_smart_scan_daily_sessions_owner_date_unique
    UNIQUE (owner_member_id, session_date),
  CONSTRAINT human_smart_scan_daily_sessions_goal_check
    CHECK (daily_goal > 0),
  CONSTRAINT human_smart_scan_daily_sessions_activated_check
    CHECK (opportunities_activated >= 0)
);

CREATE TABLE IF NOT EXISTS public.human_smart_scan_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.human_smart_scan_contacts(id) ON DELETE SET NULL,
  alert_type text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  triggered_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_smart_scan_alerts_type_check
    CHECK (alert_type IN ('hot_ideal_unshared_24h')),
  CONSTRAINT human_smart_scan_alerts_status_check
    CHECK (status IN ('open', 'dismissed', 'resolved'))
);

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_contacts_owner
  ON public.human_smart_scan_contacts(owner_member_id);
CREATE INDEX IF NOT EXISTS idx_human_smart_scan_contacts_owner_created
  ON public.human_smart_scan_contacts(owner_member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_human_smart_scan_contacts_owner_favorite
  ON public.human_smart_scan_contacts(owner_member_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_human_smart_scan_contacts_owner_trust
  ON public.human_smart_scan_contacts(owner_member_id, trust_level);

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_qualifications_owner
  ON public.human_smart_scan_qualifications(owner_member_id);
CREATE INDEX IF NOT EXISTS idx_human_smart_scan_qualifications_contact
  ON public.human_smart_scan_qualifications(contact_id);
CREATE INDEX IF NOT EXISTS idx_human_smart_scan_qualifications_owner_heat
  ON public.human_smart_scan_qualifications(owner_member_id, heat);

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_actions_owner
  ON public.human_smart_scan_actions(owner_member_id);
CREATE INDEX IF NOT EXISTS idx_human_smart_scan_actions_contact
  ON public.human_smart_scan_actions(contact_id);
CREATE INDEX IF NOT EXISTS idx_human_smart_scan_actions_owner_created
  ON public.human_smart_scan_actions(owner_member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_human_smart_scan_actions_owner_status
  ON public.human_smart_scan_actions(owner_member_id, status);

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_sessions_owner_date
  ON public.human_smart_scan_daily_sessions(owner_member_id, session_date DESC);

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_alerts_owner
  ON public.human_smart_scan_alerts(owner_member_id);
CREATE INDEX IF NOT EXISTS idx_human_smart_scan_alerts_owner_status
  ON public.human_smart_scan_alerts(owner_member_id, status);
CREATE INDEX IF NOT EXISTS idx_human_smart_scan_alerts_triggered
  ON public.human_smart_scan_alerts(triggered_at DESC);

ALTER TABLE public.human_smart_scan_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_smart_scan_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_smart_scan_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_smart_scan_daily_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_smart_scan_alerts ENABLE ROW LEVEL SECURITY;

-- Contacts policies
DROP POLICY IF EXISTS "human smart scan contacts select own or admin" ON public.human_smart_scan_contacts;
CREATE POLICY "human smart scan contacts select own or admin"
  ON public.human_smart_scan_contacts
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_contacts.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human smart scan contacts insert own or admin" ON public.human_smart_scan_contacts;
CREATE POLICY "human smart scan contacts insert own or admin"
  ON public.human_smart_scan_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_contacts.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human smart scan contacts update own or admin" ON public.human_smart_scan_contacts;
CREATE POLICY "human smart scan contacts update own or admin"
  ON public.human_smart_scan_contacts
  FOR UPDATE
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_contacts.owner_member_id
        AND hm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_contacts.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human smart scan contacts delete own or admin" ON public.human_smart_scan_contacts;
CREATE POLICY "human smart scan contacts delete own or admin"
  ON public.human_smart_scan_contacts
  FOR DELETE
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_contacts.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

-- Qualifications policies
DROP POLICY IF EXISTS "human smart scan qualifications select own or admin" ON public.human_smart_scan_qualifications;
CREATE POLICY "human smart scan qualifications select own or admin"
  ON public.human_smart_scan_qualifications
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_qualifications.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human smart scan qualifications insert own or admin" ON public.human_smart_scan_qualifications;
CREATE POLICY "human smart scan qualifications insert own or admin"
  ON public.human_smart_scan_qualifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_qualifications.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human smart scan qualifications update own or admin" ON public.human_smart_scan_qualifications;
CREATE POLICY "human smart scan qualifications update own or admin"
  ON public.human_smart_scan_qualifications
  FOR UPDATE
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_qualifications.owner_member_id
        AND hm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_qualifications.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human smart scan qualifications delete own or admin" ON public.human_smart_scan_qualifications;
CREATE POLICY "human smart scan qualifications delete own or admin"
  ON public.human_smart_scan_qualifications
  FOR DELETE
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_qualifications.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

-- Actions policies
DROP POLICY IF EXISTS "human smart scan actions select own or admin" ON public.human_smart_scan_actions;
CREATE POLICY "human smart scan actions select own or admin"
  ON public.human_smart_scan_actions
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_actions.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human smart scan actions insert own or admin" ON public.human_smart_scan_actions;
CREATE POLICY "human smart scan actions insert own or admin"
  ON public.human_smart_scan_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_actions.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human smart scan actions update own or admin" ON public.human_smart_scan_actions;
CREATE POLICY "human smart scan actions update own or admin"
  ON public.human_smart_scan_actions
  FOR UPDATE
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_actions.owner_member_id
        AND hm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_actions.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human smart scan actions delete own or admin" ON public.human_smart_scan_actions;
CREATE POLICY "human smart scan actions delete own or admin"
  ON public.human_smart_scan_actions
  FOR DELETE
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_actions.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

-- Daily sessions policies
DROP POLICY IF EXISTS "human smart scan sessions select own or admin" ON public.human_smart_scan_daily_sessions;
CREATE POLICY "human smart scan sessions select own or admin"
  ON public.human_smart_scan_daily_sessions
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_daily_sessions.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human smart scan sessions insert own or admin" ON public.human_smart_scan_daily_sessions;
CREATE POLICY "human smart scan sessions insert own or admin"
  ON public.human_smart_scan_daily_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_daily_sessions.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human smart scan sessions update own or admin" ON public.human_smart_scan_daily_sessions;
CREATE POLICY "human smart scan sessions update own or admin"
  ON public.human_smart_scan_daily_sessions
  FOR UPDATE
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_daily_sessions.owner_member_id
        AND hm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_daily_sessions.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human smart scan sessions delete own or admin" ON public.human_smart_scan_daily_sessions;
CREATE POLICY "human smart scan sessions delete own or admin"
  ON public.human_smart_scan_daily_sessions
  FOR DELETE
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_daily_sessions.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

-- Alerts policies
DROP POLICY IF EXISTS "human smart scan alerts select own or admin" ON public.human_smart_scan_alerts;
CREATE POLICY "human smart scan alerts select own or admin"
  ON public.human_smart_scan_alerts
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_alerts.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human smart scan alerts insert own or admin" ON public.human_smart_scan_alerts;
CREATE POLICY "human smart scan alerts insert own or admin"
  ON public.human_smart_scan_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_alerts.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human smart scan alerts update own or admin" ON public.human_smart_scan_alerts;
CREATE POLICY "human smart scan alerts update own or admin"
  ON public.human_smart_scan_alerts
  FOR UPDATE
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_alerts.owner_member_id
        AND hm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_alerts.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human smart scan alerts delete own or admin" ON public.human_smart_scan_alerts;
CREATE POLICY "human smart scan alerts delete own or admin"
  ON public.human_smart_scan_alerts
  FOR DELETE
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_alerts.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

COMMIT;
