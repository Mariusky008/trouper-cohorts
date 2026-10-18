-- Add training_choice column to pre_registrations
ALTER TABLE public.pre_registrations 
ADD COLUMN IF NOT EXISTS training_choice text;
