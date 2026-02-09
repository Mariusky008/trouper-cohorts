-- Ajouter la date pour permettre l'historique et la rotation quotidienne
ALTER TABLE public.cohort_pairs 
ADD COLUMN IF NOT EXISTS pair_date date DEFAULT CURRENT_DATE NOT NULL;

-- Supprimer les anciennes contraintes uniques (qui empêchaient d'avoir plusieurs binômes dans le temps)
ALTER TABLE public.cohort_pairs DROP CONSTRAINT IF EXISTS cohort_pairs_cohort_id_user1_id_key;
ALTER TABLE public.cohort_pairs DROP CONSTRAINT IF EXISTS cohort_pairs_cohort_id_user2_id_key;

-- Nouvelles contraintes : Un user ne peut avoir qu'un seul binôme PAR JOUR
ALTER TABLE public.cohort_pairs 
ADD CONSTRAINT unique_user1_per_day UNIQUE (cohort_id, user1_id, pair_date);

ALTER TABLE public.cohort_pairs 
ADD CONSTRAINT unique_user2_per_day UNIQUE (cohort_id, user2_id, pair_date);

-- Fonction pour générer les paires du jour (Rotation Aléatoire)
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
  -- 1. Récupérer tous les membres actifs de la cohorte
  SELECT array_agg(user_id) INTO member_ids
  FROM public.cohort_members
  WHERE cohort_id = target_cohort_id;

  -- S'il n'y a pas assez de membres, on arrête
  IF array_length(member_ids, 1) < 2 THEN
    RETURN;
  END IF;

  -- 2. Mélanger les IDs aléatoirement
  -- Astuce pour shuffle en SQL pur un peu bourrin mais efficace
  SELECT array_agg(elem ORDER BY random()) INTO shuffled_ids
  FROM unnest(member_ids) AS elem;

  -- 3. Créer les paires
  count := array_length(shuffled_ids, 1);
  
  -- Boucle par pas de 2
  FOR i IN 1 .. (count / 2) LOOP
    INSERT INTO public.cohort_pairs (cohort_id, user1_id, user2_id, pair_date)
    VALUES (
      target_cohort_id,
      shuffled_ids[2*i - 1], -- ID 1
      shuffled_ids[2*i],     -- ID 2
      CURRENT_DATE
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Gestion de l'impair (le dernier reste tout seul... ou on le met en trio ?)
  -- Pour l'instant, le dernier n'a pas de binôme (le pauvre).
  -- TODO: Gérer les trios si besoin.
END;
$$;
