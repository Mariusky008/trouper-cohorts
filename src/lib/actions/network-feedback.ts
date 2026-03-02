"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveMatchFeedback(receiverId: string, rating: number, tag: string, matchId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Non connecté" };

  const { error } = await supabase
    .from("match_feedback")
    .insert({
      giver_id: user.id,
      receiver_id: receiverId,
      rating: rating,
      tag: tag
    });

  if (error) {
    console.error("Error saving feedback:", error);
    return { error: "Erreur lors de l'enregistrement" };
  }

  // If matchId is provided, mark the match as completed ('met')
  if (matchId) {
      const { error: updateError } = await supabase
        .from("network_matches")
        .update({ status: 'met' })
        .eq("id", matchId);
      
      if (updateError) console.error("Error updating match status:", updateError);
  }

  // Refresh connections page and dashboard
  revalidatePath("/mon-reseau-local/dashboard/connections"); 
  revalidatePath("/mon-reseau-local/dashboard"); 
  return { success: true };
}