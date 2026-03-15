"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Type definition for a network search request

export interface NetworkSearch {
    id: string;
    user_id: string;
    title: string;
    description: string;
    category: 'service' | 'recruitment' | 'venue' | 'other';
    created_at: string;
    // Joined user data
    user_display_name?: string;
    user_avatar_url?: string;
    user_trade?: string;
    user_city?: string;
}

export async function createNetworkSearch(data: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, error: "Non authentifié" };

    const title = data.get("title") as string;
    const description = data.get("description") as string;
    const category = (data.get("category") as any) || 'other';

    if (!title || !description) {
        return { success: false, error: "Champs requis manquants" };
    }

    const { error } = await supabase.from("network_requests").insert({
        user_id: user.id,
        title,
        description,
        category
    });

    if (error) {
        console.error("Error creating search:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/mon-reseau-local/dashboard/offers");
    return { success: true };
}

export async function getNetworkSearches(): Promise<NetworkSearch[]> {
    const supabase = await createClient();
    
    // Fetch requests and join with profiles
    const { data, error } = await supabase
        .from("network_requests")
        .select(`
            *,
            profiles:user_id (
                display_name,
                avatar_url,
                trade,
                city
            )
        `)
        .order("created_at", { ascending: false })
        .limit(50); // Limit to recent 50

    if (error) {
        console.error("Error fetching searches:", error);
        return [];
    }

    // Map to flatten structure
    return data.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        title: item.title,
        description: item.description,
        category: item.category,
        created_at: item.created_at,
        user_display_name: item.profiles?.display_name || "Membre Inconnu",
        user_avatar_url: item.profiles?.avatar_url,
        user_trade: item.profiles?.trade,
        user_city: item.profiles?.city
    }));
}

export async function deleteNetworkSearch(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, error: "Non authentifié" };

    console.log(`Tentative de suppression de l'annonce ${id} par l'utilisateur ${user.id}`);

    const { error, count } = await supabase
        .from("network_requests")
        .delete({ count: 'exact' }) // Count deleted rows
        .eq("id", id)
        .eq("user_id", user.id); // Ensure ownership

    if (error) {
        console.error("Erreur lors de la suppression de l'annonce:", error);
        return { success: false, error: error.message };
    }

    if (count === 0) {
        console.warn(`Tentative de suppression échouée: Annonce ${id} introuvable ou non autorisée pour ${user.id}`);
        return { success: false, error: "Annonce introuvable ou vous n'êtes pas le propriétaire." };
    }

    console.log("Annonce supprimée avec succès.");

    revalidatePath("/mon-reseau-local/dashboard/offers");
    revalidatePath("/mon-reseau-local/dashboard"); // Aussi rafraîchir le dashboard principal si affiché là
    return { success: true };
}
