-- Nettoyer les templates existants pour repartir propre
DELETE FROM public.mission_templates;

-- Variables temporaires
DO $$
DECLARE
  m_id uuid;
BEGIN

  -- JOUR 1 : Bienvenue
  INSERT INTO public.mission_templates (day_index, title, description, proof_type, video_url)
  VALUES (1, 'Jour 1 : Le Grand Saut', 'Bienvenue dans l''aventure. Aujourd''hui, on s''engage.', 'link', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  RETURNING id INTO m_id;

  INSERT INTO public.mission_step_templates (mission_template_id, content, position, category) VALUES
  (m_id, 'Regarder la vidéo de bienvenue', 1, 'intellectual'),
  (m_id, 'Rejoindre le canal WhatsApp de la cohorte', 2, 'social'),
  (m_id, 'Poster une photo de mon espace de travail', 3, 'creative');


  -- JOUR 2 : Les Fondations
  INSERT INTO public.mission_templates (day_index, title, description, proof_type, video_url)
  VALUES (2, 'Jour 2 : Les Fondations', 'On pose les bases solides de votre activité.', 'link', NULL)
  RETURNING id INTO m_id;

  INSERT INTO public.mission_step_templates (mission_template_id, content, position, category) VALUES
  (m_id, 'Analyser mes comptes des 3 derniers mois', 1, 'intellectual'),
  (m_id, 'Créer un espace Notion pour le suivi', 2, 'intellectual'),
  (m_id, 'Appeler mon binôme pour débriefer (15 min)', 3, 'intellectual'),
  (m_id, 'Tourner une vidéo "Qui suis-je ?" (60s max)', 4, 'creative'),
  (m_id, 'Poster la vidéo en Story ou Reel', 5, 'creative'),
  (m_id, 'Participer au Live de 18h', 6, 'social'),
  (m_id, 'Commenter les posts de 3 autres Troupers', 7, 'social');


  -- JOUR 3 à 14 (Génériques pour l'instant)
  FOR i IN 3..14 LOOP
    INSERT INTO public.mission_templates (day_index, title, description, proof_type)
    VALUES (i, 'Jour ' || i || ' : En construction', 'Le programme de cette journée sera révélé bientôt.', 'text')
    RETURNING id INTO m_id;

    INSERT INTO public.mission_step_templates (mission_template_id, content, position, category) VALUES
    (m_id, 'Mission Intellectuelle à venir', 1, 'intellectual'),
    (m_id, 'Mission Créative à venir', 2, 'creative'),
    (m_id, 'Mission Sociale à venir', 3, 'social');
  END LOOP;

END $$;
