BEGIN;

-- 1) Prevent unique conflicts on (city_slug, metier_slug) by deduplicating rows that will collapse into the same zone.
WITH mapped AS (
  SELECT
    id,
    metier_slug,
    CASE
      WHEN city ILIKE 'Bayonne%' OR city ILIKE 'Anglet%' OR city ILIKE 'Biarritz%' THEN 'Bayonne-Anglet-Biarritz'
      WHEN city ILIKE 'Bordeaux%' THEN 'Bordeaux'
      WHEN city ILIKE 'Pau%' THEN 'Pau'
      ELSE 'Grand Dax'
    END AS target_city,
    CASE
      WHEN city ILIKE 'Bayonne%' OR city ILIKE 'Anglet%' OR city ILIKE 'Biarritz%' THEN 'bayonne-anglet-biarritz'
      WHEN city ILIKE 'Bordeaux%' THEN 'bordeaux'
      WHEN city ILIKE 'Pau%' THEN 'pau'
      ELSE 'grand-dax'
    END AS target_city_slug,
    ROW_NUMBER() OVER (
      PARTITION BY
        CASE
          WHEN city ILIKE 'Bayonne%' OR city ILIKE 'Anglet%' OR city ILIKE 'Biarritz%' THEN 'bayonne-anglet-biarritz'
          WHEN city ILIKE 'Bordeaux%' THEN 'bordeaux'
          WHEN city ILIKE 'Pau%' THEN 'pau'
          ELSE 'grand-dax'
        END,
        metier_slug
      ORDER BY
        (owner_member_id IS NOT NULL) DESC,
        (status IN ('sale', 'occupied', 'reserved')) DESC,
        COALESCE(list_price_eur, 0) DESC,
        updated_at DESC,
        id DESC
    ) AS rn
  FROM public.human_marketplace_places
),
to_delete AS (
  SELECT id
  FROM mapped
  WHERE rn > 1
)
DELETE FROM public.human_marketplace_places p
USING to_delete d
WHERE p.id = d.id;

-- 2) Normalize marketplace places to the 4 agreed zones.
UPDATE public.human_marketplace_places
SET
  city = CASE
    WHEN city ILIKE 'Bayonne%' OR city ILIKE 'Anglet%' OR city ILIKE 'Biarritz%' THEN 'Bayonne-Anglet-Biarritz'
    WHEN city ILIKE 'Bordeaux%' THEN 'Bordeaux'
    WHEN city ILIKE 'Pau%' THEN 'Pau'
    ELSE 'Grand Dax'
  END,
  city_slug = CASE
    WHEN city ILIKE 'Bayonne%' OR city ILIKE 'Anglet%' OR city ILIKE 'Biarritz%' THEN 'bayonne-anglet-biarritz'
    WHEN city ILIKE 'Bordeaux%' THEN 'bordeaux'
    WHEN city ILIKE 'Pau%' THEN 'pau'
    ELSE 'grand-dax'
  END,
  updated_at = timezone('utc', now());

-- 3) Keep admin/pipeline records aligned with the same 4 zones.
UPDATE public.human_marketplace_offers
SET city = CASE
  WHEN city ILIKE 'Bayonne%' OR city ILIKE 'Anglet%' OR city ILIKE 'Biarritz%' THEN 'Bayonne-Anglet-Biarritz'
  WHEN city ILIKE 'Bordeaux%' THEN 'Bordeaux'
  WHEN city ILIKE 'Pau%' THEN 'Pau'
  ELSE 'Grand Dax'
END
WHERE city IS NOT NULL;

UPDATE public.human_marketplace_landing_activations
SET city = CASE
  WHEN city ILIKE 'Bayonne%' OR city ILIKE 'Anglet%' OR city ILIKE 'Biarritz%' THEN 'Bayonne-Anglet-Biarritz'
  WHEN city ILIKE 'Bordeaux%' THEN 'Bordeaux'
  WHEN city ILIKE 'Pau%' THEN 'Pau'
  ELSE 'Grand Dax'
END
WHERE city IS NOT NULL;

UPDATE public.human_marketplace_landing_events
SET city = CASE
  WHEN city ILIKE 'Bayonne%' OR city ILIKE 'Anglet%' OR city ILIKE 'Biarritz%' THEN 'Bayonne-Anglet-Biarritz'
  WHEN city ILIKE 'Bordeaux%' THEN 'Bordeaux'
  WHEN city ILIKE 'Pau%' THEN 'Pau'
  ELSE 'Grand Dax'
END
WHERE city IS NOT NULL;

UPDATE public.human_marketplace_cobrand_offers
SET
  city = CASE
    WHEN city ILIKE 'Bayonne%' OR city ILIKE 'Anglet%' OR city ILIKE 'Biarritz%' THEN 'Bayonne-Anglet-Biarritz'
    WHEN city ILIKE 'Bordeaux%' THEN 'Bordeaux'
    WHEN city ILIKE 'Pau%' THEN 'Pau'
    ELSE 'Grand Dax'
  END,
  city_slug = CASE
    WHEN city ILIKE 'Bayonne%' OR city ILIKE 'Anglet%' OR city ILIKE 'Biarritz%' THEN 'bayonne-anglet-biarritz'
    WHEN city ILIKE 'Bordeaux%' THEN 'bordeaux'
    WHEN city ILIKE 'Pau%' THEN 'pau'
    ELSE 'grand-dax'
  END,
  updated_at = timezone('utc', now())
WHERE city IS NOT NULL;

COMMIT;
