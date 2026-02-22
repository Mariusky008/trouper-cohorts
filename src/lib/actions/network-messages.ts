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

  return { success: true };
}
