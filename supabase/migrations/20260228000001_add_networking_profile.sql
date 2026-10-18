-- Add structured networking profile columns to pre_registrations and profiles tables

-- 1. Update pre_registrations table
ALTER TABLE pre_registrations 
ADD COLUMN IF NOT EXISTS give_profile JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS receive_profile JSONB DEFAULT '{}'::jsonb;

-- 2. Update profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS give_profile JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS receive_profile JSONB DEFAULT '{}'::jsonb;

-- 3. Comment describing the structure
COMMENT ON COLUMN profiles.give_profile IS 'Structured data about what the user can give: influence_sectors, clubs, social_network';
COMMENT ON COLUMN profiles.receive_profile IS 'Structured data about what the user wants to receive: target_companies, prescribers, target_clubs, comm_goal';
