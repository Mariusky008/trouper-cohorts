"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

    // Use Admin Client to ensure writes succeed regardless of RLS policies
    const supabaseAdmin = createAdminClient();

    // Debug Log
    console.log(`[FounderCall] Validating for User: ${user.id}`);

    // 1. Log Analytics Event (Using generic metadata structure)
    const { error } = await supabaseAdmin
      .from("analytics_events")
      .insert({
        user_id: user.id,
        event_type: 'founder_call_request',
        metadata: { 
            card_type: type,
            status: 'pending_call',
            page: '/dashboard'
        }
      });
      
    if (error) {
        console.error("[FounderCall] Analytics insert error:", error);
        // Don't throw, proceed to feedback
    } else {
        console.log("[FounderCall] Analytics Logged Successfully");
    }

    // 2. Create Match Feedback to mark "Daily Mission" as completed
    const { error: feedbackError } = await supabaseAdmin.from("match_feedback").insert({
        giver_id: user.id,
        receiver_id: user.id, // Self-reference to satisfy FK
        rating: 5, 
        tag: `founder_${type}`, 
    });

    if (feedbackError) {
        console.error("[FounderCall] Feedback Error:", feedbackError);
        return { success: false, error: "Erreur lors de la validation: " + feedbackError.message };
    }
    
    console.log("[FounderCall] Feedback Saved Successfully");

    // 3. Revalidate Dashboard to update UI state immediately
    revalidatePath("/mon-reseau-local/dashboard");
    
    return { success: true };

  } catch (err) {
    console.error("Error notifying founder:", err);
    return { success: false, error: "Erreur technique" };
  }
}
