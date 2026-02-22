-- Comprehensive fix for missing network columns

DO $$
BEGIN
    -- 1. Fix 'network_opportunities' table
    
    -- Check and add 'points'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'network_opportunities' AND column_name = 'points') THEN
        ALTER TABLE public.network_opportunities ADD COLUMN points INTEGER DEFAULT 0 NOT NULL;
    END IF;

    -- Check and add 'details'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'network_opportunities' AND column_name = 'details') THEN
        ALTER TABLE public.network_opportunities ADD COLUMN details TEXT;
    END IF;

    -- Check and add 'type'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'network_opportunities' AND column_name = 'type') THEN
        ALTER TABLE public.network_opportunities ADD COLUMN type TEXT DEFAULT 'network' NOT NULL;
    END IF;
    
    -- Check and add 'status'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'network_opportunities' AND column_name = 'status') THEN
        ALTER TABLE public.network_opportunities ADD COLUMN status TEXT DEFAULT 'pending' NOT NULL;
    END IF;

    -- 2. Fix 'profiles' table
    
    -- Check and add 'current_goals'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'current_goals') THEN
        ALTER TABLE public.profiles ADD COLUMN current_goals TEXT[] DEFAULT '{}';
    END IF;

END $$;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
