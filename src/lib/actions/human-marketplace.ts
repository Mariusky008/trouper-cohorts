"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";
import { sendWhatsAppTextMessage } from "@/lib/actions/whatsapp-twilio";
import { computeMarketplacePlaceValue } from "@/lib/popey-marketplace";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  offer_photo_url?: string | null;
  offer_website_url?: string | null;
  offer_description?: string | null;
  owner_display_name?: string | null;
  owner_profile_photo_url?: string | null;
  offer_expires_at?: string | null;
  direct_contact?: string | null;
  partner_offer_value_eur?: number | null;
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
  place: Pick<
    MarketplacePlaceRow,
    | "id"
    | "city"
    | "metier"
    | "status"
    | "list_price_eur"
    | "owner_member_id"
    | "company_name"
    | "privilege_badge"
    | "partner_whatsapp"
    | "category_key"
    | "external_ref"
    | "offer_photo_url"
    | "offer_website_url"
    | "offer_description"
    | "owner_display_name"
    | "owner_profile_photo_url"
    | "offer_expires_at"
    | "direct_contact"
    | "partner_offer_value_eur"
  > | null;
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
  referrer_id: string;
  referrer_name: string;
  partner_member_id: string | null;
  partner_name: string | null;
  partner_phone: string | null;
  source: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
  place: Pick<MarketplacePlaceRow, "id" | "city" | "metier"> | null;
};

type MarketplaceCobrandRow = {
  id: string;
  city: string;
  city_slug: string;
  primary_member_id: string | null;
  secondary_member_id: string | null;
  primary_member_name: string | null;
  primary_member_metier: string | null;
  secondary_member_name: string | null;
  secondary_member_metier: string | null;
  primary_place_id: string | null;
  secondary_place_id: string | null;
  pack_title: string;
  pack_subtitle: string | null;
  primary_offer_label: string;
  primary_offer_value_eur: number | null;
  secondary_offer_label: string;
  secondary_offer_value_eur: number | null;
  commission_note: string | null;
  status: "active" | "inactive";
  updated_at: string;
};

type MarketplaceLocalEventRow = {
  id: string;
  city: string;
  city_slug: string;
  title: string;
  day_label: string;
  place_label: string;
  badge: string | null;
  sponsor_names: string | null;
  emoji: string | null;
  details: string | null;
  image_url: string | null;
  sort_order: number;
  status: "active" | "inactive";
  updated_at: string;
  event_date?: string | null;
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

function withMarketplaceFocus(currentUrl: string, activationId: string) {
  if (!activationId) return currentUrl;
  const sep = currentUrl.includes("?") ? "&" : "?";
  return `${currentUrl}${sep}marketFocus=${encodeURIComponent(activationId)}#ticket-${encodeURIComponent(activationId)}`;
}

function normalizePhone(raw: string) {
  let digits = String(raw || "").trim().replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("0")) digits = `33${digits.slice(1)}`;
  if (digits.length < 8 || digits.length > 15) return "";
  return `+${digits}`;
}

function looksLikeUuid(value: string) {
  return UUID_REGEX.test(String(value || "").trim());
}

function asMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function firstDayOfCurrentMonthIso() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return start.toISOString().slice(0, 10);
}

async function requireHumanAdmin() {
  const userId = await getServerUserIdWithProxyFallback();
  if (!userId) return { error: "Session requise." };

  const supabaseAdmin = createAdminClient();
  const { data: adminRow } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (!adminRow) return { error: "Acces admin requis." };

  return { user: { id: userId } };
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
      cobrandOffers: [] as MarketplaceCobrandRow[],
      localEvents: [] as MarketplaceLocalEventRow[],
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
      .select("id,city,sphere_label,metier,status,list_price_eur,monthly_ca_eur,recos_per_year,updated_at,owner_member_id,company_name,privilege_badge,partner_whatsapp,category_key,external_ref,offer_photo_url,offer_website_url,offer_description,owner_display_name,owner_profile_photo_url,offer_expires_at,direct_contact,partner_offer_value_eur")
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
      cobrandOffers: [] as MarketplaceCobrandRow[],
      localEvents: [] as MarketplaceLocalEventRow[],
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
  // City filter should apply to offers too (either explicit offer city or linked place city).
  if (filters.placeCity && filters.placeCity !== "all") {
    offers = offers.filter((offer) => {
      const offerCity = String(offer.city || "").trim();
      const placeCity = String(offer.place?.city || "").trim();
      return offerCity === filters.placeCity || placeCity === filters.placeCity;
    });
  }

  let filteredPlaces = places.slice();
  if (filters.placeCity && filters.placeCity !== "all") {
    filteredPlaces = filteredPlaces.filter((place) => place.city === filters.placeCity);
  }

  const selectedTimelinePlaceId =
    (filters.timelinePlaceId && filteredPlaces.find((place) => place.id === filters.timelinePlaceId)?.id) ||
    filteredPlaces[0]?.id ||
    "";

  const timelineEvents = selectedTimelinePlaceId
    ? (((await supabaseAdmin
        .from("human_marketplace_events")
        .select("id,place_id,offer_id,event_type,payload,created_at,place:human_marketplace_places(id,city,metier)")
        .eq("place_id", selectedTimelinePlaceId)
        .order("created_at", { ascending: false })
        .limit(40)).data as MarketplaceEventRow[] | null) || [])
    : [];
  const { data: activationsData } = await supabaseAdmin
    .from("human_marketplace_landing_activations")
    .select(
      "id,city,category_key,client_name,referrer_id,referrer_name,partner_member_id,partner_name,partner_phone,source,created_at,metadata,place:human_marketplace_places(id,city,metier)",
    )
    .order("created_at", { ascending: false })
    .limit(300);
  const recentActivations = (activationsData as MarketplaceLandingActivationRow[] | null) || [];
  let cobrandOffers: MarketplaceCobrandRow[] = [];
  let localEvents: MarketplaceLocalEventRow[] = [];
  try {
    const { data: cobrandData, error: cobrandError } = await supabaseAdmin
      .from("human_marketplace_cobrand_offers")
      .select(
        "id,city,city_slug,primary_member_id,secondary_member_id,primary_member_name,primary_member_metier,secondary_member_name,secondary_member_metier,primary_place_id,secondary_place_id,pack_title,pack_subtitle,primary_offer_label,primary_offer_value_eur,secondary_offer_label,secondary_offer_value_eur,commission_note,status,updated_at",
      )
      .order("updated_at", { ascending: false })
      .limit(200);
    if (cobrandError) {
      throw cobrandError;
    }
    cobrandOffers = (cobrandData as MarketplaceCobrandRow[] | null) || [];
  } catch (error) {
    console.warn("[admin marketplace] cobrand snapshot unavailable", error);
  }
  try {
    const localEventsBaseCols =
      "id,city,city_slug,title,day_label,place_label,badge,sponsor_names,emoji,details,image_url,sort_order,status,updated_at";
    const runLocalEvents = (cols: string) =>
      supabaseAdmin
        .from("human_privilege_local_events")
        .select(cols)
        .order("city_slug", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("updated_at", { ascending: false })
        .limit(300);
    // Résilient : retombe sans event_date si la migration n'est pas appliquée.
    let { data: localEventsData, error: localEventsError } = await runLocalEvents(localEventsBaseCols + ",event_date");
    if (localEventsError && /event_date/i.test(String(localEventsError.message || ""))) {
      ({ data: localEventsData, error: localEventsError } = await runLocalEvents(localEventsBaseCols));
    }
    if (localEventsError) throw localEventsError;
    localEvents = (localEventsData as unknown as MarketplaceLocalEventRow[] | null) || [];
  } catch (error) {
    console.warn("[admin marketplace] local events snapshot unavailable", error);
  }
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
    cobrandOffers,
    localEvents,
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
      months_active: 0,
      recos_per_year: 0,
      list_price_eur: computeMarketplacePlaceValue({ monthsActive: 0, recosCount: 0, offersBoughtCount: 0 }),
      value_growth_pct: 0,
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
  const nextStatusRaw = String(formData.get("next_status") || "").trim().toLowerCase();
  const note = String(formData.get("note") || "").trim();

  const statusAlias: Record<string, string> = {
    new: "pending",
    pending: "pending",
    contacted: "contacted",
    rdv: "in_progress",
    "in-progress": "in_progress",
    in_progress: "in_progress",
    signed: "validated",
    validated: "validated",
    closed: "refused",
    refused: "refused",
  };
  const nextStatus = statusAlias[nextStatusRaw] || nextStatusRaw;
  const allowed = ["pending", "contacted", "in_progress", "validated", "refused"];
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
  redirect(withMarketplaceStatus(withMarketplaceFocus(currentUrl, activationId), "success", "Statut ticket mis à jour."));
}

export async function adminDecideAffiliateCommissionAction(formData: FormData): Promise<void> {
  const auth = await requireHumanAdmin();
  const currentUrl = String(formData.get("current_url") || "/admin/humain/affiliation");
  if ("error" in auth) redirect(withMarketplaceStatus(currentUrl, "error", auth.error || "Acces admin requis."));

  const activationId = String(formData.get("activation_id") || "").trim();
  const decisionRaw = String(formData.get("decision_status") || "").trim().toLowerCase();
  const note = String(formData.get("commission_note") || "").trim();
  const amountRaw = String(formData.get("commission_amount_eur") || "").trim().replace(",", ".");
  if (!activationId) redirect(withMarketplaceStatus(currentUrl, "error", "Ticket commission introuvable."));

  const decisionStatus = decisionRaw === "approved" ? "approved" : "rejected";
  let requestedAmount: number | null = null;
  if (amountRaw) {
    const parsed = Number(amountRaw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      redirect(withMarketplaceStatus(withMarketplaceFocus(currentUrl, activationId), "error", "Montant commission invalide."));
    }
    requestedAmount = Math.round(parsed * 100) / 100;
  }

  const supabaseAdmin = createAdminClient();
  const { data: activation, error: activationError } = await supabaseAdmin
    .from("human_marketplace_landing_activations")
    .select(
      "id,referrer_id,referrer_name,partner_member_id,partner_name,metadata,place:human_marketplace_places(id,metier,city,partner_offer_value_eur)",
    )
    .eq("id", activationId)
    .maybeSingle();
  if (activationError || !activation) {
    redirect(withMarketplaceStatus(withMarketplaceFocus(currentUrl, activationId), "error", activationError?.message || "Activation introuvable."));
  }

  const metadata = asMetadata(activation.metadata);
  const scoutIdRaw = String(metadata.apporteur_scout_id || metadata.scout_id || "").trim();
  const referrerIdRaw = String(activation.referrer_id || "").trim();
  const memberIdFromMeta = String(metadata.apporteur_member_id || "").trim();
  const phoneFromMeta = String(metadata.apporteur_phone || "").trim();
  const nameFromMeta = String(metadata.apporteur_name || "").trim();
  const sourceFromMeta = String(metadata.apporteur_source || "").trim().toLowerCase();
  let apporteurType: "scout_public" | "member_pro" | "unknown" = "unknown";
  let apporteurScoutId: string | null = null;
  let apporteurMemberId: string | null = null;
  let apporteurName = nameFromMeta || String(activation.referrer_name || "").trim() || "Apporteur";
  let apporteurPhone = phoneFromMeta;

  if (looksLikeUuid(scoutIdRaw)) {
    const { data: scout } = await supabaseAdmin
      .from("human_scouts")
      .select("id,first_name,last_name,phone")
      .eq("id", scoutIdRaw)
      .maybeSingle();
    if (scout?.id) {
      apporteurType = "scout_public";
      apporteurScoutId = scout.id;
      const full = [String(scout.first_name || "").trim(), String(scout.last_name || "").trim()].filter(Boolean).join(" ").trim();
      apporteurName = full || apporteurName;
      apporteurPhone = String(scout.phone || "").trim();
    }
  }

  const memberLookupId = looksLikeUuid(memberIdFromMeta) ? memberIdFromMeta : referrerIdRaw;
  if (apporteurType === "unknown" && looksLikeUuid(memberLookupId)) {
    const { data: member } = await supabaseAdmin
      .from("human_members")
      .select("id,first_name,last_name,phone,metier")
      .eq("id", memberLookupId)
      .maybeSingle();
    if (member?.id) {
      apporteurType = "member_pro";
      apporteurMemberId = member.id;
      const full = [String(member.first_name || "").trim(), String(member.last_name || "").trim()].filter(Boolean).join(" ").trim();
      const metier = String(member.metier || "").trim();
      apporteurName = [full || apporteurName, metier || null].filter(Boolean).join(" · ");
      apporteurPhone = String(member.phone || "").trim();
    }
  }
  if (apporteurType === "unknown" && sourceFromMeta === "member_pro") {
    apporteurType = "member_pro";
  }
  if (apporteurType === "unknown" && sourceFromMeta === "scout_public") {
    apporteurType = "scout_public";
  }

  const proMemberId = String(activation.partner_member_id || "").trim() || null;
  let proName = String(activation.partner_name || "").trim() || "Pro";
  if (proMemberId) {
    const { data: member } = await supabaseAdmin
      .from("human_members")
      .select("id,first_name,last_name,metier")
      .eq("id", proMemberId)
      .maybeSingle();
    if (member?.id) {
      const full = [String(member.first_name || "").trim(), String(member.last_name || "").trim()].filter(Boolean).join(" ").trim();
      const metier = String(member.metier || "").trim();
      proName = [full || proName, metier || null].filter(Boolean).join(" · ");
    }
  }

  const configuredPartnerValue = Number((activation.place as { partner_offer_value_eur?: number | null } | null)?.partner_offer_value_eur || 0);
  const fallbackAmount = Number.isFinite(configuredPartnerValue) && configuredPartnerValue > 0 ? configuredPartnerValue : null;
  const commissionAmount = decisionStatus === "approved" ? requestedAmount ?? fallbackAmount : null;
  if (decisionStatus === "approved" && (commissionAmount === null || !Number.isFinite(commissionAmount))) {
    redirect(
      withMarketplaceStatus(
        withMarketplaceFocus(currentUrl, activationId),
        "error",
        "Montant commission manquant. Renseigne un montant ou configure l'offre pro.",
      ),
    );
  }

  const commissionRuleLabel =
    String(metadata.commission_rule_label || "").trim() ||
    (fallbackAmount ? `Règle pro (valeur configurée): ${fallbackAmount} EUR` : "Règle pro non renseignée");

  const placeId = String((activation.place as { id?: string | null } | null)?.id || "").trim() || null;
  let popeyFeeEur = 0;
  if (placeId) {
    const { data: placeRule } = await supabaseAdmin
      .from("human_marketplace_place_commission_rules")
      .select("popey_fee_eur")
      .eq("place_id", placeId)
      .maybeSingle();
    const parsedRule = Number(placeRule?.popey_fee_eur || 0);
    popeyFeeEur = Number.isFinite(parsedRule) && parsedRule >= 0 ? Math.round(parsedRule * 100) / 100 : 0;
  } else if (proMemberId) {
    const { data: popeyRule } = await supabaseAdmin
      .from("human_marketplace_pro_commission_rules")
      .select("popey_fee_eur")
      .eq("pro_member_id", proMemberId)
      .maybeSingle();
    const parsedRule = Number(popeyRule?.popey_fee_eur || 0);
    popeyFeeEur = Number.isFinite(parsedRule) && parsedRule >= 0 ? Math.round(parsedRule * 100) / 100 : 0;
  }

  const upsertPayload = {
    activation_id: activation.id,
    decision_status: decisionStatus,
    commission_amount_eur: commissionAmount,
    currency: "EUR",
    apporteur_type: apporteurType,
    apporteur_scout_id: apporteurScoutId,
    apporteur_member_id: apporteurMemberId,
    apporteur_name: apporteurName || null,
    apporteur_phone: apporteurPhone || null,
    pro_member_id: proMemberId,
    pro_name: proName || null,
    commission_rule_label: commissionRuleLabel,
    note: note || null,
    decided_by_user_id: auth.user.id,
    decided_at: new Date().toISOString(),
  };

  const { error: upsertError } = await supabaseAdmin
    .from("human_affiliate_commission_decisions")
    .upsert(upsertPayload, { onConflict: "activation_id" });
  let tableMissing = false;
  if (upsertError) {
    const raw = String(upsertError.message || "").toLowerCase();
    if (raw.includes("human_affiliate_commission_decisions")) {
      tableMissing = true;
    } else {
      redirect(
        withMarketplaceStatus(
          withMarketplaceFocus(currentUrl, activationId),
          "error",
          upsertError.message || "Impossible d'enregistrer la décision commission.",
        ),
      );
    }
  }

  const nextMeta = {
    ...metadata,
    commission_decision_status: decisionStatus,
    commission_amount_eur: commissionAmount,
    commission_popey_fee_eur: popeyFeeEur,
    commission_decided_at: new Date().toISOString(),
    commission_decided_by_user_id: auth.user.id,
    commission_apporteur_type: apporteurType,
    commission_apporteur_name: apporteurName || null,
  };
  await supabaseAdmin.from("human_marketplace_landing_activations").update({ metadata: nextMeta }).eq("id", activation.id);

  // Accounting ledger rows: one for apporteur and one for Popey fixed fee per pro.
  const ticketCode = String(metadata.ticket_code || "").trim() || `POPEY-${activation.id.slice(0, 6).toUpperCase()}`;
  const periodMonth = firstDayOfCurrentMonthIso();
  let ledgerTableMissing = false;
  if (decisionStatus === "approved") {
    const ledgerBase = {
      activation_id: activation.id,
      period_month: periodMonth,
      ticket_code: ticketCode,
      city: String((activation.place as { city?: string | null } | null)?.city || "").trim() || null,
      payer_member_id: proMemberId,
      decision_status: "approved",
      payment_status: "pending",
      note: note || null,
      metadata: {
        source: "admin_decision",
        commission_rule_label: commissionRuleLabel,
      },
    };
    const { error: apporteurLedgerError } = await supabaseAdmin
      .from("human_marketplace_commission_ledger")
      .upsert(
        {
          ...ledgerBase,
          row_kind: "apporteur",
          receiver_member_id: apporteurMemberId,
          receiver_scout_id: apporteurScoutId,
          receiver_name: apporteurName || null,
          amount_eur: commissionAmount || 0,
          currency: "EUR",
        },
        { onConflict: "activation_id,row_kind" },
      );
    if (apporteurLedgerError) {
      const raw = String(apporteurLedgerError.message || "").toLowerCase();
      if (raw.includes("human_marketplace_commission_ledger")) {
        ledgerTableMissing = true;
      } else {
        redirect(
          withMarketplaceStatus(
            withMarketplaceFocus(currentUrl, activationId),
            "error",
            apporteurLedgerError.message || "Impossible d'écrire la ligne commission apporteur.",
          ),
        );
      }
    }
    const { error: popeyLedgerError } = await supabaseAdmin
      .from("human_marketplace_commission_ledger")
      .upsert(
        {
          ...ledgerBase,
          row_kind: "popey",
          receiver_member_id: null,
          receiver_scout_id: null,
          receiver_name: "Popey",
          amount_eur: popeyFeeEur,
          currency: "EUR",
        },
        { onConflict: "activation_id,row_kind" },
      );
    if (popeyLedgerError) {
      const raw = String(popeyLedgerError.message || "").toLowerCase();
      if (raw.includes("human_marketplace_commission_ledger")) {
        ledgerTableMissing = true;
      } else {
        redirect(
          withMarketplaceStatus(
            withMarketplaceFocus(currentUrl, activationId),
            "error",
            popeyLedgerError.message || "Impossible d'écrire la ligne commission Popey.",
          ),
        );
      }
    }
  } else {
    const { error: cancelLedgerError } = await supabaseAdmin
      .from("human_marketplace_commission_ledger")
      .update({
        decision_status: "rejected",
        payment_status: "cancelled",
        note: note || null,
        updated_at: new Date().toISOString(),
      })
      .eq("activation_id", activation.id);
    if (cancelLedgerError) {
      const raw = String(cancelLedgerError.message || "").toLowerCase();
      if (raw.includes("human_marketplace_commission_ledger")) {
        ledgerTableMissing = true;
      } else {
        redirect(
          withMarketplaceStatus(
            withMarketplaceFocus(currentUrl, activationId),
            "error",
            cancelLedgerError.message || "Impossible de mettre à jour le ledger commission.",
          ),
        );
      }
    }
  }

  revalidatePath("/admin/humain/affiliation");
  revalidatePath("/admin/humain/marketplace");
  revalidatePath("/admin/humain/privileges");
  redirect(
    withMarketplaceStatus(
      withMarketplaceFocus(currentUrl, activationId),
      "success",
      tableMissing || ledgerTableMissing
        ? decisionStatus === "approved"
          ? "Commission validée (mode dégradé: migration SQL commission à exécuter)."
          : "Commission refusée (mode dégradé: migration SQL commission à exécuter)."
        : decisionStatus === "approved"
          ? "Commission validée (ticket mis à jour)."
          : "Commission refusée (ticket mis à jour).",
    ),
  );
}

export async function adminDeleteAffiliateTicketAction(formData: FormData): Promise<void> {
  const auth = await requireHumanAdmin();
  const currentUrl = String(formData.get("current_url") || "/admin/humain/affiliation");
  if ("error" in auth) redirect(withMarketplaceStatus(currentUrl, "error", auth.error || "Acces admin requis."));

  const activationId = String(formData.get("activation_id") || "").trim();
  const confirm = String(formData.get("confirm") || "").trim().toLowerCase();
  if (!activationId) redirect(withMarketplaceStatus(currentUrl, "error", "Ticket introuvable."));
  if (confirm !== "delete") redirect(withMarketplaceStatus(withMarketplaceFocus(currentUrl, activationId), "error", "Confirmation requise."));

  const supabaseAdmin = createAdminClient();

  await supabaseAdmin.from("human_affiliate_commission_decisions").delete().eq("activation_id", activationId);

  const { error: ledgerDeleteError } = await supabaseAdmin.from("human_marketplace_commission_ledger").delete().eq("activation_id", activationId);
  if (ledgerDeleteError && !String(ledgerDeleteError.message || "").toLowerCase().includes("human_marketplace_commission_ledger")) {
    redirect(
      withMarketplaceStatus(
        withMarketplaceFocus(currentUrl, activationId),
        "error",
        ledgerDeleteError.message || "Suppression ledger impossible.",
      ),
    );
  }

  await supabaseAdmin.from("human_scout_notification_log").delete().eq("payload_json->>activation_id", activationId);

  const { error: activationDeleteError } = await supabaseAdmin.from("human_marketplace_landing_activations").delete().eq("id", activationId);
  if (activationDeleteError) {
    redirect(
      withMarketplaceStatus(
        withMarketplaceFocus(currentUrl, activationId),
        "error",
        activationDeleteError.message || "Suppression ticket impossible.",
      ),
    );
  }

  revalidatePath("/admin/humain/affiliation");
  revalidatePath("/admin/humain/commissions");
  revalidatePath("/admin/humain/marketplace");
  revalidatePath("/admin/humain/privileges");
  redirect(withMarketplaceStatus(currentUrl, "success", "Ticket supprimé."));
}

export async function adminSendPrivilegeActivationFollowupNowAction(formData: FormData): Promise<void> {
  const auth = await requireHumanAdmin();
  const currentUrl = String(formData.get("current_url") || "/admin/humain/affiliation");
  if ("error" in auth) redirect(withMarketplaceStatus(currentUrl, "error", auth.error || "Acces admin requis."));

  const activationId = String(formData.get("activation_id") || "").trim();
  if (!activationId) redirect(withMarketplaceStatus(currentUrl, "error", "Activation introuvable."));

  const supabaseAdmin = createAdminClient();
  const { data: activation, error: activationError } = await supabaseAdmin
    .from("human_marketplace_landing_activations")
    .select("id,city,client_name,referrer_name,partner_name,partner_phone,partner_member_id,metadata")
    .eq("id", activationId)
    .maybeSingle();
  if (activationError || !activation) {
    redirect(withMarketplaceStatus(withMarketplaceFocus(currentUrl, activationId), "error", activationError?.message || "Activation introuvable."));
  }

  const partnerPhone = normalizePhone(String(activation.partner_phone || ""));
  const ownerMemberId = String(activation.partner_member_id || "").trim();
  if (!partnerPhone || !ownerMemberId) {
    redirect(withMarketplaceStatus(withMarketplaceFocus(currentUrl, activationId), "error", "Le pro n'a pas de téléphone WhatsApp exploitable."));
  }

  const metadata = asMetadata(activation.metadata);
  const ticketCode = String(metadata.ticket_code || "").trim() || `POPEY-${activation.id.slice(0, 6).toUpperCase()}`;
  const partnerName = String(activation.partner_name || "").trim() || "Partenaire";
  const referrerName = String(activation.referrer_name || "").trim() || "apporteur";
  const message =
    `Salut ${partnerName} ! Relance Popey pour le privilège #${ticketCode} (via ${referrerName}). ` +
    "La vente a-t-elle été conclue ? Réponds : OUI VALIDE ou NON EN COURS.";

  const send = await sendWhatsAppTextMessage(partnerPhone, message, {
    ownerMemberId,
    source: "marketplace_ticket_followup_manual_admin",
    metadata: {
      flow: "marketplace_ticket_followup_j1",
      trigger: "manual_admin",
      marketplace_activation_id: activation.id,
      ticket_code: ticketCode,
      city: String(activation.city || "").trim(),
      referrer_name: referrerName,
      client_name: String(activation.client_name || "").trim(),
    },
  });
  if (!send.success) {
    redirect(withMarketplaceStatus(withMarketplaceFocus(currentUrl, activationId), "error", send.error || "Envoi Twilio impossible."));
  }

  const nowIso = new Date().toISOString();
  const nextMetadata = {
    ...metadata,
    ticket_code: ticketCode,
    pro_followup_sent_at: nowIso,
    pro_followup_provider: "twilio",
    pro_followup_status: "sent",
    pro_followup_message_sid: send.sid || null,
    pro_followup_last_trigger: "manual_admin",
    pro_followup_last_triggered_by_user_id: auth.user.id,
    pro_followup_last_triggered_at: nowIso,
  };
  await supabaseAdmin
    .from("human_marketplace_landing_activations")
    .update({ metadata: nextMetadata })
    .eq("id", activation.id);

  await supabaseAdmin.from("human_marketplace_landing_events").insert({
    event_type: "pro_followup_sent",
    city: String(activation.city || "").trim() || null,
    category_key: null,
    place_id: null,
    client_id: null,
    referrer_id: null,
    partner_member_id: ownerMemberId,
    source: "marketplace_ticket_followup_manual_admin",
    metadata: {
      activation_id: activation.id,
      ticket_code: ticketCode,
      provider_message_sid: send.sid || null,
      trigger: "manual_admin",
    },
  });

  revalidatePath("/admin/humain/affiliation");
  revalidatePath("/admin/humain/privileges");
  redirect(withMarketplaceStatus(withMarketplaceFocus(currentUrl, activationId), "success", "Relance WhatsApp envoyée au pro."));
}
