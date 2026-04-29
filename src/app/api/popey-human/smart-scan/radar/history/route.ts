import { NextRequest, NextResponse } from "next/server";
import { getSmartScanRadarHistory } from "@/lib/actions/human-smart-scan";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!smartScanFeatureFlags.enabled) {
    return NextResponse.json({ error: "Smart Scan desactive." }, { status: 503 });
  }

  const limitRaw = Number(request.nextUrl.searchParams.get("limit") || 40);
  const filterRaw = String(request.nextUrl.searchParams.get("filter") || "all").trim().toLowerCase();
  const queryRaw = String(request.nextUrl.searchParams.get("q") || "").trim();
  const filter = filterRaw === "duplicates" || filterRaw === "sent" ? filterRaw : "all";
  const result = await getSmartScanRadarHistory({
    limit: Number.isFinite(limitRaw) ? limitRaw : 40,
    query: queryRaw,
    filter,
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
