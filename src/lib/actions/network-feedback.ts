"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function saveMatchFeedback(
  receiverId: string,
  rating: number,
  tag: string,
  matchId?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  // 1. Insert Feedback (User Context)
  const { error } = await supabase.from("match_feedback").insert({
    match_id: matchId, // Can be null if not provided
    giver_id: user.id,
    receiver_id: receiverId,
    rating,
    tag,
  });

  if (error) {
    console.error("Error saving feedback:", error);
    return { error: error.message };
  }

  // 2. Update Match Status (Admin Context to bypass RLS)
  if (matchId) {
    const adminClient = createAdminClient();
    const { error: updateError } = await adminClient
      .from("network_matches")
      .update({ status: 'met' })
      .eq("id", matchId);

    if (updateError) {
      console.error("Error updating match status:", updateError);
      // We don't return error here as feedback was saved successfully
    }
  }

  revalidatePath("/mon-reseau-local/dashboard");
  return { success: true };
}