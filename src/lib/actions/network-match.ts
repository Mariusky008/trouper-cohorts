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

  // Fetch Availabilities for slot comparison
  const matchDates = Array.from(new Set(matches.map(m => m.date)));
  const matchUserIds = Array.from(new Set(matches.flatMap(m => [m.user1_id, m.user2_id])));
  
  const { data: availabilities } = await supabase
      .from('network_availabilities')
      .select('user_id, date, slots')
      .in('user_id', matchUserIds)
      .in('date', matchDates);

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

      // Get slots for comparison
      const myAvail = availabilities?.find(a => a.user_id === user.id && a.date === match.date);
      const partnerAvail = availabilities?.find(a => a.user_id === partnerId && a.date === match.date);
      const mySlots = myAvail?.slots || [];
      const partnerSlots = partnerAvail?.slots || [];

      return {
        id: match.id,
        partnerId: partnerId,
        name: partnerData.display_name || "Membre Inconnu",
        job: partnerData.trade || "Membre",
        city: partnerData.city || "En ligne",
        score: trustScore?.score || 5.0,
        collabsCount: collabsCount || 0, // Real data from RPC
        time: match.time || "14:00",
        mySlots: mySlots,
        partnerSlots: partnerSlots,
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
        date: match.date,
        my_mission: isUser1 ? match.user1_mission : match.user2_mission,
        partner_mission: isUser1 ? match.user2_mission : match.user1_mission
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
          
          // Keep match visible all day (until 23h59) even if slot is passed
          // if (currentParisHour >= 21) return false;
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
  
  // 1. Get User Creation Date & Check if Onboarding Completed
  const { data: userData } = await supabase
    .from("profiles")
    .select("created_at, availability_status")
    .eq("id", user.id)
    .single();

  // Check if user has EVER validated a match (feedback count > 0)
  // This determines if they are still in "Onboarding" phase
  const { count: totalFeedbackCount } = await supabase
    .from('match_feedback')
    .select('*', { count: 'exact', head: true })
    .eq('giver_id', user.id);
    
  const hasCompletedFirstMatch = totalFeedbackCount && totalFeedbackCount > 0;

  // Calculate if Day 2 (Legacy logic kept for context, but now superseded by hasCompletedFirstMatch)
  // We compare created_at date with today
  let isDay2 = false;
  let created = new Date(); // Default
  
  if (userData?.created_at) {
      created = new Date(userData.created_at);
      const oneDay = 24 * 60 * 60 * 1000;
      const diffDays = Math.round(Math.abs((now.getTime() - created.getTime()) / oneDay));
      isDay2 = diffDays >= 1 && diffDays <= 3;
  }
  
  // 2. Check availability for today (Is today a working day for the user?)
  // We assume the user is available if not paused.
  
  // 3. Inject Founder Match if needed
  // Condition: No active match for TODAY + (Onboarding Pending OR Rescue needed)
  // AND not a weekend (Mon-Fri only)
  const hasMatchToday = activeMatches.some(m => m.date === todayParisStr);
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = currentDay === 0 || currentDay === 6;
  
  // RULE 1: If onboarding not completed (never validated a match), force Joker even if it's been weeks.
  // RULE 2: If no match today and no weekend, force Joker (Rescue).
  // Note: We check if they already did the match TODAY below.
  
  if (!hasMatchToday && !isWeekend && userData?.availability_status !== 'paused') {
      // Logic:
      // If Not Completed First Match -> Inject "Onboarding" Founder Match (Priority: Founder)
      // If Completed but no match -> Inject "Rescue" Founder Match
      
      // Determine type
      // If they haven't completed their first match yet, we keep them in "Onboarding" mode (Joker J+2 style)
      // regardless of how many days have passed.
      const isRescue = hasCompletedFirstMatch; 
      
      // CHECK IF ALREADY COMPLETED (Feedback exists for today)
      // Since the Founder Match is not in network_matches, we check if the user left a feedback for 'popey-founder' today.
      const { count: feedbackCount } = await supabase
        .from('match_feedback')
        .select('*', { count: 'exact', head: true })
        .eq('giver_id', user.id)
        .eq('receiver_id', 'popey-founder')
        .gte('created_at', todayParisStr); // Feedback created today
        
      if (feedbackCount && feedbackCount > 0) {
          // Already completed the founder match today!
          // Do not inject it. Return empty or next future match.
          // return sortedMatches.length > 0 ? [sortedMatches[0]] : [];
      } else if (sortedMatches.length === 0) {
          // Only inject if strictly NO match today AND no future match waiting
          
          const founderMatch = {
              id: 'founder-joker-' + todayParisStr,
              partnerId: 'popey-founder',
              name: 'Jean-Philippe',
              job: 'Fondateur Popey',
              city: 'Paris',
              score: 5.0,
              collabsCount: 999,
              time: '09h - 11h', // Default Slot 9h-11h (Rule 2)
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
          
          // If no match at all -> Show Founder Match TODAY (Rescue/Onboarding)
          return [founderMatch];
      }
  }

  // DAILY DASHBOARD RULE: Only show ONE primary match at a time to focus the user.
  // We return the most urgent one (earliest today or next available).
  // If we have future matches but no match today, we still return the future match (Waiting Card).
  // If we have NO matches at all, we return empty array (Waiting Card will calculate next slot).
  
  // NEW LOGIC (Requested by User):
  // We want to pass the FUTURE match to the frontend so it can be displayed as a "Locked Mystery Card" 
  // immediately after the current mission is validated.
  // So instead of returning just [sortedMatches[0]], we return up to 2 matches:
  // 1. The current active match (Today)
  // 2. The next upcoming match (Tomorrow)
  
  return sortedMatches.slice(0, 2);
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
