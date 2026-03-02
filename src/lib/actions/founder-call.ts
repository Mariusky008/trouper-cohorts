"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Creates a special "Founder Call Request" opportunity.
 * This is used when a user clicks "Je me rends disponible" on the Founder/Rescue card.
 */
export async function notifyFounderCall(type: 'onboarding' | 'rescue') {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, error: "Non connecté" };

    const { error } = await supabase
      .from("analytics_events")
      .insert({
        user_id: user.id,
        event_type: 'founder_call_request',
        page_path: '/dashboard',
        metadata: { 
            card_type: type,
            status: 'pending_call'
        }
      });
      
    if (error) throw error;
    
    return { success: true };

  } catch (err) {
    console.error("Error notifying founder:", err);
    return { success: false, error: "Erreur technique" };
  }
}
