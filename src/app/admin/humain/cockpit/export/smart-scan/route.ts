import { NextResponse } from "next/server";
import { getSmartScanAdminDailyAnalytics } from "@/lib/actions/human-smart-scan";
import { requireHumanAdminExport, toCsv } from "../_lib";

export async function GET(request: Request) {
  const admin = await requireHumanAdminExport();
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: 403 });

  const parsed = new URL(request.url);
  const rawDays = parsed.searchParams.get("days") || parsed.searchParams.get("smartScanDays") || "14";
  const days = Math.max(1, Math.min(90, Number(rawDays) || 14));

  const result = await getSmartScanAdminDailyAnalytics(days);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

  const rows = (result.daily as Array<Record<string, unknown>>) || [];
  const csv = toCsv(
    [
      "day",
      "actions_total",
      "actions_sent",
      "actions_validated_without_send",
      "qualifications_total",
      "outcomes_replied",
      "outcomes_converted",
      "outcomes_not_interested",
      "followup_copied",
      "followup_replied",
      "followup_converted",
      "followup_not_interested",
      "followup_ignored",
      "external_click_linkedin",
      "external_click_whatsapp_group",
      "analytics_contact_opened",
      "analytics_trust_level_set",
      "analytics_whatsapp_sent",
      "analytics_daily_goal_progressed",
    ],
    rows.map((row) => [
      String(row.day || ""),
      Number(row.actions_total || 0),
      Number(row.actions_sent || 0),
      Number(row.actions_validated_without_send || 0),
      Number(row.qualifications_total || 0),
      Number(row.outcomes_replied || 0),
      Number(row.outcomes_converted || 0),
      Number(row.outcomes_not_interested || 0),
      Number(row.followup_copied || 0),
      Number(row.followup_replied || 0),
      Number(row.followup_converted || 0),
      Number(row.followup_not_interested || 0),
      Number(row.followup_ignored || 0),
      Number(row.external_click_linkedin || 0),
      Number(row.external_click_whatsapp_group || 0),
      Number(row.analytics_contact_opened || 0),
      Number(row.analytics_trust_level_set || 0),
      Number(row.analytics_whatsapp_sent || 0),
      Number(row.analytics_daily_goal_progressed || 0),
    ])
  );

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="human-smart-scan-daily-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
