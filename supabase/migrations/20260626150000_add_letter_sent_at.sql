-- Suivi de la date d'envoi de la lettre d'invitation (pour cocher "lettre envoyée")
BEGIN;

ALTER TABLE public.human_marketplace_places
  ADD COLUMN IF NOT EXISTS letter_sent_at timestamptz;

COMMIT;
