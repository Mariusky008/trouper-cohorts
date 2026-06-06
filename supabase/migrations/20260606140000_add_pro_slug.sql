-- Catalogue Privilège — lien "espace commerçant" court et lisible.
-- pro_slug : identifiant court par offre (ex: elise-bordeaux-c6d6) utilisé
-- dans /privilege/pro?p=<slug> à la place du long token base64.
-- Additif, sans risque.

ALTER TABLE public.human_marketplace_places
  ADD COLUMN IF NOT EXISTS pro_slug text;

CREATE INDEX IF NOT EXISTS idx_marketplace_places_pro_slug
  ON public.human_marketplace_places (pro_slug)
  WHERE pro_slug IS NOT NULL;
