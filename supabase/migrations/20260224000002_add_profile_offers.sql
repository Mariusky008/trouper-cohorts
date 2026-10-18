-- Add offer fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS offer_title TEXT,
ADD COLUMN IF NOT EXISTS offer_description TEXT,
ADD COLUMN IF NOT EXISTS offer_price NUMERIC,
ADD COLUMN IF NOT EXISTS offer_original_price NUMERIC,
ADD COLUMN IF NOT EXISTS offer_active BOOLEAN DEFAULT false;
