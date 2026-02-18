"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function completeMission(missionId: string) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non connecté" };
  }

  if (!missionId) {
    return { error: "Mission invalide" };
  }

  // 1. Vérifier si toutes les étapes sont validées
  const { data: steps } = await supabase
    .from("mission_steps")
    .select("id")
    .eq("mission_id", missionId);

  if (steps && steps.length > 0) {
      const stepIds = steps.map(s => s.id);
      const { data: userSteps } = await supabase
        .from("user_mission_steps")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "validated")
        .in("step_id", stepIds);
      
      if (!userSteps || userSteps.length < stepIds.length) {
          return { error: "Vous devez valider toutes les étapes avant de terminer la mission." };
      }
  }

  // 2. Enregistrer la soumission globale
  const { error } = await supabase.from("submissions").upsert(
    {
      mission_id: missionId,
      user_id: user.id,
      proof_url: "auto-validated", // Pas de preuve globale requise si étapes validées
      note: "Mission terminée via la checklist",
      status: "submitted",
      created_at: new Date().toISOString()
    },
    { onConflict: "mission_id,user_id" }
  );

  if (error) {
    console.error(error);
    return { error: "Erreur lors de l'enregistrement" };
  }

  revalidatePath("/app/today");
  return { success: true };
}