"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  ensureHumanMemberForUserId,
  getMyHumanScope,
  getVisibleHumanDirectory,
} from "@/lib/actions/human-permissions";

type HumanSignalStatus = "open" | "in_progress" | "closed";

type HumanSignal = {
  id: string;
  emitter_member_id: string;
  target_member_id: string | null;
  title: string;
  detail: string;
  signal_strength: number;
  status: HumanSignalStatus;
  created_at: string;
  updated_at: string;
};

type HumanSignalDispatchRow = {
  id: string;
  signal_id: string;
  target_member_id: string;
  notified_at: string;
  status: "notified" | "seen" | "acted";
  note: string | null;
};

type AdminSphereKey = "habitat" | "sante" | "auto";

export async function listVisibleHumanSignals() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Session requise.", signals: [] as Array<HumanSignal & { emitterLabel: string; targetLabel: string; score: number }> };
  }

  const myMember = await ensureHumanMemberForUserId(user.id);
  if (!myMember) {
    return { error: "Profil Popey Human introuvable.", signals: [] as Array<HumanSignal & { emitterLabel: string; targetLabel: string; score: number }> };
  }

  const scope = await getMyHumanScope();
  if ("error" in scope) {
    return { error: scope.error, signals: [] as Array<HumanSignal & { emitterLabel: string; targetLabel: string; score: number }> };
  }

  const supabaseAdmin = createAdminClient();
  const [{ data }, { data: myDispatchRows }] = await Promise.all([
    supabaseAdmin
      .from("human_signals")
      .select("id,emitter_member_id,target_member_id,title,detail,signal_strength,status,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(300),
    supabaseAdmin
      .from("human_signal_dispatch_targets")
      .select("signal_id,target_member_id")
      .eq("target_member_id", myMember.id)
      .limit(500),
  ]);

  const allSignals = (data as HumanSignal[] | null) || [];
  const dispatchedToMeSignalIds = new Set(
    ((myDispatchRows as Array<{ signal_id: string; target_member_id: string }> | null) || []).map((row) => row.signal_id)
  );

  const visibleMemberIds = new Set<string>([myMember.id]);
  if (scope.mode === "SELECTED_MEMBERS") {
    scope.allowedMemberIds.forEach((id) => visibleMemberIds.add(id));
    scope.buddyMemberIds.forEach((id) => visibleMemberIds.add(id));
  } else if (scope.mode === "BINOME_ONLY") {
    scope.buddyMemberIds.forEach((id) => visibleMemberIds.add(id));
  }

  const filtered = scope.mode === "SPHERE_FULL"
    ? allSignals
    : allSignals.filter((signal) => {
        const mine = signal.emitter_member_id === myMember.id || signal.target_member_id === myMember.id;
        const emitterVisible = visibleMemberIds.has(signal.emitter_member_id);
        const targetVisible = signal.target_member_id ? visibleMemberIds.has(signal.target_member_id) : false;
        const dispatchedToMe = dispatchedToMeSignalIds.has(signal.id);
        return mine || emitterVisible || targetVisible || dispatchedToMe;
      });

  const memberIds = new Set<string>();
  filtered.forEach((signal) => {
    memberIds.add(signal.emitter_member_id);
    if (signal.target_member_id) memberIds.add(signal.target_member_id);
  });

  const { data: members } = await supabaseAdmin
    .from("human_members")
    .select("id,user_id,first_name,last_name")
    .in("id", Array.from(memberIds));
  const memberUserIds = ((members as Array<{ id: string; user_id: string; first_name: string | null; last_name: string | null }> | null) || [])
    .map((member) => member.user_id)
    .filter(Boolean);
  const { data: profiles } =
    memberUserIds.length > 0
      ? await supabaseAdmin
          .from("profiles")
          .select("id,display_name")
          .in("id", memberUserIds)
      : { data: [] as Array<{ id: string; display_name: string | null }> };

  const profileByUserId = new Map(
    ((profiles as Array<{ id: string; display_name: string | null }> | null) || []).map((p) => [p.id, p.display_name || ""])
  );

  const labelByMemberId = new Map<string, string>();
  ((members as Array<{ id: string; user_id: string; first_name: string | null; last_name: string | null }> | null) || []).forEach((m) => {
    const full = [m.first_name, m.last_name].filter(Boolean).join(" ").trim();
    labelByMemberId.set(m.id, full || profileByUserId.get(m.user_id) || m.user_id);
  });

  const signalIds = filtered.map((signal) => signal.id);
  const { data: dispatchRows } =
    signalIds.length > 0
      ? await supabaseAdmin
          .from("human_signal_dispatch_targets")
          .select("id,signal_id,target_member_id,notified_at,status,note")
          .in("signal_id", signalIds)
      : { data: [] as HumanSignalDispatchRow[] };

  const dispatchCountBySignalId = new Map<string, number>();
  ((dispatchRows as HumanSignalDispatchRow[] | null) || []).forEach((row) => {
    dispatchCountBySignalId.set(row.signal_id, (dispatchCountBySignalId.get(row.signal_id) || 0) + 1);
  });

  return {
    error: null as string | null,
    signals: filtered.map((signal) => ({
      ...signal,
      emitterLabel: labelByMemberId.get(signal.emitter_member_id) || "Émetteur",
      targetLabel: signal.target_member_id ? labelByMemberId.get(signal.target_member_id) || "Cible" : "Sphère",
      score: computeSignalScore(signal.signal_strength, signal.status),
      dispatchCount: dispatchCountBySignalId.get(signal.id) || 0,
      dispatchedToMe: dispatchedToMeSignalIds.has(signal.id),
    })),
  };
}

export async function createHumanSignal(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session requise." };

  const myMember = await ensureHumanMemberForUserId(user.id);
  if (!myMember) return { error: "Profil Popey Human introuvable." };

  const title = String(formData.get("title") || "").trim();
  const detail = String(formData.get("detail") || "").trim();
  const strengthRaw = String(formData.get("signal_strength") || "1").trim();
  const targetMemberIdRaw = String(formData.get("target_member_id") || "").trim();

  if (!title) return { error: "Titre requis." };
  if (!detail) return { error: "Détail requis." };

  const signalStrength = Number(strengthRaw);
  if (!Number.isInteger(signalStrength) || signalStrength < 1 || signalStrength > 5) {
    return { error: "Force du signal invalide (1-5)." };
  }

  const target_member_id = targetMemberIdRaw || null;

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.from("human_signals").insert({
    emitter_member_id: myMember.id,
    target_member_id,
    title,
    detail,
    signal_strength: signalStrength,
    status: "open",
  });

  if (error) return { error: error.message };

  revalidatePath("/popey-human/app/signal");
  revalidatePath("/admin/humain/sphere");
  return { success: true };
}

export async function createHumanSignalAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/popey-human/app/signal");
  const result = await createHumanSignal(formData);
  if ("error" in result) {
    redirect(withSignalStatus(currentUrl, "error", result.error || "Action impossible."));
  }
  redirect(withSignalStatus(currentUrl, "success", "Signal vocal envoyé."));
}

export async function closeHumanSignal(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session requise." };

  const signalId = String(formData.get("signal_id") || "");
  if (!signalId) return { error: "Signal invalide." };

  const visible = await listVisibleHumanSignals();
  if (visible.error) return { error: visible.error };
  if (!visible.signals.find((signal) => signal.id === signalId)) {
    return { error: "Signal non visible avec votre scope." };
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("human_signals")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .eq("id", signalId);
  if (error) return { error: error.message };

  revalidatePath("/popey-human/app/signal");
  return { success: true };
}

export async function closeHumanSignalAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/popey-human/app/signal");
  const result = await closeHumanSignal(formData);
  if ("error" in result) {
    redirect(withSignalStatus(currentUrl, "error", result.error || "Action impossible."));
  }
  redirect(withSignalStatus(currentUrl, "success", "Signal clôturé."));
}

export async function getSignalTargetCandidates() {
  const directory = await getVisibleHumanDirectory();
  if (directory.error) {
    return { error: directory.error, candidates: [] as Array<{ member_id: string; label: string }> };
  }

  return {
    error: null as string | null,
    candidates: directory.members.map((member) => ({
      member_id: member.id,
      label: [member.first_name, member.last_name].filter(Boolean).join(" ").trim() || member.metier || member.id,
    })),
  };
}

export async function getAdminSignalDispatchSnapshot() {
  const admin = await requireAdminUser();
  if ("error" in admin) {
    return {
      error: admin.error,
      signals: [] as Array<
        HumanSignal & {
          emitterLabel: string;
          emitterTrade: string;
          sphere: AdminSphereKey;
          urgent: boolean;
          directTargetLabel: string;
          dispatchTargets: Array<{ target_member_id: string; label: string; status: "notified" | "seen" | "acted"; notified_at: string }>;
        }
      >,
      candidates: [] as Array<{ member_id: string; label: string }>,
    };
  }

  const supabaseAdmin = createAdminClient();
  const [{ data: signalsData }, { data: membersData }, { data: profilesData }, { data: dispatchData }] = await Promise.all([
    supabaseAdmin
      .from("human_signals")
      .select("id,emitter_member_id,target_member_id,title,detail,signal_strength,status,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(400),
    supabaseAdmin.from("human_members").select("id,user_id,first_name,last_name,status"),
    supabaseAdmin.from("profiles").select("id,display_name,trade"),
    supabaseAdmin
      .from("human_signal_dispatch_targets")
      .select("id,signal_id,target_member_id,notified_at,status,note")
      .order("notified_at", { ascending: false })
      .limit(1000),
  ]);

  const signals = (signalsData as HumanSignal[] | null) || [];
  const members = (membersData as Array<{ id: string; user_id: string; first_name: string | null; last_name: string | null; status: string }> | null) || [];
  const profiles = (profilesData as Array<{ id: string; display_name: string | null; trade: string | null }> | null) || [];
  const dispatchRows = (dispatchData as HumanSignalDispatchRow[] | null) || [];

  const profileByUserId = new Map(
    profiles.map((profile) => [
      profile.id,
      {
        label: (profile.display_name && profile.display_name.trim()) || (profile.trade && profile.trade.trim()) || profile.id,
        trade: (profile.trade && profile.trade.trim()) || "",
      },
    ])
  );
  const memberLabelById = new Map<string, string>();
  const memberTradeById = new Map<string, string>();
  members.forEach((member) => {
    const full = [member.first_name, member.last_name].filter(Boolean).join(" ").trim();
    const profile = profileByUserId.get(member.user_id);
    memberLabelById.set(member.id, full || profile?.label || member.user_id);
    memberTradeById.set(member.id, profile?.trade || "");
  });

  const dispatchBySignalId = new Map<string, HumanSignalDispatchRow[]>();
  dispatchRows.forEach((row) => {
    const arr = dispatchBySignalId.get(row.signal_id) || [];
    arr.push(row);
    dispatchBySignalId.set(row.signal_id, arr);
  });

  const signalsView = signals.map((signal) => ({
    ...signal,
    emitterLabel: memberLabelById.get(signal.emitter_member_id) || "Émetteur",
    emitterTrade: memberTradeById.get(signal.emitter_member_id) || "",
    sphere: inferSphere(memberTradeById.get(signal.emitter_member_id) || "", `${signal.title} ${signal.detail}`),
    urgent: signal.signal_strength >= 4 || /\burgent|urgence\b/i.test(`${signal.title} ${signal.detail}`),
    directTargetLabel: signal.target_member_id ? memberLabelById.get(signal.target_member_id) || "Cible" : "Sphère",
    dispatchTargets: (dispatchBySignalId.get(signal.id) || []).map((row) => ({
      target_member_id: row.target_member_id,
      label: memberLabelById.get(row.target_member_id) || row.target_member_id,
      status: row.status,
      notified_at: row.notified_at,
    })),
  }));

  const candidates = members
    .filter((member) => member.status === "active")
    .map((member) => ({
      member_id: member.id,
      label: memberLabelById.get(member.id) || member.id,
    }));

  return {
    error: null as string | null,
    signals: signalsView,
    candidates,
  };
}

export async function adminDispatchHumanSignal(formData: FormData) {
  const admin = await requireAdminUser();
  if ("error" in admin) return { error: admin.error };

  const signalId = String(formData.get("signal_id") || "").trim();
  const targetMemberIds = formData
    .getAll("target_member_ids")
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  const note = String(formData.get("note") || "").trim();
  if (!signalId) return { error: "Signal invalide." };
  if (targetMemberIds.length === 0) return { error: "Sélectionnez au moins une cible." };

  const supabaseAdmin = createAdminClient();
  const { data: signalRow } = await supabaseAdmin
    .from("human_signals")
    .select("id,title,detail,status")
    .eq("id", signalId)
    .maybeSingle();
  if (!signalRow) return { error: "Signal introuvable." };

  const uniqueTargets = Array.from(new Set(targetMemberIds));
  const dispatchPayload = uniqueTargets.map((targetMemberId) => ({
    signal_id: signalId,
    target_member_id: targetMemberId,
    status: "notified" as const,
    note: note || null,
    notified_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { error: dispatchError } = await supabaseAdmin
    .from("human_signal_dispatch_targets")
    .upsert(dispatchPayload, { onConflict: "signal_id,target_member_id" });
  if (dispatchError) return { error: dispatchError.message };

  const notificationsPayload = uniqueTargets.map((targetMemberId) => ({
    member_id: targetMemberId,
    type: "personnelle" as const,
    title: `Signal vocal dispatché: ${signalRow.title}`,
    message: signalRow.detail,
    impact: `signal:dispatch:${signalId}`,
    is_read: false,
  }));

  const { error: notifError } = await supabaseAdmin.from("human_notifications").insert(notificationsPayload);
  if (notifError) return { error: notifError.message };

  const { error: signalUpdateError } = await supabaseAdmin
    .from("human_signals")
    .update({ status: "in_progress", updated_at: new Date().toISOString() })
    .eq("id", signalId);
  if (signalUpdateError) return { error: signalUpdateError.message };

  revalidatePath("/admin/humain/sphere");
  revalidatePath("/admin/humain/cockpit");
  revalidatePath("/popey-human/app/signal");
  revalidatePath("/popey-human/app/notifications");
  revalidatePath("/admin/humain/notifications");
  return { success: true };
}

export async function adminDispatchHumanSignalAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/admin/humain/sphere");
  const result = await adminDispatchHumanSignal(formData);
  if ("error" in result) {
    redirect(withAdminSignalStatus(currentUrl, "error", result.error || "Action impossible."));
  }
  redirect(withAdminSignalStatus(currentUrl, "success", "Signal dispatché avec succès."));
}

function computeSignalScore(strength: number, status: HumanSignalStatus) {
  const base = strength * 20;
  if (status === "closed") return Math.max(0, base - 10);
  if (status === "in_progress") return base + 10;
  return base;
}

function withSignalStatus(url: string, status: "success" | "error", message: string) {
  const safePath = url.startsWith("/popey-human/app/signal") ? url : "/popey-human/app/signal";
  const parsed = new URL(safePath, "http://localhost");
  parsed.searchParams.set("signalStatus", status);
  parsed.searchParams.set("signalMessage", message);
  return `${parsed.pathname}?${parsed.searchParams.toString()}`;
}

function withAdminSignalStatus(url: string, status: "success" | "error", message: string) {
  const safePath = url.startsWith("/admin/humain/sphere") ? url : "/admin/humain/sphere";
  const parsed = new URL(safePath, "http://localhost");
  parsed.searchParams.set("dispatchStatus", status);
  parsed.searchParams.set("dispatchMessage", message);
  return `${parsed.pathname}?${parsed.searchParams.toString()}`;
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

function inferSphere(trade: string, content: string): AdminSphereKey {
  const text = `${trade} ${content}`.toLowerCase();
  if (/(infirm|kine|kiné|medec|médec|sante|santé|optic|dent|pharma)/.test(text)) return "sante";
  if (/(garage|auto|carross|mecan|mécan|controle technique|contrôle technique|vehicule|véhicule)/.test(text)) return "auto";
  return "habitat";
}
