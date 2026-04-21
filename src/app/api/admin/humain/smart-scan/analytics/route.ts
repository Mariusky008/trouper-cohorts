import { NextRequest, NextResponse } from "next/server";
import { getSmartScanAdminDailyAnalytics } from "@/lib/actions/human-smart-scan";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!smartScanFeatureFlags.enabled || !smartScanFeatureFlags.analyticsEnabled) {
    return NextResponse.json({ error: "Analytics Smart Scan desactive." }, { status: 503 });
  }

  const daysParam = request.nextUrl.searchParams.get("days");
  const parsedDays = Number(daysParam || "14");
  const days = Number.isFinite(parsedDays) ? parsedDays : 14;

  const result = await getSmartScanAdminDailyAnalytics(days);
  if (result.error === "Session requise.") {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }
  if (result.error === "Acces admin requis.") {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    days: result.days,
    daily: result.daily,
  });
}
