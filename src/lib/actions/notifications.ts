"use server";

import { createClient } from "@/lib/supabase/server";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:contact@popey.academy",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function saveSubscription(subscription: any) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // We can use User Agent to distinguish devices roughly
  // In server actions, we might not have direct access to headers easily without passing them
  // For MVP, we just store it.
  
  // Clean up old subscriptions for this user if needed or just insert
  // We use upsert based on user_id if we want single device, but here we want multi-device
  // The unique constraint is (user_id, user_agent) roughly, but user_agent is not passed yet.
  // Let's just insert. If it fails due to unique constraint, we can ignore or update.
  // Actually, standard practice is just to save. Browser generates unique endpoint.
  
  // Let's check if this specific endpoint already exists
  const { data: existing } = await supabase
    .from("push_subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .filter("subscription->>endpoint", "eq", subscription.endpoint)
    .single();

  if (existing) {
    return { success: true, message: "Already subscribed" };
  }

  const { error } = await supabase.from("push_subscriptions").insert({
    user_id: user.id,
    subscription: subscription,
  });

  if (error) {
    console.error("Error saving subscription:", error);
    throw new Error("Failed to save subscription");
  }

  return { success: true };
}

export async function sendNotification(userId: string, title: string, body: string, url: string = "/mon-reseau-local/dashboard") {
  const supabase = await createClient();
  
  // 1. Get user subscriptions
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);

  if (!subscriptions || subscriptions.length === 0) {
    return { success: false, message: "No subscriptions found" };
  }

  // 2. Send to all
  const payload = JSON.stringify({
    title,
    body,
    url,
    icon: "/icon.svg",
  });

  const promises = subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(sub.subscription, payload);
      return { status: "fulfilled", id: sub.id };
    } catch (error: any) {
      console.error("Error sending push:", error);
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Subscription expired/gone, remove from DB
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        return { status: "rejected", id: sub.id, reason: "expired" };
      }
      return { status: "rejected", id: sub.id, reason: error };
    }
  });

  await Promise.all(promises);
  return { success: true };
}
