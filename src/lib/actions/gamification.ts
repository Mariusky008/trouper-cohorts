"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function incrementUserPoints(amount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Use atomic RPC function for safety and concurrency
  const { error } = await supabase.rpc('increment_points', { 
    user_id: user.id, 
    amount: amount 
  });

  if (error) {
    // Fallback: If RPC fails (e.g. function missing), try manual update
    console.warn("RPC increment_points failed, falling back to manual update:", error);
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("points")
      .eq("id", user.id)
      .single();

    const currentPoints = profile?.points || 0;
    const newPoints = currentPoints + amount;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ points: newPoints })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating points manually:", updateError);
      throw new Error("Failed to update points");
    }
    
    revalidatePath("/mon-reseau-local/dashboard");
    return newPoints;
  }

  revalidatePath("/mon-reseau-local/dashboard");
  // Return updated points (need to fetch again as RPC returns void)
  return await getUserPoints();
}

export async function getUserPoints() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return 0;

  const { data: profile } = await supabase
    .from("profiles")
    .select("points")
    .eq("id", user.id)
    .single();

  return profile?.points || 0;
}