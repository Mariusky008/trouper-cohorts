-- Add frequency and control settings to network_settings
ALTER TABLE public.network_settings 
ADD COLUMN IF NOT EXISTS frequency_per_week INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS preferred_days TEXT[] DEFAULT ARRAY['mon', 'tue', 'wed', 'thu', 'fri'],
ADD COLUMN IF NOT EXISTS preferred_slots TEXT[] DEFAULT ARRAY['09-11', '14-16'],
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'; -- 'active', 'pause', 'vacation'

-- Constraint to ensure valid status
ALTER TABLE public.network_settings 
ADD CONSTRAINT valid_network_status CHECK (status IN ('active', 'pause', 'vacation'));
