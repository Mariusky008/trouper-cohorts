-- Add points column to profiles table for gamification
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Create a function to increment points safely
CREATE OR REPLACE FUNCTION increment_points(user_id UUID, amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET points = points + amount
  WHERE id = user_id;
END;
$$;