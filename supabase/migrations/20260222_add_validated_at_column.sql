-- Add validated_at column if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'network_opportunities' AND column_name = 'validated_at') THEN
        ALTER TABLE public.network_opportunities ADD COLUMN validated_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
