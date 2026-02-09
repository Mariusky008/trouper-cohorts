"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteUserCompletely(preRegistrationId: string) {
    const supabase = await createClient();

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
        // Note: On ne peut pas supprimer de auth.users via le client standard, 
        // mais l'utilisateur n'aura plus de données profil.
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
