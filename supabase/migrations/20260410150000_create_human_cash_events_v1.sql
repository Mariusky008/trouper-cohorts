BEGIN;

CREATE TABLE IF NOT EXISTS public.human_cash_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  source_type text NOT NULL DEFAULT 'manual',
  source_id uuid,
  kind text NOT NULL,
  amount numeric(12,2) NOT NULL,
  description text NOT NULL,
  event_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_cash_events_kind_check CHECK (kind IN ('encaissement', 'decaissement')),
  CONSTRAINT human_cash_events_source_type_check CHECK (source_type IN ('lead', 'signal', 'manual')),
  CONSTRAINT human_cash_events_amount_positive CHECK (amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_human_cash_events_member_id
  ON public.human_cash_events(member_id);
CREATE INDEX IF NOT EXISTS idx_human_cash_events_event_date
  ON public.human_cash_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_human_cash_events_kind
  ON public.human_cash_events(kind);

ALTER TABLE public.human_cash_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "human cash select own or admin" ON public.human_cash_events;
CREATE POLICY "human cash select own or admin"
  ON public.human_cash_events
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_cash_events.member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human cash insert own or admin" ON public.human_cash_events;
CREATE POLICY "human cash insert own or admin"
  ON public.human_cash_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_cash_events.member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human cash update own or admin" ON public.human_cash_events;
CREATE POLICY "human cash update own or admin"
  ON public.human_cash_events
  FOR UPDATE
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_cash_events.member_id
        AND hm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_cash_events.member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human cash delete admin only" ON public.human_cash_events;
CREATE POLICY "human cash delete admin only"
  ON public.human_cash_events
  FOR DELETE
  TO authenticated
  USING (public.is_human_admin());

COMMIT;
