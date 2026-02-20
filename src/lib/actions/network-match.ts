"use server";

import { createClient } from "@/lib/supabase/server";

export async function getDailyMatch() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const today = new Date().toISOString().split('T')[0];

  const { data: match } = await supabase
    .from("network_matches")
    .select(`
      *,
      user1:user1_id(id, display_name, avatar_url, trade, phone),
      user2:user2_id(id, display_name, avatar_url, trade, phone)
    `)
    .eq("date", today)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .maybeSingle();

  if (!match) return null;

  const isUser1 = match.user1_id === user.id;
  const partnerId = isUser1 ? match.user2_id : match.user1_id;

  // 2. Fetch Partner Profile Manually (Avoid join issues with auth.users)
  const { data: partnerProfile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, trade, city, bio, phone")
    .eq("id", partnerId)
    .single();
    
  // 3. Fetch Partner Trust Score
  const { data: trustScore } = await supabase
    .from("trust_scores")
    .select("score")
    .eq("user_id", partnerId)
    .single();

  const partner = partnerProfile || { display_name: "Membre Inconnu", trade: "N/A", avatar_url: undefined, phone: undefined, city: "En ligne" };

  return {
    id: match.id,
    partnerId: partnerId,
    name: partner.display_name,
    job: partner.trade || "Membre",
    city: partner.city || "En ligne",
    score: trustScore?.score || 5.0,
    time: match.time || "14:00",
    type: isUser1 ? 'call_out' : 'call_in',
    phone: partner.phone,
    avatar: partner.avatar_url,
    tags: [partner.trade || "Entrepreneur"],
    status: match.status
  };
}

export async function rateMatch(matchId: string, rating: number, feedback: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // 1. Update Match Status
  const { error: matchError } = await supabase
    .from("network_matches")
    .update({ status: 'met' })
    .eq("id", matchId);

  if (matchError) throw matchError;

  // 2. Ideally, we should store the rating in a "network_reviews" table
  // For MVP, we'll just increment the partner's trust score
  // But first we need to know who the partner is.
  // We'll fetch the match again to be safe.
  
  const { data: match } = await supabase
    .from("network_matches")
    .select("user1_id, user2_id")
    .eq("id", matchId)
    .single();
    
  if (!match) throw new Error("Match not found");

  const partnerId = match.user1_id === user.id ? match.user2_id : match.user1_id;

  // 3. Update Trust Score using RPC
  const { error: scoreError } = await supabase.rpc('increment_trust_score', { 
    target_user_id: partnerId,
    amount: 0.1 
  });

  if (scoreError) console.error("Score update failed:", scoreError);

  return { success: true };
}
