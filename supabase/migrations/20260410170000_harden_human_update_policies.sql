BEGIN;

-- Harden updates on sensitive business tables:
-- member mutations should pass through controlled server actions (service role),
-- not direct authenticated client updates.

DROP POLICY IF EXISTS "human leads update owner source or admin" ON public.human_leads;
CREATE POLICY "human leads update admin only"
  ON public.human_leads
  FOR UPDATE
  TO authenticated
  USING (public.is_human_admin())
  WITH CHECK (public.is_human_admin());

DROP POLICY IF EXISTS "human signals update emitter target or admin" ON public.human_signals;
CREATE POLICY "human signals update admin only"
  ON public.human_signals
  FOR UPDATE
  TO authenticated
  USING (public.is_human_admin())
  WITH CHECK (public.is_human_admin());

DROP POLICY IF EXISTS "human cash update own or admin" ON public.human_cash_events;
CREATE POLICY "human cash update admin only"
  ON public.human_cash_events
  FOR UPDATE
  TO authenticated
  USING (public.is_human_admin())
  WITH CHECK (public.is_human_admin());

COMMIT;
