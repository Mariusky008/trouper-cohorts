"use server";

import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ServiceMissionFilter = "all" | "new" | "in_progress" | "to_confirm" | "history";

const ACTIVE_STATUSES = ["new", "interested", "in_progress", "done_pending_confirmation", "snoozed"];

function profileText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((v) => String(v || "").trim()).filter(Boolean).join(", ");
  }
  return String(value || "").trim();
}

function buildMissionCandidates(profile: any) {
  const receiveProfile = profile?.receive_profile || {};
  const fullName = profile?.display_name || "ce membre";
  const firstName = String(fullName).split(" ")[0] || "ce membre";

  const targetCompanies = profileText(receiveProfile?.target_companies);
  const prescribers = profileText(receiveProfile?.prescribers);
  const targetClubs = profileText(receiveProfile?.target_clubs);
  const commGoal = profileText(receiveProfile?.comm_goal);
  const linkedIn = profile?.linkedin_url && profile.linkedin_url !== "https://none" ? profile.linkedin_url : "";
  const website = profile?.website_url || "";

  const candidates: any[] = [];

  if (targetCompanies) {
    candidates.push({
      mission_type: "portier",
      title: `Le Portier pour ${firstName}`,
      description: `Présente ${firstName} à 1 contact clé lié à: ${targetCompanies}.`,
      expected_gain: "Ouverture de porte business concrète",
      priority_score: 98,
      action_channel: "whatsapp",
      suggested_message: `Salut, je te présente ${fullName}. Je pense qu'il y a une vraie synergie avec ton activité.`,
      meta: { needs_key: "target_companies", target: targetCompanies },
    });
  }

  if (prescribers) {
    candidates.push({
      mission_type: "prescripteur",
      title: `Le Prescripteur pour ${firstName}`,
      description: `Fais 1 introduction de ${firstName} à un prescripteur: ${prescribers}.`,
      expected_gain: "Nouveau canal de recommandation",
      priority_score: 96,
      action_channel: "whatsapp",
      suggested_message: `Je te présente ${fullName}, je pense que vous pouvez vous recommander mutuellement.`,
      meta: { needs_key: "prescribers", target: prescribers },
    });
  }

  if (targetClubs) {
    candidates.push({
      mission_type: "infiltre",
      title: `L'Infiltré pour ${firstName}`,
      description: `Aide ${firstName} à entrer dans 1 cercle ciblé: ${targetClubs}.`,
      expected_gain: "Accès réseau qualifié",
      priority_score: 92,
      action_channel: "manual",
      meta: { needs_key: "target_clubs", target: targetClubs },
    });
  }

  if (commGoal) {
    candidates.push({
      mission_type: "amplificateur",
      title: `L'Amplificateur pour ${firstName}`,
      description: `Apporte une action de visibilité concrète à ${firstName}: ${commGoal}.`,
      expected_gain: "Visibilité immédiate",
      priority_score: 88,
      action_channel: linkedIn ? "social_link" : "manual",
      external_link: linkedIn || null,
      meta: { needs_key: "comm_goal", target: commGoal },
    });
  }

  if (linkedIn) {
    candidates.push({
      mission_type: "social_comment",
      title: `Commenter un post de ${firstName}`,
      description: `Ouvre son profil LinkedIn et laisse un commentaire de valeur.`,
      expected_gain: "Engagement social qualifié",
      priority_score: 84,
      action_channel: "social_link",
      external_link: linkedIn,
      meta: { social: "linkedin", action: "comment" },
    });
  }

  if (website) {
    candidates.push({
      mission_type: "social_share",
      title: `Partager le lien de ${firstName}`,
      description: `Partage son lien principal dans ton réseau avec un contexte utile.`,
      expected_gain: "Trafic qualifié",
      priority_score: 78,
      action_channel: "social_link",
      external_link: website,
      meta: { social: "website", action: "share" },
    });
  }

  return candidates.slice(0, 6);
}

export async function generateServiceMissionsForPair(helperId: string, beneficiaryId: string, sourceMatchId?: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== helperId) {
    return { success: false, error: "Unauthorized" };
  }

  const { data: beneficiaryProfile } = await supabase
    .from("profiles")
    .select("id, display_name, receive_profile, linkedin_url, website_url")
    .eq("id", beneficiaryId)
    .maybeSingle();

  if (!beneficiaryProfile) {
    return { success: false, error: "Profil bénéficiaire introuvable" };
  }

  const candidates = buildMissionCandidates(beneficiaryProfile);
  let inserted = 0;

  for (const candidate of candidates) {
    const { data: existing } = await supabase
      .from("service_missions")
      .select("id")
      .eq("helper_id", helperId)
      .eq("beneficiary_id", beneficiaryId)
      .eq("mission_type", candidate.mission_type)
      .in("status", ACTIVE_STATUSES)
      .limit(1);

    if (existing && existing.length > 0) continue;

    const { error } = await supabase.from("service_missions").insert({
      helper_id: helperId,
      beneficiary_id: beneficiaryId,
      source_match_id: sourceMatchId || null,
      mission_type: candidate.mission_type,
      title: candidate.title,
      description: candidate.description,
      expected_gain: candidate.expected_gain,
      priority_score: candidate.priority_score,
      action_channel: candidate.action_channel,
      external_link: candidate.external_link || null,
      suggested_message: candidate.suggested_message || null,
      status: "new",
      meta: candidate.meta || {},
    });

    if (!error) inserted += 1;
  }

  return { success: true, inserted };
}

export async function generateServiceMissionsFromRecentContacts(limit = 20) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: matches } = await supabase
    .from("network_matches")
    .select("id, user1_id, user2_id, date")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order("date", { ascending: false })
    .limit(limit);

  if (!matches || matches.length === 0) return { success: true, generated: 0 };

  let generated = 0;
  for (const match of matches) {
    const partnerId = match.user1_id === user.id ? match.user2_id : match.user1_id;
    const result = await generateServiceMissionsForPair(user.id, partnerId, match.id);
    if (result.success) generated += result.inserted || 0;
  }

  return { success: true, generated };
}

export async function markMissionInterested(missionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("service_missions")
    .update({ status: "interested", updated_at: new Date().toISOString(), snoozed_until: null })
    .eq("id", missionId)
    .eq("helper_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/mon-reseau-local/dashboard/opportunities");
  return { success: true };
}

export async function snoozeMission(missionId: string, days = 7) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: mission } = await supabase
    .from("service_missions")
    .select("rejection_count")
    .eq("id", missionId)
    .eq("helper_id", user.id)
    .maybeSingle();

  const snoozedUntil = new Date();
  snoozedUntil.setDate(snoozedUntil.getDate() + days);
  const rejectionCount = (mission?.rejection_count || 0) + 1;
  const nextStatus = rejectionCount >= 3 ? "archived" : "snoozed";

  const { error } = await supabase
    .from("service_missions")
    .update({
      status: nextStatus,
      snoozed_until: nextStatus === "snoozed" ? snoozedUntil.toISOString() : null,
      rejection_count: rejectionCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", missionId)
    .eq("helper_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/mon-reseau-local/dashboard/opportunities");
  return { success: true };
}

export async function markMissionDone(missionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("service_missions")
    .update({
      status: "done_pending_confirmation",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", missionId)
    .eq("helper_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/mon-reseau-local/dashboard/opportunities");
  return { success: true };
}

export async function confirmServiceReceived(missionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("service_missions")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", missionId)
    .eq("beneficiary_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/mon-reseau-local/dashboard/opportunities");
  revalidatePath("/mon-reseau-local/dashboard");
  return { success: true };
}

export async function rejectServiceReceived(missionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("service_missions")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", missionId)
    .eq("beneficiary_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/mon-reseau-local/dashboard/opportunities");
  return { success: true };
}

export async function getServiceMissionsFeed(filter: ServiceMissionFilter = "all") {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  await generateServiceMissionsFromRecentContacts();

  let statuses: string[] | null = null;
  if (filter === "new") statuses = ["new", "snoozed"];
  if (filter === "in_progress") statuses = ["interested", "in_progress"];
  if (filter === "to_confirm") statuses = ["done_pending_confirmation"];
  if (filter === "history") statuses = ["confirmed", "rejected", "archived"];

  let query = supabase
    .from("service_missions")
    .select(`
      id,
      helper_id,
      beneficiary_id,
      mission_type,
      title,
      description,
      expected_gain,
      priority_score,
      action_channel,
      external_link,
      suggested_message,
      status,
      snoozed_until,
      rejection_count,
      meta,
      created_at,
      updated_at,
      completed_at,
      confirmed_at,
      beneficiary:beneficiary_id(id, display_name, avatar_url, trade, linkedin_url),
      source_match:source_match_id(id, date, created_at)
    `)
    .eq("helper_id", user.id)
    .order("created_at", { ascending: false });

  if (statuses) query = query.in("status", statuses);

  const { data, error } = await query;
  if (error || !data) return [];

  const statusRank: Record<string, number> = {
    new: 0,
    interested: 1,
    in_progress: 2,
    done_pending_confirmation: 3,
    snoozed: 4,
    confirmed: 5,
    rejected: 6,
    archived: 7,
  };

  return [...data].sort((a: any, b: any) => {
    const aDate = a.source_match?.date ? new Date(a.source_match.date).getTime() : 0;
    const bDate = b.source_match?.date ? new Date(b.source_match.date).getTime() : 0;
    if (bDate !== aDate) return bDate - aDate;

    const statusDiff = (statusRank[a.status] ?? 99) - (statusRank[b.status] ?? 99);
    if (statusDiff !== 0) return statusDiff;

    return (b.priority_score || 0) - (a.priority_score || 0);
  });
}

export async function getUserServiceStats(userId?: string) {
  noStore();
  const supabase = await createClient();
  let targetId = userId;
  if (!targetId) {
    const { data: { user } } = await supabase.auth.getUser();
    targetId = user?.id;
  }
  if (!targetId) return { services_rendered: 0, services_received: 0, service_balance: 0 };

  const { data } = await supabase
    .from("user_service_stats")
    .select("services_rendered, services_received, service_balance")
    .eq("user_id", targetId)
    .maybeSingle();

  return {
    services_rendered: data?.services_rendered || 0,
    services_received: data?.services_received || 0,
    service_balance: data?.service_balance || 0,
  };
}

export async function getIncomingServiceConfirmations() {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("service_missions")
    .select(`
      id,
      mission_type,
      title,
      description,
      action_channel,
      status,
      completed_at,
      helper:helper_id(id, display_name, avatar_url, trade)
    `)
    .eq("beneficiary_id", user.id)
    .eq("status", "done_pending_confirmation")
    .order("completed_at", { ascending: false });

  if (error || !data) return [];
  return data;
}
