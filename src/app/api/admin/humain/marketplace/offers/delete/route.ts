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

export async function POST(request: Request) {
  const formData = await request.formData();
  const currentUrl = String(formData.get("current_url") || "/admin/humain/marketplace");
  const offerId = String(formData.get("offer_id") || "").trim();

  const fail = (message: string) =>
    NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "error", message)), { status: 303 });

  if (!offerId) return fail("Demande introuvable.");

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
    .select("id,place_id,action_type,full_name")
    .eq("id", offerId)
    .maybeSingle();
  if (offerReadError || !offer) return fail(offerReadError?.message || "Demande introuvable.");

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
      deleted_by_user_id: user.id,
    },
  });

  revalidatePath("/admin/humain/marketplace");
  revalidatePath("/admin/humain/marketplace/inscriptions");

  return NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "success", "Demande supprimee.")), {
    status: 303,
  });
}

