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

function normalizeName(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

  const primarySelector = trim(formData.get("primary_member_id"));
  const secondarySelector = trim(formData.get("secondary_member_id"));
  let primaryPlaceId = trim(formData.get("primary_place_id")) || null;
  let secondaryPlaceId = trim(formData.get("secondary_place_id")) || null;
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

  if (!primarySelector || !secondarySelector) return fail("Sélectionne deux membres acceptés.");
  if (!packTitle) return fail("Nom du pack obligatoire.");
  if (!primaryOfferLabel || !secondaryOfferLabel) return fail("Les deux offres doivent être renseignées.");
  if (!Number.isFinite(primaryValue) || primaryValue < 0 || !Number.isFinite(secondaryValue) || secondaryValue < 0) {
    return fail("Montants co-brandés invalides.");
  }

  const resolveSelector = async (selector: string) => {
    if (selector.startsWith("offer:")) {
      const offerId = selector.replace(/^offer:/, "").trim();
      const { data: offer } = await supabaseAdmin
        .from("human_marketplace_offers")
        .select("id,full_name,metier,place_id")
        .eq("id", offerId)
        .eq("status", "accepted")
        .maybeSingle();
      return {
        memberId: null as string | null,
        name: trim(offer?.full_name) || "Membre Popey",
        metier: trim(offer?.metier) || "Professionnel",
        placeId: trim(offer?.place_id) || null,
      };
    }
    const { data: member } = await supabaseAdmin
      .from("human_members")
      .select("id,first_name,last_name,metier")
      .eq("id", selector)
      .maybeSingle();
    if (!member) {
      return {
        memberId: null as string | null,
        name: "Membre Popey",
        metier: "Professionnel",
        placeId: null as string | null,
      };
    }
    const name = [trim(member.first_name), trim(member.last_name)].filter(Boolean).join(" ").trim() || "Membre Popey";
    return {
      memberId: trim(member.id) || null,
      name,
      metier: trim(member.metier) || "Professionnel",
      placeId: null as string | null,
    };
  };

  const [primaryResolved, secondaryResolved] = await Promise.all([resolveSelector(primarySelector), resolveSelector(secondarySelector)]);
  if (
    (primaryResolved.memberId && secondaryResolved.memberId && primaryResolved.memberId === secondaryResolved.memberId) ||
    (!primaryResolved.memberId && !secondaryResolved.memberId && normalizeName(primaryResolved.name) === normalizeName(secondaryResolved.name))
  ) {
    return fail("Les deux membres doivent être différents.");
  }
  if (!primaryPlaceId && primaryResolved.placeId) primaryPlaceId = primaryResolved.placeId;
  if (!secondaryPlaceId && secondaryResolved.placeId) secondaryPlaceId = secondaryResolved.placeId;

  const citySlug = slugify(cityRaw || "dax");
  const cityLabel = cityRaw || "Dax";
  const payload = {
    city: cityLabel,
    city_slug: citySlug,
    primary_member_id: primaryResolved.memberId,
    secondary_member_id: secondaryResolved.memberId,
    primary_member_name: primaryResolved.name,
    primary_member_metier: primaryResolved.metier,
    secondary_member_name: secondaryResolved.name,
    secondary_member_metier: secondaryResolved.metier,
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
  if (insertError) {
    const msg = String(insertError.message || "");
    const isSchemaMissing =
      /column/i.test(msg) ||
      /primary_member_name/i.test(msg) ||
      /secondary_member_name/i.test(msg);
    const isNullConstraint =
      /null value in column/i.test(msg) &&
      (/primary_member_id/i.test(msg) || /secondary_member_id/i.test(msg));
    if (isSchemaMissing || isNullConstraint) {
      return fail(
        "Schema SQL co-brandé incomplet en production. Exécutez la migration `20260501124500_update_human_marketplace_cobrand_offers_nullable_members.sql` puis recommencez.",
      );
    }
    return fail(insertError.message || "Création co-brandée impossible.");
  }

  revalidatePath("/admin/humain/marketplace");
  revalidatePath("/privilege");
  if (citySlug) revalidatePath(`/privilege/${citySlug}`);
  return NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "success", "Offre co-brandée créée.")), {
    status: 303,
  });
}
