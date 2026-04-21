import { NextRequest, NextResponse } from "next/server";
import { updateSmartScanFollowupJob } from "@/lib/actions/human-smart-scan";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";
import { smartScanFollowupJobSchema } from "@/lib/popey-human/smart-scan-validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!smartScanFeatureFlags.enabled) {
    return NextResponse.json({ error: "Smart Scan desactive." }, { status: 503 });
  }

  const parsed = smartScanFollowupJobSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload follow-up invalide." }, { status: 400 });
  }
  const body = parsed.data;

  const result = await updateSmartScanFollowupJob({
    actionId: body.actionId,
    decision: body.decision,
    note: body.note || null,
    clientEventId: body.clientEventId || null,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
