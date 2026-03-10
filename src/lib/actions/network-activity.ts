
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

  // 1. Recent Opportunities (Last 5)
  const { data: opportunities } = await supabase
    .from("network_opportunities")
    .select(`
      id, created_at,
      author:author_id(display_name, avatar_url),
      receiver:receiver_id(display_name, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  if (opportunities) {
    opportunities.forEach((op: any) => {
      if (op.author && op.receiver) {
        activities.push({
          id: `op-${op.id}`,
          type: 'opportunity',
          actor1: { 
            name: formatName(op.author.display_name), 
            avatar: op.author.avatar_url 
          },
          actor2: { 
            name: formatName(op.receiver.display_name), 
            avatar: op.receiver.avatar_url 
          },
          date: op.created_at,
          timeAgo: formatDistanceToNow(new Date(op.created_at), { addSuffix: true, locale: fr })
        });
      }
    });
  }

  // 2. Recent Validated Calls (Met) (Last 5)
  // We use updated_at or date depending on what's available for 'met' timestamp
  // Assuming date is the match date, but updated_at might be when status changed
  // Let's use date for simplicity or updated_at if available
  const { data: matches } = await supabase
    .from("network_matches")
    .select(`
      id, date, status, created_at,
      user1:user1_id(display_name, avatar_url),
      user2:user2_id(display_name, avatar_url)
    `)
    .eq('status', 'met')
    .order('date', { ascending: false })
    .limit(5);

  if (matches) {
    matches.forEach((m: any) => {
      if (m.user1 && m.user2) {
        activities.push({
          id: `met-${m.id}`,
          type: 'met',
          actor1: { 
            name: formatName(m.user1.display_name), 
            avatar: m.user1.avatar_url 
          },
          actor2: { 
            name: formatName(m.user2.display_name), 
            avatar: m.user2.avatar_url 
          },
          date: m.date, // or created_at
          timeAgo: formatDistanceToNow(new Date(m.date), { addSuffix: true, locale: fr })
        });
      }
    });
  }

  // Sort by date desc and limit total
  return activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);
}
