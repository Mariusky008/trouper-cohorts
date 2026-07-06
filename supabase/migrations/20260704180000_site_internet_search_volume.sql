-- Métrique de demande : volume de recherches Google mensuel par métier + ville.
-- Sert à afficher une urgence HONNÊTE sur la lettre (« ~450 recherches/mois »).
-- Aucune valeur inventée : si on n'a pas de donnée réelle, on n'affiche rien.

BEGIN;

-- Volume résolu pour un prospect (saisi à la main ou rempli depuis la table).
ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS search_volume integer;

-- Table de référence métier + ville → recherches/mois (renseignée par l'admin
-- à partir d'un vrai outil de mots-clés). Réutilisée pour tous les prospects
-- du même couple métier/ville.
CREATE TABLE IF NOT EXISTS public.human_site_market_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metier text NOT NULL,
  city text NOT NULL,
  monthly_searches integer NOT NULL CHECK (monthly_searches >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS human_site_market_data_metier_city_uq
  ON public.human_site_market_data (lower(metier), lower(city));

NOTIFY pgrst, 'reload schema';

COMMIT;
