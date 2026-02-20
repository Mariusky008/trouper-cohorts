"use server";

import { createClient } from "@/lib/supabase/server";

export async function getTrustScore() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Fetch score from DB
  const { data: scoreData } = await supabase
    .from("trust_scores")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // 2. If no score, calculate it (or init)
  if (!scoreData) {
    return {
      score: 5.0,
      opportunities_given: 0,
      opportunities_received: 0,
      debt_level: 0
    };
  }

  return scoreData;
}

export async function getDebts() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  // Debts = Opportunities received > 30 days ago AND NOT (returned in some way)
  // For MVP: We just list opportunities received that are validated
  // In a real system, we'd need to link "Opportunity A (Received)" -> "Opportunity B (Given back)"
  
  const { data } = await supabase
    .from("network_opportunities")
    .select(`
      *,
      giver:giver_id(display_name, avatar_url)
    `)
    .eq("receiver_id", user.id)
    .eq("status", "validated")
    .order("created_at", { ascending: true }); // Oldest first

  if (!data) return [];

  return data.map((opp: any) => {
    const created = new Date(opp.created_at);
    const deadline = new Date(created);
    deadline.setDate(deadline.getDate() + 30);
    
    const now = new Date();
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      id: opp.id,
      partner: opp.giver?.display_name || "Membre",
      avatar: opp.giver?.avatar_url,
      reason: opp.type,
      daysLeft,
      urgent: daysLeft < 5
    };
  });
}
