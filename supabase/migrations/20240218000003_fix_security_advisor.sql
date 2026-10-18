-- Sécurisation des tables critiques détectées par l'Advisor
-- 1. Table `public.proofs`
ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;

-- Politique existante probablement à revoir ou compléter :
-- Lecture : Tout le monde authentifié (pour voir le mur des victoires)
CREATE POLICY "Authenticated users can view proofs"
ON public.proofs FOR SELECT
TO authenticated
USING (true);

-- Écriture : Seul l'auteur peut poster
CREATE POLICY "Users can insert their own proofs"
ON public.proofs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Modification/Suppression : Seul l'auteur
CREATE POLICY "Users can modify their own proofs"
ON public.proofs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own proofs"
ON public.proofs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- 2. Table `public.admins`
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Lecture : Authentifiés uniquement (pour vérifier si admin)
CREATE POLICY "Authenticated users can read admins"
ON public.admins FOR SELECT
TO authenticated
USING (true);

-- Écriture : Interdit via l'API publique (uniquement via Service Role ou Dashboard Supabase)
-- Pas de politique INSERT/UPDATE/DELETE pour 'authenticated' ou 'anon'


-- 3. Table `public.mission_templates`
ALTER TABLE public.mission_templates ENABLE ROW LEVEL SECURITY;

-- Lecture : Tout le monde (public) pour voir le programme
CREATE POLICY "Public read access for mission templates"
ON public.mission_templates FOR SELECT
USING (true);

-- Écriture : Admins seulement
CREATE POLICY "Admins can modify mission templates"
ON public.mission_templates FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
);


-- 4. Table `public.mission_step_templates`
ALTER TABLE public.mission_step_templates ENABLE ROW LEVEL SECURITY;

-- Lecture : Tout le monde
CREATE POLICY "Public read access for step templates"
ON public.mission_step_templates FOR SELECT
USING (true);

-- Écriture : Admins seulement
CREATE POLICY "Admins can modify step templates"
ON public.mission_step_templates FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
);
