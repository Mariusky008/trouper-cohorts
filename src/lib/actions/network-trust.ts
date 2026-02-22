"use server";

import { createClient } from "@/lib/supabase/server";

export async function getTrustScore() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Fetch score from DB (for the score value itself)
  const { data: scoreData } = await supabase
    .from("trust_scores")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // 2. Fetch REAL counts from opportunities table to be sure
  const { count: givenCount } = await supabase
    .from("network_opportunities")
    .select("*", { count: 'exact', head: true })
    .eq("giver_id", user.id)
    .eq("status", "validated");

  const { count: receivedCount } = await supabase
    .from("network_opportunities")
    .select("*", { count: 'exact', head: true })
    .eq("receiver_id", user.id)
    .eq("status", "validated");

  // Calculate debt level (opportunities received > 30 days ago)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { count: debtCount } = await supabase
    .from("network_opportunities")
    .select("*", { count: 'exact', head: true })
    .eq("receiver_id", user.id)
    .eq("status", "validated")
    .lt("created_at", thirtyDaysAgo.toISOString());

  // Calculate REAL debt level: Total Points Received - Total Points Given
  // This is a simplistic view, but gives a general idea of balance
  const { data: givenOpps } = await supabase
    .from("network_opportunities")
    .select("points")
    .eq("giver_id", user.id)
    .eq("status", "validated");
    
  const { data: receivedOpps } = await supabase
    .from("network_opportunities")
    .select("points")
    .eq("receiver_id", user.id)
    .eq("status", "validated");

  const totalGivenPoints = givenOpps?.reduce((acc, curr) => acc + (curr.points || 0), 0) || 0;
  const totalReceivedPoints = receivedOpps?.reduce((acc, curr) => acc + (curr.points || 0), 0) || 0;
  
  // Debt is positive if I received more than I gave
  const pointsBalance = totalReceivedPoints - totalGivenPoints;

  return {
    score: scoreData?.score ?? 5.0,
    opportunities_given: givenCount || 0,
    opportunities_received: receivedCount || 0,
    debt_level: Math.max(0, debtCount || 0), // Count of old unreturned favors
    points_balance: pointsBalance // New field for detailed balance
  };
}

export async function getCredits() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Opportunities I GAVE that are VALIDATED
  const { data } = await supabase
    .from("network_opportunities")
    .select("*")
    .eq("giver_id", user.id)
    .eq("status", "validated")
    .order("created_at", { ascending: true });

  if (!data || data.length === 0) return [];

  // Fetch profiles
  const userIds = data.map((d: any) => d.receiver_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", userIds);
    
  const profileMap = new Map(profiles?.map((p: any) => [p.id, p]));

  return data.map((opp: any) => {
    const partner = profileMap.get(opp.receiver_id);
    return {
      id: opp.id,
      partner: partner?.display_name || "Membre",
      avatar: partner?.avatar_url,
      reason: opp.type,
      date: new Date(opp.created_at).toLocaleDateString('fr-FR')
    };
  });
}

export async function getDebts() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  // 1. Get ALL validated opportunities involving the user (Received OR Given)
  const { data: allOpps } = await supabase
    .from("network_opportunities")
    .select("*")
    .or(`receiver_id.eq.${user.id},giver_id.eq.${user.id}`)
    .eq("status", "validated")
    .order("created_at", { ascending: true }); // Oldest first

  if (!allOpps || allOpps.length === 0) return [];

  // 2. Group by Partner and Calculate Net Balance
  const partnerBalances = new Map<string, { balance: number, receivedOpps: any[] }>();

  allOpps.forEach((opp: any) => {
    const isReceived = opp.receiver_id === user.id;
    const partnerId = isReceived ? opp.giver_id : opp.receiver_id;
    
    if (!partnerBalances.has(partnerId)) {
      partnerBalances.set(partnerId, { balance: 0, receivedOpps: [] });
    }
    
    const entry = partnerBalances.get(partnerId)!;
    
    if (isReceived) {
      entry.balance -= (opp.points || 0); // Debt increases (negative balance)
      entry.receivedOpps.push(opp);
    } else {
      entry.balance += (opp.points || 0); // Credit increases (positive balance)
    }
  });

  // 3. Filter partners where I have a NET DEBT (balance < 0)
  const debtList: any[] = [];
  const partnerIdsToFetch = new Set<string>();

  for (const [partnerId, data] of partnerBalances.entries()) {
    if (data.balance < 0) {
      // I owe this person points overall.
      // We show the most recent "Received" opportunity as the context for this debt.
      // Or we show the oldest one that contributed to the debt? Let's show the oldest one to encourage clearing old debts.
      const oldestOpp = data.receivedOpps[0];
      if (oldestOpp) {
        debtList.push({
          ...oldestOpp,
          net_debt_points: Math.abs(data.balance) // Store the actual remaining debt amount
        });
        partnerIdsToFetch.add(partnerId);
      }
    }
  }

  if (debtList.length === 0) return [];

  // 4. Fetch profiles for the filtered list
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", Array.from(partnerIdsToFetch));
    
  const profileMap = new Map(profiles?.map((p: any) => [p.id, p]));

  return debtList.map((opp: any) => {
    const partner = profileMap.get(opp.giver_id);
    const created = new Date(opp.created_at);
    const deadline = new Date(created);
    deadline.setDate(deadline.getDate() + 30);
    
    const now = new Date();
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      id: opp.id,
      partner: partner?.display_name || "Membre",
      partnerId: opp.giver_id,
      avatar: partner?.avatar_url,
      reason: opp.type,
      // Add context about remaining points if needed in UI later
      remainingPoints: opp.net_debt_points, 
      daysLeft,
      urgent: daysLeft < 5
    };
  });
}
