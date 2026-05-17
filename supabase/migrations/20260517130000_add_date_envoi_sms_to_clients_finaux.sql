ALTER TABLE public.human_review_clients_finaux
  ADD COLUMN IF NOT EXISTS date_envoi_sms timestamptz;
