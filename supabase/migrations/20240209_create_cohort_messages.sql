CREATE TABLE IF NOT EXISTS public.cohort_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cohort_id uuid REFERENCES public.cohorts(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Sécurité (RLS)
ALTER TABLE public.cohort_messages ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : Un membre peut lire les messages de SA cohorte
CREATE POLICY "Members can view messages from their cohort"
ON public.cohort_messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.cohort_members
        WHERE cohort_members.cohort_id = cohort_messages.cohort_id
        AND cohort_members.user_id = auth.uid()
    )
);

-- Politique d'écriture : Un membre peut poster dans SA cohorte
CREATE POLICY "Members can post messages to their cohort"
ON public.cohort_messages
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.cohort_members
        WHERE cohort_members.cohort_id = cohort_messages.cohort_id
        AND cohort_members.user_id = auth.uid()
    )
);

-- Index pour la performance
CREATE INDEX idx_cohort_messages_cohort_id ON public.cohort_messages(cohort_id);
CREATE INDEX idx_cohort_messages_created_at ON public.cohort_messages(created_at DESC);

-- Autoriser la lecture des profils publics (Prénom/Nom) pour le chat
-- (Si la politique n'existe pas déjà)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pre_registrations' 
        AND policyname = 'Authenticated users can read basic profile info'
    ) THEN
        CREATE POLICY "Authenticated users can read basic profile info"
        ON public.pre_registrations
        FOR SELECT
        USING (auth.role() = 'authenticated');
    END IF;
END
$$;
