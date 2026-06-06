import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MARKETPLACE_PRIVILEGE_PHOTO_BUCKET = "marketplace-privilege-offers";
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

function withStatus(base: string, status: "success" | "error", message: string) {
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}marketStatus=${encodeURIComponent(status)}&marketMessage=${encodeURIComponent(message)}`;
}

function toAbsolute(requestUrl: string, maybeRelative: string) {
  try {
    return new URL(maybeRelative, requestUrl);
  } catch {
    return new URL("/admin/humain/marketplace", requestUrl);
  }
}

function canTransitionPlaceStatus(fromStatus: string, toStatus: string) {
  if (fromStatus === toStatus) return true;
  if (!fromStatus || !["dispo", "sale", "occupied", "reserved"].includes(fromStatus)) return true;
  const allowed: Record<string, string[]> = {
    dispo: ["reserved", "occupied", "sale"],
    reserved: ["occupied", "dispo", "sale"],
    occupied: ["sale", "dispo"],
    sale: ["occupied", "reserved", "dispo"],
  };
  return (allowed[fromStatus] || []).includes(toStatus);
}

function safePhotoExtension(file: File): string {
  const fromName = String(file.name || "").split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(fromName)) return fromName;
  const mime = String(file.type || "").toLowerCase();
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
}

function slugifyPart(value: string): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const currentUrl = String(formData.get("current_url") || "/admin/humain/marketplace");
  const placeId = String(formData.get("place_id") || "").trim();
  const nextStatus = String(formData.get("next_status") || "").trim();
  const intent = String(formData.get("intent") || "save").trim();
  const listPriceRaw = String(formData.get("list_price_eur") || "").trim();
  const ownerMemberIdRaw = String(formData.get("owner_member_id") || "").trim();
  const companyNameRaw = String(formData.get("company_name") || "").trim();
  const privilegeBadgeRaw = String(formData.get("privilege_badge") || "").trim();
  const partnerWhatsappRaw = String(formData.get("partner_whatsapp") || "").trim();
  const categoryKeyRaw = String(formData.get("category_key") || "").trim().toLowerCase();
  const externalRefRaw = String(formData.get("external_ref") || "").trim();
  const offerPhotoUrlRaw = String(formData.get("offer_photo_url") || "").trim();
  const offerWebsiteUrlRaw = String(formData.get("offer_website_url") || "").trim();
  const offerDescriptionRaw = String(formData.get("offer_description") || "").trim();
  const ownerDisplayNameRaw = String(formData.get("owner_display_name") || "").trim();
  const ownerProfilePhotoUrlRaw = String(formData.get("owner_profile_photo_url") || "").trim();
  const offerExpiresAtRaw = String(formData.get("offer_expires_at") || "").trim();
  const directContactRaw = String(formData.get("direct_contact") || "").trim();
  const partnerOfferValueRaw = String(formData.get("partner_offer_value_eur") || "").trim();
  const offerPhotoFileRaw = formData.get("offer_photo_file");
  const promoCodeRaw = String(formData.get("promo_code") || "").trim();
  const offerAddressRaw = String(formData.get("offer_address") || "").trim();
  const totalSpotsRaw = String(formData.get("total_spots") || "").trim();
  const offerVideoUrlRaw = String(formData.get("offer_video_url") || "").trim();
  const coupDeCoeurTextRaw = String(formData.get("coup_de_coeur_text") || "").trim();
  const mysteryDealLabelRaw = String(formData.get("mystery_deal_label") || "").trim();
  const isMysteryRaw = String(formData.get("is_mystery_offer") || "").trim().toLowerCase();

  const fail = (message: string) =>
    NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "error", message)), { status: 303 });

  if (!placeId) return fail("Place introuvable.");
  if (!["dispo", "sale", "occupied", "reserved"].includes(nextStatus)) return fail("Statut de place invalide.");

  const userId = await getServerUserIdWithProxyFallback();
  if (!userId) return fail("Session requise.");

  const supabaseAdmin = createAdminClient();
  const { data: adminRow } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (!adminRow) return fail("Acces admin requis.");

  const patch: Record<string, unknown> = {
    status: nextStatus,
    updated_at: new Date().toISOString(),
  };
  if (intent === "reset_place") {
    // Reset the "manual" fields so the place disappears from the manual control list.
    patch.status = "dispo";
    patch.owner_member_id = null;
    patch.list_price_eur = null;
    patch.company_name = null;
    patch.privilege_badge = null;
    patch.partner_whatsapp = null;
    patch.category_key = null;
    patch.external_ref = null;
    patch.offer_photo_url = null;
    patch.offer_website_url = null;
    patch.offer_description = null;
    patch.owner_display_name = null;
    patch.owner_profile_photo_url = null;
    patch.offer_expires_at = null;
    patch.direct_contact = null;
    patch.partner_offer_value_eur = null;
    patch.promo_code = null;
    patch.offer_address = null;
    patch.total_spots = null;
    patch.offer_video_url = null;
    patch.coup_de_coeur_text = null;
    patch.mystery_deal_label = null;
    patch.is_mystery_offer = false;
    // Best-effort cleanup for claimed fields (ignore if DB doesn't have them).
    patch.claimed_at = null;
    patch.claimed_by_offer_id = null;
  } else if (intent === "clear_privilege") {
    patch.company_name = null;
    patch.privilege_badge = null;
    patch.partner_whatsapp = null;
    patch.category_key = null;
    patch.external_ref = null;
    patch.offer_photo_url = null;
    patch.offer_website_url = null;
    patch.offer_description = null;
    patch.owner_display_name = null;
    patch.owner_profile_photo_url = null;
    patch.offer_expires_at = null;
    patch.direct_contact = null;
    patch.partner_offer_value_eur = null;
    patch.promo_code = null;
    patch.offer_address = null;
    patch.total_spots = null;
    patch.offer_video_url = null;
    patch.coup_de_coeur_text = null;
    patch.mystery_deal_label = null;
    patch.is_mystery_offer = false;
  } else {
    patch.owner_member_id = ownerMemberIdRaw || null;
    patch.company_name = companyNameRaw || null;
    patch.privilege_badge = privilegeBadgeRaw || null;
    patch.partner_whatsapp = partnerWhatsappRaw || null;
    patch.external_ref = externalRefRaw || null;
    patch.offer_photo_url = offerPhotoUrlRaw || null;
    patch.offer_website_url = offerWebsiteUrlRaw || null;
    patch.offer_description = offerDescriptionRaw || null;
    patch.owner_display_name = ownerDisplayNameRaw || null;
    patch.owner_profile_photo_url = ownerProfilePhotoUrlRaw || null;
    patch.offer_expires_at = offerExpiresAtRaw || null;
    patch.direct_contact = directContactRaw || null;
    patch.promo_code = promoCodeRaw ? promoCodeRaw.toUpperCase() : null;
    patch.offer_address = offerAddressRaw || null;
    patch.offer_video_url = offerVideoUrlRaw || null;
    patch.coup_de_coeur_text = coupDeCoeurTextRaw || null;
    patch.mystery_deal_label = mysteryDealLabelRaw || null;
    patch.is_mystery_offer = ["on", "true", "1", "yes", "oui"].includes(isMysteryRaw);
  }
  if (intent !== "clear_privilege") {
    if (totalSpotsRaw) {
      const parsedSpots = parseInt(totalSpotsRaw, 10);
      if (!Number.isFinite(parsedSpots) || parsedSpots < 0) return fail("Nombre de places invalide.");
      patch.total_spots = parsedSpots;
    } else {
      patch.total_spots = null;
    }
  }
  if (listPriceRaw) {
    const parsed = Number(listPriceRaw.replace(",", "."));
    if (Number.isFinite(parsed) && parsed >= 0) patch.list_price_eur = parsed;
  }
  if (intent !== "clear_privilege" && categoryKeyRaw) {
    if (!["maison", "sante", "travaux", "bien-etre", "services"].includes(categoryKeyRaw)) {
      return fail("Categorie privilege invalide.");
    }
    patch.category_key = categoryKeyRaw;
  } else if (intent !== "clear_privilege") {
    patch.category_key = null;
  }
  if (intent !== "clear_privilege" && partnerOfferValueRaw) {
    const parsed = Number(partnerOfferValueRaw.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0) {
      return fail("Montant offre partenaire invalide.");
    }
    patch.partner_offer_value_eur = parsed;
  } else if (intent !== "clear_privilege") {
    patch.partner_offer_value_eur = null;
  }
  if (intent !== "clear_privilege" && offerExpiresAtRaw) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(offerExpiresAtRaw)) {
      return fail("Date d'expiration invalide (format YYYY-MM-DD).");
    }
    patch.offer_expires_at = offerExpiresAtRaw;
  } else if (intent !== "clear_privilege") {
    patch.offer_expires_at = null;
  }
  if (intent !== "clear_privilege" && offerPhotoFileRaw instanceof File && offerPhotoFileRaw.size > 0) {
    if (!String(offerPhotoFileRaw.type || "").startsWith("image/")) {
      return fail("Le fichier photo doit être une image.");
    }
    if (offerPhotoFileRaw.size > MAX_PHOTO_BYTES) {
      return fail("La photo dépasse 8MB.");
    }
    const ext = safePhotoExtension(offerPhotoFileRaw);
    const filePath = `marketplace-offers/${placeId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(MARKETPLACE_PRIVILEGE_PHOTO_BUCKET)
      .upload(filePath, offerPhotoFileRaw, {
        cacheControl: "3600",
        upsert: true,
        contentType: offerPhotoFileRaw.type || undefined,
      });
    if (uploadError) {
      return fail(`Upload photo impossible: ${uploadError.message || "erreur storage"}`);
    }
    const { data: publicData } = supabaseAdmin.storage
      .from(MARKETPLACE_PRIVILEGE_PHOTO_BUCKET)
      .getPublicUrl(filePath);
    patch.offer_photo_url = String(publicData?.publicUrl || "").trim() || null;
  }

  const { data: currentPlace, error: placeReadError } = await supabaseAdmin
    .from("human_marketplace_places")
    .select("id,status,city,city_slug")
    .eq("id", placeId)
    .maybeSingle();
  if (placeReadError || !currentPlace) return fail(placeReadError?.message || "Place introuvable.");
  if (!canTransitionPlaceStatus(String(currentPlace.status || ""), nextStatus)) {
    return fail(`Transition invalide: ${String(currentPlace.status)} -> ${nextStatus}.`);
  }

  // Slug court & lisible pour le lien "espace commerçant" (/privilege/pro?p=slug)
  if (intent !== "reset_place" && intent !== "clear_privilege") {
    const base = slugifyPart(companyNameRaw || ownerDisplayNameRaw || "offre") || "offre";
    const citySlug = slugifyPart(String(currentPlace.city || ""));
    patch.pro_slug = [base, citySlug, placeId.slice(0, 4)].filter(Boolean).join("-");
  }

  const { error } = await supabaseAdmin.from("human_marketplace_places").update(patch).eq("id", placeId);
  if (error) {
    // Compatibility fallback: older DBs may not have the newer optional columns.
    // On strip les colonnes optionnelles et on réessaie pour ne jamais bloquer l'admin.
    if (/column/i.test(String(error.message || ""))) {
      const retryPatch = { ...patch } as Record<string, unknown>;
      [
        "claimed_at",
        "claimed_by_offer_id",
        "promo_code",
        "offer_address",
        "total_spots",
        "offer_video_url",
        "coup_de_coeur_text",
        "mystery_deal_label",
        "is_mystery_offer",
        "pro_slug",
      ].forEach((key) => {
        delete retryPatch[key];
      });
      const retry = await supabaseAdmin.from("human_marketplace_places").update(retryPatch).eq("id", placeId);
      if (retry.error) return fail(retry.error.message || "Mise a jour impossible.");
    } else {
      return fail(error.message || "Mise a jour impossible.");
    }
  }

  await supabaseAdmin.from("human_marketplace_events").insert({
    place_id: placeId,
    event_type: "status_changed",
    payload: { next_status: nextStatus },
  });

  revalidatePath("/admin/humain/marketplace");
  revalidatePath("/admin/humain/marketplace/offres");
  revalidatePath("/marketplace");
  revalidatePath("/privilege");
  const citySlug = String(currentPlace.city_slug || "").trim();
  const fallbackCitySlug = String(currentPlace.city || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const targetCitySlug = citySlug || fallbackCitySlug;
  if (targetCitySlug) revalidatePath(`/privilege/${targetCitySlug}`);
  revalidatePath("/popey-human/accueil-test/marketplace");

  const successMessage =
    intent === "reset_place"
      ? "Place retiree du controle manuel."
      : intent === "clear_privilege"
        ? "Offre privilège supprimée."
        : "Offre privilège enregistrée.";
  return NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "success", successMessage)), {
    status: 303,
  });
}
