"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function fixProgramStructure() {
    try {
        const supabase = await createClient();
        console.log("🛠️ Démarrage de la restructuration du programme...");

        // 1. Récupérer tous les templates existants ordonnés
        const { data: templates } = await supabase
            .from("mission_templates")
            .select("*")
            .order("day_index", { ascending: true });

        // 2. Vérifier si le J9 est déjà le bon
        const j9 = templates?.find(t => t.day_index === 9);
        const isJ9Correct = j9?.title === "PROSPECTION TERRAIN";

        if (isJ9Correct) {
            return { success: true, message: "✅ Le J9 est déjà correct. Aucune modification nécessaire." };
        }

        // 3. Si J9 existe mais n'est pas le bon, il faut TOUT décaler à partir de J9
        if (j9 && !isJ9Correct) {
            console.log("⚠️ Décalage nécessaire des jours 9+...");
            const toShift = templates!.filter(t => t.day_index >= 9).reverse();
            
            for (const t of toShift) {
                await supabase
                    .from("mission_templates")
                    .update({ day_index: t.day_index + 1 })
                    .eq("id", t.id);
            }
        }

        // 4. Insérer le J9 PROPRE
        console.log("✨ Insertion du J9 'PROSPECTION TERRAIN'...");
        const { data: newJ9, error } = await supabase
            .from("mission_templates")
            .insert({
                day_index: 9,
                title: "PROSPECTION TERRAIN",
                description: "Aujourd’hui, on sort du digital pour aller rencontrer des prospects en face à face.",
                proof_type: "url",
                mission_type: "solo"
            })
            .select()
            .single();

        if (error) throw error;

        if (newJ9) {
            // Insérer les étapes
            const steps = [
                { content: 'Liste 3 lieux physiques où se trouvent tes clients idéaux (cafés, coworkings, salons...).', category: 'intellectual', position: 1 },
                { content: 'Prépare mentalement ce que tu vas dire en 30 secondes (Pitch).', category: 'intellectual', position: 2 },
                { content: 'Va sur les 3 lieux et parle à au moins 1 personne par lieu.', category: 'social', position: 3 },
                { content: 'Observe les réactions : objections, compliments, intérêt.', category: 'intellectual', position: 4 },
                { content: 'Appelle ton binôme et raconte ton expérience.', category: 'social', position: 5 },
                { content: 'Partage une vidéo/photo "Mon premier contact terrain".', category: 'creative', position: 6 }
            ];

            await supabase.from("mission_step_templates").insert(
                steps.map(s => ({ ...s, mission_template_id: newJ9.id }))
            );
        }

        revalidatePath("/admin/program");
        return { success: true, message: "🚀 Programme mis à jour avec succès (J9 inséré)." };

    } catch (e: any) {
        console.error("Erreur setup:", e);
        return { success: false, error: e.message };
    }
}
