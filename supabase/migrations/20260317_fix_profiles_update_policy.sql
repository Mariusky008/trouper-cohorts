-- Fix RLS policy to allow users to update their own profile
-- This was likely missing or removed in a previous migration

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );
