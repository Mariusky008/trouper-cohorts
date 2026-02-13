-- 1. Ajouter la colonne title manquante à mission_steps
ALTER TABLE public.mission_steps
ADD COLUMN IF NOT EXISTS title text;

-- 2. Ajouter la colonne title manquante à mission_step_templates si nécessaire
ALTER TABLE public.mission_step_templates
ADD COLUMN IF NOT EXISTS title text;

-- 3. Mettre à jour la fonction de clonage pour inclure le titre
CREATE OR REPLACE FUNCTION public.clone_missions_to_cohort(target_cohort_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  t_mission record;
  new_mission_id uuid;
  target_program_type text;
BEGIN
  -- Get the program_type of the target cohort
  SELECT program_type INTO target_program_type FROM public.cohorts WHERE id = target_cohort_id;

  -- Pour chaque jour du template CORRESPONDANT au programme
  FOR t_mission IN 
    SELECT * FROM public.mission_templates 
    WHERE program_type = target_program_type 
    ORDER BY day_index 
  LOOP
    
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
    ON CONFLICT (cohort_id, day_index) DO NOTHING
    RETURNING id INTO new_mission_id;

    -- Si l'insertion a réussi (nouvel ID), copier les étapes
    IF new_mission_id IS NOT NULL THEN
        INSERT INTO public.mission_steps (mission_id, content, position, category, title)
        SELECT new_mission_id, content, position, category, title
        FROM public.mission_step_templates
        WHERE mission_template_id = t_mission.id;
    END IF;
    
  END LOOP;
END;
$$;
