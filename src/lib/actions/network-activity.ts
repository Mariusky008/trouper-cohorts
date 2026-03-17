
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export type NetworkActivity = {
  id: string;
  type: 'opportunity' | 'met' | 'match';
  actor1: { name: string; avatar?: string };
  actor2: { name: string; avatar?: string };
  date: string;
  timeAgo: string;
};

// Helper to anonymize name (First Name + Last Initial)
function formatName(fullName: string) {
  if (!fullName) return "Membre";
  const parts = fullName.split(' ');
  if (parts.length > 1) {
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  }
  return parts[0];
}

export async function getNetworkActivity(): Promise<NetworkActivity[]> {
  const supabase = createAdminClient();
  const activities: NetworkActivity[] = [];
  const userIds = new Set<string>();

  // 1. Recent Opportunities (Last 5)
  const { data: opportunities } = await supabase
    .from("network_opportunities")
    .select("id, created_at, giver_id, receiver_id")
    .order('created_at', { ascending: false })
    .limit(5);

  if (opportunities) {
    opportunities.forEach((op: any) => {
        if (op.giver_id) userIds.add(op.giver_id);
        if (op.receiver_id) userIds.add(op.receiver_id);
    });
  }

  // 2. Recent Validated Calls (Met) (Last 5)
  const { data: matches } = await supabase
    .from("network_matches")
    .select("id, date, status, user1_id, user2_id")
    .eq('status', 'met')
    .order('date', { ascending: false })
    .limit(5);

  if (matches) {
    matches.forEach((m: any) => {
        if (m.user1_id) userIds.add(m.user1_id);
        if (m.user2_id) userIds.add(m.user2_id);
    });
  }

  // 3. Fetch Profiles manually to avoid relation errors
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in('id', Array.from(userIds));

  const profileMap = new Map();
  if (profiles) {
      profiles.forEach((p: any) => profileMap.set(p.id, p));
  }

  // 4. Build Activities
  if (opportunities) {
      opportunities.forEach((op: any) => {
          const giver = profileMap.get(op.giver_id);
          const receiver = profileMap.get(op.receiver_id);

          if (giver && receiver) {
              activities.push({
                  id: `op-${op.id}`,
                  type: 'opportunity',
                  actor1: { 
                    name: formatName(giver.display_name), 
                    avatar: giver.avatar_url 
                  },
                  actor2: { 
                    name: formatName(receiver.display_name), 
                    avatar: receiver.avatar_url 
                  },
                  date: op.created_at,
                  timeAgo: formatDistanceToNow(new Date(op.created_at), { addSuffix: true, locale: fr })
              });
          }
      });
  }

  if (matches) {
      matches.forEach((m: any) => {
          const user1 = profileMap.get(m.user1_id);
          const user2 = profileMap.get(m.user2_id);

          if (user1 && user2) {
              activities.push({
                  id: `met-${m.id}`,
                  type: 'met',
                  actor1: { 
                    name: formatName(user1.display_name), 
                    avatar: user1.avatar_url 
                  },
                  actor2: { 
                    name: formatName(user2.display_name), 
                    avatar: user2.avatar_url 
                  },
                  date: m.date,
                  timeAgo: formatDistanceToNow(new Date(m.date), { addSuffix: true, locale: fr })
              });
          }
      });
  }

  // Sort by date desc
  const sortedActivities = activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Deduplicate pairs (e.g. if A and B matched, and A sent B an opportunity, only show the most recent interaction)
  const uniquePairs = new Set<string>();
  const deduplicatedActivities: NetworkActivity[] = [];

  for (const act of sortedActivities) {
      // Create a unique pair key regardless of order (A-B is same as B-A)
      const pairKey = [act.actor1.name, act.actor2.name].sort().join('-');
      if (!uniquePairs.has(pairKey)) {
          uniquePairs.add(pairKey);
          deduplicatedActivities.push(act);
      }
  }

  // Ensure we always return an even number of items to make scrolling seamless if we duplicate it for the marquee
  return deduplicatedActivities.slice(0, 10);
}
