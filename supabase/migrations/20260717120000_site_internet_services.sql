-- Catalogue de prestations géré par le pro (« Mes accompagnements »). Tableau
-- JSON d'objets { name, duration, price, desc }. En maquette, on montre des
-- EXEMPLES issus de la config métier ; une fois publié, seules ces prestations
-- réelles s'affichent (jamais de tarif inventé en ligne). Section omise si vide.

BEGIN;

ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS services jsonb NOT NULL DEFAULT '[]'::jsonb;

NOTIFY pgrst, 'reload schema';

COMMIT;
