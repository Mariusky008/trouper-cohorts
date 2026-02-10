"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getBuddyHistory() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // On cherche toutes les paires où je suis impliqué
    const { data: pairs, error } = await supabase
        .from("cohort_pairs")
        .select(`
            id,
            day_index,
            user1_id,
            user2_id,
            user1_memo,
            user2_memo,
            user1:user1_id (id, display_name, avatar_url),
            user2:user2_id (id, display_name, avatar_url)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("day_index", { ascending: false });

    if (error || !pairs) return [];

    // On formate pour ne renvoyer que le binôme et MON mémo
    return pairs.map(pair => {
        const isUser1 = pair.user1_id === user.id;
        const buddy = isUser1 ? pair.user2 : pair.user1;
        // Gérer le cas où le buddy a été supprimé (null)
        const safeBuddy = buddy || { id: "deleted", display_name: "Utilisateur supprimé", avatar_url: null };
        
        return {
            pair_id: pair.id,
            day_index: pair.day_index,
            buddy: safeBuddy,
            memo: isUser1 ? pair.user1_memo : pair.user2_memo
        };
    });
}

export async function updateBuddyMemo(pairId: string, memo: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // 1. On récupère la paire pour savoir si je suis user1 ou user2
    const { data: pair } = await supabase
        .from("cohort_pairs")
        .select("user1_id, user2_id")
        .eq("id", pairId)
        .single();

    if (!pair) throw new Error("Pair not found");

    const isUser1 = pair.user1_id === user.id;
    const isUser2 = pair.user2_id === user.id;

    if (!isUser1 && !isUser2) throw new Error("Not part of this pair");

    // 2. Update dynamique
    const updateData = isUser1 ? { user1_memo: memo } : { user2_memo: memo };

    const { error } = await supabase
        .from("cohort_pairs")
        .update(updateData)
        .eq("id", pairId);

    if (error) throw error;
    
    revalidatePath("/app/today");
}
