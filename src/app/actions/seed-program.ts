"use server";

import { createClient } from "@/lib/supabase/server";
import { programmeChomageData } from "@/data/programme-chomage-data";

export async function seedJobSeekerProgram() {
  const supabase = await createClient();

  try {
    // 1. Delete existing job_seeker templates
    const { error: deleteError } = await supabase
      .from("mission_templates")
      .delete()
      .eq("program_type", "job_seeker");

    if (deleteError) throw deleteError;

    // 2. Prepare the new data
    const newMissions = [];
    const dayMapping = [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18]; // Maps Content Index 0-13 to Calendar Day

    for (let i = 0; i < programmeChomageData.length; i++) {
      const original = programmeChomageData[i];
      const calendarDay = dayMapping[i];
      
      let missionData: any = {
        day_index: calendarDay,
        title: original.title,
        description: original.description,
        program_type: "job_seeker",
        steps: original.mission_step_templates
      };

      // OVERRIDE J1 with V2 Content
      if (i === 0) {
        missionData.title = "LE BROUILLARD";
        missionData.description = "Transformer la confusion en 3 pistes claires.";
        missionData.steps = [
            { category: "act1", title: "CONSCIENCE : L'état réel (40 min)", content: "Le but : Sortir du blocage mental et identifier les pensées limitantes.\n\nExercice 1 : Écriture individuelle (10 min). Questions lentes :\n- Depuis combien de temps je me dis \"je suis perdu\" ?\n- Est-ce que je suis réellement perdu… ou est-ce que j’ai peur de choisir ?\n- Qu’est-ce qui me fatigue le plus dans ma situation actuelle ?\n- Si rien ne change dans 1 an, à quoi ressemble ma vie ?\n\nExercice 2 : Débloquer l'imagination (5 min). \"Si je savais que je ne pouvais pas échouer, qu’est-ce que j’oserais explorer ?\"", position: 1 },
            { category: "act2", title: "STRUCTURE : Carte des Forces (40 min)", content: "Le but : Transformer les idées floues en éléments structurés.\n\nRemplir le tableau : Ce que je fais facilement | Exemple concret | Ce que ça montre.\nExemple : J’explique bien → J’aidais mes collègues → Pédagogie.\n\nEnsuite, classer les forces en 3 catégories : Relationnelles, Organisationnelles, Techniques.\n\nObjectif : Identifier 3 forces dominantes. Pas 10. Pas 7. Seulement 3.", position: 2 },
            { category: "act3", title: "BINÔME : Miroir Humain (45 min)", content: "Le but : Comparer perception interne et externe.\n\nChaque participant présente ses 3 forces et 2 idées métiers (3 min).\n\nLe binôme note :\n- Quand la personne est la plus énergique ?\n- Quand elle est la plus floue ?\n- Quelle compétence semble évidente ?\n- Quel métier semble cohérent avec son énergie ?\n\nFeedback obligatoire avec exemples précis.", position: 3 },
            { category: "act4", title: "OUTIL : Miroir IA (20 min)", content: "Le but : Croiser logique + perception + cohérence.\n\nPrompt à utiliser :\n\"Analyse les 3 forces déclarées ci-dessous ainsi que le feedback du binôme. Identifie les convergences. Reformule 3 compétences professionnelles exploitables. Propose 3 pistes métiers réalistes adaptées au marché actuel.\"\n\nL’IA reformule en langage professionnel.", position: 4 },
            { category: "act5", title: "ACTION : Le Mini Pitch (55 min)", content: "Le but : Passer du mental au réel.\n\n1. Préparer un mini pitch de 1 minute : \"Je découvre que je suis fort en… Je pense pouvoir apporter de la valeur dans…\"\n2. Tester ce pitch (autre groupe, message vocal, appel).\n3. Demander une question clé : \"Tu me verrais dans quoi, toi ?\"", position: 5 },
            { category: "act6", title: "INTÉGRATION : Équation Finale (30 min)", content: "Brouillard + Imagination + Structure + Miroir + IA + Action réelle = Direction possible.\n\nLivrables finaux :\n- 3 forces naturelles validées\n- 3 pistes métiers plausibles\n- 1 contact réel effectué\n- 1 mini pitch testé\n\nCe n’est plus \"je suis perdu\". C’est \"j’ai 3 pistes à explorer\".", position: 6 }
        ];
      }

      // OVERRIDE J2 with V2 Content (100% IA)
      if (i === 1) {
        missionData.title = "LE MIROIR";
        missionData.description = "Retrouver sa valeur (Version 100% IA).";
        missionData.steps = [
            { category: "act1", title: "CONSCIENCE : Image Interne (30 min)", content: "Le but : Clarifier comment je me perçois professionnellement.\n\nRépondre dans un document :\n- Je me décris en 5 adjectifs professionnels.\n- Ma compétence principale est…\n- Mon principal point faible est…\n- Ce que j’ai peur que l’on remarque chez moi…\n- Ce que j’aimerais que l’on voie en priorité…\n\nL'IA pose une relance : Parmi ces éléments, lesquels sont factuels ? Lesquels sont des jugements ?", position: 1 },
            { category: "act2", title: "STRUCTURE : Message (30 min)", content: "Le but : Construire un pitch structuré sans justification émotionnelle.\n\nStructure imposée par l’IA :\n1. Qui je suis (factuel, sans émotion)\n2. Ce que je fais bien (preuves concrètes)\n3. Ce que je peux apporter à une entreprise\n4. Ce que je recherche précisément\n\nL’IA bloque si c'est flou, trop long ou s'il y a des excuses. Elle reformule jusqu’à clarté.", position: 2 },
            { category: "act3", title: "BINÔME : Miroir Humain (45 min)", content: "Le but : Feedback structuré.\n\nChaque participant présente son pitch (3 min).\nLe binôme répond précisément :\n- À quel moment étais-tu convaincant ?\n- À quel moment étais-tu flou ?\n- Quelle compétence semblait solide ?\n- Où as-tu senti un manque d’assurance ?\n\nInterdiction de dire \"C’était bien\". Obligation d’exemples.", position: 3 },
            { category: "act4", title: "OUTIL : Miroir IA (30 min)", content: "Le but : Analyse croisée.\n\nEntrer le pitch écrit + le feedback du binôme.\nPrompt :\n\"Analyse les différences entre l’image interne et le feedback externe. Identifie les compétences réellement perçues, les incohérences, les points sous-estimés et surévalués. Reformule une version plus crédible.\"\n\nL’IA génère : Version optimisée + Écart perception/réalité + 3 axes d’amélioration.", position: 4 },
            { category: "act5", title: "ACTION : Ajustement & Test (1h)", content: "Le but : Validation terrain.\n\n1. Modifier son pitch selon recommandations.\n2. Refaire un passage devant binôme (Comparaison V1 vs V2 sur Clarté/Impact/Assurance).\n3. Envoyer le pitch en message vocal à un contact (proche, ex-collègue) avec la question : \"Est-ce que ça te semble crédible ?\"", position: 5 },
            { category: "act6", title: "INTÉGRATION : Auto-évaluation (30 min)", content: "Auto-évaluation guidée par IA :\n- Ce que je croyais être…\n- Ce que je dégage réellement…\n- Ce que j’ai amélioré aujourd’hui…\n\nLivrables :\n- Pitch professionnel validé\n- Compétences reformulées clairement\n- Écart perception/réalité identifié\n- 1 test réel effectué", position: 6 }
        ];
      }

      // OVERRIDE J3 with V2 Content
      if (i === 2) {
        missionData.title = "LES POSSIBLES";
        missionData.description = "Transformer mes forces en opportunités.";
        missionData.steps = [
            { category: "act1", title: "CONSCIENCE : Du Talent à l'Utilité (30 min)", content: "Le but : Comprendre que la valeur = utilité perçue.\n\nL’IA pose les questions :\n- Mes 3 forces identifiées sont :\n- Qui pourrait avoir besoin de ces forces ?\n- Quel problème concret ces forces peuvent-elles résoudre ?\n- Dans quel environnement ces forces seraient-elles utiles ?\n\nQuestion clé : Est-ce que je parle de moi… ou d’un besoin réel ?", position: 1 },
            { category: "act2", title: "STRUCTURE : Matching Force / Besoin (40 min)", content: "Le but : Structurer le lien entre compétence et marché.\n\nRemplir le tableau obligatoire :\nForce | Problème résolu | Type d’entreprise | Poste possible\nEx : Organisation → Désorganisation interne → PME locale → Assistant administratif\n\nL’IA demande : Laquelle de ces correspondances est la plus réaliste dans ta ville ?", position: 2 },
            { category: "act3", title: "RECHERCHE : Marché Réel (50 min)", content: "Le but : Confronter l’idée au réel.\n\nMission obligatoire :\n1. Trouver 5 offres d’emploi réelles correspondant à au moins 1 correspondance.\n2. Copier les compétences demandées.\n3. Identifier : Compétences communes / Compétences manquantes / Niveau d’expérience.\n\nL’IA aide à analyser : Quels mots reviennent le plus souvent ?", position: 3 },
            { category: "act4", title: "OUTIL : Miroir IA Réalisme (20 min)", content: "Le but : Objectiver la faisabilité.\n\nPrompt :\n\"Voici mes forces, mes correspondances marché et l’analyse des 5 offres. Classe les opportunités en : Immédiatement accessibles / Accessibles avec adaptation courte / Nécessitant formation longue. Justifie objectivement.\"\n\nL’IA génère : Classement clair + 3 pistes réalistes.", position: 4 },
            { category: "act5", title: "ACTION : Contact Réel (1h)", content: "Le but : Vérifier un besoin réel.\n\nContacter 1 entreprise locale (Appel, Email, LinkedIn).\nScript simple :\n\"Bonjour, je m’intéresse à [métier]. J’aimerais comprendre quelles compétences sont réellement importantes aujourd’hui dans votre secteur. Auriez-vous 3 minutes ?\"\n\nObjectif : Ne pas demander un emploi. Demander une information.", position: 5 },
            { category: "act6", title: "INTÉGRATION : Réalité vs Imagination (30 min)", content: "Questions IA :\n- Quelle piste est confirmée par le marché ?\n- Quelle piste était une illusion ?\n- Quelle compétence dois-je renforcer ?\n- Quelle est ma piste prioritaire ?\n\nLivrables :\n- 5 offres analysées\n- 3 pistes réalistes classées\n- 1 contact entreprise effectué\n- 1 priorité définie", position: 6 }
        ];
      }

      // OVERRIDE J4 with V2 Content
      if (i === 3) {
        missionData.title = "LE CHOIX";
        missionData.description = "De l’hésitation à l’engagement.";
        missionData.steps = [
            { category: "act1", title: "CONSCIENCE : Freins au Choix (30 min)", content: "Le but : Identifier les freins invisibles.\n\nQuestions IA :\n- Qu’est-ce qui me retient de choisir ?\n- Ai-je peur de me tromper ?\n- Est-ce que je cherche la certitude parfaite ?\n\nQuestion clé : Si je devais choisir aujourd’hui sans garantie, laquelle me ferait le moins regretter ?", position: 1 },
            { category: "act2", title: "STRUCTURE : Matrice Décision (45 min)", content: "Le but : Rendre le choix rationnel et visible.\n\nMatrice à 3 critères (Noter sur 10) :\nPiste | Attractivité (plaisir) | Faisabilité court terme | Potentiel revenus | Total\n\nRègle : Notation honnête basée sur les données du J3.\nL’IA demande : Si tu regardes uniquement les chiffres, quelle piste arrive en tête ?", position: 2 },
            { category: "act3", title: "BINÔME : Cohérence Énergétique (35 min)", content: "Le but : Feedback sur l'émotion.\n\nChaque participant explique ses notes.\nLe binôme observe :\n- Sur quelle piste as-tu le plus d’énergie ?\n- Où sembles-tu hésiter ?\n- Quelle piste paraît la plus alignée avec ta personnalité ?\n\nLe binôme doit choisir une piste pour la personne et justifier.", position: 3 },
            { category: "act4", title: "OUTIL : Miroir IA Objectivation (20 min)", content: "Le but : Trancher.\n\nPrompt :\n\"Voici ma matrice décision et le retour du binôme. Identifie la piste rationnellement prioritaire, la piste émotionnellement alignée, le risque principal et l’action la plus simple pour tester la piste n°1 sous 7 jours.\"\n\nL’IA génère : Classement clair + Argumentation logique.", position: 4 },
            { category: "act5", title: "ACTION : Engagement Immédiat (1h10)", content: "Le but : Engager le mouvement.\n\nMission obligatoire :\n1. Choisir 2 pistes prioritaires maximum.\n2. Définir pour chacune : 1 action sous 72h / 1 action sous 7 jours (Ex: Envoyer 3 candidatures, Contacter un pro).\n3. Écrire publiquement dans le groupe : \"Je m’engage à…\"", position: 5 },
            { category: "act6", title: "INTÉGRATION : Assumer la Direction (30 min)", content: "Questions IA finales :\n- Si je ne change rien, que se passe-t-il ?\n- Est-ce que j’accepte que choisir = avancer ?\n\nPhrase à compléter : Je choisis cette direction parce que…\n\nLivrables :\n- Matrice décision complète\n- 2 axes prioritaires validés\n- Plan d’action 7 jours\n- Engagement écrit", position: 6 }
        ];
      }

      // OVERRIDE J5 with V2 Content
      if (i === 4) {
        missionData.title = "LA CIBLE RÉELLE";
        missionData.description = "Je ne peux pas aider tout le monde.";
        missionData.steps = [
            { category: "act1", title: "CONSCIENCE : Pourquoi je reste flou ? (30 min)", content: "Le but : Identifier la peur derrière le manque de précision.\n\nQuestions IA :\n- Pourquoi ai-je tendance à rester généraliste ?\n- Ai-je peur d’exclure des opportunités ?\n- Si je devais choisir un seul type d’entreprise, lequel me ressemble le plus ?\n\nQuestion clé : Être vague me protège de quoi ?", position: 1 },
            { category: "act2", title: "STRUCTURE : Profil Cible (45 min)", content: "Le but : Définir une cible professionnelle précise.\n\nCanevas obligatoire :\nType d’entreprise | Taille | Secteur | Problème principal | Compétences recherchées | Culture\n\nL’IA demande : Si tu devais décrire cette cible comme une personne, comment serait-elle ?", position: 2 },
            { category: "act3", title: "BINÔME : Cohérence (35 min)", content: "Le but : Feedback sur la précision.\n\nLe participant présente sa cible.\nLe binôme répond :\n- Est-ce cohérent avec ton énergie ?\n- Est-ce crédible ?\n- Est-ce trop large ?\n- Si tu devais réduire encore, que garderais-tu ?", position: 3 },
            { category: "act4", title: "OUTIL : Miroir IA Positionnement (25 min)", content: "Le but : Valider la stratégie.\n\nPrompt :\n\"Voici mes forces, ma cible définie et le feedback du binôme. Reformule mon positionnement en 3 phrases claires. Identifie si ma cible est trop large.\"\n\nL’IA produit : Positionnement clair + Ajustement si besoin.", position: 4 },
            { category: "act5", title: "ACTION : Test Terrain (1h05)", content: "Le but : Tester la cible et le message.\n\n1. Adapter son pitch spécifiquement à la cible (Ex: \"J'aide les PME à structurer...\").\n2. Envoyer ce message à une entreprise ciblée ou un contact.\n3. Question clé : \"Ce message vous semble-t-il pertinent pour votre secteur ?\"", position: 5 },
            { category: "act6", title: "INTÉGRATION : Assumer la Précision (30 min)", content: "Questions IA :\n- Ma cible est-elle plus claire qu’hier ?\n- Est-ce que la précision me rassure ou m’inquiète ?\n\nPhrase à compléter : Je m’adresse désormais à…\n\nLivrables :\n- Cible définie précisément\n- Positionnement clair\n- Message adapté\n- 1 test terrain effectué", position: 6 }
        ];
      }

      // OVERRIDE J6 with V2 Content
      if (i === 5) { // J8 in data array index 5 (because weekend skipped) -> actually J6 in new numbering? 
        // Wait, index mapping is: 0->J1, 1->J2, 2->J3, 3->J4, 4->J5.
        // Original data has 14 items.
        // Index 5 corresponds to Day 8 in original data (weekend skipped).
        // BUT the user input says "JOUR 6".
        // Let's stick to the mapping: The user provides content for J6, J7, J8.
        // We need to map them correctly.
        // My previous mapping was: [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18]
        // This mapping skips weekends (6,7 and 13,14).
        // So:
        // Index 5 -> Day 8 (Monday W2) -> User calls it "JOUR 6" ?
        // Wait, if the user wants J6, J7, J8... does he mean continuous days?
        // Or does he mean "Content Day 6" which happens on Calendar Day 8?
        // Let's look at the titles.
        // User J6 Title: "L’OFFRE VISUELLE" -> Matches Original J8 "L’OFFRE VISUELLE"
        // User J7 Title: "LA VISIBILITÉ" -> Matches Original J9 "LA VISIBILITÉ"
        // User J8 Title: "LA COMMUNAUTÉ" -> Matches Original J10 "LA COMMUNAUTÉ"
        
        // So the user is renaming the "Content Days" to be continuous (1 to 14) but they will be placed on Calendar Days (skipping weekends).
        // Content J6 will go to Calendar Day 8.
        
        missionData.title = "L’OFFRE VISUELLE";
        missionData.description = "Je rends mon projet réel.";
        missionData.steps = [
            { category: "act1", title: "CONSCIENCE : Qu'est-ce qu'une offre ? (30 min)", content: "Le but : Comprendre qu’une offre = solution à un problème précis.\n\nQuestions IA :\n- Quel problème concret ma cible rencontre-t-elle ?\n- Quelle conséquence si ce problème n’est pas réglé ?\n- Si je devais simplifier au maximum, j’aide qui à faire quoi ?\n\nQuestion clé : Est-ce que je parle de moi… ou du problème de ma cible ?", position: 1 },
            { category: "act2", title: "STRUCTURE : L'Offre en 5 lignes (45 min)", content: "Le but : Rendre l’offre simple et lisible.\n\nStructure obligatoire :\nJ’aide [cible] À résoudre [problème] Grâce à [compétence] Pour obtenir [résultat] Dans un cadre [contexte].\n\nL’IA reformule jusqu’à ce que ce soit simple, clair, sans jargon.", position: 2 },
            { category: "act3", title: "BINÔME : Test de Clarté (35 min)", content: "Le but : Feedback immédiat.\n\nLe participant lit son offre.\nLe binôme répond :\n- As-tu compris immédiatement ?\n- Est-ce spécifique ?\n- Est-ce crédible ?\n\nInterdiction de dire \"c’est bien\". Feedback factuel.", position: 3 },
            { category: "act4", title: "OUTIL : Miroir IA Simplification (25 min)", content: "Le but : Impact maximal.\n\nPrompt :\n\"Voici mon offre en 5 lignes et le feedback. Simplifie, supprime le vague, renforce la crédibilité.\"\n\nL’IA produit : Version optimisée + Version ultra courte (1 phrase).", position: 4 },
            { category: "act5", title: "ACTION : Test Extérieur (1h05)", content: "Le but : Confronter l’offre au réel.\n\nEnvoyer l’offre courte à un contact pro / entreprise / ex-collègue.\nQuestion clé : \"Si vous lisiez cette proposition, seriez-vous intéressé pour en savoir plus ?\"\n\nPreuve d'envoi obligatoire.", position: 5 },
            { category: "act6", title: "INTÉGRATION : Rendre le projet tangible (30 min)", content: "Questions IA :\n- Mon offre est-elle plus claire qu’hier ?\n- Quelle version est la plus impactante ?\n\nPhrase à compléter : Mon projet devient réel parce que…\n\nLivrables :\n- Offre claire en 5 lignes\n- Version ultra courte\n- 1 feedback externe réel", position: 6 }
        ];
      }

      // OVERRIDE J7 with V2 Content
      if (i === 6) { // Calendar Day 9
        missionData.title = "LA VISIBILITÉ";
        missionData.description = "J’existe publiquement.";
        missionData.steps = [
            { category: "act1", title: "CONSCIENCE : La peur d'être vu (30 min)", content: "Le but : Identifier les freins psychologiques.\n\nQuestions IA :\n- Qu’est-ce qui m’empêche de me montrer ?\n- Ai-je peur du jugement ?\n- Est-ce que je confonds visibilité et exposition personnelle ?\n\nQuestion clé : L’invisibilité me protège de quoi ?", position: 1 },
            { category: "act2", title: "STRUCTURE : Profil Optimisé (45 min)", content: "Le but : Rendre son positionnement visible.\n\nChoisir 1 plateforme (LinkedIn, CV, Facebook Pro).\nStructure : Photo pro, Titre clair, Offre en 1 phrase, Compétences clés, Appel à contact.\n\nL’IA reformule pour : Clarté, Simplicité, Impact.", position: 2 },
            { category: "act3", title: "BINÔME : Test de Lisibilité (35 min)", content: "Le but : Vérifier l'impact.\n\nLe binôme analyse le profil :\n- Comprends-tu immédiatement ce que je propose ?\n- Est-ce crédible ?\n- Est-ce que tu aurais envie de me parler ?\n\nFeedback factuel.", position: 3 },
            { category: "act4", title: "OUTIL : Miroir IA Optimisation (20 min)", content: "Le but : Stratégie.\n\nPrompt :\n\"Voici mon profil. Optimise le titre, rends l’offre plus percutante, simplifie la description.\"\n\nL’IA génère : Version optimisée + Version ultra courte + 3 améliorations.", position: 4 },
            { category: "act5", title: "ACTION : Visibilité Réelle (1h10)", content: "Le but : Créer une trace publique.\n\nMission : Poster une présentation OU Envoyer un message à 3 contacts.\nMessage type : \"Je développe mon positionnement [offre]. Si vous connaissez des entreprises...\"\n\nObjectif : Pas de demande d'emploi, mais exploration.", position: 5 },
            { category: "act6", title: "INTÉGRATION : Passage à l'existence (30 min)", content: "Questions IA :\n- Est-ce que je me sens plus légitime ?\n- Est-ce que le fait d’être visible change mon énergie ?\n\nPhrase : Aujourd’hui, j’existe parce que…\n\nLivrables :\n- Profil optimisé\n- 1 publication ou 3 messages\n- Positionnement assumé", position: 6 }
        ];
      }

      // OVERRIDE J8 with V2 Content
      if (i === 7) { // Calendar Day 10
        missionData.title = "LA COMMUNAUTÉ";
        missionData.description = "Je ne suis plus seul.";
        missionData.steps = [
            { category: "act1", title: "CONSCIENCE : L'illusion de solitude (30 min)", content: "Le but : Comprendre que l’isolement est souvent une posture.\n\nQuestions IA :\n- Pourquoi je cherche seul ?\n- Est-ce que je demande de l'aide ?\n- Qui pourrait m’aider si j’osais demander ?\n\nQuestion clé : Est-ce que mon isolement est un fait… ou une posture ?", position: 1 },
            { category: "act2", title: "STRUCTURE : Carte Réseau (45 min)", content: "Le but : Rendre visible le réseau existant.\n\nCréer une carte en 4 cercles : Proches, Anciens collègues, Connaissances, À créer.\nObjectif : Identifier min. 10 personnes ressources.\nL'IA aide à trouver des idées (Fournisseurs, Clients, Asso...).", position: 2 },
            { category: "act3", title: "BINÔME : Qualité du Réseau (35 min)", content: "Le but : Prioriser.\n\nLe binôme regarde la carte :\n- Qui semble stratégique ?\n- Qui est sous-estimé ?\n- Qui choisirais-tu en priorité ?\n\nLivrable : Top 5 contacts prioritaires.", position: 3 },
            { category: "act4", title: "OUTIL : Miroir IA Stratégie (20 min)", content: "Le but : L'approche juste.\n\nPrompt :\n\"Voici mes 5 contacts. Propose une stratégie d’approche et un message simple pour chacun.\"\n\nL’IA génère : 3 messages prêts à envoyer.", position: 4 },
            { category: "act5", title: "ACTION : Activation (1h10)", content: "Le but : Enclencher la dynamique.\n\nMission : Contacter 3 personnes + Participer à 1 échange réel.\nObjectif : Demander Conseil / Retour / Info (pas un job).\n\nLivrable : Preuve des 3 contacts.", position: 5 },
            { category: "act6", title: "INTÉGRATION : Du Solo au Réseau (30 min)", content: "Questions IA :\n- Est-ce que je me sens encore isolé ?\n- Qui m’a surpris positivement ?\n\nPhrase : Je ne suis plus seul parce que…\n\nLivrables :\n- Carte réseau (10 noms)\n- Top 5 priorisés\n- 3 contacts activés", position: 6 }
        ];
      }

      // OVERRIDE J9 with V2 Content
      if (i === 8) { // Calendar Day 11
        missionData.title = "LE COURAGE DE PROPOSER";
        missionData.description = "Offrir n’est pas mendier.";
        missionData.steps = [
            { category: "act1", title: "CONSCIENCE : La peur de demander (30 min)", content: "Le but : Identifier les blocages internes.\n\nQuestions IA :\n- Ai-je peur du refus ?\n- Est-ce que je confonds proposition et mendicité ?\n- Si je reçois un \"non\", qu’est-ce que cela signifie ?\n\nQuestion clé : Est-ce que je demande un emploi… ou est-ce que j’offre une solution ?", position: 1 },
            { category: "act2", title: "STRUCTURE : Proposition Claire (45 min)", content: "Le but : Transformer son offre en proposition concrète.\n\nStructure :\nContexte / Problème identifié / Solution / Résultat / Proposition d'échange.\nEx : \"Je me positionne en tant que [poste]... Seriez-vous disponible pour un échange ?\"\n\nL’IA reformule pour : Clarté, Simplicité, Ton pro.", position: 2 },
            { category: "act3", title: "BINÔME : Test de Puissance (35 min)", content: "Le but : Renforcer l'assurance.\n\nLe binôme répond :\n- Est-ce que ça sonne comme une valeur ou une demande désespérée ?\n- Est-ce que tu accepterais un RDV ?\n\nLivrable : Feedback \"Puissance & Clarté\".", position: 3 },
            { category: "act4", title: "OUTIL : Miroir IA Renforcement (20 min)", content: "Le but : Optimisation commerciale.\n\nPrompt :\n\"Voici ma proposition. Rends-la plus directe et orientée résultat. Supprime toute trace de supplication.\"\n\nL’IA génère : Version concise + Version détaillée.", position: 4 },
            { category: "act5", title: "ACTION : Envoi Réel (1h10)", content: "Le but : Faire un envoi réel avant la fin de la session.\n\nMission : Envoyer la proposition à une entreprise OU Demander un RDV OU Répondre à une offre.\nObjectif : Pas de brouillon. Action réelle.\n\nLivrable : Preuve d'envoi.", position: 5 },
            { category: "act6", title: "INTÉGRATION : Assumer la Posture (30 min)", content: "Questions IA :\n- Qu’ai-je ressenti au moment d’envoyer ?\n- Est-ce que je me sens plus acteur ?\n\nPhrase : Aujourd’hui, j’ai osé…\n\nLivrables :\n- Proposition envoyée\n- Demande de RDV formulée\n- Preuve d’action réelle", position: 6 }
        ];
      }

      // OVERRIDE J10 with V2 Content
      if (i === 9) { // Calendar Day 12
        missionData.title = "LES CHIFFRES";
        missionData.description = "Dominer la machine à calculer.";
        missionData.steps = [
            { category: "act1", title: "CONSCIENCE : La peur des chiffres (30 min)", content: "Le but : Identifier la relation émotionnelle à l’argent.\n\nQuestions IA :\n- Est-ce que parler d’argent me met mal à l’aise ?\n- Ai-je déjà calculé précisément ce dont j’ai besoin ?\n\nQuestion clé : Si je ne maîtrise pas mes chiffres, qui les maîtrisera pour moi ?", position: 1 },
            { category: "act2", title: "STRUCTURE : Objectif Réel (45 min)", content: "Le but : Calculer un objectif réaliste.\n\nExercice obligatoire :\n1. Besoin mensuel net (charges incluses).\n2. Marge sécurité 15–20 %.\n3. Objectif brut à atteindre.\n\nL’IA aide à vérifier la cohérence et adapter selon le statut.", position: 2 },
            { category: "act3", title: "VOLUME D'ACTIONS (35 min)", content: "Le but : Comprendre que le revenu est mécanique.\n\nSimulation :\nSi 1 RDV sur 5 contacts -> 1 proposition sur 2 RDV -> 1 contrat sur 2 propositions.\nCombien de contacts pour atteindre l'objectif ?\n\nL’IA aide à simuler les scénarios.", position: 3 },
            { category: "act4", title: "MIROIR HUMAIN : Réalisme (20 min)", content: "Le but : Ajuster.\n\nLe binôme répond :\n- Est-ce que ton objectif est réaliste ?\n- Est-ce que ton volume d’actions est atteignable ?\n- Où es-tu optimiste / trop prudent ?\n\nLivrable : Ajustement chiffré validé.", position: 4 },
            { category: "act5", title: "ACTION : Plan 30 Jours (1h10)", content: "Le but : Transformer les chiffres en planning.\n\nMission : Définir le volume par semaine (Contacts / RDV / Heures).\nÉcrire : \"Chaque semaine je dois faire X contacts...\"\n\nLivrable : Plan 30 jours structuré.", position: 5 },
            { category: "act6", title: "INTÉGRATION : Du Flou au Contrôle (30 min)", content: "Questions IA :\n- Est-ce que les chiffres me rassurent ?\n- Est-ce que mon objectif est cohérent avec mes efforts ?\n\nPhrase : Je sais maintenant que pour atteindre X, je dois faire Y.\n\nLivrables :\n- Objectif mensuel/6 mois\n- Volume d’actions\n- Plan 30 jours", position: 6 }
        ];
      }

      // OVERRIDE J11 with V2 Content
      if (i === 10) { // Calendar Day 15 (Start of Week 3)
        missionData.title = "L’IDENTITÉ ASSUMÉE";
        missionData.description = "Je suis la bonne personne.";
        missionData.steps = [
            { category: "act1", title: "CONSCIENCE : Doute vs Légitimité (30 min)", content: "Le but : Identifier les doutes restants.\n\nQuestions IA :\n- Est-ce que je me sens légitime ?\n- Ai-je peur d’être \"démasqué\" ?\n- Si je devais me noter en assurance sur 10 ?\n\nQuestion clé : Est-ce que je confonds compétence et perfection ?", position: 1 },
            { category: "act2", title: "STRUCTURE : Pitch Assumé (45 min)", content: "Le but : Construire une présentation stable.\n\nStructure :\nQui je suis aujourd’hui / Ma valeur / Ma cible / Mon offre / Mon objectif.\n\nL’IA reformule pour : Fluidité, Cohérence, Simplicité. On élimine les excuses.", position: 2 },
            { category: "act3", title: "SIMULATION : Entretien #1 (35 min)", content: "Le but : Test à froid.\n\nLe binôme joue le recruteur (5 questions classiques : Parlez-moi de vous, Pourquoi vous, Faiblesses...).\nLe participant répond sans lecture.\n\nLivrable : Grille d’évaluation (Fluidité, Assurance, Cohérence).", position: 3 },
            { category: "act4", title: "OUTIL : Miroir IA Analyse (20 min)", content: "Le but : Ajustement précis.\n\nPrompt :\n\"Voici mes réponses et le feedback. Identifie les points forts et les incohérences. Reformule mes réponses de manière plus pro.\"\n\nL’IA génère : Réponses optimisées + 3 axes d’amélioration.", position: 4 },
            { category: "act5", title: "SIMULATION : Entretien #2 (1h10)", content: "Le but : Comparer la progression.\n\nLe participant refait une simulation complète.\nGrille comparative : Passage 1 vs Passage 2 sur Clarté/Assurance/Impact.\n\nLivrable : Comparatif progression.", position: 5 },
            { category: "act6", title: "INTÉGRATION : Posture Stabilisée (30 min)", content: "Questions IA :\n- Est-ce que je me sens plus stable ?\n- Si un entretien avait lieu demain, serais-je prêt ?\n\nPhrase : Je suis la bonne personne parce que…\n\nLivrables :\n- Pitch final assumé\n- Réponses entretien maîtrisées\n- Confiance mesurée", position: 6 }
        ];
      }

      // OVERRIDE J12 with V2 Content
      if (i === 11) { // Calendar Day 16
        missionData.title = "LA STRUCTURATION DIGITALE";
        missionData.description = "La machine travaille pour moi.";
        missionData.steps = [
            { category: "act1", title: "CONSCIENCE : Le Chaos Invisible (30 min)", content: "Le but : Identifier le désordre.\n\nQuestions IA :\n- Où je perds du temps ?\n- Est-ce que je relance systématiquement ?\n- Est-ce que je travaille par impulsion ou système ?\n\nQuestion clé : Est-ce que je compte sur ma mémoire ou sur une organisation ?", position: 1 },
            { category: "act2", title: "STRUCTURE : Outil Central (45 min)", content: "Le but : Créer un tableau de suivi.\n\nOutil : Excel/Sheets/Notion.\nColonnes : Date / Entreprise / Poste / Contact / Statut / Relance / Résultat.\nRègle : Chaque action doit être traçable.\n\nLivrable : Tableau créé.", position: 2 },
            { category: "act3", title: "STRUCTURE : CV & Profil (35 min)", content: "Le but : Aligner les outils.\n\nExercice :\n1. Adapter le titre au positionnement J6.\n2. Supprimer les éléments non alignés.\n3. Mettre en avant les compétences clés.\n\nL’IA reformule pour : Résultat, Quantification, Clarté.", position: 3 },
            { category: "act4", title: "AUTOMATISATION (20 min)", content: "Le but : Système minimal.\n\nActions : Alertes emploi, Rappels relance, Modèles messages.\nL'IA aide à créer : Modèle candidature, Modèle relance, Modèle demande RDV.\n\nLivrable : 3 modèles prêts.", position: 4 },
            { category: "act5", title: "ACTION : Activer le Système (1h10)", content: "Le but : Action réelle.\n\nMission :\n1. Entrer 3 candidatures dans le tableau.\n2. Programmer 1 relance.\n3. Envoyer 1 candidature via le système.\n\nLivrable : Tableau actif + Preuve envoi.", position: 5 },
            { category: "act6", title: "INTÉGRATION : Mode Professionnel (30 min)", content: "Questions IA :\n- Est-ce que je me sens plus structuré ?\n- Est-ce que je comprends que régularité > motivation ?\n\nPhrase : Ma recherche fonctionne maintenant comme un système parce que…\n\nLivrables :\n- Tableau actif\n- CV optimisé\n- 3 modèles messages\n- 1 candidature envoyée", position: 6 }
        ];
      }

      newMissions.push(missionData);
    }

    // 3. Insert new missions one by one (to get IDs for steps)
    for (const mission of newMissions) {
        // First, check if mission exists
        const { data: existingMission } = await supabase
            .from("mission_templates")
            .select("id")
            .eq("day_index", mission.day_index)
            .eq("program_type", mission.program_type)
            .single();

        let missionId = existingMission?.id;

        if (existingMission) {
            // Update existing mission
            await supabase
                .from("mission_templates")
                .update({
                    title: mission.title,
                    description: mission.description
                })
                .eq("id", existingMission.id);
            
            // Delete existing steps to replace them
            await supabase.from("mission_step_templates").delete().eq("mission_template_id", existingMission.id);
        } else {
            // Insert new mission
            const { data: insertedMission, error: missionError } = await supabase
                .from("mission_templates")
                .insert({
                    day_index: mission.day_index,
                    title: mission.title,
                    description: mission.description,
                    program_type: mission.program_type
                })
                .select()
                .single();
            
            if (missionError) {
                console.error("Error inserting mission:", missionError);
                continue;
            }
            missionId = insertedMission.id;
        }

        if (missionId && mission.steps) {
            const stepsToInsert = mission.steps.map((step: any, index: number) => ({
                mission_template_id: missionId,
                category: step.category,
                title: step.title,
                content: step.content,
                position: step.position || index + 1
            }));

            const { error: stepsError } = await supabase
                .from("mission_step_templates")
                .insert(stepsToInsert);
            
            if (stepsError) console.error("Error inserting steps:", stepsError);
        }
    }

    return { success: true };
  } catch (error) {
    console.error("Seed error:", error);
    return { success: false, error: JSON.stringify(error) };
  }
}
