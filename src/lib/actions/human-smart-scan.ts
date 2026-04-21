"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ensureHumanMemberForUserId } from "@/lib/actions/human-permissions";

export type SmartScanTrustLevel = "family" | "pro-close" | "acquaintance";
export type SmartScanHeat = "froid" | "tiede" | "brulant";
export type SmartScanEstimatedGain = "Faible" | "Moyen" | "Eleve";
export type SmartScanOpportunityChoice =
  | "can-buy"
  | "ideal-client"
  | "can-refer"
  | "opens-doors"
  | "identified-need"
  | "no-potential";
export type SmartScanActionType = "passer" | "eclaireur" | "package" | "exclients";
export type SmartScanActionStatus = "drafted" | "sent" | "validated_without_send";
export type SmartScanActionOutcomeStatus = "pending" | "replied" | "converted" | "not_interested";
export type SmartScanAlertType = "hot_ideal_unshared_24h" | "high_priority_no_response_48h";

type SmartScanActionRow = {
  id: string;
  contact_id: string;
  owner_member_id: string;
  action_type: SmartScanActionType;
  message_draft: string | null;
  send_channel: "whatsapp" | "other";
  status: SmartScanActionStatus;
  sent_at: string | null;
  validated_at: string | null;
  whatsapp_opened_at: string | null;
  template_version: string | null;
  followup_due_at: string | null;
  outcome_status: SmartScanActionOutcomeStatus | null;
  outcome_notes: string | null;
  created_at: string;
  updated_at: string;
};

type SmartScanHistoryItem = SmartScanActionRow & {
  contact_name: string;
  contact_city: string | null;
};

type SessionRow = {
  id: string;
  owner_member_id: string;
  session_date: string;
  daily_goal: number;
  opportunities_activated: number;
  target_potential_eur: number;
  started_at: string;
  completed_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type SmartScanAlertRow = {
  id: string;
  owner_member_id: string;
  contact_id: string | null;
  alert_type: SmartScanAlertType;
  status: "open" | "dismissed" | "resolved";
  payload: Record<string, unknown> | null;
  triggered_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

type SmartScanDueFollowupItem = {
  action_id: string;
  contact_id: string;
  owner_member_id: string;
  contact_name: string;
  action_type: SmartScanActionType;
  followup_due_at: string;
  priority_score: number;
  suggested_message: string;
};

type SmartScanConversionStats = {
  total_sent: number;
  total_replied: number;
  total_converted: number;
  conversion_rate: number;
  avg_response_delay_hours: number;
  by_action: Array<{
    action_type: SmartScanActionType;
    sent: number;
    converted: number;
    conversion_rate: number;
  }>;
  top_converted_contacts: Array<{
    contact_id: string;
    contact_name: string;
    conversions: number;
  }>;
};

type ResultError = { error: string };
type ContactScoreInputs = {
  trustLevel: SmartScanTrustLevel | null;
  heat: SmartScanHeat | null;
  opportunityChoice: SmartScanOpportunityChoice | null;
  estimatedGain: SmartScanEstimatedGain | null;
  lastActionAt: string | null;
};

function normalizeTrustLevel(level: SmartScanTrustLevel): "family" | "pro_close" | "acquaintance" {
  if (level === "pro-close") return "pro_close";
  return level;
}

function toTrustLevelOutput(level: string | null): SmartScanTrustLevel | null {
  if (!level) return null;
  if (level === "pro_close") return "pro-close";
  if (level === "family" || level === "acquaintance") return level;
  return null;
}

async function getCurrentHumanMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const member = await ensureHumanMemberForUserId(user.id);
  if (!member) return null;
  return member;
}

async function resolveContactId(params: {
  ownerMemberId: string;
  contactId?: string;
  externalContactRef?: string;
  fullName?: string;
  city?: string | null;
  companyHint?: string | null;
}): Promise<{ id: string } | ResultError> {
  const supabaseAdmin = createAdminClient();
  const nowIso = new Date().toISOString();

  if (params.contactId) {
    const { data: existing } = await supabaseAdmin
      .from("human_smart_scan_contacts")
      .select("id")
      .eq("id", params.contactId)
      .eq("owner_member_id", params.ownerMemberId)
      .maybeSingle();
    if (existing?.id) return { id: existing.id as string };
  }

  if (params.externalContactRef) {
    const { data: byExternal } = await supabaseAdmin
      .from("human_smart_scan_contacts")
      .select("id")
      .eq("owner_member_id", params.ownerMemberId)
      .eq("external_contact_ref", params.externalContactRef)
      .maybeSingle();
    if (byExternal?.id) return { id: byExternal.id as string };

    if (!params.fullName) {
      return { error: "Nom du contact requis pour créer un contact Smart Scan." };
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("human_smart_scan_contacts")
      .insert({
        owner_member_id: params.ownerMemberId,
        external_contact_ref: params.externalContactRef,
        full_name: params.fullName,
        city: params.city || null,
        company_hint: params.companyHint || null,
        updated_at: nowIso,
      })
      .select("id")
      .single();

    if (error || !inserted?.id) {
      return { error: error?.message || "Impossible de créer le contact Smart Scan." };
    }
    return { id: inserted.id as string };
  }

  return { error: "contactId ou externalContactRef requis." };
}

function revalidateSmartScanPaths() {
  revalidatePath("/popey-human/smart-scan");
  revalidatePath("/popey-human/entrepreneur-smart-scan-test");
}

function smartScanActionLabel(action: SmartScanActionType) {
  if (action === "eclaireur") return "Eclaireur";
  if (action === "package") return "Partage Croise";
  if (action === "exclients") return "Ex-Clients";
  return "Passer";
}

function buildFollowupSuggestion(contactName: string, actionType: SmartScanActionType) {
  const firstName = contactName.split(" ")[0] || "toi";
  if (actionType === "package") {
    return `Salut ${firstName}, petit suivi de ma proposition pack Trio. Tu veux qu on cale 10 min pour l activer cette semaine ?`;
  }
  if (actionType === "eclaireur") {
    return `Salut ${firstName}, je reviens vers toi sur le programme apporteur d affaires. Si tu as un premier cas, je te fais un retour rapide et clair.`;
  }
  if (actionType === "exclients") {
    return `Salut ${firstName}, je fais un point rapide suite a mon dernier message. Si c est utile, je te partage une synthese concrete en 2 minutes.`;
  }
  return `Salut ${firstName}, je te relance rapidement suite a mon dernier message.`;
}

export async function saveTrustLevel(input: {
  contactId?: string;
  externalContactRef?: string;
  fullName?: string;
  city?: string | null;
  companyHint?: string | null;
  trustLevel: SmartScanTrustLevel;
}) {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) return { error: "Session requise." };

  const resolved = await resolveContactId({
    ownerMemberId: currentMember.id,
    contactId: input.contactId,
    externalContactRef: input.externalContactRef,
    fullName: input.fullName,
    city: input.city,
    companyHint: input.companyHint,
  });
  if ("error" in resolved) return resolved;

  const supabaseAdmin = createAdminClient();
  const nowIso = new Date().toISOString();
  const payload = {
    trust_level: normalizeTrustLevel(input.trustLevel),
    trust_level_set_at: nowIso,
    updated_at: nowIso,
  };

  const { error } = await supabaseAdmin
    .from("human_smart_scan_contacts")
    .update(payload)
    .eq("id", resolved.id)
    .eq("owner_member_id", currentMember.id);
  if (error) return { error: error.message };

  revalidateSmartScanPaths();
  return { success: true, contactId: resolved.id, trustLevel: input.trustLevel };
}

export async function saveQualification(input: {
  contactId?: string;
  externalContactRef?: string;
  fullName?: string;
  city?: string | null;
  companyHint?: string | null;
  heat: SmartScanHeat;
  opportunityChoice?: SmartScanOpportunityChoice | null;
  communityTags: string[];
  estimatedGain: SmartScanEstimatedGain;
}) {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) return { error: "Session requise." };

  const resolved = await resolveContactId({
    ownerMemberId: currentMember.id,
    contactId: input.contactId,
    externalContactRef: input.externalContactRef,
    fullName: input.fullName,
    city: input.city,
    companyHint: input.companyHint,
  });
  if ("error" in resolved) return resolved;

  const supabaseAdmin = createAdminClient();
  const nowIso = new Date().toISOString();
  const payload = {
    contact_id: resolved.id,
    owner_member_id: currentMember.id,
    heat: input.heat,
    opportunity_choice: input.opportunityChoice || null,
    community_tags: input.communityTags,
    estimated_gain: input.estimatedGain,
    qualified_at: nowIso,
    updated_at: nowIso,
  };

  const { error } = await supabaseAdmin
    .from("human_smart_scan_qualifications")
    .upsert(payload, { onConflict: "contact_id,owner_member_id" });
  if (error) return { error: error.message };

  await syncHotIdealAlertForContact(currentMember.id, resolved.id, input.fullName);
  await syncHighPriorityNoResponseAlertForContact(currentMember.id, resolved.id, input.fullName);
  revalidateSmartScanPaths();
  return { success: true, contactId: resolved.id };
}

export async function logSmartScanAction(input: {
  contactId?: string;
  externalContactRef?: string;
  fullName?: string;
  city?: string | null;
  companyHint?: string | null;
  actionType: SmartScanActionType;
  messageDraft?: string | null;
  sendChannel?: "whatsapp" | "other";
  status: SmartScanActionStatus;
  clientEventId?: string | null;
  templateVersion?: string | null;
}) {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) return { error: "Session requise." };

  const resolved = await resolveContactId({
    ownerMemberId: currentMember.id,
    contactId: input.contactId,
    externalContactRef: input.externalContactRef,
    fullName: input.fullName,
    city: input.city,
    companyHint: input.companyHint,
  });
  if ("error" in resolved) return resolved;

  const supabaseAdmin = createAdminClient();
  const nowIso = new Date().toISOString();
  const normalizedSendChannel = input.sendChannel || "whatsapp";
  const shouldSetSentAt = input.status === "sent";
  const shouldSetValidatedAt = input.status === "validated_without_send";
  const shouldSetWhatsAppOpenedAt = normalizedSendChannel === "whatsapp" && input.status === "sent";

  if (input.clientEventId) {
    const { data: existingAction } = await supabaseAdmin
      .from("human_smart_scan_actions")
      .select("id")
      .eq("owner_member_id", currentMember.id)
      .eq("client_event_id", input.clientEventId)
      .maybeSingle();
    if (existingAction?.id) {
      const session = await upsertTodaySessionInternal(currentMember.id);
      return {
        success: true,
        actionId: String(existingAction.id),
        contactId: resolved.id,
        opportunitiesActivated: "error" in session ? null : session.opportunities_activated,
      };
    }
  }

  const { data: inserted, error } = await supabaseAdmin
    .from("human_smart_scan_actions")
    .insert({
      contact_id: resolved.id,
      owner_member_id: currentMember.id,
      action_type: input.actionType,
      message_draft: input.messageDraft || null,
      send_channel: normalizedSendChannel,
      status: input.status,
      sent_at: shouldSetSentAt ? nowIso : null,
      validated_at: shouldSetValidatedAt ? nowIso : null,
      whatsapp_opened_at: shouldSetWhatsAppOpenedAt ? nowIso : null,
      template_version: input.templateVersion || "v1",
      followup_due_at: shouldSetWhatsAppOpenedAt ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() : null,
      outcome_status: shouldSetWhatsAppOpenedAt ? "pending" : null,
      client_event_id: input.clientEventId || null,
      updated_at: nowIso,
    })
    .select("id")
    .single();
  if (error || !inserted?.id) return { error: error?.message || "Impossible d'enregistrer l'action." };

  let opportunitiesActivated: number | null = null;
  if (input.actionType !== "passer" && (input.status === "sent" || input.status === "validated_without_send")) {
    opportunitiesActivated = await incrementTodaySessionInternal(currentMember.id);
  } else {
    const session = await upsertTodaySessionInternal(currentMember.id);
    opportunitiesActivated = "error" in session ? null : session.opportunities_activated;
  }

  await syncHotIdealAlertForContact(currentMember.id, resolved.id, input.fullName);
  await syncHighPriorityNoResponseAlertForContact(currentMember.id, resolved.id, input.fullName);
  revalidateSmartScanPaths();
  return {
    success: true,
    actionId: inserted.id as string,
    contactId: resolved.id,
    opportunitiesActivated,
  };
}

export async function updateSmartScanActionOutcome(input: {
  actionId: string;
  outcomeStatus: SmartScanActionOutcomeStatus;
  outcomeNotes?: string | null;
}) {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) return { error: "Session requise." };

  const supabaseAdmin = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data: existing, error: selectError } = await supabaseAdmin
    .from("human_smart_scan_actions")
    .select("id,contact_id")
    .eq("id", input.actionId)
    .eq("owner_member_id", currentMember.id)
    .maybeSingle();

  if (selectError || !existing?.id) {
    return { error: selectError?.message || "Action introuvable." };
  }

  const { error } = await supabaseAdmin
    .from("human_smart_scan_actions")
    .update({
      outcome_status: input.outcomeStatus,
      outcome_notes: input.outcomeNotes || null,
      followup_due_at: input.outcomeStatus === "pending" ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() : null,
      updated_at: nowIso,
    })
    .eq("id", existing.id)
    .eq("owner_member_id", currentMember.id);
  if (error) return { error: error.message };

  await syncHighPriorityNoResponseAlertForContact(currentMember.id, String(existing.contact_id));
  revalidateSmartScanPaths();
  return { success: true, actionId: String(existing.id), outcomeStatus: input.outcomeStatus };
}

export async function getOrCreateTodaySession() {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) {
    return { error: "Session requise.", session: null as SessionRow | null };
  }

  const session = await upsertTodaySessionInternal(currentMember.id);
  if ("error" in session) {
    return { error: session.error, session: null as SessionRow | null };
  }

  const targetPotential = await computeDailyTargetPotential(currentMember.id);
  if (targetPotential !== null && Number(session.target_potential_eur) !== targetPotential) {
    const supabaseAdmin = createAdminClient();
    await supabaseAdmin
      .from("human_smart_scan_daily_sessions")
      .update({
        target_potential_eur: targetPotential,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id)
      .eq("owner_member_id", currentMember.id);

    session.target_potential_eur = targetPotential;
  }

  return { error: null as string | null, session };
}

export async function listHistoryActions(limit = 60) {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) {
    return { error: "Session requise.", actions: [] as SmartScanHistoryItem[] };
  }

  const safeLimit = Math.max(1, Math.min(200, Math.trunc(limit)));
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("human_smart_scan_actions")
    .select(
      "id,contact_id,owner_member_id,action_type,message_draft,send_channel,status,sent_at,validated_at,whatsapp_opened_at,template_version,followup_due_at,outcome_status,outcome_notes,created_at,updated_at,human_smart_scan_contacts!inner(full_name,city)"
    )
    .eq("owner_member_id", currentMember.id)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) return { error: error.message, actions: [] as SmartScanHistoryItem[] };

  const actions: SmartScanHistoryItem[] = ((data as Array<Record<string, unknown>> | null) || []).map((row) => {
    const contact = row.human_smart_scan_contacts as { full_name?: string; city?: string | null } | null;
    return {
      id: String(row.id),
      contact_id: String(row.contact_id),
      owner_member_id: String(row.owner_member_id),
      action_type: row.action_type as SmartScanActionType,
      message_draft: (row.message_draft as string | null) || null,
      send_channel: row.send_channel as "whatsapp" | "other",
      status: row.status as SmartScanActionStatus,
      sent_at: (row.sent_at as string | null) || null,
      validated_at: (row.validated_at as string | null) || null,
      whatsapp_opened_at: (row.whatsapp_opened_at as string | null) || null,
      template_version: (row.template_version as string | null) || null,
      followup_due_at: (row.followup_due_at as string | null) || null,
      outcome_status: (row.outcome_status as SmartScanActionOutcomeStatus | null) || null,
      outcome_notes: (row.outcome_notes as string | null) || null,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
      contact_name: contact?.full_name || "Contact",
      contact_city: contact?.city || null,
    };
  });

  return { error: null as string | null, actions };
}

export async function listMySmartScanContacts(limit = 500) {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) {
    return { error: "Session requise.", contacts: [] as Array<Record<string, unknown>> };
  }

  const safeLimit = Math.max(1, Math.min(1000, Math.trunc(limit)));
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("human_smart_scan_contacts")
    .select("id,external_contact_ref,full_name,city,company_hint,is_favorite,trust_level,trust_level_set_at,created_at,updated_at")
    .eq("owner_member_id", currentMember.id)
    .order("updated_at", { ascending: false })
    .limit(safeLimit);

  if (error) return { error: error.message, contacts: [] as Array<Record<string, unknown>> };

  const contactsRaw = (data as Array<Record<string, unknown>> | null) || [];
  const contactIds = contactsRaw.map((row) => String(row.id));

  const qualificationMap = new Map<
    string,
    {
      heat: SmartScanHeat | null;
      opportunity_choice: SmartScanOpportunityChoice | null;
      estimated_gain: SmartScanEstimatedGain | null;
    }
  >();
  const lastActionMap = new Map<string, string>();

  if (contactIds.length > 0) {
    const { data: qualifications } = await supabaseAdmin
      .from("human_smart_scan_qualifications")
      .select("contact_id,heat,opportunity_choice,estimated_gain")
      .eq("owner_member_id", currentMember.id)
      .in("contact_id", contactIds);

    ((qualifications as Array<Record<string, unknown>> | null) || []).forEach((row) => {
      qualificationMap.set(String(row.contact_id), {
        heat: (row.heat as SmartScanHeat | null) || null,
        opportunity_choice: (row.opportunity_choice as SmartScanOpportunityChoice | null) || null,
        estimated_gain: (row.estimated_gain as SmartScanEstimatedGain | null) || null,
      });
    });

    const { data: actions } = await supabaseAdmin
      .from("human_smart_scan_actions")
      .select("contact_id,created_at")
      .eq("owner_member_id", currentMember.id)
      .in("contact_id", contactIds)
      .order("created_at", { ascending: false })
      .limit(Math.min(5000, safeLimit * 15));

    ((actions as Array<Record<string, unknown>> | null) || []).forEach((row) => {
      const contactId = String(row.contact_id);
      if (!lastActionMap.has(contactId)) {
        lastActionMap.set(contactId, String(row.created_at));
      }
    });
  }

  const contacts = contactsRaw
    .map((row) => {
      const contactId = String(row.id);
      const trustLevel = toTrustLevelOutput((row.trust_level as string | null) || null);
      const qualification = qualificationMap.get(contactId);
      const lastActionAt = lastActionMap.get(contactId) || null;
      const scoreInputs: ContactScoreInputs = {
        trustLevel,
        heat: qualification?.heat || null,
        opportunityChoice: qualification?.opportunity_choice || null,
        estimatedGain: qualification?.estimated_gain || null,
        lastActionAt,
      };
      const priorityScore = computePriorityScore(scoreInputs);
      const potentialEur = computePotentialEur(scoreInputs);
      return {
        ...row,
        trust_level: trustLevel,
        priority_score: priorityScore,
        potential_eur: potentialEur,
        last_action_at: lastActionAt,
      };
    })
    .sort((a, b) => {
      const scoreDelta = Number((b.priority_score as number) || 0) - Number((a.priority_score as number) || 0);
      if (scoreDelta !== 0) return scoreDelta;
      return String(b.last_action_at || "").localeCompare(String(a.last_action_at || ""));
    });

  return { error: null as string | null, contacts };
}

export async function listMySmartScanQualifications(limit = 500) {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) {
    return { error: "Session requise.", qualifications: [] as Array<Record<string, unknown>> };
  }

  const safeLimit = Math.max(1, Math.min(1000, Math.trunc(limit)));
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("human_smart_scan_qualifications")
    .select("id,contact_id,owner_member_id,heat,opportunity_choice,community_tags,estimated_gain,qualified_at,created_at,updated_at")
    .eq("owner_member_id", currentMember.id)
    .order("updated_at", { ascending: false })
    .limit(safeLimit);

  if (error) return { error: error.message, qualifications: [] as Array<Record<string, unknown>> };
  return { error: null as string | null, qualifications: (data as Array<Record<string, unknown>> | null) || [] };
}

export async function setContactFavorite(input: {
  contactId?: string;
  externalContactRef?: string;
  fullName?: string;
  city?: string | null;
  companyHint?: string | null;
  isFavorite: boolean;
}) {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) return { error: "Session requise." };

  const resolved = await resolveContactId({
    ownerMemberId: currentMember.id,
    contactId: input.contactId,
    externalContactRef: input.externalContactRef,
    fullName: input.fullName,
    city: input.city,
    companyHint: input.companyHint,
  });
  if ("error" in resolved) return resolved;

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("human_smart_scan_contacts")
    .update({
      is_favorite: input.isFavorite,
      updated_at: new Date().toISOString(),
    })
    .eq("id", resolved.id)
    .eq("owner_member_id", currentMember.id);
  if (error) return { error: error.message };

  revalidateSmartScanPaths();
  return { success: true, contactId: resolved.id, isFavorite: input.isFavorite };
}

export async function listOpenSmartScanAlerts(limit = 100) {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) {
    return { error: "Session requise.", alerts: [] as SmartScanAlertRow[] };
  }

  const safeLimit = Math.max(1, Math.min(300, Math.trunc(limit)));
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("human_smart_scan_alerts")
    .select("id,owner_member_id,contact_id,alert_type,status,payload,triggered_at,resolved_at,created_at,updated_at")
    .eq("owner_member_id", currentMember.id)
    .eq("status", "open")
    .order("triggered_at", { ascending: false })
    .limit(safeLimit);

  if (error) return { error: error.message, alerts: [] as SmartScanAlertRow[] };
  return { error: null as string | null, alerts: (data as SmartScanAlertRow[] | null) || [] };
}

export async function listDueSmartScanFollowups(limit = 40) {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) {
    return { error: "Session requise.", followups: [] as SmartScanDueFollowupItem[] };
  }

  const supabaseAdmin = createAdminClient();
  const safeLimit = Math.max(1, Math.min(200, Math.trunc(limit)));
  const nowIso = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("human_smart_scan_actions")
    .select(
      "id,owner_member_id,contact_id,action_type,followup_due_at,human_smart_scan_contacts!inner(full_name,trust_level)"
    )
    .eq("owner_member_id", currentMember.id)
    .eq("send_channel", "whatsapp")
    .eq("status", "sent")
    .eq("outcome_status", "pending")
    .not("followup_due_at", "is", null)
    .lte("followup_due_at", nowIso)
    .order("followup_due_at", { ascending: true })
    .limit(safeLimit);

  if (error) return { error: error.message, followups: [] as SmartScanDueFollowupItem[] };

  const rows = (data as Array<Record<string, unknown>> | null) || [];
  const contactIds = rows.map((row) => String(row.contact_id));
  const qualificationMap = new Map<
    string,
    { heat: SmartScanHeat | null; opportunity_choice: SmartScanOpportunityChoice | null; estimated_gain: SmartScanEstimatedGain | null }
  >();
  if (contactIds.length > 0) {
    const { data: qualifications } = await supabaseAdmin
      .from("human_smart_scan_qualifications")
      .select("contact_id,heat,opportunity_choice,estimated_gain")
      .eq("owner_member_id", currentMember.id)
      .in("contact_id", contactIds);
    ((qualifications as Array<Record<string, unknown>> | null) || []).forEach((row) => {
      qualificationMap.set(String(row.contact_id), {
        heat: (row.heat as SmartScanHeat | null) || null,
        opportunity_choice: (row.opportunity_choice as SmartScanOpportunityChoice | null) || null,
        estimated_gain: (row.estimated_gain as SmartScanEstimatedGain | null) || null,
      });
    });
  }

  const followups: SmartScanDueFollowupItem[] = rows.map((row) => {
    const contact = row.human_smart_scan_contacts as { full_name?: string; trust_level?: string | null } | null;
    const qual = qualificationMap.get(String(row.contact_id));
    const priorityScore = computePriorityScore({
      trustLevel: toTrustLevelOutput((contact?.trust_level as string | null) || null),
      heat: (qual?.heat as SmartScanHeat | null) || null,
      opportunityChoice: (qual?.opportunity_choice as SmartScanOpportunityChoice | null) || null,
      estimatedGain: (qual?.estimated_gain as SmartScanEstimatedGain | null) || null,
      lastActionAt: String(row.followup_due_at || row.id || ""),
    });
    const contactName = contact?.full_name || "Contact";
    return {
      action_id: String(row.id),
      contact_id: String(row.contact_id),
      owner_member_id: String(row.owner_member_id),
      contact_name: contactName,
      action_type: row.action_type as SmartScanActionType,
      followup_due_at: String(row.followup_due_at),
      priority_score: priorityScore,
      suggested_message: buildFollowupSuggestion(contactName, row.action_type as SmartScanActionType),
    };
  });

  return {
    error: null as string | null,
    followups: followups.sort((a, b) => b.priority_score - a.priority_score),
  };
}

export async function getSmartScanConversionStats(days = 7) {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) {
    return { error: "Session requise.", stats: null as SmartScanConversionStats | null };
  }

  const safeDays = Math.max(1, Math.min(90, Math.trunc(days)));
  const since = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000).toISOString();
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("human_smart_scan_actions")
    .select("id,action_type,status,outcome_status,sent_at,updated_at,contact_id,human_smart_scan_contacts(full_name)")
    .eq("owner_member_id", currentMember.id)
    .eq("status", "sent")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(4000);
  if (error) return { error: error.message, stats: null as SmartScanConversionStats | null };

  const rows = (data as Array<Record<string, unknown>> | null) || [];
  const totalSent = rows.length;
  const repliedRows = rows.filter((row) => row.outcome_status === "replied" || row.outcome_status === "converted");
  const convertedRows = rows.filter((row) => row.outcome_status === "converted");
  const byActionMap = new Map<
    SmartScanActionType,
    {
      sent: number;
      converted: number;
    }
  >();
  const responseDelaysHours: number[] = [];
  const convertedByContact = new Map<string, { contact_name: string; conversions: number }>();

  rows.forEach((row) => {
    const actionType = row.action_type as SmartScanActionType;
    const metrics = byActionMap.get(actionType) || { sent: 0, converted: 0 };
    metrics.sent += 1;
    if (row.outcome_status === "converted") metrics.converted += 1;
    byActionMap.set(actionType, metrics);

    if (row.outcome_status === "replied" || row.outcome_status === "converted") {
      const sentMs = row.sent_at ? Date.parse(String(row.sent_at)) : NaN;
      const updatedMs = row.updated_at ? Date.parse(String(row.updated_at)) : NaN;
      if (Number.isFinite(sentMs) && Number.isFinite(updatedMs) && updatedMs >= sentMs) {
        responseDelaysHours.push((updatedMs - sentMs) / (1000 * 60 * 60));
      }
    }

    if (row.outcome_status === "converted") {
      const contactId = String(row.contact_id);
      const contactObj = row.human_smart_scan_contacts as { full_name?: string } | null;
      const existing = convertedByContact.get(contactId) || { contact_name: contactObj?.full_name || "Contact", conversions: 0 };
      existing.conversions += 1;
      convertedByContact.set(contactId, existing);
    }
  });

  const byAction: SmartScanConversionStats["by_action"] = (["eclaireur", "package", "exclients", "passer"] as SmartScanActionType[])
    .map((actionType) => {
      const values = byActionMap.get(actionType) || { sent: 0, converted: 0 };
      return {
        action_type: actionType,
        sent: values.sent,
        converted: values.converted,
        conversion_rate: values.sent > 0 ? Math.round((values.converted / values.sent) * 100) : 0,
      };
    })
    .filter((row) => row.sent > 0);

  const avgResponseDelayHours =
    responseDelaysHours.length > 0
      ? Number((responseDelaysHours.reduce((sum, hours) => sum + hours, 0) / responseDelaysHours.length).toFixed(1))
      : 0;
  const topConvertedContacts = Array.from(convertedByContact.entries())
    .map(([contactId, values]) => ({
      contact_id: contactId,
      contact_name: values.contact_name,
      conversions: values.conversions,
    }))
    .sort((a, b) => b.conversions - a.conversions)
    .slice(0, 5);

  return {
    error: null as string | null,
    stats: {
      total_sent: totalSent,
      total_replied: repliedRows.length,
      total_converted: convertedRows.length,
      conversion_rate: totalSent > 0 ? Math.round((convertedRows.length / totalSent) * 100) : 0,
      avg_response_delay_hours: avgResponseDelayHours,
      by_action: byAction,
      top_converted_contacts: topConvertedContacts,
    } as SmartScanConversionStats,
  };
}

export async function runSmartScanFollowupSweep(limit = 600) {
  const supabaseAdmin = createAdminClient();
  const safeLimit = Math.max(1, Math.min(2000, Math.trunc(limit)));
  const nowIso = new Date().toISOString();

  const { data: dueActions, error } = await supabaseAdmin
    .from("human_smart_scan_actions")
    .select("id,owner_member_id,contact_id,action_type,followup_due_at,human_smart_scan_contacts!inner(full_name)")
    .eq("send_channel", "whatsapp")
    .eq("status", "sent")
    .eq("outcome_status", "pending")
    .not("followup_due_at", "is", null)
    .lte("followup_due_at", nowIso)
    .order("followup_due_at", { ascending: true })
    .limit(safeLimit);
  if (error) return { success: false, error: error.message, queued: 0 };

  const rows = (dueActions as Array<Record<string, unknown>> | null) || [];
  if (rows.length === 0) return { success: true, queued: 0, touchedContacts: 0 };

  const upserts = rows.map((row) => {
    const contact = row.human_smart_scan_contacts as { full_name?: string } | null;
    const contactName = contact?.full_name || "Contact";
    return {
      action_id: String(row.id),
      owner_member_id: String(row.owner_member_id),
      contact_id: String(row.contact_id),
      job_type: "auto_followup_48h",
      status: "queued",
      suggested_message: buildFollowupSuggestion(contactName, row.action_type as SmartScanActionType),
      scheduled_for: String(row.followup_due_at),
      metadata: {
        reason: "pending_no_response_48h",
        action_label: smartScanActionLabel(row.action_type as SmartScanActionType),
      },
      updated_at: nowIso,
    };
  });

  const { error: upsertError } = await supabaseAdmin
    .from("human_smart_scan_followup_jobs")
    .upsert(upserts, { onConflict: "action_id,job_type" });
  if (upsertError) return { success: false, error: upsertError.message, queued: 0 };

  const dedupContacts = new Map<string, { ownerMemberId: string; contactId: string; contactName?: string }>();
  rows.forEach((row) => {
    const contact = row.human_smart_scan_contacts as { full_name?: string } | null;
    const key = `${String(row.owner_member_id)}:${String(row.contact_id)}`;
    dedupContacts.set(key, {
      ownerMemberId: String(row.owner_member_id),
      contactId: String(row.contact_id),
      contactName: contact?.full_name || undefined,
    });
  });
  for (const entry of dedupContacts.values()) {
    await syncHighPriorityNoResponseAlertForContact(entry.ownerMemberId, entry.contactId, entry.contactName);
  }

  return {
    success: true,
    queued: upserts.length,
    touchedContacts: dedupContacts.size,
  };
}

async function syncHotIdealAlertForContact(ownerMemberId: string, contactId: string, contactName?: string) {
  const supabaseAdmin = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: qualification } = await supabaseAdmin
    .from("human_smart_scan_qualifications")
    .select("heat,opportunity_choice,qualified_at")
    .eq("owner_member_id", ownerMemberId)
    .eq("contact_id", contactId)
    .maybeSingle();

  const isHotIdeal = qualification?.heat === "brulant" && qualification?.opportunity_choice === "ideal-client";
  const qualifiedAtMs = qualification?.qualified_at ? Date.parse(qualification.qualified_at) : NaN;
  const isOver24h = Number.isFinite(qualifiedAtMs) && Date.now() - qualifiedAtMs >= 24 * 60 * 60 * 1000;

  let hasPackageAction = false;
  if (isHotIdeal && qualification?.qualified_at) {
    const { data: packageAction } = await supabaseAdmin
      .from("human_smart_scan_actions")
      .select("id")
      .eq("owner_member_id", ownerMemberId)
      .eq("contact_id", contactId)
      .eq("action_type", "package")
      .in("status", ["sent", "validated_without_send"])
      .gte("created_at", qualification.qualified_at)
      .limit(1)
      .maybeSingle();
    hasPackageAction = Boolean(packageAction?.id);
  }

  const shouldOpenAlert = Boolean(isHotIdeal && isOver24h && !hasPackageAction);
  const { data: openAlert } = await supabaseAdmin
    .from("human_smart_scan_alerts")
    .select("id")
    .eq("owner_member_id", ownerMemberId)
    .eq("contact_id", contactId)
    .eq("alert_type", "hot_ideal_unshared_24h")
    .eq("status", "open")
    .order("triggered_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (shouldOpenAlert) {
    if (openAlert?.id) {
      await supabaseAdmin
        .from("human_smart_scan_alerts")
        .update({
          payload: {
            reason: "hot_ideal_unshared_24h",
            contact_name: contactName || null,
            qualified_at: qualification?.qualified_at || null,
          },
          updated_at: nowIso,
        })
        .eq("id", openAlert.id)
        .eq("owner_member_id", ownerMemberId);
      return;
    }

    await supabaseAdmin.from("human_smart_scan_alerts").insert({
      owner_member_id: ownerMemberId,
      contact_id: contactId,
      alert_type: "hot_ideal_unshared_24h",
      status: "open",
      payload: {
        reason: "hot_ideal_unshared_24h",
        contact_name: contactName || null,
        qualified_at: qualification?.qualified_at || null,
      },
      triggered_at: nowIso,
      updated_at: nowIso,
    });
    return;
  }

  await supabaseAdmin
    .from("human_smart_scan_alerts")
    .update({
      status: "resolved",
      resolved_at: nowIso,
      updated_at: nowIso,
    })
    .eq("owner_member_id", ownerMemberId)
    .eq("contact_id", contactId)
    .eq("alert_type", "hot_ideal_unshared_24h")
    .eq("status", "open");
}

async function syncHighPriorityNoResponseAlertForContact(ownerMemberId: string, contactId: string, contactName?: string) {
  const supabaseAdmin = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: contact } = await supabaseAdmin
    .from("human_smart_scan_contacts")
    .select("trust_level")
    .eq("id", contactId)
    .eq("owner_member_id", ownerMemberId)
    .maybeSingle();
  const { data: qualification } = await supabaseAdmin
    .from("human_smart_scan_qualifications")
    .select("heat,opportunity_choice,estimated_gain")
    .eq("contact_id", contactId)
    .eq("owner_member_id", ownerMemberId)
    .maybeSingle();

  const { data: latestAction } = await supabaseAdmin
    .from("human_smart_scan_actions")
    .select("id,followup_due_at,outcome_status,sent_at,created_at")
    .eq("owner_member_id", ownerMemberId)
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const priorityScore = computePriorityScore({
    trustLevel: toTrustLevelOutput((contact?.trust_level as string | null) || null),
    heat: (qualification?.heat as SmartScanHeat | null) || null,
    opportunityChoice: (qualification?.opportunity_choice as SmartScanOpportunityChoice | null) || null,
    estimatedGain: (qualification?.estimated_gain as SmartScanEstimatedGain | null) || null,
    lastActionAt: (latestAction?.created_at as string | null) || null,
  });
  const dueAtMs = latestAction?.followup_due_at ? Date.parse(String(latestAction.followup_due_at)) : NaN;
  const isPending = latestAction?.outcome_status === "pending";
  const isDue = Number.isFinite(dueAtMs) && Date.now() >= dueAtMs;
  const shouldOpenAlert = Boolean(priorityScore >= 75 && isPending && isDue);

  const { data: openAlert } = await supabaseAdmin
    .from("human_smart_scan_alerts")
    .select("id")
    .eq("owner_member_id", ownerMemberId)
    .eq("contact_id", contactId)
    .eq("alert_type", "high_priority_no_response_48h")
    .eq("status", "open")
    .limit(1)
    .maybeSingle();

  if (shouldOpenAlert) {
    if (openAlert?.id) {
      await supabaseAdmin
        .from("human_smart_scan_alerts")
        .update({
          payload: {
            reason: "high_priority_no_response_48h",
            contact_name: contactName || null,
            priority_score: priorityScore,
            followup_due_at: latestAction?.followup_due_at || null,
          },
          updated_at: nowIso,
        })
        .eq("id", openAlert.id)
        .eq("owner_member_id", ownerMemberId);
      return;
    }

    await supabaseAdmin.from("human_smart_scan_alerts").insert({
      owner_member_id: ownerMemberId,
      contact_id: contactId,
      alert_type: "high_priority_no_response_48h",
      status: "open",
      payload: {
        reason: "high_priority_no_response_48h",
        contact_name: contactName || null,
        priority_score: priorityScore,
        followup_due_at: latestAction?.followup_due_at || null,
      },
      triggered_at: nowIso,
      updated_at: nowIso,
    });
    return;
  }

  await supabaseAdmin
    .from("human_smart_scan_alerts")
    .update({
      status: "resolved",
      resolved_at: nowIso,
      updated_at: nowIso,
    })
    .eq("owner_member_id", ownerMemberId)
    .eq("contact_id", contactId)
    .eq("alert_type", "high_priority_no_response_48h")
    .eq("status", "open");
}

async function upsertTodaySessionInternal(ownerMemberId: string): Promise<SessionRow | ResultError> {
  const supabaseAdmin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();

  const { data: existing, error: selectError } = await supabaseAdmin
    .from("human_smart_scan_daily_sessions")
    .select("id,owner_member_id,session_date,daily_goal,opportunities_activated,target_potential_eur,started_at,completed_at,metadata,created_at,updated_at")
    .eq("owner_member_id", ownerMemberId)
    .eq("session_date", today)
    .maybeSingle();
  if (selectError) return { error: selectError.message };
  if (existing) return existing as SessionRow;

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("human_smart_scan_daily_sessions")
    .insert({
      owner_member_id: ownerMemberId,
      session_date: today,
      daily_goal: 10,
      opportunities_activated: 0,
      target_potential_eur: 0,
      started_at: nowIso,
      updated_at: nowIso,
    })
    .select("id,owner_member_id,session_date,daily_goal,opportunities_activated,target_potential_eur,started_at,completed_at,metadata,created_at,updated_at")
    .single();
  if (insertError || !inserted) return { error: insertError?.message || "Impossible de créer la session du jour." };
  return inserted as SessionRow;
}

function computePriorityScore(input: ContactScoreInputs) {
  const trustScore =
    input.trustLevel === "family" ? 35 : input.trustLevel === "pro-close" ? 24 : input.trustLevel === "acquaintance" ? 10 : 0;
  const heatScore = input.heat === "brulant" ? 32 : input.heat === "tiede" ? 18 : input.heat === "froid" ? 6 : 0;
  const opportunityScore =
    input.opportunityChoice === "ideal-client"
      ? 30
      : input.opportunityChoice === "opens-doors"
        ? 24
        : input.opportunityChoice === "can-refer"
          ? 18
          : input.opportunityChoice === "can-buy"
            ? 14
            : input.opportunityChoice === "identified-need"
              ? 12
              : input.opportunityChoice === "no-potential"
                ? -20
                : 0;

  let recencyScore = 8;
  if (input.lastActionAt) {
    const days = Math.floor((Date.now() - Date.parse(input.lastActionAt)) / (24 * 60 * 60 * 1000));
    if (days <= 7) recencyScore = -4;
    else if (days <= 30) recencyScore = 0;
    else recencyScore = 6;
  }

  const total = trustScore + heatScore + opportunityScore + recencyScore;
  return Math.max(0, Math.min(100, Math.round(total)));
}

function computePotentialEur(input: ContactScoreInputs) {
  const gainBase =
    input.estimatedGain === "Eleve" ? 320 : input.estimatedGain === "Moyen" ? 180 : input.estimatedGain === "Faible" ? 75 : 95;
  const trustMultiplier =
    input.trustLevel === "family" ? 1.6 : input.trustLevel === "pro-close" ? 1.25 : input.trustLevel === "acquaintance" ? 0.85 : 1;
  const heatMultiplier = input.heat === "brulant" ? 1.4 : input.heat === "tiede" ? 1 : input.heat === "froid" ? 0.7 : 1;
  return Math.max(0, Math.round(gainBase * trustMultiplier * heatMultiplier));
}

async function computeDailyTargetPotential(ownerMemberId: string): Promise<number | null> {
  const supabaseAdmin = createAdminClient();
  const { data: contacts, error: contactsError } = await supabaseAdmin
    .from("human_smart_scan_contacts")
    .select("id,trust_level")
    .eq("owner_member_id", ownerMemberId)
    .limit(1000);

  if (contactsError) return null;
  const contactRows = (contacts as Array<Record<string, unknown>> | null) || [];
  if (contactRows.length === 0) return 0;

  const contactIds = contactRows.map((row) => String(row.id));
  const { data: qualifications } = await supabaseAdmin
    .from("human_smart_scan_qualifications")
    .select("contact_id,heat,opportunity_choice,estimated_gain")
    .eq("owner_member_id", ownerMemberId)
    .in("contact_id", contactIds);

  const { data: packageActions } = await supabaseAdmin
    .from("human_smart_scan_actions")
    .select("contact_id")
    .eq("owner_member_id", ownerMemberId)
    .eq("action_type", "package")
    .in("status", ["sent", "validated_without_send"])
    .in("contact_id", contactIds);

  const qualificationMap = new Map<string, Record<string, unknown>>();
  ((qualifications as Array<Record<string, unknown>> | null) || []).forEach((row) => {
    qualificationMap.set(String(row.contact_id), row);
  });
  const alreadyActivated = new Set<string>(((packageActions as Array<Record<string, unknown>> | null) || []).map((row) => String(row.contact_id)));

  const potentials = contactRows.map((contact) => {
    const contactId = String(contact.id);
    const trustLevel = toTrustLevelOutput((contact.trust_level as string | null) || null);
    const qual = qualificationMap.get(contactId);
    return {
      contactId,
      potential: alreadyActivated.has(contactId)
        ? 0
        : computePotentialEur({
            trustLevel,
            heat: (qual?.heat as SmartScanHeat | null) || null,
            opportunityChoice: (qual?.opportunity_choice as SmartScanOpportunityChoice | null) || null,
            estimatedGain: (qual?.estimated_gain as SmartScanEstimatedGain | null) || null,
            lastActionAt: null,
          }),
    };
  });

  const total = potentials
    .sort((a, b) => b.potential - a.potential)
    .slice(0, 10)
    .reduce((sum, row) => sum + row.potential, 0);
  return Math.max(0, Math.round(total));
}

async function incrementTodaySessionInternal(ownerMemberId: string): Promise<number | null> {
  const session = await upsertTodaySessionInternal(ownerMemberId);
  if ("error" in session) return null;

  const supabaseAdmin = createAdminClient();
  const nextActivated = (session.opportunities_activated || 0) + 1;
  const completedAt = nextActivated >= session.daily_goal ? new Date().toISOString() : null;

  await supabaseAdmin
    .from("human_smart_scan_daily_sessions")
    .update({
      opportunities_activated: nextActivated,
      completed_at: completedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.id)
    .eq("owner_member_id", ownerMemberId);

  return nextActivated;
}
