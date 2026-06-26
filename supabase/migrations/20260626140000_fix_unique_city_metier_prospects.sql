-- La contrainte unique (city_slug, metier_slug) bloque la création de prospects
-- pour un métier déjà occupé par une place active.
-- On remplace l'index global par un index partiel : unicité seulement pour les
-- places avec status = 'active' (la place vendue/occupée). Les prospects peuvent
-- coexister librement.
BEGIN;

DROP INDEX IF EXISTS idx_human_marketplace_places_city_metier_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_human_marketplace_places_city_metier_active
  ON public.human_marketplace_places(city_slug, metier_slug)
  WHERE status = 'active';

COMMIT;
