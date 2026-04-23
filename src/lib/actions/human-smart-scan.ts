"use server";

import { revalidatePath } from "next/cache";
import { OpenAI } from "openai";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ensureHumanMemberForUserId } from "@/lib/actions/human-permissions";
import {
  smartScanFeatureFlags,
  type SmartScanAnalyticsEventType,
} from "@/lib/popey-human/smart-scan-config";

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
export type SmartScanMessageGenerationSource = "ai" | "fallback";

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
  contact_external_ref: string | null;
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

type SessionProgressMetadata = {
  queueIndex: number;
  queueSize: number;
  importedTotal?: number;
  updatedAt: string;
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

type SmartScanFollowupOpsStats = {
  copied_today: number;
  replied_today: number;
  converted_today: number;
  not_interested_today: number;
  ignored_today: number;
};
type SmartScanExternalClickStatsToday = {
  linkedin_today: number;
  whatsapp_group_today: number;
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

function sanitizeExternalClickTargetUrl(rawUrl: string): string {
  const trimmed = String(rawUrl || "").trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    // Minimize PII leakage in click logs: keep only origin + pathname.
    parsed.username = "";
    parsed.password = "";
    parsed.search = "";
    parsed.hash = "";
    const normalized = `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, "");
    return normalized.slice(0, 512);
  } catch {
    return trimmed.slice(0, 512);
  }
}

const SMART_SCAN_ANALYTICS_ALLOWED_METADATA_KEYS: Record<SmartScanAnalyticsEventType, string[]> = {
  contact_opened: ["sourcePanel", "hasTrustLevel", "externalContactRef"],
  trust_level_set: ["trustLevel", "contactId"],
  whatsapp_sent: ["actionType", "actionId", "contactId"],
  daily_goal_progressed: ["actionType", "opportunitiesActivated", "contactId"],
};
const SMART_SCAN_ANALYTICS_SUSPECT_KEY_PATTERN = /(phone|email|mail|name|full|prenom|nom|address|adresse|token|password|secret|message|notes?)/i;

function sanitizeSmartScanAnalyticsMetadata(
  eventType: SmartScanAnalyticsEventType,
  metadata?: Record<string, unknown> | null,
  clientEventId?: string | null
): Record<string, unknown> {
  const input = metadata || {};
  const allowedKeys = new Set(SMART_SCAN_ANALYTICS_ALLOWED_METADATA_KEYS[eventType] || []);
  const output: Record<string, unknown> = {};

  for (const key of Object.keys(input)) {
    if (!allowedKeys.has(key)) continue;
    const raw = input[key];
    if (typeof raw === "string") {
      output[key] = raw.trim().slice(0, 200);
      continue;
    }
    if (typeof raw === "number") {
      output[key] = Number.isFinite(raw) ? raw : 0;
      continue;
    }
    if (typeof raw === "boolean" || raw === null) {
      output[key] = raw;
    }
  }

  if (clientEventId) {
    output.clientEventId = String(clientEventId).trim().slice(0, 160);
  }
  return output;
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

async function requireCurrentAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return { error: "Session requise." } as const;

  const supabaseAdmin = createAdminClient();
  const { data: adminRow } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!adminRow?.user_id) return { error: "Acces admin requis." } as const;
  return { userId: user.id } as const;
}

async function logSmartScanAnalyticsEventInternal(input: {
  eventType: SmartScanAnalyticsEventType;
  metadata?: Record<string, unknown> | null;
  clientEventId?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return;

  const metadata = sanitizeSmartScanAnalyticsMetadata(input.eventType, input.metadata, input.clientEventId);

  if (input.clientEventId) {
    const { data: existingByClientEventId } = await supabase
      .from("analytics_events")
      .select("id")
      .eq("user_id", user.id)
      .eq("event_type", input.eventType)
      .eq("page", "/popey-human/smart-scan")
      .eq("metadata->>clientEventId", input.clientEventId)
      .limit(1)
      .maybeSingle();
    if (existingByClientEventId?.id) return;
  } else {
    const dedupSince = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: existingRecent } = await supabase
      .from("analytics_events")
      .select("id")
      .eq("user_id", user.id)
      .eq("event_type", input.eventType)
      .eq("page", "/popey-human/smart-scan")
      .eq("metadata", metadata)
      .gte("created_at", dedupSince)
      .limit(1)
      .maybeSingle();
    if (existingRecent?.id) return;
  }

  const { error } = await supabase.from("analytics_events").insert({
    user_id: user.id,
    event_type: input.eventType,
    metadata,
    page: "/popey-human/smart-scan",
    created_at: new Date().toISOString(),
  });
  if (error) {
    console.error("smart scan analytics event error:", error.message);
  }
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

function getStartOfUtcDayIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)).toISOString();
}

function getStartOfUtcDayDaysAgoIso(daysAgo: number) {
  const now = new Date();
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  base.setUTCDate(base.getUTCDate() - Math.max(0, Math.trunc(daysAgo)));
  return base.toISOString();
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

  await logSmartScanAnalyticsEventInternal({
    eventType: "trust_level_set",
    metadata: {
      ownerMemberId: currentMember.id,
      contactId: resolved.id,
      trustLevel: input.trustLevel,
    },
  });

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
  aiPromptVersion?: string | null;
  aiGeneratedAt?: string | null;
  aiGenerationSource?: SmartScanMessageGenerationSource | null;
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
      ai_prompt_version: input.aiPromptVersion || null,
      ai_generated_at: input.aiGeneratedAt || null,
      ai_generation_source: input.aiGenerationSource || null,
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

  if (input.status === "sent" && normalizedSendChannel === "whatsapp") {
    await logSmartScanAnalyticsEventInternal({
      eventType: "whatsapp_sent",
      metadata: {
        ownerMemberId: currentMember.id,
        contactId: resolved.id,
        actionType: input.actionType,
        actionId: inserted.id,
      },
    });
  }

  if (input.actionType !== "passer" && (input.status === "sent" || input.status === "validated_without_send")) {
    await logSmartScanAnalyticsEventInternal({
      eventType: "daily_goal_progressed",
      metadata: {
        ownerMemberId: currentMember.id,
        contactId: resolved.id,
        actionType: input.actionType,
        opportunitiesActivated,
      },
    });
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

export async function prepareSmartScanWhatsAppPayload(input: {
  contactId?: string;
  externalContactRef?: string;
  fullName?: string;
  city?: string | null;
  companyHint?: string | null;
  actionType: SmartScanActionType;
  messageDraft: string;
  phoneE164?: string | null;
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

  const message = (input.messageDraft || "").trim();
  if (!message) return { error: "Le message WhatsApp est requis." };

  const normalizedPhone = (input.phoneE164 || "33600000000").replace(/\D/g, "");
  if (!normalizedPhone || normalizedPhone.length < 8) {
    return { error: "Numero WhatsApp invalide." };
  }

  const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
  return {
    success: true,
    contactId: resolved.id,
    actionType: input.actionType,
    whatsappUrl,
    preparedAt: new Date().toISOString(),
  };
}

export async function updateSmartScanActionOutcome(input: {
  actionId: string;
  outcomeStatus: SmartScanActionOutcomeStatus;
  outcomeNotes?: string | null;
  clientEventId?: string | null;
}) {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) return { error: "Session requise." };

  const supabaseAdmin = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data: existing, error: selectError } = await supabaseAdmin
    .from("human_smart_scan_actions")
    .select("id,contact_id,outcome_status,outcome_notes")
    .eq("id", input.actionId)
    .eq("owner_member_id", currentMember.id)
    .maybeSingle();

  if (selectError || !existing?.id) {
    return { error: selectError?.message || "Action introuvable." };
  }

  const nextOutcomeNotes = input.outcomeNotes || null;
  if (
    String(existing.outcome_status || "") === String(input.outcomeStatus) &&
    String(existing.outcome_notes || "") === String(nextOutcomeNotes || "")
  ) {
    return {
      success: true,
      actionId: String(existing.id),
      outcomeStatus: input.outcomeStatus,
      deduped: true,
      dedupReason: input.clientEventId ? "client_event_id_same_payload" : "same_payload",
    };
  }

  const { error } = await supabaseAdmin
    .from("human_smart_scan_actions")
    .update({
      outcome_status: input.outcomeStatus,
      outcome_notes: nextOutcomeNotes,
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

function buildSmartScanFallbackMessage(input: {
  firstName: string;
  actionType: SmartScanActionType;
  trustLevel?: SmartScanTrustLevel | null;
  opportunityChoice?: SmartScanOpportunityChoice | null;
  communityTags?: string[];
}) {
  const communityTags = input.communityTags || [];
  const compliments: string[] = [];
  if (communityTags.includes("serious-work")) compliments.push("ton professionnalisme");
  if (communityTags.includes("fast-reply")) compliments.push("ta reactivite");
  if (communityTags.includes("reliable-partner")) compliments.push("le fait qu on puisse toujours compter sur toi");
  const complimentsLine = compliments.length > 0 ? `J apprecie vraiment ${compliments.join(" et ")}. ` : "";
  const trustLine =
    input.trustLevel === "family"
      ? "Comme on se connait tres bien, je te contacte en priorite. "
      : input.trustLevel === "pro-close"
        ? "On a deja bien collabore, donc je vais droit au but. "
        : input.trustLevel === "acquaintance"
          ? "On s est croises et je pense qu on peut creer de la valeur ensemble. "
          : "";

  if (input.actionType === "eclaireur") {
    return `Salut ${input.firstName}, ${complimentsLine}${trustLine}je lance un programme d apporteurs d affaires et je veux que tu en sois le premier beneficiaire. Si tu reperes une opportunite, je gere le reste et on partage la commission.`;
  }
  if (input.actionType === "package") {
    return `Salut ${input.firstName}, ${complimentsLine}${trustLine}j ai un pack Trio concret a te proposer. Si tu veux, je te fais une mise en relation rapide pour lancer un premier dossier sans friction.`;
  }
  if (input.actionType === "exclients") {
    return `Salut ${input.firstName}, ${complimentsLine}${trustLine}je prends de tes nouvelles car j ai une piste utile pour toi. Si tu veux, je t envoie une synthese claire en 2 minutes.`;
  }
  return `Salut ${input.firstName}, je te fais un retour rapide suite a notre dernier echange.`;
}

export async function generateSmartScanMessage(input: {
  contactName: string;
  actionType: SmartScanActionType;
  trustLevel?: SmartScanTrustLevel | null;
  opportunityChoice?: SmartScanOpportunityChoice | null;
  communityTags?: string[];
  city?: string | null;
  companyHint?: string | null;
}) {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) return { error: "Session requise." };
  const promptVersion = smartScanFeatureFlags.promptVersion;

  const firstName = (input.contactName || "Contact").split(" ")[0] || "Contact";
  const fallbackMessage = buildSmartScanFallbackMessage({
    firstName,
    actionType: input.actionType,
    trustLevel: input.trustLevel || null,
    opportunityChoice: input.opportunityChoice || null,
    communityTags: input.communityTags || [],
  });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      success: true,
      message: fallbackMessage,
      generationSource: "fallback" as SmartScanMessageGenerationSource,
      promptVersion,
      generatedAt: new Date().toISOString(),
    };
  }

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.65,
      messages: [
        {
          role: "system",
          content:
            "Tu rediges des messages WhatsApp business en francais, courts, humains, orientés action. 2-4 phrases max, pas de markdown, pas d emojis excessifs, pas de jargon.",
        },
        {
          role: "user",
          content: JSON.stringify({
            objectif: "Generer un message WhatsApp personnalise",
            prompt_version: promptVersion,
            contact: {
              prenom: firstName,
              nom: input.contactName,
              ville: input.city || null,
              societe: input.companyHint || null,
            },
            action: input.actionType,
            contexte_qualification: {
              trust_level: input.trustLevel || null,
              opportunity_choice: input.opportunityChoice || null,
              community_tags: input.communityTags || [],
              mapping: {
                serious_work: "ton professionnalisme",
                fast_reply: "ta reactivite",
                reliable_partner: "le fait qu on puisse toujours compter sur toi",
              },
            },
            contraintes: [
              "Ton amical et direct",
              "Clair, concret, orienté prochain pas",
              "Eviter les promesses vagues",
              "Conclure par une question simple",
            ],
          }),
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return {
        success: true,
        message: fallbackMessage,
        generationSource: "fallback" as SmartScanMessageGenerationSource,
        promptVersion,
        generatedAt: new Date().toISOString(),
      };
    }

    return {
      success: true,
      message: content,
      generationSource: "ai" as SmartScanMessageGenerationSource,
      promptVersion,
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return {
      success: true,
      message: fallbackMessage,
      generationSource: "fallback" as SmartScanMessageGenerationSource,
      promptVersion,
      generatedAt: new Date().toISOString(),
    };
  }
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

  const safeLimit = Math.max(1, Math.min(2000, Math.trunc(limit)));
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("human_smart_scan_actions")
    .select(
      "id,contact_id,owner_member_id,action_type,message_draft,send_channel,status,sent_at,validated_at,whatsapp_opened_at,template_version,followup_due_at,outcome_status,outcome_notes,created_at,updated_at,human_smart_scan_contacts!inner(full_name,city,external_contact_ref)"
    )
    .eq("owner_member_id", currentMember.id)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) return { error: error.message, actions: [] as SmartScanHistoryItem[] };

  const actions: SmartScanHistoryItem[] = ((data as Array<Record<string, unknown>> | null) || []).map((row) => {
    const contact = row.human_smart_scan_contacts as {
      full_name?: string;
      city?: string | null;
      external_contact_ref?: string | null;
    } | null;
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
      contact_external_ref: contact?.external_contact_ref || null,
    };
  });

  return { error: null as string | null, actions };
}

export async function listMySmartScanContacts(limit = 2000) {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) {
    return { error: "Session requise.", contacts: [] as Array<Record<string, unknown>> };
  }

  const safeLimit = Math.max(1, Math.min(5000, Math.trunc(limit)));
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("human_smart_scan_contacts")
    .select(
      "id,external_contact_ref,full_name,city,company_hint,is_favorite,is_eclaireur_active,eclaireur_activated_at,trust_level,trust_level_set_at,source,phone_e164,import_index,created_at,updated_at",
    )
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

export async function listMySmartScanQualifications(limit = 2000) {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) {
    return { error: "Session requise.", qualifications: [] as Array<Record<string, unknown>> };
  }

  const safeLimit = Math.max(1, Math.min(5000, Math.trunc(limit)));
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

export async function updateSmartScanFollowupJob(input: {
  actionId: string;
  decision: "copied" | "replied" | "converted" | "not_interested" | "ignored";
  note?: string | null;
  clientEventId?: string | null;
}) {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) return { error: "Session requise." };

  const supabaseAdmin = createAdminClient();
  const nowIso = new Date().toISOString();
  const decisionToEventType: Record<
    "copied" | "replied" | "converted" | "not_interested" | "ignored",
    "copied" | "marked_replied" | "marked_converted" | "marked_not_interested" | "ignored"
  > = {
    copied: "copied",
    replied: "marked_replied",
    converted: "marked_converted",
    not_interested: "marked_not_interested",
    ignored: "ignored",
  };
  const eventType = decisionToEventType[input.decision];
  const { data: actionRow, error: actionError } = await supabaseAdmin
    .from("human_smart_scan_actions")
    .select("id,contact_id,action_type,followup_due_at,status,outcome_status")
    .eq("id", input.actionId)
    .eq("owner_member_id", currentMember.id)
    .maybeSingle();
  if (actionError || !actionRow?.id) {
    return { error: actionError?.message || "Action introuvable." };
  }

  const { data: contactRow } = await supabaseAdmin
    .from("human_smart_scan_contacts")
    .select("full_name")
    .eq("id", String(actionRow.contact_id))
    .eq("owner_member_id", currentMember.id)
    .maybeSingle();

  const contactName = String(contactRow?.full_name || "Contact");
  const isTransitionDecision = input.decision !== "copied";
  if (isTransitionDecision && actionRow.status !== "sent") {
    return { error: "Transition invalide: action non envoyee sur WhatsApp." };
  }

  if (input.clientEventId) {
    const { data: existingByClientEventId } = await supabaseAdmin
      .from("human_smart_scan_followup_job_events")
      .select("id")
      .eq("owner_member_id", currentMember.id)
      .eq("action_id", String(actionRow.id))
      .eq("event_type", eventType)
      .eq("metadata->>clientEventId", input.clientEventId)
      .limit(1)
      .maybeSingle();
    if (existingByClientEventId?.id) {
      return { success: true, actionId: String(actionRow.id), decision: input.decision, deduped: true };
    }
  } else {
    const dedupSince = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: recentSameEvent } = await supabaseAdmin
      .from("human_smart_scan_followup_job_events")
      .select("id")
      .eq("owner_member_id", currentMember.id)
      .eq("action_id", String(actionRow.id))
      .eq("event_type", eventType)
      .gte("created_at", dedupSince)
      .limit(1)
      .maybeSingle();
    if (recentSameEvent?.id) {
      return { success: true, actionId: String(actionRow.id), decision: input.decision, deduped: true };
    }
  }

  const actionUpdatePayload =
    input.decision === "replied"
      ? {
          outcome_status: "replied" as const,
          followup_due_at: null,
          outcome_notes: input.note || null,
          updated_at: nowIso,
        }
      : input.decision === "converted"
        ? {
            outcome_status: "converted" as const,
            followup_due_at: null,
            outcome_notes: input.note || null,
            updated_at: nowIso,
          }
        : input.decision === "not_interested"
          ? {
              outcome_status: "not_interested" as const,
              followup_due_at: null,
              outcome_notes: input.note || null,
              updated_at: nowIso,
            }
          : input.decision === "ignored"
            ? {
                followup_due_at: null,
                updated_at: nowIso,
              }
            : null;

  const nextJobStatus = input.decision === "ignored" ? "cancelled" : input.decision === "copied" ? "queued" : "processed";
  const { error: upsertError } = await supabaseAdmin
    .from("human_smart_scan_followup_jobs")
    .upsert(
      {
        action_id: String(actionRow.id),
        owner_member_id: currentMember.id,
        contact_id: String(actionRow.contact_id),
        job_type: "auto_followup_48h",
        status: nextJobStatus,
        suggested_message: buildFollowupSuggestion(contactName, actionRow.action_type as SmartScanActionType),
        scheduled_for: String(actionRow.followup_due_at || nowIso),
        processed_at: nextJobStatus === "processed" ? nowIso : null,
        updated_at: nowIso,
      },
      { onConflict: "action_id,job_type" }
    );
  if (upsertError) return { error: upsertError.message };

  if (actionUpdatePayload) {
    const { error: updateActionError } = await supabaseAdmin
      .from("human_smart_scan_actions")
      .update(actionUpdatePayload)
      .eq("id", String(actionRow.id))
      .eq("owner_member_id", currentMember.id);
    if (updateActionError) return { error: updateActionError.message };
  }

  const { data: jobRow } = await supabaseAdmin
    .from("human_smart_scan_followup_jobs")
    .select("id")
    .eq("action_id", String(actionRow.id))
    .eq("owner_member_id", currentMember.id)
    .eq("job_type", "auto_followup_48h")
    .maybeSingle();

  await supabaseAdmin.from("human_smart_scan_followup_job_events").insert({
    job_id: jobRow?.id || null,
    action_id: String(actionRow.id),
    owner_member_id: currentMember.id,
    contact_id: String(actionRow.contact_id),
    operator_member_id: currentMember.id,
    event_type: eventType,
    metadata: {
      decision: input.decision,
      clientEventId: input.clientEventId || null,
      action_type: actionRow.action_type,
      note_present: Boolean(input.note && String(input.note).trim().length > 0),
      note_length: Math.min(2000, String(input.note || "").trim().length),
      previous_outcome_status: actionRow.outcome_status || null,
      next_outcome_status:
        input.decision === "replied"
          ? "replied"
          : input.decision === "converted"
            ? "converted"
            : input.decision === "not_interested"
              ? "not_interested"
              : actionRow.outcome_status || null,
    },
  });

  await syncHighPriorityNoResponseAlertForContact(currentMember.id, String(actionRow.contact_id), contactName);
  revalidateSmartScanPaths();
  return {
    success: true,
    actionId: String(actionRow.id),
    decision: input.decision,
    outcomeStatus:
      input.decision === "replied"
        ? "replied"
        : input.decision === "converted"
          ? "converted"
          : input.decision === "not_interested"
            ? "not_interested"
            : null,
  };
}

export async function getSmartScanFollowupOpsStatsToday() {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) {
    return { error: "Session requise.", stats: null as SmartScanFollowupOpsStats | null };
  }

  const supabaseAdmin = createAdminClient();
  const since = getStartOfUtcDayIso();
  const { data, error } = await supabaseAdmin
    .from("human_smart_scan_followup_job_events")
    .select("event_type")
    .eq("owner_member_id", currentMember.id)
    .gte("created_at", since)
    .limit(5000);
  if (error) return { error: error.message, stats: null as SmartScanFollowupOpsStats | null };

  const rows = (data as Array<Record<string, unknown>> | null) || [];
  const counters: SmartScanFollowupOpsStats = {
    copied_today: 0,
    replied_today: 0,
    converted_today: 0,
    not_interested_today: 0,
    ignored_today: 0,
  };
  rows.forEach((row) => {
    const type = String(row.event_type || "");
    if (type === "copied") counters.copied_today += 1;
    if (type === "marked_replied") counters.replied_today += 1;
    if (type === "marked_converted") counters.converted_today += 1;
    if (type === "marked_not_interested") counters.not_interested_today += 1;
    if (type === "ignored") counters.ignored_today += 1;
  });

  return { error: null as string | null, stats: counters };
}

export async function logSmartScanExternalClick(input: {
  source: "linkedin" | "whatsapp_group";
  targetUrl: string;
  context?: "cockpit" | "profile" | "other";
  clientEventId?: string | null;
}) {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) return { error: "Session requise." };

  const supabaseAdmin = createAdminClient();
  const sanitizedTargetUrl = sanitizeExternalClickTargetUrl(input.targetUrl);
  if (!sanitizedTargetUrl) return { error: "URL cible invalide." };
  const dedupSince = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const { data: existingRecent } = await supabaseAdmin
    .from("human_smart_scan_external_click_events")
    .select("id")
    .eq("owner_member_id", currentMember.id)
    .eq("source", input.source)
    .eq("target_url", sanitizedTargetUrl)
    .eq("context", input.context || "cockpit")
    .gte("created_at", dedupSince)
    .limit(1)
    .maybeSingle();
  if (existingRecent?.id) return { success: true, deduped: true };

  const { error } = await supabaseAdmin.from("human_smart_scan_external_click_events").insert({
    owner_member_id: currentMember.id,
    source: input.source,
    target_url: sanitizedTargetUrl,
    context: input.context || "cockpit",
  });
  if (error) return { error: error.message };

  revalidateSmartScanPaths();
  return { success: true };
}

export async function logSmartScanAnalyticsEvent(input: {
  eventType: SmartScanAnalyticsEventType;
  metadata?: Record<string, unknown> | null;
  clientEventId?: string | null;
}) {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) return { error: "Session requise." };

  await logSmartScanAnalyticsEventInternal({
    eventType: input.eventType,
    metadata: input.metadata || {},
    clientEventId: input.clientEventId || null,
  });

  return { success: true };
}

export async function getSmartScanExternalClickStatsToday() {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) {
    return { error: "Session requise.", stats: null as SmartScanExternalClickStatsToday | null };
  }

  const supabaseAdmin = createAdminClient();
  const since = getStartOfUtcDayIso();
  const { data, error } = await supabaseAdmin
    .from("human_smart_scan_external_click_events")
    .select("source")
    .eq("owner_member_id", currentMember.id)
    .gte("created_at", since)
    .limit(5000);
  if (error) return { error: error.message, stats: null as SmartScanExternalClickStatsToday | null };

  const rows = (data as Array<Record<string, unknown>> | null) || [];
  const stats: SmartScanExternalClickStatsToday = {
    linkedin_today: 0,
    whatsapp_group_today: 0,
  };
  rows.forEach((row) => {
    const source = String(row.source || "");
    if (source === "linkedin") stats.linkedin_today += 1;
    if (source === "whatsapp_group") stats.whatsapp_group_today += 1;
  });

  return { error: null as string | null, stats };
}

export async function getSmartScanAdminDailyAnalytics(days = 14) {
  const auth = await requireCurrentAdminUser();
  if ("error" in auth) {
    return { error: auth.error, days: 0, daily: [] as Array<Record<string, unknown>> };
  }

  const safeDays = Math.max(1, Math.min(90, Math.trunc(days)));
  const since = getStartOfUtcDayDaysAgoIso(safeDays - 1);
  const supabaseAdmin = createAdminClient();

  const [actionsRes, qualificationsRes, followupRes, externalRes, analyticsRes] = await Promise.all([
    supabaseAdmin
      .from("human_smart_scan_actions")
      .select("created_at,status,outcome_status")
      .gte("created_at", since)
      .limit(100000),
    supabaseAdmin.from("human_smart_scan_qualifications").select("created_at").gte("created_at", since).limit(100000),
    supabaseAdmin.from("human_smart_scan_followup_job_events").select("created_at,event_type").gte("created_at", since).limit(100000),
    supabaseAdmin.from("human_smart_scan_external_click_events").select("created_at,source").gte("created_at", since).limit(100000),
    supabaseAdmin
      .from("analytics_events")
      .select("created_at,event_type")
      .eq("page", "/popey-human/smart-scan")
      .gte("created_at", since)
      .limit(100000),
  ]);

  const firstError = [actionsRes.error, qualificationsRes.error, followupRes.error, externalRes.error, analyticsRes.error].find(Boolean);
  if (firstError) {
    return { error: firstError.message, days: safeDays, daily: [] as Array<Record<string, unknown>> };
  }

  const byDay = new Map<string, Record<string, number | string>>();
  const getDayBucket = (raw: unknown) => {
    const iso = String(raw || "");
    const day = iso.slice(0, 10);
    const key = /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : new Date().toISOString().slice(0, 10);
    if (!byDay.has(key)) {
      byDay.set(key, {
        day: key,
        actions_total: 0,
        actions_sent: 0,
        actions_validated_without_send: 0,
        outcomes_replied: 0,
        outcomes_converted: 0,
        outcomes_not_interested: 0,
        qualifications_total: 0,
        followup_copied: 0,
        followup_replied: 0,
        followup_converted: 0,
        followup_not_interested: 0,
        followup_ignored: 0,
        external_click_linkedin: 0,
        external_click_whatsapp_group: 0,
        analytics_contact_opened: 0,
        analytics_trust_level_set: 0,
        analytics_whatsapp_sent: 0,
        analytics_daily_goal_progressed: 0,
      });
    }
    return byDay.get(key)!;
  };

  ((actionsRes.data as Array<Record<string, unknown>> | null) || []).forEach((row) => {
    const bucket = getDayBucket(row.created_at);
    bucket.actions_total = Number(bucket.actions_total) + 1;
    const status = String(row.status || "");
    if (status === "sent") bucket.actions_sent = Number(bucket.actions_sent) + 1;
    if (status === "validated_without_send") {
      bucket.actions_validated_without_send = Number(bucket.actions_validated_without_send) + 1;
    }
    const outcome = String(row.outcome_status || "");
    if (outcome === "replied") bucket.outcomes_replied = Number(bucket.outcomes_replied) + 1;
    if (outcome === "converted") bucket.outcomes_converted = Number(bucket.outcomes_converted) + 1;
    if (outcome === "not_interested") bucket.outcomes_not_interested = Number(bucket.outcomes_not_interested) + 1;
  });

  ((qualificationsRes.data as Array<Record<string, unknown>> | null) || []).forEach((row) => {
    const bucket = getDayBucket(row.created_at);
    bucket.qualifications_total = Number(bucket.qualifications_total) + 1;
  });

  ((followupRes.data as Array<Record<string, unknown>> | null) || []).forEach((row) => {
    const bucket = getDayBucket(row.created_at);
    const type = String(row.event_type || "");
    if (type === "copied") bucket.followup_copied = Number(bucket.followup_copied) + 1;
    if (type === "marked_replied") bucket.followup_replied = Number(bucket.followup_replied) + 1;
    if (type === "marked_converted") bucket.followup_converted = Number(bucket.followup_converted) + 1;
    if (type === "marked_not_interested") bucket.followup_not_interested = Number(bucket.followup_not_interested) + 1;
    if (type === "ignored") bucket.followup_ignored = Number(bucket.followup_ignored) + 1;
  });

  ((externalRes.data as Array<Record<string, unknown>> | null) || []).forEach((row) => {
    const bucket = getDayBucket(row.created_at);
    const source = String(row.source || "");
    if (source === "linkedin") bucket.external_click_linkedin = Number(bucket.external_click_linkedin) + 1;
    if (source === "whatsapp_group") bucket.external_click_whatsapp_group = Number(bucket.external_click_whatsapp_group) + 1;
  });

  ((analyticsRes.data as Array<Record<string, unknown>> | null) || []).forEach((row) => {
    const bucket = getDayBucket(row.created_at);
    const type = String(row.event_type || "");
    if (type === "contact_opened") bucket.analytics_contact_opened = Number(bucket.analytics_contact_opened) + 1;
    if (type === "trust_level_set") bucket.analytics_trust_level_set = Number(bucket.analytics_trust_level_set) + 1;
    if (type === "whatsapp_sent") bucket.analytics_whatsapp_sent = Number(bucket.analytics_whatsapp_sent) + 1;
    if (type === "daily_goal_progressed") bucket.analytics_daily_goal_progressed = Number(bucket.analytics_daily_goal_progressed) + 1;
  });

  const daily = Array.from(byDay.values()).sort((a, b) => String(a.day).localeCompare(String(b.day)));
  return { error: null as string | null, days: safeDays, daily };
}

export async function getSmartScanAdminPiiAudit(days = 30) {
  const auth = await requireCurrentAdminUser();
  if ("error" in auth) {
    return {
      error: auth.error,
      days: 0,
      scanned: 0,
      suspect: 0,
      byEventType: [] as Array<Record<string, unknown>>,
      samples: [] as Array<Record<string, unknown>>,
    };
  }

  const safeDays = Math.max(1, Math.min(120, Math.trunc(days)));
  const since = getStartOfUtcDayDaysAgoIso(safeDays - 1);
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("analytics_events")
    .select("id,created_at,event_type,metadata")
    .eq("page", "/popey-human/smart-scan")
    .gte("created_at", since)
    .limit(100000);
  if (error) {
    return {
      error: error.message,
      days: safeDays,
      scanned: 0,
      suspect: 0,
      byEventType: [] as Array<Record<string, unknown>>,
      samples: [] as Array<Record<string, unknown>>,
    };
  }

  const rows = (data as Array<Record<string, unknown>> | null) || [];
  const perEvent = new Map<string, { total: number; suspect: number; disallowedKeys: number; suspiciousKeyNames: number }>();
  const samples: Array<Record<string, unknown>> = [];
  let suspect = 0;

  rows.forEach((row) => {
    const eventType = String(row.event_type || "");
    const metadataRaw = row.metadata;
    const metadata =
      metadataRaw && typeof metadataRaw === "object" && !Array.isArray(metadataRaw)
        ? (metadataRaw as Record<string, unknown>)
        : {};
    const keys = Object.keys(metadata);
    const allowedKeys = new Set((SMART_SCAN_ANALYTICS_ALLOWED_METADATA_KEYS as Record<string, string[]>)[eventType] || []);
    const disallowed = keys.filter((key) => !allowedKeys.has(key) && key !== "clientEventId");
    const suspiciousByName = keys.filter((key) => SMART_SCAN_ANALYTICS_SUSPECT_KEY_PATTERN.test(key));
    const isSuspect = disallowed.length > 0 || suspiciousByName.length > 0;

    const bucket = perEvent.get(eventType) || { total: 0, suspect: 0, disallowedKeys: 0, suspiciousKeyNames: 0 };
    bucket.total += 1;
    bucket.disallowedKeys += disallowed.length;
    bucket.suspiciousKeyNames += suspiciousByName.length;
    if (isSuspect) bucket.suspect += 1;
    perEvent.set(eventType, bucket);

    if (isSuspect) {
      suspect += 1;
      if (samples.length < 25) {
        samples.push({
          id: String(row.id || ""),
          createdAt: String(row.created_at || ""),
          eventType,
          keys,
          disallowedKeys: disallowed,
          suspiciousKeyNames: suspiciousByName,
        });
      }
    }
  });

  const byEventType = Array.from(perEvent.entries())
    .map(([eventType, stats]) => ({
      eventType,
      total: stats.total,
      suspect: stats.suspect,
      suspectRate: stats.total > 0 ? Number((stats.suspect / stats.total).toFixed(4)) : 0,
      disallowedKeys: stats.disallowedKeys,
      suspiciousKeyNames: stats.suspiciousKeyNames,
    }))
    .sort((a, b) => b.suspect - a.suspect || b.total - a.total);

  return {
    error: null as string | null,
    days: safeDays,
    scanned: rows.length,
    suspect,
    byEventType,
    samples,
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

function readSessionProgressMetadata(metadata: unknown): SessionProgressMetadata | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>).smartScanProgress;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const queueIndex = Number((value as Record<string, unknown>).queueIndex);
  const queueSize = Number((value as Record<string, unknown>).queueSize);
  const importedTotalRaw = (value as Record<string, unknown>).importedTotal;
  const importedTotal = importedTotalRaw === undefined ? undefined : Number(importedTotalRaw);
  const updatedAt = String((value as Record<string, unknown>).updatedAt || "");
  if (!Number.isFinite(queueIndex) || !Number.isFinite(queueSize)) return null;
  if (queueIndex < 0 || queueSize <= 0) return null;
  return {
    queueIndex: Math.round(queueIndex),
    queueSize: Math.round(queueSize),
    importedTotal: Number.isFinite(importedTotal) ? Math.max(0, Math.round(importedTotal as number)) : undefined,
    updatedAt,
  };
}

export async function saveSmartScanSessionProgress(input: {
  queueIndex: number;
  queueSize: number;
  importedTotal?: number;
}) {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) return { error: "Session requise." };

  const session = await upsertTodaySessionInternal(currentMember.id);
  if ("error" in session) return { error: session.error };

  const nowIso = new Date().toISOString();
  const existingMetadata =
    session.metadata && typeof session.metadata === "object" && !Array.isArray(session.metadata)
      ? (session.metadata as Record<string, unknown>)
      : {};
  const nextProgress: SessionProgressMetadata = {
    queueIndex: Math.max(0, Math.round(input.queueIndex)),
    queueSize: Math.max(1, Math.round(input.queueSize)),
    importedTotal: input.importedTotal === undefined ? undefined : Math.max(0, Math.round(input.importedTotal)),
    updatedAt: nowIso,
  };
  const nextMetadata = {
    ...existingMetadata,
    smartScanProgress: nextProgress,
  };

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("human_smart_scan_daily_sessions")
    .update({
      metadata: nextMetadata,
      updated_at: nowIso,
    })
    .eq("id", session.id)
    .eq("owner_member_id", currentMember.id);
  if (error) return { error: error.message };

  return { success: true as const, progress: nextProgress };
}

export async function importSmartScanContacts(input: {
  source: "file" | "direct-picker";
  contacts: Array<{
    externalContactRef: string;
    fullName: string;
    city?: string | null;
    companyHint?: string | null;
    phoneE164?: string | null;
    importIndex?: number;
  }>;
}) {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) return { error: "Session requise." };
  if (!Array.isArray(input.contacts) || input.contacts.length === 0) {
    return { error: "Aucun contact a importer." };
  }

  const batchId = `batch-${Date.now()}`;
  const nowIso = new Date().toISOString();
  const supabaseAdmin = createAdminClient();
  const payload = input.contacts.map((contact, idx) => ({
    owner_member_id: currentMember.id,
    external_contact_ref: String(contact.externalContactRef).trim().slice(0, 160),
    full_name: String(contact.fullName).trim().slice(0, 160),
    city: contact.city ? String(contact.city).trim().slice(0, 120) : null,
    company_hint: contact.companyHint ? String(contact.companyHint).trim().slice(0, 160) : null,
    phone_e164: contact.phoneE164 ? String(contact.phoneE164).trim().slice(0, 32) : null,
    source: input.source === "file" ? "import_file" : "import_picker",
    import_batch_id: batchId,
    import_index: Math.max(0, Math.round(contact.importIndex ?? idx)),
    last_imported_at: nowIso,
    updated_at: nowIso,
  }));

  const { error } = await supabaseAdmin
    .from("human_smart_scan_contacts")
    .upsert(payload, { onConflict: "owner_member_id,external_contact_ref" });
  if (error) return { error: error.message };

  const session = await upsertTodaySessionInternal(currentMember.id);
  if (!("error" in session)) {
    const existingMetadata =
      session.metadata && typeof session.metadata === "object" && !Array.isArray(session.metadata)
        ? (session.metadata as Record<string, unknown>)
        : {};
    await supabaseAdmin
      .from("human_smart_scan_daily_sessions")
      .update({
        metadata: {
          ...existingMetadata,
          smartScanProgress: {
            queueIndex: 0,
            queueSize: 10,
            importedTotal: input.contacts.length,
            updatedAt: nowIso,
          },
        },
        updated_at: nowIso,
      })
      .eq("id", session.id)
      .eq("owner_member_id", currentMember.id);
  }

  return { success: true as const, imported: input.contacts.length };
}

export async function getSmartScanSessionProgress() {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) return { error: "Session requise.", progress: null as SessionProgressMetadata | null };
  const session = await upsertTodaySessionInternal(currentMember.id);
  if ("error" in session) return { error: session.error, progress: null as SessionProgressMetadata | null };
  return { error: null as string | null, progress: readSessionProgressMetadata(session.metadata) };
}

export async function clearImportedSmartScanContacts() {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) return { error: "Session requise." };
  const supabaseAdmin = createAdminClient();
  const nowIso = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("human_smart_scan_contacts")
    .delete()
    .eq("owner_member_id", currentMember.id)
    .in("source", ["import_file", "import_picker"]);
  if (error) return { error: error.message };

  const session = await upsertTodaySessionInternal(currentMember.id);
  if (!("error" in session)) {
    const existingMetadata =
      session.metadata && typeof session.metadata === "object" && !Array.isArray(session.metadata)
        ? (session.metadata as Record<string, unknown>)
        : {};
    await supabaseAdmin
      .from("human_smart_scan_daily_sessions")
      .update({
        metadata: {
          ...existingMetadata,
          smartScanProgress: {
            queueIndex: 0,
            queueSize: 10,
            importedTotal: 0,
            updatedAt: nowIso,
          },
        },
        updated_at: nowIso,
      })
      .eq("id", session.id)
      .eq("owner_member_id", currentMember.id);
  }
  return { success: true as const };
}

export async function promoteContactToEclaireur(input: {
  contactId?: string;
  externalContactRef?: string;
  fullName?: string;
  city?: string | null;
  companyHint?: string | null;
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

  const nowIso = new Date().toISOString();
  const supabaseAdmin = createAdminClient();
  const { error: updateError } = await supabaseAdmin
    .from("human_smart_scan_contacts")
    .update({
      is_eclaireur_active: true,
      eclaireur_activated_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", resolved.id)
    .eq("owner_member_id", currentMember.id);
  if (updateError) return { error: updateError.message };

  await supabaseAdmin.from("human_smart_scan_eclaireur_events").insert({
    owner_member_id: currentMember.id,
    contact_id: resolved.id,
    event_type: "promoted",
    amount_eur: 0,
    metadata: { source: "history" },
    updated_at: nowIso,
  });

  return { success: true as const, contactId: resolved.id };
}

export async function removeContactFromEclaireurs(input: {
  contactId?: string;
  externalContactRef?: string;
  fullName?: string;
  city?: string | null;
  companyHint?: string | null;
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

  const nowIso = new Date().toISOString();
  const supabaseAdmin = createAdminClient();
  const { error: updateError } = await supabaseAdmin
    .from("human_smart_scan_contacts")
    .update({
      is_eclaireur_active: false,
      updated_at: nowIso,
    })
    .eq("id", resolved.id)
    .eq("owner_member_id", currentMember.id);
  if (updateError) return { error: updateError.message };

  await supabaseAdmin.from("human_smart_scan_eclaireur_events").insert({
    owner_member_id: currentMember.id,
    contact_id: resolved.id,
    event_type: "removed",
    amount_eur: 0,
    metadata: { source: "smart_scan_panel" },
    updated_at: nowIso,
  });

  return { success: true as const, contactId: resolved.id };
}

export async function listMyEclaireurs(limit = 300) {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember) return { error: "Session requise.", eclaireurs: [] as Array<Record<string, unknown>> };
  const safeLimit = Math.max(1, Math.min(1000, Math.trunc(limit)));
  const supabaseAdmin = createAdminClient();
  const { data: contacts, error } = await supabaseAdmin
    .from("human_smart_scan_contacts")
    .select("id,external_contact_ref,full_name,city,company_hint,eclaireur_activated_at,updated_at")
    .eq("owner_member_id", currentMember.id)
    .eq("is_eclaireur_active", true)
    .order("eclaireur_activated_at", { ascending: false })
    .limit(safeLimit);
  if (error) return { error: error.message, eclaireurs: [] as Array<Record<string, unknown>> };

  const rows = (contacts as Array<Record<string, unknown>> | null) || [];
  const contactIds = rows.map((row) => String(row.id));
  const statsMap = new Map<string, { leads_detected: number; leads_signed: number; commission_total_eur: number }>();
  const lastWhatsAppSentAtMap = new Map<string, string>();
  if (contactIds.length > 0) {
    const { data: events } = await supabaseAdmin
      .from("human_smart_scan_eclaireur_events")
      .select("contact_id,event_type,amount_eur")
      .eq("owner_member_id", currentMember.id)
      .in("contact_id", contactIds)
      .limit(5000);
    ((events as Array<Record<string, unknown>> | null) || []).forEach((eventRow) => {
      const contactId = String(eventRow.contact_id);
      const entry = statsMap.get(contactId) || { leads_detected: 0, leads_signed: 0, commission_total_eur: 0 };
      const eventType = String(eventRow.event_type || "");
      if (eventType === "lead_detected") entry.leads_detected += 1;
      if (eventType === "lead_signed") entry.leads_signed += 1;
      if (eventType === "commission_paid") {
        const amount = Number(eventRow.amount_eur || 0);
        if (Number.isFinite(amount)) entry.commission_total_eur += amount;
      }
      statsMap.set(contactId, entry);
    });

    const { data: whatsappActions } = await supabaseAdmin
      .from("human_smart_scan_actions")
      .select("contact_id,sent_at,created_at")
      .eq("owner_member_id", currentMember.id)
      .eq("status", "sent")
      .eq("send_channel", "whatsapp")
      .in("contact_id", contactIds)
      .order("created_at", { ascending: false })
      .limit(5000);
    ((whatsappActions as Array<Record<string, unknown>> | null) || []).forEach((actionRow) => {
      const contactId = String(actionRow.contact_id || "");
      if (!contactId || lastWhatsAppSentAtMap.has(contactId)) return;
      const source = String(actionRow.sent_at || actionRow.created_at || "");
      if (!source) return;
      lastWhatsAppSentAtMap.set(contactId, source);
    });
  }

  return {
    error: null as string | null,
    eclaireurs: rows.map((row) => {
      const contactId = String(row.id);
      const stats = statsMap.get(contactId) || { leads_detected: 0, leads_signed: 0, commission_total_eur: 0 };
      return {
        ...row,
        leads_detected: stats.leads_detected,
        leads_signed: stats.leads_signed,
        commission_total_eur: Math.round(stats.commission_total_eur),
        last_whatsapp_sent_at: lastWhatsAppSentAtMap.get(contactId) || null,
      };
    }),
  };
}

export async function getEclaireurMessageTemplates(input: { contactName: string; metier?: string | null }) {
  const firstName = String(input.contactName || "Partenaire").trim().split(" ")[0] || "Partenaire";
  const metier = String(input.metier || "complementaires").trim() || "complementaires";
  return {
    error: null as string | null,
    templates: [
      {
        id: "quoi-de-neuf",
        label: "Quoi de neuf ?",
        message: `Salut ${firstName}, ca fait un mois ! Des nouveaux projets dans ton entourage en ce moment ?`,
      },
      {
        id: "recompense",
        label: "Recompense",
        message: `Merci pour la mise en relation ! C est signe, je t envoie ta commission des que je recois le virement.`,
      },
      {
        id: "briefing",
        label: "Briefing",
        message: `Ce mois-ci avec mon Trio, on cherche surtout des profils ${metier}. Si tu entends parler de quelque chose, pense a moi !`,
      },
    ],
  };
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
