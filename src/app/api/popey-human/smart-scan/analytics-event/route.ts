import { NextRequest, NextResponse } from "next/server";
import { logSmartScanAnalyticsEvent } from "@/lib/actions/human-smart-scan";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";
import { smartScanAnalyticsEventSchema } from "@/lib/popey-human/smart-scan-validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!smartScanFeatureFlags.enabled || !smartScanFeatureFlags.analyticsEnabled) {
    return NextResponse.json({ error: "Analytics Smart Scan desactive." }, { status: 503 });
  }

  const parsed = smartScanAnalyticsEventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload analytics invalide." }, { status: 400 });
  }
  const body = parsed.data;

  const result = await logSmartScanAnalyticsEvent({
    eventType: body.eventType,
    metadata: body.metadata || {},
    clientEventId: body.clientEventId || null,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
