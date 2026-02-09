-- 1. Ajouter la catégorie aux étapes de mission
ALTER TABLE public.mission_steps 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'intellectual'; 
-- Categories: 'intellectual', 'creative', 'social'

-- 2. Fonction pour peupler le J2 d'une cohorte
CREATE OR REPLACE FUNCTION public.seed_day_2_mission(target_cohort_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  mission_id uuid;
BEGIN
  -- Supprimer ancienne mission J2 si existe pour éviter doublons lors des tests
  DELETE FROM public.missions WHERE cohort_id = target_cohort_id AND day_index = 2;

  -- Créer la mission conteneur J2
  INSERT INTO public.missions (cohort_id, day_index, title, description, proof_type)
  VALUES (
    target_cohort_id,
    2, -- Jour 2
    'Jour 2 : Les Fondations',
    'Aujourd''hui, on pose les bases solides de votre activité et on se lance dans le grand bain.',
    'link' -- Preuve par lien (vidéo)
  )
  RETURNING id INTO mission_id;

  -- 1. Mission Intellectuelle
  INSERT INTO public.mission_steps (mission_id, content, position, category)
  VALUES 
  (mission_id, 'Analyser mes comptes des 3 derniers mois', 1, 'intellectual'),
  (mission_id, 'Créer un espace Notion pour le suivi', 2, 'intellectual'),
  (mission_id, 'Appeler mon binôme pour débriefer (15 min)', 3, 'intellectual');

  -- 2. Mission Créative
  INSERT INTO public.mission_steps (mission_id, content, position, category)
  VALUES 
  (mission_id, 'Tourner une vidéo "Qui suis-je ?" (60s max)', 4, 'creative'),
  (mission_id, 'Poster la vidéo en Story ou Reel', 5, 'creative');

  -- 3. Mission Sociale
  INSERT INTO public.mission_steps (mission_id, content, position, category)
  VALUES 
  (mission_id, 'Participer au Live de 18h (ou voir le replay)', 6, 'social'),
  (mission_id, 'Commenter les posts de 3 autres Troupers', 7, 'social');

END;
$$;
