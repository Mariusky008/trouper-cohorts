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
export type SmartScanAlertType = "hot_ideal_unshared_24h";

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

type ResultError = { error: string };

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
  const shouldSetSentAt = input.status === "sent";
  const shouldSetValidatedAt = input.status === "validated_without_send";

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
      send_channel: input.sendChannel || "whatsapp",
      status: input.status,
      sent_at: shouldSetSentAt ? nowIso : null,
      validated_at: shouldSetValidatedAt ? nowIso : null,
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
  revalidateSmartScanPaths();
  return {
    success: true,
    actionId: inserted.id as string,
    contactId: resolved.id,
    opportunitiesActivated,
  };
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
      "id,contact_id,owner_member_id,action_type,message_draft,send_channel,status,sent_at,validated_at,created_at,updated_at,human_smart_scan_contacts!inner(full_name,city)"
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

  const contacts = ((data as Array<Record<string, unknown>> | null) || []).map((row) => ({
    ...row,
    trust_level: toTrustLevelOutput((row.trust_level as string | null) || null),
  }));
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
