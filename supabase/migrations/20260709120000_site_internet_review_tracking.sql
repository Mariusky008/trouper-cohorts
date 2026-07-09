-- Suivi des avis Google dans le temps (Espace Pro : « +N avis depuis votre
-- inscription »). HONNÊTE : le delta est un vrai écart entre deux relevés réels.
--  pro_reviews_baseline      = nombre d'avis au démarrage du suivi (1re visite)
--  pro_baseline_at           = date de ce point de départ
--  google_reviews_refreshed_at = date du dernier relevé (bouton « Actualiser »)

BEGIN;

ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS pro_reviews_baseline integer,
  ADD COLUMN IF NOT EXISTS pro_baseline_at timestamptz,
  ADD COLUMN IF NOT EXISTS google_reviews_refreshed_at timestamptz;

NOTIFY pgrst, 'reload schema';

COMMIT;
