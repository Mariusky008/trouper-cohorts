BEGIN;

ALTER TABLE public.human_scout_referrals
  ADD COLUMN IF NOT EXISTS offered_at timestamptz;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'human_scout_referrals_status_check'
      AND conrelid = 'public.human_scout_referrals'::regclass
  ) THEN
    ALTER TABLE public.human_scout_referrals
      DROP CONSTRAINT human_scout_referrals_status_check;
  END IF;

  ALTER TABLE public.human_scout_referrals
    ADD CONSTRAINT human_scout_referrals_status_check
      CHECK (status IN ('submitted', 'validated', 'offered', 'rejected', 'converted', 'cancelled'));
END $$;

COMMIT;
