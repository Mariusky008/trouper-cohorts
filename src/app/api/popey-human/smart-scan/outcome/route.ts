import { NextRequest, NextResponse } from "next/server";
import { updateSmartScanActionOutcome } from "@/lib/actions/human-smart-scan";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    actionId?: string;
    outcomeStatus?: "pending" | "replied" | "converted" | "not_interested";
    outcomeNotes?: string | null;
  };

  if (!body?.actionId || !body?.outcomeStatus) {
    return NextResponse.json({ error: "actionId et outcomeStatus requis." }, { status: 400 });
  }

  const result = await updateSmartScanActionOutcome({
    actionId: body.actionId,
    outcomeStatus: body.outcomeStatus,
    outcomeNotes: body.outcomeNotes || null,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
