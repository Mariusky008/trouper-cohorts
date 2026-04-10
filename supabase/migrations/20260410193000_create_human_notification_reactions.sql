BEGIN;

CREATE TABLE IF NOT EXISTS public.human_notification_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.human_notifications(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_notification_reactions_emoji_check CHECK (emoji IN ('👏', '🔥', '💰', '🚀')),
  CONSTRAINT human_notification_reactions_unique UNIQUE (notification_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_human_notification_reactions_notification
  ON public.human_notification_reactions(notification_id);
CREATE INDEX IF NOT EXISTS idx_human_notification_reactions_member
  ON public.human_notification_reactions(member_id);

ALTER TABLE public.human_notification_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "human notification reactions read own or admin" ON public.human_notification_reactions;
CREATE POLICY "human notification reactions read own or admin"
  ON public.human_notification_reactions
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_notification_reactions.member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human notification reactions write own or admin" ON public.human_notification_reactions;
CREATE POLICY "human notification reactions write own or admin"
  ON public.human_notification_reactions
  FOR ALL
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_notification_reactions.member_id
        AND hm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_notification_reactions.member_id
        AND hm.user_id = auth.uid()
    )
  );

COMMIT;
