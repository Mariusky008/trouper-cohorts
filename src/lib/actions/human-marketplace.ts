"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type MarketplacePlaceRow = {
  id: string;
  city: string;
  sphere_label: string;
  metier: string;
  status: "dispo" | "sale" | "occupied" | "reserved";
  list_price_eur: number | null;
  monthly_ca_eur: number;
  recos_per_year: number;
  updated_at: string;
  owner_member_id?: string | null;
};

type MarketplaceOfferRow = {
  id: string;
  place_id: string | null;
  action_type: "buy_offer" | "sell_request" | "join_request";
  full_name: string;
  metier: string | null;
  city: string | null;
  whatsapp: string | null;
  message: string | null;
  offer_amount_eur: number | null;
  status: "pending" | "reviewing" | "accepted" | "rejected" | "cancelled";
  created_at: string;
  requester_ip?: string | null;
  assigned_member_id?: string | null;
};

type MarketplaceOfferJoined = MarketplaceOfferRow & {
  place: Pick<MarketplacePlaceRow, "id" | "city" | "metier" | "status" | "list_price_eur"> | null;
};

function withMarketplaceStatus(currentUrl: string, status: "success" | "error", message: string) {
  const base = currentUrl || "/admin/humain/marketplace";
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}marketStatus=${encodeURIComponent(status)}&marketMessage=${encodeURIComponent(message)}`;
}

async function requireHumanAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session requise." };

  const supabaseAdmin = createAdminClient();
  const { data: adminRow } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!adminRow) return { error: "Acces admin requis." };

  return { user };
}

export async function getAdminMarketplaceSnapshot() {
  const auth = await requireHumanAdmin();
  if ("error" in auth) {
    return {
      error: auth.error,
      places: [] as MarketplacePlaceRow[],
      offers: [] as MarketplaceOfferJoined[],
      members: [] as Array<{ id: string; label: string }>,
      kpis: null as null | {
        placesTotal: number;
        placesSale: number;
        placesDispo: number;
        offersPending: number;
        offersReviewing: number;
      },
    };
  }

  const supabaseAdmin = createAdminClient();
  const [{ data: placesData }, { data: offersData }, { data: membersData }] = await Promise.all([
    supabaseAdmin
      .from("human_marketplace_places")
      .select("id,city,sphere_label,metier,status,list_price_eur,monthly_ca_eur,recos_per_year,updated_at,owner_member_id")
      .order("updated_at", { ascending: false })
      .limit(800),
    supabaseAdmin
      .from("human_marketplace_offers")
      .select(
        "id,place_id,action_type,full_name,metier,city,whatsapp,message,offer_amount_eur,status,created_at,requester_ip,assigned_member_id,place:human_marketplace_places(id,city,metier,status,list_price_eur)",
      )
      .order("created_at", { ascending: false })
      .limit(250),
    supabaseAdmin
      .from("human_members")
      .select("id,first_name,last_name,metier")
      .eq("status", "active")
      .order("first_name", { ascending: true })
      .limit(400),
  ]);

  const places = (placesData as MarketplacePlaceRow[] | null) || [];
  const offers = (offersData as MarketplaceOfferJoined[] | null) || [];
  const members = ((membersData as Array<{ id: string; first_name: string | null; last_name: string | null; metier: string | null }> | null) || []).map(
    (member) => {
      const full = [member.first_name, member.last_name].filter(Boolean).join(" ").trim();
      const label = [full || "Membre", member.metier || null].filter(Boolean).join(" · ");
      return { id: member.id, label };
    },
  );

  return {
    error: null as string | null,
    places,
    offers,
    members,
    kpis: {
      placesTotal: places.length,
      placesSale: places.filter((p) => p.status === "sale").length,
      placesDispo: places.filter((p) => p.status === "dispo").length,
      offersPending: offers.filter((o) => o.status === "pending").length,
      offersReviewing: offers.filter((o) => o.status === "reviewing").length,
    },
  };
}

async function notifyMarketplaceAdmins(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  title: string,
  message: string,
  impact: string | null,
) {
  const { data: admins } = await supabaseAdmin.from("admins").select("user_id");
  const userIds = Array.from(new Set(((admins as Array<{ user_id: string }> | null) || []).map((row) => row.user_id)));
  if (userIds.length === 0) return;

  const { data: members } = await supabaseAdmin.from("human_members").select("id,user_id").in("user_id", userIds);
  const targetMembers = ((members as Array<{ id: string; user_id: string }> | null) || []).filter((row) => Boolean(row.id));
  if (targetMembers.length === 0) return;

  await supabaseAdmin.from("human_notifications").insert(
    targetMembers.map((member) => ({
      member_id: member.id,
      type: "generale",
      title,
      message,
      impact,
    })),
  );
}

async function notifyMarketplaceMember(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  memberId: string | null,
  title: string,
  message: string,
  impact: string | null,
) {
  if (!memberId) return;
  await supabaseAdmin.from("human_notifications").insert({
    member_id: memberId,
    type: "personnelle",
    title,
    message,
    impact,
  });
}

export async function adminSetMarketplacePlaceStatusAction(formData: FormData): Promise<void> {
  const auth = await requireHumanAdmin();
  const currentUrl = String(formData.get("current_url") || "/admin/humain/marketplace");
  if ("error" in auth) redirect(withMarketplaceStatus(currentUrl, "error", auth.error || "Acces admin requis."));

  const placeId = String(formData.get("place_id") || "").trim();
  const nextStatus = String(formData.get("next_status") || "").trim();
  const listPriceRaw = String(formData.get("list_price_eur") || "").trim();
  const ownerMemberIdRaw = String(formData.get("owner_member_id") || "").trim();

  if (!placeId) redirect(withMarketplaceStatus(currentUrl, "error", "Place introuvable."));
  if (!["dispo", "sale", "occupied", "reserved"].includes(nextStatus)) {
    redirect(withMarketplaceStatus(currentUrl, "error", "Statut de place invalide."));
  }

  const patch: Record<string, unknown> = {
    status: nextStatus,
    updated_at: new Date().toISOString(),
  };
  if (listPriceRaw) {
    const parsed = Number(listPriceRaw.replace(",", "."));
    if (Number.isFinite(parsed) && parsed >= 0) patch.list_price_eur = parsed;
  }
  patch.owner_member_id = ownerMemberIdRaw || null;

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.from("human_marketplace_places").update(patch).eq("id", placeId);
  if (error) {
    redirect(withMarketplaceStatus(currentUrl, "error", error.message || "Mise a jour impossible."));
  }

  await supabaseAdmin.from("human_marketplace_events").insert({
    place_id: placeId,
    event_type: "status_changed",
    payload: { next_status: nextStatus },
  });
  await notifyMarketplaceAdmins(
    supabaseAdmin,
    "Marketplace: place mise a jour",
    `Place ${placeId} -> ${nextStatus}`,
    `place:${placeId}`,
  );

  revalidatePath("/admin/humain/marketplace");
  revalidatePath("/marketplace");
  revalidatePath("/popey-human/accueil-test/marketplace");
  redirect(withMarketplaceStatus(currentUrl, "success", "Statut place mis a jour."));
}

export async function adminUpdateMarketplaceOfferStatusAction(formData: FormData): Promise<void> {
  const auth = await requireHumanAdmin();
  const currentUrl = String(formData.get("current_url") || "/admin/humain/marketplace");
  if ("error" in auth) redirect(withMarketplaceStatus(currentUrl, "error", auth.error || "Acces admin requis."));

  const offerId = String(formData.get("offer_id") || "").trim();
  const nextStatus = String(formData.get("next_status") || "").trim();
  const assignMemberIdRaw = String(formData.get("assign_member_id") || "").trim();
  if (!offerId) redirect(withMarketplaceStatus(currentUrl, "error", "Demande introuvable."));
  if (!["pending", "reviewing", "accepted", "rejected", "cancelled"].includes(nextStatus)) {
    redirect(withMarketplaceStatus(currentUrl, "error", "Statut de demande invalide."));
  }

  const supabaseAdmin = createAdminClient();
  const { data: offer, error: offerReadError } = await supabaseAdmin
    .from("human_marketplace_offers")
    .select("id,place_id,action_type")
    .eq("id", offerId)
    .maybeSingle();
  if (offerReadError || !offer) {
    redirect(withMarketplaceStatus(currentUrl, "error", offerReadError?.message || "Demande introuvable."));
  }

  const { error } = await supabaseAdmin
    .from("human_marketplace_offers")
    .update({
      status: nextStatus,
      assigned_member_id: assignMemberIdRaw || null,
      processed_at: new Date().toISOString(),
      processed_by_user_id: auth.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", offerId);
  if (error) redirect(withMarketplaceStatus(currentUrl, "error", error.message || "Mise a jour impossible."));

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
    if (assignMemberIdRaw) {
      placePatch.owner_member_id = assignMemberIdRaw;
    }
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

  await notifyMarketplaceAdmins(
    supabaseAdmin,
    "Marketplace: demande traitee",
    `Demande ${offerId} -> ${nextStatus}`,
    `offer:${offerId}`,
  );
  if (nextStatus === "accepted") {
    await notifyMarketplaceMember(
      supabaseAdmin,
      assignMemberIdRaw || null,
      "Marketplace: place attribuee",
      "Une place marketplace vous a ete attribuee. Verifiez le detail avec l admin Popey.",
      `offer:${offerId}`,
    );
  }

  revalidatePath("/admin/humain/marketplace");
  revalidatePath("/marketplace");
  revalidatePath("/popey-human/accueil-test/marketplace");
  redirect(withMarketplaceStatus(currentUrl, "success", "Statut demande mis a jour."));
}
