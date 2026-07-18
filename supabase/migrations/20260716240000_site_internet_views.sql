-- Compteur de vues du site (pour le tableau de bord de l'Espace Pro). Incrémenté
-- à chaque affichage de la maquette/site (best-effort). Approximatif (rafraîchis-
-- sements, robots) mais suffisant pour donner au pro le sentiment que ça vit.

BEGIN;

ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS site_views integer NOT NULL DEFAULT 0;

NOTIFY pgrst, 'reload schema';

COMMIT;
