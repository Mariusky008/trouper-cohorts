import { NextRequest, NextResponse } from "next/server";
import { getScoutPortalByToken } from "@/lib/actions/human-scouts";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ALLOWED_EVENT_TYPES = new Set([
  "mode_entered",
  "contacts_imported",
  "mass_share_clicked",
  "fallback_copy_clicked",
]);

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | {
        tokenOrCode?: string;
        eventType?: string;
        payload?: Record<string, unknown>;
      }
    | null;

  const tokenOrCode = String(body?.tokenOrCode || "").trim();
  const eventType = String(body?.eventType || "").trim();
  const payload = body?.payload && typeof body.payload === "object" ? body.payload : {};

  if (!tokenOrCode || !eventType) {
    return NextResponse.json({ error: "tokenOrCode et eventType sont requis." }, { status: 400 });
  }
  if (!ALLOWED_EVENT_TYPES.has(eventType)) {
    return NextResponse.json({ error: "eventType non autorisé." }, { status: 400 });
  }

  const portal = await getScoutPortalByToken(tokenOrCode);
  if (portal.error || !portal.scout?.id) {
    return NextResponse.json({ error: portal.error || "Scout introuvable." }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();
  await supabaseAdmin.from("human_scout_notification_log").insert({
    scout_id: portal.scout.id,
    event_type: `public_apporteur_${eventType}`,
    payload_json: {
      mode: "public_apporteur",
      ...payload,
    },
    status: "sent",
  });

  return NextResponse.json({ success: true });
}
