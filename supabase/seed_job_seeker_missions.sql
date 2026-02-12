-- Seed Job Seeker Missions
-- Clears existing job_seeker templates and inserts the new 3-week program structure.

DO $$
DECLARE
    v_mission_id uuid;
BEGIN
    -- 1. Cleanup
    DELETE FROM public.mission_templates WHERE program_type = 'job_seeker';

    -- WEEK 1 (J1 - J5)

    -- J1
    INSERT INTO public.mission_templates (day_index, title, description, program_type)
    VALUES (1, 'LE BROUILLARD', 'Transformer la confusion en 3 pistes claires.', 'job_seeker')
    RETURNING id INTO v_mission_id;

    INSERT INTO public.mission_step_templates (mission_template_id, category, title, content, position) VALUES
    (v_mission_id, 'act1', 'CONSCIENCE : L''état réel (40 min)', 'Le but : Sortir du blocage mental et identifier les pensées limitantes.\n\nExercice 1 : Écriture individuelle (10 min). Questions lentes :\n- Depuis combien de temps je me dis "je suis perdu" ?\n- Est-ce que je suis réellement perdu… ou est-ce que j’ai peur de choisir ?\n- Qu’est-ce qui me fatigue le plus dans ma situation actuelle ?\n- Si rien ne change dans 1 an, à quoi ressemble ma vie ?\n\nExercice 2 : Débloquer l''imagination (5 min). "Si je savais que je ne pouvais pas échouer, qu’est-ce que j’oserais explorer ?"', 1),
    (v_mission_id, 'act2', 'STRUCTURE : Carte des Forces (40 min)', 'Le but : Transformer les idées floues en éléments structurés.\n\nRemplir le tableau : Ce que je fais facilement | Exemple concret | Ce que ça montre.\nExemple : J’explique bien → J’aidais mes collègues → Pédagogie.\n\nEnsuite, classer les forces en 3 catégories : Relationnelles, Organisationnelles, Techniques.\n\nObjectif : Identifier 3 forces dominantes. Pas 10. Pas 7. Seulement 3.', 2),
    (v_mission_id, 'act3', 'BINÔME : Miroir Humain (45 min)', 'Le but : Comparer perception interne et externe.\n\nChaque participant présente ses 3 forces et 2 idées métiers (3 min).\n\nLe binôme note :\n- Quand la personne est la plus énergique ?\n- Quand elle est la plus floue ?\n- Quelle compétence semble évidente ?\n- Quel métier semble cohérent avec son énergie ?\n\nFeedback obligatoire avec exemples précis.', 3),
    (v_mission_id, 'act4', 'OUTIL : Miroir IA (20 min)', 'Le but : Croiser logique + perception + cohérence.\n\nPrompt à utiliser :\n"Analyse les 3 forces déclarées ci-dessous ainsi que le feedback du binôme. Identifie les convergences. Reformule 3 compétences professionnelles exploitables. Propose 3 pistes métiers réalistes adaptées au marché actuel."\n\nL’IA reformule en langage professionnel.', 4),
    (v_mission_id, 'act5', 'ACTION : Le Mini Pitch (55 min)', 'Le but : Passer du mental au réel.\n\n1. Préparer un mini pitch de 1 minute : "Je découvre que je suis fort en… Je pense pouvoir apporter de la valeur dans…"\n2. Tester ce pitch (autre groupe, message vocal, appel).\n3. Demander une question clé : "Tu me verrais dans quoi, toi ?"', 5),
    (v_mission_id, 'act6', 'INTÉGRATION : Équation Finale (30 min)', 'Brouillard + Imagination + Structure + Miroir + IA + Action réelle = Direction possible.\n\nLivrables finaux :\n- 3 forces naturelles validées\n- 3 pistes métiers plausibles\n- 1 contact réel effectué\n- 1 mini pitch testé\n\nCe n’est plus "je suis perdu". C’est "j’ai 3 pistes à explorer".', 6);

    -- J2
    INSERT INTO public.mission_templates (day_index, title, description, program_type)
    VALUES (2, 'LE MIROIR', 'Retrouver sa valeur utile', 'job_seeker')
    RETURNING id INTO v_mission_id;

    INSERT INTO public.mission_step_templates (mission_template_id, category, title, content, position) VALUES
    (v_mission_id, 'act1', 'LA TENSION : Le Test de l''Utilité Immédiate (1h)', 'Le but : Comprendre que même sans "job", tu possèdes des solutions...', 1),
    (v_mission_id, 'act2', 'LIGNE DE VIE : La Frise des Muscles (1h)', 'Le but : Réaliser que tes épreuves personnelles t''ont donné des compétences...', 2),
    (v_mission_id, 'act3', 'OUTIL : L''IA comme Détecteur de Talents (1h)', 'Le but : Utiliser l''intelligence artificielle pour traduire ton vécu...', 3),
    (v_mission_id, 'act4', 'BINÔME : Le Détecteur d''Énergie (1h)', 'Le but : Entendre dans la bouche de quelqu''un d''autre que tu es capable...', 4),
    (v_mission_id, 'act5', 'ACTION : Le Sondage de Vérité (1h)', 'Le but : Obtenir des preuves réelles que tu as de la valeur aux yeux des autres...', 5),
    (v_mission_id, 'act6', 'VIDÉO : L''Annonce des 3 Forces (1h)', 'Le but : T''entendre dire à voix haute : "J''ai de la valeur"...', 6);

    -- J3
    INSERT INTO public.mission_templates (day_index, title, description, program_type)
    VALUES (3, 'LES POSSIBLES', 'Transformer ses forces en opportunités', 'job_seeker')
    RETURNING id INTO v_mission_id;

    INSERT INTO public.mission_step_templates (mission_template_id, category, title, content, position) VALUES
    (v_mission_id, 'act1', 'LA TENSION : La Baisse de Pression (1h)', 'Le but : Tuer la peur de se tromper...', 1),
    (v_mission_id, 'act2', 'MÉTHODE DES 3 COLONNES : Le Croisement Réaliste (1h)', 'Le but : Trouver l''intersection entre ton plaisir, ton talent...', 2),
    (v_mission_id, 'act3', 'OUTIL : Google Trends & Avis Clients (1h)', 'Le but : Vérifier que ton idée n''est pas juste "dans ta tête"...', 3),
    (v_mission_id, 'act4', 'BINÔME : La Simulation Client (1h)', 'Le but : T''entraîner à ne pas bafouiller quand on te demande...', 4),
    (v_mission_id, 'act5', 'ACTION : La Conversation Réelle (1h)', 'Le but : Sortir du cocon de la formation...', 5),
    (v_mission_id, 'act6', 'VIDÉO : Les Retours du Terrain (1h)', 'Le but : Officialiser ce que tu as appris du monde réel...', 6);

    -- J4
    INSERT INTO public.mission_templates (day_index, title, description, program_type)
    VALUES (4, 'LE CHOIX', 'De l''hésitation à l''engagement', 'job_seeker')
    RETURNING id INTO v_mission_id;

    INSERT INTO public.mission_step_templates (mission_template_id, category, title, content, position) VALUES
    (v_mission_id, 'act1', 'LA TENSION : La Balance des Risques (1h)', 'Le but : Réaliser que l''immobilisme est plus dangereux que l''erreur...', 1),
    (v_mission_id, 'act2', 'ÉVALUATION : La Matrice de Décision (1h)', 'Le but : Utiliser des chiffres plutôt que des émotions pour choisir...', 2),
    (v_mission_id, 'act3', 'OUTIL : La Phrase Magique (IA) (1h)', 'Le but : Apprendre à parler de son projet de façon si claire...', 3),
    (v_mission_id, 'act4', 'BINÔME : Le Test du Perroquet (1h)', 'Le but : Vérifier que ton idée n''est pas "claire que dans ta tête"...', 4),
    (v_mission_id, 'act5', 'ENGAGEMENT : Le Saut dans le Vide (1h)', 'Le but : Rendre ton choix irréversible en le rendant public...', 5),
    (v_mission_id, 'act6', 'VIDÉO : L''Affirmation du Choix (1h)', 'Le but : Inscrire cette décision dans ta posture et ta voix...', 6);

    -- J5
    INSERT INTO public.mission_templates (day_index, title, description, program_type)
    VALUES (5, 'LA CIBLE RÉELLE', 'Je ne peux pas aider tout le monde.', 'job_seeker')
    RETURNING id INTO v_mission_id;

    INSERT INTO public.mission_step_templates (mission_template_id, category, title, content, position) VALUES
    (v_mission_id, 'act1', 'LA TENSION : Le Mythe de "Tout le monde" (1h)', 'Le but : Comprendre que parler à tout le monde, c''est parler à personne...', 1),
    (v_mission_id, 'act2', 'EXPLORATION : Portrait Robot de la Souffrance (1h)', 'Le but : Passer d''une statistique à un être humain qui a mal quelque part...', 2),
    (v_mission_id, 'act3', 'OUTIL : Google Forms (L''Enquête) (1h)', 'Le but : Apprendre à utiliser un outil pro pour récolter de la donnée...', 3),
    (v_mission_id, 'act4', 'BINÔME : Le Test du Questionnaire (1h)', 'Le but : Éviter de passer pour un robot ou un vendeur de tapis...', 4),
    (v_mission_id, 'act5', 'ACTION : La Chasse aux Réponses (1h)', 'Le but : Sortir du groupe et aller chercher la vérité ailleurs...', 5),
    (v_mission_id, 'act6', 'VIDÉO : L''Ancrage de la Cible (1h)', 'Le but : Dire à voix haute qui tu sers et ce qu''ils t''ont appris...', 6);


    -- WEEK 2 (J8 - J12) - Skipping 6 & 7 (Weekend)

    -- J8 (Content 6)
    INSERT INTO public.mission_templates (day_index, title, description, program_type)
    VALUES (8, 'L’OFFRE VISUELLE', 'Je rends mon projet réel', 'job_seeker')
    RETURNING id INTO v_mission_id;

    INSERT INTO public.mission_step_templates (mission_template_id, category, title, content, position) VALUES
    (v_mission_id, 'act1', 'LA TENSION : Le Test de l''Ascenseur (1h)', 'Le but : Briser le blabla et l''hésitation...', 1),
    (v_mission_id, 'act2', 'EXPLORATION : La Recette du Service (1h)', 'Le but : Transformer une idée vague en un "produit" concret...', 2),
    (v_mission_id, 'act3', 'OUTIL : Canva (La Mise en Forme) (1h)', 'Le but : Utiliser un outil pro pour ne plus avoir l''air d''un "amateur"...', 3),
    (v_mission_id, 'act4', 'BINÔME : Le Test des 5 Secondes (1h)', 'Le but : Vérifier l''impact immédiat de ton visuel...', 4),
    (v_mission_id, 'act5', 'ACTION : La Confrontation Réelle (1h)', 'Le but : Valider que ton offre visuelle attire l''œil et l''intérêt...', 5),
    (v_mission_id, 'act6', 'ANCRAGE : Présentation de la "Pépite" (1h)', 'Le but : Officialiser ton existence visuelle...', 6);

    -- J9 (Content 7)
    INSERT INTO public.mission_templates (day_index, title, description, program_type)
    VALUES (9, 'LA VISIBILITÉ', 'J''existe publiquement', 'job_seeker')
    RETURNING id INTO v_mission_id;

    INSERT INTO public.mission_step_templates (mission_template_id, category, title, content, position) VALUES
    (v_mission_id, 'act1', 'LA TENSION : Le Risque du Silence (1h)', 'Le but : Réaliser que l''anonymat est votre plus grand ennemi financier...', 1),
    (v_mission_id, 'act2', 'EXPLORATION : Le Mur de Peur (1h)', 'Le but : Mettre des mots sur le syndrome de l''imposteur...', 2),
    (v_mission_id, 'act3', 'OUTIL : Création de la Page Facebook (1h)', 'Le but : Créer une "vitrine" qui sépare ta vie privée de ton activité pro...', 3),
    (v_mission_id, 'act4', 'BINÔME : Le Contrôle Technique (1h)', 'Le but : S''assurer que la vitrine est "lisible" pour un inconnu...', 4),
    (v_mission_id, 'act5', 'ACTION : Le Premier Cri (1h)', 'Le but : Faire le premier pas irréversible...', 5),
    (v_mission_id, 'act6', 'ANCRAGE : La Vidéo du Bâtisseur (1h)', 'Le but : Célébrer ton passage du statut de "seul" à "chef de projet"...', 6);

    -- J10 (Content 8)
    INSERT INTO public.mission_templates (day_index, title, description, program_type)
    VALUES (10, 'LA COMMUNAUTÉ', 'Je ne suis plus seul', 'job_seeker')
    RETURNING id INTO v_mission_id;

    INSERT INTO public.mission_step_templates (mission_template_id, category, title, content, position) VALUES
    (v_mission_id, 'act1', 'LA TENSION : L''Isolement Tue (1h)', 'Le but : Comprendre que le réseau est le moteur de la motivation...', 1),
    (v_mission_id, 'act2', 'EXPLORATION : L''Architecture du Support (1h)', 'Le but : Définir à quoi va servir ton espace Discord...', 2),
    (v_mission_id, 'act3', 'OUTIL : Création du Serveur Discord (1h)', 'Le but : Organiser ton bureau digital...', 3),
    (v_mission_id, 'act4', 'BINÔME : Le Test de Connexion (1h)', 'Le but : Apprendre à gérer son propre espace...', 4),
    (v_mission_id, 'act5', 'ACTION : L''Invitation Réelle (1h)', 'Le but : Faire entrer le premier "vrai" membre...', 5),
    (v_mission_id, 'act6', 'ANCRAGE : La Vidéo du Bâtisseur (1h)', 'Le but : Célébrer ton passage du statut de "seul" à "chef de projet"...', 6);

    -- J11 (Content 9)
    INSERT INTO public.mission_templates (day_index, title, description, program_type)
    VALUES (11, 'LE COURAGE DE PROPOSER', 'Offrir n''est pas mendier', 'job_seeker')
    RETURNING id INTO v_mission_id;

    INSERT INTO public.mission_step_templates (mission_template_id, category, title, content, position) VALUES
    (v_mission_id, 'act1', 'LA TENSION : La Mise à Nu (1h)', 'Le but : Sortir les peurs de ton ventre pour les mettre sur la table...', 1),
    (v_mission_id, 'act2', 'EXPLORATION : Changer de Lunettes (1h)', 'Le but : Arrêter de voir la vente comme une agression...', 2),
    (v_mission_id, 'act3', 'OUTIL : Le Script de Confiance (1h)', 'Le but : Avoir une structure solide pour ne pas perdre ses moyens...', 3),
    (v_mission_id, 'act4', 'BINÔME : La Simulation de Résistance (1h)', 'Le but : Muscler ton cerveau pour qu''il ne s''effondre pas au premier obstacle...', 4),
    (v_mission_id, 'act5', 'ACTION : Le Premier "Vrai" Message (1h)', 'Le but : Transformer la formation en vie réelle...', 5),
    (v_mission_id, 'act6', 'ANCRAGE : Le Cri de Victoire (1h)', 'Le but : Célébrer ton courage, quel que soit le résultat...', 6);

    -- J12 (Content 10)
    INSERT INTO public.mission_templates (day_index, title, description, program_type)
    VALUES (12, 'LES CHIFFRES', 'Dompter la machine à calculer', 'job_seeker')
    RETURNING id INTO v_mission_id;

    INSERT INTO public.mission_step_templates (mission_template_id, category, title, content, position) VALUES
    (v_mission_id, 'act1', 'LA TENSION : Le Chiffre de Dignité (1h)', 'Le but : Sortir du "je veux juste m''en sortir" pour définir un objectif...', 1),
    (v_mission_id, 'act2', 'EXPLORATION : L''Équation du Possible (1h)', 'Le but : Comprendre que ton revenu dépend de deux leviers...', 2),
    (v_mission_id, 'act3', 'OUTIL : Google Sheets (Le Simulateur) (1h)', 'Le but : Créer ton tableau de bord pour "jouer" avec les scénarios...', 3),
    (v_mission_id, 'act4', 'BINÔME : Le Challenge du Prix (1h)', 'Le but : Valider la cohérence de ton modèle avec un regard extérieur...', 4),
    (v_mission_id, 'act5', 'ACTION : L''Affirmation Publique (1h)', 'Le but : Tuer la honte de l''argent...', 5),
    (v_mission_id, 'act6', 'ANCRAGE : La Vidéo "Business" (1h)', 'Le but : Assumer sa posture de chef d''entreprise...', 6);


    -- WEEK 3 (J15 - J18) - Skipping 13 & 14 (Weekend)

    -- J15 (Content 11)
    INSERT INTO public.mission_templates (day_index, title, description, program_type)
    VALUES (15, 'L’IDENTITÉ ASSUMÉE', 'Je suis la bonne personne', 'job_seeker')
    RETURNING id INTO v_mission_id;

    INSERT INTO public.mission_step_templates (mission_template_id, category, title, content, position) VALUES
    (v_mission_id, 'act1', 'LA TENSION : Le Procès de l''Imposteur (1h)', 'Le but : Affronter la question qui fait mal pour trouver ta force...', 1),
    (v_mission_id, 'act2', 'EXPLORATION : Le Storytelling de la Vérité (1h)', 'Le but : Transformer ton passé (même les trous dans le CV)...', 2),
    (v_mission_id, 'act3', 'OUTIL : Identité Visuelle sur Canva (1h)', 'Le but : Utiliser les codes graphiques pour envoyer un signal...', 3),
    (v_mission_id, 'act4', 'BINÔME : Le Test de l''Impression (1h)', 'Le but : Vérifier si l''image que tu projettes correspond à ton intention...', 4),
    (v_mission_id, 'act5', 'ACTION : La Mise à Jour Officielle (1h)', 'Le but : Porter ton nouvel habit de lumière devant tout le monde...', 5),
    (v_mission_id, 'act6', 'ANCRAGE : La Vidéo d''Identité (1h)', 'Le but : Inscrire cette légitimité dans ta voix et ton corps...', 6);

    -- J16 (Content 12)
    INSERT INTO public.mission_templates (day_index, title, description, program_type)
    VALUES (16, 'LA STRUCTURATION DIGITALE', 'La machine travaille pour moi', 'job_seeker')
    RETURNING id INTO v_mission_id;

    INSERT INTO public.mission_step_templates (mission_template_id, category, title, content, position) VALUES
    (v_mission_id, 'act1', 'LA TENSION : Le Mythe de l''Esclave Digital (1h)', 'Le but : Réaliser que ton temps est ta ressource la plus précieuse...', 1),
    (v_mission_id, 'act2', 'EXPLORATION : Le Parcours de ton Client (1h)', 'Le but : Dessiner le chemin le plus court entre "un inconnu me voit"...', 2),
    (v_mission_id, 'act3', 'OUTIL : Le Formulaire Intelligent (1h)', 'Le but : Créer ta secrétaire virtuelle avec Google Forms...', 3),
    (v_mission_id, 'act4', 'BINÔME : Le Test de Fluidité (1h)', 'Le but : S''assurer que la machine ne fait pas d''erreurs...', 4),
    (v_mission_id, 'act5', 'ACTION : Partager le lien à une personne réelle (1h)', 'Le but : Mettre en route le système...', 5),
    (v_mission_id, 'act6', 'ANCRAGE : Voici mon système de contact professionnel (1h)', 'Le but : Officialiser l''outil...', 6);

    -- J17 (Content 13)
    INSERT INTO public.mission_templates (day_index, title, description, program_type)
    VALUES (17, 'L’ENGAGEMENT OFFICIEL', 'Je suis entrepreneur', 'job_seeker')
    RETURNING id INTO v_mission_id;

    INSERT INTO public.mission_step_templates (mission_template_id, category, title, content, position) VALUES
    (v_mission_id, 'act1', 'LA TENSION : Le Monstre Administratif (1h)', 'Le but : Regarder l''Urssaf dans les yeux pour ne plus en avoir peur...', 1),
    (v_mission_id, 'act2', 'EXPLORATION : La Traduction du Jargon (1h)', 'Le but : Comprendre les règles du jeu pour mieux jouer...', 2),
    (v_mission_id, 'act3', 'OUTIL : Navigation sur le Portail Officiel (1h)', 'Le but : Dompter l''interface du site autoentrepreneur.urssaf.fr...', 3),
    (v_mission_id, 'act4', 'BINÔME : Le Plan de Lancement (1h)', 'Le but : S''engager sur une date de naissance officielle...', 4),
    (v_mission_id, 'act5', 'ACTION : La Démarche Concrète (1h)', 'Le but : Faire un acte irréversible vers l''officialisation...', 5),
    (v_mission_id, 'act6', 'ANCRAGE : Le Sceau Final (1h)', 'Le but : Assumer publiquement ton nouveau statut social...', 6);

    -- J18 (Content 14)
    INSERT INTO public.mission_templates (day_index, title, description, program_type)
    VALUES (18, 'LA PROJECTION', 'Garder le cap après la tempête', 'job_seeker')
    RETURNING id INTO v_mission_id;

    INSERT INTO public.mission_step_templates (mission_template_id, category, title, content, position) VALUES
    (v_mission_id, 'act1', 'LA TENSION : L''Anticipation de la Chute (1h)', 'Le but : Regarder en face le moment où l''euphorie va retomber...', 1),
    (v_mission_id, 'act2', 'EXPLORATION : Le Voyage dans le Temps (1h)', 'Le but : Visualiser le succès pour le rendre inévitable...', 2),
    (v_mission_id, 'act3', 'OUTIL : La Feuille de Route (Google Docs) (1h)', 'Le but : Découper la montagne en petites marches d''escalier...', 3),
    (v_mission_id, 'act4', 'BINÔME FINAL : Le Passage de Témoin (1h)', 'Le but : Transformer ton binôme en un partenaire de long terme...', 4),
    (v_mission_id, 'act5', 'ACTION : La Lettre au Futur "Moi" (1h)', 'Le but : Créer un ancrage émotionnel puissant pour les jours de doute...', 5),
    (v_mission_id, 'act6', 'VIDÉO FINALE : Le Bilan de la Métamorphose (1h)', 'Le but : Célébrer le chemin parcouru et officialiser ta nouvelle identité...', 6);

END $$;
