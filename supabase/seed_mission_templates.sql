-- Fonction d'initialisation des templates (14 jours complets)
CREATE OR REPLACE FUNCTION public.setup_mission_templates()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  m_id uuid;
BEGIN
  -- Nettoyage complet des templates existants
  DELETE FROM public.mission_templates;

  -- J1 : LE GRAND SAUT
  INSERT INTO public.mission_templates (day_index, title, description, proof_type, video_url)
  VALUES (1, 'J1 : LE GRAND SAUT', 'Bienvenue dans l''aventure. On pose les bases.', 'link', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  RETURNING id INTO m_id;
  INSERT INTO public.mission_step_templates (mission_template_id, content, position, category) VALUES
  (m_id, 'Regarder la vidéo de bienvenue et lire le Manifeste.', 1, 'intellectual'),
  (m_id, 'Poster une photo de ton espace de travail sur le groupe.', 2, 'creative'),
  (m_id, 'Le Pacte de Sang (Vidéo 60s) : Qui tu es + Ton Business + Ton Objectif. Termine par "Je m''engage". Pas de montage. Brut.', 3, 'social');

  -- J2 : AUDIT SANS CONCESSION
  INSERT INTO public.mission_templates (day_index, title, description, proof_type)
  VALUES (2, 'J2 : AUDIT SANS CONCESSION', 'Regarder la réalité en face pour mieux avancer.', 'link')
  RETURNING id INTO m_id;
  INSERT INTO public.mission_step_templates (mission_template_id, content, position, category) VALUES
  (m_id, 'Extraire tes chiffres des 3 derniers mois (CA, Dépenses, Temps).', 1, 'intellectual'),
  (m_id, 'Raconte ta plus grosse erreur business en story ou post.', 2, 'creative'),
  (m_id, 'Participer au Live de 18h et commenter les posts de 3 autres membres.', 3, 'social');

  -- J3 : DISSECTION
  INSERT INTO public.mission_templates (day_index, title, description, proof_type)
  VALUES (3, 'J3 : DISSECTION', 'Analyser ce qui bloque et ce qui fonctionne.', 'text')
  RETURNING id INTO m_id;
  INSERT INTO public.mission_step_templates (mission_template_id, content, position, category) VALUES
  (m_id, 'Lister 3 croyances limitantes qui te freinent aujourd''hui.', 1, 'intellectual'),
  (m_id, 'Dessiner ou schématiser ton business model actuel.', 2, 'creative'),
  (m_id, 'Appeler ton binôme du jour pour débriefer (15 min).', 3, 'social');

  -- J4 : LA CIBLE (AVATAR)
  INSERT INTO public.mission_templates (day_index, title, description, proof_type)
  VALUES (4, 'J4 : DANS LA TÊTE DU CLIENT', 'Comprendre à qui tu parles vraiment.', 'text')
  RETURNING id INTO m_id;
  INSERT INTO public.mission_step_templates (mission_template_id, content, position, category) VALUES
  (m_id, 'Remplir la fiche Avatar : Douleurs, Désirs, Peurs.', 1, 'intellectual'),
  (m_id, 'Écrire une lettre fictive d''un client mécontent (pour comprendre ses frustrations).', 2, 'creative'),
  (m_id, 'Demander un feedback sur ton avatar à la communauté.', 3, 'social');

  -- J5 : L''OFFRE IRRÉSISTIBLE
  INSERT INTO public.mission_templates (day_index, title, description, proof_type)
  VALUES (5, 'J5 : L''OFFRE IRRÉSISTIBLE', 'Packager ta valeur pour qu''on ne puisse pas refuser.', 'link')
  RETURNING id INTO m_id;
  INSERT INTO public.mission_step_templates (mission_template_id, content, position, category) VALUES
  (m_id, 'Définir ta Promesse Unique (One Sentence Pitch).', 1, 'intellectual'),
  (m_id, 'Créer un visuel ou un slide qui résume ton offre.', 2, 'creative'),
  (m_id, 'Pitcher ton offre à ton binôme et noter ses objections.', 3, 'social');

  -- J6 : LE MESSAGE
  INSERT INTO public.mission_templates (day_index, title, description, proof_type)
  VALUES (6, 'J6 : STORYTELLING', 'Savoir raconter pour vendre.', 'link')
  RETURNING id INTO m_id;
  INSERT INTO public.mission_step_templates (mission_template_id, content, position, category) VALUES
  (m_id, 'Écrire ton histoire "Origine" (Pourquoi tu fais ça ?).', 1, 'intellectual'),
  (m_id, 'Publier un post "Vulnérabilité" sur tes réseaux.', 2, 'creative'),
  (m_id, 'Lire et encourager les histoires des autres membres.', 3, 'social');

  -- J7 : REPOS & STRATÉGIE
  INSERT INTO public.mission_templates (day_index, title, description, proof_type)
  VALUES (7, 'J7 : PAUSE STRATÉGIQUE', 'Prendre du recul pour mieux sauter.', 'text')
  RETURNING id INTO m_id;
  INSERT INTO public.mission_step_templates (mission_template_id, content, position, category) VALUES
  (m_id, 'Relire tes notes de la semaine et identifier 1 victoire.', 1, 'intellectual'),
  (m_id, 'Faire une activité OFF (Sport, Balade, Famille) sans écran.', 2, 'creative'),
  (m_id, 'Partager ta victoire de la semaine sur le groupe.', 3, 'social');

  -- J8 : VISIBILITÉ
  INSERT INTO public.mission_templates (day_index, title, description, proof_type)
  VALUES (8, 'J8 : SORTIR DU BOIS', 'Se montrer au monde.', 'link')
  RETURNING id INTO m_id;
  INSERT INTO public.mission_step_templates (mission_template_id, content, position, category) VALUES
  (m_id, 'Choisir 1 canal d''acquisition principal et s''y tenir.', 1, 'intellectual'),
  (m_id, 'Créer 3 idées de contenus pour la semaine prochaine.', 2, 'creative'),
  (m_id, 'Commenter 5 posts de prospects potentiels.', 3, 'social');

  -- J9 : ACQUISITION
  INSERT INTO public.mission_templates (day_index, title, description, proof_type)
  VALUES (9, 'J9 : LA CHASSE', 'Aller chercher les clients.', 'text')
  RETURNING id INTO m_id;
  INSERT INTO public.mission_step_templates (mission_template_id, content, position, category) VALUES
  (m_id, 'Lister 10 prospects chauds à contacter.', 1, 'intellectual'),
  (m_id, 'Rédiger ton message d''approche (DM ou Email).', 2, 'creative'),
  (m_id, 'Roleplay "Prospection" avec ton binôme (10 min chacun).', 3, 'social');

  -- J10 : LA VENTE
  INSERT INTO public.mission_templates (day_index, title, description, proof_type)
  VALUES (10, 'J10 : CLOSING', 'Transformer l''intérêt en argent.', 'text')
  RETURNING id INTO m_id;
  INSERT INTO public.mission_step_templates (mission_template_id, content, position, category) VALUES
  (m_id, 'Lister les 3 objections principales de tes clients et les parer.', 1, 'intellectual'),
  (m_id, 'S''enregistrer en train de traiter une objection (Audio).', 2, 'creative'),
  (m_id, 'Partager ton astuce de closing préférée.', 3, 'social');

  -- J11 : LIVRAISON & WOW
  INSERT INTO public.mission_templates (day_index, title, description, proof_type)
  VALUES (11, 'J11 : EFFET WOW', 'Délivrer plus que prévu.', 'text')
  RETURNING id INTO m_id;
  INSERT INTO public.mission_step_templates (mission_template_id, content, position, category) VALUES
  (m_id, 'Auditer ton process d''onboarding client.', 1, 'intellectual'),
  (m_id, 'Imaginer une petite attention surprise pour tes clients.', 2, 'creative'),
  (m_id, 'Demander à un client actuel comment tu pourrais t''améliorer.', 3, 'social');

  -- J12 : FIDÉLISATION
  INSERT INTO public.mission_templates (day_index, title, description, proof_type)
  VALUES (12, 'J12 : AMBASSADEURS', 'Faire de tes clients tes vendeurs.', 'link')
  RETURNING id INTO m_id;
  INSERT INTO public.mission_step_templates (mission_template_id, content, position, category) VALUES
  (m_id, 'Créer un template de demande de témoignage.', 1, 'intellectual'),
  (m_id, 'Récolter 1 témoignage vidéo ou écrit aujourd''hui.', 2, 'creative'),
  (m_id, 'Remercier publiquement un client fidèle.', 3, 'social');

  -- J13 : OPTIMISATION
  INSERT INTO public.mission_templates (day_index, title, description, proof_type)
  VALUES (13, 'J13 : SYSTÈMES', 'Travailler SUR son business, pas DANS son business.', 'text')
  RETURNING id INTO m_id;
  INSERT INTO public.mission_step_templates (mission_template_id, content, position, category) VALUES
  (m_id, 'Identifier une tâche répétitive à automatiser ou déléguer.', 1, 'intellectual'),
  (m_id, 'Écrire la procédure (SOP) de cette tâche.', 2, 'creative'),
  (m_id, 'Échanger un outil de productivité avec la cohorte.', 3, 'social');

  -- J14 : LE BILAN & LA SUITE
  INSERT INTO public.mission_templates (day_index, title, description, proof_type)
  VALUES (14, 'J14 : NOUVEAU DÉPART', 'Ce n''est que le début.', 'link')
  RETURNING id INTO m_id;
  INSERT INTO public.mission_step_templates (mission_template_id, content, position, category) VALUES
  (m_id, 'Faire le bilan chiffré des 14 jours.', 1, 'intellectual'),
  (m_id, 'Écrire ton Plan d''Action à 90 jours.', 2, 'creative'),
  (m_id, 'Apéro Zoom de fin de bootcamp ! 🥂', 3, 'social');

END;
$$;

-- Exécution immédiate
SELECT public.setup_mission_templates();
