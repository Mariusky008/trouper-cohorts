-- Ajoute le champ activite pour personnaliser la lettre d'invitation QR
BEGIN;

ALTER TABLE public.human_marketplace_places
  ADD COLUMN IF NOT EXISTS activite text;

COMMIT;
