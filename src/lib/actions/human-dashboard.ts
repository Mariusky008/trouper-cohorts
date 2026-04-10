"use server";

import { getMyCashSummary } from "@/lib/actions/human-cash";
import { getMyHumanNotifications } from "@/lib/actions/human-notifications";
import { getMyHumanProfile } from "@/lib/actions/human-permissions";
import { listVisibleHumanLeads } from "@/lib/actions/human-leads";
import { listVisibleHumanSignals } from "@/lib/actions/human-signals";

export async function getMyHumanDashboard() {
  const [profileResult, leadsResult, signalsResult, cashResult, notificationsResult] = await Promise.all([
    getMyHumanProfile(),
    listVisibleHumanLeads(),
    listVisibleHumanSignals(),
    getMyCashSummary(),
    getMyHumanNotifications(),
  ]);

  if (profileResult.error || !profileResult.profile) {
    return {
      error: profileResult.error || "Profil indisponible.",
      profile: null as null | { first_name: string | null; last_name: string | null },
      kpis: {
        leadsOpen: 0,
        leadsTakenByMe: 0,
        signalsOpen: 0,
        signalsAvgScore: 0,
        cashIn: 0,
        cashOut: 0,
        cashNet: 0,
        unreadNotifications: 0,
      },
    };
  }

  const myMemberId = profileResult.profile.id;
  const leads = leadsResult.error ? [] : leadsResult.leads;
  const signals = signalsResult.error ? [] : signalsResult.signals;
  const cash = cashResult.error ? { in: 0, out: 0, net: 0 } : cashResult.totals;
  const notifications = notificationsResult.error ? [] : notificationsResult.notifications;

  const leadsOpen = leads.filter((lead) => lead.status === "nouveau").length;
  const leadsTakenByMe = leads.filter((lead) => lead.owner_member_id === myMemberId).length;
  const signalsOpen = signals.filter((signal) => signal.status !== "closed").length;
  const signalsAvgScore =
    signals.length > 0
      ? Math.round(signals.reduce((sum, signal) => sum + signal.score, 0) / signals.length)
      : 0;
  const unreadNotifications = notifications.filter((notification) => !notification.is_read).length;

  return {
    error: null as string | null,
    profile: profileResult.profile,
    kpis: {
      leadsOpen,
      leadsTakenByMe,
      signalsOpen,
      signalsAvgScore,
      cashIn: cash.in,
      cashOut: cash.out,
      cashNet: cash.net,
      unreadNotifications,
    },
  };
}
