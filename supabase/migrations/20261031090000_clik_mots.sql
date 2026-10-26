-- 💌 LES PETITS MOTS — l'habitant écrit au commerçant (prototype « Les trois fantômes », étape 2).
--
-- Sous la vitrine d'un commerce où il a libéré son fantôme (`clik_cage`), l'habitant écrit un
-- petit mot — un par jour et par commerce —, ou en choisit un dans la liste (`liste`). Le
-- commerçant les lit à son comptoir :
--   · coeur_le : son 💛 — le mot passe dans sa vitrine. Un mot ÉCRIT ne se voit qu'après lui ;
--     un mot CHOISI dans la liste se voit tout de suite (il est gentil par construction) ;
--   · cadeau : ce qu'il offre (« le dessert »), jamais d'alcool ; l'habitant le trouve dans Ma Maison.
--
-- Seul le serveur écrit ici (clé de service) ; la sécurité par ligne est activée sans règle,
-- pour qu'aucun navigateur ne puisse lire ni écrire. Se rejoue sans casser.
CREATE TABLE IF NOT EXISTS public.clik_mot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  habitant_id uuid NOT NULL,
  texte text NOT NULL CHECK (char_length(texte) BETWEEN 1 AND 140),
  liste boolean NOT NULL DEFAULT false,
  jour date NOT NULL,
  coeur_le timestamptz,
  cadeau text NOT NULL DEFAULT '' CHECK (char_length(cadeau) <= 60),
  cadeau_le timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (site_id, habitant_id, jour)
);
CREATE INDEX IF NOT EXISTS clik_mot_site_idx ON public.clik_mot (site_id, created_at DESC);
CREATE INDEX IF NOT EXISTS clik_mot_habitant_idx ON public.clik_mot (habitant_id, created_at DESC);
ALTER TABLE public.clik_mot ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.clik_mot IS
  'Le petit mot d''un habitant à un commerce (un par jour), écrit ou choisi dans la liste ; le coup de cœur du commerçant (le mot passe dans sa vitrine) et ce qu''il offre, s''il offre.';
