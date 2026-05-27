-- ============================================================
-- KUDOS — Onboarding réflexif + Tribu
-- Phase 1 : questions sur soi + portrait intérieur amorcé
-- ============================================================

-- 1. Colonnes onboarding sur kudos_users
ALTER TABLE kudos_users
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_answers_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tribe_opt_in boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS archetype_id text;

-- 2. Dimensions de valeur (source du delta)
CREATE TABLE IF NOT EXISTS kudos_value_dimensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  label text NOT NULL,
  pole_low text NOT NULL,
  pole_high text NOT NULL,
  created_at timestamptz DEFAULT now()
);

INSERT INTO kudos_value_dimensions (slug, label, pole_low, pole_high) VALUES
  ('chaleur_vs_distance',      'Chaleur / Distance',       'Distant, réservé',        'Chaleureux, expressif'),
  ('discretion_vs_visibilite', 'Discrétion / Visibilité',  'Discret, en retrait',     'Visible, rayonnant'),
  ('profondeur_vs_brillance',  'Profondeur / Brillance',   'Profond, réfléchi',       'Brillant, pétillant'),
  ('regularite_vs_intensite',  'Régularité / Intensité',   'Régulier, stable',        'Intense, passionné'),
  ('leadership',               'Leadership',               'Suiveur, coopératif',     'Leader, initiateur'),
  ('self_image',               'Image de soi',             'Humble, effacé',          'Confiant, affirmé')
ON CONFLICT (slug) DO NOTHING;

-- 3. Réponses d'onboarding
CREATE TABLE IF NOT EXISTS kudos_onboarding_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES kudos_users(id) ON DELETE CASCADE,
  dimension_slug text REFERENCES kudos_value_dimensions(slug),
  option_index int NOT NULL,       -- 0-3 (A/B/C/D)
  option_label text NOT NULL,
  score numeric(3,2) NOT NULL,     -- 0.0 à 1.0 (pole_low → pole_high)
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, dimension_slug)
);

-- 4. Portrait intérieur (miroir de soi)
CREATE TABLE IF NOT EXISTS kudos_inner_portrait (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES kudos_users(id) ON DELETE CASCADE UNIQUE,
  dimensions jsonb DEFAULT '{}',        -- { slug: score }
  top_traits jsonb DEFAULT '[]',        -- [{ emoji, label }]
  gap_score numeric(4,1),               -- 0-100 : convergence vs divergence
  tension text CHECK (tension IN ('converge','diverge','unknown')) DEFAULT 'unknown',
  blindspots jsonb DEFAULT '[]',
  hidden_garden jsonb DEFAULT '[]',
  last_computed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- 5. Tables Tribu
CREATE TABLE IF NOT EXISTS kudos_tribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text NOT NULL CHECK (mode IN ('friends_clan','new_encounters')),
  city text NOT NULL,
  status text DEFAULT 'forming' CHECK (status IN ('forming','proposed','sealed','met','expired')),
  archetype_mix jsonb DEFAULT '[]',
  proposed_date timestamptz,
  proposed_place text,
  created_at timestamptz DEFAULT now(),
  sealed_at timestamptz
);

CREATE TABLE IF NOT EXISTS kudos_tribe_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tribe_id uuid REFERENCES kudos_tribes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES kudos_users(id) ON DELETE CASCADE,
  archetype_id text NOT NULL,
  status text DEFAULT 'invited' CHECK (status IN ('invited','accepted','declined')),
  responded_at timestamptz,
  UNIQUE(tribe_id, user_id)
);

-- 6. Index performance
CREATE INDEX IF NOT EXISTS idx_onboarding_user ON kudos_onboarding_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_inner_portrait_user ON kudos_inner_portrait(user_id);
CREATE INDEX IF NOT EXISTS idx_tribe_members_tribe ON kudos_tribe_members(tribe_id);
CREATE INDEX IF NOT EXISTS idx_tribe_members_user ON kudos_tribe_members(user_id);

-- 7. RLS
ALTER TABLE kudos_value_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kudos_onboarding_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE kudos_inner_portrait ENABLE ROW LEVEL SECURITY;
ALTER TABLE kudos_tribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kudos_tribe_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kudos_dims_public_read" ON kudos_value_dimensions FOR SELECT USING (true);
CREATE POLICY "kudos_onboarding_own" ON kudos_onboarding_answers FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "kudos_portrait_own_read" ON kudos_inner_portrait FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "kudos_tribes_read" ON kudos_tribes FOR SELECT USING (true);
CREATE POLICY "kudos_tribe_members_read" ON kudos_tribe_members FOR SELECT USING (true);
