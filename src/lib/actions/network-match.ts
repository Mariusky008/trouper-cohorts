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
  const partner = isUser1 ? match.user2 : match.user1;

  // Determine who calls (arbitrary logic: user1 calls user2)
  const type = isUser1 ? 'call_out' : 'call_in';

  // Fetch partner's trust score
  const { data: trustScore } = await supabase
    .from("trust_scores")
    .select("score")
    .eq("user_id", partner.id)
    .single();

  return {
    id: match.id,
    partnerId: partner.id,
    name: partner.display_name,
    job: partner.trade || "Membre",
    city: "En ligne", // Or fetch from profile
    score: trustScore?.score || 5.0,
    time: "14:00", // Default or stored
    type,
    phone: partner.phone,
    avatar: partner.avatar_url,
    tags: ["Entrepreneur"],
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

  // 3. Update Trust Score (Simple logic: +0.1 per interaction)
  // In a real app, we would average the ratings.
  const { error: scoreError } = await supabase.rpc('increment_trust_score', { 
    target_user_id: partnerId,
    amount: 0.1 
  });

  // If RPC doesn't exist, we can do a manual update (less safe for concurrency)
  if (scoreError) {
    console.warn("RPC increment_trust_score missing, trying manual update");
    const { data: currentScore } = await supabase
      .from("trust_scores")
      .select("score")
      .eq("user_id", partnerId)
      .single();
      
    if (currentScore) {
       await supabase
        .from("trust_scores")
        .update({ score: Math.min(5.0, currentScore.score + 0.1) })
        .eq("user_id", partnerId);
    }
  }

  return { success: true };
}
