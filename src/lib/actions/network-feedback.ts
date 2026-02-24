"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveMatchFeedback(receiverId: string, rating: number, tag: string) {
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

  // Refresh connections page to show the new badge
  revalidatePath("/mon-reseau-local/dashboard/connections"); 
  return { success: true };
}