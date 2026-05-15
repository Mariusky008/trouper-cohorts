BEGIN;
ALTER TABLE public.human_review_prospects
  ADD COLUMN IF NOT EXISTS zone text;
NOTIFY pgrst, 'reload schema';
COMMIT;
