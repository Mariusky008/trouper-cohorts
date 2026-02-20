"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getNetworkSettings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  let { data: settings } = await supabase
    .from("network_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!settings) {
    // Default settings if not found
    return {
      notifications: true,
      visibility: "public"
    };
  }

  return settings;
}

export async function updateNetworkSettings(data: { notifications?: boolean; visibility?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("network_settings")
    .upsert({
      user_id: user.id,
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating settings:", error);
    throw new Error("Failed to update settings");
  }

  revalidatePath("/mon-reseau-local/dashboard/settings");
  return { success: true };
}
