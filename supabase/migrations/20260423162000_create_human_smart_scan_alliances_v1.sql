BEGIN;

-- Lot 1 - Alliances externes (MVP premium)
-- Scope: prospects externes + invitations + traces de recherche provider.

CREATE TABLE IF NOT EXISTS public.human_smart_scan_alliance_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'b2b',
  provider_prospect_ref text,
  full_name text NOT NULL,
  metier text NOT NULL,
  city text,
  phone_e164 text,
  distance_km numeric(8,2),
  rating numeric(4,2),
  fit_score integer NOT NULL DEFAULT 0,
  fit_reasons text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'new',
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_smart_scan_alliance_prospects_status_check
    CHECK (status IN ('new', 'contacted', 'replied', 'partnered', 'dismissed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_human_smart_scan_alliance_prospects_owner_provider_ref
  ON public.human_smart_scan_alliance_prospects(owner_member_id, provider, provider_prospect_ref)
  WHERE provider_prospect_ref IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_alliance_prospects_owner_score
  ON public.human_smart_scan_alliance_prospects(owner_member_id, fit_score DESC, fetched_at DESC);

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_alliance_prospects_owner_status
  ON public.human_smart_scan_alliance_prospects(owner_member_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.human_smart_scan_alliance_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  prospect_id uuid NOT NULL REFERENCES public.human_smart_scan_alliance_prospects(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'whatsapp',
  message_draft text,
  onboarding_token text NOT NULL,
  onboarding_link text,
  status text NOT NULL DEFAULT 'drafted',
  sent_at timestamptz,
  clicked_at timestamptz,
  signed_up_member_id uuid REFERENCES public.human_members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_smart_scan_alliance_invites_channel_check
    CHECK (channel IN ('whatsapp', 'sms', 'email', 'other')),
  CONSTRAINT human_smart_scan_alliance_invites_status_check
    CHECK (status IN ('drafted', 'sent', 'clicked', 'signed_up', 'declined'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_human_smart_scan_alliance_invites_onboarding_token
  ON public.human_smart_scan_alliance_invites(onboarding_token);

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_alliance_invites_owner_created
  ON public.human_smart_scan_alliance_invites(owner_member_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_alliance_invites_owner_status
  ON public.human_smart_scan_alliance_invites(owner_member_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.human_smart_scan_alliance_search_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'b2b',
  city text NOT NULL,
  source_metier text,
  target_metiers text[] NOT NULL DEFAULT '{}',
  radius_km integer NOT NULL DEFAULT 15,
  total_found integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_human_smart_scan_alliance_search_runs_owner_created
  ON public.human_smart_scan_alliance_search_runs(owner_member_id, created_at DESC);

ALTER TABLE public.human_smart_scan_alliance_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_smart_scan_alliance_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_smart_scan_alliance_search_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alliances prospects select own or admin" ON public.human_smart_scan_alliance_prospects;
CREATE POLICY "alliances prospects select own or admin"
  ON public.human_smart_scan_alliance_prospects
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_alliance_prospects.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "alliances prospects insert own or admin" ON public.human_smart_scan_alliance_prospects;
CREATE POLICY "alliances prospects insert own or admin"
  ON public.human_smart_scan_alliance_prospects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_alliance_prospects.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "alliances prospects update own or admin" ON public.human_smart_scan_alliance_prospects;
CREATE POLICY "alliances prospects update own or admin"
  ON public.human_smart_scan_alliance_prospects
  FOR UPDATE
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_alliance_prospects.owner_member_id
        AND hm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_alliance_prospects.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "alliances invites select own or admin" ON public.human_smart_scan_alliance_invites;
CREATE POLICY "alliances invites select own or admin"
  ON public.human_smart_scan_alliance_invites
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_alliance_invites.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "alliances invites insert own or admin" ON public.human_smart_scan_alliance_invites;
CREATE POLICY "alliances invites insert own or admin"
  ON public.human_smart_scan_alliance_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_alliance_invites.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "alliances invites update own or admin" ON public.human_smart_scan_alliance_invites;
CREATE POLICY "alliances invites update own or admin"
  ON public.human_smart_scan_alliance_invites
  FOR UPDATE
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_alliance_invites.owner_member_id
        AND hm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_alliance_invites.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "alliances search runs select own or admin" ON public.human_smart_scan_alliance_search_runs;
CREATE POLICY "alliances search runs select own or admin"
  ON public.human_smart_scan_alliance_search_runs
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_alliance_search_runs.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "alliances search runs insert own or admin" ON public.human_smart_scan_alliance_search_runs;
CREATE POLICY "alliances search runs insert own or admin"
  ON public.human_smart_scan_alliance_search_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_alliance_search_runs.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

COMMIT;
