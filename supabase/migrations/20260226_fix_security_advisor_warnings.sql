-- Fix Security Advisor Issues

-- 1. Fix Function Search Path Mutable
CREATE OR REPLACE FUNCTION public.increment_points(points_to_add integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET score = score + points_to_add
  WHERE id = auth.uid();
END;
$$;

-- 2. Fix RLS Policy Always True for public.cohort_messages
DROP POLICY IF EXISTS "Enable insert for authenticated" ON public.cohort_messages;
CREATE POLICY "Enable insert for authenticated" ON public.cohort_messages
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Fix RLS Policy Always True for public.missions
-- Missions are content, so only admins should update them
DROP POLICY IF EXISTS "Enable update for authenticated" ON public.missions;
CREATE POLICY "Enable update for admins" ON public.missions
FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Fix RLS Policy Always True for public.pre_registrations
DROP POLICY IF EXISTS "Allow public registration" ON public.pre_registrations;
DROP POLICY IF EXISTS "PreRegistrations: public insert" ON public.pre_registrations;

CREATE POLICY "Allow public registration" ON public.pre_registrations
FOR INSERT TO anon, authenticated
WITH CHECK (true); 

-- 5. Fix RLS Policy Always True for public.proof_likes
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.proof_likes;

CREATE POLICY "Enable read for authenticated" ON public.proof_likes
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated" ON public.proof_likes
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users" ON public.proof_likes
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- 6. Fix RLS Policy Always True for public.proofs
DROP POLICY IF EXISTS "Enable insert for authenticated" ON public.proofs;
CREATE POLICY "Enable insert for authenticated" ON public.proofs
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
