"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

type PartnerMissionResult = "completed" | "super_completed" | "not_completed";
type MissionOutcomeStatus = "mission_completed" | "mission_super_completed" | "mission_refused" | "call_absent";
type ValidationSource = "self" | "peer_auto" | "peer_confirmed";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const mapOutcomeFromMission = (
  callHappened: boolean,
  missionResult: PartnerMissionResult
): MissionOutcomeStatus => {
  if (!callHappened) return "call_absent";
  if (missionResult === "super_completed") return "mission_super_completed";
  if (missionResult === "not_completed") return "mission_refused";
  return "mission_completed";
};

const mapLegacyFeedback = (
  callHappened: boolean,
  missionResult: PartnerMissionResult
): { rating: number; tag: string } => {
  if (!callHappened) return { rating: 0, tag: "absence" };
  if (missionResult === "super_completed") return { rating: 5, tag: "mission_super" };
  if (missionResult === "not_completed") return { rating: 2, tag: "mission_refused" };
  return { rating: 4, tag: "mission_completed" };
};

const mapOutcomeFromStoredReview = (review: {
  call_happened: boolean;
  mission_result: "completed" | "super_completed" | "not_completed" | "missed_call";
}): MissionOutcomeStatus => {
  if (!review.call_happened || review.mission_result === "missed_call") return "call_absent";
  if (review.mission_result === "super_completed") return "mission_super_completed";
  if (review.mission_result === "not_completed") return "mission_refused";
  return "mission_completed";
};

const revalidateMissionPaths = (userId: string, partnerId: string) => {
  revalidatePath("/mon-reseau-local/dashboard");
  revalidatePath("/app/today");
  revalidatePath("/mon-reseau-local/dashboard/profile");
  revalidatePath(`/mon-reseau-local/dashboard/profile/${userId}`);
  revalidatePath(`/mon-reseau-local/dashboard/profile/${partnerId}`);
};

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

export async function completeMatchMission({
  matchId,
  receiverId,
  callHappened,
  missionResult,
  opportunityType,
  opportunityDetails,
}: {
  matchId: string;
  receiverId: string;
  callHappened: boolean;
  missionResult: PartnerMissionResult;
  opportunityType?: string;
  opportunityDetails?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  if (!matchId || !UUID_REGEX.test(matchId)) {
    return { error: "Match invalide" };
  }

  if (!receiverId || !UUID_REGEX.test(receiverId)) {
    const legacy = mapLegacyFeedback(callHappened, missionResult);
    return saveMatchFeedback(receiverId, legacy.rating, legacy.tag, matchId);
  }

  const fallbackToLegacy = async (targetReceiverId: string) => {
    const legacy = mapLegacyFeedback(callHappened, missionResult);
    return saveMatchFeedback(targetReceiverId, legacy.rating, legacy.tag, matchId);
  };

  const adminClient = createAdminClient();

  const { data: match, error: matchError } = await adminClient
    .from("network_matches")
    .select("id, user1_id, user2_id")
    .eq("id", matchId)
    .single();

  if (matchError || !match) {
    return { error: "Match introuvable" };
  }

  const isParticipant = match.user1_id === user.id || match.user2_id === user.id;
  if (!isParticipant) {
    return { error: "Action non autorisée" };
  }

  const expectedPartnerId = match.user1_id === user.id ? match.user2_id : match.user1_id;
  const finalReceiverId = expectedPartnerId;

  const normalizedMissionResult = callHappened ? missionResult : "missed_call";

  const { error: reviewError } = await adminClient.from("network_match_reviews").upsert(
    {
      match_id: matchId,
      reviewer_id: user.id,
      reviewed_id: finalReceiverId,
      call_happened: callHappened,
      mission_result: normalizedMissionResult,
      opportunity_type: opportunityType || null,
      opportunity_details: opportunityDetails || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "match_id,reviewer_id,reviewed_id" }
  );

  if (reviewError) {
    return fallbackToLegacy(finalReceiverId);
  }

  const selfOutcome = mapOutcomeFromMission(callHappened, missionResult);
  const { data: existingSelfOutcome } = await adminClient
    .from("network_match_outcomes")
    .select("validation_source")
    .eq("match_id", matchId)
    .eq("user_id", user.id)
    .maybeSingle();

  const selfSource: ValidationSource =
    existingSelfOutcome?.validation_source === "peer_auto" ? "peer_confirmed" : "self";

  const { error: selfOutcomeError } = await adminClient.from("network_match_outcomes").upsert(
    {
      match_id: matchId,
      user_id: user.id,
      final_status: selfOutcome,
      validation_source: selfSource,
      validated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "match_id,user_id" }
  );

  if (selfOutcomeError) {
    return fallbackToLegacy(finalReceiverId);
  }

  if (callHappened && (missionResult === "completed" || missionResult === "super_completed")) {
    const peerOutcome = mapOutcomeFromMission(true, missionResult);
    const { data: existingPeerOutcome } = await adminClient
      .from("network_match_outcomes")
      .select("id")
      .eq("match_id", matchId)
      .eq("user_id", finalReceiverId)
      .maybeSingle();

    if (!existingPeerOutcome?.id) {
      const { error: peerAutoError } = await adminClient.from("network_match_outcomes").insert({
        match_id: matchId,
        user_id: finalReceiverId,
        final_status: peerOutcome,
        validation_source: "peer_auto",
        validated_at: new Date().toISOString(),
      });
      if (peerAutoError) {
        return fallbackToLegacy(finalReceiverId);
      }
    }
  }

  const legacy = mapLegacyFeedback(callHappened, missionResult);
  const { data: existingLegacy } = await adminClient
    .from("match_feedback")
    .select("id")
    .eq("match_id", matchId)
    .eq("giver_id", user.id)
    .eq("receiver_id", finalReceiverId)
    .maybeSingle();

  if (existingLegacy?.id) {
    const { error: legacyUpdateError } = await adminClient
      .from("match_feedback")
      .update({ rating: legacy.rating, tag: legacy.tag })
      .eq("id", existingLegacy.id);
    if (legacyUpdateError) {
      return fallbackToLegacy(finalReceiverId);
    }
  } else {
    const { error: legacyInsertError } = await adminClient.from("match_feedback").insert({
      match_id: matchId,
      giver_id: user.id,
      receiver_id: finalReceiverId,
      rating: legacy.rating,
      tag: legacy.tag,
    });
    if (legacyInsertError) {
      return fallbackToLegacy(finalReceiverId);
    }
  }

  const { error: statusError } = await adminClient
    .from("network_matches")
    .update({ status: callHappened ? "met" : "missed" })
    .eq("id", matchId);
  if (statusError) {
    return fallbackToLegacy(finalReceiverId);
  }

  revalidateMissionPaths(user.id, finalReceiverId);
  return { success: true };
}

export async function autoValidateMissionOutcomesForDate(targetDate: string) {
  const adminClient = createAdminClient();
  const { data: matches, error: matchesError } = await adminClient
    .from("network_matches")
    .select("id, user1_id, user2_id")
    .eq("date", targetDate)
    .neq("status", "canceled");

  if (matchesError) {
    return { success: false, error: "Impossible de charger les matchs" };
  }

  let insertedCount = 0;
  let confirmedCount = 0;

  for (const match of matches || []) {
    const { data: reviews, error: reviewsError } = await adminClient
      .from("network_match_reviews")
      .select("reviewer_id, reviewed_id, call_happened, mission_result")
      .eq("match_id", match.id);
    if (reviewsError) {
      return { success: true, insertedCount, confirmedCount, skipped: true };
    }

    const { data: outcomes, error: outcomesError } = await adminClient
      .from("network_match_outcomes")
      .select("id, user_id, validation_source, final_status")
      .eq("match_id", match.id);
    if (outcomesError) {
      return { success: true, insertedCount, confirmedCount, skipped: true };
    }

    const outcomeByUser = new Map((outcomes || []).map((item: any) => [item.user_id, item]));
    const reviewByPair = new Map(
      (reviews || []).map((review: any) => [`${review.reviewer_id}:${review.reviewed_id}`, review])
    );

    const users = [match.user1_id, match.user2_id];

    for (const userId of users) {
      const ownReview = reviewByPair.get(`${userId}:${userId === match.user1_id ? match.user2_id : match.user1_id}`);
      const peerReview = reviewByPair.get(`${userId === match.user1_id ? match.user2_id : match.user1_id}:${userId}`);
      const existingOutcome = outcomeByUser.get(userId);

      if (!existingOutcome && ownReview) {
        await adminClient.from("network_match_outcomes").insert({
          match_id: match.id,
          user_id: userId,
          final_status: mapOutcomeFromStoredReview(ownReview),
          validation_source: "self",
          validated_at: new Date().toISOString(),
        });
        insertedCount += 1;
        continue;
      }

      if (!existingOutcome && peerReview && peerReview.call_happened && (peerReview.mission_result === "completed" || peerReview.mission_result === "super_completed")) {
        await adminClient.from("network_match_outcomes").insert({
          match_id: match.id,
          user_id: userId,
          final_status: mapOutcomeFromStoredReview(peerReview),
          validation_source: "peer_auto",
          validated_at: new Date().toISOString(),
        });
        insertedCount += 1;
        continue;
      }

      if (existingOutcome?.validation_source === "peer_auto" && ownReview) {
        await adminClient
          .from("network_match_outcomes")
          .update({
            final_status: mapOutcomeFromStoredReview(ownReview),
            validation_source: "peer_confirmed",
            validated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingOutcome.id);
        confirmedCount += 1;
      }
    }
  }

  return { success: true, insertedCount, confirmedCount };
}
