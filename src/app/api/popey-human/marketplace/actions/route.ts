import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ActionPayload = {
  actionType?: "acheter" | "vendre" | "rejoindre";
  placeId?: string;
  fullName?: string;
  metier?: string;
  city?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  message?: string;
  offerAmountEur?: number | string | null;
  source?: string;
  referralCode?: string;
  referralLabel?: string;
  selectedPlan?: string;
};

function toActionType(actionType: ActionPayload["actionType"]) {
  if (actionType === "vendre") return "sell_request";
  if (actionType === "rejoindre") return "join_request";
  return "buy_offer";
}

function getRequestIp(request: NextRequest): string {
  const fromForwarded = String(request.headers.get("x-forwarded-for") || "").split(",")[0]?.trim();
  const fromRealIp = String(request.headers.get("x-real-ip") || "").trim();
  return fromForwarded || fromRealIp || "unknown";
}

async function enforceRateLimit(supabase: ReturnType<typeof createAdminClient>, requesterIp: string) {
  if (!requesterIp || requesterIp === "unknown") return null;
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [hourWindow, dayWindow] = await Promise.all([
    supabase
      .from("human_marketplace_offers")
      .select("id", { count: "exact", head: true })
      .eq("requester_ip", requesterIp)
      .gte("submitted_at", oneHourAgo),
    supabase
      .from("human_marketplace_offers")
      .select("id", { count: "exact", head: true })
      .eq("requester_ip", requesterIp)
      .gte("submitted_at", oneDayAgo),
  ]);

  if ((hourWindow.count || 0) >= 6) {
    return "Trop de demandes en 1h. Reessayez un peu plus tard.";
  }
  if ((dayWindow.count || 0) >= 20) {
    return "Limite quotidienne atteinte. Reessayez demain.";
  }
  return null;
}

async function notifyAdmins(
  supabase: ReturnType<typeof createAdminClient>,
  input: { actionType: "acheter" | "vendre" | "rejoindre"; fullName: string; city: string; metier: string; offerId: string | null },
) {
  const { data: admins } = await supabase.from("admins").select("user_id");
  const adminUserIds = Array.from(new Set(((admins as Array<{ user_id: string }> | null) || []).map((row) => row.user_id)));
  if (adminUserIds.length === 0) return;

  const { data: members } = await supabase.from("human_members").select("id,user_id").in("user_id", adminUserIds);
  const adminMembers = ((members as Array<{ id: string; user_id: string }> | null) || []).filter((row) => Boolean(row.id));
  if (adminMembers.length === 0) return;

  const actionLabel =
    input.actionType === "rejoindre" ? "reservation de place" : input.actionType === "vendre" ? "mise en vente" : "offre d achat";
  const title = `Marketplace: nouvelle ${actionLabel}`;
  const message = `${input.fullName} · ${input.metier || "metier n/r"} · ${input.city || "ville n/r"}`;

  await supabase.from("human_notifications").insert(
    adminMembers.map((member) => ({
      member_id: member.id,
      type: "generale",
      title,
      message,
      impact: input.offerId ? `offer:${input.offerId}` : null,
    })),
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as ActionPayload | null;
    const actionType = body?.actionType;
    const fullName = String(body?.fullName || "").trim();

    if (!actionType || !["acheter", "vendre", "rejoindre"].includes(actionType)) {
      return NextResponse.json({ error: "Action invalide." }, { status: 400 });
    }
    if (!fullName) {
      return NextResponse.json({ error: "Nom complet requis." }, { status: 400 });
    }

    const metier = String(body?.metier || "").trim();
    const city = String(body?.city || "").trim();
    const phone = String(body?.phone || "").trim();
    const whatsapp = String(body?.whatsapp || "").trim();
    const website = String(body?.website || "").trim();
    const message = String(body?.message || "").trim();
    const placeId = String(body?.placeId || "").trim() || null;
    const source = String(body?.source || "").trim().slice(0, 80);
    const referralCode = String(body?.referralCode || "").trim().slice(0, 120);
    const referralLabel = String(body?.referralLabel || "").trim().slice(0, 160);
    const selectedPlan = String(body?.selectedPlan || "").trim().slice(0, 80);

    const parsedAmount = Number(body?.offerAmountEur ?? 0);
    const offerAmountEur = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : null;

    const supabase = createAdminClient();
    const requesterIp = getRequestIp(request);
    const requesterUserAgent = String(request.headers.get("user-agent") || "").slice(0, 500);
    const rateLimitError = await enforceRateLimit(supabase, requesterIp);
    if (rateLimitError) {
      return NextResponse.json({ error: rateLimitError }, { status: 429 });
    }

    const offerRecord = {
      place_id: placeId,
      action_type: toActionType(actionType),
      full_name: fullName,
      metier: metier || null,
      city: city || null,
      phone: phone || null,
      whatsapp: whatsapp || null,
      website: website || null,
      message: message || null,
      offer_amount_eur: offerAmountEur,
      status: "pending",
      source: "landing",
      requester_ip: requesterIp,
      requester_user_agent: requesterUserAgent || null,
      metadata: {
        ui_action_type: actionType,
        source: source || "marketplace_landing",
        referral_code: referralCode || null,
        referral_label: referralLabel || null,
        selected_plan: selectedPlan || null,
      },
    };

    const { data: insertedOffer, error: offerError } = await supabase
      .from("human_marketplace_offers")
      .insert(offerRecord)
      .select("id")
      .single();
    if (offerError) {
      return NextResponse.json({ error: offerError.message }, { status: 500 });
    }

    if (placeId) {
      if (actionType === "rejoindre") {
        await supabase
          .from("human_marketplace_places")
          .update({ status: "reserved" })
          .eq("id", placeId)
          .eq("status", "dispo");
      }

      if (actionType === "vendre") {
        const patch: Record<string, unknown> = { status: "sale" };
        if (offerAmountEur) patch.list_price_eur = offerAmountEur;
        await supabase.from("human_marketplace_places").update(patch).eq("id", placeId);
      }
    }

    await supabase.from("human_marketplace_events").insert({
      place_id: placeId,
      offer_id: insertedOffer?.id || null,
      event_type:
        actionType === "rejoindre" ? "join_requested" : actionType === "vendre" ? "sell_requested" : "offer_submitted",
      payload: {
        full_name: fullName,
        city,
        metier,
      },
    });

    await notifyAdmins(supabase, {
      actionType,
      fullName,
      city,
      metier,
      offerId: insertedOffer?.id || null,
    });

    return NextResponse.json({
      success: true,
      offerId: insertedOffer?.id || null,
      message:
        actionType === "rejoindre"
          ? "Demande de reservation envoyee a l equipe Popey."
          : actionType === "vendre"
            ? "Demande de mise en vente envoyee a l equipe Popey."
            : "Offre envoyee a l equipe Popey.",
    });
  } catch (error) {
    console.error("[marketplace/actions] unexpected", error);
    return NextResponse.json({ error: "Envoi impossible pour le moment." }, { status: 500 });
  }
}
