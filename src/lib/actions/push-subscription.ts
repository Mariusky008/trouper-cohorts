"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";

type PushSubscriptionJSON = {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: Record<string, string>;
};

export async function saveSubscription(subscription: PushSubscriptionJSON) {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  if (!subscription.endpoint) {
    throw new Error("Subscription endpoint missing");
  }

  if (!subscription.keys?.p256dh || !subscription.keys?.auth) {
    throw new Error("Subscription keys missing");
  }

  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent") || "unknown";

  const { error } = await supabaseAdmin.from("push_subscriptions").upsert({
    user_id: user.id,
    subscription: subscription,
    user_agent: userAgent,
  }, {
    onConflict: "user_id,user_agent",
  });

  if (error) {
    console.error("Error saving subscription:", error);
    throw new Error("Failed to save subscription");
  }

  return { success: true };
}

export async function removeSubscription(endpoint: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  if (!endpoint) {
    return { success: true };
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .filter("subscription->>endpoint", "eq", endpoint);

  if (error) {
    console.error("Error removing subscription:", error);
    throw new Error("Failed to remove subscription");
  }

  return { success: true };
}

export async function sendTestPushToCurrentUser() {
  const supabase = await createClient();
  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent") || "unknown";
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    throw new Error("CRON_SECRET manquant");
  }

  const response = await fetch(`${appUrl}/api/internal/send-notification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: user.id,
      title: "Test push Popey ✅",
      message: "Si vous voyez ceci, les notifications fonctionnent.",
      url: "/mon-reseau-local/dashboard/settings",
      targetUserAgent: userAgent,
      secret,
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || "Échec envoi notification test");
  }

  if (!payload?.success) {
    throw new Error(payload?.error || "Push non envoyé");
  }

  if (payload?.skipped || !payload?.sent) {
    if (payload?.reason === "notifications_disabled") {
      throw new Error("Les notifications sont désactivées dans vos paramètres.");
    }
    throw new Error("Aucun appareil iPhone actif trouvé. Réactivez les notifications sur ce téléphone.");
  }

  return { success: true };
}
