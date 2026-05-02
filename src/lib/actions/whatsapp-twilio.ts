"use server";

import twilio from "twilio";
import { createAdminClient } from "@/lib/supabase/admin";
import { isWhatsAppTwilioConfigured, whatsappTwilioConfig } from "@/lib/popey-human/whatsapp-twilio-config";

type InboundClassification = "positive" | "negative" | "stop" | "neutral";
type QueueStatus = "sent" | "delivered" | "read" | "failed";
type QueueLookupRow = {
  id: string;
  owner_member_id: string;
  phone_e164: string;
  metadata: Record<string, unknown> | null;
};
type PartnerOutreachVariables = {
  1?: string;
  2?: string;
  3?: string;
  4?: string;
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

function normalizeTwilioWhatsAppAddress(raw: string | null | undefined): string {
  const value = String(raw || "").trim();
  if (!value) return "";
  const withoutPrefix = value.replace(/^whatsapp:/i, "");
  const phone = normalizePhone(withoutPrefix);
  return phone ? `whatsapp:${phone}` : "";
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

function toQueueStatus(raw: string): QueueStatus | null {
  const value = String(raw || "").trim().toLowerCase();
  if (value === "delivered") return "delivered";
  if (value === "read") return "read";
  if (value === "failed" || value === "undelivered") return "failed";
  if (value === "sent" || value === "queued" || value === "accepted") return "sent";
  return null;
}

function parseContentVariables(input: PartnerOutreachVariables): string {
  const variables = {
    "1": String(input[1] || "").trim(),
    "2": String(input[2] || "").trim(),
    "3": String(input[3] || "").trim(),
    "4": String(input[4] || "").trim(),
  };
  return JSON.stringify(variables);
}

async function pushInboundActionToCrm(input: {
  ownerMemberId: string | null;
  queueId: string | null;
  phoneE164: string | null;
  messageText: string;
  buttonPayload: string | null;
  classification: InboundClassification;
  smartScanActionId?: string | null;
}) {
  if (!whatsappTwilioConfig.crmWebhookUrl) return;
  await fetch(whatsappTwilioConfig.crmWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(whatsappTwilioConfig.crmWebhookBearer ? { Authorization: `Bearer ${whatsappTwilioConfig.crmWebhookBearer}` } : {}),
    },
    body: JSON.stringify({
      source: "twilio_whatsapp_webhook",
      owner_member_id: input.ownerMemberId,
      queue_id: input.queueId,
      phone: input.phoneE164,
      message_text: input.messageText,
      button_payload: input.buttonPayload,
      classification: input.classification,
      smart_scan_action_id: input.smartScanActionId || null,
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

async function resolveSmartScanActionForReply(input: {
  ownerMemberId: string;
  phoneE164: string;
  queueMetadata?: Record<string, unknown> | null;
}) {
  const supabaseAdmin = createAdminClient();
  const explicitActionId = String(input.queueMetadata?.smart_scan_action_id || "").trim();
  if (explicitActionId) return explicitActionId;

  const contactIdFromQueue = String(input.queueMetadata?.smart_scan_contact_id || "").trim();
  if (contactIdFromQueue) {
    const { data: byContact } = await supabaseAdmin
      .from("human_smart_scan_actions")
      .select("id")
      .eq("owner_member_id", input.ownerMemberId)
      .eq("contact_id", contactIdFromQueue)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (byContact?.id) return String(byContact.id);
  }

  const { data: contactByPhone } = await supabaseAdmin
    .from("human_smart_scan_contacts")
    .select("id")
    .eq("owner_member_id", input.ownerMemberId)
    .eq("phone_e164", input.phoneE164)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!contactByPhone?.id) return null;

  const { data: byPhoneContact } = await supabaseAdmin
    .from("human_smart_scan_actions")
    .select("id")
    .eq("owner_member_id", input.ownerMemberId)
    .eq("contact_id", contactByPhone.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return byPhoneContact?.id ? String(byPhoneContact.id) : null;
}

async function updateSmartScanOutcomeByClassification(input: {
  ownerMemberId: string;
  phoneE164: string;
  classification: InboundClassification;
  buttonText: string;
  queueMetadata?: Record<string, unknown> | null;
}) {
  if (input.classification !== "positive" && input.classification !== "negative") return null;
  const actionId = await resolveSmartScanActionForReply({
    ownerMemberId: input.ownerMemberId,
    phoneE164: input.phoneE164,
    queueMetadata: input.queueMetadata,
  });
  if (!actionId) return null;

  const supabaseAdmin = createAdminClient();
  const nowIso = new Date().toISOString();
  const nextOutcome = input.classification === "positive" ? "replied" : "not_interested";
  const notePrefix = input.classification === "positive" ? "Réponse WhatsApp Twilio positive" : "Réponse WhatsApp Twilio négative";
  const noteSuffix = input.buttonText ? `: ${input.buttonText}` : "";
  await supabaseAdmin
    .from("human_smart_scan_actions")
    .update({
      outcome_status: nextOutcome,
      outcome_notes: `${notePrefix}${noteSuffix}`,
      followup_due_at: null,
      updated_at: nowIso,
    })
    .eq("id", actionId)
    .eq("owner_member_id", input.ownerMemberId);

  return actionId;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function normalizeMarketplaceWorkflowStatus(value: string): "pending" | "contacted" | "in_progress" | "validated" | "refused" {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "new") return "pending";
  if (raw === "rdv") return "in_progress";
  if (raw === "signed") return "validated";
  if (raw === "closed") return "refused";
  if (raw === "contacted") return "contacted";
  if (raw === "in_progress" || raw === "in-progress") return "in_progress";
  if (raw === "validated") return "validated";
  if (raw === "refused") return "refused";
  return "pending";
}

async function updateMarketplaceActivationByClassification(input: {
  queueMetadata: Record<string, unknown> | null | undefined;
  classification: InboundClassification;
  messageText: string;
  phoneE164: string | null;
}) {
  const metadata = asRecord(input.queueMetadata);
  const flow = String(metadata.flow || "").trim();
  if (flow !== "marketplace_ticket_followup_j1") return null;
  const activationId = String(metadata.marketplace_activation_id || "").trim();
  if (!activationId) return null;

  const supabaseAdmin = createAdminClient();
  const { data: activation } = await supabaseAdmin
    .from("human_marketplace_landing_activations")
    .select("id,city,metadata,partner_member_id")
    .eq("id", activationId)
    .maybeSingle();
  if (!activation?.id) return null;

  const currentMetadata = asRecord(activation.metadata);
  const currentStatus = normalizeMarketplaceWorkflowStatus(String(currentMetadata.workflow_status || "pending"));
  let nextStatus = currentStatus;
  if (input.classification === "positive") nextStatus = "validated";
  if (input.classification === "negative") nextStatus = "in_progress";
  if (input.classification === "stop") nextStatus = "refused";
  if (input.classification === "neutral") return null;

  const nowIso = new Date().toISOString();
  const nextMetadata: Record<string, unknown> = {
    ...currentMetadata,
    workflow_status: nextStatus,
    ticket_status: nextStatus,
    workflow_note: `Réponse pro Twilio: ${input.messageText || input.classification}`,
    workflow_updated_at: nowIso,
    pro_followup_last_reply_at: nowIso,
    pro_followup_last_reply_classification: input.classification,
    pro_followup_last_reply_text: input.messageText || null,
    pro_followup_last_reply_phone: input.phoneE164 || null,
  };

  await supabaseAdmin
    .from("human_marketplace_landing_activations")
    .update({ metadata: nextMetadata })
    .eq("id", activation.id);

  await supabaseAdmin.from("human_marketplace_landing_events").insert({
    event_type: "pro_followup_reply",
    city: String(activation.city || "").trim() || null,
    category_key: null,
    place_id: null,
    client_id: null,
    referrer_id: null,
    partner_member_id: String(activation.partner_member_id || "").trim() || null,
    source: "twilio_webhook",
    metadata: {
      activation_id: activation.id,
      ticket_code: String(currentMetadata.ticket_code || metadata.ticket_code || "").trim() || null,
      classification: input.classification,
      previous_status: currentStatus,
      next_status: nextStatus,
    },
  });

  return {
    activationId: activation.id,
    previousStatus: currentStatus,
    nextStatus,
  };
}

export async function sendPartnerOutreach(
  targetPhone: string,
  variables: PartnerOutreachVariables,
  options?: {
    ownerMemberId?: string;
    source?: string;
    metadata?: Record<string, unknown>;
  },
) {
  if (!isWhatsAppTwilioConfigured()) {
    return {
      success: false as const,
      error: "Configuration Twilio WhatsApp incomplète (account SID, auth token, from, content SID).",
    };
  }

  const to = normalizeTwilioWhatsAppAddress(targetPhone);
  if (!to) {
    return { success: false as const, error: "Numéro cible invalide." };
  }

  const client = twilio(whatsappTwilioConfig.accountSid, whatsappTwilioConfig.authToken);
  const nowIso = new Date().toISOString();
  const contentVariables = parseContentVariables(variables);

  const message = await client.messages.create({
    from: whatsappTwilioConfig.whatsappFrom,
    to,
    contentSid: whatsappTwilioConfig.contentSid,
    contentVariables,
    ...(whatsappTwilioConfig.statusCallbackUrl ? { statusCallback: whatsappTwilioConfig.statusCallbackUrl } : {}),
  });

  if (options?.ownerMemberId) {
    const supabaseAdmin = createAdminClient();
    const phoneE164 = normalizePhone(targetPhone);
    const metadata = {
      ...(options.metadata || {}),
      provider: "twilio",
      twilio_message_sid: String(message.sid || ""),
      twilio_status: String(message.status || ""),
      twilio_content_sid: whatsappTwilioConfig.contentSid,
    };

    const { data: queueRow } = await supabaseAdmin
      .from("human_whatsapp_outbound_queue")
      .insert({
        owner_member_id: options.ownerMemberId,
        phone_e164: phoneE164,
        template_name: whatsappTwilioConfig.contentSid || "twilio_content_template",
        language_code: "fr",
        vars: [variables[1] || "", variables[2] || "", variables[3] || "", variables[4] || ""],
        quick_reply_payload: ["YES_WITH_PLEASURE", "NOT_NOW"],
        source: String(options.source || "smart_scan_daily_scan").trim().slice(0, 64) || "smart_scan_daily_scan",
        metadata,
        status: "sent",
        attempt_count: 1,
        max_attempts: 1,
        random_delay_ms: 0,
        not_before_at: nowIso,
        provider_message_id: String(message.sid || "").trim() || null,
        sent_at: nowIso,
        updated_at: nowIso,
      })
      .select("id")
      .single();

    await supabaseAdmin.from("human_whatsapp_events").insert({
      queue_id: queueRow?.id || null,
      owner_member_id: options.ownerMemberId,
      phone_e164: phoneE164 || null,
      direction: "outbound",
      event_type: "sent",
      classification: null,
      message_text: null,
      provider_message_id: String(message.sid || "").trim() || null,
      payload: {
        provider: "twilio",
        sid: String(message.sid || "").trim() || null,
        status: String(message.status || "").trim() || null,
        to: String(message.to || "").trim() || null,
        from: String(message.from || "").trim() || null,
      },
    });
  }

  return {
    success: true as const,
    provider: "twilio",
    sid: String(message.sid || "").trim(),
    status: String(message.status || "").trim() || "queued",
    isSandbox: whatsappTwilioConfig.isSandbox,
  };
}

export async function processTwilioWhatsAppWebhook(params: Record<string, string>) {
  const supabaseAdmin = createAdminClient();
  const messageSid = String(params.MessageSid || params.SmsSid || "").trim();
  const messageStatus = String(params.MessageStatus || params.SmsStatus || "").trim();
  const statusEvent = toQueueStatus(messageStatus);
  const fromPhone = normalizePhone(String(params.From || "").replace(/^whatsapp:/i, ""));
  const body = String(params.ButtonText || params.Body || "").trim();
  const buttonPayload = String(params.ButtonPayload || "").trim() || null;
  const repliedMessageSid = String(params.OriginalRepliedMessageSid || params.RepliedMessageSid || "").trim();

  let queueRow: QueueLookupRow | null = null;

  if (repliedMessageSid) {
    const { data } = await supabaseAdmin
      .from("human_whatsapp_outbound_queue")
      .select("id,owner_member_id,phone_e164,metadata")
      .eq("provider_message_id", repliedMessageSid)
      .maybeSingle();
    queueRow = (data as QueueLookupRow | null) || null;
  }
  if (!queueRow && fromPhone) {
    const { data } = await supabaseAdmin
      .from("human_whatsapp_outbound_queue")
      .select("id,owner_member_id,phone_e164,metadata")
      .eq("phone_e164", fromPhone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    queueRow = (data as QueueLookupRow | null) || null;
  }

  if (statusEvent && messageSid) {
    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      status: statusEvent,
      updated_at: nowIso,
    };
    if (statusEvent === "delivered") updatePayload.delivered_at = nowIso;
    if (statusEvent === "read") updatePayload.read_at = nowIso;
    if (statusEvent === "failed") updatePayload.failed_at = nowIso;

    await supabaseAdmin.from("human_whatsapp_outbound_queue").update(updatePayload).eq("provider_message_id", messageSid);
    await supabaseAdmin.from("human_whatsapp_events").insert({
      queue_id: queueRow?.id || null,
      owner_member_id: queueRow?.owner_member_id || null,
      phone_e164: queueRow?.phone_e164 || fromPhone || null,
      direction: "status",
      event_type: statusEvent,
      classification: null,
      message_text: null,
      provider_message_id: messageSid,
      payload: {
        provider: "twilio",
        params,
      },
    });
  }

  if (!body && !buttonPayload) {
    return { success: true, processed: "status_only" as const };
  }

  const classification = classifyInboundText(body || buttonPayload || "");
  const ownerMemberId = queueRow?.owner_member_id || null;
  const queueId = queueRow?.id || null;
  const queuePhone = queueRow?.phone_e164 || fromPhone || null;

  const queueMetadata = queueRow?.metadata || null;
  const smartScanActionId =
    ownerMemberId && queuePhone
      ? await updateSmartScanOutcomeByClassification({
          ownerMemberId,
          phoneE164: queuePhone,
          classification,
          buttonText: body,
          queueMetadata,
        })
      : null;
  const marketplaceUpdate = await updateMarketplaceActivationByClassification({
    queueMetadata,
    classification,
    messageText: body || buttonPayload || "",
    phoneE164: queuePhone,
  });

  await supabaseAdmin.from("human_whatsapp_events").insert({
    queue_id: queueId,
    owner_member_id: ownerMemberId,
    phone_e164: queuePhone,
    direction: "inbound",
    event_type: "incoming_message",
    classification,
    message_text: body || null,
    provider_message_id: messageSid || null,
    payload: {
      provider: "twilio",
      button_payload: buttonPayload,
      params,
      smart_scan_action_id: smartScanActionId,
        marketplace_activation_id: marketplaceUpdate?.activationId || null,
        marketplace_status: marketplaceUpdate?.nextStatus || null,
    },
  });

  await pushInboundActionToCrm({
    ownerMemberId,
    queueId,
    phoneE164: queuePhone,
    messageText: body,
    buttonPayload,
    classification,
    smartScanActionId,
  });

  if (classification === "stop" && ownerMemberId && queuePhone) {
    await supabaseAdmin.from("human_whatsapp_blacklist").upsert(
      {
        owner_member_id: ownerMemberId,
        phone_e164: queuePhone,
        reason: "stop_keyword",
        source: "twilio_webhook",
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
      .eq("phone_e164", queuePhone)
      .in("status", ["queued", "scheduled", "failed"]);
  }

  return {
    success: true,
    processed: "inbound" as const,
    classification,
    smartScanActionUpdated: Boolean(smartScanActionId),
    marketplaceTicketUpdated: Boolean(marketplaceUpdate?.activationId),
  };
}

export async function sendWhatsAppTextMessage(
  targetPhone: string,
  messageText: string,
  options?: {
    ownerMemberId?: string | null;
    source?: string;
    metadata?: Record<string, unknown>;
  },
) {
  if (!isWhatsAppTwilioConfigured()) {
    return {
      success: false as const,
      error: "Configuration Twilio WhatsApp incomplète (account SID, auth token, from).",
    };
  }

  const to = normalizeTwilioWhatsAppAddress(targetPhone);
  const body = String(messageText || "").trim();
  if (!to) return { success: false as const, error: "Numéro cible invalide." };
  if (!body) return { success: false as const, error: "Message vide." };

  const client = twilio(whatsappTwilioConfig.accountSid, whatsappTwilioConfig.authToken);
  const sent = await client.messages.create({
    from: whatsappTwilioConfig.whatsappFrom,
    to,
    body,
    ...(whatsappTwilioConfig.statusCallbackUrl ? { statusCallback: whatsappTwilioConfig.statusCallbackUrl } : {}),
  });

  const nowIso = new Date().toISOString();
  if (options?.ownerMemberId) {
    const supabaseAdmin = createAdminClient();
    const phoneE164 = normalizePhone(targetPhone);
    const metadata = {
      ...(options.metadata || {}),
      provider: "twilio",
      channel: "text",
      twilio_message_sid: String(sent.sid || "").trim(),
      twilio_status: String(sent.status || "").trim(),
    };
    const { data: queueRow } = await supabaseAdmin
      .from("human_whatsapp_outbound_queue")
      .insert({
        owner_member_id: options.ownerMemberId,
        phone_e164: phoneE164,
        template_name: "twilio_text_reply",
        language_code: "fr",
        vars: [],
        quick_reply_payload: [],
        source: String(options.source || "admin_chat").trim().slice(0, 64) || "admin_chat",
        metadata,
        status: "sent",
        attempt_count: 1,
        max_attempts: 1,
        random_delay_ms: 0,
        not_before_at: nowIso,
        provider_message_id: String(sent.sid || "").trim() || null,
        sent_at: nowIso,
        updated_at: nowIso,
      })
      .select("id")
      .single();

    await supabaseAdmin.from("human_whatsapp_events").insert({
      queue_id: queueRow?.id || null,
      owner_member_id: options.ownerMemberId,
      phone_e164: phoneE164 || null,
      direction: "outbound",
      event_type: "sent",
      classification: null,
      message_text: body,
      provider_message_id: String(sent.sid || "").trim() || null,
      payload: {
        provider: "twilio",
        channel: "text",
        sid: String(sent.sid || "").trim() || null,
        status: String(sent.status || "").trim() || null,
        to: String(sent.to || "").trim() || null,
        from: String(sent.from || "").trim() || null,
      },
    });
  }

  return {
    success: true as const,
    provider: "twilio",
    sid: String(sent.sid || "").trim(),
    status: String(sent.status || "").trim() || "queued",
  };
}
