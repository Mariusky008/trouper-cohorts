"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getBuddyHistory() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // 1. Récupérer les paires BRUTES (sans jointure complexe qui peut échouer)
    const { data: pairs, error } = await supabase
        .from("cohort_pairs")
        .select("id, day_index, user1_id, user2_id, user1_memo, user2_memo")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("day_index", { ascending: false });

    if (error || !pairs || pairs.length === 0) return [];

    // 2. Récupérer les IDs des binômes
    const buddyIds = pairs.map(p => p.user1_id === user.id ? p.user2_id : p.user1_id);
    const uniqueBuddyIds = Array.from(new Set(buddyIds));

    // 3. Récupérer les profils de ces binômes
    const { data: profiles } = await supabase
        .from("profiles") // Ou pre_registrations selon ce qu'on utilise comme source de vérité
        .select("id, display_name, avatar_url") // Assurez-vous que ces colonnes existent dans profiles
        .in("id", uniqueBuddyIds);
    
    // Fallback sur pre_registrations si profiles est vide ou incomplet (car on utilise souvent pre_reg comme profil)
    const { data: preRegs } = await supabase
        .from("pre_registrations")
        .select("user_id, first_name, last_name")
        .in("user_id", uniqueBuddyIds);

    // 4. Assembler
    return pairs.map(pair => {
        const isUser1 = pair.user1_id === user.id;
        const buddyId = isUser1 ? pair.user2_id : pair.user1_id;
        
        // Chercher dans profiles ou preRegs
        const profile = profiles?.find(p => p.id === buddyId);
        const preReg = preRegs?.find(p => p.user_id === buddyId);
        
        let buddyDisplay = {
            id: buddyId,
            display_name: "Utilisateur inconnu",
            avatar_url: null as string | null
        };

        if (profile) {
            buddyDisplay.display_name = profile.display_name || "Membre";
            buddyDisplay.avatar_url = profile.avatar_url;
        } else if (preReg) {
            buddyDisplay.display_name = `${preReg.first_name} ${preReg.last_name}`.trim();
        }

        return {
            pair_id: pair.id,
            day_index: pair.day_index || 0, // Fallback si null
            buddy: buddyDisplay,
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
