
"use server";

import { createClient } from "@/lib/supabase/server";

export type HistoryEvent = {
  id: string;
  type: 'match' | 'opportunity_sent' | 'opportunity_received' | 'call_validated';
  date: string; // ISO string
  title?: string;
  description?: string;
};

export async function getConnectionHistory(partnerId: string): Promise<HistoryEvent[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const events: HistoryEvent[] = [];

  // 1. Fetch Matches (to see when they met)
  const { data: matches } = await supabase
    .from("network_matches")
    .select("id, date, status")
    .or(`and(user1_id.eq.${user.id},user2_id.eq.${partnerId}),and(user1_id.eq.${partnerId},user2_id.eq.${user.id})`);

  if (matches) {
    matches.forEach(m => {
      // Event: Match
      events.push({
        id: `match-${m.id}`,
        type: 'match',
        date: m.date, // This is YYYY-MM-DD usually
        title: "Mise en relation",
        description: "Vous avez été connectés par l'algorithme."
      });

      // Event: Call Validated (if status is met)
      if (m.status === 'met') {
          // We don't have exact timestamp for validation, so we use the match date (or we could store it separately)
          // For now let's use match date + a fictional time or just the date
          events.push({
              id: `met-${m.id}`,
              type: 'call_validated',
              date: m.date,
              title: "Appel Validé",
              description: "Vous avez confirmé avoir échangé 15 min."
          });
      }
    });
  }

  // 2. Fetch Opportunities
  const { data: opportunities } = await supabase
    .from("network_opportunities")
    .select("id, created_at, title, author_id, receiver_id")
    .or(`and(author_id.eq.${user.id},receiver_id.eq.${partnerId}),and(author_id.eq.${partnerId},receiver_id.eq.${user.id})`);

  if (opportunities) {
      opportunities.forEach(op => {
          const isSent = op.author_id === user.id;
          events.push({
              id: `op-${op.id}`,
              type: isSent ? 'opportunity_sent' : 'opportunity_received',
              date: op.created_at,
              title: op.title || "Opportunité",
              description: isSent ? "Vous avez envoyé une opportunité." : "Vous avez reçu une opportunité."
          });
      });
  }

  // Sort by date descending
  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
