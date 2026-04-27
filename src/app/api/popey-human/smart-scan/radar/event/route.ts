import { NextRequest, NextResponse } from "next/server";
import { logSmartScanRadarEvent } from "@/lib/actions/human-smart-scan";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";
import { smartScanRadarEventSchema } from "@/lib/popey-human/smart-scan-validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!smartScanFeatureFlags.enabled) {
    return NextResponse.json({ error: "Smart Scan desactive." }, { status: 503 });
  }

  const parsed = smartScanRadarEventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload event Radar invalide." }, { status: 400 });
  }
  const body = parsed.data;
  const result = await logSmartScanRadarEvent({
    runId: body.runId,
    eventType: body.eventType,
    prospectId: body.prospectId || null,
    metadata: body.metadata || {},
    clientEventId: body.clientEventId || null,
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
