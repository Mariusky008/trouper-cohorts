-- Create Bounties Table to track mercenary missions
CREATE TABLE IF NOT EXISTS bounties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    squad_id UUID REFERENCES squads(id),
    defector_user_id UUID REFERENCES auth.users(id), -- The one who failed (The "Defector")
    target_user_id UUID REFERENCES auth.users(id),   -- The one who needs support (The "Victim")
    mercenary_id UUID REFERENCES auth.users(id),     -- The one who does the job (The "Mercenary")
    status TEXT DEFAULT 'open', -- 'open', 'completed'
    video_url TEXT, -- The video that needs support
    reward_credits INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add Strikes to Squad Members to track repeat offenders
ALTER TABLE squad_members ADD COLUMN IF NOT EXISTS defector_strikes INT DEFAULT 0;

-- RLS Policies
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;

-- Everyone can read open bounties (to find missions)
CREATE POLICY "Everyone can see open bounties" ON bounties
    FOR SELECT USING (status = 'open');

-- Mercenaries can see their completed bounties
CREATE POLICY "Mercenaries can see their work" ON bounties
    FOR SELECT USING (mercenary_id = auth.uid());

-- Insert policy (for system/admin mostly, but we allow authenticated for the simulation trigger)
CREATE POLICY "System can create bounties" ON bounties
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Update policy (for claiming/completing)
CREATE POLICY "Mercenaries can update bounties" ON bounties
    FOR UPDATE USING (auth.role() = 'authenticated');
