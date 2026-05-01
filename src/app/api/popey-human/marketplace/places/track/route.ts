import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type TrackingPayload = {
  eventType?: "landing_view" | "category_view" | "search_used";
  city?: string;
  category?: string;
  placeId?: string;
  contextToken?: string;
  source?: string;
  metadata?: Record<string, unknown>;
};

function trim(value: unknown): string {
  return String(value || "").trim();
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const body = (await request.json().catch(() => null)) as TrackingPayload | null;
    const eventType = trim(body?.eventType);
    if (!["landing_view", "category_view", "search_used"].includes(eventType)) {
      return NextResponse.json({ error: "eventType invalide." }, { status: 400 });
    }

    const payload = {
      event_type: eventType,
      city: trim(body?.city || "Dax").slice(0, 120) || "Dax",
      category_key: trim(body?.category).toLowerCase().slice(0, 32) || null,
      place_id: trim(body?.placeId) || null,
      source: trim(body?.source || "whatsapp_landing").slice(0, 64) || "whatsapp_landing",
      metadata: {
        ...(body?.metadata || {}),
        context_token_present: Boolean(trim(body?.contextToken)),
        request_id: requestId,
      },
    };

    const supabase = createAdminClient();
    const { error } = await supabase.from("human_marketplace_landing_events").insert(payload);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[marketplace/track] unexpected", { requestId, error });
    return NextResponse.json({ error: "Tracking indisponible." }, { status: 500 });
  }
}
