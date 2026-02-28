"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non connecté" };
  }

  const displayName = String(formData.get("display_name") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const instagram = String(formData.get("instagram") || "").trim();
  const linkedin = String(formData.get("linkedin") || "").trim();
  const facebook = String(formData.get("facebook") || "").trim();
  const tiktok = String(formData.get("tiktok") || "").trim();
  const website = String(formData.get("website") || "").trim();
  const avatarUrl = formData.get("avatar_url");

  const trade = String(formData.get("trade") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  // Give & Take (New Structured Profile)
  const giveProfileStr = String(formData.get("give_profile") || "{}");
  const receiveProfileStr = String(formData.get("receive_profile") || "{}");
  
  let giveProfile = {};
  let receiveProfile = {};

  try {
      if (giveProfileStr) giveProfile = JSON.parse(giveProfileStr);
      if (receiveProfileStr) receiveProfile = JSON.parse(receiveProfileStr);
  } catch (e) {
      console.error("Error parsing profile JSON:", e);
  }

  // Offer Fields
  const offerTitle = String(formData.get("offer_title") || "").trim();
  const offerDescription = String(formData.get("offer_description") || "").trim();
  const offerPrice = Number(formData.get("offer_price")) || null;
  const offerOriginalPrice = Number(formData.get("offer_original_price")) || null;
  const offerActive = formData.get("offer_active") === "true";
  
  // Extract current goals array
  // Assuming the frontend sends multiple "current_goals" fields or a single JSON string
  // Let's assume JSON string for easier form handling, or handle array logic
  // For standard FormData with multiple checkboxes, use getAll
  const currentGoals = formData.getAll("current_goals").map(String);

  // Check if profile is complete enough (Name + Bio required)
  const isComplete = displayName.length > 0 && bio.length > 0;

  const updates: Record<string, string | null | boolean | string[] | number | null | object> = {
      display_name: displayName || null,
      bio: bio || null,
    trade: trade || null,
    city: city || null,
    phone: phone || null,
    give_profile: giveProfile,
    receive_profile: receiveProfile,
    instagram_handle: instagram || null,
      linkedin_url: linkedin || null,
      facebook_handle: facebook || null,
      tiktok_handle: tiktok || null,
      website_url: website || null,
      current_goals: currentGoals,
      onboarding_completed: isComplete,
      // Offer
      offer_title: offerTitle || null,
      offer_description: offerDescription || null,
      offer_price: offerPrice,
      offer_original_price: offerOriginalPrice,
      offer_active: offerActive
  };

  // Only update avatar if explicitly provided (to avoid overwriting with empty string if not changed)
  if (typeof avatarUrl === "string" && avatarUrl.length > 0) {
      updates.avatar_url = avatarUrl;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    console.error("Profile update error:", error);
    return { error: "Erreur lors de la mise à jour." };
  }

  revalidatePath("/app/settings");
  revalidatePath("/app/crew"); // Refresh crew list too
  revalidatePath("/mon-reseau-local/dashboard/profile");
  revalidatePath("/mon-reseau-local/dashboard");
  return { success: true };
}
