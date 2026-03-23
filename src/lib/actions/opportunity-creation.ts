"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createOpportunity(data: {
  receiverId?: string;
  type: string;
  points: number;
  details?: string;
  isPublic?: boolean;
  publicTitle?: string;
  price?: number;
}) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Vous devez être connecté pour effectuer cette action." };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const internalSecret = process.env.CRON_SECRET;

    const points = Math.round(data.points);
    if (points < 0) {
      return { success: false, error: "Le nombre de points doit être positif." };
    }

    const triggerNotification = async (payload: Record<string, unknown>) => {
      if (!internalSecret) {
        return;
      }
      await fetch(`${appUrl}/api/internal/send-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...payload,
          secret: internalSecret,
        }),
      });
    };

    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const senderName = senderProfile?.display_name || "Un membre";

    if (data.isPublic) {
      if (!data.publicTitle || !data.price) {
        return { success: false, error: "Titre et prix sont requis pour une offre publique." };
      }

      const { error } = await supabase
        .from("network_opportunities")
        .insert({
          giver_id: user.id,
          type: data.type,
          points: data.price,
          details: data.details,
          status: "available",
          visibility: "public",
          public_title: data.publicTitle,
          private_details: data.details,
          price: data.price
        });

      if (error) {
        console.error("Error creating public opportunity:", error);
        return { success: false, error: `Erreur lors de la publication: ${error.message}` };
      }

      try {
        const { data: subscribers } = await supabase
          .from("push_subscriptions")
          .select("user_id");

        const userIds = Array.from(
          new Set(
            (subscribers || [])
              .map((sub) => sub.user_id)
              .filter((id): id is string => Boolean(id) && id !== user.id)
          )
        );

        if (userIds.length > 0) {
          await triggerNotification({
            userIds,
            title: "Nouvelle opportunité disponible 🚀",
            message: `${senderName} vient de publier: ${data.publicTitle}`,
            url: "/mon-reseau-local/dashboard/opportunities",
          });
        }
      } catch (notificationError) {
        console.error("Failed to trigger public opportunity notification:", notificationError);
      }
    } else {
      if (!data.receiverId) {
        return { success: false, error: "Un destinataire est requis pour une offre privée." };
      }

      if (user.id === data.receiverId) {
        return { success: false, error: "Vous ne pouvez pas vous donner une opportunité à vous-même." };
      }

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
          status: "pending",
          visibility: "private"
        });

      if (error) {
        console.error("Error creating private opportunity:", error);
        return { success: false, error: `Erreur lors de la création: ${error.message}` };
      }

      try {
        await triggerNotification({
          userId: data.receiverId,
          title: "Nouvelle opportunité reçue ! 🎁",
          message: `${senderName} vous a envoyé une opportunité : ${data.type}`,
          url: "/mon-reseau-local/dashboard/opportunities",
        });
      } catch (notificationError) {
        console.error("Failed to trigger notification for opportunity:", notificationError);
      }
    }

    try {
      revalidatePath("/mon-reseau-local/dashboard/opportunities");
      revalidatePath("/mon-reseau-local/dashboard/connections"); 
      revalidatePath("/mon-reseau-local/dashboard");
      revalidatePath("/mon-reseau-local/dashboard/guide");
    } catch (e) {
      console.error("Error revalidating paths:", e);
    }
    
    return { success: true };
  } catch (err) {
    console.error("Unexpected error in createOpportunity:", err);
    return { success: false, error: "Une erreur inattendue est survenue." };
  }
}
