-- 1. Add program_type to cohorts
ALTER TABLE public.cohorts 
ADD COLUMN IF NOT EXISTS program_type text NOT NULL DEFAULT 'entrepreneur';

-- 1b. Add program_type to pre_registrations
ALTER TABLE public.pre_registrations 
ADD COLUMN IF NOT EXISTS program_type text NOT NULL DEFAULT 'entrepreneur';

-- 2. Add program_type to mission_templates
ALTER TABLE public.mission_templates 
ADD COLUMN IF NOT EXISTS program_type text NOT NULL DEFAULT 'entrepreneur';

-- 3. Update Unique Constraint on mission_templates
-- We need to drop the old unique constraint on day_index if it exists.
-- Since we don't know the exact name, we can try to drop it by columns or generic name.
-- Usually postgres names it table_column_key.
ALTER TABLE public.mission_templates DROP CONSTRAINT IF EXISTS mission_templates_day_index_key;

-- Add new composite unique constraint
ALTER TABLE public.mission_templates 
ADD CONSTRAINT mission_templates_day_index_program_key UNIQUE (day_index, program_type);

-- 4. Update the cloning function to respect program_type
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
        INSERT INTO public.mission_steps (mission_id, content, position, category)
        SELECT new_mission_id, content, position, category
        FROM public.mission_step_templates
        WHERE mission_template_id = t_mission.id;
    END IF;
    
  END LOOP;
END;
$$;
