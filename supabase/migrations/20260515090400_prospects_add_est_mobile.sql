BEGIN;
ALTER TABLE public.human_review_prospects
  ADD COLUMN IF NOT EXISTS est_mobile boolean NOT NULL DEFAULT false;
NOTIFY pgrst, 'reload schema';
COMMIT;
