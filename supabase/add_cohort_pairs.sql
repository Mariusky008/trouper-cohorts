-- Table pour gérer les binômes (paires) au sein d'une cohorte
CREATE TABLE IF NOT EXISTS public.cohort_pairs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cohort_id uuid REFERENCES public.cohorts(id) ON DELETE CASCADE NOT NULL,
    user1_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user2_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(cohort_id, user1_id), -- Un user ne peut avoir qu'un binôme par cohorte
    UNIQUE(cohort_id, user2_id)
);

-- RLS
ALTER TABLE public.cohort_pairs ENABLE ROW LEVEL SECURITY;

-- Lecture pour les membres de la paire ou admins
CREATE POLICY "Pairs are viewable by members involved" ON public.cohort_pairs
  FOR SELECT USING (
    auth.uid() = user1_id OR auth.uid() = user2_id OR public.is_admin()
  );

-- Admin peut tout gérer
CREATE POLICY "Admins can manage pairs" ON public.cohort_pairs
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
