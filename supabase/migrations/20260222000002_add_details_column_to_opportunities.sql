-- Add details column if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'network_opportunities' AND column_name = 'details') THEN
        ALTER TABLE public.network_opportunities ADD COLUMN details TEXT;
    END IF;
END $$;

-- Force schema cache reload for PostgREST
NOTIFY pgrst, 'reload schema';
