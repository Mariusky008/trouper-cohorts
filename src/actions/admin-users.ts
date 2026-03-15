"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function deleteUserCompletely(idOrPreRegId: string) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    // Vérifier Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non autorisé" };

    // 1. Déterminer si l'ID passé est un ID Auth ou un ID de pré-inscription
    // On essaie d'abord de voir si c'est une pré-inscription
    const { data: preReg } = await supabase
        .from("pre_registrations")
        .select("id, user_id")
        .or(`id.eq.${idOrPreRegId},user_id.eq.${idOrPreRegId}`)
        .maybeSingle();

    // Logique:
    // - Si on a trouvé une preReg, on prend son user_id.
    // - Si on n'a pas trouvé de preReg, on suppose que l'ID passé EST l'ID Auth (si format UUID)
    const authUserId = preReg?.user_id || (idOrPreRegId.length === 36 ? idOrPreRegId : null);
    const preRegistrationId = preReg?.id || (idOrPreRegId.length === 36 ? null : idOrPreRegId); // Si pas UUID, c'est peut-être un vieil ID de preReg

    console.log("Suppression demandée:", { idOrPreRegId, authUserId, preRegistrationId });

    let authDeleted = false;

    // 2. SUPPRESSION AUTH (Si ID Auth trouvé)
    if (authUserId) {
        // La base de données est configurée en CASCADE, donc tout le reste (profiles, missions, etc.) sera supprimé automatiquement.
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
        
        if (authError) {
            console.error("Erreur suppression Auth:", authError);
            // Si l'utilisateur n'existe pas (déjà supprimé), on continue pour nettoyer la pré-inscription
            if (!authError.message.includes("User not found")) {
                 return { error: `Erreur Auth: ${authError.message}` };
            }
        } else {
            authDeleted = true;
        }
    }

    // 3. Supprimer de pre_registrations (Si ID Pré-reg trouvé)
    if (preRegistrationId) {
        const { error } = await supabase.from("pre_registrations").delete().eq("id", preRegistrationId);
        if (error) {
            console.error("Erreur suppression user (pre_reg):", error);
            // On ne bloque pas si c'est juste la pré-reg qui échoue
        }
    }
    
    // 4. Fallback ultime : Si on a supprimé Auth mais qu'il reste peut-être une pré-inscription orpheline avec cet user_id
    if (authUserId && !preRegistrationId) {
         await supabase.from("pre_registrations").delete().eq("user_id", authUserId);
    }

    revalidatePath("/admin/members");
    revalidatePath("/admin/network");
    return { success: true };
}
