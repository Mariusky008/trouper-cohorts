-- Nettoyer les templates existants pour repartir propre
DELETE FROM public.mission_templates;

DO $$
DECLARE
  m_id uuid;
BEGIN

  -- JOUR 1 : Le Grand Saut
  INSERT INTO public.mission_templates (day_index, title, description, proof_type, video_url)
  VALUES (1, 'Jour 1 : Le Grand Saut', 'Bienvenue dans l''aventure. Aujourd''hui, on s''engage.', 'link', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  RETURNING id INTO m_id;
  
  INSERT INTO public.mission_step_templates (mission_template_id, content, position, category) VALUES
  (m_id, 'Regarder la vidéo de bienvenue', 1, 'intellectual'),
  (m_id, 'Rejoindre le canal WhatsApp', 2, 'social'),
  (m_id, 'Poster une photo de mon espace de travail', 3, 'creative');


  -- JOUR 2 : AUDIT SANS CONCESSION
  INSERT INTO public.mission_templates (day_index, title, description, proof_type)
  VALUES (2, 'J2: AUDIT SANS CONCESSION', 'Objectif : Voir la réalité en face.', 'link')
  RETURNING id INTO m_id;

  -- On regroupe les sous-tâches dans une seule étape par catégorie pour l'affichage
  INSERT INTO public.mission_step_templates (mission_template_id, content, position, category) VALUES
  (m_id, '1. Extraire mes relevés bancaires des 3 derniers mois.\n2. Identifier mes 3 plus grosses fuites d''argent.\n3. Calculer mon taux horaire réel (Revenu / Heures travaillées).', 1, 'intellectual'),
  (m_id, 'Raconte ta plus grosse erreur business de l''année (Sans filtre).\n\n💡 Conseil : Sois authentique, ne cherche pas à être parfait.\n⏰ Heure recommandée : 18h00.', 2, 'creative'),
  (m_id, 'Participer au Live de 18h (ou voir le replay).\nCommenter les posts de 3 autres Troupers.', 3, 'social');


  -- JOUR 3 : DISSECTION DE L''OFFRE (DUO)
  INSERT INTO public.mission_templates (day_index, title, description, proof_type)
  VALUES (3, 'J3: DISSECTION DE L''OFFRE (DUO)', 'Objectif : Détruire pour reconstruire.', 'link')
  RETURNING id INTO m_id;

  INSERT INTO public.mission_step_templates (mission_template_id, content, position, category) VALUES
  (m_id, 'Appel visio avec ton binôme (45min).\nIl doit jouer l''avocat du diable sur ton offre actuelle.', 1, 'social'),
  (m_id, 'Note chaque objection. Ne te défends pas. Écoute.', 2, 'intellectual'),
  (m_id, 'Pitch ton offre actuelle en 30s. Si ton binôme ne comprend pas, c''est nul.', 3, 'creative');


  -- JOUR 4 à 14 (Placeholders)
  FOR i IN 4..14 LOOP
    INSERT INTO public.mission_templates (day_index, title, description, proof_type)
    VALUES (i, 'Jour ' || i || ' : À venir', 'Programme en cours de chargement...', 'text')
    RETURNING id INTO m_id;
    
    INSERT INTO public.mission_step_templates (mission_template_id, content, position, category) VALUES
    (m_id, 'Consulter les ressources', 1, 'intellectual');
  END LOOP;

END $$;
