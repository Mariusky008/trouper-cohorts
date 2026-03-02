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

// import { sendNotification } from "./notifications"; // REMOVED to avoid bundling web-push

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

  // Send Push Notification via Internal API
  try {
    // Get sender name for the notification
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
      
    const senderName = senderProfile?.display_name || "Un membre";
    
    // Construct absolute URL for internal fetch
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Trigger internal notification API
    fetch(`${appUrl}/api/internal/send-notification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userId: partnerId,
            title: `Nouveau message de ${senderName}`,
            message: content.length > 50 ? content.substring(0, 50) + "..." : content,
            url: `/mon-reseau-local/dashboard/chat/${user.id}`,
            secret: process.env.CRON_SECRET || "internal-popey-secret"
        })
    }).catch(e => console.error("Async notification trigger failed:", e));

  } catch (e) {
    console.error("Failed to trigger push notification:", e);
    // Don't block the response, just log error
  }

  return { success: true };
}
