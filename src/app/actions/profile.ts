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
  
  // Note: Avatar upload is handled client-side via Supabase Storage usually, 
  // but here we might just store the URL if provided or handle it later.
  // For MVP, we'll stick to text fields.

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
      bio: bio || null,
      instagram_handle: instagram || null,
      linkedin_url: linkedin || null,
      website_url: website || null,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Profile update error:", error);
    return { error: "Erreur lors de la mise à jour." };
  }

  revalidatePath("/app/settings");
  revalidatePath("/app/crew"); // Refresh crew list too
  return { success: true };
}
