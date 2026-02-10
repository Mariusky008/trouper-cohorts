"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function deleteUserCompletely(preRegistrationId: string) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    // Vérifier Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non autorisé" };

    // 1. Récupérer le user_id Auth associé (s'il existe)
    const { data: preReg } = await supabase
        .from("pre_registrations")
        .select("user_id")
        .eq("id", preRegistrationId)
        .single();

    const authUserId = preReg?.user_id;

    if (authUserId) {
        // Nettoyage des données liées au compte actif
        await supabase.from("cohort_members").delete().eq("user_id", authUserId);
        await supabase.from("cohort_pairs").delete().or(`user1_id.eq.${authUserId},user2_id.eq.${authUserId}`);
        await supabase.from("missions").delete().eq("user_id", authUserId);
        await supabase.from("proofs").delete().eq("user_id", authUserId); // Nettoyage Mur Victoires
        await supabase.from("profiles").delete().eq("id", authUserId); // Profil public

        // SUPPRESSION AUTH (IRRÉVERSIBLE)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
        if (authError) {
            console.error("Erreur suppression Auth:", authError);
            // On continue quand même pour nettoyer le reste
        }
    }

    // 2. Supprimer de pre_registrations (C'est la fiche "maître")
    const { error } = await supabase.from("pre_registrations").delete().eq("id", preRegistrationId);

    if (error) {
        console.error("Erreur suppression user:", error);
        return { error: "Erreur lors de la suppression." };
    }

    revalidatePath("/admin/members");
    return { success: true };
}
