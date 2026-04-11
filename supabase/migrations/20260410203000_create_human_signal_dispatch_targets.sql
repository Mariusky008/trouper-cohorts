BEGIN;

CREATE TABLE IF NOT EXISTS public.human_signal_dispatch_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id uuid NOT NULL REFERENCES public.human_signals(id) ON DELETE CASCADE,
  target_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  notified_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  status text NOT NULL DEFAULT 'notified',
  note text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_signal_dispatch_targets_status_check CHECK (status IN ('notified', 'seen', 'acted')),
  CONSTRAINT human_signal_dispatch_targets_unique UNIQUE (signal_id, target_member_id)
);

CREATE INDEX IF NOT EXISTS idx_human_signal_dispatch_targets_signal
  ON public.human_signal_dispatch_targets(signal_id);
CREATE INDEX IF NOT EXISTS idx_human_signal_dispatch_targets_target
  ON public.human_signal_dispatch_targets(target_member_id);

ALTER TABLE public.human_signal_dispatch_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "human signal dispatch read own target or admin" ON public.human_signal_dispatch_targets;
CREATE POLICY "human signal dispatch read own target or admin"
  ON public.human_signal_dispatch_targets
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_signal_dispatch_targets.target_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human signal dispatch write admin only" ON public.human_signal_dispatch_targets;
CREATE POLICY "human signal dispatch write admin only"
  ON public.human_signal_dispatch_targets
  FOR ALL
  TO authenticated
  USING (public.is_human_admin())
  WITH CHECK (public.is_human_admin());

COMMIT;
