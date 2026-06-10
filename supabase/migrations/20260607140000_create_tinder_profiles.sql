-- Catalogue Privilège — cartes "Profil Tinder du commerçant".
-- Carte spéciale (codes des applis de rencontre) qui humanise le commerçant.
-- S'intercale dans le deck tous les N swipes (N = réglage global).
-- ⚠️ CONSENTEMENT : un profil n'est publié que si le commerçant a validé
-- sa photo, sa bio et le ton (consent = true) ET status = 'active'.

CREATE TABLE IF NOT EXISTS public.human_privilege_tinder_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  city_slug text NOT NULL,
  pro_name text NOT NULL,
  age text,
  pro_title text NOT NULL,
  bio text,
  tags text,                 -- séparés par '·'
  compat integer NOT NULL DEFAULT 95,
  match_gift text,
  coupon_code text,
  photo_url text,
  address text,
  phone text,
  website text,
  wa_phone text,
  consent boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'inactive',
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT human_privilege_tinder_status_check CHECK (status IN ('active', 'inactive'))
);

CREATE INDEX IF NOT EXISTS idx_human_privilege_tinder_city_status
  ON public.human_privilege_tinder_profiles(city_slug, status, sort_order, created_at DESC);

-- Réglages globaux du catalogue (fréquence d'apparition des profils Tinder, etc.)
CREATE TABLE IF NOT EXISTS public.human_privilege_catalogue_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.human_privilege_catalogue_settings (key, value)
  VALUES ('tinder_frequency', '3')
  ON CONFLICT (key) DO NOTHING;
