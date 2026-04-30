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
};

function toActionType(actionType: ActionPayload["actionType"]) {
  if (actionType === "vendre") return "sell_request";
  if (actionType === "rejoindre") return "join_request";
  return "buy_offer";
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

    const parsedAmount = Number(body?.offerAmountEur ?? 0);
    const offerAmountEur = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : null;

    const supabase = createAdminClient();

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
      metadata: {
        ui_action_type: actionType,
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
