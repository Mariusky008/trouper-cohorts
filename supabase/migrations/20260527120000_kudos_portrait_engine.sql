-- ============================================================
-- KUDOS — Moteur de portrait évolutif
-- Phase 2 : miroir extérieur (perceived) + delta
-- (Le miroir intérieur kudos_inner_portrait existe déjà)
-- ============================================================

-- 1. Miroir extérieur — comment les autres perçoivent l'user
CREATE TABLE IF NOT EXISTS kudos_perceived_portrait (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES kudos_users(id) ON DELETE CASCADE UNIQUE,
  dimensions jsonb DEFAULT '{}',          -- { slug: score 0..1 }
  confidence jsonb DEFAULT '{}',          -- { slug: 0..1 } -- niveau de certitude (#contributeurs)
  attribution_counts jsonb DEFAULT '{}',  -- { slug: int } -- combien de personnes ont signalé cette dim
  top_badges jsonb DEFAULT '[]',          -- [{ emoji, name, count }]
  by_circle jsonb DEFAULT '{}',           -- { 'coloc': {...}, 'collegue': {...}, 'ami': {...} }
  contributor_count int DEFAULT 0,
  last_computed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- 2. Delta — la divergence entre les deux miroirs
CREATE TABLE IF NOT EXISTS kudos_portrait_delta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES kudos_users(id) ON DELETE CASCADE UNIQUE,
  tension text CHECK (tension IN ('converge','diverge','unknown')) DEFAULT 'unknown',
  gap_score numeric(4,1),                 -- 0 = convergence, 100 = divergence totale
  blindspots jsonb DEFAULT '[]',          -- [{ dimension, externalScore, internalScore, divergence, attributionCount }]
  hidden_garden jsonb DEFAULT '[]',       -- [{ dimension, internalScore, ... }] -- traits que l'user valorise mais que les autres n'ont pas captés
  strongest_blindspot jsonb,              -- celui qui alimente le livrable "Angle Mort"
  computed_for_kudos_count int DEFAULT 0, -- nombre de kudos pris en compte lors du calcul
  last_computed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- 3. Index
CREATE INDEX IF NOT EXISTS idx_perceived_user ON kudos_perceived_portrait(user_id);
CREATE INDEX IF NOT EXISTS idx_delta_user ON kudos_portrait_delta(user_id);

-- 4. RLS
ALTER TABLE kudos_perceived_portrait ENABLE ROW LEVEL SECURITY;
ALTER TABLE kudos_portrait_delta ENABLE ROW LEVEL SECURITY;

-- L'user lit son propre miroir extérieur + delta
CREATE POLICY "kudos_perceived_own_read" ON kudos_perceived_portrait FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "kudos_delta_own_read"     ON kudos_portrait_delta     FOR SELECT USING (auth.uid()::text = user_id::text);
