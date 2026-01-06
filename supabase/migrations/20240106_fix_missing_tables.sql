-- Migration pour créer les tables manquantes (Fix 406 Errors)

-- 1. Table des Binômes (Buddy System)
CREATE TABLE IF NOT EXISTS buddy_pairs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID NOT NULL REFERENCES auth.users(id),
    user2_id UUID NOT NULL REFERENCES auth.users(id),
    status TEXT DEFAULT 'active', -- active, dissolved
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ -- Optionnel: fin du binôme
);

CREATE INDEX IF NOT EXISTS idx_buddy_user1 ON buddy_pairs(user1_id);
CREATE INDEX IF NOT EXISTS idx_buddy_user2 ON buddy_pairs(user2_id);

-- 2. Table des Fenêtres de Boost (Boost Windows)
CREATE TABLE IF NOT EXISTS boost_windows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    squad_id UUID REFERENCES squads(id),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    multiplier FLOAT DEFAULT 1.0, -- x1.5, x2 points
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boost_time ON boost_windows(starts_at, ends_at);

-- 3. Sécurité (RLS) - Permettre la lecture à tout le monde pour éviter les erreurs
ALTER TABLE buddy_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE boost_windows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut lire les binômes" ON buddy_pairs FOR SELECT USING (true);
CREATE POLICY "Tout le monde peut lire les boosts" ON boost_windows FOR SELECT USING (true);
