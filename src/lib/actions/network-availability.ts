"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveAvailability(date: string, slots: string[]) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("network_availabilities")
      .upsert(
        { 
          user_id: user.id, 
          date, 
          slots,
          created_at: new Date().toISOString()
        },
        { onConflict: 'user_id,date' }
      );

    if (error) {
      console.error("Error saving availability:", error);
      return { success: false, error: error.message };
    }

    // Safely revalidate without throwing
    try {
        revalidatePath("/mon-reseau-local/dashboard");
    } catch (e) {
        // Ignore revalidate errors in production
    }
    
    return { success: true };
  } catch (err: any) {
    console.error("Caught error in saveAvailability:", err);
    return { success: false, error: err.message || "Unknown error" };
  }
}

export async function getAvailability(date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("network_availabilities")
    .select("slots")
    .eq("user_id", user.id)
    .eq("date", date)
    .single();

  return data?.slots || [];
}
