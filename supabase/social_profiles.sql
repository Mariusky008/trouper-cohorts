-- Add social fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS instagram_handle text,
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Allow users to update their own profile (already covered by existing policy but ensuring fields are writable)
-- The existing policy "Profiles: update own row" covers all columns.
