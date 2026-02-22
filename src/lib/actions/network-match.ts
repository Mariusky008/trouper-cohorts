"use server";

import { createClient } from "@/lib/supabase/server";

export async function getDailyMatches() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  // Use a safe past date to ensure we catch "today" even if server time is ahead.
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1); // Yesterday
  const searchDate = pastDate.toISOString().split('T')[0];

  const { data: matches, error } = await supabase
    .from("network_matches")
    .select(`
      *,
      user1:user1_id(id, display_name, avatar_url, trade, phone),
      user2:user2_id(id, display_name, avatar_url, trade, phone)
    `)
    .gte("date", searchDate) // Fetch from yesterday onwards
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .neq('status', 'met') // Exclude completed matches
    .neq('status', 'canceled')
    .order('date', { ascending: true }) // Earliest date first
    .order('time', { ascending: true })
    .limit(5); // Allow multiple matches
    
  if (error) {
      console.error("Error fetching matches:", error);
      return [];
  }

  if (!matches || matches.length === 0) {
      return [];
  }

  const matchesWithDetails = await Promise.all(matches.map(async (match) => {
      const isUser1 = match.user1_id === user.id;
      // Using 'as any' casting because the select query returns nested objects
      // but TypeScript types for Supabase might not infer it automatically without generated types
      const user1 = match.user1 as any;
      const user2 = match.user2 as any;
      
      const partner = isUser1 ? user2 : user1;
      const partnerId = isUser1 ? match.user2_id : match.user1_id;

      // Double check partner data if join failed
      let partnerData = partner;
      if (!partnerData) {
          const { data: p } = await supabase
            .from("profiles")
            .select("id, display_name, avatar_url, trade, city, bio, phone, current_goals")
            .eq("id", partnerId)
            .single();
          partnerData = p;
      }
      
      // If still no partner, skip safely
      if (!partnerData) return null;
        
      // Fetch Partner Trust Score
      const { data: trustScore } = await supabase
        .from("trust_scores")
        .select("score")
        .eq("user_id", partnerId)
        .single();

      return {
        id: match.id,
        partnerId: partnerId,
        name: partnerData.display_name || "Membre Inconnu",
        job: partnerData.trade || "Membre",
        city: partnerData.city || "En ligne",
        score: trustScore?.score || 5.0,
        time: match.time || "14:00",
        type: isUser1 ? 'call_out' : 'call_in',
        phone: partnerData.phone,
        avatar: partnerData.avatar_url,
        tags: [partnerData.trade || "Entrepreneur"],
        current_goals: partnerData.current_goals || [],
        status: match.status,
        date: match.date
      };
  }));

  // Filter out nulls
  const validMatches = matchesWithDetails.filter(m => m !== null) as any[];

  // Filter out matches where the slot time has passed (start time + 2h < now)
  // But ONLY if the match is for TODAY or BEFORE
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  const activeMatches = validMatches.filter(match => {
      // If date is in future, keep it
      if (match.date > todayStr) return true;
      
      // If date is today, check time
      if (match.date === todayStr) {
          // If no time, assume all day
          if (!match.time) return true;
          
          // Construct datetime for end of slot
          const [hours, minutes] = match.time.split(':').map(Number);
          const slotEndTime = new Date();
          slotEndTime.setHours(hours + 2, minutes || 0, 0, 0);
          
          // If now > slot end time, hide it (expired)
          if (now > slotEndTime) return false;
      }
      
      // If date is past (yesterday), hide it
      if (match.date < todayStr) return false;

      return true;
  });

  return activeMatches;
}

import { revalidatePath } from "next/cache";

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

  revalidatePath('/mon-reseau-local/dashboard');
  return { success: true };
}
