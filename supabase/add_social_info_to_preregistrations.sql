-- Ajouter les infos réseaux sociaux aux pré-inscriptions
ALTER TABLE public.pre_registrations 
ADD COLUMN IF NOT EXISTS social_network text,
ADD COLUMN IF NOT EXISTS followers_count text;
