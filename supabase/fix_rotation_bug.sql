CREATE OR REPLACE FUNCTION public.rotate_daily_pairs(target_cohort_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  member_ids uuid[];
  shuffled_ids uuid[];
  i int;
  count int;
BEGIN
  -- Récupérer tous les membres actifs
  SELECT array_agg(user_id) INTO member_ids
  FROM public.cohort_members
  WHERE cohort_id = target_cohort_id;

  -- Vérification robuste : Si NULL ou moins de 2 membres, on arrête
  IF member_ids IS NULL OR array_length(member_ids, 1) < 2 THEN
    RAISE NOTICE 'Pas assez de membres pour générer des paires.';
    RETURN;
  END IF;

  -- Mélanger
  SELECT array_agg(elem ORDER BY random()) INTO shuffled_ids
  FROM unnest(member_ids) AS elem;

  count := array_length(shuffled_ids, 1);
  
  -- Créer les paires
  FOR i IN 1 .. (count / 2) LOOP
    INSERT INTO public.cohort_pairs (cohort_id, user1_id, user2_id, pair_date)
    VALUES (
      target_cohort_id,
      shuffled_ids[2*i - 1],
      shuffled_ids[2*i],
      CURRENT_DATE
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;
