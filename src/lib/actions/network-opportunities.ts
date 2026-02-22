"use server";

import { createClient } from "@/lib/supabase/server";
import { OpportunityType, OpportunityStatus } from "@/types/network";
import { revalidatePath } from "next/cache";

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

export async function updateOpportunityStatus(id: string, status: 'validated' | 'rejected') {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    // Only receiver can validate/reject
    const { error } = await supabase
      .from("network_opportunities")
      .update({ 
        status,
        validated_at: status === 'validated' ? new Date().toISOString() : null
      })
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
