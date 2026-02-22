-- Add current_goals column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_goals text[] DEFAULT '{}';
