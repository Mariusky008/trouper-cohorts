import { NextRequest, NextResponse } from "next/server";
import { claimAllianceInviteSignedUp } from "@/lib/actions/human-smart-scan";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!smartScanFeatureFlags.enabled) {
    return NextResponse.json({ error: "Smart Scan desactive." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  const token = String(body?.token || "").trim();
  if (!token) {
    return NextResponse.json({ error: "Token requis." }, { status: 400 });
  }

  const result = await claimAllianceInviteSignedUp(token);
  if ("error" in result) {
    const status = result.error === "Session requise." ? 401 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json(result);
}
