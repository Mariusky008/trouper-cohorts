"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addAdminByEmail(email: string) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    // 1. Vérifier que l'utilisateur actuel est admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non connecté" };

    const { data: isAdmin } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

    if (!isAdmin) return { error: "Non autorisé. Seul un admin peut en ajouter un autre." };

    // 2. Chercher l'utilisateur cible par email
    // Note: listUsers ne permet pas de filtrer par email directement de manière fiable via l'API publique JS sans pagination
    // Mais pour un MVP, on récupère les users (limite par défaut 50).
    // On va essayer de récupérer une page assez large.
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000
    });
    
    if (listError) {
        console.error("Erreur listUsers:", listError);
        // Debug info for the user
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "undefined";
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
        const keyDebug = key ? `${key.substring(0, 5)}... (${key.length} chars)` : "undefined";
        
        return { error: `Erreur technique (${listError.message}). URL: ${url}, Key: ${keyDebug}` };
    }
    
    const targetUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase().trim());

    if (!targetUser) {
        return { error: "Utilisateur introuvable. Cette personne doit d'abord se connecter/créer un compte sur l'application." };
    }

    // 3. Vérifier s'il est déjà admin
    const { data: existingAdmin } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", targetUser.id)
        .maybeSingle();

    if (existingAdmin) {
        return { error: "Cet utilisateur est déjà administrateur." };
    }

    // 4. Ajouter à la table admins
    const { error: insertError } = await supabase
        .from("admins")
        .insert({ user_id: targetUser.id });

    if (insertError) {
        console.error("Erreur insert admin:", insertError);
        return { error: "Erreur lors de l'ajout des droits admin." };
    }

    revalidatePath("/admin/settings");
    return { success: true, message: `${email} a été promu administrateur avec succès.` };
}

export async function removeAdmin(userId: string) {
    const supabase = await createClient();

    // 1. Vérifier que l'utilisateur actuel est admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non connecté" };

    const { data: isAdmin } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

    if (!isAdmin) return { error: "Non autorisé." };

    // Empêcher de se supprimer soi-même
    if (userId === user.id) {
        return { error: "Vous ne pouvez pas retirer vos propres droits. Demandez à un autre admin." };
    }

    const { error } = await supabase
        .from("admins")
        .delete()
        .eq("user_id", userId);

    if (error) return { error: "Erreur lors de la suppression." };

    revalidatePath("/admin/settings");
    return { success: true };
}
