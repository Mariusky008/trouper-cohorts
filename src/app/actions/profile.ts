"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non connecté" };
  }

  const hasDisplayName = formData.has("display_name");
  const hasBio = formData.has("bio");
  const hasInstagram = formData.has("instagram");
  const hasLinkedin = formData.has("linkedin");
  const hasFacebook = formData.has("facebook");
  const hasTiktok = formData.has("tiktok");
  const hasWebsite = formData.has("website");
  const hasFeaturedLink = formData.has("featured_link");
  const hasTrade = formData.has("trade");
  const hasCity = formData.has("city");
  const hasPhone = formData.has("phone");
  const hasGiveProfile = formData.has("give_profile");
  const hasReceiveProfile = formData.has("receive_profile");
  const hasOfferTitle = formData.has("offer_title");
  const hasOfferDescription = formData.has("offer_description");
  const hasOfferPrice = formData.has("offer_price");
  const hasOfferOriginalPrice = formData.has("offer_original_price");
  const hasOfferActive = formData.has("offer_active");
  const hasCurrentGoals = formData.has("current_goals");

  const displayName = String(formData.get("display_name") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const instagram = String(formData.get("instagram") || "").trim();
  const linkedin = String(formData.get("linkedin") || "").trim();
  const facebook = String(formData.get("facebook") || "").trim();
  const tiktok = String(formData.get("tiktok") || "").trim();
  const website = String(formData.get("website") || "").trim();
  const featuredLink = String(formData.get("featured_link") || "").trim();
  const avatarUrl = formData.get("avatar_url");
  const trade = String(formData.get("trade") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  const updates: Record<string, string | null | boolean | string[] | number | object> = {};

  if (hasDisplayName) updates.display_name = displayName || null;
  if (hasBio) updates.bio = bio || null;
  if (hasTrade) updates.trade = trade || null;
  if (hasCity) updates.city = city || null;
  if (hasPhone) updates.phone = phone || null;
  if (hasInstagram) updates.instagram_handle = instagram || null;
  if (hasLinkedin) updates.linkedin_url = linkedin || null;
  if (hasFacebook) updates.facebook_handle = facebook || null;
  if (hasTiktok) updates.tiktok_handle = tiktok || null;
  if (hasWebsite) updates.website_url = website || null;
  if (hasFeaturedLink) updates.featured_link = featuredLink || null;

  if (hasGiveProfile) {
    const giveProfileStr = String(formData.get("give_profile") || "{}");
    try {
      updates.give_profile = giveProfileStr ? JSON.parse(giveProfileStr) : {};
    } catch (e) {
      console.error("Error parsing give_profile JSON:", e);
    }
  }

  if (hasReceiveProfile) {
    const receiveProfileStr = String(formData.get("receive_profile") || "{}");
    try {
      updates.receive_profile = receiveProfileStr ? JSON.parse(receiveProfileStr) : {};
    } catch (e) {
      console.error("Error parsing receive_profile JSON:", e);
    }
  }

  if (hasCurrentGoals) {
    updates.current_goals = formData.getAll("current_goals").map(String);
  }

  if (hasOfferTitle) updates.offer_title = String(formData.get("offer_title") || "").trim() || null;
  if (hasOfferDescription) updates.offer_description = String(formData.get("offer_description") || "").trim() || null;
  if (hasOfferPrice) updates.offer_price = Number(formData.get("offer_price")) || null;
  if (hasOfferOriginalPrice) updates.offer_original_price = Number(formData.get("offer_original_price")) || null;
  if (hasOfferActive) updates.offer_active = formData.get("offer_active") === "true";

  if (hasDisplayName && hasBio) {
    updates.onboarding_completed = displayName.length > 0 && bio.length > 0;
  }

  // Only update avatar if explicitly provided (to avoid overwriting with empty string if not changed)
  if (typeof avatarUrl === "string" && avatarUrl.length > 0) {
      updates.avatar_url = avatarUrl;
  }

  // Use admin client to bypass RLS issues for update
  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
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
