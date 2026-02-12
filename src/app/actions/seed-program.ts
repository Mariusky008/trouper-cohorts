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

      newMissions.push(missionData);
    }

    // 3. Insert new missions one by one (to get IDs for steps)
    for (const mission of newMissions) {
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

        if (insertedMission && mission.steps) {
            const stepsToInsert = mission.steps.map((step: any, index: number) => ({
                mission_template_id: insertedMission.id,
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
