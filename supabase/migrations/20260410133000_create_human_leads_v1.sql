BEGIN;

CREATE TABLE IF NOT EXISTS public.human_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_member_id uuid REFERENCES public.human_members(id) ON DELETE SET NULL,
  source_member_id uuid REFERENCES public.human_members(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  budget numeric(12,2),
  besoin text,
  phone text,
  adresse text,
  notes text,
  status text NOT NULL DEFAULT 'nouveau',
  opened_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_leads_status_check CHECK (status IN ('nouveau', 'pris', 'signe', 'perdu'))
);

CREATE INDEX IF NOT EXISTS idx_human_leads_owner_member_id
  ON public.human_leads(owner_member_id);
CREATE INDEX IF NOT EXISTS idx_human_leads_source_member_id
  ON public.human_leads(source_member_id);
CREATE INDEX IF NOT EXISTS idx_human_leads_status
  ON public.human_leads(status);
CREATE INDEX IF NOT EXISTS idx_human_leads_created_at
  ON public.human_leads(created_at DESC);

ALTER TABLE public.human_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "human leads select scoped or admin" ON public.human_leads;
CREATE POLICY "human leads select scoped or admin"
  ON public.human_leads
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm_me
      LEFT JOIN public.human_permissions hp
        ON hp.member_id = hm_me.id
      WHERE hm_me.user_id = auth.uid()
        AND (
          hm_me.id = human_leads.owner_member_id
          OR hm_me.id = human_leads.source_member_id
          OR (
            COALESCE(hp.access_mode, 'BINOME_ONLY') = 'SPHERE_FULL'
          )
          OR (
            COALESCE(hp.access_mode, 'BINOME_ONLY') = 'SELECTED_MEMBERS'
            AND EXISTS (
              SELECT 1
              FROM public.human_allowed_members ham
              WHERE ham.member_id = hm_me.id
                AND (ham.allowed_member_id = human_leads.owner_member_id OR ham.allowed_member_id = human_leads.source_member_id)
            )
          )
          OR EXISTS (
            SELECT 1
            FROM public.human_buddy_links hbl
            WHERE (hbl.member_a_id = hm_me.id AND hbl.member_b_id IN (human_leads.owner_member_id, human_leads.source_member_id))
               OR (hbl.member_b_id = hm_me.id AND hbl.member_a_id IN (human_leads.owner_member_id, human_leads.source_member_id))
          )
        )
    )
  );

DROP POLICY IF EXISTS "human leads insert admin only" ON public.human_leads;
CREATE POLICY "human leads insert admin only"
  ON public.human_leads
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_human_admin());

DROP POLICY IF EXISTS "human leads update owner source or admin" ON public.human_leads;
CREATE POLICY "human leads update owner source or admin"
  ON public.human_leads
  FOR UPDATE
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm_me
      WHERE hm_me.user_id = auth.uid()
        AND (hm_me.id = human_leads.owner_member_id OR hm_me.id = human_leads.source_member_id)
    )
  )
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm_me
      WHERE hm_me.user_id = auth.uid()
        AND (hm_me.id = human_leads.owner_member_id OR hm_me.id = human_leads.source_member_id)
    )
  );

DROP POLICY IF EXISTS "human leads delete admin only" ON public.human_leads;
CREATE POLICY "human leads delete admin only"
  ON public.human_leads
  FOR DELETE
  TO authenticated
  USING (public.is_human_admin());

COMMIT;
