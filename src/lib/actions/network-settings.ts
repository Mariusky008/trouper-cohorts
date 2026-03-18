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
      visibility: "public",
      frequency_per_week: 5,
      preferred_days: ['mon', 'tue', 'wed', 'thu', 'fri'],
      preferred_slots: ['09-11', '14-16'],
      status: 'active'
    };
  }

  // Ensure arrays are initialized even if null in DB
  return {
    ...settings,
    preferred_days: settings.preferred_days || ['mon', 'tue', 'wed', 'thu', 'fri'],
    preferred_slots: settings.preferred_slots || ['09-11', '14-16']
  };
}

export async function updateNetworkSettings(data: { 
  notifications?: boolean; 
  visibility?: string;
  frequency_per_week?: number;
  preferred_days?: string[];
  preferred_slots?: string[];
  status?: string;
}) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error in updateNetworkSettings:", authError);
      return { success: false, error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("network_settings")
      .upsert({
        user_id: user.id,
        ...data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error("Supabase error updating settings:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (err: any) {
    console.error("Caught error in updateNetworkSettings:", err);
    return { success: false, error: err.message || "Unknown error" };
  }
}
