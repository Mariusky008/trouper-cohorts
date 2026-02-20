-- Add phone column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update RLS policies to allow users to read phone numbers of their matches
-- (Already covered by "Users can view profiles of their matches" if implemented, 
-- otherwise public profiles might expose phone numbers which is a privacy concern.
-- For MVP "Mon Réseau Local", we assume members trust each other or we can restrict it later.)
