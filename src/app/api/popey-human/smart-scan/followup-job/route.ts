import { NextRequest, NextResponse } from "next/server";
import { updateSmartScanFollowupJob } from "@/lib/actions/human-smart-scan";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    actionId?: string;
    status?: "processed" | "cancelled";
  };

  if (!body?.actionId || !body?.status) {
    return NextResponse.json({ error: "actionId et status requis." }, { status: 400 });
  }

  const result = await updateSmartScanFollowupJob({
    actionId: body.actionId,
    status: body.status,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
