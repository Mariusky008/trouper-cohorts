-- Table pour stocker les binômes journaliers
CREATE TABLE public.cohort_pairs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    cohort_id uuid NOT NULL, -- Lien vers la cohorte (à créer si pas encore fait, sinon on fera sans pour l'instant)
    day_number integer NOT NULL, -- Jour 1 à 14
    user1_id uuid NOT NULL REFERENCES auth.users(id),
    user2_id uuid NOT NULL REFERENCES auth.users(id),
    
    -- Contrainte pour éviter qu'une personne ait 2 binômes le même jour
    UNIQUE(cohort_id, day_number, user1_id),
    UNIQUE(cohort_id, day_number, user2_id)
);

-- Index pour recherche rapide
CREATE INDEX idx_cohort_pairs_user1 ON public.cohort_pairs(user1_id);
CREATE INDEX idx_cohort_pairs_user2 ON public.cohort_pairs(user2_id);
CREATE INDEX idx_cohort_pairs_day ON public.cohort_pairs(day_number);

-- Table pour la messagerie interne
CREATE TABLE public.direct_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    sender_id uuid NOT NULL REFERENCES auth.users(id),
    receiver_id uuid NOT NULL REFERENCES auth.users(id),
    content text NOT NULL,
    is_read boolean DEFAULT false,
    
    -- Lien optionnel vers le pairing (pour savoir dans quel contexte c'était)
    pairing_id uuid REFERENCES public.cohort_pairs(id)
);

CREATE INDEX idx_messages_sender ON public.direct_messages(sender_id);
CREATE INDEX idx_messages_receiver ON public.direct_messages(receiver_id);

-- Policies (RLS) pour la sécurité

ALTER TABLE public.cohort_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir ses propres paires
CREATE POLICY "Users can view their own pairs" ON public.cohort_pairs
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Les messages : on ne voit que ceux qu'on envoie ou reçoit
CREATE POLICY "Users can view their own messages" ON public.direct_messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.direct_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);
