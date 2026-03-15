"use server";
import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

export async function getNotificationCounts() {
  noStore();
  const supabase = await createClient();
  
  // 1. Market Opportunities Count
  const { count: marketCount } = await supabase
    .from("network_opportunities")
    .select("*", { count: 'exact', head: true })
    .eq('visibility', 'public')
    .eq('status', 'available');

  // 2. Offers Count (Network Searches + Privileged Offers)
  // For simplicity, let's count network searches (public calls)
  const { count: searchesCount } = await supabase
    .from("network_requests")
    .select("*", { count: 'exact', head: true });

  return {
    market: marketCount || 0,
    offers: searchesCount || 0
  };
}