BEGIN;

ALTER TABLE public.human_scouts
  ADD COLUMN IF NOT EXISTS ville text;

COMMIT;
