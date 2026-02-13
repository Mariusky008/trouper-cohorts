-- Script de réparation : Remplir les étapes manquantes pour les missions existantes
-- Cela corrige le problème où les missions ont été créées mais pas leurs étapes (à cause du bug de colonne manquante)

DO $$
DECLARE
  mission_record RECORD;
  template_id uuid;
  cohort_program_type text;
BEGIN
  -- Pour chaque mission qui n'a AUCUNE étape
  FOR mission_record IN 
    SELECT m.id, m.day_index, m.cohort_id
    FROM public.missions m
    LEFT JOIN public.mission_steps ms ON m.id = ms.mission_id
    WHERE ms.id IS NULL
  LOOP
    
    -- Récupérer le type de programme de la cohorte liée
    SELECT program_type INTO cohort_program_type 
    FROM public.cohorts 
    WHERE id = mission_record.cohort_id;

    -- Trouver le template correspondant (Même jour, même programme)
    SELECT id INTO template_id
    FROM public.mission_templates
    WHERE day_index = mission_record.day_index
    AND program_type = cohort_program_type;

    -- Si un template existe, copier ses étapes
    IF template_id IS NOT NULL THEN
      INSERT INTO public.mission_steps (mission_id, content, position, category, title)
      SELECT mission_record.id, content, position, category, title
      FROM public.mission_step_templates
      WHERE mission_template_id = template_id;
      
      RAISE NOTICE 'Étapes restaurées pour la mission % (Jour %)', mission_record.id, mission_record.day_index;
    END IF;

  END LOOP;
END;
$$;
