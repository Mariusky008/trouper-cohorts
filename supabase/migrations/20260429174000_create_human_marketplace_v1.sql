BEGIN;

CREATE TABLE IF NOT EXISTS public.human_marketplace_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  city_slug text NOT NULL,
  sphere_key text NOT NULL,
  sphere_label text NOT NULL,
  metier text NOT NULL,
  metier_slug text NOT NULL,
  status text NOT NULL DEFAULT 'dispo',
  owner_member_id uuid REFERENCES public.human_members(id) ON DELETE SET NULL,
  list_price_eur numeric(12,2),
  monthly_ca_eur numeric(12,2) NOT NULL DEFAULT 0,
  recos_per_year integer NOT NULL DEFAULT 0,
  conversion_rate numeric(6,2) NOT NULL DEFAULT 0,
  months_active integer NOT NULL DEFAULT 0,
  reciprocity_score integer NOT NULL DEFAULT 0,
  partners_count integer NOT NULL DEFAULT 0,
  value_growth_pct numeric(6,2) NOT NULL DEFAULT 0,
  is_seeded boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_marketplace_places_status_check CHECK (status IN ('dispo', 'sale', 'occupied', 'reserved')),
  CONSTRAINT human_marketplace_places_sphere_check CHECK (sphere_key IN ('sante', 'habitat', 'digital', 'mariage', 'finance')),
  CONSTRAINT human_marketplace_places_reciprocity_check CHECK (reciprocity_score >= 0 AND reciprocity_score <= 5),
  CONSTRAINT human_marketplace_places_amount_check CHECK (
    monthly_ca_eur >= 0
    AND recos_per_year >= 0
    AND conversion_rate >= 0
    AND months_active >= 0
    AND partners_count >= 0
    AND value_growth_pct >= 0
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_human_marketplace_places_city_metier_unique
  ON public.human_marketplace_places(city_slug, metier_slug);

CREATE INDEX IF NOT EXISTS idx_human_marketplace_places_city_status
  ON public.human_marketplace_places(city_slug, status);

CREATE INDEX IF NOT EXISTS idx_human_marketplace_places_sphere_status
  ON public.human_marketplace_places(sphere_key, status);

CREATE TABLE IF NOT EXISTS public.human_marketplace_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid REFERENCES public.human_marketplace_places(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  full_name text NOT NULL,
  metier text,
  city text,
  phone text,
  whatsapp text,
  website text,
  message text,
  offer_amount_eur numeric(12,2),
  status text NOT NULL DEFAULT 'pending',
  source text NOT NULL DEFAULT 'landing',
  created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_member_id uuid REFERENCES public.human_members(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_marketplace_offers_action_type_check CHECK (action_type IN ('buy_offer', 'sell_request', 'join_request')),
  CONSTRAINT human_marketplace_offers_status_check CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected', 'cancelled')),
  CONSTRAINT human_marketplace_offers_offer_amount_check CHECK (offer_amount_eur IS NULL OR offer_amount_eur >= 0)
);

CREATE INDEX IF NOT EXISTS idx_human_marketplace_offers_status_created
  ON public.human_marketplace_offers(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_human_marketplace_offers_place_created
  ON public.human_marketplace_offers(place_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.human_marketplace_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid REFERENCES public.human_marketplace_places(id) ON DELETE SET NULL,
  offer_id uuid REFERENCES public.human_marketplace_offers(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_marketplace_events_type_check CHECK (
    event_type IN ('seeded', 'status_changed', 'offer_submitted', 'join_requested', 'sell_requested')
  )
);

CREATE INDEX IF NOT EXISTS idx_human_marketplace_events_place_created
  ON public.human_marketplace_events(place_id, created_at DESC);

ALTER TABLE public.human_marketplace_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_marketplace_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_marketplace_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketplace places read public" ON public.human_marketplace_places;
CREATE POLICY "marketplace places read public"
  ON public.human_marketplace_places
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "marketplace places write admin only" ON public.human_marketplace_places;
CREATE POLICY "marketplace places write admin only"
  ON public.human_marketplace_places
  FOR ALL
  TO authenticated
  USING (public.is_human_admin())
  WITH CHECK (public.is_human_admin());

DROP POLICY IF EXISTS "marketplace offers create public" ON public.human_marketplace_offers;
CREATE POLICY "marketplace offers create public"
  ON public.human_marketplace_offers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "marketplace offers read admin only" ON public.human_marketplace_offers;
CREATE POLICY "marketplace offers read admin only"
  ON public.human_marketplace_offers
  FOR SELECT
  TO authenticated
  USING (public.is_human_admin());

DROP POLICY IF EXISTS "marketplace offers update admin only" ON public.human_marketplace_offers;
CREATE POLICY "marketplace offers update admin only"
  ON public.human_marketplace_offers
  FOR UPDATE
  TO authenticated
  USING (public.is_human_admin())
  WITH CHECK (public.is_human_admin());

DROP POLICY IF EXISTS "marketplace events read admin only" ON public.human_marketplace_events;
CREATE POLICY "marketplace events read admin only"
  ON public.human_marketplace_events
  FOR SELECT
  TO authenticated
  USING (public.is_human_admin());

DROP POLICY IF EXISTS "marketplace events write admin only" ON public.human_marketplace_events;
CREATE POLICY "marketplace events write admin only"
  ON public.human_marketplace_events
  FOR ALL
  TO authenticated
  USING (public.is_human_admin())
  WITH CHECK (public.is_human_admin());

COMMIT;
