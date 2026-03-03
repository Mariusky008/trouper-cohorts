-- Create Spheres table
CREATE TABLE IF NOT EXISTS public.spheres (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color_theme TEXT NOT NULL,
    launch_threshold INTEGER DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Slots table
CREATE TABLE IF NOT EXISTS public.sphere_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sphere_id TEXT REFERENCES public.spheres(id) ON DELETE CASCADE,
    job_name TEXT NOT NULL,
    status TEXT CHECK (status IN ('AVAILABLE', 'LOCKED', 'PENDING')) DEFAULT 'AVAILABLE',
    member_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    locked_at TIMESTAMP WITH TIME ZONE, -- For temporary PENDING lock
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.spheres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sphere_slots ENABLE ROW LEVEL SECURITY;

-- Policies for Spheres (Public Read)
CREATE POLICY "Spheres are viewable by everyone" ON public.spheres
    FOR SELECT USING (true);

-- Policies for Slots (Public Read, Authenticated Update)
CREATE POLICY "Slots are viewable by everyone" ON public.sphere_slots
    FOR SELECT USING (true);

CREATE POLICY "Slots can be updated by authenticated users" ON public.sphere_slots
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Seed Spheres
INSERT INTO public.spheres (id, name, color_theme, launch_threshold) VALUES
('habitat', 'Habitat & Patrimoine', 'emerald', 20),
('digital', 'Business & Digital', 'indigo', 20),
('sante', 'Santé & Bien-être', 'rose', 20),
('commerce', 'Commerce & Local', 'amber', 20),
('conseil', 'Conseil & Droit', 'slate', 20)
ON CONFLICT (id) DO NOTHING;

-- Seed Slots (Sample for Habitat - usually would be a huge insert, doing partial here for demo)
-- SPHÈRE 1 : HABITAT & PATRIMOINE
INSERT INTO public.sphere_slots (sphere_id, job_name) VALUES
('habitat', 'Agent Immobilier'), ('habitat', 'Courtier en prêt'), ('habitat', 'Gestionnaire de patrimoine'),
('habitat', 'Diagnostiqueur'), ('habitat', 'Architecte d''intérieur'), ('habitat', 'Maître d''œuvre'),
('habitat', 'Cuisiniste'), ('habitat', 'Électricien/Domotique'), ('habitat', 'Paysagiste'),
('habitat', 'Pisciniste'), ('habitat', 'Notaire'), ('habitat', 'Déménageur'),
('habitat', 'Conciergerie Airbnb'), ('habitat', 'Photographe Immo'), ('habitat', 'Chasseur Immo'),
('habitat', 'Avocat Fiscaliste'), ('habitat', 'Assureur Habitation'), ('habitat', 'Menuisier'),
('habitat', 'Expert Panneaux Solaires'), ('habitat', 'Home Stager');

-- SPHÈRE 2 : BUSINESS & DIGITAL
INSERT INTO public.sphere_slots (sphere_id, job_name) VALUES
('digital', 'Webdesigner'), ('digital', 'Expert SEO'), ('digital', 'Copywriter'),
('digital', 'Community Manager'), ('digital', 'Vidéaste Corporate'), ('digital', 'Agence Ads'),
('digital', 'Expert Tunnel de Vente'), ('digital', 'Coach Business'), ('digital', 'Expert Comptable'),
('digital', 'Recruteur'), ('digital', 'Consultant RH'), ('digital', 'Développeur Web'),
('digital', 'Expert Cybersécurité'), ('digital', 'Graphiste'), ('digital', 'Imprimeur'),
('digital', 'Consultant CRM'), ('digital', 'Expert No-Code'), ('digital', 'Commercial Freelance'),
('digital', 'Growth Hacker'), ('digital', 'Community Builder');

-- SPHÈRE 3 : SANTÉ & BIEN-ÊTRE
INSERT INTO public.sphere_slots (sphere_id, job_name) VALUES
('sante', 'Coach Sportif'), ('sante', 'Nutritionniste'), ('sante', 'Ostéopathe'),
('sante', 'Prof de Yoga'), ('sante', 'Naturopathe'), ('sante', 'Magasin Bio'),
('sante', 'Coiffeur'), ('sante', 'Esthéticienne'), ('sante', 'Sophrologue'),
('sante', 'Psychologue'), ('sante', 'Wedding Planner'), ('sante', 'Traiteur'),
('sante', 'Photographe Famille'), ('sante', 'Coach de Vie'), ('sante', 'Hypnothérapeute'),
('sante', 'Masseuse Bien-être'), ('sante', 'Kinésiologue'), ('sante', 'Acupuncteur'),
('sante', 'Personal Shopper'), ('sante', 'Éducateur Canin');

-- SPHÈRE 4 : COMMERCE & LOCAL
INSERT INTO public.sphere_slots (sphere_id, job_name) VALUES
('commerce', 'Restaurateur'), ('commerce', 'Caviste'), ('commerce', 'Gérant Salle de Sport'),
('commerce', 'Fleuriste'), ('commerce', 'Chocolatier'), ('commerce', 'Gérant de Gîte'),
('commerce', 'Bijoutier'), ('commerce', 'Opticien'), ('commerce', 'Libraire'),
('commerce', 'Gérant Coworking'), ('commerce', 'Prêt-à-porter'), ('commerce', 'Loueur de Voitures'),
('commerce', 'Assureur Pro'), ('commerce', 'Événementiel Local'), ('commerce', 'Agent de Voyage'),
('commerce', 'Courtier Énergie'), ('commerce', 'Enseigniste'), ('commerce', 'Service Nettoyage'),
('commerce', 'Torréfacteur'), ('commerce', 'Coach Prise de Parole');

-- SPHÈRE 5 : CONSEIL & DROIT
INSERT INTO public.sphere_slots (sphere_id, job_name) VALUES
('conseil', 'Avocat Affaires'), ('conseil', 'Avocat Droit du Travail'), ('conseil', 'Conseil Propriété Intellectuelle'),
('conseil', 'Courtier Crédit Pro'), ('conseil', 'Consultant RSE'), ('conseil', 'Traducteur Business'),
('conseil', 'Expert Levée de Fonds'), ('conseil', 'Audit Cybersécurité'), ('conseil', 'Commissaire aux comptes'),
('conseil', 'Gestion de crise'), ('conseil', 'Courtier Flotte Auto'), ('conseil', 'Immo Entreprise'),
('conseil', 'Formateur Qualiopi'), ('conseil', 'Consultant Logistique'), ('conseil', 'Graphologue'),
('conseil', 'Huissier'), ('conseil', 'Médiateur'), ('conseil', 'Expert Transmission Entreprise'),
('conseil', 'Consultant IA'), ('conseil', 'Agent d''Artistes/Sportifs');
