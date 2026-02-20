"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveAvailability(date: string, slots: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

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
    throw new Error("Failed to save availability");
  }

  revalidatePath("/mon-reseau-local/dashboard");
  return { success: true };
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
