-- Ajoute le champ type_membre pour choisir le verso de la lettre (commerçant vs artisan)
BEGIN;

ALTER TABLE public.human_marketplace_places
  ADD COLUMN IF NOT EXISTS type_membre text NOT NULL DEFAULT 'commercant';

COMMIT;
