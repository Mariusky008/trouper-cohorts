BEGIN;

CREATE TABLE IF NOT EXISTS public.human_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'personnelle',
  title text NOT NULL,
  message text NOT NULL,
  impact text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_notifications_type_check CHECK (type IN ('generale', 'personnelle', 'felicitation'))
);

CREATE INDEX IF NOT EXISTS idx_human_notifications_member_id
  ON public.human_notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_human_notifications_member_read
  ON public.human_notifications(member_id, is_read);
CREATE INDEX IF NOT EXISTS idx_human_notifications_created_at
  ON public.human_notifications(created_at DESC);

ALTER TABLE public.human_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "human notifications read own or admin" ON public.human_notifications;
CREATE POLICY "human notifications read own or admin"
  ON public.human_notifications
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_notifications.member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human notifications insert admin only" ON public.human_notifications;
CREATE POLICY "human notifications insert admin only"
  ON public.human_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_human_admin());

DROP POLICY IF EXISTS "human notifications update own or admin" ON public.human_notifications;
CREATE POLICY "human notifications update own or admin"
  ON public.human_notifications
  FOR UPDATE
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_notifications.member_id
        AND hm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_notifications.member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human notifications delete admin only" ON public.human_notifications;
CREATE POLICY "human notifications delete admin only"
  ON public.human_notifications
  FOR DELETE
  TO authenticated
  USING (public.is_human_admin());

COMMIT;
