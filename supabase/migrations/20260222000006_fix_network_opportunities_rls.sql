-- Reset and fix RLS policies for network_opportunities
BEGIN;

-- Drop existing policies to remove any conflicts or misconfigurations
DROP POLICY IF EXISTS "Users can view opportunities they are involved in" ON public.network_opportunities;
DROP POLICY IF EXISTS "Users can create opportunities as giver" ON public.network_opportunities;
DROP POLICY IF EXISTS "Receiver can update status (validate/reject)" ON public.network_opportunities;
DROP POLICY IF EXISTS "Users can view opportunities" ON public.network_opportunities;
DROP POLICY IF EXISTS "Users can create opportunities" ON public.network_opportunities;
DROP POLICY IF EXISTS "Receiver can update status" ON public.network_opportunities;

-- Ensure RLS is enabled
ALTER TABLE public.network_opportunities ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Users can see opportunities where they are the giver or the receiver
CREATE POLICY "Users can view opportunities" ON public.network_opportunities
    FOR SELECT
    USING (auth.uid() = giver_id OR auth.uid() = receiver_id);

-- 2. INSERT: Users can create opportunities only if they are the giver
CREATE POLICY "Users can create opportunities" ON public.network_opportunities
    FOR INSERT
    WITH CHECK (auth.uid() = giver_id);

-- 3. UPDATE: Receivers can update status, Givers can update if needed (e.g. details correction before validation)
CREATE POLICY "Users can update opportunities" ON public.network_opportunities
    FOR UPDATE
    USING (
        (auth.uid() = receiver_id) -- Receiver can update (for status)
        OR 
        (auth.uid() = giver_id AND status = 'pending') -- Giver can update only if pending
    );

COMMIT;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
