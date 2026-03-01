"use server";

import { createClient } from "@/lib/supabase/server";
import { OpportunityType, OpportunityStatus } from "@/types/network";
import { revalidatePath } from "next/cache";
import { sendNotification } from "./notifications";

// ... existing createOpportunity function

export async function createOpportunity(data: {
  receiverId: string;
  type: string;
  points: number;
  details: string;
}) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Vous devez être connecté pour effectuer cette action." };
    }

    // Validation: Self-giving
    if (user.id === data.receiverId) {
      return { success: false, error: "Vous ne pouvez pas vous donner une opportunité à vous-même." };
    }

    // Validation: Points
    const points = Math.round(data.points);
    if (points <= 0) {
      return { success: false, error: "Le nombre de points doit être positif." };
    }

    // Validation: Details length
    if (!data.details || data.details.trim().length < 5) {
      return { success: false, error: "Veuillez fournir plus de détails sur l'opportunité." };
    }

    const { error } = await supabase
      .from("network_opportunities")
      .insert({
        giver_id: user.id,
        receiver_id: data.receiverId,
        type: data.type,
        points: points,
        details: data.details,
        status: "pending"
      });

    if (error) {
      console.error("Error creating opportunity:", error);
      return { success: false, error: `Erreur lors de la création: ${error.message}` };
    }

    // Send Notification
    try {
        const { data: senderProfile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", user.id)
            .single();
        
        const senderName = senderProfile?.display_name || "Un membre";

        await sendNotification(
            data.receiverId,
            `Nouvelle opportunité reçue ! 🎁`,
            `${senderName} vous a envoyé une opportunité : ${data.type}`,
            `/mon-reseau-local/dashboard/opportunities`
        );
    } catch (e) {
        console.error("Failed to send notification for opportunity:", e);
    }

    // Revalidate ALL dashboard paths to ensure consistency
    try {
      revalidatePath("/mon-reseau-local/dashboard/opportunities");
      revalidatePath("/mon-reseau-local/dashboard/connections"); 
      revalidatePath("/mon-reseau-local/dashboard");
    } catch (e) {
      console.error("Error revalidating paths:", e);
      // We continue even if revalidation fails, as the action was successful
    }
    
    return { success: true };
  } catch (err) {
    console.error("Unexpected error in createOpportunity:", err);
    return { success: false, error: "Une erreur inattendue est survenue." };
  }
}

/**
 * Creates a special "Founder Call Request" opportunity.
 * This is used when a user clicks "Je me rends disponible" on the Founder/Rescue card.
 * It's stored as an opportunity given by the USER to the FOUNDER (or System).
 * But to make it visible in Admin, we might want to store it as a special type.
 * 
 * Ideally, we should insert into `network_opportunities` where:
 * - giver_id = USER (The member asking for call)
 * - receiver_id = FOUNDER_ID (You) OR a specific System ID.
 * - type = 'founder_call_request'
 * - details = 'Joker Onboarding' or 'Joker Sauvetage'
 */
export async function notifyFounderCall(type: 'onboarding' | 'rescue') {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, error: "Non connecté" };

    // We need a target ID for the "receiver". 
    // If you have a fixed Admin ID, use it. Otherwise, use a placeholder or system ID.
    // For now, let's use a convention: receiver_id = 'popey-admin' (if UUID validation allows) 
    // OR better: we don't use opportunities table if it requires valid UUIDs for foreign keys.
    // DOES opportunities table enforce FK on receiver_id?
    // Usually yes. So we need a real Admin User ID.
    // Let's try to find YOUR admin user ID by email 'jeanphilippe.roth@gmail.com' or similar?
    // OR simpler: we insert it as a 'system_event' in a new table?
    // OR we use the existing 'network_matches' table with a special status?
    
    // EASIEST WAY: Insert into 'network_opportunities' aiming at a known Admin UUID.
    // If we don't have it hardcoded, we can fetch it.
    // But to be safe and robust without knowing your UUID:
    // We will insert a record where receiver_id is the USER itself (Self-assigned task?) NO.
    
    // ALTERNATIVE: Use `analytics_events`! 
    // It's perfect for this. It's a log. "User X requested Founder Call".
    // But you want it in "Opportunités" list in Admin?
    
    // Let's stick to `network_opportunities`. We need your UUID.
    // I will fetch the first user with role 'service_role' or specific email?
    // Let's try to fetch user with email 'admin@popey.co' or similar if exists.
    // If not, we can't insert if FK constraint exists.
    
    // Let's assume for now we use the `analytics_events` table which I see used in `getNetworkStats`.
    // It's safer. I will create a specific event 'founder_call_request'.
    
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

export async function getPendingOpportunitiesCount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return 0;

  const { count, error } = await supabase
    .from("network_opportunities")
    .select("*", { count: 'exact', head: true })
    .eq("receiver_id", user.id)
    .eq("status", "pending");

  if (error) {
    console.error("Error fetching pending opportunities count:", error);
    return 0;
  }

  return count || 0;
}

export async function getPotentialOpportunitiesCount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return 0;

  // Simple logic: Days since registration * 1
  // We need registration date. For now we use created_at from auth.users or profiles.
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at")
    .eq("id", user.id)
    .single();

  if (!profile) return 0;

  const created = new Date(profile.created_at);
  const now = new Date();
  
  // Diff in days
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  return diffDays; 
}

export async function getOpportunities(filter: 'all' | 'received' | 'given' = 'all') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  let query = supabase
    .from("network_opportunities")
    .select("*")
    .order("created_at", { ascending: false });

  if (filter === 'received') {
    query = query.eq('receiver_id', user.id);
  } else if (filter === 'given') {
    query = query.eq('giver_id', user.id);
  } else {
    // All means both given and received
    query = query.or(`giver_id.eq.${user.id},receiver_id.eq.${user.id}`);
  }

  const { data: opportunities, error } = await query;

  if (error || !opportunities) {
    console.error("Error fetching opportunities:", error);
    return [];
  }

  // 2. Collect User IDs to fetch profiles manually (avoid join issues)
  const userIds = new Set<string>();
  opportunities.forEach((opp: any) => {
    userIds.add(opp.giver_id);
    userIds.add(opp.receiver_id);
  });

  // 3. Fetch Profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, trade")
    .in("id", Array.from(userIds));

  const profileMap = new Map(profiles?.map((p: any) => [p.id, p]));

  return opportunities.map((opp: any) => {
    const isGiver = opp.giver_id === user.id;
    const partnerId = isGiver ? opp.receiver_id : opp.giver_id;
    const partner = profileMap.get(partnerId) || { display_name: "Membre Inconnu", trade: "N/A" };

    return {
      id: opp.id,
      type: opp.type,
      points: opp.points,
      description: opp.details, 
      partner: partner,
      date: new Date(opp.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }),
      status: opp.status,
      direction: isGiver ? 'given' : 'received'
    };
  });
}

export async function updateOpportunityStatus(id: string, status: 'validated' | 'rejected', points?: number) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    const updateData: any = { 
        status,
        validated_at: status === 'validated' ? new Date().toISOString() : null
    };
    
    // If points are provided (e.g. for custom opportunities), update them
    if (points !== undefined) {
        updateData.points = points;
    }

    // Only receiver can validate/reject
    const { error } = await supabase
      .from("network_opportunities")
      .update(updateData)
      .eq('id', id)
      .eq('receiver_id', user.id);

    if (error) {
      console.error("Error updating opportunity:", error);
      return { success: false, error: error.message || "Failed to update status" };
    }

    // Revalidate all relevant paths
    try {
      revalidatePath("/mon-reseau-local/dashboard/opportunities");
      revalidatePath("/mon-reseau-local/dashboard/connections"); 
      revalidatePath("/mon-reseau-local/dashboard");
      revalidatePath("/mon-reseau-local/dashboard/profile"); // Trust score updates
    } catch (e) {
      console.error("Error revalidating paths:", e);
    }

    return { success: true };
  } catch (err) {
    console.error("Unexpected error in updateOpportunityStatus:", err);
    return { success: false, error: "Une erreur inattendue est survenue." };
  }
}
