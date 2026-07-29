-- FAQ « Avant de venir » rédigée par le commerçant.
--
-- Comme « Mon approche », elle venait d'un gabarit par métier. Les réponses sont
-- neutres et pratiques, donc on continue à les afficher par défaut — mais le
-- commerçant doit pouvoir les corriger : lui seul sait s'il prend la carte, s'il
-- reçoit sans rendez-vous, ou ce qu'il répond sur ses tarifs.
--
-- `faq` = [{ q, a }] (max 6). NULL ou vide = on garde la proposition du métier.
-- Cette même liste alimente l'assistante du site : la corriger ici corrige aussi
-- ce qu'elle répond.

BEGIN;

ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS faq jsonb;

NOTIFY pgrst, 'reload schema';

COMMIT;
