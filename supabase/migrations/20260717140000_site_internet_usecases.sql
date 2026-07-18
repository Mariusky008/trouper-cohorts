-- Motifs « Pour quoi venir me voir ? » gérés par le pro. Tableau JSON d'objets
-- { icon, title, desc }. En maquette, on montre les motifs proposés par la config
-- métier ; dès que le pro en saisit, ce sont les siens qui s'affichent (comme
-- pour les prestations). Section omise si aucun motif (ni pro, ni config).

BEGIN;

ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS usecases jsonb NOT NULL DEFAULT '[]'::jsonb;

NOTIFY pgrst, 'reload schema';

COMMIT;
