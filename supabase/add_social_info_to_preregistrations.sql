-- 1. Mettre à jour la table pre_registrations
ALTER TABLE public.pre_registrations 
ADD COLUMN IF NOT EXISTS social_network text,
ADD COLUMN IF NOT EXISTS followers_count text,
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS selected_session_date text;

-- 2. Créer une table pour gérer les sessions publiques affichées sur la landing page
CREATE TABLE IF NOT EXISTS public.public_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    label text NOT NULL, -- ex: "10 au 24 Mars 2026"
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS pour public_sessions
ALTER TABLE public.public_sessions ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire (pour l'afficher sur la home)
CREATE POLICY "Public sessions are viewable by everyone" ON public.public_sessions
  FOR SELECT USING (true);

-- Seul l'admin peut modifier
CREATE POLICY "Admin can manage public sessions" ON public.public_sessions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Insérer une donnée de démo si vide
INSERT INTO public.public_sessions (label) 
SELECT '10 au 24 Mars 2026'
WHERE NOT EXISTS (SELECT 1 FROM public.public_sessions);
