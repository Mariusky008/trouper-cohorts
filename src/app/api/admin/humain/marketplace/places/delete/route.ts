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
  const placeId = String(formData.get("place_id") || "").trim();

  const fail = (message: string) =>
    NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "error", message)), { status: 303 });

  if (!placeId) return fail("Place introuvable.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Session requise.");

  const supabaseAdmin = createAdminClient();
  const { data: adminRow } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!adminRow) return fail("Acces admin requis.");

  const { data: place, error: readError } = await supabaseAdmin
    .from("human_marketplace_places")
    .select("id,metier,city")
    .eq("id", placeId)
    .maybeSingle();
  if (readError || !place) return fail(readError?.message || "Place introuvable.");

  const { error: deleteError } = await supabaseAdmin.from("human_marketplace_places").delete().eq("id", placeId);
  if (deleteError) return fail(deleteError.message || "Suppression place impossible.");

  await supabaseAdmin.from("human_marketplace_events").insert({
    place_id: null,
    offer_id: null,
    event_type: "status_changed",
    payload: {
      object: "place",
      action: "deleted",
      deleted_place_id: placeId,
      deleted_place_metier: place.metier,
      deleted_place_city: place.city,
      deleted_by_user_id: user.id,
    },
  });

  revalidatePath("/admin/humain/marketplace");
  revalidatePath("/admin/humain/marketplace/inscriptions");
  revalidatePath("/privilege");

  return NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "success", "Place supprimee.")), {
    status: 303,
  });
}
