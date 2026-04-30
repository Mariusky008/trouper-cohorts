"use server";

import { ensureHumanMemberForUserId } from "@/lib/actions/human-permissions";
import { whatsappMetaConfig, isWhatsAppMetaConfigured } from "@/lib/popey-human/whatsapp-meta-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type QueueStatus = "queued" | "scheduled" | "sending" | "sent" | "delivered" | "read" | "failed" | "cancelled" | "blocked";
type InboundClassification = "positive" | "negative" | "stop" | "neutral";

type QueueRow = {
  id: string;
  owner_member_id: string;
  phone_e164: string;
  template_name: string;
  language_code: string;
  vars: string[];
  quick_reply_payload: string[];
  source: string;
  metadata: Record<string, unknown> | null;
  status: QueueStatus;
  attempt_count: number;
  max_attempts: number;
  not_before_at: string;
  provider_message_id: string | null;
  sent_at: string | null;
};

type IncomingMetaWebhookPayload = Record<string, unknown>;
type MetaQualitySnapshot = {
  qualityRating: string | null;
  throughputLevel: string | null;
  codeVerificationStatus: string | null;
  displayPhoneNumber: string | null;
};

function normalizePhone(raw: string | null | undefined): string {
  const value = String(raw || "").trim();
  if (!value) return "";
  const clean = value.replace(/[^\d+]/g, "");
  if (!clean) return "";
  if (clean.startsWith("+")) return clean.slice(0, 24);
  if (clean.startsWith("00")) return `+${clean.slice(2, 24)}`;
  if (clean.startsWith("0")) return `+33${clean.slice(1, 24)}`;
  return `+${clean.slice(0, 24)}`;
}

function toMetaPhoneDigits(phoneE164: string): string {
  return phoneE164.replace(/[^\d]/g, "");
}

function randomInt(min: number, max: number): number {
  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
}

function sanitizeVars(input: string[] | undefined): string[] {
  return (Array.isArray(input) ? input : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 20);
}

function classifyInboundText(message: string): InboundClassification {
  const normalized = String(message || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  if (!normalized) return "neutral";
  if (/\b(stop|arret|arretez|desinscri|unsubscribe)\b/.test(normalized)) return "stop";
  if (/\b(oui|ok|interesse|interessee|partant|go|avec plaisir)\b/.test(normalized)) return "positive";
  if (/\b(non|pas interesse|pas interessee|pas pour le moment)\b/.test(normalized)) return "negative";
  return "neutral";
}

function buildTemplateBodyParams(vars: string[]): Array<{ type: "text"; text: string }> {
  return vars.map((value) => ({ type: "text", text: value }));
}

function extractInboundText(message: Record<string, unknown>): string {
  const type = String(message.type || "").trim();
  if (type === "text") {
    const text = (message.text || {}) as Record<string, unknown>;
    return String(text.body || "").trim();
  }
  if (type === "button") {
    const button = (message.button || {}) as Record<string, unknown>;
    return String(button.text || button.payload || "").trim();
  }
  if (type === "interactive") {
    const interactive = (message.interactive || {}) as Record<string, unknown>;
    const buttonReply = (interactive.button_reply || {}) as Record<string, unknown>;
    const listReply = (interactive.list_reply || {}) as Record<string, unknown>;
    return String(buttonReply.title || buttonReply.id || listReply.title || listReply.id || "").trim();
  }
  return "";
}

function extractButtonPayload(message: Record<string, unknown>): string | null {
  const type = String(message.type || "").trim();
  if (type === "button") {
    const button = (message.button || {}) as Record<string, unknown>;
    const payload = String(button.payload || "").trim();
    return payload || null;
  }
  if (type === "interactive") {
    const interactive = (message.interactive || {}) as Record<string, unknown>;
    const buttonReply = (interactive.button_reply || {}) as Record<string, unknown>;
    const payload = String(buttonReply.id || "").trim();
    return payload || null;
  }
  return null;
}

function computeQualityAlert(qualityRating: string | null): boolean {
  const normalized = String(qualityRating || "").trim().toUpperCase();
  if (!normalized) return false;
  return normalized === "LOW" || normalized === "YELLOW" || normalized === "RED";
}

async function getCurrentHumanMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return null;
  return ensureHumanMemberForUserId(user.id);
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

async function resolveOwnerMemberId(ownerMemberId?: string) {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember?.id) return { error: "Session requise." as const };
  if (!ownerMemberId || ownerMemberId === currentMember.id) return { ownerMemberId: currentMember.id };
  const admin = await requireCurrentAdminUser();
  if ("error" in admin) return { error: "Acces admin requis pour owner_member_id." as const };
  return { ownerMemberId };
}

async function callMetaGraphApi(path: string, input: { method?: "GET" | "POST"; payload?: Record<string, unknown> }) {
  if (!isWhatsAppMetaConfigured()) {
    return {
      ok: false as const,
      error: "Configuration Meta Cloud API manquante (token ou phone_number_id).",
      status: 400,
      data: null as Record<string, unknown> | null,
    };
  }
  const method = input.method || "POST";
  const cleanBase = whatsappMetaConfig.graphBaseUrl.replace(/\/+$/, "");
  const cleanVersion = whatsappMetaConfig.apiVersion.replace(/^\/+|\/+$/g, "");
  const cleanPath = path.replace(/^\/+/, "");
  const url = `${cleanBase}/${cleanVersion}/${cleanPath}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${whatsappMetaConfig.permanentAccessToken}`,
      "Content-Type": "application/json",
    },
    body: method === "POST" ? JSON.stringify(input.payload || {}) : undefined,
  });
  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok) {
    const errorObject = (data?.error || {}) as Record<string, unknown>;
    const message =
      String(errorObject.message || data?.message || data?.error || "").trim() || `Meta API HTTP ${response.status}`;
    return { ok: false as const, error: message, status: response.status, data };
  }
  return { ok: true as const, data, status: response.status };
}

async function pushInboundActionToCrm(input: {
  ownerMemberId: string | null;
  queueId: string | null;
  phoneE164: string | null;
  messageText: string;
  buttonPayload: string | null;
  classification: InboundClassification;
}) {
  if (!whatsappMetaConfig.crmWebhookUrl) return;
  await fetch(whatsappMetaConfig.crmWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(whatsappMetaConfig.crmWebhookBearer ? { Authorization: `Bearer ${whatsappMetaConfig.crmWebhookBearer}` } : {}),
    },
    body: JSON.stringify({
      source: "meta_whatsapp_webhook",
      owner_member_id: input.ownerMemberId,
      queue_id: input.queueId,
      phone: input.phoneE164,
      message_text: input.messageText,
      button_payload: input.buttonPayload,
      classification: input.classification,
      action:
        input.classification === "stop"
          ? "opt_out"
          : input.classification === "positive"
            ? "lead_positive_reply"
            : input.classification === "negative"
              ? "lead_negative_reply"
              : "lead_message",
      happened_at: new Date().toISOString(),
    }),
  }).catch(() => null);
}

async function computePerMinuteSentCount(ownerMemberId: string) {
  const supabaseAdmin = createAdminClient();
  const sinceIso = new Date(Date.now() - 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("human_whatsapp_outbound_queue")
    .select("id", { count: "exact", head: true })
    .eq("owner_member_id", ownerMemberId)
    .in("status", ["sent", "delivered", "read"])
    .gte("sent_at", sinceIso);
  return Number(count || 0);
}

async function computeDailySentCount(ownerMemberId: string) {
  const supabaseAdmin = createAdminClient();
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("human_whatsapp_outbound_queue")
    .select("id", { count: "exact", head: true })
    .eq("owner_member_id", ownerMemberId)
    .in("status", ["sent", "delivered", "read"])
    .gte("sent_at", sinceIso);
  return Number(count || 0);
}

async function computeStopAlertForOwner(ownerMemberId: string | null) {
  if (!ownerMemberId) return { alert: false, ratio: 0, stops: 0, sent24h: 0 };
  const supabaseAdmin = createAdminClient();
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [{ count: stops }, { count: sent24h }] = await Promise.all([
    supabaseAdmin
      .from("human_whatsapp_events")
      .select("id", { count: "exact", head: true })
      .eq("owner_member_id", ownerMemberId)
      .eq("direction", "inbound")
      .eq("classification", "stop")
      .gte("created_at", sinceIso),
    supabaseAdmin
      .from("human_whatsapp_outbound_queue")
      .select("id", { count: "exact", head: true })
      .eq("owner_member_id", ownerMemberId)
      .in("status", ["sent", "delivered", "read"])
      .gte("sent_at", sinceIso),
  ]);
  const safeStops = Number(stops || 0);
  const safeSent = Number(sent24h || 0);
  const ratio = safeSent > 0 ? safeStops / safeSent : 0;
  return {
    alert: safeSent >= 10 && ratio >= whatsappMetaConfig.stopAlertThreshold,
    ratio,
    stops: safeStops,
    sent24h: safeSent,
  };
}

async function fetchMetaQualitySnapshot(): Promise<MetaQualitySnapshot> {
  if (!isWhatsAppMetaConfigured()) {
    return {
      qualityRating: null,
      throughputLevel: null,
      codeVerificationStatus: null,
      displayPhoneNumber: null,
    };
  }
  const result = await callMetaGraphApi(whatsappMetaConfig.phoneNumberId, {
    method: "GET",
    payload: undefined,
  });
  if (!result.ok || !result.data) {
    return {
      qualityRating: null,
      throughputLevel: null,
      codeVerificationStatus: null,
      displayPhoneNumber: null,
    };
  }
  const throughput = (result.data.throughput || {}) as Record<string, unknown>;
  return {
    qualityRating: String(result.data.quality_rating || "").trim() || null,
    throughputLevel: String(throughput.level || "").trim() || null,
    codeVerificationStatus: String(result.data.code_verification_status || "").trim() || null,
    displayPhoneNumber: String(result.data.display_phone_number || "").trim() || null,
  };
}

function parseProviderMessageId(data: Record<string, unknown> | null | undefined): string | null {
  const messages = Array.isArray(data?.messages) ? data?.messages : [];
  const first = (messages[0] || {}) as Record<string, unknown>;
  const id = String(first.id || data?.message_id || "").trim();
  return id || null;
}

export async function enqueueWhatsAppTemplateMessage(input: {
  phone: string;
  templateName: string;
  vars?: string[];
  languageCode?: string;
  source?: string;
  ownerMemberId?: string;
  metadata?: Record<string, unknown>;
}) {
  const owner = await resolveOwnerMemberId(input.ownerMemberId);
  if ("error" in owner) return { error: owner.error };
  const ownerMemberId = owner.ownerMemberId;
  const phoneE164 = normalizePhone(input.phone);
  const templateName = String(input.templateName || "").trim();
  const languageCode = String(input.languageCode || "fr").trim().slice(0, 10) || "fr";
  const vars = sanitizeVars(input.vars);

  if (!phoneE164) return { error: "Numéro téléphone invalide." };
  if (!templateName) return { error: "template_name requis." };

  const supabaseAdmin = createAdminClient();
  const { data: blacklisted } = await supabaseAdmin
    .from("human_whatsapp_blacklist")
    .select("phone_e164")
    .eq("owner_member_id", ownerMemberId)
    .eq("phone_e164", phoneE164)
    .maybeSingle();
  if (blacklisted?.phone_e164) return { error: "Contact blacklisté (STOP). Envoi bloqué." };

  const randomDelayMs = randomInt(whatsappMetaConfig.queueMinDelayMs, whatsappMetaConfig.queueMaxDelayMs);
  const notBeforeAt = new Date(Date.now() + randomDelayMs).toISOString();
  const defaultQuickReplyPayload = ["YES_WITH_PLEASURE", "NOT_NOW"];
  const { data, error } = await supabaseAdmin
    .from("human_whatsapp_outbound_queue")
    .insert({
      owner_member_id: ownerMemberId,
      phone_e164: phoneE164,
      template_name: templateName,
      language_code: languageCode,
      vars,
      quick_reply_payload: defaultQuickReplyPayload,
      source: String(input.source || "api").trim().slice(0, 64) || "api",
      metadata: input.metadata || {},
      status: "queued",
      attempt_count: 0,
      max_attempts: whatsappMetaConfig.queueMaxAttempts,
      random_delay_ms: randomDelayMs,
      not_before_at: notBeforeAt,
      updated_at: new Date().toISOString(),
    })
    .select("id,owner_member_id,phone_e164,template_name,language_code,status,not_before_at")
    .single();
  if (error) return { error: error.message };
  return { success: true, queued: data };
}

export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  variables: string[],
  options?: { languageCode?: string; ownerMemberId?: string; source?: string; metadata?: Record<string, unknown> },
) {
  return enqueueWhatsAppTemplateMessage({
    phone: to,
    templateName,
    vars: variables,
    languageCode: options?.languageCode || "fr",
    ownerMemberId: options?.ownerMemberId,
    source: options?.source || "api",
    metadata: options?.metadata || {},
  });
}

export async function submitWhatsAppTemplateToMeta(input: {
  templateName: string;
  languageCode: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  bodyText: string;
  variables?: string[];
  quickReplies?: string[];
  ownerMemberId?: string;
}) {
  const owner = await resolveOwnerMemberId(input.ownerMemberId);
  if ("error" in owner) return { error: owner.error };
  if (!whatsappMetaConfig.wabaId) return { error: "WHATSAPP_META_WABA_ID manquant." };

  const ownerMemberId = owner.ownerMemberId;
  const templateName = String(input.templateName || "").trim();
  const languageCode = String(input.languageCode || "fr").trim() || "fr";
  const bodyText = String(input.bodyText || "").trim();
  if (!templateName) return { error: "template_name requis." };
  if (!bodyText) return { error: "body_text requis." };
  const quickReplies =
    (Array.isArray(input.quickReplies) ? input.quickReplies : ["Oui, avec plaisir", "Pas pour le moment"])
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 3);

  const components: Array<Record<string, unknown>> = [{ type: "BODY", text: bodyText }];
  if (quickReplies.length > 0) {
    components.push({
      type: "BUTTONS",
      buttons: quickReplies.map((text) => ({
        type: "QUICK_REPLY",
        text,
      })),
    });
  }

  const provider = await callMetaGraphApi(`${whatsappMetaConfig.wabaId}/message_templates`, {
    method: "POST",
    payload: {
      name: templateName,
      language: languageCode,
      category: input.category,
      components,
    },
  });

  const supabaseAdmin = createAdminClient();
  const nowIso = new Date().toISOString();
  const providerTemplateId = String(provider.ok ? provider.data?.id || provider.data?.name || "" : "").trim() || null;
  const { error: upsertError } = await supabaseAdmin.from("human_whatsapp_templates").upsert(
    {
      owner_member_id: ownerMemberId,
      template_name: templateName,
      language_code: languageCode,
      category: input.category,
      status: provider.ok ? "submitted" : "rejected",
      body_text: bodyText,
      variables: Array.isArray(input.variables) ? input.variables : [],
      quick_replies: quickReplies,
      meta_template_id: providerTemplateId,
      provider_payload: provider.ok ? provider.data || {} : { error: provider.error, status: provider.status || null },
      last_submitted_at: nowIso,
      updated_at: nowIso,
    },
    { onConflict: "owner_member_id,template_name,language_code" },
  );
  if (upsertError) return { error: upsertError.message };
  if (!provider.ok) return { error: provider.error, providerStatus: provider.status || 400 };
  return { success: true, provider: provider.data };
}

export async function runWhatsAppOutboundQueueSweep(limit = whatsappMetaConfig.queueBatchSize) {
  if (!isWhatsAppMetaConfigured()) {
    return {
      success: false,
      error: "Configuration Meta Cloud API manquante.",
      processed: 0,
      sent: 0,
      failed: 0,
      blocked: 0,
      deferredByRateLimit: 0,
      deferredByDailyLimit: 0,
    };
  }
  const safeLimit = Math.max(1, Math.min(300, Math.round(limit || whatsappMetaConfig.queueBatchSize)));
  const supabaseAdmin = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data: candidates, error } = await supabaseAdmin
    .from("human_whatsapp_outbound_queue")
    .select("id,owner_member_id,phone_e164,template_name,language_code,vars,quick_reply_payload,source,metadata,status,attempt_count,max_attempts,not_before_at,provider_message_id,sent_at")
    .in("status", ["queued", "scheduled", "failed"])
    .lte("not_before_at", nowIso)
    .order("created_at", { ascending: true })
    .limit(safeLimit * 2);
  if (error) {
    return {
      success: false,
      error: error.message,
      processed: 0,
      sent: 0,
      failed: 0,
      blocked: 0,
      deferredByRateLimit: 0,
      deferredByDailyLimit: 0,
    };
  }

  const rows = ((candidates || []) as QueueRow[]).slice(0, safeLimit * 2);
  const ownerRateMap = new Map<string, number>();
  const ownerDailyMap = new Map<string, number>();
  let processed = 0;
  let sent = 0;
  let failed = 0;
  let blocked = 0;
  let deferredByRateLimit = 0;
  let deferredByDailyLimit = 0;

  for (const row of rows) {
    if (processed >= safeLimit) break;

    const currentRate = ownerRateMap.has(row.owner_member_id)
      ? Number(ownerRateMap.get(row.owner_member_id) || 0)
      : await computePerMinuteSentCount(row.owner_member_id);
    if (currentRate >= whatsappMetaConfig.queuePerMinuteLimit) {
      deferredByRateLimit += 1;
      const pushMs = randomInt(5000, 12000);
      await supabaseAdmin
        .from("human_whatsapp_outbound_queue")
        .update({
          status: "scheduled",
          not_before_at: new Date(Date.now() + pushMs).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      continue;
    }

    const currentDaily = ownerDailyMap.has(row.owner_member_id)
      ? Number(ownerDailyMap.get(row.owner_member_id) || 0)
      : await computeDailySentCount(row.owner_member_id);
    if (currentDaily >= whatsappMetaConfig.queueDailyLimit) {
      deferredByDailyLimit += 1;
      await supabaseAdmin
        .from("human_whatsapp_outbound_queue")
        .update({
          status: "scheduled",
          not_before_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      continue;
    }

    const { data: blacklisted } = await supabaseAdmin
      .from("human_whatsapp_blacklist")
      .select("phone_e164")
      .eq("owner_member_id", row.owner_member_id)
      .eq("phone_e164", row.phone_e164)
      .maybeSingle();
    if (blacklisted?.phone_e164) {
      blocked += 1;
      processed += 1;
      await supabaseAdmin
        .from("human_whatsapp_outbound_queue")
        .update({
          status: "blocked",
          cancelled_at: new Date().toISOString(),
          last_error: "Blocked: contact in blacklist",
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      continue;
    }

    const nextAttempt = Math.max(1, Number(row.attempt_count || 0) + 1);
    await supabaseAdmin
      .from("human_whatsapp_outbound_queue")
      .update({
        status: "sending",
        attempt_count: nextAttempt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    const vars = sanitizeVars(Array.isArray(row.vars) ? row.vars : []);
    const payload: Record<string, unknown> = {
      messaging_product: "whatsapp",
      to: toMetaPhoneDigits(row.phone_e164),
      type: "template",
      template: {
        name: row.template_name,
        language: { code: row.language_code || "fr" },
      },
    };
    if (vars.length > 0) {
      (payload.template as Record<string, unknown>).components = [
        {
          type: "body",
          parameters: buildTemplateBodyParams(vars),
        },
      ];
    }

    const provider = await callMetaGraphApi(`${whatsappMetaConfig.phoneNumberId}/messages`, {
      method: "POST",
      payload,
    });
    if (!provider.ok) {
      failed += 1;
      processed += 1;
      const exhausted = nextAttempt >= Math.max(1, Number(row.max_attempts || whatsappMetaConfig.queueMaxAttempts));
      const baseDelaySec = whatsappMetaConfig.queueRetryBaseDelaySec * Math.pow(2, Math.max(0, nextAttempt - 1));
      const jitterSec = randomInt(0, whatsappMetaConfig.queueRetryBaseDelaySec);
      const retryAtIso = new Date(Date.now() + (baseDelaySec + jitterSec) * 1000).toISOString();
      await supabaseAdmin
        .from("human_whatsapp_outbound_queue")
        .update({
          status: exhausted ? "cancelled" : "failed",
          not_before_at: exhausted ? null : retryAtIso,
          failed_at: new Date().toISOString(),
          cancelled_at: exhausted ? new Date().toISOString() : null,
          last_error: String(provider.error || "").slice(0, 500),
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      await supabaseAdmin.from("human_whatsapp_events").insert({
        queue_id: row.id,
        owner_member_id: row.owner_member_id,
        phone_e164: row.phone_e164,
        direction: "outbound",
        event_type: exhausted ? "cancelled" : "failed",
        classification: null,
        message_text: null,
        provider_message_id: null,
        payload: provider.data || { error: provider.error },
      });
      continue;
    }

    const providerMessageId = parseProviderMessageId(provider.data);
    const sentAtIso = new Date().toISOString();
    await supabaseAdmin
      .from("human_whatsapp_outbound_queue")
      .update({
        status: "sent",
        provider_message_id: providerMessageId,
        sent_at: sentAtIso,
        last_error: null,
        updated_at: sentAtIso,
      })
      .eq("id", row.id);
    await supabaseAdmin.from("human_whatsapp_events").insert({
      queue_id: row.id,
      owner_member_id: row.owner_member_id,
      phone_e164: row.phone_e164,
      direction: "outbound",
      event_type: "sent",
      classification: null,
      message_text: null,
      provider_message_id: providerMessageId,
      payload: provider.data || {},
    });
    ownerRateMap.set(row.owner_member_id, currentRate + 1);
    ownerDailyMap.set(row.owner_member_id, currentDaily + 1);
    processed += 1;
    sent += 1;
  }

  return { success: true, processed, sent, failed, blocked, deferredByRateLimit, deferredByDailyLimit };
}

export async function processWhatsAppMetaWebhook(payload: IncomingMetaWebhookPayload) {
  const supabaseAdmin = createAdminClient();
  const entries = Array.isArray(payload.entry) ? payload.entry : [];
  let inboundCount = 0;
  let statusCount = 0;
  let stopCount = 0;
  const alerts: Array<{ ownerMemberId: string; ratio: number; stops: number; sent24h: number }> = [];
  const touchedOwners = new Set<string>();

  for (const entry of entries) {
    const changes = Array.isArray((entry as Record<string, unknown>).changes)
      ? ((entry as Record<string, unknown>).changes as Array<Record<string, unknown>>)
      : [];
    for (const change of changes) {
      const value = (change.value || {}) as Record<string, unknown>;

      const statuses = Array.isArray(value.statuses) ? (value.statuses as Array<Record<string, unknown>>) : [];
      for (const status of statuses) {
        statusCount += 1;
        const providerMessageId = String(status.id || "").trim();
        if (!providerMessageId) continue;
        const recipient = normalizePhone(String(status.recipient_id || ""));
        const statusValue = String(status.status || "").trim().toLowerCase();
        const { data: queueRow } = await supabaseAdmin
          .from("human_whatsapp_outbound_queue")
          .select("id,owner_member_id,status")
          .eq("provider_message_id", providerMessageId)
          .maybeSingle();

        const nextStatus: QueueStatus | null =
          statusValue === "delivered"
            ? "delivered"
            : statusValue === "read"
              ? "read"
              : statusValue === "sent"
                ? "sent"
                : statusValue === "failed"
                  ? "failed"
                  : null;
        const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (nextStatus) updatePayload.status = nextStatus;
        if (nextStatus === "delivered") updatePayload.delivered_at = new Date().toISOString();
        if (nextStatus === "read") updatePayload.read_at = new Date().toISOString();
        if (nextStatus === "failed") updatePayload.failed_at = new Date().toISOString();
        if (queueRow?.id && nextStatus) {
          await supabaseAdmin.from("human_whatsapp_outbound_queue").update(updatePayload).eq("id", queueRow.id);
        }
        await supabaseAdmin.from("human_whatsapp_events").insert({
          queue_id: queueRow?.id || null,
          owner_member_id: queueRow?.owner_member_id || null,
          phone_e164: recipient || null,
          direction: "status",
          event_type: statusValue || "status_update",
          classification: null,
          provider_message_id: providerMessageId,
          payload: status,
        });
      }

      const incomingMessages = Array.isArray(value.messages) ? (value.messages as Array<Record<string, unknown>>) : [];
      for (const message of incomingMessages) {
        inboundCount += 1;
        const providerMessageId = String(message.id || "").trim() || null;
        const fromPhone = normalizePhone(String(message.from || ""));
        const messageText = extractInboundText(message);
        const buttonPayload = extractButtonPayload(message);
        const classification = classifyInboundText(messageText);
        const context = (message.context || {}) as Record<string, unknown>;
        const contextMessageId = String(context.id || "").trim();

        let ownerMemberId: string | null = null;
        let queueId: string | null = null;
        if (contextMessageId) {
          const { data: linkedByContext } = await supabaseAdmin
            .from("human_whatsapp_outbound_queue")
            .select("id,owner_member_id")
            .eq("provider_message_id", contextMessageId)
            .maybeSingle();
          if (linkedByContext?.id) {
            queueId = linkedByContext.id;
            ownerMemberId = linkedByContext.owner_member_id;
          }
        }
        if (!ownerMemberId && fromPhone) {
          const { data: latestByPhone } = await supabaseAdmin
            .from("human_whatsapp_outbound_queue")
            .select("id,owner_member_id")
            .eq("phone_e164", fromPhone)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (latestByPhone?.id) {
            queueId = latestByPhone.id;
            ownerMemberId = latestByPhone.owner_member_id;
          }
        }
        if (ownerMemberId) touchedOwners.add(ownerMemberId);

        await supabaseAdmin.from("human_whatsapp_events").insert({
          queue_id: queueId,
          owner_member_id: ownerMemberId,
          phone_e164: fromPhone || null,
          direction: "inbound",
          event_type: "incoming_message",
          classification,
          message_text: messageText || null,
          provider_message_id: providerMessageId,
          payload: {
            ...message,
            button_payload: buttonPayload,
          },
        });

        await pushInboundActionToCrm({
          ownerMemberId,
          queueId,
          phoneE164: fromPhone || null,
          messageText,
          buttonPayload,
          classification,
        });

        if (classification === "stop" && ownerMemberId && fromPhone) {
          stopCount += 1;
          await supabaseAdmin.from("human_whatsapp_blacklist").upsert(
            {
              owner_member_id: ownerMemberId,
              phone_e164: fromPhone,
              reason: "stop_keyword",
              source: "webhook",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "owner_member_id,phone_e164" },
          );
          await supabaseAdmin
            .from("human_whatsapp_outbound_queue")
            .update({
              status: "cancelled",
              cancelled_at: new Date().toISOString(),
              last_error: "Cancelled by STOP keyword",
              updated_at: new Date().toISOString(),
            })
            .eq("owner_member_id", ownerMemberId)
            .eq("phone_e164", fromPhone)
            .in("status", ["queued", "scheduled", "failed"]);
        }
      }
    }
  }

  for (const ownerMemberId of touchedOwners) {
    const alert = await computeStopAlertForOwner(ownerMemberId);
    if (alert.alert) {
      alerts.push({
        ownerMemberId,
        ratio: alert.ratio,
        stops: alert.stops,
        sent24h: alert.sent24h,
      });
    }
  }

  return { success: true, inboundCount, statusCount, stopCount, alerts };
}

export async function getWhatsAppInboxEvents(input?: {
  classification?: "positive" | "negative" | "stop" | "neutral" | "all";
  limit?: number;
}) {
  const currentMember = await getCurrentHumanMember();
  if (!currentMember?.id) return { error: "Session requise.", items: [] as Array<Record<string, unknown>> };
  const limit = Math.max(1, Math.min(200, Math.round(input?.limit || 50)));
  const classification = input?.classification || "all";
  const supabaseAdmin = createAdminClient();
  let query = supabaseAdmin
    .from("human_whatsapp_events")
    .select("id,queue_id,owner_member_id,phone_e164,direction,event_type,classification,message_text,provider_message_id,payload,created_at")
    .eq("owner_member_id", currentMember.id)
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (classification !== "all") query = query.eq("classification", classification);
  const { data, error } = await query;
  if (error) return { error: error.message, items: [] as Array<Record<string, unknown>> };
  return { success: true, items: data || [] };
}

export async function getWhatsAppQueueMonitoring(input?: { ownerMemberId?: string; hours?: number }) {
  const owner = await resolveOwnerMemberId(input?.ownerMemberId);
  if ("error" in owner) return { error: owner.error };
  const ownerMemberId = owner.ownerMemberId;
  const hours = Math.max(1, Math.min(168, Math.round(input?.hours || 24)));
  const sinceIso = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const supabaseAdmin = createAdminClient();
  const [{ data: statusRows }, stopAlert, quality] = await Promise.all([
    supabaseAdmin
      .from("human_whatsapp_outbound_queue")
      .select("status")
      .eq("owner_member_id", ownerMemberId)
      .gte("created_at", sinceIso)
      .limit(5000),
    computeStopAlertForOwner(ownerMemberId),
    fetchMetaQualitySnapshot(),
  ]);
  const counts: Record<string, number> = {
    queued: 0,
    scheduled: 0,
    sending: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    cancelled: 0,
    blocked: 0,
  };
  ((statusRows as Array<{ status: string }> | null) || []).forEach((row) => {
    const key = String(row.status || "");
    if (Object.prototype.hasOwnProperty.call(counts, key)) counts[key] = Number(counts[key] || 0) + 1;
  });

  const qualityAlert = computeQualityAlert(quality.qualityRating);
  return {
    success: true,
    ownerMemberId,
    windowHours: hours,
    counts,
    stopAlert: stopAlert.alert,
    stopRatio: stopAlert.ratio,
    stopEvents: stopAlert.stops,
    sent24h: stopAlert.sent24h,
    stopThreshold: whatsappMetaConfig.stopAlertThreshold,
    qualityRating: quality.qualityRating,
    qualityAlert,
    throughputLevel: quality.throughputLevel,
    codeVerificationStatus: quality.codeVerificationStatus,
    displayPhoneNumber: quality.displayPhoneNumber,
  };
}
