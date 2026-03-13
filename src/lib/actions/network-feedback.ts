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

  // 0. Handle Virtual IDs (Founder Match / Teasers)
  let finalReceiverId = receiverId;
  let finalMatchId = matchId;
  let finalTag = tag;

  // If this is a Founder Match (virtual ID 'popey-founder'), we treat it as a self-feedback
  if (receiverId === 'popey-founder') {
      finalReceiverId = user.id; // Self-reference
      // Ensure tag reflects it was a founder match if generic "completed" was passed
      if (tag === 'completed' || tag === 'bof' || tag === 'bien' || tag === 'top') {
          finalTag = `founder_rescue:${tag}`; 
      }
  }

  // If matchId is a virtual string (not a UUID), set to null
  // UUID regex check
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (matchId && !uuidRegex.test(matchId)) {
      finalMatchId = undefined; // Set to undefined/null for DB
  }

  // 1. Insert Feedback (User Context)
  const { error } = await supabase.from("match_feedback").insert({
    match_id: finalMatchId, // Can be null if not provided
    giver_id: user.id,
    receiver_id: finalReceiverId,
    rating,
    tag: finalTag,
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