"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Creates a special "Founder Call Request" opportunity.
 * This is used when a user clicks "Je me rends disponible" on the Founder/Rescue card.
 */
export async function notifyFounderCall(type: 'onboarding' | 'rescue') {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, error: "Non connecté" };

    // 1. Log Analytics Event
    const { error } = await supabase
      .from("analytics_events")
      .insert({
        user_id: user.id,
        event_type: 'founder_call_request',
        page: '/dashboard', // Fixed column name from 'page_path' to 'page' matching migration
        metadata: { 
            card_type: type,
            status: 'pending_call'
        }
      });
      
    if (error) throw error;

    // 2. Create Match Feedback to mark "Daily Mission" as completed
    // This ensures the Founder Card disappears after refresh.
    // NOTE: We use user.id as receiver_id to satisfy Foreign Key constraints (UUID),
    // as 'popey-founder' is not a valid UUID. We distinguish this via the tag.
    const { error: feedbackError } = await supabase.from("match_feedback").insert({
        giver_id: user.id,
        receiver_id: user.id, // Self-reference to satisfy FK
        rating: 5, 
        tag: `founder_${type}`, // 'founder_onboarding' or 'founder_rescue'
        // match_id is null as this is a virtual match
    });

    if (feedbackError) {
        console.error("Error saving founder feedback:", feedbackError);
        // We don't throw here to avoid breaking the UI flow if analytics worked,
        // but it means the card might reappear.
    }

    // 3. Revalidate Dashboard to update UI state immediately
    revalidatePath("/mon-reseau-local/dashboard");
    
    return { success: true };

  } catch (err) {
    console.error("Error notifying founder:", err);
    return { success: false, error: "Erreur technique" };
  }
}
