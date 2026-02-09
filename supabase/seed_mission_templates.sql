-- Fonction d'initialisation des templates (à créer une fois)
CREATE OR REPLACE FUNCTION public.setup_mission_templates()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  m_id uuid;
BEGIN
  -- Nettoyer
  DELETE FROM public.mission_templates;

  -- JOUR 1
  INSERT INTO public.mission_templates (day_index, title, description, proof_type, video_url)
  VALUES (1, 'Jour 1 : Le Grand Saut', 'Bienvenue dans l''aventure. Aujourd''hui, on s''engage.', 'link', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  RETURNING id INTO m_id;
  
  INSERT INTO public.mission_step_templates (mission_template_id, content, position, category) VALUES
  (m_id, 'Regarder la vidéo de bienvenue', 1, 'intellectual'),
  (m_id, 'Rejoindre le canal WhatsApp', 2, 'social'),
  (m_id, 'Poster une photo de mon espace de travail', 3, 'creative');

  -- JOUR 2
  INSERT INTO public.mission_templates (day_index, title, description, proof_type)
  VALUES (2, 'J2: AUDIT SANS CONCESSION', 'Objectif : Voir la réalité en face.', 'link')
  RETURNING id INTO m_id;

  INSERT INTO public.mission_step_templates (mission_template_id, content, position, category) VALUES
  (m_id, '1. Extraire mes relevés bancaires des 3 derniers mois.' || chr(10) || '2. Identifier mes 3 plus grosses fuites d''argent.' || chr(10) || '3. Calculer mon taux horaire réel (Revenu / Heures travaillées).', 1, 'intellectual'),
  (m_id, 'Raconte ta plus grosse erreur business de l''année (Sans filtre).' || chr(10) || chr(10) || '💡 Conseil : Sois authentique, ne cherche pas à être parfait.' || chr(10) || '⏰ Heure recommandée : 18h00.' || chr(10) || '🔗 Copie le lien de ta vidéo une fois postée.', 2, 'creative'),
  (m_id, 'Participer au Live de 18h (ou voir le replay).' || chr(10) || chr(10) || '💬 Mission Interaction :' || chr(10) || 'Va sur le groupe WhatsApp ou sur Instagram.' || chr(10) || 'Trouve les posts de 3 autres Popeys.' || chr(10) || 'Laisse un commentaire constructif et encourageant (pas juste un emoji 🔥).', 3, 'social');

  -- JOUR 3
  INSERT INTO public.mission_templates (day_index, title, description, proof_type)
  VALUES (3, 'J3: DISSECTION DE L''OFFRE (DUO)', 'Objectif : Détruire pour reconstruire.', 'link')
  RETURNING id INTO m_id;

  INSERT INTO public.mission_step_templates (mission_template_id, content, position, category) VALUES
  (m_id, 'Appel visio avec ton binôme (45min).' || chr(10) || 'Il doit jouer l''avocat du diable sur ton offre actuelle.', 1, 'social'),
  (m_id, 'Note chaque objection. Ne te défends pas. Écoute.', 2, 'intellectual'),
  (m_id, 'Pitch ton offre actuelle en 30s. Si ton binôme ne comprend pas, c''est nul.', 3, 'creative');

  -- JOUR 4 à 14
  FOR i IN 4..14 LOOP
    INSERT INTO public.mission_templates (day_index, title, description, proof_type)
    VALUES (i, 'Jour ' || i || ' : À venir', 'Programme en cours de chargement...', 'text')
    RETURNING id INTO m_id;
    
    INSERT INTO public.mission_step_templates (mission_template_id, content, position, category) VALUES
    (m_id, 'Consulter les ressources', 1, 'intellectual');
  END LOOP;
END;
$$;

-- Exécution directe pour mise à jour immédiate si joué dans l'éditeur
SELECT public.setup_mission_templates();
