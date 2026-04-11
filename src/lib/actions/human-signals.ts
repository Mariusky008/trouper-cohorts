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
  audio_url: string | null;
  audio_duration_seconds: number | null;
  signal_strength: number;
  status: HumanSignalStatus;
  created_at: string;
  updated_at: string;
};

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
  const { data } = await supabaseAdmin
    .from("human_signals")
    .select("id,emitter_member_id,target_member_id,title,detail,audio_url,audio_duration_seconds,signal_strength,status,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(300);

  const allSignals = (data as HumanSignal[] | null) || [];

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
        return mine || emitterVisible || targetVisible;
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
  const { data: profiles } = await supabaseAdmin.from("profiles").select("id,display_name");

  const profileByUserId = new Map(
    ((profiles as Array<{ id: string; display_name: string | null }> | null) || []).map((p) => [p.id, p.display_name || ""])
  );

  const labelByMemberId = new Map<string, string>();
  ((members as Array<{ id: string; user_id: string; first_name: string | null; last_name: string | null }> | null) || []).forEach((m) => {
    const full = [m.first_name, m.last_name].filter(Boolean).join(" ").trim();
    labelByMemberId.set(m.id, full || profileByUserId.get(m.user_id) || m.user_id);
  });

  return {
    error: null as string | null,
    signals: filtered.map((signal) => ({
      ...signal,
      emitterLabel: labelByMemberId.get(signal.emitter_member_id) || "Émetteur",
      targetLabel: signal.target_member_id ? labelByMemberId.get(signal.target_member_id) || "Cible" : "Sphère",
      score: computeSignalScore(signal.signal_strength, signal.status),
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
  const audioUrlRaw = String(formData.get("audio_url") || "").trim();
  const audioDurationRaw = String(formData.get("audio_duration_seconds") || "").trim();

  if (!title) return { error: "Titre requis." };
  if (!detail) return { error: "Détail requis." };

  const signalStrength = Number(strengthRaw);
  if (!Number.isInteger(signalStrength) || signalStrength < 1 || signalStrength > 5) {
    return { error: "Force du signal invalide (1-5)." };
  }

  const target_member_id = targetMemberIdRaw || null;
  const audio_url = audioUrlRaw || null;
  let audio_duration_seconds: number | null = null;
  if (audioDurationRaw) {
    const parsed = Number(audioDurationRaw);
    if (!Number.isInteger(parsed) || parsed < 0) {
      return { error: "Durée audio invalide." };
    }
    audio_duration_seconds = parsed;
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.from("human_signals").insert({
    emitter_member_id: myMember.id,
    target_member_id,
    title,
    detail,
    audio_url,
    audio_duration_seconds,
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
