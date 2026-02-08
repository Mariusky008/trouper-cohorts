"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitProof(missionId: string, proofUrl: string, note: string) {
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

  const { error } = await supabase.from("submissions").upsert(
    {
      mission_id: missionId,
      user_id: user.id,
      proof_url: proofUrl,
      note,
      status: "submitted",
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
