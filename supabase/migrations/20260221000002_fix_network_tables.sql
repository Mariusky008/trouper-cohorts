-- Create table for availability if it doesn't exist
CREATE TABLE IF NOT EXISTS public.network_availabilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    slots TEXT[] NOT NULL, -- Array of slots e.g., ['09-11', '14-16']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT unique_daily_availability UNIQUE (user_id, date)
);

-- Enable RLS
ALTER TABLE public.network_availabilities ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own availability" ON public.network_availabilities
    FOR ALL USING (auth.uid() = user_id);

-- Add missing columns to network_matches
ALTER TABLE public.network_matches 
ADD COLUMN IF NOT EXISTS time TEXT,
ADD COLUMN IF NOT EXISTS meeting_url TEXT,
ADD COLUMN IF NOT EXISTS topic TEXT;
