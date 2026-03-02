"use server";

import { createClient } from "@/lib/supabase/server";

export type TrackingStatus = "todo" | "pending" | "validated" | "followup";

export interface TradeTracking {
  id?: string;
  sphere_id: string;
  trade_name: string;
  linkedin_contacted: boolean;
  instagram_contacted: boolean;
  first_name: string;
  last_name: string;
  profile_link: string;
  status: TrackingStatus;
}

export async function getCMTracking() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cm_tracking")
    .select("*");
  
  if (error) {
    console.error("Error fetching CM tracking:", error);
    return [];
  }
  
  return data as TradeTracking[];
}

export async function upsertCMTracking(tracking: Partial<TradeTracking>) {
  const supabase = await createClient();
  
  // Ensure we have the composite key
  if (!tracking.sphere_id || !tracking.trade_name) {
    return { error: "Missing sphere_id or trade_name" };
  }

  // Use raw upsert
  const { data, error } = await supabase
    .from("cm_tracking")
    .upsert(tracking, {
      onConflict: "sphere_id, trade_name",
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error updating CM tracking:", error);
    return { error: error.message };
  }

  return { data };
}

export async function clearCMTracking() {
  const supabase = await createClient();
  const { error } = await supabase
    .from("cm_tracking")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

  if (error) {
    return { error: error.message };
  }
  return { success: true };
}
