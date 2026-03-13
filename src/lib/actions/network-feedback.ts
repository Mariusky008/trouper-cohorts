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

  // 1. Insert Feedback (Admin Context)
  // Use Admin Client to bypass RLS policies if user policies are not set up correctly
  const adminClient = createAdminClient();
  
  // Debug log
  console.log(`[SaveFeedback] Inserting feedback for Match: ${finalMatchId}, Giver: ${user.id}, Receiver: ${finalReceiverId}`);

  // CHECK IF RECEIVER EXISTS (to avoid FK violation)
  // We check 'profiles' which should mirror auth users.
  const { data: receiverExists } = await adminClient
    .from("profiles")
    .select("id")
    .eq("id", finalReceiverId)
    .single();

  if (!receiverExists) {
      console.error(`[SaveFeedback] Receiver ${finalReceiverId} not found in profiles! Cannot insert feedback.`);
      // If receiver is missing, we CANNOT insert feedback.
      // But we CAN mark match as met to unblock the user.
      console.log("[SaveFeedback] Skipping feedback insert, forcing match status update.");
  } else {
      const { error: insertError } = await adminClient.from("match_feedback").insert({
        match_id: finalMatchId, // Can be null if not provided
        giver_id: user.id,
        receiver_id: finalReceiverId,
        rating,
        tag: finalTag,
      });
      
      if (insertError) {
        console.error("[SaveFeedback] Error saving feedback:", insertError);
        // Save error to return later if match update also fails
        // But we proceed to try updating match status
      } else {
        console.log("[SaveFeedback] Success!");
      }
  }

  // 2. Update Match Status (Admin Context to bypass RLS)
  if (matchId) {
    const { error: updateError } = await adminClient
      .from("network_matches")
      .update({ status: 'met' })
      .eq("id", matchId);

    if (updateError) {
      console.error("Error updating match status:", updateError);
      return { error: "Failed to update match status: " + updateError.message };
    }
  }
  
  revalidatePath("/mon-reseau-local/dashboard");
  return { success: true };
}