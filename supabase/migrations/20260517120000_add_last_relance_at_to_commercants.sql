ALTER TABLE public.human_review_commercants
  ADD COLUMN IF NOT EXISTS last_relance_at timestamptz;
