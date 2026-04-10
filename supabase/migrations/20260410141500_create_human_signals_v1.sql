BEGIN;

CREATE TABLE IF NOT EXISTS public.human_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emitter_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  target_member_id uuid REFERENCES public.human_members(id) ON DELETE SET NULL,
  title text NOT NULL,
  detail text NOT NULL,
  signal_strength integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_signals_strength_check CHECK (signal_strength BETWEEN 1 AND 5),
  CONSTRAINT human_signals_status_check CHECK (status IN ('open', 'in_progress', 'closed'))
);

CREATE INDEX IF NOT EXISTS idx_human_signals_emitter_member_id
  ON public.human_signals(emitter_member_id);
CREATE INDEX IF NOT EXISTS idx_human_signals_target_member_id
  ON public.human_signals(target_member_id);
CREATE INDEX IF NOT EXISTS idx_human_signals_status
  ON public.human_signals(status);
CREATE INDEX IF NOT EXISTS idx_human_signals_created_at
  ON public.human_signals(created_at DESC);

ALTER TABLE public.human_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "human signals select scoped or admin" ON public.human_signals;
CREATE POLICY "human signals select scoped or admin"
  ON public.human_signals
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
          hm_me.id = human_signals.emitter_member_id
          OR hm_me.id = human_signals.target_member_id
          OR COALESCE(hp.access_mode, 'BINOME_ONLY') = 'SPHERE_FULL'
          OR (
            COALESCE(hp.access_mode, 'BINOME_ONLY') = 'SELECTED_MEMBERS'
            AND EXISTS (
              SELECT 1
              FROM public.human_allowed_members ham
              WHERE ham.member_id = hm_me.id
                AND (ham.allowed_member_id = human_signals.emitter_member_id OR ham.allowed_member_id = human_signals.target_member_id)
            )
          )
          OR EXISTS (
            SELECT 1
            FROM public.human_buddy_links hbl
            WHERE (hbl.member_a_id = hm_me.id AND hbl.member_b_id IN (human_signals.emitter_member_id, human_signals.target_member_id))
               OR (hbl.member_b_id = hm_me.id AND hbl.member_a_id IN (human_signals.emitter_member_id, human_signals.target_member_id))
          )
        )
    )
  );

DROP POLICY IF EXISTS "human signals insert scoped" ON public.human_signals;
CREATE POLICY "human signals insert scoped"
  ON public.human_signals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm_me
      WHERE hm_me.user_id = auth.uid()
        AND hm_me.id = human_signals.emitter_member_id
    )
  );

DROP POLICY IF EXISTS "human signals update emitter target or admin" ON public.human_signals;
CREATE POLICY "human signals update emitter target or admin"
  ON public.human_signals
  FOR UPDATE
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm_me
      WHERE hm_me.user_id = auth.uid()
        AND (hm_me.id = human_signals.emitter_member_id OR hm_me.id = human_signals.target_member_id)
    )
  )
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm_me
      WHERE hm_me.user_id = auth.uid()
        AND (hm_me.id = human_signals.emitter_member_id OR hm_me.id = human_signals.target_member_id)
    )
  );

DROP POLICY IF EXISTS "human signals delete admin only" ON public.human_signals;
CREATE POLICY "human signals delete admin only"
  ON public.human_signals
  FOR DELETE
  TO authenticated
  USING (public.is_human_admin());

COMMIT;
