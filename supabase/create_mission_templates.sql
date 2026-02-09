-- 1. Tables de Modèles (Templates)
CREATE TABLE IF NOT EXISTS public.mission_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    day_index int NOT NULL,
    title text NOT NULL,
    description text,
    proof_type text DEFAULT 'text', -- 'text', 'link', 'image', 'video'
    video_url text, -- Lien vers la vidéo de briefing
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(day_index) -- Un seul template par jour (J1, J2...)
);

CREATE TABLE IF NOT EXISTS public.mission_step_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    mission_template_id uuid REFERENCES public.mission_templates(id) ON DELETE CASCADE NOT NULL,
    content text NOT NULL,
    position int DEFAULT 0,
    category text DEFAULT 'intellectual' -- 'intellectual', 'creative', 'social'
);

-- RLS (Admin Only)
ALTER TABLE public.mission_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_step_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage templates" ON public.mission_templates FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can manage step templates" ON public.mission_step_templates FOR ALL TO authenticated USING (public.is_admin());


-- 2. Fonction pour cloner les templates vers une nouvelle cohorte
CREATE OR REPLACE FUNCTION public.clone_missions_to_cohort(target_cohort_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  t_mission record;
  new_mission_id uuid;
BEGIN
  -- Pour chaque jour du template
  FOR t_mission IN SELECT * FROM public.mission_templates ORDER BY day_index LOOP
    
    -- Copier la Mission (si elle n'existe pas déjà pour ce jour)
    INSERT INTO public.missions (cohort_id, day_index, title, description, proof_type, video_url)
    VALUES (
      target_cohort_id,
      t_mission.day_index,
      t_mission.title,
      t_mission.description,
      t_mission.proof_type,
      t_mission.video_url
    )
    ON CONFLICT (cohort_id, day_index) DO NOTHING -- Évite doublons si relancé
    RETURNING id INTO new_mission_id;

    -- Si l'insertion a réussi (nouvel ID), copier les étapes
    IF new_mission_id IS NOT NULL THEN
        INSERT INTO public.mission_steps (mission_id, content, position, category)
        SELECT new_mission_id, content, position, category
        FROM public.mission_step_templates
        WHERE mission_template_id = t_mission.id;
    END IF;
    
  END LOOP;
END;
$$;

-- 3. Trigger automatique à la création de cohorte
CREATE OR REPLACE FUNCTION public.on_cohort_created_copy_templates()
RETURNS TRIGGER AS $$
BEGIN
  -- Cloner les missions standards
  PERFORM public.clone_missions_to_cohort(new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_copy_missions ON public.cohorts;
CREATE TRIGGER trigger_copy_missions
  AFTER INSERT ON public.cohorts
  FOR EACH ROW EXECUTE PROCEDURE public.on_cohort_created_copy_templates();
