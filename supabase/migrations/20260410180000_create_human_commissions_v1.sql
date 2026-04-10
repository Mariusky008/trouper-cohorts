BEGIN;

CREATE TABLE IF NOT EXISTS public.human_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.human_leads(id) ON DELETE CASCADE,
  signed_amount numeric(12,2) NOT NULL,
  commission_amount numeric(12,2) NOT NULL,
  payer_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  receiver_member_id uuid NOT NULL REFERENCES public.human_members(id) ON DELETE CASCADE,
  payment_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_commissions_signed_amount_non_negative CHECK (signed_amount >= 0),
  CONSTRAINT human_commissions_commission_amount_non_negative CHECK (commission_amount >= 0),
  CONSTRAINT human_commissions_payment_status_check CHECK (payment_status IN ('pending', 'paid', 'cancelled'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_human_commissions_lead_id_unique
  ON public.human_commissions(lead_id);
CREATE INDEX IF NOT EXISTS idx_human_commissions_receiver_member_id
  ON public.human_commissions(receiver_member_id);
CREATE INDEX IF NOT EXISTS idx_human_commissions_payer_member_id
  ON public.human_commissions(payer_member_id);
CREATE INDEX IF NOT EXISTS idx_human_commissions_payment_status
  ON public.human_commissions(payment_status);

ALTER TABLE public.human_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "human commissions select own or admin" ON public.human_commissions;
CREATE POLICY "human commissions select own or admin"
  ON public.human_commissions
  FOR SELECT
  TO authenticated
  USING (
    public.is_human_admin()
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_commissions.receiver_member_id
        AND hm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.human_members hm
      WHERE hm.id = human_commissions.payer_member_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "human commissions insert admin only" ON public.human_commissions;
CREATE POLICY "human commissions insert admin only"
  ON public.human_commissions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_human_admin());

DROP POLICY IF EXISTS "human commissions update admin only" ON public.human_commissions;
CREATE POLICY "human commissions update admin only"
  ON public.human_commissions
  FOR UPDATE
  TO authenticated
  USING (public.is_human_admin())
  WITH CHECK (public.is_human_admin());

DROP POLICY IF EXISTS "human commissions delete admin only" ON public.human_commissions;
CREATE POLICY "human commissions delete admin only"
  ON public.human_commissions
  FOR DELETE
  TO authenticated
  USING (public.is_human_admin());

COMMIT;
