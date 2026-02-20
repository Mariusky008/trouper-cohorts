"use server";

import { createClient } from "@/lib/supabase/server";
import { OpportunityType, OpportunityStatus } from "@/types/network";
import { revalidatePath } from "next/cache";

// ... existing createOpportunity function

export async function createOpportunity(data: {
  receiverId: string;
  type: OpportunityType;
  points: number;
  details: string;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase.from("network_opportunities").insert({
    giver_id: user.id,
    receiver_id: data.receiverId,
    type: data.type,
    points: data.points,
    details: data.details,
    status: "pending"
  });

  if (error) {
    console.error("Error creating opportunity:", error);
    throw new Error("Failed to create opportunity");
  }

  revalidatePath("/mon-reseau-local/dashboard/opportunities");
  return { success: true };
}

export async function getOpportunities(filter: 'all' | 'received' | 'given' = 'all') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  let query = supabase
    .from("network_opportunities")
    .select(`
      *,
      giver:giver_id(id, display_name, avatar_url, trade),
      receiver:receiver_id(id, display_name, avatar_url, trade)
    `)
    .order("created_at", { ascending: false });

  if (filter === 'received') {
    query = query.eq('receiver_id', user.id);
  } else if (filter === 'given') {
    query = query.eq('giver_id', user.id);
  } else {
    // All means both given and received
    query = query.or(`giver_id.eq.${user.id},receiver_id.eq.${user.id}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching opportunities:", error);
    return [];
  }

  return data.map((opp: any) => ({
    id: opp.id,
    type: opp.type,
    points: opp.points,
    description: opp.details, // Mapping details to description for UI
    partner: opp.giver_id === user.id ? opp.receiver : opp.giver,
    date: new Date(opp.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }),
    status: opp.status,
    direction: opp.giver_id === user.id ? 'given' : 'received'
  }));
}

export async function updateOpportunityStatus(id: string, status: 'validated' | 'rejected') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

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
    throw new Error("Failed to update status");
  }

  revalidatePath("/mon-reseau-local/dashboard/opportunities");
  return { success: true };
}
