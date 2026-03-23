"use server";

import { createClient } from "@/lib/supabase/server";

export async function getConversation(partnerId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  const { data: messages, error } = await supabase
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }

  return messages || [];
}

export async function sendMessage(partnerId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: "Unauthorized" };
  if (!content.trim()) return { success: false, error: "Message empty" };

  const { error } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      receiver_id: partnerId,
      content: content.trim()
    });

  if (error) {
    console.error("Error sending message:", error);
    return { success: false, error: error.message };
  }

  try {
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
      
    const senderName = senderProfile?.display_name || "Un membre";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const internalSecret = process.env.CRON_SECRET;

    if (!internalSecret) {
      return { success: true };
    }

    fetch(`${appUrl}/api/internal/send-notification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userId: partnerId,
            title: `Nouveau message de ${senderName}`,
            message: content.length > 50 ? content.substring(0, 50) + "..." : content,
            url: "/mon-reseau-local/dashboard/connections",
            secret: internalSecret
        })
    }).catch(e => console.error("Async notification trigger failed:", e));

  } catch (e) {
    console.error("Failed to trigger push notification:", e);
  }

  return { success: true };
}
