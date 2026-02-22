"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getAllUsersForDropdown() {
  const supabaseAdmin = createAdminClient();
  
  // 1. Get profiles
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, display_name, email')
    .order('display_name', { ascending: true });

  if (error) {
    console.error("Error fetching profiles:", error);
    return [];
  }

  // 2. Format for dropdown
  // Note: we could also merge with Auth users if profiles are missing, 
  // but for a manual match tool, we usually want people who have at least a profile.
  return profiles.map(p => ({
    value: p.id,
    label: p.display_name || p.email || "Utilisateur inconnu"
  }));
}

export async function createManualMatch(formData: FormData) {
    const supabaseAdmin = createAdminClient();
    
    const user1_id = formData.get("user1_id") as string;
    const user2_id = formData.get("user2_id") as string;
    const date = formData.get("date") as string; // YYYY-MM-DD
    const time = formData.get("time") as string;
    const topic = formData.get("topic") as string || "Échange réseau : Présentez vos activités respectives.";

    if (!user1_id || !user2_id || !date) {
        return { error: "Veuillez remplir tous les champs obligatoires (utilisateurs et date)." };
    }

    if (user1_id === user2_id) {
        return { error: "Impossible de matcher un utilisateur avec lui-même." };
    }

    // Insert match
    const { error } = await supabaseAdmin
        .from('network_matches')
        .insert({
            user1_id,
            user2_id,
            date,
            time,
            status: 'pending',
            meeting_url: 'https://meet.google.com/new',
            topic
        });

    if (error) {
        console.error("Error creating match:", error);
        return { error: `Erreur base de données: ${error.message}` };
    }

    // Revalidate BOTH admin path AND dashboard paths where users see their matches
    revalidatePath('/admin/network');
    revalidatePath('/mon-reseau-local/dashboard'); 
    return { success: true };
}
