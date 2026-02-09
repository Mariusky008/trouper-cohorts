-- Ajouter la colonne pour stocker la cohorte assignée
ALTER TABLE public.pre_registrations 
ADD COLUMN IF NOT EXISTS assigned_cohort_id uuid REFERENCES public.cohorts(id) ON DELETE SET NULL;

-- Trigger pour ajouter automatiquement le membre à la cohorte lors de la création du compte Auth
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
  AND assigned_cohort_id IS NOT NULL
  LIMIT 1;

  IF FOUND THEN
    -- Créer le profil si pas encore fait (le trigger handle_new_user le fait déjà, mais on s'assure)
    -- On insère le membre dans la cohorte
    INSERT INTO public.cohort_members (cohort_id, user_id, member_role, department_code)
    VALUES (
        pre_reg.assigned_cohort_id, 
        new.id, 
        'participant', 
        pre_reg.department_code
    )
    ON CONFLICT (cohort_id, user_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Déclencheur sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_assign_cohort ON auth.users;
CREATE TRIGGER on_auth_user_assign_cohort
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_cohort_assignment();
