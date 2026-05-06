import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeMarketplacePlaceValue } from "@/lib/popey-marketplace";

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
  const intent = String(formData.get("intent") || "").trim();

  const fail = (message: string) =>
    NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "error", message)), { status: 303 });

  if (!offerId) return fail("Demande introuvable.");
  if (intent !== "update_reward" && !["pending", "reviewing", "accepted", "rejected", "cancelled"].includes(nextStatus)) {
    return fail("Statut de demande invalide.");
  }

  const userId = await getServerUserIdWithProxyFallback();
  if (!userId) return fail("Session requise.");

  const supabaseAdmin = createAdminClient();
  const { data: adminRow } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (!adminRow) return fail("Acces admin requis.");

  const { data: offer, error: offerReadError } = await supabaseAdmin
    .from("human_marketplace_offers")
    .select("id,place_id,action_type,status,full_name,city,metadata")
    .eq("id", offerId)
    .maybeSingle();
  if (offerReadError || !offer) return fail(offerReadError?.message || "Demande introuvable.");
  if (intent !== "update_reward" && !canTransitionOfferStatus(String(offer.status || ""), nextStatus)) {
    return fail(`Transition demande invalide: ${String(offer.status)} -> ${nextStatus}.`);
  }

  const currentMeta =
    offer.metadata && typeof offer.metadata === "object" && !Array.isArray(offer.metadata)
      ? (offer.metadata as Record<string, unknown>)
      : {};
  if (intent === "update_reward") {
    const rewardModeRaw = String(formData.get("reward_mode") || "").trim().toLowerCase();
    const rewardMode = rewardModeRaw === "eur" ? "eur" : "percent";
    const rewardValueRaw = String(formData.get("reward_value") || "")
      .trim()
      .replace(",", ".");
    const rewardValue = Number(rewardValueRaw);
    const rewardTextRaw = String(formData.get("reward_text") || "").trim();
    const rewardTextComputed =
      rewardTextRaw ||
      (Number.isFinite(rewardValue) && rewardValue > 0
        ? rewardMode === "percent"
          ? `${Math.round(rewardValue * 100) / 100}%`
          : `${(Math.round(rewardValue * 100) / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })}€`
        : "");
    const nextMeta: Record<string, unknown> = {
      ...currentMeta,
      apporteur_reward_mode: rewardMode,
      apporteur_reward_value: Number.isFinite(rewardValue) && rewardValue > 0 ? String(Math.round(rewardValue * 100) / 100) : "",
      apporteur_reward_text: rewardTextComputed,
      apporteur_reward_updated_at: new Date().toISOString(),
    };
    const { error: rewardError } = await supabaseAdmin
      .from("human_marketplace_offers")
      .update({
        metadata: nextMeta,
        updated_at: new Date().toISOString(),
      })
      .eq("id", offerId);
    if (rewardError) return fail(rewardError.message || "Mise à jour rétribution impossible.");
    revalidatePath("/admin/humain/marketplace");
    revalidatePath("/privilege/[ville]");
    revalidatePath("/popey-human/accueil-test/webapp-pro.html");
    return NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "success", "Rétribution apporteur mise à jour.")), {
      status: 303,
    });
  }

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
    processed_by_user_id: userId,
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
      months_active: 0,
      recos_per_year: 0,
      list_price_eur: computeMarketplacePlaceValue({ monthsActive: 0, recosCount: 0, offersBoughtCount: 0 }),
      value_growth_pct: 0,
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
