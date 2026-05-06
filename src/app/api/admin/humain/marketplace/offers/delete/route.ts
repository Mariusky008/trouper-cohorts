import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";
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

export async function POST(request: Request) {
  const formData = await request.formData();
  const currentUrl = String(formData.get("current_url") || "/admin/humain/marketplace");
  const offerId = String(formData.get("offer_id") || "").trim();
  const intent = String(formData.get("intent") || "delete").trim();

  const fail = (message: string) =>
    NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "error", message)), { status: 303 });

  if (!offerId) return fail("Demande introuvable.");

  const userId = await getServerUserIdWithProxyFallback();
  if (!userId) return fail("Session requise.");

  const supabaseAdmin = createAdminClient();
  const { data: adminRow } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (!adminRow) return fail("Acces admin requis.");

  const { data: offer, error: offerReadError } = await supabaseAdmin
    .from("human_marketplace_offers")
    .select("id,place_id,action_type,full_name,status")
    .eq("id", offerId)
    .maybeSingle();
  if (offerReadError || !offer) return fail(offerReadError?.message || "Demande introuvable.");

  if (intent === "delete_and_reset_place" && offer.place_id) {
    const resetPatch: Record<string, unknown> = {
      status: "dispo",
      owner_member_id: null,
      list_price_eur: 0,
      monthly_ca_eur: 0,
      recos_per_year: 0,
      conversion_rate: 0,
      months_active: 0,
      reciprocity_score: 0,
      partners_count: 0,
      value_growth_pct: 0,
      company_name: null,
      privilege_badge: null,
      logo_url: null,
      category_key: null,
      partner_whatsapp: null,
      direct_contact: null,
      external_ref: null,
      offer_photo_url: null,
      offer_website_url: null,
      offer_description: null,
      partner_offer_value_eur: null,
      claimed_at: null,
      claimed_by_offer_id: null,
      updated_at: new Date().toISOString(),
    };
    const { error: resetError } = await supabaseAdmin.from("human_marketplace_places").update(resetPatch).eq("id", offer.place_id);
    if (resetError && /column/i.test(String(resetError.message || ""))) {
      const retryPatch = { ...resetPatch };
      delete (retryPatch as { claimed_at?: unknown }).claimed_at;
      delete (retryPatch as { claimed_by_offer_id?: unknown }).claimed_by_offer_id;
      const retry = await supabaseAdmin.from("human_marketplace_places").update(retryPatch).eq("id", offer.place_id);
      if (retry.error) return fail(retry.error.message || "Suppression impossible (reset place).");
    } else if (resetError) {
      return fail(resetError.message || "Suppression impossible (reset place).");
    }

    // Prevent dangling duo packs tied to this place.
    await supabaseAdmin
      .from("human_marketplace_cobrand_offers")
      .update({ status: "inactive", updated_at: new Date().toISOString() })
      .or(`primary_place_id.eq.${offer.place_id},secondary_place_id.eq.${offer.place_id}`);
  }

  const { error: nullifyError } = await supabaseAdmin
    .from("human_marketplace_events")
    .update({ offer_id: null })
    .eq("offer_id", offerId);
  if (nullifyError) return fail(nullifyError.message || "Suppression impossible (events).");

  const { error: deleteError } = await supabaseAdmin.from("human_marketplace_offers").delete().eq("id", offerId);
  if (deleteError) return fail(deleteError.message || "Suppression impossible.");

  await supabaseAdmin.from("human_marketplace_events").insert({
    place_id: offer.place_id || null,
    offer_id: null,
    event_type: "status_changed",
    payload: {
      object: "offer",
      action: "deleted",
      deleted_offer_id: offerId,
      deleted_offer_type: offer.action_type,
      deleted_offer_status: offer.status,
      intent,
      deleted_by_user_id: userId,
    },
  });

  revalidatePath("/admin/humain/marketplace");
  revalidatePath("/admin/humain/marketplace/inscriptions");
  revalidatePath("/marketplace");
  revalidatePath("/privilege");

  const message =
    intent === "delete_and_reset_place" ? "Membre supprimé et place réinitialisée en dispo." : "Demande supprimee.";
  return NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "success", message)), { status: 303 });
}
