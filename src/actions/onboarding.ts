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
      .select("display_name, trade, city, phone, bio, avatar_url, linkedin_url, instagram_handle, facebook_handle, website_url, current_goals, receive_profile")
      .eq("id", user.id)
      .single();
    
    if (!profile) return { complete: false };

    const hasSocialsOrOptOut =
      (profile.linkedin_url && profile.linkedin_url !== "https://none") ||
      !!profile.instagram_handle ||
      !!profile.facebook_handle ||
      !!profile.website_url ||
      profile.linkedin_url === "https://none";

    const whatsappResponseDelay = Number((profile.receive_profile as any)?.whatsapp_response_delay_hours || 0);

    const missingFields: string[] = [];
    if (!profile.display_name) missingFields.push("Nom d'affichage");
    if (!profile.trade) missingFields.push("Métier");
    if (!profile.city) missingFields.push("Ville");
    if (!profile.phone) missingFields.push("Téléphone");
    if (!profile.bio) missingFields.push("Bio");
    if (!profile.avatar_url) missingFields.push("Photo de profil");
    if (!hasSocialsOrOptOut) missingFields.push("Réseau social ou site web");
    if (!Array.isArray(profile.current_goals) || profile.current_goals.length === 0) missingFields.push("Objectif actuel");
    if (![1, 3, 6, 12].includes(whatsappResponseDelay)) missingFields.push("Temps moyen de réponse WhatsApp");

    const isComplete = missingFields.length === 0;

    return { 
        complete: isComplete, 
        profile,
        missingFields
    };
}
