import { NextRequest, NextResponse } from "next/server";
import { updateSmartScanFollowupJob } from "@/lib/actions/human-smart-scan";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    actionId?: string;
    decision?: "copied" | "replied" | "converted" | "not_interested" | "ignored";
    note?: string | null;
  };

  if (!body?.actionId || !body?.decision) {
    return NextResponse.json({ error: "actionId et decision requis." }, { status: 400 });
  }

  const result = await updateSmartScanFollowupJob({
    actionId: body.actionId,
    decision: body.decision,
    note: body.note || null,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
