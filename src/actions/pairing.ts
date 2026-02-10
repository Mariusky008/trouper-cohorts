"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function generateDailyPairs(cohortId: string) {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    // 1. Récupérer les membres actifs
    const { data: members } = await supabase
        .from("cohort_members")
        .select("user_id")
        .eq("cohort_id", cohortId);

    if (!members || members.length < 2) return { error: "Pas assez de membres pour former une paire." };

    const userIds = members.map(m => m.user_id);

    // 2. Mélanger (Fisher-Yates Shuffle)
    for (let i = userIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [userIds[i], userIds[j]] = [userIds[j], userIds[i]];
    }

    // 3. Supprimer les paires existantes POUR CE JOUR
    await supabase.from("cohort_pairs").delete().eq("cohort_id", cohortId).eq("pair_date", today);

    // 4. Créer les paires
    const pairs = [];
    // On itère par pas de 2
    // Si pair (ex: 4) -> 0-1, 2-3. i va jusqu'à 2.
    // Si impair (ex: 3) -> 0-1. i va jusqu'à 0. Le dernier (2) reste.
    
    // Correction boucle pour ne pas déborder
    const limit = userIds.length - (userIds.length % 2); // Si 3 -> 2. Si 4 -> 4.
    
    for (let i = 0; i < limit; i += 2) {
        pairs.push({
            cohort_id: cohortId,
            pair_date: today,
            user1_id: userIds[i],
            user2_id: userIds[i+1],
            day_index: 0 // Idéalement calculer le vrai index jour
        });
    }

    // 5. Gérer le Trio (Impair)
    if (userIds.length % 2 !== 0) {
        const lastUser = userIds[userIds.length - 1];
        // On le rattache au premier du groupe (userIds[0]) qui est déjà en couple avec userIds[1]
        // Cela crée un trio : 0-1 et Last-0. (0 a deux binômes : 1 et Last).
        
        // Ou mieux : On le rattache à une paire existante de façon explicite ?
        // Non, le modèle de données ne permet que des paires.
        // Donc on crée une paire supplémentaire.
        
        const existingUser = userIds[0];
        
        pairs.push({
            cohort_id: cohortId,
            pair_date: today,
            user1_id: lastUser,
            user2_id: existingUser,
            day_index: 0
        });
    }

    const { error } = await supabase.from("cohort_pairs").insert(pairs);

    if (error) {
        console.error("Erreur pairing:", error);
        return { error: error.message };
    }
    
    revalidatePath(`/admin/cohorts/${cohortId}`);
    return { success: true };
}
