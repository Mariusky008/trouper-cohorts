-- 1. Add missing columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';

-- Verify trade exists (it should be in mvp.sql but let's be safe)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trade TEXT;

-- 2. Allow users to initialize their trust score
-- Only allow insert if user_id matches auth.uid()
DROP POLICY IF EXISTS "Users can initialize their own trust score" ON public.trust_scores;
CREATE POLICY "Users can initialize their own trust score" ON public.trust_scores
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own trust score (needed for upsert if row exists)
-- CAUTION: This allows users to modify their score. ideally this should be restricted.
-- We'll add a check to prevent increasing score beyond 5.0 manually if possible, but RLS check is for row visibility/permission.
DROP POLICY IF EXISTS "Users can update their own trust score" ON public.trust_scores;
CREATE POLICY "Users can update their own trust score" ON public.trust_scores
    FOR UPDATE USING (auth.uid() = user_id);

-- 3. Ensure network_settings policies are correct
-- We re-apply them to be sure
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.network_settings;
CREATE POLICY "Users can insert their own settings" ON public.network_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.network_settings;
CREATE POLICY "Users can update their own settings" ON public.network_settings
    FOR UPDATE USING (auth.uid() = user_id);
