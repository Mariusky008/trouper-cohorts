-- Add mission objective columns to network_matches
-- This allows storing the mission type chosen by each user for the daily match

ALTER TABLE public.network_matches
ADD COLUMN IF NOT EXISTS user1_mission TEXT, -- 'portier', 'amplificateur', etc.
ADD COLUMN IF NOT EXISTS user2_mission TEXT; -- 'portier', 'amplificateur', etc.

-- Force schema cache reload for PostgREST
NOTIFY pgrst, 'reload schema';
