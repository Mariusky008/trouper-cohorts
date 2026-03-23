"use server";

import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_APP_EMAIL) {
  webpush.setVapidDetails(
    `mailto:${process.env.NEXT_PUBLIC_APP_EMAIL}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

type PushSubscriptionRow = {
  id: string;
  subscription: webpush.PushSubscription;
};

type SendNotificationResult = {
  success: boolean;
  skipped?: boolean;
  sent?: number;
  total?: number;
  error?: string;
};

export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  url: string = "/mon-reseau-local/dashboard"
): Promise<SendNotificationResult> {
  try {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_APP_EMAIL) {
      return { success: false, error: "Missing VAPID configuration" };
    }

    const supabase = await createClient();

    const { data: settings } = await supabase
      .from("network_settings")
      .select("notifications")
      .eq("user_id", userId)
      .maybeSingle();

    if (settings && settings.notifications === false) {
      return { success: true, skipped: true };
    }

    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("id, subscription")
      .eq("user_id", userId);

    if (!subscriptions || subscriptions.length === 0) {
      return { success: true, skipped: true, sent: 0, total: 0 };
    }

    const payload = JSON.stringify({
      title,
      body: message,
      icon: "/icon.svg",
      badge: "/icon.svg",
      url: url,
    });

    const typedSubscriptions = subscriptions as PushSubscriptionRow[];
    const promises = typedSubscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, payload);
        return { success: true };
      } catch (error: unknown) {
        if (
          typeof error === "object" &&
          error !== null &&
          "statusCode" in error &&
          (error.statusCode === 410 || error.statusCode === 404)
        ) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
        return { success: false };
      }
    });

    const results = await Promise.all(promises);
    const sent = results.filter((result) => result.success).length;
    return { success: sent > 0, sent, total: typedSubscriptions.length };
  } catch (error: unknown) {
    console.error("Error sending notification:", error);
    const messageError = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: messageError };
  }
}

export async function sendBulkNotification(
  userIds: string[],
  title: string,
  message: string,
  url: string = "/mon-reseau-local/dashboard"
) {
  const uniqueUserIds = Array.from(new Set(userIds.filter((id) => Boolean(id))));
  const results = await Promise.all(
    uniqueUserIds.map((userId) => sendNotification(userId, title, message, url))
  );

  const sent = results.reduce((acc, result) => acc + (result.sent || 0), 0);
  const successfulUsers = results.filter((result) => result.success).length;

  return {
    success: successfulUsers > 0,
    targetedUsers: uniqueUserIds.length,
    successfulUsers,
    sent,
  };
}

export async function getNotificationCounts() {
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
