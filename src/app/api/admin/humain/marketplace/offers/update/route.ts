import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

function canTransitionOfferStatus(fromStatus: string, toStatus: string) {
  if (fromStatus === toStatus) return true;
  const allowed: Record<string, string[]> = {
    pending: ["reviewing", "accepted", "rejected", "cancelled"],
    reviewing: ["accepted", "rejected", "cancelled"],
    accepted: ["reviewing", "cancelled"],
    rejected: ["reviewing", "cancelled"],
    cancelled: ["reviewing"],
  };
  return (allowed[fromStatus] || []).includes(toStatus);
}

function slugify(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const currentUrl = String(formData.get("current_url") || "/admin/humain/marketplace");
  const offerId = String(formData.get("offer_id") || "").trim();
  const nextStatus = String(formData.get("next_status") || "").trim();
  const assignMemberIdRaw = String(formData.get("assign_member_id") || "").trim();

  const fail = (message: string) =>
    NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "error", message)), { status: 303 });

  if (!offerId) return fail("Demande introuvable.");
  if (!["pending", "reviewing", "accepted", "rejected", "cancelled"].includes(nextStatus)) {
    return fail("Statut de demande invalide.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Session requise.");

  const supabaseAdmin = createAdminClient();
  const { data: adminRow } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!adminRow) return fail("Acces admin requis.");

  const { data: offer, error: offerReadError } = await supabaseAdmin
    .from("human_marketplace_offers")
    .select("id,place_id,action_type,status,full_name,city,metadata")
    .eq("id", offerId)
    .maybeSingle();
  if (offerReadError || !offer) return fail(offerReadError?.message || "Demande introuvable.");
  if (!canTransitionOfferStatus(String(offer.status || ""), nextStatus)) {
    return fail(`Transition demande invalide: ${String(offer.status)} -> ${nextStatus}.`);
  }

  const currentMeta =
    offer.metadata && typeof offer.metadata === "object" && !Array.isArray(offer.metadata)
      ? (offer.metadata as Record<string, unknown>)
      : {};
  const referralCodeExisting = String(currentMeta.referral_code || "").trim();
  const referralCodeGenerated =
    referralCodeExisting ||
    [slugify(offer.full_name || "pro"), slugify(offer.city || "ville"), String(offer.id).slice(0, 8)].filter(Boolean).join("-");
  const nextMeta = {
    ...currentMeta,
    referral_code: referralCodeGenerated,
  };

  const fullPatch = {
    status: nextStatus,
    assigned_member_id: assignMemberIdRaw || null,
    metadata: nextMeta,
    processed_at: new Date().toISOString(),
    processed_by_user_id: user.id,
    updated_at: new Date().toISOString(),
  };

  let { error } = await supabaseAdmin.from("human_marketplace_offers").update(fullPatch).eq("id", offerId);
  if (error && /column/i.test(String(error.message || ""))) {
    const fallback = await supabaseAdmin
      .from("human_marketplace_offers")
      .update({
        status: nextStatus,
        assigned_member_id: assignMemberIdRaw || null,
        metadata: nextMeta,
      })
      .eq("id", offerId);
    error = fallback.error;
  }
  if (error) return fail(error.message || "Mise a jour impossible.");

  if (offer.place_id && nextStatus === "accepted") {
    let placeStatus: "sale" | "dispo" | "reserved" | "occupied" = "occupied";
    if (offer.action_type === "sell_request") placeStatus = "sale";
    if (offer.action_type === "join_request") placeStatus = "reserved";
    const placePatch: Record<string, unknown> = {
      status: placeStatus,
      claimed_at: new Date().toISOString(),
      claimed_by_offer_id: offerId,
      updated_at: new Date().toISOString(),
    };
    if (assignMemberIdRaw) placePatch.owner_member_id = assignMemberIdRaw;
    await supabaseAdmin.from("human_marketplace_places").update(placePatch).eq("id", offer.place_id);
  }

  await supabaseAdmin.from("human_marketplace_events").insert({
    place_id: offer.place_id || null,
    offer_id: offerId,
    event_type: "status_changed",
    payload: {
      object: "offer",
      next_status: nextStatus,
      assigned_member_id: assignMemberIdRaw || null,
    },
  });

  revalidatePath("/admin/humain/marketplace");
  revalidatePath("/marketplace");
  revalidatePath("/popey-human/accueil-test/marketplace");

  return NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "success", "Statut demande mis a jour.")), {
    status: 303,
  });
}
