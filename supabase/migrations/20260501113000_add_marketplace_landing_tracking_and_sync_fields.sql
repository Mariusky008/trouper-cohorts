BEGIN;

ALTER TABLE public.human_marketplace_places
  ADD COLUMN IF NOT EXISTS external_ref text,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS privilege_badge text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS category_key text,
  ADD COLUMN IF NOT EXISTS partner_phone text,
  ADD COLUMN IF NOT EXISTS partner_whatsapp text;

CREATE UNIQUE INDEX IF NOT EXISTS uq_human_marketplace_places_external_ref
  ON public.human_marketplace_places (external_ref)
  WHERE external_ref IS NOT NULL;

ALTER TABLE public.human_marketplace_places
  DROP CONSTRAINT IF EXISTS human_marketplace_places_category_key_check;

ALTER TABLE public.human_marketplace_places
  ADD CONSTRAINT human_marketplace_places_category_key_check
  CHECK (category_key IS NULL OR category_key IN ('maison', 'sante', 'travaux', 'bien-etre', 'services'));

CREATE TABLE IF NOT EXISTS public.human_marketplace_landing_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid REFERENCES public.human_marketplace_places(id) ON DELETE SET NULL,
  city text NOT NULL,
  category_key text NOT NULL,
  client_id text NOT NULL,
  client_name text NOT NULL,
  referrer_id text NOT NULL,
  referrer_name text NOT NULL,
  partner_member_id uuid REFERENCES public.human_members(id) ON DELETE SET NULL,
  partner_name text,
  partner_phone text,
  source text NOT NULL DEFAULT 'whatsapp_landing',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  activated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_marketplace_landing_activations_category_check
    CHECK (category_key IN ('maison', 'sante', 'travaux', 'bien-etre', 'services'))
);

CREATE INDEX IF NOT EXISTS idx_human_marketplace_landing_activations_city_category
  ON public.human_marketplace_landing_activations(city, category_key, activated_at DESC);

CREATE INDEX IF NOT EXISTS idx_human_marketplace_landing_activations_partner
  ON public.human_marketplace_landing_activations(partner_member_id, activated_at DESC);

CREATE TABLE IF NOT EXISTS public.human_marketplace_landing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  city text,
  category_key text,
  place_id uuid REFERENCES public.human_marketplace_places(id) ON DELETE SET NULL,
  client_id text,
  referrer_id text,
  partner_member_id uuid REFERENCES public.human_members(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'whatsapp_landing',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT human_marketplace_landing_events_type_check
    CHECK (event_type IN ('landing_view', 'category_view', 'search_used', 'activate_click')),
  CONSTRAINT human_marketplace_landing_events_category_check
    CHECK (category_key IS NULL OR category_key IN ('maison', 'sante', 'travaux', 'bien-etre', 'services'))
);

CREATE INDEX IF NOT EXISTS idx_human_marketplace_landing_events_city_type
  ON public.human_marketplace_landing_events(city, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_human_marketplace_landing_events_category
  ON public.human_marketplace_landing_events(category_key, created_at DESC);

ALTER TABLE public.human_marketplace_landing_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_marketplace_landing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketplace landing activations read admin only" ON public.human_marketplace_landing_activations;
CREATE POLICY "marketplace landing activations read admin only"
  ON public.human_marketplace_landing_activations
  FOR SELECT
  TO authenticated
  USING (public.is_human_admin());

DROP POLICY IF EXISTS "marketplace landing activations write admin only" ON public.human_marketplace_landing_activations;
CREATE POLICY "marketplace landing activations write admin only"
  ON public.human_marketplace_landing_activations
  FOR ALL
  TO authenticated
  USING (public.is_human_admin())
  WITH CHECK (public.is_human_admin());

DROP POLICY IF EXISTS "marketplace landing events read admin only" ON public.human_marketplace_landing_events;
CREATE POLICY "marketplace landing events read admin only"
  ON public.human_marketplace_landing_events
  FOR SELECT
  TO authenticated
  USING (public.is_human_admin());

DROP POLICY IF EXISTS "marketplace landing events write admin only" ON public.human_marketplace_landing_events;
CREATE POLICY "marketplace landing events write admin only"
  ON public.human_marketplace_landing_events
  FOR ALL
  TO authenticated
  USING (public.is_human_admin())
  WITH CHECK (public.is_human_admin());

COMMIT;
