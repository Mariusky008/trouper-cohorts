-- Autoriser les insertions publiques (anonymes) dans la table pre_registrations
-- C'est nécessaire pour que le formulaire de landing page fonctionne pour les visiteurs non connectés.

-- 1. Activer RLS (normalement déjà fait, mais on s'assure)
ALTER TABLE public.pre_registrations ENABLE ROW LEVEL SECURITY;

-- 2. Créer une policy pour permettre l'INSERT par tout le monde (anon + authenticated)
CREATE POLICY "Allow public registration" 
ON public.pre_registrations 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- 3. (Optionnel) Permettre la lecture uniquement de ses propres données si besoin, 
-- mais pour l'instant on a juste besoin de l'INSERT.
