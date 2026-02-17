-- Ajout de proof_type et proof_content aux tables mission_step_templates et mission_steps

-- 1. Table mission_step_templates
ALTER TABLE public.mission_step_templates 
ADD COLUMN IF NOT EXISTS proof_type text DEFAULT 'none'; -- 'none', 'text', 'link', 'file'

-- 2. Table mission_steps (instanciées)
ALTER TABLE public.mission_steps 
ADD COLUMN IF NOT EXISTS proof_type text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS proof_content text, -- Contenu de la preuve (texte, URL, path fichier)
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'; -- 'pending', 'submitted', 'validated'

-- Mise à jour de la fonction d'instanciation des missions pour copier le proof_type
CREATE OR REPLACE FUNCTION public.instantiate_mission_steps()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.mission_steps (mission_id, content, position, category, proof_type)
  SELECT NEW.id, mst.content, mst.position, mst.category, mst.proof_type
  FROM public.mission_step_templates mst
  WHERE mst.mission_template_id = NEW.mission_template_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Réappliquer le trigger (au cas où)
DROP TRIGGER IF EXISTS trigger_instantiate_mission_steps ON public.missions;
CREATE TRIGGER trigger_instantiate_mission_steps
AFTER INSERT ON public.missions
FOR EACH ROW
EXECUTE FUNCTION public.instantiate_mission_steps();
