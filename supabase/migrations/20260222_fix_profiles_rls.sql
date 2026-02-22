-- Autoriser les utilisateurs à voir les profils publics de tout le monde (pour le réseautage)
-- Ou a minima, les profils de leurs matchs.
-- Pour un MVP de réseautage, il est souvent plus simple d'ouvrir la lecture des profils publics à tous les utilisateurs authentifiés.

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by users who created them." ON public.profiles;

-- Nouvelle politique permissive pour le MVP : Tout utilisateur connecté peut voir les profils
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);
