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
  company_name?: string | null;
  privilege_badge?: string | null;
  partner_whatsapp?: string | null;
  category_key?: "maison" | "sante" | "travaux" | "bien-etre" | "services" | null;
  external_ref?: string | null;
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
  metadata?: Record<string, unknown> | null;
};

type MarketplaceOfferJoined = MarketplaceOfferRow & {
  place: Pick<MarketplacePlaceRow, "id" | "city" | "metier" | "status" | "list_price_eur" | "owner_member_id"> | null;
};

type MarketplaceEventRow = {
  id: string;
  place_id: string | null;
  offer_id: string | null;
  event_type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
  place: Pick<MarketplacePlaceRow, "id" | "city" | "metier"> | null;
};

type MarketplaceLandingActivationRow = {
  id: string;
  city: string;
  category_key: string;
  client_name: string;
  referrer_name: string;
  partner_name: string | null;
  partner_phone: string | null;
  source: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
  place: Pick<MarketplacePlaceRow, "id" | "city" | "metier"> | null;
};

type MarketplaceSnapshotFilters = {
  offerStatus?: string;
  offerActionType?: string;
  placeCity?: string;
  timelinePlaceId?: string;
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

export async function getAdminMarketplaceSnapshot(filters: MarketplaceSnapshotFilters = {}) {
  const auth = await requireHumanAdmin();
  if ("error" in auth) {
    return {
      error: auth.error,
      places: [] as MarketplacePlaceRow[],
      offers: [] as MarketplaceOfferJoined[],
      timelineEvents: [] as MarketplaceEventRow[],
      recentActivations: [] as MarketplaceLandingActivationRow[],
      members: [] as Array<{ id: string; label: string }>,
      filters: {
        offerStatus: filters.offerStatus || "all",
        offerActionType: filters.offerActionType || "all",
        placeCity: filters.placeCity || "all",
        timelinePlaceId: filters.timelinePlaceId || "",
      },
      cities: [] as string[],
      selectedTimelinePlaceId: "",
      kpis: null as null | {
        placesTotal: number;
        placesSale: number;
        placesDispo: number;
        offersPending: number;
        offersReviewing: number;
        offersRawTotal: number;
        offersRawLast24h: number;
      },
    };
  }

  const supabaseAdmin = createAdminClient();
  const [{ data: placesData, error: placesError }, { data: offersData, error: offersError }, { data: membersData, error: membersError }] =
    await Promise.all([
    supabaseAdmin
      .from("human_marketplace_places")
      .select("id,city,sphere_label,metier,status,list_price_eur,monthly_ca_eur,recos_per_year,updated_at,owner_member_id,company_name,privilege_badge,partner_whatsapp,category_key,external_ref")
      .order("updated_at", { ascending: false })
      .limit(800),
    supabaseAdmin
      .from("human_marketplace_offers")
      .select("id,place_id,action_type,full_name,metier,city,whatsapp,message,offer_amount_eur,status,created_at,requester_ip,assigned_member_id,metadata")
      .order("created_at", { ascending: false })
      .limit(500),
    supabaseAdmin
      .from("human_members")
      .select("id,first_name,last_name,metier")
      .eq("status", "active")
      .order("first_name", { ascending: true })
      .limit(400),
  ]);

  if (placesError || offersError || membersError) {
    return {
      error: [placesError?.message, offersError?.message, membersError?.message].filter(Boolean).join(" | ") || "Chargement admin impossible.",
      places: [] as MarketplacePlaceRow[],
      offers: [] as MarketplaceOfferJoined[],
      timelineEvents: [] as MarketplaceEventRow[],
      recentActivations: [] as MarketplaceLandingActivationRow[],
      members: [] as Array<{ id: string; label: string }>,
      filters: {
        offerStatus: filters.offerStatus || "all",
        offerActionType: filters.offerActionType || "all",
        placeCity: filters.placeCity || "all",
        timelinePlaceId: filters.timelinePlaceId || "",
      },
      cities: [] as string[],
      selectedTimelinePlaceId: "",
      kpis: null as null | {
        placesTotal: number;
        placesSale: number;
        placesDispo: number;
        offersPending: number;
        offersReviewing: number;
        offersRawTotal: number;
        offersRawLast24h: number;
      },
    };
  }

  const places = (placesData as MarketplacePlaceRow[] | null) || [];
  const placesById = new Map(places.map((place) => [place.id, place]));
  const offersRaw = ((offersData as MarketplaceOfferRow[] | null) || []).map((offer) => ({
    ...offer,
    place: offer.place_id ? (placesById.get(offer.place_id) ?? null) : null,
  })) as MarketplaceOfferJoined[];
  let offers = offersRaw.slice();
  const members = ((membersData as Array<{ id: string; first_name: string | null; last_name: string | null; metier: string | null }> | null) || []).map(
    (member) => {
      const full = [member.first_name, member.last_name].filter(Boolean).join(" ").trim();
      const label = [full || "Membre", member.metier || null].filter(Boolean).join(" · ");
      return { id: member.id, label };
    },
  );
  if (filters.offerStatus && filters.offerStatus !== "all") {
    offers = offers.filter((offer) => offer.status === filters.offerStatus);
  }
  if (filters.offerActionType && filters.offerActionType !== "all") {
    offers = offers.filter((offer) => offer.action_type === filters.offerActionType);
  }

  let filteredPlaces = places.slice();
  if (filters.placeCity && filters.placeCity !== "all") {
    filteredPlaces = filteredPlaces.filter((place) => place.city === filters.placeCity);
  }

  const selectedTimelinePlaceId =
    (filters.timelinePlaceId && filteredPlaces.find((place) => place.id === filters.timelinePlaceId)?.id) ||
    filteredPlaces[0]?.id ||
    "";

  const { data: eventsData } = await supabaseAdmin
    .from("human_marketplace_events")
    .select("id,place_id,offer_id,event_type,payload,created_at,place:human_marketplace_places(id,city,metier)")
    .eq("place_id", selectedTimelinePlaceId)
    .order("created_at", { ascending: false })
    .limit(40);
  const timelineEvents = (eventsData as MarketplaceEventRow[] | null) || [];
  const { data: activationsData } = await supabaseAdmin
    .from("human_marketplace_landing_activations")
    .select("id,city,category_key,client_name,referrer_name,partner_name,partner_phone,source,created_at,metadata,place:human_marketplace_places(id,city,metier)")
    .order("created_at", { ascending: false })
    .limit(80);
  const recentActivations = (activationsData as MarketplaceLandingActivationRow[] | null) || [];
  const cities = Array.from(new Set(places.map((place) => place.city))).sort((a, b) => a.localeCompare(b, "fr"));
  const offersRawLast24h = offersRaw.filter((offer) => {
    const createdAt = Date.parse(String(offer.created_at || ""));
    if (!Number.isFinite(createdAt)) return false;
    return createdAt >= Date.now() - 24 * 60 * 60 * 1000;
  }).length;

  return {
    error: null as string | null,
    places: filteredPlaces,
    offers,
    timelineEvents,
    recentActivations,
    members,
    cities,
    selectedTimelinePlaceId,
    filters: {
      offerStatus: filters.offerStatus || "all",
      offerActionType: filters.offerActionType || "all",
      placeCity: filters.placeCity || "all",
      timelinePlaceId: selectedTimelinePlaceId,
    },
    kpis: {
      placesTotal: filteredPlaces.length,
      placesSale: filteredPlaces.filter((p) => p.status === "sale").length,
      placesDispo: filteredPlaces.filter((p) => p.status === "dispo").length,
      offersPending: offers.filter((o) => o.status === "pending").length,
      offersReviewing: offers.filter((o) => o.status === "reviewing").length,
      offersRawTotal: offersRaw.length,
      offersRawLast24h,
    },
  };
}

function canTransitionPlaceStatus(fromStatus: string, toStatus: string) {
  if (fromStatus === toStatus) return true;
  const allowed: Record<string, string[]> = {
    dispo: ["reserved", "occupied", "sale"],
    reserved: ["occupied", "dispo", "sale"],
    occupied: ["sale", "dispo"],
    sale: ["occupied", "reserved", "dispo"],
  };
  return (allowed[fromStatus] || []).includes(toStatus);
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
  const companyNameRaw = String(formData.get("company_name") || "").trim();
  const privilegeBadgeRaw = String(formData.get("privilege_badge") || "").trim();
  const partnerWhatsappRaw = String(formData.get("partner_whatsapp") || "").trim();
  const categoryKeyRaw = String(formData.get("category_key") || "").trim().toLowerCase();
  const externalRefRaw = String(formData.get("external_ref") || "").trim();

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
  patch.company_name = companyNameRaw || null;
  patch.privilege_badge = privilegeBadgeRaw || null;
  patch.partner_whatsapp = partnerWhatsappRaw || null;
  if (categoryKeyRaw) {
    if (!["maison", "sante", "travaux", "bien-etre", "services"].includes(categoryKeyRaw)) {
      redirect(withMarketplaceStatus(currentUrl, "error", "Categorie privilege invalide."));
    }
    patch.category_key = categoryKeyRaw;
  } else {
    patch.category_key = null;
  }
  patch.external_ref = externalRefRaw || null;

  const supabaseAdmin = createAdminClient();
  const { data: currentPlace, error: placeReadError } = await supabaseAdmin
    .from("human_marketplace_places")
    .select("id,status")
    .eq("id", placeId)
    .maybeSingle();
  if (placeReadError || !currentPlace) {
    redirect(withMarketplaceStatus(currentUrl, "error", placeReadError?.message || "Place introuvable."));
  }
  if (!canTransitionPlaceStatus(String(currentPlace.status || ""), nextStatus)) {
    redirect(
      withMarketplaceStatus(
        currentUrl,
        "error",
        `Transition invalide: ${String(currentPlace.status)} -> ${nextStatus}.`,
      ),
    );
  }
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
    .select("id,place_id,action_type,status")
    .eq("id", offerId)
    .maybeSingle();
  if (offerReadError || !offer) {
    redirect(withMarketplaceStatus(currentUrl, "error", offerReadError?.message || "Demande introuvable."));
  }
  if (!canTransitionOfferStatus(String(offer.status || ""), nextStatus)) {
    redirect(
      withMarketplaceStatus(
        currentUrl,
        "error",
        `Transition demande invalide: ${String(offer.status)} -> ${nextStatus}.`,
      ),
    );
  }

  const fullPatch = {
    status: nextStatus,
    assigned_member_id: assignMemberIdRaw || null,
    processed_at: new Date().toISOString(),
    processed_by_user_id: auth.user.id,
    updated_at: new Date().toISOString(),
  };
  let { error } = await supabaseAdmin
    .from("human_marketplace_offers")
    .update(fullPatch)
    .eq("id", offerId);
  // Compatibility fallback: older DBs may not yet have processed_* / updated_at columns.
  if (error && /column/i.test(String(error.message || ""))) {
    const fallback = await supabaseAdmin
      .from("human_marketplace_offers")
      .update({
        status: nextStatus,
        assigned_member_id: assignMemberIdRaw || null,
      })
      .eq("id", offerId);
    error = fallback.error;
  }
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

export async function adminDeleteMarketplaceOfferAction(formData: FormData): Promise<void> {
  const auth = await requireHumanAdmin();
  const currentUrl = String(formData.get("current_url") || "/admin/humain/marketplace");
  if ("error" in auth) redirect(withMarketplaceStatus(currentUrl, "error", auth.error || "Acces admin requis."));

  const offerId = String(formData.get("offer_id") || "").trim();
  if (!offerId) redirect(withMarketplaceStatus(currentUrl, "error", "Demande introuvable."));

  const supabaseAdmin = createAdminClient();
  const { data: offer, error: offerReadError } = await supabaseAdmin
    .from("human_marketplace_offers")
    .select("id,place_id,action_type,full_name")
    .eq("id", offerId)
    .maybeSingle();
  if (offerReadError || !offer) {
    redirect(withMarketplaceStatus(currentUrl, "error", offerReadError?.message || "Demande introuvable."));
  }

  // Safety: neutralize references first in case FK is strict in legacy environments.
  const { error: nullifyError } = await supabaseAdmin
    .from("human_marketplace_events")
    .update({ offer_id: null })
    .eq("offer_id", offerId);
  if (nullifyError) {
    redirect(withMarketplaceStatus(currentUrl, "error", nullifyError.message || "Suppression impossible (events)."));
  }

  const { error: deleteError } = await supabaseAdmin.from("human_marketplace_offers").delete().eq("id", offerId);
  if (deleteError) {
    redirect(withMarketplaceStatus(currentUrl, "error", deleteError.message || "Suppression impossible."));
  }

  await supabaseAdmin.from("human_marketplace_events").insert({
    place_id: offer.place_id || null,
    offer_id: null,
    event_type: "status_changed",
    payload: {
      object: "offer",
      action: "deleted",
      deleted_offer_id: offerId,
      deleted_offer_type: offer.action_type,
      deleted_by_user_id: auth.user.id,
    },
  });

  await notifyMarketplaceAdmins(
    supabaseAdmin,
    "Marketplace: demande supprimee",
    `${offer.full_name || "Demande"} (${offer.action_type}) supprimee`,
    `offer:${offerId}`,
  );

  revalidatePath("/admin/humain/marketplace");
  revalidatePath("/admin/humain/marketplace/inscriptions");
  redirect(withMarketplaceStatus(currentUrl, "success", "Demande supprimee."));
}

export async function adminUpdatePrivilegeActivationStatusAction(formData: FormData): Promise<void> {
  const auth = await requireHumanAdmin();
  const currentUrl = String(formData.get("current_url") || "/admin/humain/privileges");
  if ("error" in auth) redirect(withMarketplaceStatus(currentUrl, "error", auth.error || "Acces admin requis."));

  const activationId = String(formData.get("activation_id") || "").trim();
  const nextStatus = String(formData.get("next_status") || "").trim().toLowerCase();
  const note = String(formData.get("note") || "").trim();

  const allowed = ["new", "contacted", "rdv", "signed", "closed"];
  if (!activationId) redirect(withMarketplaceStatus(currentUrl, "error", "Activation introuvable."));
  if (!allowed.includes(nextStatus)) {
    redirect(withMarketplaceStatus(currentUrl, "error", "Statut activation invalide."));
  }

  const supabaseAdmin = createAdminClient();
  const { data: activation, error: activationReadError } = await supabaseAdmin
    .from("human_marketplace_landing_activations")
    .select("id,metadata")
    .eq("id", activationId)
    .maybeSingle();
  if (activationReadError || !activation) {
    redirect(withMarketplaceStatus(currentUrl, "error", activationReadError?.message || "Activation introuvable."));
  }

  const currentMeta =
    activation.metadata && typeof activation.metadata === "object" && !Array.isArray(activation.metadata)
      ? (activation.metadata as Record<string, unknown>)
      : {};
  const nextMeta = {
    ...currentMeta,
    workflow_status: nextStatus,
    workflow_note: note || null,
    workflow_updated_at: new Date().toISOString(),
    workflow_updated_by_user_id: auth.user.id,
  };

  const { error } = await supabaseAdmin
    .from("human_marketplace_landing_activations")
    .update({ metadata: nextMeta })
    .eq("id", activationId);
  if (error) {
    redirect(withMarketplaceStatus(currentUrl, "error", error.message || "Mise a jour activation impossible."));
  }

  revalidatePath("/admin/humain/privileges");
  revalidatePath("/admin/humain/marketplace");
  redirect(withMarketplaceStatus(currentUrl, "success", "Statut activation mis a jour."));
}
