-- Table pour stocker les rapports quotidiens d'activation réseau par binôme
CREATE TABLE IF NOT EXISTS public.buddy_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    
    -- Qui fait le rapport (le binôme témoin)
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Qui est le bénéficiaire (celui qui a agi)
    target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Cohorte associée (pour le classement)
    cohort_id UUID REFERENCES public.cohorts(id) ON DELETE SET NULL,
    
    -- Métriques déclarées
    messages_sent INTEGER DEFAULT 0, -- 1 point
    interactions_received INTEGER DEFAULT 0, -- 2 points
    appointments_booked INTEGER DEFAULT 0, -- 10 points
    
    -- Score total calculé pour ce rapport
    score INTEGER DEFAULT 0,
    
    -- Commentaire optionnel du binôme
    comment TEXT,

    -- Un seul rapport par binôme par jour pour une cible donnée
    UNIQUE(date, reporter_id, target_user_id)
);

-- Politiques de sécurité (RLS)
ALTER TABLE public.buddy_reports ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les rapports (transparence)
CREATE POLICY "Public read access"
ON public.buddy_reports FOR SELECT
USING (true);

-- Seuls les utilisateurs authentifiés peuvent créer des rapports
CREATE POLICY "Authenticated users can insert reports"
ON public.buddy_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- Seul l'auteur peut modifier son rapport (le jour même par exemple)
CREATE POLICY "Users can update their own reports"
ON public.buddy_reports FOR UPDATE
TO authenticated
USING (auth.uid() = reporter_id);
