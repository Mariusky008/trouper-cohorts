"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleOfferActive(userId: string, active: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
        return { error: "Non autorisé" };
    }

    const { error } = await supabase
        .from("profiles")
        .update({ offer_active: active })
        .eq("id", userId);

    if (error) {
        console.error("Erreur toggle offre:", error);
        return { error: "Erreur lors de la mise à jour" };
    }

    revalidatePath("/mon-reseau-local/dashboard/offers");
    revalidatePath("/mon-reseau-local/dashboard");
    return { success: true };
}