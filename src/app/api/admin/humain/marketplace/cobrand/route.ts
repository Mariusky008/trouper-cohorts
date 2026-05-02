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

function slugify(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function trim(value: unknown): string {
  return String(value || "").trim();
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const currentUrl = trim(formData.get("current_url")) || "/admin/humain/marketplace";
  const intent = trim(formData.get("intent")) || "create";

  const fail = (message: string) =>
    NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "error", message)), { status: 303 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Session requise.");

  const supabaseAdmin = createAdminClient();
  const { data: adminRow } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!adminRow) return fail("Acces admin requis.");

  if (intent === "toggle") {
    const cobrandId = trim(formData.get("cobrand_id"));
    const nextStatus = trim(formData.get("next_status")).toLowerCase();
    if (!cobrandId) return fail("Offre co-brandée introuvable.");
    if (!["active", "inactive"].includes(nextStatus)) return fail("Statut co-brandé invalide.");
    const { data: row, error: updateError } = await supabaseAdmin
      .from("human_marketplace_cobrand_offers")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", cobrandId)
      .select("city_slug")
      .maybeSingle();
    if (updateError) return fail(updateError.message || "Mise a jour co-brandée impossible.");

    revalidatePath("/admin/humain/marketplace");
    revalidatePath("/privilege");
    if (trim(row?.city_slug)) revalidatePath(`/privilege/${trim(row?.city_slug)}`);
    return NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "success", "Statut co-brandé mis à jour.")), {
      status: 303,
    });
  }

  if (intent === "delete") {
    const cobrandId = trim(formData.get("cobrand_id"));
    if (!cobrandId) return fail("Offre co-brandée introuvable.");
    const { data: row, error: deleteError } = await supabaseAdmin
      .from("human_marketplace_cobrand_offers")
      .delete()
      .eq("id", cobrandId)
      .select("city_slug")
      .maybeSingle();
    if (deleteError) return fail(deleteError.message || "Suppression co-brandée impossible.");
    revalidatePath("/admin/humain/marketplace");
    revalidatePath("/privilege");
    if (trim(row?.city_slug)) revalidatePath(`/privilege/${trim(row?.city_slug)}`);
    return NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "success", "Offre co-brandée supprimée.")), {
      status: 303,
    });
  }

  const primaryMemberId = trim(formData.get("primary_member_id"));
  const secondaryMemberId = trim(formData.get("secondary_member_id"));
  const primaryPlaceId = trim(formData.get("primary_place_id")) || null;
  const secondaryPlaceId = trim(formData.get("secondary_place_id")) || null;
  const cityRaw = trim(formData.get("city"));
  const packTitle = trim(formData.get("pack_title"));
  const packSubtitle = trim(formData.get("pack_subtitle")) || null;
  const primaryOfferLabel = trim(formData.get("primary_offer_label"));
  const secondaryOfferLabel = trim(formData.get("secondary_offer_label"));
  const commissionNote = trim(formData.get("commission_note")) || null;
  const primaryValueRaw = trim(formData.get("primary_offer_value_eur"));
  const secondaryValueRaw = trim(formData.get("secondary_offer_value_eur"));
  const primaryValue = Number(primaryValueRaw.replace(",", "."));
  const secondaryValue = Number(secondaryValueRaw.replace(",", "."));

  if (!primaryMemberId || !secondaryMemberId) return fail("Sélectionne deux membres acceptés.");
  if (primaryMemberId === secondaryMemberId) return fail("Les deux membres doivent être différents.");
  if (!packTitle) return fail("Nom du pack obligatoire.");
  if (!primaryOfferLabel || !secondaryOfferLabel) return fail("Les deux offres doivent être renseignées.");
  if (!Number.isFinite(primaryValue) || primaryValue < 0 || !Number.isFinite(secondaryValue) || secondaryValue < 0) {
    return fail("Montants co-brandés invalides.");
  }

  const citySlug = slugify(cityRaw || "dax");
  const cityLabel = cityRaw || "Dax";
  const payload = {
    city: cityLabel,
    city_slug: citySlug,
    primary_member_id: primaryMemberId,
    secondary_member_id: secondaryMemberId,
    primary_place_id: primaryPlaceId,
    secondary_place_id: secondaryPlaceId,
    pack_title: packTitle,
    pack_subtitle: packSubtitle,
    primary_offer_label: primaryOfferLabel,
    primary_offer_value_eur: primaryValue,
    secondary_offer_label: secondaryOfferLabel,
    secondary_offer_value_eur: secondaryValue,
    commission_note: commissionNote,
    status: "active",
    created_by_user_id: user.id,
    updated_at: new Date().toISOString(),
  };

  const { error: insertError } = await supabaseAdmin.from("human_marketplace_cobrand_offers").insert(payload);
  if (insertError) return fail(insertError.message || "Création co-brandée impossible.");

  revalidatePath("/admin/humain/marketplace");
  revalidatePath("/privilege");
  if (citySlug) revalidatePath(`/privilege/${citySlug}`);
  return NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "success", "Offre co-brandée créée.")), {
    status: 303,
  });
}
