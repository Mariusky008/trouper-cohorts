BEGIN;

CREATE TABLE IF NOT EXISTS public.human_privilege_local_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  city_slug text NOT NULL,
  title text NOT NULL,
  day_label text NOT NULL,
  place_label text NOT NULL,
  badge text,
  sponsor_names text,
  emoji text,
  details text,
  image_url text,
  sort_order integer NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_privilege_local_events_status_check CHECK (status IN ('active', 'inactive'))
);

CREATE INDEX IF NOT EXISTS idx_human_privilege_local_events_city_status
  ON public.human_privilege_local_events(city_slug, status, sort_order, created_at DESC);

COMMIT;
