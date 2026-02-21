-- Add display_name column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Ensure other columns exist just in case
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS trade TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';

-- Create a function to backfill display_name from auth.users metadata
-- This is useful to run once to fix existing users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id, raw_user_meta_data FROM auth.users LOOP
        -- Update profile if display_name is null
        UPDATE public.profiles
        SET display_name = user_record.raw_user_meta_data->>'full_name'
        WHERE id = user_record.id AND (display_name IS NULL OR display_name = '');
        
        -- If profile doesn't exist, insert it (safe guard)
        INSERT INTO public.profiles (id, email, display_name, role)
        VALUES (
            user_record.id, 
            (SELECT email FROM auth.users WHERE id = user_record.id),
            user_record.raw_user_meta_data->>'full_name',
            'member'
        )
        ON CONFLICT (id) DO NOTHING;
    END LOOP;
END $$;
