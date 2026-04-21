BEGIN;

DROP POLICY IF EXISTS "human smart scan external clicks select own or admin" ON public.human_smart_scan_external_click_events;
CREATE POLICY "human smart scan external clicks select own or admin"
  ON public.human_smart_scan_external_click_events
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_external_click_events.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human smart scan external clicks insert own or admin" ON public.human_smart_scan_external_click_events;
CREATE POLICY "human smart scan external clicks insert own or admin"
  ON public.human_smart_scan_external_click_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_smart_scan_external_click_events.owner_member_id
        AND hm.user_id = auth.uid()
    )
  );

COMMIT;
