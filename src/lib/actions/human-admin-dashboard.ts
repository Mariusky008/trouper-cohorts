"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type MemberRow = {
  id: string;
  user_id: string;
  status: "active" | "paused" | "archived";
  first_name: string | null;
  last_name: string | null;
};

type LeadRow = {
  id: string;
  owner_member_id: string | null;
  status: "nouveau" | "pris" | "signe" | "perdu";
  budget: number | null;
  created_at: string;
};

type SignalRow = {
  id: string;
  emitter_member_id: string;
  status: "open" | "in_progress" | "closed";
  signal_strength: number;
  created_at: string;
};

type CashRow = {
  id: string;
  member_id: string;
  kind: "encaissement" | "decaissement";
  amount: number;
  event_date: string;
};

type NotificationRow = {
  id: string;
  member_id: string;
  is_read: boolean;
  created_at: string;
};

type DashboardPeriod = {
  startDate?: string;
  endDate?: string;
};

export async function getAdminHumanDashboard(period?: DashboardPeriod) {
  const auth = await requireAdminUser();
  if ("error" in auth) {
    return {
      error: auth.error,
      kpis: null as null | Record<string, number>,
      topMembersByLeads: [] as Array<{ label: string; value: number }>,
      topMembersBySignals: [] as Array<{ label: string; value: number }>,
    };
  }

  const supabaseAdmin = createAdminClient();

  const [{ data: membersData }, { data: leadsData }, { data: signalsData }, { data: cashData }, { data: notificationsData }] =
    await Promise.all([
      supabaseAdmin.from("human_members").select("id,user_id,status,first_name,last_name"),
      supabaseAdmin.from("human_leads").select("id,owner_member_id,status,budget,created_at"),
      supabaseAdmin.from("human_signals").select("id,emitter_member_id,status,signal_strength,created_at"),
      supabaseAdmin.from("human_cash_events").select("id,member_id,kind,amount,event_date"),
      supabaseAdmin.from("human_notifications").select("id,member_id,is_read,created_at"),
    ]);

  const members = (membersData as MemberRow[] | null) || [];
  const start = normalizeDate(period?.startDate);
  const end = normalizeDate(period?.endDate);

  const leads = ((leadsData as LeadRow[] | null) || []).filter((row) => inRange(row.created_at, start, end));
  const signals = ((signalsData as SignalRow[] | null) || []).filter((row) => inRange(row.created_at, start, end));
  const cash = ((cashData as CashRow[] | null) || []).filter((row) => inRange(row.event_date, start, end));
  const notifications = ((notificationsData as NotificationRow[] | null) || []).filter((row) => inRange(row.created_at, start, end));

  const kpis = {
    membersActive: members.filter((m) => m.status === "active").length,
    membersPaused: members.filter((m) => m.status === "paused").length,
    leadsOpen: leads.filter((l) => l.status === "nouveau").length,
    leadsWon: leads.filter((l) => l.status === "signe").length,
    signalsOpen: signals.filter((s) => s.status !== "closed").length,
    signalsAvgStrength:
      signals.length > 0 ? Number((signals.reduce((sum, s) => sum + Number(s.signal_strength || 0), 0) / signals.length).toFixed(1)) : 0,
    cashIn: cash.filter((c) => c.kind === "encaissement").reduce((sum, c) => sum + Number(c.amount || 0), 0),
    cashOut: cash.filter((c) => c.kind === "decaissement").reduce((sum, c) => sum + Number(c.amount || 0), 0),
    notificationsUnread: notifications.filter((n) => !n.is_read).length,
  };

  const labelByMemberId = new Map<string, string>();
  members.forEach((member) => {
    const full = [member.first_name, member.last_name].filter(Boolean).join(" ").trim();
    labelByMemberId.set(member.id, full || member.user_id);
  });

  const leadsByOwner = new Map<string, number>();
  leads.forEach((lead) => {
    if (!lead.owner_member_id) return;
    leadsByOwner.set(lead.owner_member_id, (leadsByOwner.get(lead.owner_member_id) || 0) + 1);
  });

  const signalsByEmitter = new Map<string, number>();
  signals.forEach((signal) => {
    signalsByEmitter.set(signal.emitter_member_id, (signalsByEmitter.get(signal.emitter_member_id) || 0) + 1);
  });

  const topMembersByLeads = Array.from(leadsByOwner.entries())
    .map(([memberId, value]) => ({ label: labelByMemberId.get(memberId) || memberId, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const topMembersBySignals = Array.from(signalsByEmitter.entries())
    .map(([memberId, value]) => ({ label: labelByMemberId.get(memberId) || memberId, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return {
    error: null as string | null,
    kpis,
    topMembersByLeads,
    topMembersBySignals,
    period: {
      startDate: start,
      endDate: end,
    },
  };
}

function normalizeDate(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return undefined;
  return trimmed;
}

function inRange(rawDate: string, startDate?: string, endDate?: string) {
  const datePart = rawDate.slice(0, 10);
  if (startDate && datePart < startDate) return false;
  if (endDate && datePart > endDate) return false;
  return true;
}

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session requise." };

  const supabaseAdmin = createAdminClient();
  const { data } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!data) return { error: "Accès admin requis." };
  return { user };
}
