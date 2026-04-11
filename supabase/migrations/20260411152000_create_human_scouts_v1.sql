BEGIN;

CREATE TABLE IF NOT EXISTS public.human_scouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name text,
  last_name text,
  phone text,
  email text,
  status text NOT NULL DEFAULT 'invited',
  commission_rate numeric(5,4) NOT NULL DEFAULT 0.10,
  total_paid numeric(12,2) NOT NULL DEFAULT 0,
  pending_earnings numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_scouts_status_check CHECK (status IN ('invited', 'active', 'paused', 'archived')),
  CONSTRAINT human_scouts_commission_rate_check CHECK (commission_rate >= 0 AND commission_rate <= 1)
);

CREATE INDEX IF NOT EXISTS idx_human_scouts_owner_member_id
  ON public.human_scouts(owner_member_id);
CREATE INDEX IF NOT EXISTS idx_human_scouts_user_id
  ON public.human_scouts(user_id);
CREATE INDEX IF NOT EXISTS idx_human_scouts_status
  ON public.human_scouts(status);

CREATE TABLE IF NOT EXISTS public.human_scout_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  scout_id uuid REFERENCES public.human_scouts(id) ON DELETE SET NULL,
  invite_token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_human_scout_invites_owner_member_id
  ON public.human_scout_invites(owner_member_id);
CREATE INDEX IF NOT EXISTS idx_human_scout_invites_expires_at
  ON public.human_scout_invites(expires_at);

CREATE TABLE IF NOT EXISTS public.human_scout_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  scout_id uuid NOT NULL REFERENCES public.human_scouts(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.human_leads(id) ON DELETE SET NULL,
  contact_name text NOT NULL,
  contact_phone text,
  contact_phone_normalized text,
  project_type text,
  comment text,
  status text NOT NULL DEFAULT 'submitted',
  rejection_reason text,
  estimated_deal_value numeric(12,2),
  estimated_commission numeric(12,2),
  final_signed_amount numeric(12,2),
  final_commission numeric(12,2),
  commission_rate_snapshot numeric(5,4),
  validated_at timestamptz,
  converted_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_scout_referrals_status_check CHECK (status IN ('submitted', 'validated', 'rejected', 'converted', 'cancelled')),
  CONSTRAINT human_scout_referrals_rejection_reason_check CHECK (
    (status <> 'rejected') OR (rejection_reason IS NOT NULL AND length(trim(rejection_reason)) > 0)
  ),
  CONSTRAINT human_scout_referrals_commission_rate_check CHECK (
    commission_rate_snapshot IS NULL OR (commission_rate_snapshot >= 0 AND commission_rate_snapshot <= 1)
  )
);

CREATE INDEX IF NOT EXISTS idx_human_scout_referrals_owner_member_id
  ON public.human_scout_referrals(owner_member_id);
CREATE INDEX IF NOT EXISTS idx_human_scout_referrals_scout_id
  ON public.human_scout_referrals(scout_id);
CREATE INDEX IF NOT EXISTS idx_human_scout_referrals_status
  ON public.human_scout_referrals(status);
CREATE INDEX IF NOT EXISTS idx_human_scout_referrals_contact_phone_normalized
  ON public.human_scout_referrals(contact_phone_normalized);
CREATE INDEX IF NOT EXISTS idx_human_scout_referrals_created_at
  ON public.human_scout_referrals(created_at DESC);

CREATE TABLE IF NOT EXISTS public.human_scout_notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scout_id uuid NOT NULL REFERENCES public.human_scouts(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  sent_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  status text NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_human_scout_notification_log_scout_id
  ON public.human_scout_notification_log(scout_id);
CREATE INDEX IF NOT EXISTS idx_human_scout_notification_log_event_type
  ON public.human_scout_notification_log(event_type);

ALTER TABLE public.human_leads
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'self',
  ADD COLUMN IF NOT EXISTS scout_referral_id uuid REFERENCES public.human_scout_referrals(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'human_leads_source_type_check'
      AND conrelid = 'public.human_leads'::regclass
  ) THEN
    ALTER TABLE public.human_leads
      ADD CONSTRAINT human_leads_source_type_check CHECK (source_type IN ('self', 'partner', 'scout'));
  END IF;
END $$;

ALTER TABLE public.human_scouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_scout_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_scout_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_scout_notification_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "human scouts select owner scout or admin" ON public.human_scouts;
CREATE POLICY "human scouts select owner scout or admin"
  ON public.human_scouts
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_scouts.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human scouts write owner scout or admin" ON public.human_scouts;
CREATE POLICY "human scouts write owner scout or admin"
  ON public.human_scouts
  FOR ALL
  TO authenticated
  USING (
    public.is_human_admin()
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_scouts.owner_member_id
        AND hm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_human_admin()
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_scouts.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human scout invites select owner or admin" ON public.human_scout_invites;
CREATE POLICY "human scout invites select owner or admin"
  ON public.human_scout_invites
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_scout_invites.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human scout invites write owner or admin" ON public.human_scout_invites;
CREATE POLICY "human scout invites write owner or admin"
  ON public.human_scout_invites
  FOR ALL
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_scout_invites.owner_member_id
        AND hm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_scout_invites.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human scout referrals select owner scout or admin" ON public.human_scout_referrals;
CREATE POLICY "human scout referrals select owner scout or admin"
  ON public.human_scout_referrals
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_scout_referrals.owner_member_id
        AND hm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.human_scouts hs
      WHERE hs.id = human_scout_referrals.scout_id
        AND hs.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human scout referrals write owner or admin" ON public.human_scout_referrals;
CREATE POLICY "human scout referrals write owner or admin"
  ON public.human_scout_referrals
  FOR ALL
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_scout_referrals.owner_member_id
        AND hm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_scout_referrals.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human scout notification log read scoped or admin" ON public.human_scout_notification_log;
CREATE POLICY "human scout notification log read scoped or admin"
  ON public.human_scout_notification_log
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_scouts hs
      WHERE hs.id = human_scout_notification_log.scout_id
        AND (
          hs.user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.human_members hm
            WHERE hm.id = hs.owner_member_id
              AND hm.user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "human scout notification log write admin only" ON public.human_scout_notification_log;
CREATE POLICY "human scout notification log write admin only"
  ON public.human_scout_notification_log
  FOR ALL
  TO authenticated
  USING (public.is_human_admin())
  WITH CHECK (public.is_human_admin());

COMMIT;
