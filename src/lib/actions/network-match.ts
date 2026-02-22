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

  console.log("getDailyMatches - User ID:", user.id);
  console.log("getDailyMatches - Search Date:", searchDate);

  const { data: matches, error } = await supabase
    .from("network_matches")
    .select(`
      *,
      user1:profiles!network_matches_user1_id_fkey(id, display_name, avatar_url, trade, phone),
      user2:profiles!network_matches_user2_id_fkey(id, display_name, avatar_url, trade, phone)
    `)
    .gte("date", searchDate) // Fetch from yesterday onwards
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .neq('status', 'met') // Exclude completed matches
    .neq('status', 'canceled')
    .order('date', { ascending: true }) // Earliest date first
    .order('time', { ascending: true })
    .limit(5); // Allow multiple matches
    
  console.log("getDailyMatches - Query Result:", matches);
  
  if (error) {
      console.error("Error fetching matches:", error);
      return [];
  }

  if (!matches || matches.length === 0) {
      return [];
  }

  const matchesWithDetails = await Promise.all(matches.map(async (match) => {
      const isUser1 = match.user1_id === user.id;
      const partnerId = isUser1 ? match.user2_id : match.user1_id;

      // Fetch Partner Profile Manually
      const { data: partnerProfile } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, trade, city, bio, phone, current_goals")
        .eq("id", partnerId)
        .single();
        
      // Fetch Partner Trust Score
      const { data: trustScore } = await supabase
        .from("trust_scores")
        .select("score")
        .eq("user_id", partnerId)
        .single();

      const partner = partnerProfile || { display_name: "Membre Inconnu", trade: "N/A", avatar_url: undefined, phone: undefined, city: "En ligne", current_goals: [] };

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
        current_goals: partner.current_goals || [],
        status: match.status,
        date: match.date
      };
  }));

  // Filter out matches where the slot time has passed (start time + 2h < now)
  const now = new Date();
  const activeMatches = matchesWithDetails.filter(match => {
      // If date/time is missing, keep it safe
      if (!match.date || !match.time) return true;
      
      // Construct full match date
      // match.date is YYYY-MM-DD
      // match.time is HH:MM or HH:MM:SS
      // We create a Date object in local time context or UTC depending on how it's stored.
      // Assuming ISO strings from DB are reliable.
      const matchDateTimeString = `${match.date}T${match.time}`;
      const matchDate = new Date(matchDateTimeString);
      
      // If invalid date, keep it
      if (isNaN(matchDate.getTime())) return true;
      
      // Add 2 hours for slot end
      // 2 hours * 60 min * 60 sec * 1000 ms
      const slotEndTime = new Date(matchDate.getTime() + 2 * 60 * 60 * 1000);
      
      // Keep only if slot end time is in the future
      return slotEndTime > now;
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
