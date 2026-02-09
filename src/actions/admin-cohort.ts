"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteCohort(cohortId: string) {
    const supabase = await createClient();

    // Vérifier si l'utilisateur est admin (sécurité supplémentaire)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    // Suppression de la cohorte
    // Grâce aux contraintes ON DELETE CASCADE (si configurées), 
    // ça devrait supprimer les cohort_members et cohort_missions.
    // Sinon, on le fait manuellement par sécurité.
    
    // 1. Supprimer les membres
    await supabase.from("cohort_members").delete().eq("cohort_id", cohortId);
    
    // 2. Supprimer les missions générées
    await supabase.from("missions").delete().eq("cohort_id", cohortId);
    
    // 3. Supprimer les paires
    await supabase.from("cohort_pairs").delete().eq("cohort_id", cohortId);

    // 4. Supprimer la cohorte elle-même
    const { error } = await supabase.from("cohorts").delete().eq("id", cohortId);

    if (error) {
        console.error("Erreur suppression cohorte:", error);
        return { error: "Impossible de supprimer la cohorte." };
    }

    revalidatePath("/admin/cohorts");
    return { success: true };
}

export async function removeMemberFromCohort(userId: string, cohortId: string) {
    const supabase = await createClient();

    // 1. Retirer de cohort_members
    const { error } = await supabase
        .from("cohort_members")
        .delete()
        .eq("user_id", userId)
        .eq("cohort_id", cohortId);

    if (error) return { error: "Erreur lors du retrait du membre." };

    // 2. Mettre à jour pre_registrations pour dire qu'il n'a plus de cohorte
    // (Optionnel : on pourrait le remettre en 'pending' ou le laisser 'approved' mais sans cohorte)
    await supabase
        .from("pre_registrations")
        .update({ assigned_cohort_id: null })
        .eq("user_id", userId);

    // 2b. Cas des membres "invités" (pas encore de user_id dans auth)
    // On utilise leur ID de pre_registration si user_id est null
    // (Cette logique dépend de comment on passe l'ID, ici on assume userId est l'UUID auth ou l'ID pre_reg)
    // Pour être sûr, on essaie de update par ID pre_registration aussi si c'est un UUID
    await supabase
        .from("pre_registrations")
        .update({ assigned_cohort_id: null })
        .eq("id", userId); // Si userId match l'ID de pre_reg

    revalidatePath(`/admin/cohorts/${cohortId}`);
    return { success: true };
}
