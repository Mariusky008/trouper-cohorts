"use server";

import { createClient } from "@/lib/supabase/server";
import { sendNotification } from "./notifications";
import { revalidatePath } from "next/cache";

export async function createOpportunity(data: {
  receiverId: string;
  type: string;
  points: number;
  details: string;
}) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Vous devez être connecté pour effectuer cette action." };
    }

    // Validation: Self-giving
    if (user.id === data.receiverId) {
      return { success: false, error: "Vous ne pouvez pas vous donner une opportunité à vous-même." };
    }

    // Validation: Points
    const points = Math.round(data.points);
    if (points <= 0) {
      return { success: false, error: "Le nombre de points doit être positif." };
    }

    // Validation: Details length
    if (!data.details || data.details.trim().length < 5) {
      return { success: false, error: "Veuillez fournir plus de détails sur l'opportunité." };
    }

    const { error } = await supabase
      .from("network_opportunities")
      .insert({
        giver_id: user.id,
        receiver_id: data.receiverId,
        type: data.type,
        points: points,
        details: data.details,
        status: "pending"
      });

    if (error) {
      console.error("Error creating opportunity:", error);
      return { success: false, error: `Erreur lors de la création: ${error.message}` };
    }

    // Send Notification
    try {
        const { data: senderProfile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", user.id)
            .single();
        
        const senderName = senderProfile?.display_name || "Un membre";

        await sendNotification(
            data.receiverId,
            `Nouvelle opportunité reçue ! 🎁`,
            `${senderName} vous a envoyé une opportunité : ${data.type}`,
            `/mon-reseau-local/dashboard/opportunities`
        );
    } catch (e) {
        console.error("Failed to send notification for opportunity:", e);
    }

    // Revalidate ALL dashboard paths to ensure consistency
    try {
      revalidatePath("/mon-reseau-local/dashboard/opportunities");
      revalidatePath("/mon-reseau-local/dashboard/connections"); 
      revalidatePath("/mon-reseau-local/dashboard");
    } catch (e) {
      console.error("Error revalidating paths:", e);
      // We continue even if revalidation fails, as the action was successful
    }
    
    return { success: true };
  } catch (err) {
    console.error("Unexpected error in createOpportunity:", err);
    return { success: false, error: "Une erreur inattendue est survenue." };
  }
}
