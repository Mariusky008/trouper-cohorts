"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin"; // Import admin client
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export async function searchMembers(query: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  // Use admin client to bypass RLS for global search
  // Assuming 'profiles' table has RLS enabled that restricts viewing others unless matched
  const adminSupabase = createAdminClient();

  // Simple ILIKE search on profiles
  const { data, error } = await adminSupabase
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
  // We use simpler relation syntax to avoid FK naming issues if possible
  // and we select fields needed for ConnectionList + potential future needs
  const { data: matches, error } = await supabase
    .from("network_matches")
    .select(`
      user1_id,
      user2_id,
      date,
      status,
      user1:user1_id(id, display_name, trade, avatar_url),
      user2:user2_id(id, display_name, trade, avatar_url)
    `)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('date', { ascending: false }); // Newest first is usually better for "History"

  if (error) {
    console.error("Error fetching connections:", error);
    // Return empty array instead of throwing to prevent page crash
    return [];
  }

  // Fetch opportunities (sent or received by current user) to determine "Alliance Level"
  // Level 2 (Allié) = Exchanged at least one opportunity
  const { data: opportunities } = await supabase
    .from("network_opportunities")
    .select("author_id, receiver_id")
    .or(`author_id.eq.${user.id},receiver_id.eq.${user.id}`);
  
  const opportunityPartners = new Set<string>();
  if (opportunities) {
    opportunities.forEach((op: any) => {
      // If I am author, partner is receiver. If I am receiver, partner is author.
      const partnerId = op.author_id === user.id ? op.receiver_id : op.author_id;
      if (partnerId) opportunityPartners.add(partnerId);
    });
  }

  // Fetch "Trust Scores" to get opportunities_given for each partner
  // We need to fetch trust scores for all partners in the matches
  // First, collect all partner IDs
  const partnerIds = new Set<string>();
  if (matches) {
      matches.forEach(m => {
          const partnerId = m.user1_id === user.id ? m.user2_id : m.user1_id;
          if (partnerId) partnerIds.add(partnerId);
      });
  }
  
  const trustMap = new Map();
  if (partnerIds.size > 0) {
      const { data: trustScores } = await supabase
        .from("trust_scores")
        .select("user_id, opportunities_given")
        .in("user_id", Array.from(partnerIds));
      
      if (trustScores) {
          trustScores.forEach((t: any) => trustMap.set(t.user_id, t.opportunities_given || 0));
      }
  }

  // Fetch feedbacks given by current user to display badges
  const { data: feedbacks } = await supabase
    .from("match_feedback")
    .select("receiver_id, rating, tag")
    .eq("giver_id", user.id);

  const feedbackMap = new Map();
  if (feedbacks) {
    feedbacks.forEach((f: any) => feedbackMap.set(f.receiver_id, { rating: f.rating, tag: f.tag }));
  }

  // Transform matches into a list of unique connections
  const connectionsMap = new Map();

  if (matches) {
    for (const match of matches) {
      const isUser1 = match.user1_id === user.id;
      // When using simple alias, Supabase returns a single object if 1:1 or 1:M where M=1, but let's cast to any to avoid TS issues for now as we know the structure
      const user1 = match.user1 as any;
      const user2 = match.user2 as any;
      const partner = isUser1 ? user2 : user1;
      
      if (partner && !connectionsMap.has(partner.id)) {
        const feedback = feedbackMap.get(partner.id);
        const givenCount = trustMap.get(partner.id) || 0;
        
        let allianceLevel = 0;
        // Level 1: Call validated
        if (match.status === 'met') {
            allianceLevel = 1;
        }
        // Level 2: Opportunity exchanged (Overrides Level 1)
        if (opportunityPartners.has(partner.id)) {
            allianceLevel = 2;
        }

        connectionsMap.set(partner.id, {
          id: partner.id,
          name: partner.display_name || "Membre Inconnu",
          job: partner.trade || "Membre",
          avatar: partner.avatar_url,
          lastInteraction: match.date,
          feedback: feedback, // { rating, tag }
          allianceLevel,
          givenCount // New field for generosity badge
        });
      }
    }
  }

  return Array.from(connectionsMap.values());
}

export async function getUserProfile(userId?: string) {
  const supabase = await createClient();
  let targetId = userId;
  
  if (!targetId) {
      const { data: { user } } = await supabase.auth.getUser();
      targetId = user?.id;
  }

  if (!targetId) return null;

  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, first_name, display_name, avatar_url, trade, city, bio, phone, current_goals, superpower, current_need, big_goal, give_profile, receive_profile, featured_link, offer_title, offer_description, offer_price, offer_original_price, offer_active, linkedin_url, instagram_handle, facebook_handle, website_url")
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

  const given = trustScore?.opportunities_given || 0;
  const received = trustScore?.opportunities_received || 0;
  
  // Reciprocity Calculation: (Given / Received) * 100
  // If received is 0, we assume 100% if given > 0 (generous), else 100% (neutral start)
  let reciprocity = 100;
  if (received > 0) {
    reciprocity = Math.min(100, Math.round((given / received) * 100));
  } else if (given > 0) {
    reciprocity = 100; // Giving without receiving is 100% (or could be >100% but let's cap it)
  }

  return {
    ...profile,
    score: trustScore?.score || 5.0,
    stats: {
      opportunities: given + received,
      reciprocity: `${reciprocity}%`,
      seniority: format(new Date(profile.created_at || new Date()), 'MMMM yyyy', { locale: fr })
    }
  };
}

export async function updateUserProfile(data: { bio?: string; trade?: string; city?: string; phone?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Use admin client to bypass RLS
  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
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
