import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MARKETPLACE_PRIVILEGE_PHOTO_BUCKET = "marketplace-privilege-offers";
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 60 * 1024 * 1024; // ~60MB (vidéo verticale 15s)
const MAX_GALLERY_PHOTOS = 6; // couverture + galerie : carrousel plafonné à 6 visuels

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

function safeVideoExtension(file: File): string {
  const fromName = String(file.name || "").split(".").pop()?.toLowerCase() || "";
  if (["mp4", "webm", "m4v"].includes(fromName)) return fromName;
  if (fromName === "mov") return "mp4";
  const mime = String(file.type || "").toLowerCase();
  if (mime.includes("webm")) return "webm";
  return "mp4";
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
  const offerVideoFileRaw = formData.get("offer_video_file");
  const offerGalleryFilesRaw = formData.getAll("offer_gallery_files");
  const offerGalleryUrlsRaw = String(formData.get("offer_gallery_urls") || "").trim();
  const promoCodeRaw = String(formData.get("promo_code") || "").trim();
  const offerAddressRaw = String(formData.get("offer_address") || "").trim();
  const totalSpotsRaw = String(formData.get("total_spots") || "").trim();
  const offerVideoUrlRaw = String(formData.get("offer_video_url") || "").trim();
  const coupDeCoeurTextRaw = String(formData.get("coup_de_coeur_text") || "").trim();
  const mysteryDealLabelRaw = String(formData.get("mystery_deal_label") || "").trim();
  const isMysteryRaw = String(formData.get("is_mystery_offer") || "").trim().toLowerCase();

  const fail = (message: string) =>
    NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "error", message)), { status: 303 });

  // ── Création d'un commerçant "Autre" (métier non listé) directement depuis l'admin ──
  if (intent === "create_place") {
    const userId = await getServerUserIdWithProxyFallback();
    if (!userId) return fail("Session requise.");
    const supabaseAdmin = createAdminClient();
    const { data: adminRow } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
    if (!adminRow) return fail("Acces admin requis.");

    const cityNew = String(formData.get("city") || "").trim();
    const newMetier = String(formData.get("new_metier") || "").trim();
    const sphereKey = String(formData.get("sphere_key") || "digital").trim();
    const newPrenom = String(formData.get("new_prenom") || "").trim() || null;
    const newGenre = String(formData.get("new_genre") || "M").trim();
    const newTypeMembre = String(formData.get("new_type_membre") || "commercant").trim();
    const newActivite = String(formData.get("new_activite") || "").trim() || null;
    if (!cityNew || !newMetier) return fail("Ville et métier requis pour créer une offre.");
    const sphereLabels: Record<string, string> = {
      "evenements-locaux": "Évènements locaux",
      sante: "Santé · Bien-être",
      habitat: "Habitat · Patrimoine",
      digital: "Digital · Business",
      mariage: "Mariage · Évènementiel",
      finance: "Finance · Juridique",
    };
    // Génère un commerce_slug unique : {metier-slug}-{city-slug}[-N si doublon]
    const baseSlug = [slugifyPart(newMetier), slugifyPart(cityNew)].filter(Boolean).join("-");
    let commerceSlug = baseSlug;
    for (let attempt = 2; attempt <= 99; attempt++) {
      const { data: existing } = await supabaseAdmin
        .from("human_marketplace_places")
        .select("id")
        .eq("commerce_slug", commerceSlug)
        .maybeSingle();
      if (!existing) break;
      commerceSlug = `${baseSlug}-${attempt}`;
    }

    const deadlineAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const baseRow: Record<string, unknown> = {
      city: cityNew,
      city_slug: slugifyPart(cityNew),
      sphere_key: sphereKey,
      sphere_label: sphereLabels[sphereKey] || "Digital · Business",
      metier: newMetier,
      metier_slug: slugifyPart(newMetier),
      status: "reserved",
      is_seeded: false,
      prenom: newPrenom,
      genre: newGenre,
      activite: newActivite,
      type_membre: newTypeMembre,
      commerce_slug: commerceSlug,
      reco_status: "prospect",
      deadline_at: deadlineAt,
      owner_member_id: ownerMemberIdRaw || null,
      company_name: companyNameRaw || null,
      privilege_badge: privilegeBadgeRaw || null,
      partner_whatsapp: partnerWhatsappRaw || null,
      direct_contact: directContactRaw || null,
      offer_website_url: offerWebsiteUrlRaw || null,
      offer_description: offerDescriptionRaw || null,
      owner_display_name: ownerDisplayNameRaw || null,
      owner_profile_photo_url: ownerProfilePhotoUrlRaw || null,
      offer_photo_url: offerPhotoUrlRaw || null,
      offer_gallery_urls: offerGalleryUrlsRaw
        ? offerGalleryUrlsRaw
            .split(/[\r\n]+/)
            .map((line) => line.trim())
            .filter(Boolean)
            .slice(0, MAX_GALLERY_PHOTOS)
        : [],
      offer_expires_at: offerExpiresAtRaw && /^\d{4}-\d{2}-\d{2}$/.test(offerExpiresAtRaw) ? offerExpiresAtRaw : null,
      partner_offer_value_eur: partnerOfferValueRaw ? Number(partnerOfferValueRaw.replace(",", ".")) || null : null,
      promo_code: promoCodeRaw ? promoCodeRaw.toUpperCase() : null,
      offer_address: offerAddressRaw || null,
      total_spots: totalSpotsRaw ? parseInt(totalSpotsRaw, 10) || null : null,
      offer_video_url: offerVideoUrlRaw || null,
      coup_de_coeur_text: coupDeCoeurTextRaw || null,
      mystery_deal_label: mysteryDealLabelRaw || null,
      is_mystery_offer: ["on", "true", "1", "yes", "oui"].includes(isMysteryRaw),
    };
    let ins = await supabaseAdmin.from("human_marketplace_places").insert(baseRow);
    if (ins.error && /column/i.test(String(ins.error.message || ""))) {
      const safeRow = { ...baseRow } as Record<string, unknown>;
      ["promo_code", "offer_address", "total_spots", "offer_video_url", "coup_de_coeur_text", "mystery_deal_label", "is_mystery_offer", "pro_slug", "offer_gallery_urls"].forEach(
        (k) => delete safeRow[k],
      );
      ins = await supabaseAdmin.from("human_marketplace_places").insert(safeRow);
    }
    if (ins.error) return fail(ins.error.message || "Création impossible.");
    revalidatePath("/admin/humain/catalogue");
    revalidatePath("/privilege");
    return NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "success", `Commerçant créé : ${newMetier}.`)), {
      status: 303,
    });
  }

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
  // Upload vidéo direct (15s verticale) → Supabase Storage → offer_video_url
  if (intent !== "clear_privilege" && offerVideoFileRaw instanceof File && offerVideoFileRaw.size > 0) {
    if (!String(offerVideoFileRaw.type || "").startsWith("video/")) {
      return fail("Le fichier doit être une vidéo (.mp4, .webm).");
    }
    if (offerVideoFileRaw.size > MAX_VIDEO_BYTES) {
      return fail("La vidéo dépasse 60MB.");
    }
    const ext = safeVideoExtension(offerVideoFileRaw);
    const filePath = `marketplace-videos/${placeId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(MARKETPLACE_PRIVILEGE_PHOTO_BUCKET)
      .upload(filePath, offerVideoFileRaw, {
        cacheControl: "3600",
        upsert: true,
        contentType: offerVideoFileRaw.type || undefined,
      });
    if (uploadError) {
      return fail(`Upload vidéo impossible: ${uploadError.message || "erreur storage"}`);
    }
    const { data: videoPublic } = supabaseAdmin.storage
      .from(MARKETPLACE_PRIVILEGE_PHOTO_BUCKET)
      .getPublicUrl(filePath);
    patch.offer_video_url = String(videoPublic?.publicUrl || "").trim() || null;
  }
  // Galerie photos (carrousel) : URLs saisies (1 par ligne) + uploads multiples → Supabase Storage.
  // La couverture reste offer_photo_url ; ces visuels sont les photos additionnelles du carrousel.
  if (intent === "reset_place" || intent === "clear_privilege") {
    patch.offer_gallery_urls = null;
  } else {
    const galleryUrls: string[] = [];
    offerGalleryUrlsRaw.split(/[\r\n]+/).forEach((line) => {
      const u = line.trim();
      if (u && galleryUrls.length < MAX_GALLERY_PHOTOS) galleryUrls.push(u);
    });
    let gi = 0;
    for (const fileRaw of offerGalleryFilesRaw) {
      if (galleryUrls.length >= MAX_GALLERY_PHOTOS) break;
      if (!(fileRaw instanceof File) || fileRaw.size === 0) continue;
      if (!String(fileRaw.type || "").startsWith("image/")) {
        return fail("La galerie n'accepte que des images.");
      }
      if (fileRaw.size > MAX_PHOTO_BYTES) {
        return fail("Une photo de galerie dépasse 8MB.");
      }
      const ext = safePhotoExtension(fileRaw);
      const filePath = `marketplace-gallery/${placeId}/${Date.now()}-${gi}.${ext}`;
      gi += 1;
      const { error: galleryUploadError } = await supabaseAdmin.storage
        .from(MARKETPLACE_PRIVILEGE_PHOTO_BUCKET)
        .upload(filePath, fileRaw, {
          cacheControl: "3600",
          upsert: true,
          contentType: fileRaw.type || undefined,
        });
      if (galleryUploadError) {
        return fail(`Upload galerie impossible: ${galleryUploadError.message || "erreur storage"}`);
      }
      const { data: galleryPublic } = supabaseAdmin.storage
        .from(MARKETPLACE_PRIVILEGE_PHOTO_BUCKET)
        .getPublicUrl(filePath);
      const url = String(galleryPublic?.publicUrl || "").trim();
      if (url) galleryUrls.push(url);
    }
    patch.offer_gallery_urls = galleryUrls.slice(0, MAX_GALLERY_PHOTOS);
  }

  const { data: currentPlace, error: placeReadError } = await supabaseAdmin
    .from("human_marketplace_places")
    .select("id,status,city,city_slug,metier,commerce_slug,prenom,genre,activite,type_membre")
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

    // Prénom + genre + activité (pour la lettre d'invitation QR)
    const savePrenom = String(formData.get("new_prenom") || "").trim();
    const saveGenre = String(formData.get("new_genre") || "").trim();
    const saveActivite = String(formData.get("new_activite") || "").trim();
    const saveTypeMembre = String(formData.get("new_type_membre") || "").trim();
    if (savePrenom) patch.prenom = savePrenom;
    if (saveGenre) patch.genre = saveGenre;
    if (saveActivite) patch.activite = saveActivite;
    if (saveTypeMembre) patch.type_membre = saveTypeMembre;

    // Génère un commerce_slug unique si la place n'en a pas encore → active la lettre QR
    if (!currentPlace.commerce_slug) {
      const baseSlug =
        [slugifyPart(String(currentPlace.metier || "")), slugifyPart(String(currentPlace.city || ""))]
          .filter(Boolean)
          .join("-") || slugifyPart(companyNameRaw || ownerDisplayNameRaw || "commerce") || "commerce";
      let commerceSlug = baseSlug;
      for (let attempt = 2; attempt <= 99; attempt++) {
        const { data: existing } = await supabaseAdmin
          .from("human_marketplace_places")
          .select("id")
          .eq("commerce_slug", commerceSlug)
          .maybeSingle();
        if (!existing) break;
        commerceSlug = `${baseSlug}-${attempt}`;
      }
      patch.commerce_slug = commerceSlug;
      patch.reco_status = "prospect";
      patch.deadline_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    }
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
        "offer_gallery_urls",
        "commerce_slug",
        "reco_status",
        "deadline_at",
        "prenom",
        "genre",
        "activite",
        "type_membre",
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
