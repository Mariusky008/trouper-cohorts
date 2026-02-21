'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function completeOnboardingProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Vous devez être connecté." };
  }

  const displayName = formData.get("display_name") as string;
  const trade = formData.get("trade") as string;
  const city = formData.get("city") as string;
  const phone = formData.get("phone") as string;
  const bio = formData.get("bio") as string;

  // Validation simple
  if (!displayName || !trade || !city || !phone || !bio) {
    return { error: "Tous les champs sont obligatoires." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      trade: trade,
      city: city,
      phone: phone,
      bio: bio,
      onboarding_completed: true
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating profile:", error);
    return { error: "Erreur lors de la mise à jour du profil." };
  }

  revalidatePath("/mon-reseau-local/dashboard");
  return { success: true };
}

export async function checkProfileCompletion() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) return { complete: true }; // Don't block if not logged in (middleware handles that)
  
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, trade, city, phone, bio, onboarding_completed")
      .eq("id", user.id)
      .single();
    
    if (!profile) return { complete: false };

    // Strict check: all these fields must be present and not empty
    const isComplete = 
        !!profile.display_name && 
        !!profile.trade && 
        !!profile.city && 
        !!profile.phone && 
        !!profile.bio;

    return { 
        complete: isComplete, 
        profile 
    };
}
