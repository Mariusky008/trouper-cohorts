import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyMarketplaceLandingContext } from "@/lib/popey-human/marketplace-landing-token";
import { getScoutPortalByToken } from "@/lib/actions/human-scouts";

export const dynamic = "force-dynamic";

type ActivatePayload = {
  placeId?: string;
  contextToken?: string;
  source?: string;
  city?: string;
  category?: string;
  clientPhone?: string;
  clientMessage?: string;
  clientName?: string;
  referrerName?: string;
  referrerId?: string;
  referralCode?: string;
  scoutToken?: string;
};

function trim(value: unknown): string {
  return String(value || "").trim();
}

function buildPartnerDisplayName(input: {
  firstName?: string | null;
  lastName?: string | null;
  metier?: string | null;
  companyName?: string | null;
}): string {
  const fullName = [trim(input.firstName), trim(input.lastName)].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;
  if (trim(input.companyName)) return trim(input.companyName);
  if (trim(input.metier)) return trim(input.metier);
  return "Un partenaire Popey";
}

function inferCategoryFromSphere(sphere: string): string {
  const value = trim(sphere).toLowerCase();
  if (value === "habitat") return "maison";
  if (value === "sante") return "sante";
  if (value === "mariage") return "services";
  if (value === "finance") return "services";
  if (value === "digital") return "services";
  return "services";
}

function toWhatsAppDigits(raw: string): string {
  let digits = trim(raw).replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }
  // French local format fallback (06/07...) -> E.164 without "+"
  if (digits.length === 10 && digits.startsWith("0")) {
    digits = `33${digits.slice(1)}`;
  }
  if (digits.length < 8 || digits.length > 15) return "";
  return digits;
}

function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trim(value));
}

function normalizePersonName(value: string): string {
  return trim(value)
    .split("·")[0]
    .replace(/\s*\(.*?\)\s*/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getAdminWhatsappDigits(): string {
  const envPhone =
    trim(process.env.MARKETPLACE_ADMIN_WHATSAPP_PHONE) ||
    trim(process.env.POPEY_ADMIN_WHATSAPP_PHONE) ||
    "33768233347";
  return toWhatsAppDigits(envPhone);
}

function makeCommissionTicketCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `POPEY-${suffix}`;
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const body = (await request.json().catch(() => null)) as ActivatePayload | null;
    const placeId = trim(body?.placeId);
    const contextToken = trim(body?.contextToken);
    const source = trim(body?.source || "whatsapp_landing").slice(0, 64) || "whatsapp_landing";
    const declaredCity = trim(body?.city).slice(0, 120);
    const declaredCategory = trim(body?.category).toLowerCase().slice(0, 32);
    const fallbackClientName = trim(body?.clientName) || "Client";
    const fallbackClientPhone = trim(body?.clientPhone);
    const fallbackClientMessage = trim(body?.clientMessage).slice(0, 500);
    const fallbackReferrerName = trim(body?.referrerName);
    const fallbackReferrerId = trim(body?.referrerId);
    const fallbackReferralCode = trim(body?.referralCode);
    const fallbackScoutToken = trim(body?.scoutToken).toLowerCase();

    if (!placeId) {
      return NextResponse.json({ error: "Place manquante." }, { status: 400 });
    }
    const verified = contextToken ? verifyMarketplaceLandingContext(contextToken) : { valid: false as const };
    const hasVerifiedContext = Boolean(verified.valid && "payload" in verified && verified.payload);
    if (!hasVerifiedContext && !fallbackReferrerName) {
      return NextResponse.json({ error: "Lien invalide. Referrer manquant." }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: place, error: placeError } = await supabase
      .from("human_marketplace_places")
      .select("id,city,sphere_key,metier,company_name,owner_member_id,partner_phone,partner_whatsapp")
      .eq("id", placeId)
      .maybeSingle();

    if (placeError || !place) {
      return NextResponse.json({ error: "Privilège introuvable." }, { status: 404 });
    }

    const ownerMemberId = trim(place.owner_member_id);
    let memberInfo: { first_name: string | null; last_name: string | null; phone: string | null } | null = null;
    if (ownerMemberId) {
      const { data: member } = await supabase
        .from("human_members")
        .select("first_name,last_name,phone")
        .eq("id", ownerMemberId)
        .maybeSingle();
      memberInfo = member || null;
    }

    const partnerPhone = trim(place.partner_whatsapp) || trim(place.partner_phone) || trim(memberInfo?.phone);
    const partnerName = buildPartnerDisplayName({
      firstName: memberInfo?.first_name,
      lastName: memberInfo?.last_name,
      metier: place.metier,
      companyName: place.company_name,
    });

    const category = declaredCategory || inferCategoryFromSphere(trim(place.sphere_key));
    const clientId =
      hasVerifiedContext && "payload" in verified && verified.payload
        ? verified.payload.client_id
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const resolvedClientName = hasVerifiedContext && "payload" in verified && verified.payload ? verified.payload.client_name : fallbackClientName;
    const resolvedClientPhone =
      (hasVerifiedContext && "payload" in verified && verified.payload ? trim((verified.payload as Record<string, unknown>).client_phone) : "") ||
      fallbackClientPhone;
    let resolvedReferrerName =
      hasVerifiedContext && "payload" in verified && verified.payload ? verified.payload.referrer_name : fallbackReferrerName;
    const rawResolvedReferrerId =
      hasVerifiedContext && "payload" in verified && verified.payload ? verified.payload.referrer_id : fallbackReferrerId || fallbackReferralCode || "referral";
    let resolvedReferrerId = rawResolvedReferrerId;
    let resolvedScoutId: string | null = null;
    let resolvedScoutName = "";
    let resolvedScoutPhone = "";
    let resolvedMemberId: string | null = null;
    let resolvedMemberPhone = "";
    let resolvedApporteurSource: "scout_public" | "member_pro" | "unknown" = "unknown";
    if (fallbackScoutToken) {
      const portal = await getScoutPortalByToken(fallbackScoutToken);
      if (!portal.error && portal.scout?.id) {
        resolvedScoutId = portal.scout.id;
        const scoutFullName = [trim(portal.scout.first_name), trim(portal.scout.last_name)].filter(Boolean).join(" ").trim();
        resolvedScoutName = scoutFullName || trim(resolvedReferrerName);
        resolvedScoutPhone = trim(portal.scout.phone);
        resolvedApporteurSource = "scout_public";
      }
    }

    if (looksLikeUuid(resolvedReferrerId)) {
      const { data: member } = await supabase
        .from("human_members")
        .select("id,first_name,last_name,phone")
        .eq("id", resolvedReferrerId)
        .maybeSingle();
      if (member?.id) {
        resolvedMemberId = member.id;
        const memberFullName = [trim(member.first_name), trim(member.last_name)].filter(Boolean).join(" ").trim();
        resolvedReferrerName = memberFullName || resolvedReferrerName;
        resolvedMemberPhone = trim(member.phone);
        if (resolvedApporteurSource === "unknown") {
          resolvedApporteurSource = "member_pro";
        }
      }
    }

    if (!resolvedMemberId && resolvedApporteurSource === "unknown") {
      const targetName = normalizePersonName(resolvedReferrerName);
      const firstToken = targetName.split(" ").filter(Boolean)[0] || "";
      if (firstToken.length >= 2) {
        const { data: membersByName } = await supabase
          .from("human_members")
          .select("id,first_name,last_name,phone")
          .or(`first_name.ilike.%${firstToken}%,last_name.ilike.%${firstToken}%`)
          .limit(40);
        const candidates = (membersByName as Array<{ id: string; first_name: string | null; last_name: string | null; phone: string | null }> | null) || [];
        const matched =
          candidates.find((item) => normalizePersonName([trim(item.first_name), trim(item.last_name)].filter(Boolean).join(" ")) === targetName) ||
          candidates[0];
        if (matched?.id) {
          resolvedMemberId = matched.id;
          const fullName = [trim(matched.first_name), trim(matched.last_name)].filter(Boolean).join(" ").trim();
          resolvedReferrerId = matched.id;
          resolvedReferrerName = fullName || resolvedReferrerName;
          resolvedMemberPhone = trim(matched.phone);
          resolvedApporteurSource = "member_pro";
        }
      }
    }
    const apporteurName =
      resolvedApporteurSource === "scout_public"
        ? resolvedScoutName || resolvedReferrerName
        : resolvedReferrerName;
    const apporteurPhone =
      resolvedApporteurSource === "scout_public"
        ? resolvedScoutPhone || resolvedMemberPhone
        : resolvedMemberPhone || resolvedScoutPhone;
    const ticketCode = makeCommissionTicketCode();
    const leadPayload = {
      place_id: place.id,
      city: trim(place.city) || declaredCity || (hasVerifiedContext && "payload" in verified && verified.payload ? verified.payload.city : declaredCity || "Dax"),
      category_key: category,
      client_id: clientId,
      client_name: resolvedClientName,
      referrer_id: resolvedReferrerId,
      referrer_name: resolvedReferrerName,
      partner_member_id: ownerMemberId || null,
      partner_name: partnerName,
      partner_phone: partnerPhone || null,
      source,
      metadata: {
        metier: trim(place.metier),
        company_name: trim(place.company_name),
        client_phone: resolvedClientPhone || null,
        client_message: fallbackClientMessage || null,
        request_id: requestId,
        referral_code: fallbackReferralCode || null,
        scout_token: fallbackScoutToken || null,
        scout_id: resolvedScoutId || null,
        apporteur_source: resolvedApporteurSource,
        apporteur_scout_id: resolvedScoutId || null,
        apporteur_member_id: resolvedMemberId || null,
        apporteur_name: apporteurName || resolvedReferrerName || null,
        apporteur_phone: apporteurPhone || null,
        referrer_id_original: rawResolvedReferrerId || null,
        ticket_code: ticketCode,
        workflow_status: "pending",
        ticket_status: "pending",
        ticket_created_at: new Date().toISOString(),
      },
    };

    let activationId: string | null = null;
    const { data: insertedActivation, error: activationError } = await supabase
      .from("human_marketplace_landing_activations")
      .insert(leadPayload)
      .select("id")
      .maybeSingle();
    if (activationError) {
      console.warn("[marketplace/activate] activation insert failed", {
        requestId,
        error: activationError.message,
      });
    } else {
      activationId = trim(insertedActivation?.id) || null;
    }

    const activationEvent = {
      event_type: "activate_click",
      city: leadPayload.city,
      category_key: category,
      place_id: place.id,
      client_id: leadPayload.client_id,
      referrer_id: leadPayload.referrer_id,
      partner_member_id: ownerMemberId || null,
      source,
      metadata: {
        activation_id: activationId,
        request_id: requestId,
        referral_code: fallbackReferralCode || null,
        ticket_code: ticketCode,
      },
    };
    const { error: trackingError } = await supabase.from("human_marketplace_landing_events").insert(activationEvent);
    if (trackingError) {
      console.warn("[marketplace/activate] tracking insert failed", {
        requestId,
        error: trackingError.message,
      });
    }

    const trackingId = activationId || requestId;
    const adminWaPhone = getAdminWhatsappDigits();
    const rawMessage = [
      `NOUVEAU LEAD CATALOGUE POPEY`,
      `ID: ${ticketCode}`,
      `Client: ${leadPayload.client_name}`,
      resolvedClientPhone ? `Tel client: ${resolvedClientPhone}` : null,
      fallbackClientMessage ? `Message client: ${fallbackClientMessage}` : null,
      `Referrer: ${leadPayload.referrer_name}`,
      `Pro cible: ${partnerName} (${trim(place.metier) || "metier non precise"})`,
      `Ville: ${leadPayload.city}`,
      `Source: ${source}`,
      ``,
      `Action demandee: qualification + dispatch manuel (tour de controle).`,
      `Tracking: ${trackingId}`,
    ].join("\n");
    const whatsappUrl = adminWaPhone
      ? `https://api.whatsapp.com/send?phone=${adminWaPhone}&text=${encodeURIComponent(rawMessage)}`
      : null;

    let cityWeeklyActivations = 0;
    const weekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: weeklyCount } = await supabase
      .from("human_marketplace_landing_activations")
      .select("id", { count: "exact", head: true })
      .eq("city", leadPayload.city)
      .gte("activated_at", weekAgoIso);
    cityWeeklyActivations = Number(weeklyCount || 0);

    return NextResponse.json({
      success: true,
      partnerName,
      partnerPhone: partnerPhone || null,
      activationId,
      message: whatsappUrl
        ? `Ouverture WhatsApp pre-rempli vers le numero admin (tour de controle).`
        : `Activation enregistree (numero admin WhatsApp non configure).`,
      cityWeeklyActivations,
      clientConfirmationSent: false,
      referrerName: leadPayload.referrer_name,
      clientName: leadPayload.client_name,
      clientPhone: resolvedClientPhone || null,
      whatsappUrl,
      whatsappMessage: rawMessage,
      trackingId,
      ticketCode,
      routingMode: "admin_first",
    });
  } catch (error) {
    console.error("[marketplace/activate] unexpected", { requestId, error });
    return NextResponse.json({ error: "Activation impossible pour le moment." }, { status: 500 });
  }
}
