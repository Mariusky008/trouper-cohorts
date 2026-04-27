import { NextRequest, NextResponse } from "next/server";
import { createSmartScanRadarRun } from "@/lib/actions/human-smart-scan";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";
import { smartScanRadarRunSchema } from "@/lib/popey-human/smart-scan-validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!smartScanFeatureFlags.enabled) {
    return NextResponse.json({ error: "Smart Scan desactive." }, { status: 503 });
  }

  const parsed = smartScanRadarRunSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload run Radar invalide." }, { status: 400 });
  }
  const body = parsed.data;
  const result = await createSmartScanRadarRun({
    city: body.city,
    sourceMetier: body.sourceMetier || null,
    radiusKm: body.radiusKm,
    targetCount: body.targetCount,
    selectedCount: body.selectedCount,
    status: body.status,
    metadata: body.metadata || {},
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
