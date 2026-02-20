"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function searchMembers(query: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  // Simple ILIKE search on profiles
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, trade, avatar_url")
    .ilike("display_name", `%${query}%`)
    .limit(5);

  if (error) {
    console.error("Error searching members:", error);
    return [];
  }

  return (data || []).map((profile: any) => ({
    id: profile.id,
    name: profile.display_name,
    job: profile.trade || "Membre",
    avatar: profile.avatar_url
  }));
}

export async function getConnections() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  // Fetch matches where current user is involved
  const { data: matches, error } = await supabase
    .from("network_matches")
    .select(`
      user1_id,
      user2_id,
      date,
      user1:user1_id(id, display_name, trade, avatar_url),
      user2:user2_id(id, display_name, trade, avatar_url)
    `)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('date', { ascending: false });

  if (error) {
    console.error("Error fetching connections:", error);
    return [];
  }

  // Transform matches into a list of unique connections
  const connectionsMap = new Map();

  matches?.forEach((match: any) => {
    const isUser1 = match.user1_id === user.id;
    const partner = isUser1 ? match.user2 : match.user1;
    
    // Only add if not already present (prefer most recent match due to order)
    if (!connectionsMap.has(partner.id)) {
      connectionsMap.set(partner.id, {
        id: partner.id,
        name: partner.display_name,
        job: partner.trade || "Membre",
        avatar: partner.avatar_url,
        lastInteraction: match.date
      });
    }
  });

  return Array.from(connectionsMap.values());
}

export async function getUserProfile(userId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const targetId = userId || user?.id;
  if (!targetId) return null;

  // 1. Fetch Profile
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", targetId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  // 2. Fetch Stats (Trust Score)
  const { data: trustScore } = await supabase
    .from("trust_scores")
    .select("score, opportunities_given, opportunities_received")
    .eq("user_id", targetId)
    .single();

  return {
    ...profile,
    score: trustScore?.score || 5.0,
    stats: {
      opportunities: (trustScore?.opportunities_given || 0) + (trustScore?.opportunities_received || 0),
      reciprocity: "100%", // Todo: calculate real reciprocity
      seniority: new Date(profile.created_at || Date.now()).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    }
  };
}

export async function updateUserProfile(data: { bio?: string; trade?: string; city?: string; phone?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", user.id);

  if (error) {
    console.error("Error updating profile:", error);
    throw new Error("Failed to update profile");
  }

  revalidatePath("/mon-reseau-local/dashboard/profile");
  return { success: true };
}
