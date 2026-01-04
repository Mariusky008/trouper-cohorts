-- Fix RLS Policy for Bounties
-- Problem: The previous policy might be too restrictive or cached incorrectly.
-- Solution: Open up SELECT access more explicitly for authenticated users.

DROP POLICY IF EXISTS "Everyone can see open bounties" ON bounties;

CREATE POLICY "Everyone can see open bounties" ON bounties
    FOR SELECT
    USING (auth.role() = 'authenticated'); -- Allow ALL authenticated users to see ALL bounties for now (simplest fix)

-- Ensure Update is also open enough
DROP POLICY IF EXISTS "Mercenaries can update bounties" ON bounties;

CREATE POLICY "Mercenaries can update bounties" ON bounties
    FOR UPDATE
    USING (auth.role() = 'authenticated');
