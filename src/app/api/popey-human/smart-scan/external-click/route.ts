import { NextRequest, NextResponse } from "next/server";
import { logSmartScanExternalClick } from "@/lib/actions/human-smart-scan";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";
import { smartScanExternalClickSchema } from "@/lib/popey-human/smart-scan-validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!smartScanFeatureFlags.enabled || !smartScanFeatureFlags.externalClickTrackingEnabled) {
    return NextResponse.json({ error: "Tracking externe desactive." }, { status: 503 });
  }

  const parsed = smartScanExternalClickSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload external-click invalide." }, { status: 400 });
  }
  const body = parsed.data;

  const result = await logSmartScanExternalClick({
    source: body.source,
    targetUrl: body.targetUrl,
    context: body.context || "cockpit",
    clientEventId: body.clientEventId || null,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
