import { NextRequest, NextResponse } from "next/server";
import { logSmartScanAnalyticsEvent } from "@/lib/actions/human-smart-scan";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    eventType?: "contact_opened" | "trust_level_set" | "whatsapp_sent" | "daily_goal_progressed";
    metadata?: Record<string, unknown>;
  };

  if (!body?.eventType) {
    return NextResponse.json({ error: "eventType requis." }, { status: 400 });
  }

  const result = await logSmartScanAnalyticsEvent({
    eventType: body.eventType,
    metadata: body.metadata || {},
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
