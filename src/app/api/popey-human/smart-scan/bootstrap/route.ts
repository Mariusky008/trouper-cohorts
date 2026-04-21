import { NextResponse } from "next/server";
import {
  getOrCreateTodaySession,
  getSmartScanConversionStats,
  listDueSmartScanFollowups,
  listHistoryActions,
  listMySmartScanContacts,
  listMySmartScanQualifications,
  listOpenSmartScanAlerts,
} from "@/lib/actions/human-smart-scan";

export const dynamic = "force-dynamic";

export async function GET() {
  const [sessionResult, contactsResult, qualificationsResult, historyResult, alertsResult, followupsResult, statsResult] = await Promise.all([
    getOrCreateTodaySession(),
    listMySmartScanContacts(800),
    listMySmartScanQualifications(800),
    listHistoryActions(200),
    listOpenSmartScanAlerts(80),
    listDueSmartScanFollowups(80),
    getSmartScanConversionStats(14),
  ]);

  if (sessionResult.error) {
    return NextResponse.json({ error: sessionResult.error }, { status: 401 });
  }
  if (contactsResult.error) {
    return NextResponse.json({ error: contactsResult.error }, { status: 400 });
  }
  if (qualificationsResult.error) {
    return NextResponse.json({ error: qualificationsResult.error }, { status: 400 });
  }
  if (historyResult.error) {
    return NextResponse.json({ error: historyResult.error }, { status: 400 });
  }
  if (alertsResult.error) {
    return NextResponse.json({ error: alertsResult.error }, { status: 400 });
  }
  if (followupsResult.error) {
    return NextResponse.json({ error: followupsResult.error }, { status: 400 });
  }
  if (statsResult.error) {
    return NextResponse.json({ error: statsResult.error }, { status: 400 });
  }

  return NextResponse.json({
    session: sessionResult.session,
    contacts: contactsResult.contacts,
    qualifications: qualificationsResult.qualifications,
    history: historyResult.actions,
    alerts: alertsResult.alerts,
    followups: followupsResult.followups,
    metrics: statsResult.stats,
  });
}
