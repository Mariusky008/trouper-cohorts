import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
  const directContactRaw = String(formData.get("direct_contact") || "").trim();
  const partnerOfferValueRaw = String(formData.get("partner_offer_value_eur") || "").trim();
  const offerPhotoFileRaw = formData.get("offer_photo_file");

  const fail = (message: string) =>
    NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "error", message)), { status: 303 });

  if (!placeId) return fail("Place introuvable.");
  if (!["dispo", "sale", "occupied", "reserved"].includes(nextStatus)) return fail("Statut de place invalide.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Session requise.");

  const supabaseAdmin = createAdminClient();
  const { data: adminRow } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!adminRow) return fail("Acces admin requis.");

  const patch: Record<string, unknown> = {
    status: nextStatus,
    updated_at: new Date().toISOString(),
  };
  if (intent === "clear_privilege") {
    patch.company_name = null;
    patch.privilege_badge = null;
    patch.partner_whatsapp = null;
    patch.category_key = null;
    patch.external_ref = null;
    patch.offer_photo_url = null;
    patch.offer_website_url = null;
    patch.offer_description = null;
    patch.direct_contact = null;
    patch.partner_offer_value_eur = null;
  } else {
    patch.owner_member_id = ownerMemberIdRaw || null;
    patch.company_name = companyNameRaw || null;
    patch.privilege_badge = privilegeBadgeRaw || null;
    patch.partner_whatsapp = partnerWhatsappRaw || null;
    patch.external_ref = externalRefRaw || null;
    patch.offer_photo_url = offerPhotoUrlRaw || null;
    patch.offer_website_url = offerWebsiteUrlRaw || null;
    patch.offer_description = offerDescriptionRaw || null;
    patch.direct_contact = directContactRaw || null;
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

  const { error } = await supabaseAdmin.from("human_marketplace_places").update(patch).eq("id", placeId);
  if (error) return fail(error.message || "Mise a jour impossible.");

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

  return NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "success", intent === "clear_privilege" ? "Offre privilège supprimée." : "Offre privilège enregistrée.")), {
    status: 303,
  });
}
