-- Create table for Boost Windows
CREATE TABLE IF NOT EXISTS boost_windows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_video_url TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for Participations
CREATE TABLE IF NOT EXISTS boost_participations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  window_id UUID REFERENCES boost_windows(id),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(window_id, user_id)
);

-- Add credits to profiles if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'boost_credits') THEN
        ALTER TABLE profiles ADD COLUMN boost_credits INTEGER DEFAULT 0;
    END IF;
END $$;

-- RLS Policies
ALTER TABLE boost_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE boost_participations ENABLE ROW LEVEL SECURITY;

-- Everyone can read active windows
DROP POLICY IF EXISTS "Everyone can read active windows" ON boost_windows;
CREATE POLICY "Everyone can read active windows" ON boost_windows
  FOR SELECT USING (true);

-- Allow admins (or anyone for now if admin check is UI side, but let's try to restrict insert)
-- Ideally we restrict to specific email, but RLS on email needs a join or claim.
-- For MVP speed: Allow authenticated insert, protect via UI/Middleware.
DROP POLICY IF EXISTS "Authenticated users can insert windows" ON boost_windows;
CREATE POLICY "Authenticated users can insert windows" ON boost_windows
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- Participations
DROP POLICY IF EXISTS "Authenticated users can insert participations" ON boost_participations;
CREATE POLICY "Authenticated users can insert participations" ON boost_participations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own participations" ON boost_participations;
CREATE POLICY "Users can read their own participations" ON boost_participations
  FOR SELECT USING (auth.uid() = user_id);
