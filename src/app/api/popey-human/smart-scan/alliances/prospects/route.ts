import { NextRequest, NextResponse } from "next/server";
import { listAllianceProspects } from "@/lib/actions/human-smart-scan";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!smartScanFeatureFlags.enabled) {
    return NextResponse.json({ error: "Smart Scan desactive." }, { status: 503 });
  }

  const providerParam = String(request.nextUrl.searchParams.get("provider") || "").trim();
  const provider = providerParam === "internal" ? "internal" : providerParam === "b2b" ? "b2b" : undefined;
  const result = await listAllianceProspects(120, provider);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ prospects: result.prospects });
}
