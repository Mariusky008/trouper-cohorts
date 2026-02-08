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
  const website = String(formData.get("website") || "").trim();
  const avatarUrl = formData.get("avatar_url");

  const updates: Record<string, any> = {
      display_name: displayName || null,
      bio: bio || null,
      instagram_handle: instagram || null,
      linkedin_url: linkedin || null,
      website_url: website || null,
  };

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
