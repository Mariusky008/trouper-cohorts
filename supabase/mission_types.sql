-- Add mission_type column to missions table
ALTER TABLE public.missions 
ADD COLUMN IF NOT EXISTS mission_type text NOT NULL DEFAULT 'solo';

-- This allows distinguishing between different types of daily activities:
-- 'solo': Standard mission
-- 'duo': Partner mission
-- 'trio': Group mission
-- 'workshop': Live session
-- 'coaching': 1:1 session
-- 'quiz': Knowledge check
-- 'networking': Connect with others
