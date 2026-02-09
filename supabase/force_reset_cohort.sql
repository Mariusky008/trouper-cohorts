CREATE OR REPLACE FUNCTION public.force_reset_cohort_missions(target_cohort_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- 1. Supprimer TOUTES les missions et étapes de cette cohorte
  DELETE FROM public.missions WHERE cohort_id = target_cohort_id;
  
  -- 2. Recréer les missions depuis les templates frais
  PERFORM public.clone_missions_to_cohort(target_cohort_id);
END;
$$;
