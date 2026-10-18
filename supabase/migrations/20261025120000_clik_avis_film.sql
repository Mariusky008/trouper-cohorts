-- 👻 L'AVIS DU CLIENT À LA FIN D'UN FILM — trois petits fantômes.
--
-- « On a oublié, à la fin de l'interview, de mettre nos petits fantômes pour
-- récolter l'avis du client, qu'on a déjà mis autre part, à l'essayage par
-- exemple. » Les mêmes trois visages que l'essayage et les surprises :
-- J'aime pas (-1), Sympa sans plus (0), J'adore (1).
--
-- UN AVIS PAR PERSONNE ET PAR FILM. Le film est désigné par son adresse : une
-- interview vit un jour, celle du lendemain en a une autre. Changer d'avis
-- remplace la ligne, n'en ajoute pas une — d'où la contrainte d'unicité.
--
-- Aucun texte libre : rien à modérer. Seul le serveur écrit ici (clé de
-- service) ; la sécurité par ligne est activée sans règle, pour qu'aucun
-- navigateur ne puisse lire ni écrire directement.
CREATE TABLE IF NOT EXISTS public.clik_avis_film (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  habitant_id uuid NOT NULL,
  film text NOT NULL CHECK (char_length(film) BETWEEN 1 AND 500),
  sens smallint NOT NULL CHECK (sens IN (-1, 0, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (habitant_id, site_id, film)
);
CREATE INDEX IF NOT EXISTS clik_avis_film_site_idx ON public.clik_avis_film (site_id, updated_at DESC);
ALTER TABLE public.clik_avis_film ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.clik_avis_film IS
  'L''avis d''un habitant à la fin d''un film de commerçant (son interview) : -1 J''aime pas, 0 Sympa sans plus, 1 J''adore. Un par personne et par film.';
