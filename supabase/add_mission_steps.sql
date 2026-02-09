-- Table pour les étapes détaillées d'une mission
CREATE TABLE IF NOT EXISTS public.mission_steps (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    mission_id uuid REFERENCES public.missions(id) ON DELETE CASCADE NOT NULL,
    content text NOT NULL, -- Le contenu Markdown de l'étape
    position integer NOT NULL DEFAULT 0, -- Pour gérer l'ordre d'affichage
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.mission_steps ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Mission Steps: admin full access" ON public.mission_steps
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Members read access (via la mission parente)
CREATE POLICY "Mission Steps: members read" ON public.mission_steps
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.missions m
      JOIN public.cohort_members cm ON cm.cohort_id = m.cohort_id
      WHERE m.id = mission_steps.mission_id AND cm.user_id = auth.uid()
    )
  );
