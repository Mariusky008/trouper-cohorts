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
      user1:user1_id(id, display_name, avatar_url, trade, phone, superpower, current_need, big_goal),
      user2:user2_id(id, display_name, avatar_url, trade, phone, superpower, current_need, big_goal)
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
            .select("id, display_name, avatar_url, trade, city, bio, phone, current_goals, superpower, current_need, big_goal, give_profile, receive_profile")
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

      // Fetch Partner Collabs (Opportunities Received this month)
      // We use an RPC function to bypass RLS and get the global count
      const { data: collabsCount, error: collabsError } = await supabase
        .rpc('get_monthly_collabs_count', { target_user_id: partnerId });
        
      if (collabsError) {
          console.error("Error fetching collabs count:", collabsError);
      }

      return {
        id: match.id,
        partnerId: partnerId,
        name: partnerData.display_name || "Membre Inconnu",
        job: partnerData.trade || "Membre",
        city: partnerData.city || "En ligne",
        score: trustScore?.score || 5.0,
        collabsCount: collabsCount || 0, // Real data from RPC
        time: match.time || "14:00",
        type: isUser1 ? 'call_out' : 'call_in',
        phone: partnerData.phone,
        avatar: partnerData.avatar_url,
        tags: [partnerData.trade || "Entrepreneur"],
        current_goals: partnerData.current_goals || [],
        big_goal: partnerData.big_goal,
        superpower: partnerData.superpower,
        current_need: partnerData.current_need,
        give_profile: partnerData.give_profile,
        receive_profile: partnerData.receive_profile,
        status: match.status,
        date: match.date
      };
  }));

  // Filter out nulls
  const validMatches = matchesWithDetails.filter(m => m !== null) as any[];

  // Filter out matches where the slot time has passed (start time + 2h < now)
  // We must use Paris time because matches are scheduled in Paris time.
  const now = new Date();
  
  // Get Today's Date in Paris (YYYY-MM-DD)
  const parisDateFormatter = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const todayParisStr = parisDateFormatter.format(now);

  // Get Current Time in Paris
  const parisTimeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  
  // Helper to parse Paris time
  const getParisHours = () => {
    const parts = parisTimeFormatter.formatToParts(now);
    const h = parts.find(p => p.type === 'hour')?.value;
    return h ? parseInt(h, 10) : 0;
  };
  const currentParisHour = getParisHours();

  const activeMatches = validMatches.filter(match => {
      // If date is in future, keep it
      if (match.date > todayParisStr) return true;
      
      // If date is past, hide it
      if (match.date < todayParisStr) return false;
      
      // If date is today, check time
      if (match.date === todayParisStr) {
          // If no time, assume all day
          if (!match.time) return true;
          
          // Parse start hour from "09h - 11h" or "09:00"
          const timeStr = match.time.toString();
          const startHourMatch = timeStr.match(/^(\d{1,2})/);
          const startHour = startHourMatch ? parseInt(startHourMatch[1], 10) : 0;
          
          // Slot ends at start + 2 hours
          // IMPORTANT: If current hour is < endHour, the slot is still active.
          // Example: Slot 09h-11h (End 11). If current is 10:59, it's active. If 11:00, it's expired.
          // We add a grace period? No, stick to logic.
          const endHour = startHour + 2;
          
          if (currentParisHour >= endHour) return false;
      }

      return true;
  });

  // Sort matches so that TODAY's matches come first, then FUTURE matches
  // Within same day, sort by time
  const sortedMatches = activeMatches.sort((a, b) => {
      if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
      }
      return a.time.localeCompare(b.time);
  });

  // Check if today is the user's 2nd day (Day 2 of membership)
  // Or if we need to inject a "Rescue" match because the user has NO match for today but is available.
  
  // 1. Get User Creation Date
  const { data: userData } = await supabase
    .from("profiles")
    .select("created_at, availability_status")
    .eq("id", user.id)
    .single();

  // Calculate if Day 2
  // We compare created_at date with today
  let isDay2 = false;
  if (userData?.created_at) {
      const created = new Date(userData.created_at);
      const createdDateStr = parisDateFormatter.format(created);
      
      // If today is NOT created date, but close?
      // Actually, simple logic:
      const oneDay = 24 * 60 * 60 * 1000;
      const diffDays = Math.round(Math.abs((now.getTime() - created.getTime()) / oneDay));
      
      // Day 1 = 0 diff (or < 1). Day 2 = 1 diff.
      // We extend the window to 3 days to account for weekends (Friday signup -> Monday is Day 4? No, Day 3).
      isDay2 = diffDays >= 1 && diffDays <= 3;
  }
  
  // 2. Check availability for today (Is today a working day for the user?)
  // We assume the user is available if not paused.
  
  // 3. Inject Founder Match if needed
  // Condition: No active match for TODAY + (Day 2 OR Rescue needed)
  // AND not a weekend (Mon-Fri only)
  const hasMatchToday = activeMatches.some(m => m.date === todayParisStr);
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = currentDay === 0 || currentDay === 6;
  
  if (!hasMatchToday && !isWeekend && userData?.availability_status !== 'paused') {
      // Logic:
      // If Day 2 -> Inject "Onboarding" Founder Match (Priority: Founder)
      // If Day > 2 and no match -> Inject "Rescue" Founder Match
      
      // Determine type
      const isRescue = !isDay2; 
      
      const founderMatch = {
          id: 'founder-joker-' + todayParisStr,
          partnerId: 'popey-founder',
          name: 'Jean-Philippe',
          job: 'Fondateur Popey',
          city: 'Paris',
          score: 5.0,
          collabsCount: 999,
          time: '09h - 18h', // All day availability
          type: 'call_in', // User receives call
          phone: '+33600000000', // Placeholder
          avatar: '/jeanphilipperoth.jpg',
          tags: isRescue ? ['rescue'] : ['founder'], // Tag determines UI
          current_goals: ['Aider les membres'],
          big_goal: 'Créer le meilleur réseau',
          superpower: 'Connecteur',
          current_need: 'Feedback',
          status: 'pending',
          date: todayParisStr
      };
      
      // Add to list and resort
      // sortedMatches.unshift(founderMatch);
      // Actually, we should return this as the primary match if empty
      // But wait, getDailyMatches returns array.
      
      // Only inject if strictly NO match today.
      // activeMatches is already filtered for today/future.
      
      // Let's modify the return.
      if (sortedMatches.length === 0 || sortedMatches[0].date > todayParisStr) {
          // If no match at all OR next match is in future -> Show Founder Match TODAY
          return [founderMatch];
      }
  }

  // DAILY DASHBOARD RULE: Only show ONE primary match at a time to focus the user.
  // We return the most urgent one (earliest today or next available).
  // If we have future matches but no match today, we still return the future match (Waiting Card).
  // If we have NO matches at all, we return empty array (Waiting Card will calculate next slot).
  
  return sortedMatches.length > 0 ? [sortedMatches[0]] : [];
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
