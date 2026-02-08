"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createBuddyGroup(formData: FormData) {
  const supabase = await createClient();
  const cohortId = String(formData.get("cohort_id"));
  const name = String(formData.get("name") || "Nouveau Groupe");

  // Create group
  const { data: group, error } = await supabase
    .from("buddy_groups")
    .insert({
      cohort_id: cohortId,
      name,
    })
    .select()
    .single();

  if (error) {
    console.error("Create group error:", error);
    return { error: "Erreur création groupe" };
  }

  // Add members if selected (we might need a more complex form for this, 
  // or do it in a second step. For MVP, we just create the group container).
  
  revalidatePath(`/admin/cohorts/${cohortId}`);
  return { success: true };
}

export async function addMemberToGroup(formData: FormData) {
    const supabase = await createClient();
    const groupId = String(formData.get("group_id"));
    const userId = String(formData.get("user_id"));
    const cohortId = String(formData.get("cohort_id"));

    const { error } = await supabase
        .from("buddy_group_members")
        .insert({
            group_id: groupId,
            user_id: userId
        });

    if (error) {
        return { error: "Impossible d'ajouter le membre (déjà dans un groupe ?)" };
    }

    revalidatePath(`/admin/cohorts/${cohortId}`);
    return { success: true };
}

export async function removeMemberFromGroup(formData: FormData) {
    const supabase = await createClient();
    const groupId = String(formData.get("group_id"));
    const userId = String(formData.get("user_id"));
    const cohortId = String(formData.get("cohort_id"));

    await supabase
        .from("buddy_group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userId);

    revalidatePath(`/admin/cohorts/${cohortId}`);
    return { success: true };
}

export async function deleteBuddyGroup(formData: FormData) {
  const supabase = await createClient();
  const groupId = String(formData.get("group_id"));
  const cohortId = String(formData.get("cohort_id"));

  await supabase.from("buddy_groups").delete().eq("id", groupId);

  revalidatePath(`/admin/cohorts/${cohortId}`);
  return { success: true };
}
