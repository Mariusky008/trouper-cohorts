BEGIN;

ALTER TABLE public.human_scouts
  ADD COLUMN IF NOT EXISTS scout_type text NOT NULL DEFAULT 'perso';

UPDATE public.human_scouts
SET scout_type = 'perso'
WHERE scout_type IS NULL OR btrim(scout_type) = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'human_scouts_scout_type_check'
      AND conrelid = 'public.human_scouts'::regclass
  ) THEN
    ALTER TABLE public.human_scouts
      ADD CONSTRAINT human_scouts_scout_type_check CHECK (scout_type IN ('perso', 'pro'));
  END IF;
END $$;

COMMIT;
