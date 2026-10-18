-- Fix Trust Score System & Triggers
BEGIN;

-- 1. Ensure trust_scores table exists with correct schema
CREATE TABLE IF NOT EXISTS public.trust_scores (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    score NUMERIC(3, 1) DEFAULT 5.0 NOT NULL,
    opportunities_given INTEGER DEFAULT 0 NOT NULL,
    opportunities_received INTEGER DEFAULT 0 NOT NULL,
    debt_level INTEGER DEFAULT 0 NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY;

-- 3. Ensure RLS policies exist
DO $$
BEGIN
    DROP POLICY IF EXISTS "Trust scores are public (read-only)" ON public.trust_scores;
    CREATE POLICY "Trust scores are public (read-only)" ON public.trust_scores FOR SELECT USING (true);
END $$;

-- 4. Re-create helper function ensure_trust_score
CREATE OR REPLACE FUNCTION public.ensure_trust_score(uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.trust_scores (user_id) VALUES (uid)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- 5. Re-create trigger function handle_opportunity_validation
CREATE OR REPLACE FUNCTION public.handle_opportunity_validation()
RETURNS trigger AS $$
BEGIN
  -- Only run logic if status changed to 'validated'
  IF new.status = 'validated' AND (old.status IS DISTINCT FROM 'validated') THEN
    
    -- Ensure trust scores exist for both users
    PERFORM public.ensure_trust_score(new.giver_id);
    PERFORM public.ensure_trust_score(new.receiver_id);

    -- Increment given count for giver
    UPDATE public.trust_scores
    SET opportunities_given = opportunities_given + 1,
        last_updated = timezone('utc'::text, now())
    WHERE user_id = new.giver_id;
    
    -- Increment received count for receiver
    UPDATE public.trust_scores
    SET opportunities_received = opportunities_received + 1,
        last_updated = timezone('utc'::text, now())
    WHERE user_id = new.receiver_id;
    
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Re-create Trigger
DROP TRIGGER IF EXISTS on_opportunity_validated ON public.network_opportunities;
CREATE TRIGGER on_opportunity_validated
  AFTER UPDATE ON public.network_opportunities
  FOR EACH ROW EXECUTE PROCEDURE public.handle_opportunity_validation();

COMMIT;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
