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
  const intent = String(formData.get("intent") || "create").trim().toLowerCase();
  const eventId = String(formData.get("event_id") || "").trim();

  const fail = (message: string) =>
    NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "error", message)), { status: 303 });

  const userId = await getServerUserIdWithProxyFallback();
  if (!userId) return fail("Session requise.");

  const supabaseAdmin = createAdminClient();
  const { data: adminRow } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (!adminRow) return fail("Acces admin requis.");

  if (intent === "delete") {
    if (!eventId) return fail("Evenement introuvable.");
    const { error } = await supabaseAdmin.from("human_privilege_local_events").delete().eq("id", eventId);
    if (error) return fail(error.message || "Suppression impossible.");
  } else if (intent === "toggle") {
    if (!eventId) return fail("Evenement introuvable.");
    const nextStatus = String(formData.get("next_status") || "").trim();
    if (!["active", "inactive"].includes(nextStatus)) return fail("Statut evenement invalide.");
    const { error } = await supabaseAdmin
      .from("human_privilege_local_events")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", eventId);
    if (error) return fail(error.message || "Mise a jour impossible.");
  } else {
    const city = String(formData.get("city") || "").trim();
    const citySlug = slugify(city);
    const title = String(formData.get("title") || "").trim();
    const dayLabel = String(formData.get("day_label") || "").trim();
    const placeLabel = String(formData.get("place_label") || "").trim();
    const badge = String(formData.get("badge") || "").trim();
    const sponsorNames = String(formData.get("sponsor_names") || "").trim();
    const emoji = String(formData.get("emoji") || "").trim();
    const details = String(formData.get("details") || "").trim();
    const imageUrl = String(formData.get("image_url") || "").trim();
    const sortOrderRaw = Number(String(formData.get("sort_order") || "100").trim());
    const statusRaw = String(formData.get("status") || "active").trim().toLowerCase();
    const sortOrder = Number.isFinite(sortOrderRaw) ? Math.max(0, Math.round(sortOrderRaw)) : 100;
    const status = statusRaw === "inactive" ? "inactive" : "active";

    if (!city || !citySlug) return fail("Ville obligatoire.");
    if (!title) return fail("Titre obligatoire.");
    if (!dayLabel) return fail("Jour/heure obligatoire.");
    if (!placeLabel) return fail("Lieu obligatoire.");

    const payload = {
      city,
      city_slug: citySlug,
      title,
      day_label: dayLabel,
      place_label: placeLabel,
      badge: badge || null,
      sponsor_names: sponsorNames || null,
      emoji: emoji || null,
      details: details || null,
      image_url: imageUrl || null,
      sort_order: sortOrder,
      status,
      updated_at: new Date().toISOString(),
    };

    if (intent === "update") {
      if (!eventId) return fail("Evenement introuvable.");
      const { error } = await supabaseAdmin.from("human_privilege_local_events").update(payload).eq("id", eventId);
      if (error) return fail(error.message || "Mise a jour evenement impossible.");
    } else {
      const { error } = await supabaseAdmin.from("human_privilege_local_events").insert(payload);
      if (error) return fail(error.message || "Creation evenement impossible.");
    }
  }

  revalidatePath("/admin/humain/marketplace");
  revalidatePath("/privilege");
  return NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "success", "Evenements locaux mis a jour.")), {
    status: 303,
  });
}
