BEGIN;

CREATE TABLE IF NOT EXISTS public.human_privilege_swipe_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_slug text NOT NULL,
  client_phone_e164 text NOT NULL,
  favorite_place_ids text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_privilege_swipe_favorites_place_ids_limit CHECK (array_length(favorite_place_ids, 1) IS NULL OR array_length(favorite_place_ids, 1) <= 200)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_human_privilege_swipe_favorites_unique
  ON public.human_privilege_swipe_favorites(city_slug, client_phone_e164);

CREATE INDEX IF NOT EXISTS idx_human_privilege_swipe_favorites_updated
  ON public.human_privilege_swipe_favorites(updated_at DESC);

COMMIT;

