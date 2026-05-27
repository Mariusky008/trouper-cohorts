-- ============================================================
-- KUDOS — Tribu : chat + cafés partenaires
-- Phase 4 complète : algo composition + chat + opt-in
-- ============================================================

-- 1. Messages de la tribu (chat de groupe une fois scellée)
CREATE TABLE IF NOT EXISTS kudos_tribe_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tribe_id uuid REFERENCES kudos_tribes(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES kudos_users(id) ON DELETE CASCADE,
  text text NOT NULL CHECK (length(text) > 0 AND length(text) <= 2000),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tribe_messages_tribe ON kudos_tribe_messages(tribe_id, created_at DESC);

-- 2. Cafés partenaires (lieux physiques où les tribus se rencontrent)
-- Voir Partie 5.6 du doc : passerelle digital → réel via Popey & co.
CREATE TABLE IF NOT EXISTS kudos_partner_cafes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  address text,
  perk text,                   -- ex: "1er café offert à toute tribu scellée"
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_cafes_city ON kudos_partner_cafes(city) WHERE is_active = true;

-- Seed initial — Popey à Dax
INSERT INTO kudos_partner_cafes (name, city, address, perk) VALUES
  ('Café Popey', 'Dax', 'Dax centre', '1er café offert')
ON CONFLICT DO NOTHING;

-- 3. RLS — un membre de tribu lit/écrit dans le chat de SA tribu uniquement
ALTER TABLE kudos_tribe_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE kudos_partner_cafes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kudos_tribe_msg_read" ON kudos_tribe_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM kudos_tribe_members tm
      WHERE tm.tribe_id = kudos_tribe_messages.tribe_id
        AND tm.user_id::text = auth.uid()::text
        AND tm.status = 'accepted'
    )
  );

CREATE POLICY "kudos_tribe_msg_send" ON kudos_tribe_messages
  FOR INSERT WITH CHECK (
    sender_id::text = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM kudos_tribe_members tm
      WHERE tm.tribe_id = kudos_tribe_messages.tribe_id
        AND tm.user_id::text = auth.uid()::text
        AND tm.status = 'accepted'
    )
  );

CREATE POLICY "kudos_partner_cafes_read" ON kudos_partner_cafes FOR SELECT USING (is_active = true);
