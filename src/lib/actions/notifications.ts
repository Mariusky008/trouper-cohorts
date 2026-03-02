"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Lazy initialization of VAPID details
let isVapidInitialized = false;

function ensureVapidInitialized() {
  if (isVapidInitialized) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    console.warn("VAPID keys are missing. Push notifications will be disabled.");
    return false;
  }

  try {
    webpush.setVapidDetails(
      "mailto:contact@popey.academy",
      publicKey,
      privateKey
    );
    isVapidInitialized = true;
    return true;
  } catch (error) {
    console.error("Failed to initialize VAPID:", error);
    return false;
  }
}

export async function sendNotification(userId: string, title: string, body: string, url: string = "/mon-reseau-local/dashboard") {
  // Check VAPID config before anything else
  if (!ensureVapidInitialized()) {
    console.error("Cannot send notification: VAPID keys missing or invalid");
    return { success: false, message: "VAPID configuration error" };
  }

  // USE ADMIN CLIENT to bypass RLS and read other users' subscriptions
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
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
