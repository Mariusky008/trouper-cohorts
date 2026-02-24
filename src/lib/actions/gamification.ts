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
      .select("points, streak_days, last_activity_date")
      .eq("id", user.id)
      .single();

    const currentPoints = profile?.points || 0;
    const newPoints = currentPoints + amount;

    // Calculate Streak
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const lastActivity = profile?.last_activity_date;
    
    let newStreak = profile?.streak_days || 0;
    
    if (lastActivity) {
        const lastDate = new Date(lastActivity);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastActivity === today) {
            // Already active today, streak doesn't change
        } else if (lastActivity === yesterdayStr) {
            // Consecutive day
            newStreak += 1;
        } else {
            // Broken streak
            newStreak = 1;
        }
    } else {
        // First time
        newStreak = 1;
    }

    // Try to update with streak columns (might fail if columns don't exist yet, so we handle error gracefully)
    try {
        const { error: updateError } = await supabase
        .from("profiles")
        .update({ 
            points: newPoints,
            streak_days: newStreak,
            last_activity_date: today
        })
        .eq("id", user.id);

        if (updateError) {
            // If error (e.g. column missing), fallback to just points
            console.warn("Could not update streak, updating points only", updateError);
            await supabase
                .from("profiles")
                .update({ points: newPoints })
                .eq("id", user.id);
        }
    } catch (e) {
        // Fallback points only
         await supabase
            .from("profiles")
            .update({ points: newPoints })
            .eq("id", user.id);
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