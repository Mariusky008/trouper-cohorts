-- Add wave points system for V4 Gamification
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS wave_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS wave_ready BOOLEAN DEFAULT FALSE;

-- Create an index for faster scheduling query
CREATE INDEX IF NOT EXISTS idx_profiles_wave_ready ON profiles(wave_ready);
