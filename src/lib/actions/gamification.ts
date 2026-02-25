"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function incrementUserPoints(amount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Try to use RPC first
  const { error } = await supabase.rpc('increment_points', { 
    user_id: user.id, 
    amount: amount 
  });

  if (error) {
    console.warn("RPC failed, falling back to manual update:", error);
    
    // Manual update
    const { data: profile } = await supabase
      .from("profiles")
      .select("points")
      .eq("id", user.id)
      .single();

    const currentPoints = profile?.points || 0;
    const newPoints = currentPoints + amount;

    await supabase
      .from("profiles")
      .update({ points: newPoints })
      .eq("id", user.id);
  }

  revalidatePath("/mon-reseau-local/dashboard");
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

export async function getUserStreak() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return 0;

  try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("streak_days")
        .eq("id", user.id)
        .single();

      return profile?.streak_days || 0;
  } catch (e) {
      return 0;
  }
}