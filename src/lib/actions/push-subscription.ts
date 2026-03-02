"use server";

import { createClient } from "@/lib/supabase/server";

// This file is SAFE for Client Components to import.
// It DOES NOT import web-push or any heavy native module.

export async function saveSubscription(subscription: any) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }
  
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
