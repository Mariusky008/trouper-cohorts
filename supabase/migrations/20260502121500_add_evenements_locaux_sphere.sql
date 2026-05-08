ALTER TABLE public.human_marketplace_places
  DROP CONSTRAINT IF EXISTS human_marketplace_places_sphere_check;

ALTER TABLE public.human_marketplace_places
  ADD CONSTRAINT human_marketplace_places_sphere_check
  CHECK (
    sphere_key IN ('evenements-locaux', 'sante', 'habitat', 'digital', 'mariage', 'finance')
  );
