import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppTextMessage } from "@/lib/actions/whatsapp-twilio";
import { verifyMarketplaceLandingContext } from "@/lib/popey-human/marketplace-landing-token";

export const dynamic = "force-dynamic";

type ActivatePayload = {
  placeId?: string;
  contextToken?: string;
  source?: string;
  city?: string;
  category?: string;
  clientPhone?: string;
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

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const body = (await request.json().catch(() => null)) as ActivatePayload | null;
    const placeId = trim(body?.placeId);
    const contextToken = trim(body?.contextToken);
    const source = trim(body?.source || "whatsapp_landing").slice(0, 64) || "whatsapp_landing";
    const declaredCity = trim(body?.city).slice(0, 120);
    const declaredCategory = trim(body?.category).toLowerCase().slice(0, 32);
    const fallbackClientPhone = trim(body?.clientPhone);

    if (!placeId) {
      return NextResponse.json({ error: "Place manquante." }, { status: 400 });
    }
    if (!contextToken) {
      return NextResponse.json({ error: "Lien invalide (contexte manquant)." }, { status: 401 });
    }

    const verified = verifyMarketplaceLandingContext(contextToken);
    if (!verified.valid || !verified.payload) {
      return NextResponse.json({ error: "Lien invalide ou expiré.", reason: verified.reason || "invalid" }, { status: 401 });
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
    const resolvedClientPhone = verified.payload.client_phone || fallbackClientPhone || null;
    const leadPayload = {
      place_id: place.id,
      city: trim(place.city) || declaredCity || verified.payload.city,
      category_key: category,
      client_id: verified.payload.client_id,
      client_name: verified.payload.client_name,
      referrer_id: verified.payload.referrer_id,
      referrer_name: verified.payload.referrer_name,
      partner_member_id: ownerMemberId || null,
      partner_name: partnerName,
      partner_phone: partnerPhone || null,
      source,
      metadata: {
        metier: trim(place.metier),
        company_name: trim(place.company_name),
        request_id: requestId,
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
      client_id: verified.payload.client_id,
      referrer_id: verified.payload.referrer_id,
      partner_member_id: ownerMemberId || null,
      source,
      metadata: {
        activation_id: activationId,
        request_id: requestId,
      },
    };
    const { error: trackingError } = await supabase.from("human_marketplace_landing_events").insert(activationEvent);
    if (trackingError) {
      console.warn("[marketplace/activate] tracking insert failed", {
        requestId,
        error: trackingError.message,
      });
    }

    let twilioResult: { success: boolean; error?: string } = { success: false, error: "missing_partner_phone" };
    if (partnerPhone) {
      const message = `Salut ! Un prospect de la part de ${verified.payload.referrer_name} vient de choisir ton offre (${trim(place.metier)}). Client: ${verified.payload.client_name}.`;
      const twilioSend = await sendWhatsAppTextMessage(partnerPhone, message, {
        ownerMemberId: ownerMemberId || null,
        source: "marketplace_landing_activation",
        metadata: {
          place_id: place.id,
          activation_id: activationId,
          client_id: verified.payload.client_id,
          referrer_id: verified.payload.referrer_id,
          category,
        },
      });
      twilioResult = twilioSend.success ? { success: true } : { success: false, error: twilioSend.error };
    }

    let clientConfirmationSent = false;
    if (resolvedClientPhone) {
      const clientConfirmation = await sendWhatsAppTextMessage(
        resolvedClientPhone,
        `Bien reçu ! ${partnerName} vous rappelle demain. Merci pour votre confiance.`,
        {
          ownerMemberId: ownerMemberId || null,
          source: "marketplace_landing_client_confirmation",
          metadata: {
            place_id: place.id,
            activation_id: activationId,
            city: leadPayload.city,
          },
        },
      );
      clientConfirmationSent = Boolean(clientConfirmation.success);
    }

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
      message: `C'est envoyé ! ${partnerName} va vous contacter.`,
      cityWeeklyActivations,
      clientConfirmationSent,
      referrerName: verified.payload.referrer_name,
      clientName: verified.payload.client_name,
      twilio: twilioResult,
    });
  } catch (error) {
    console.error("[marketplace/activate] unexpected", { requestId, error });
    return NextResponse.json({ error: "Activation impossible pour le moment." }, { status: 500 });
  }
}
