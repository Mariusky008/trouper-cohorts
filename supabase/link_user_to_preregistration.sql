-- Ajouter user_id à pre_registrations pour lier le profil
ALTER TABLE public.pre_registrations 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Mettre à jour la fonction trigger existante pour remplir aussi user_id
CREATE OR REPLACE FUNCTION public.handle_new_user_cohort_assignment()
RETURNS TRIGGER AS $$
DECLARE
  pre_reg record;
BEGIN
  -- Chercher une pré-inscription validée avec cet email
  SELECT * INTO pre_reg 
  FROM public.pre_registrations 
  WHERE email = new.email 
  AND status = 'approved'
  LIMIT 1;

  IF FOUND THEN
    -- 1. Lier l'user_id à la pré-inscription (pour s'en servir de profil)
    UPDATE public.pre_registrations 
    SET user_id = new.id 
    WHERE id = pre_reg.id;

    -- 2. Insérer le membre dans la cohorte (si assignée)
    IF pre_reg.assigned_cohort_id IS NOT NULL THEN
        INSERT INTO public.cohort_members (cohort_id, user_id, member_role, department_code)
        VALUES (
            pre_reg.assigned_cohort_id, 
            new.id, 
            'participant', 
            pre_reg.department_code
        )
        ON CONFLICT (cohort_id, user_id) DO NOTHING;
    END IF;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
