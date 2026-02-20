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

  // Check if profile is complete enough (Name + Bio required)
  // Note: Social links are optional or handled via checkboxes in UI, but we don't enforce them here strictly
  // unless we want to force at least one. For now, name + bio is the minimum "identity".
  // If you want to force social, you can check if at least one is present.
  const isComplete = displayName.length > 0 && bio.length > 0;

  const updates: Record<string, string | null | boolean> = {
      display_name: displayName || null,
      bio: bio || null,
      instagram_handle: instagram || null,
      linkedin_url: linkedin || null,
      facebook_handle: facebook || null,
      tiktok_handle: tiktok || null,
      website_url: website || null,
      onboarding_completed: isComplete
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
  return { success: true };
}
