"use server";

import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

// Configure VAPID
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.NEXT_PUBLIC_APP_EMAIL || "contact@popey.academy"}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  url: string = "/mon-reseau-local/dashboard"
) {
  try {
    const supabase = await createClient();

    // 1. Get user's push subscriptions
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (!subscriptions || subscriptions.length === 0) {
      return { success: false, error: "No subscriptions found" };
    }

    // 2. Prepare payload
    const payload = JSON.stringify({
      title,
      body: message,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      url: url,
    });

    // 3. Send to all subscriptions
    const promises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, payload);
        return { success: true };
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription expired or gone, delete it
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
        return { success: false, error };
      }
    });

    await Promise.all(promises);
    return { success: true };
  } catch (error) {
    console.error("Error sending notification:", error);
    return { success: false, error };
  }
}

export async function getNotificationCounts() {
  noStore();
  const supabase = await createClient();
  
  // 1. Market Opportunities Count
  const { count: marketCount } = await supabase
    .from("network_opportunities")
    .select("*", { count: 'exact', head: true })
    .eq('visibility', 'public')
    .eq('status', 'available');

  // 2. Offers Count (Network Searches + Privileged Offers)
  // For simplicity, let's count network searches (public calls)
  const { count: searchesCount } = await supabase
    .from("network_requests")
    .select("*", { count: 'exact', head: true });

  return {
    market: marketCount || 0,
    offers: searchesCount || 0
  };
}
