-- ============================================================
-- KUDOS — Saisons & Livrables de fin de saison
-- Phase 3 : Angle Mort + Avatar Hybride + Défi de Lien
-- ============================================================

-- 1. Saisons (cycles de 14 jours)
CREATE TABLE IF NOT EXISTS kudos_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES kudos_users(id) ON DELETE CASCADE,
  season_number int NOT NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  -- Stats agrégées
  kudos_received_count int DEFAULT 0,
  votes_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, season_number)
);

-- 2. Livrables générés en fin de saison
CREATE TABLE IF NOT EXISTS kudos_season_deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid REFERENCES kudos_seasons(id) ON DELETE CASCADE,
  user_id uuid REFERENCES kudos_users(id) ON DELETE CASCADE,

  -- Livrable 1 : Angle Mort (manuel d'utilisation)
  angle_mort_sans_savoir text,
  angle_mort_situations jsonb DEFAULT '[]',     -- ["situation 1", "situation 2", ...]
  angle_mort_unlocked boolean DEFAULT false,    -- premium ou parrainage de 3 amis

  -- Livrable 2 : Avatar Hybride (carte virale)
  avatar_rarity text CHECK (avatar_rarity IN ('Commun','Rare','Épique','Légendaire')),
  avatar_emoji text,
  avatar_title text,                            -- "Le Pilier Solaire"
  avatar_stats jsonb DEFAULT '[]',              -- [{label, value}]
  avatar_tagline text,
  avatar_shared_count int DEFAULT 0,            -- compte les partages (signal viral)

  -- Livrable 3 : Défi de Lien (action bienveillante)
  defi_target_user_id uuid REFERENCES kudos_users(id),
  defi_mission_text text,
  defi_completed_at timestamptz,                -- quand le user a transmis via l'IA

  generated_at timestamptz DEFAULT now(),
  UNIQUE(season_id)
);

-- 3. Blacklist mots interdits pour l'Avatar Hybride (garde-fou critique)
-- Le titre généré par l'IA ne doit JAMAIS contenir un de ces mots.
-- Si trigger violation → régénération côté Edge Function.
CREATE TABLE IF NOT EXISTS kudos_avatar_blacklist (
  word text PRIMARY KEY
);

INSERT INTO kudos_avatar_blacklist (word) VALUES
  ('tyran'), ('tyrannique'),
  ('hypocrite'), ('faux'),
  ('manipulateur'), ('manipulatrice'),
  ('toxique'),
  ('lâche'),
  ('égoïste'),
  ('arrogant'), ('arrogante'),
  ('méchant'), ('méchante'),
  ('cruel'), ('cruelle'),
  ('mauvais'), ('mauvaise'),
  ('agressif'), ('agressive'),
  ('narcissique'),
  ('pervers'), ('perverse')
ON CONFLICT DO NOTHING;

-- 4. Index
CREATE INDEX IF NOT EXISTS idx_seasons_user ON kudos_seasons(user_id, status);
CREATE INDEX IF NOT EXISTS idx_deliverables_user ON kudos_season_deliverables(user_id);

-- 5. RLS
ALTER TABLE kudos_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE kudos_season_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE kudos_avatar_blacklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kudos_seasons_own_read" ON kudos_seasons FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "kudos_deliverables_own_read" ON kudos_season_deliverables FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "kudos_blacklist_service_only" ON kudos_avatar_blacklist FOR ALL USING (false);
