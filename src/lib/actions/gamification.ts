"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function incrementUserPoints(amount: number) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // 1. Get current points
  const { data: profile } = await supabase
    .from("profiles")
    .select("points")
    .eq("id", user.id)
    .single();

  const currentPoints = profile?.points || 0;
  const newPoints = currentPoints + amount;

  // 2. Update points
  const { error } = await supabase
    .from("profiles")
    .update({ points: newPoints })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating points:", error);
    throw new Error("Failed to update points");
  }

  revalidatePath("/mon-reseau-local/dashboard");
  return newPoints;
}

export async function getUserPoints() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return 0;

  const { data: profile } = await supabase
    .from("profiles")
    .select("points")
    .eq("id", user.id)
    .single();

  return profile?.points || 0;
}