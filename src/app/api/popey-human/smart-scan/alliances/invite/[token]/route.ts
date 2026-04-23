import { NextResponse } from "next/server";
import { getAllianceInvitePortalByToken } from "@/lib/actions/human-smart-scan";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";

export const dynamic = "force-dynamic";

export async function GET(_: Request, context: { params: Promise<{ token: string }> }) {
  if (!smartScanFeatureFlags.enabled) {
    return NextResponse.json({ error: "Smart Scan desactive." }, { status: 503 });
  }

  const { token } = await context.params;
  const result = await getAllianceInvitePortalByToken(token);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json({ invite: result.invite });
}
