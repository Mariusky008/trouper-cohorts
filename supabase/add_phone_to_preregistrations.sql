-- Ajouter la colonne phone à la table pre_registrations
ALTER TABLE public.pre_registrations 
ADD COLUMN IF NOT EXISTS phone text;
