"use server";

import { createClient } from "@/lib/supabase/server";

export async function hasCompletedDailyCall() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  // 1. Get Today's Date in Paris (YYYY-MM-DD)
  const parisDateFormatter = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const todayParisStr = parisDateFormatter.format(new Date());

  // 2. Check Standard Match (network_matches)
  const { count: standardMatchCount } = await supabase
    .from("network_matches")
    .select('*', { count: 'exact', head: true })
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .eq("date", todayParisStr)
    .eq("status", "met");

  if (standardMatchCount && standardMatchCount > 0) {
      return true;
  }

  // 3. Check Founder/Rescue Match (match_feedback)
  // For matches that are not in network_matches (like 'popey-founder' joker), 
  // we check if a feedback was created today.
  const { count: feedbackCount } = await supabase
    .from('match_feedback')
    .select('*', { count: 'exact', head: true })
    .eq('giver_id', user.id)
    .gte('created_at', todayParisStr + "T00:00:00"); // Start of today

  if (feedbackCount && feedbackCount > 0) {
      return true;
  }

  return false;
}
