"use server";

import { createClient } from "@/lib/supabase/server";

export async function getConversations() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  // Get all messages where I am sender or receiver
  const { data: messages, error } = await supabase
    .from("messages")
    .select(`
      id,
      content,
      created_at,
      sender_id,
      receiver_id
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }

  // Collect unique partner IDs
  const partnerIds = new Set<string>();
  messages?.forEach((msg: any) => {
    const isMe = msg.sender_id === user.id;
    partnerIds.add(isMe ? msg.receiver_id : msg.sender_id);
  });

  // Fetch partner profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, trade")
    .in("id", Array.from(partnerIds));
    
  const profileMap = new Map(profiles?.map((p: any) => [p.id, p]));

  // Group by partner
  const conversationsMap = new Map<string, any>();

  messages?.forEach((msg: any) => {
    const isMe = msg.sender_id === user.id;
    const partnerId = isMe ? msg.receiver_id : msg.sender_id;
    const partner = profileMap.get(partnerId);
    
    // If partner is null (deleted user?), skip
    if (!partner) return;

    if (!conversationsMap.has(partner.id)) {
      conversationsMap.set(partner.id, {
        partner: {
          id: partner.id,
          name: partner.display_name || "Membre",
          avatar: partner.avatar_url,
          job: partner.trade
        },
        lastMessage: msg.content,
        lastMessageDate: msg.created_at,
        unreadCount: 0 // Placeholder
      });
    }
  });

  return Array.from(conversationsMap.values());
}
