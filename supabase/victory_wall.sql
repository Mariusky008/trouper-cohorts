-- Table pour le Mur des Victoires (Partage de liens)
CREATE TABLE public.victory_posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    cohort_id uuid NOT NULL, -- Pour filtrer par cohorte
    day_number integer NOT NULL, -- Pour savoir à quel jour ça correspond
    
    link_url text NOT NULL, -- Lien LinkedIn, TikTok, etc.
    description text, -- Petit commentaire optionnel ("Voici mon post sur...")
    
    likes_count integer DEFAULT 0
);

-- Table pour les likes/claps sur les victoires
CREATE TABLE public.victory_likes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    post_id uuid NOT NULL REFERENCES public.victory_posts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    
    UNIQUE(post_id, user_id) -- Un seul like par personne par post
);

-- RLS
ALTER TABLE public.victory_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.victory_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view posts" ON public.victory_posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON public.victory_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can view likes" ON public.victory_likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON public.victory_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
