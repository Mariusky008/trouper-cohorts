"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin"; // Import admin client
import { OpportunityType, OpportunityStatus } from "@/types/network";
import { revalidatePath } from "next/cache";

// ... createOpportunity removed and moved to opportunity-creation.ts

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

export async function getOpportunities(filter: 'all' | 'received' | 'given' | 'public' = 'all') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  // Use Admin Client for Public Opportunities to bypass RLS restrictions if they exist
  // Or just standard client if RLS is configured correctly.
  // Given user feedback, it seems RLS prevents reading public opps from others.
  // So let's try using admin client ONLY for public view.
  
  let query;
  let supabaseClient = supabase;

  if (filter === 'public') {
      // Use Admin Client to ensure we can see ALL public opportunities regardless of RLS
      // Note: This requires SUPABASE_SERVICE_ROLE_KEY to be set in environment variables.
      // If not set, fallback to standard client.
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          const adminClient = createAdminClient();
          supabaseClient = adminClient as any; 
      }
      
      query = supabaseClient
        .from("network_opportunities")
        .select("*")
        .order("created_at", { ascending: false });
        
      // Public opportunities logic: 
      // - visibility = 'public'
      // - status = 'available' (not sold yet)
      // - giver_id != user.id (don't show own listings - OPTIONAL, keep for now to avoid confusion)
      query = query
          .eq('visibility', 'public')
          .eq('status', 'available');
          // .neq('giver_id', user.id); // For testing, allow seeing own
  } else {
      // Standard Private Logic
      query = supabase
        .from("network_opportunities")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter === 'received') {
        query = query.eq('receiver_id', user.id);
      } else if (filter === 'given') {
        query = query.eq('giver_id', user.id);
      } else {
        // All means both given and received (PRIVATE ONLY)
        query = query.or(`giver_id.eq.${user.id},receiver_id.eq.${user.id}`);
      }
  }

  const { data: opportunities, error } = await query;

  if (error || !opportunities) {
    console.error("Error fetching opportunities:", error);
    return [];
  }

  // 1.5 Fetch Match History for Public View
  const metPartnerIds = new Set<string>();
  if (filter === 'public') {
      const { data: matches } = await supabase
          .from("network_matches")
          .select("user1_id, user2_id")
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
      
      matches?.forEach((m: any) => {
          if (m.user1_id === user.id) metPartnerIds.add(m.user2_id);
          else metPartnerIds.add(m.user1_id);
      });
  }

  // 2. Collect User IDs to fetch profiles manually (avoid join issues)
  const userIds = new Set<string>();
  opportunities.forEach((opp: any) => {
    if (opp.giver_id) userIds.add(opp.giver_id);
    if (opp.receiver_id) userIds.add(opp.receiver_id);
  });

  // 3. Fetch Profiles
  let profiles: any[] = [];
  if (userIds.size > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, trade")
        .in("id", Array.from(userIds));
      profiles = data || [];
  }

  const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

  return opportunities.filter((opp: any) => {
      // If we are in 'public' mode (Market), we show everything that the query returned.
      if (filter === 'public') return true;

      // If we are in 'private' mode (Opportunities page), we MUST hide Public listings that are still on the market.
      // We only want to see Private exchanges OR Public listings that have been bought (sold).
      if (opp.visibility === 'public' && opp.status === 'available') {
          return false;
      }
      return true;
  }).map((opp: any) => {
    // Determine partner
    let partnerId;
    let direction;
    
    if (filter === 'public') {
        // For public listings, partner is the Giver
        partnerId = opp.giver_id;
        direction = 'market';
    } else {
        const isGiver = opp.giver_id === user.id;
        partnerId = isGiver ? opp.receiver_id : opp.giver_id;
        direction = isGiver ? 'given' : 'received';
    }
    
    const partner = profileMap.get(partnerId) || { display_name: "Membre Inconnu", trade: "N/A" };
    
    // Check if partner was already met
    const isMet = filter === 'public' ? metPartnerIds.has(partnerId) : false;

    return {
      id: opp.id,
      type: opp.type,
      points: opp.points,
      // For public market, use public_title instead of details
      description: filter === 'public' ? opp.public_title : opp.details, 
      partner: partner,
      date: new Date(opp.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }),
      status: opp.status,
      direction: direction,
      price: opp.price,
      visibility: opp.visibility,
      isMet: isMet
    };
  }).sort((a: any, b: any) => {
      // Prioritize "Met" partners in public view
      if (filter === 'public') {
          if (a.isMet && !b.isMet) return -1;
          if (!a.isMet && b.isMet) return 1;
      }
      return 0; // Keep original date order
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

export async function deleteOpportunity(id: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    // Only the giver (author) can delete their own opportunity
    const { error } = await supabase
      .from("network_opportunities")
      .delete()
      .eq('id', id)
      .eq('giver_id', user.id); // Ensure ownership

    if (error) {
      console.error("Error deleting opportunity:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/mon-reseau-local/dashboard/guide");
    return { success: true };
  } catch (err) {
    console.error("Unexpected error in deleteOpportunity:", err);
    return { success: false, error: "Une erreur inattendue est survenue." };
  }
}
