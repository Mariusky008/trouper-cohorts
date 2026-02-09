-- Ajouter la colonne video_url à la table missions
ALTER TABLE public.missions 
ADD COLUMN IF NOT EXISTS video_url text;
