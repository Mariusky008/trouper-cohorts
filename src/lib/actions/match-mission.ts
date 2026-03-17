"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updateMatchMission(matchId: string, missionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Determine if user is user1 or user2
  const { data: match, error: fetchError } = await supabase
    .from("network_matches")
    .select("user1_id, user2_id")
    .eq("id", matchId)
    .single();

  if (fetchError || !match) throw new Error("Match not found");

  const isUser1 = match.user1_id === user.id;
  const isUser2 = match.user2_id === user.id;

  if (!isUser1 && !isUser2) throw new Error("Not a participant");

  const updateData = isUser1 ? { user1_mission: missionId } : { user2_mission: missionId };

  // Use Admin Client to bypass RLS policies that might restrict updates
  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("network_matches")
    .update(updateData)
    .eq("id", matchId);

  if (error) {
      console.error("Error updating mission:", error);
      throw error;
  }

  revalidatePath('/mon-reseau-local/dashboard');
  return { success: true };
}
