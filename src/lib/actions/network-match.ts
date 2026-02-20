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
      user1:user1_id(id, display_name, avatar_url, trade),
      user2:user2_id(id, display_name, avatar_url, trade)
    `)
    .eq("date", today)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .maybeSingle();

  if (!match) return null;

  const isUser1 = match.user1_id === user.id;
  const partner = isUser1 ? match.user2 : match.user1;

  // Determine who calls (arbitrary logic: user1 calls user2)
  const type = isUser1 ? 'call_out' : 'call_in';

  return {
    id: match.id,
    name: partner.display_name,
    job: partner.trade || "Membre",
    city: "En ligne", // Or fetch from profile
    score: 5.0, // Should be fetched from trust_scores
    time: "14:00", // Default or stored
    type,
    avatar: partner.avatar_url,
    tags: ["Entrepreneur"],
    status: match.status
  };
}
