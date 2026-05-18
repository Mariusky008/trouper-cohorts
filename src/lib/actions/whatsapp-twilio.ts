"use server";

import twilio from "twilio";
import { createAdminClient } from "@/lib/supabase/admin";
import { isWhatsAppTwilioConfigured, isWhatsAppTwilioDirectConfigured, whatsappTwilioConfig } from "@/lib/popey-human/whatsapp-twilio-config";
import { enqueueVoiceCall } from "@/lib/actions/voice-twilio";

type InboundClassification = "positive" | "negative" | "stop" | "neutral";
type QueueStatus = "sent" | "delivered" | "read" | "failed";
type QueueLookupRow = {
  id: string;
  owner_member_id: string;
  phone_e164: string;
  source?: string | null;
  template_name?: string | null;
  metadata: Record<string, unknown> | null;
};
type PartnerOutreachVariables = {
  1?: string;
  2?: string;
  3?: string;
  4?: string;
  5?: string;
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

function normalizeOutgoingWhatsAppBody(raw: string | null | undefined): string {
  return String(raw || "")
    .normalize("NFC")
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function buildTemplateFallbackVariables(messageText: string, metadata?: Record<string, unknown>): PartnerOutreachVariables {
  const meta = metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {};
  
  const partnerName = String(meta.partner_name || meta.pro_name || "Madame, Monsieur").trim();
  const referrerName = String(meta.referrer_name || "Dax").trim();
  const ticketCode = String(meta.ticket_code || "l'artisanat et des services").trim();
  
  const shortMessage = String(messageText || "")
    .replace(/\s+/g, " ")
    .slice(0, 120)
    .trim();
    
  return {
    1: partnerName,
    2: referrerName,
    3: ticketCode,
    4: shortMessage || "devis",
  };
}

function renderOutreachTemplateMessage(variables: PartnerOutreachVariables): string {
  const v1 = String(variables[1] || "").trim();
  const v2 = String(variables[2] || "").trim();
  const v3 = String(variables[3] || "").trim();
  const v4 = String(variables[4] || "").trim();
  const greeting = v1 || "Madame, Monsieur";
  const city = v2 || "Dax";
  const sector = v3 || "l'artisanat et des services";
  const need = v4 || "devis";
  return `Bonjour ${greeting},
Ici Jean-Philippe Roth. Je suis de ${city} également.

Je travaille avec pas mal d'indépendants du secteur de ${sector} et nous avons souvent des clients en demande de ${need}.

J'aimerais voir si nous pourrions mettre en place un système de recommandation mutuelle pour nos clients respectifs.

Est-ce que vous auriez 5 petites minutes pour en discuter de vive voix demain ?

Bonne journée.

Jean Philippe Roth`;
}

function extractTwilioError(input: unknown): { code: string; message: string } {
  const asRecord = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const code = String(asRecord.code || asRecord.errorCode || "").trim();
  const message = String(asRecord.message || asRecord.detail || "").trim();
  return { code, message };
}

function isOutsideMessagingWindowError(error: { code: string; message: string }): boolean {
  const code = String(error.code || "").trim();
  const message = String(error.message || "").toLowerCase();
  return code === "63016" || message.includes("63016") || message.includes("outside messaging window");
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

function isCallbackRequestText(message: string): boolean {
  const normalized = String(message || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  if (!normalized) return false;
  return /\b(rappel|rappelez|rappelle|appelez|appel)\b/.test(normalized);
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
    "5": String(input[5] || "").trim(),
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
    mode?: "default" | "direct";
  },
) {
  const mode = options?.mode === "direct" ? "direct" : "default";
  const configured = mode === "direct" ? isWhatsAppTwilioDirectConfigured() : isWhatsAppTwilioConfigured();
  if (!configured) {
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
  const hasDirectTemplate = Boolean(whatsappTwilioConfig.directContentSid);
  const contentSid =
    mode === "direct"
      ? whatsappTwilioConfig.directContentSid || whatsappTwilioConfig.contentSid
      : whatsappTwilioConfig.contentSid;
  const effectiveVariables =
    mode === "direct" && !hasDirectTemplate
      ? ({
          1: variables[1],
          2: variables[3],
          3: variables[4],
          4: variables[5],
        } satisfies PartnerOutreachVariables)
      : variables;
  const contentVariables = parseContentVariables(effectiveVariables);
  const previewMessage = renderOutreachTemplateMessage(effectiveVariables);

  const message = await client.messages.create({
    from: whatsappTwilioConfig.whatsappFrom,
    to,
    contentSid,
    contentVariables,
    ...(whatsappTwilioConfig.statusCallbackUrl ? { statusCallback: whatsappTwilioConfig.statusCallbackUrl } : {}),
  });

  if (options?.ownerMemberId) {
    const supabaseAdmin = createAdminClient();
    const phoneE164 = normalizePhone(targetPhone);
    const metadata = {
      ...(options.metadata || {}),
      provider: "twilio",
      channel: "template",
      twilio_message_sid: String(message.sid || ""),
      twilio_status: String(message.status || ""),
      twilio_content_sid: contentSid,
    };

    const { data: queueRow } = await supabaseAdmin
      .from("human_whatsapp_outbound_queue")
      .insert({
        owner_member_id: options.ownerMemberId,
        phone_e164: phoneE164,
        template_name: contentSid || "twilio_content_template",
        language_code: "fr",
        vars: [
          effectiveVariables[1] || "",
          effectiveVariables[2] || "",
          effectiveVariables[3] || "",
          effectiveVariables[4] || "",
          effectiveVariables[5] || "",
        ],
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
      message_text: previewMessage,
      provider_message_id: String(message.sid || "").trim() || null,
      payload: {
        provider: "twilio",
        sid: String(message.sid || "").trim() || null,
        status: String(message.status || "").trim() || null,
        to: String(message.to || "").trim() || null,
        from: String(message.from || "").trim() || null,
        template_name: contentSid || null,
        template_vars: effectiveVariables,
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
  const toPhone = normalizePhone(String(params.To || "").replace(/^whatsapp:/i, ""));
  const errorCode = String(params.ErrorCode || "").trim();
  const errorMessage = String(params.ErrorMessage || params.ChannelStatusMessage || "").trim();
  const body = String(params.ButtonText || params.Body || "").trim();
  const buttonPayload = String(params.ButtonPayload || "").trim() || null;
  const repliedMessageSid = String(params.OriginalRepliedMessageSid || params.RepliedMessageSid || "").trim();

  let queueRow: QueueLookupRow | null = null;

  if (messageSid) {
    const { data } = await supabaseAdmin
      .from("human_whatsapp_outbound_queue")
      .select("id,owner_member_id,phone_e164,source,template_name,metadata")
      .eq("provider_message_id", messageSid)
      .maybeSingle();
    queueRow = (data as QueueLookupRow | null) || null;
  }
  if (repliedMessageSid) {
    const { data } = await supabaseAdmin
      .from("human_whatsapp_outbound_queue")
      .select("id,owner_member_id,phone_e164,source,template_name,metadata")
      .eq("provider_message_id", repliedMessageSid)
      .maybeSingle();
    queueRow = queueRow || ((data as QueueLookupRow | null) || null);
  }
  if (!queueRow && toPhone) {
    const { data } = await supabaseAdmin
      .from("human_whatsapp_outbound_queue")
      .select("id,owner_member_id,phone_e164,source,template_name,metadata")
      .eq("phone_e164", toPhone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    queueRow = (data as QueueLookupRow | null) || null;
  }
  if (!queueRow && fromPhone) {
    const { data } = await supabaseAdmin
      .from("human_whatsapp_outbound_queue")
      .select("id,owner_member_id,phone_e164,source,template_name,metadata")
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
    if (statusEvent === "failed") {
      updatePayload.failed_at = nowIso;
      updatePayload.last_error =
        [errorCode ? `Error ${errorCode}` : "", errorMessage].filter(Boolean).join(" - ") || `Twilio status: ${messageStatus || "failed"}`;
    } else if (statusEvent === "delivered" || statusEvent === "read" || statusEvent === "sent") {
      updatePayload.last_error = null;
    }

    await supabaseAdmin.from("human_whatsapp_outbound_queue").update(updatePayload).eq("provider_message_id", messageSid);
    await supabaseAdmin.from("human_whatsapp_events").insert({
      queue_id: queueRow?.id || null,
      owner_member_id: queueRow?.owner_member_id || null,
      phone_e164: queueRow?.phone_e164 || toPhone || fromPhone || null,
      direction: "status",
      event_type: statusEvent,
      classification: null,
      message_text:
        statusEvent === "failed"
          ? [errorCode ? `Error ${errorCode}` : "", errorMessage].filter(Boolean).join(" - ") || "Échec de livraison WhatsApp"
          : null,
      provider_message_id: messageSid,
      payload: {
        provider: "twilio",
        params,
        error_code: errorCode || null,
        error_message: errorMessage || null,
      },
    });

    const queueMeta = asRecord(queueRow?.metadata);
    const vitrineSlug = String(queueMeta.vitrine_slug || "").trim();
    if (vitrineSlug) {
      if (statusEvent === "sent") {
        await supabaseAdmin
          .from("human_vitrine_sites")
          .update({ status: "sent", sent_at: nowIso, error_reason: null, updated_at: nowIso })
          .eq("slug", vitrineSlug);
      } else if (statusEvent === "failed") {
        const reason =
          [errorCode ? `Error ${errorCode}` : "", errorMessage].filter(Boolean).join(" - ") ||
          `Twilio status: ${messageStatus || "failed"}`;
        await supabaseAdmin
          .from("human_vitrine_sites")
          .update({ error_reason: `whatsapp_failed: ${reason}`.slice(0, 250), updated_at: nowIso })
          .eq("slug", vitrineSlug);
      }
    }

    // If Twilio accepts send then later marks it failed (63016), auto-send a template fallback once.
    if (
      statusEvent === "failed" &&
      (String(errorCode || "").trim() === "63016" || String(errorMessage || "").toLowerCase().includes("outside messaging window")) &&
      queueRow?.owner_member_id &&
      queueRow?.phone_e164 &&
      whatsappTwilioConfig.contentSid
    ) {
      const queueMeta = asRecord(queueRow.metadata);
      const alreadyRecovered =
        String(queueMeta.twilio_auto_template_fallback_at || "").trim() ||
        String(queueMeta.twilio_auto_template_fallback_attempted_at || "").trim();
      const channel = String(queueMeta.channel || "").trim();
      const source = String(queueRow.source || "").trim();
      const templateName = String(queueRow.template_name || "").trim();
      const isTextAttempt = channel === "text" || templateName === "twilio_text_reply";
      const isAlreadyAutoFallbackFlow =
        source === "twilio_auto_fallback_63016" || Boolean(String(queueMeta.twilio_auto_fallback_from_sid || "").trim());
      if (!alreadyRecovered && isTextAttempt && !isAlreadyAutoFallbackFlow) {
        await supabaseAdmin
          .from("human_whatsapp_outbound_queue")
          .update({
            metadata: {
              ...queueMeta,
              twilio_auto_template_fallback_attempted_at: nowIso,
            },
            updated_at: nowIso,
          })
          .eq("id", queueRow.id);
        const originalBody = String(queueMeta.twilio_original_body || "").trim();
        const fallbackVariables = buildTemplateFallbackVariables(originalBody, queueMeta);
        const recovered = await sendPartnerOutreach(queueRow.phone_e164, fallbackVariables, {
          ownerMemberId: queueRow.owner_member_id,
          source: "twilio_auto_fallback_63016",
          metadata: {
            ...queueMeta,
            twilio_auto_fallback_from_sid: messageSid,
            twilio_auto_fallback_error_code: errorCode || "63016",
            twilio_auto_fallback_error_message: errorMessage || "Outside messaging window",
          },
        });
        if (recovered.success) {
          await supabaseAdmin
            .from("human_whatsapp_outbound_queue")
            .update({
              metadata: {
                ...queueMeta,
                twilio_auto_template_fallback_at: nowIso,
                twilio_auto_template_fallback_sid: recovered.sid || null,
              },
              updated_at: nowIso,
            })
            .eq("id", queueRow.id);
        }
      }
    }
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

  const callbackRequested = isCallbackRequestText(body || buttonPayload || "");
  if (callbackRequested && classification !== "stop" && ownerMemberId && queuePhone) {
    const queued = await enqueueVoiceCall({
      ownerMemberId,
      phoneE164: queuePhone,
      source: "whatsapp_callback_request",
      metadata: {
        twilio_message_sid: messageSid || null,
        twilio_reply_to_sid: repliedMessageSid || null,
        trigger_text: body || buttonPayload || "",
      },
    });
    if (queued.success) {
      const notBeforeAt = typeof (queued as { notBeforeAt?: string }).notBeforeAt === "string" ? (queued as { notBeforeAt?: string }).notBeforeAt : null;
      await sendWhatsAppTextMessage(
        queuePhone,
        "Parfait. Je vous appelle dès que possible (9h-12h, 14h-18h30). Si vous préférez, vous pouvez aussi répondre ici par WhatsApp.",
        {
          ownerMemberId,
          source: "voice_callback_ack",
          metadata: {
            voice_queue_id: queued.queueId,
            voice_not_before_at: notBeforeAt,
          },
        },
      );
    }
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
  const body = normalizeOutgoingWhatsAppBody(messageText);
  if (!to) return { success: false as const, error: "Numéro cible invalide." };
  if (!body) return { success: false as const, error: "Message vide." };

  const client = twilio(whatsappTwilioConfig.accountSid, whatsappTwilioConfig.authToken);
  let sent: Awaited<ReturnType<typeof client.messages.create>>;
  let sentChannel: "text" | "template_fallback" = "text";
  let fallbackErrorCode: string | null = null;
  let fallbackContentVariables: PartnerOutreachVariables | null = null;
  try {
    sent = await client.messages.create({
      from: whatsappTwilioConfig.whatsappFrom,
      to,
      body,
      ...(whatsappTwilioConfig.statusCallbackUrl ? { statusCallback: whatsappTwilioConfig.statusCallbackUrl } : {}),
    });
  } catch (error) {
    const parsed = extractTwilioError(error);
    const shouldFallbackTemplate = isOutsideMessagingWindowError(parsed) && Boolean(whatsappTwilioConfig.contentSid);
    if (!shouldFallbackTemplate) {
      return {
        success: false as const,
        error: parsed.message || "Envoi WhatsApp Twilio impossible.",
      };
    }
    fallbackErrorCode = parsed.code;
    fallbackContentVariables = buildTemplateFallbackVariables(body, options?.metadata);
    try {
      sent = await client.messages.create({
        from: whatsappTwilioConfig.whatsappFrom,
        to,
        contentSid: whatsappTwilioConfig.contentSid,
        contentVariables: parseContentVariables(fallbackContentVariables),
        ...(whatsappTwilioConfig.statusCallbackUrl ? { statusCallback: whatsappTwilioConfig.statusCallbackUrl } : {}),
      });
    } catch (fallbackError) {
      const parsedFallback = extractTwilioError(fallbackError);
      return {
        success: false as const,
        error:
          parsedFallback.message ||
          `Fallback template Twilio impossible (contentSid=${whatsappTwilioConfig.contentSid || "n/a"}).`,
      };
    }
    sentChannel = "template_fallback";
  }

  const nowIso = new Date().toISOString();
  if (options?.ownerMemberId) {
    const supabaseAdmin = createAdminClient();
    const phoneE164 = normalizePhone(targetPhone);
    const metadata = {
      ...(options.metadata || {}),
      provider: "twilio",
      channel: sentChannel,
      twilio_original_body: body.slice(0, 500),
      twilio_message_sid: String(sent.sid || "").trim(),
      twilio_status: String(sent.status || "").trim(),
      twilio_fallback_error_code: fallbackErrorCode,
      twilio_content_sid: sentChannel === "template_fallback" ? whatsappTwilioConfig.contentSid : null,
    };
    const { data: queueRow } = await supabaseAdmin
      .from("human_whatsapp_outbound_queue")
      .insert({
        owner_member_id: options.ownerMemberId,
        phone_e164: phoneE164,
        template_name: sentChannel === "template_fallback" ? "twilio_template_fallback_after_63016" : "twilio_text_reply",
        language_code: "fr",
        vars:
          sentChannel === "template_fallback" && fallbackContentVariables
            ? [
                String(fallbackContentVariables[1] || ""),
                String(fallbackContentVariables[2] || ""),
                String(fallbackContentVariables[3] || ""),
                String(fallbackContentVariables[4] || ""),
              ]
            : [],
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
      message_text:
        sentChannel === "template_fallback" && fallbackContentVariables
          ? renderOutreachTemplateMessage(fallbackContentVariables)
          : body,
      provider_message_id: String(sent.sid || "").trim() || null,
      payload: {
        provider: "twilio",
        channel: sentChannel,
        sid: String(sent.sid || "").trim() || null,
        status: String(sent.status || "").trim() || null,
        to: String(sent.to || "").trim() || null,
        from: String(sent.from || "").trim() || null,
        fallback_error_code: fallbackErrorCode,
        content_sid: sentChannel === "template_fallback" ? whatsappTwilioConfig.contentSid : null,
        content_variables: sentChannel === "template_fallback" ? fallbackContentVariables : null,
      },
    });
  }

  return {
    success: true as const,
    provider: "twilio",
    sid: String(sent.sid || "").trim(),
    status: String(sent.status || "").trim() || "queued",
    fallbackUsed: sentChannel === "template_fallback",
  };
}

export async function sendWhatsAppMediaMessage(
  targetPhone: string,
  input: { caption?: string; mediaUrls: string[] },
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
  if (!to) return { success: false as const, error: "Numéro cible invalide." };
  const mediaUrls = Array.isArray(input.mediaUrls)
    ? input.mediaUrls.map((value) => String(value || "").trim()).filter(Boolean).slice(0, 5)
    : [];
  if (mediaUrls.length === 0) return { success: false as const, error: "Pièce jointe manquante." };

  const captionRaw = String(input.caption || "").trim();
  const caption = captionRaw ? normalizeOutgoingWhatsAppBody(captionRaw) : "";
  const messageTextForLog = caption || "Pièce jointe";

  const client = twilio(whatsappTwilioConfig.accountSid, whatsappTwilioConfig.authToken);
  let sent: Awaited<ReturnType<typeof client.messages.create>>;
  try {
    sent = await client.messages.create({
      from: whatsappTwilioConfig.whatsappFrom,
      to,
      ...(caption ? { body: caption } : {}),
      mediaUrl: mediaUrls,
      ...(whatsappTwilioConfig.statusCallbackUrl ? { statusCallback: whatsappTwilioConfig.statusCallbackUrl } : {}),
    });
  } catch (error) {
    const parsed = extractTwilioError(error);
    return {
      success: false as const,
      error: parsed.message || "Envoi WhatsApp Twilio (media) impossible.",
    };
  }

  const nowIso = new Date().toISOString();
  if (options?.ownerMemberId) {
    const supabaseAdmin = createAdminClient();
    const phoneE164 = normalizePhone(targetPhone);
    const metadata = {
      ...(options.metadata || {}),
      provider: "twilio",
      channel: "media",
      twilio_message_sid: String(sent.sid || "").trim(),
      twilio_status: String(sent.status || "").trim(),
    };
    const { data: queueRow } = await supabaseAdmin
      .from("human_whatsapp_outbound_queue")
      .insert({
        owner_member_id: options.ownerMemberId,
        phone_e164: phoneE164,
        template_name: "twilio_media_reply",
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
      message_text: messageTextForLog,
      provider_message_id: String(sent.sid || "").trim() || null,
      payload: {
        provider: "twilio",
        channel: "media",
        sid: String(sent.sid || "").trim() || null,
        status: String(sent.status || "").trim() || null,
        to: String(sent.to || "").trim() || null,
        from: String(sent.from || "").trim() || null,
        media_urls: mediaUrls,
        ...(options.metadata || {}),
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

type OutboundQueueStatus = "queued" | "scheduled" | "sending" | "sent" | "delivered" | "read" | "failed" | "cancelled" | "blocked";
type OutboundQueueRow = {
  id: string;
  owner_member_id: string;
  phone_e164: string;
  template_name: string;
  language_code: string;
  vars: string[];
  quick_reply_payload: string[];
  source: string;
  metadata: Record<string, unknown> | null;
  status: OutboundQueueStatus;
  attempt_count: number;
  max_attempts: number;
  not_before_at: string;
  provider_message_id: string | null;
  sent_at: string | null;
};

function randomInt(min: number, max: number): number {
  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
}

function parseTwilioContentVariables(vars: string[]): string {
  const payload: Record<string, string> = {};
  (Array.isArray(vars) ? vars : []).slice(0, 20).forEach((value, idx) => {
    payload[String(idx + 1)] = String(value || "").trim();
  });
  return JSON.stringify(payload);
}

function buildCampaignMessage(vars: string[], metadata: Record<string, unknown> | null | undefined): string {
  const source = String((metadata || {}).source || '').trim();

  // ── Prospection Google Reviews ──
  if (source === 'admin_review_prospection_manual' || source === 'admin_review_prospection_bulk') {
    const prenom = String(vars?.[0] || '').replace(/^,/, '').trim();
    const entreprise = String(vars?.[1] || 'votre établissement').trim();
    const nbAvis = String(vars?.[2] || '').trim();
    const note = String(vars?.[3] || '').trim();
    return `Bonjour ${prenom} 👋

C'est Jean-Philippe Roth.

Je suis tombé sur votre fiche Google "${entreprise}" : avec ${nbAvis} et une note moyenne de ${note}★ 👏

Franchement, il y a une vraie confiance client. Par contre, avec plus d'avis réguliers, vous pourriez remonter beaucoup plus haut localement.

J'aide justement les pros à obtenir plus d'avis automatiquement, sans devoir courir après leurs clients.

Je peux vous offrir les 5 premiers pour vous montrer comment ça fonctionne 🙂`;
  }

  // ── Alliances / cercle de pros (défaut) ──
  const greeting = String(vars?.[0] || 'Madame, Monsieur').trim() || 'Madame, Monsieur';
  const metier = String(vars?.[1] || 'professionnel').trim() || 'professionnel';
  const city = String((metadata || {}).city || 'Dax').trim() || 'Dax';
  const audience = Number((metadata || {}).audience || 12500);
  const audienceLabel = Number.isFinite(audience) && audience > 0 ? audience.toLocaleString('fr-FR') : '12 500';
  const free = Boolean((metadata || {}).diffusion_free ?? true);
  return `Bonjour ${greeting},

Je suis Jean‑Philippe Roth. Je monte actuellement sur ${city} un cercle de 50 pros, avec une seule entreprise par métier (exclusivité par discipline), pour mettre en avant leurs services auprès de plus de ${audienceLabel} personnes sur le Grand ${city}${free ? ' (diffusion gratuite)' : ''} et toucher une nouvelle clientèle qui ne vous connaît pas encore.

Je cherche un(e) ${metier} de confiance pour compléter le groupe et j'ai pensé à vous en voyant vos excellents avis Google.

Auriez‑vous 5 minutes demain pour un court appel ?

Bonne journée,
Jean‑Philippe Roth`;
}

async function computePerMinuteSentCount(ownerMemberId: string) {
  const supabaseAdmin = createAdminClient();
  const sinceIso = new Date(Date.now() - 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("human_whatsapp_outbound_queue")
    .select("id", { count: "exact", head: true })
    .eq("owner_member_id", ownerMemberId)
    .or("metadata->>provider.eq.twilio,metadata->>provider.eq.twilio_campaign")
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
    .or("metadata->>provider.eq.twilio,metadata->>provider.eq.twilio_campaign")
    .in("status", ["sent", "delivered", "read"])
    .gte("sent_at", sinceIso);
  return Number(count || 0);
}

export async function runTwilioWhatsAppOutboundQueueSweep(limit = 40) {
  if (!isWhatsAppTwilioConfigured()) {
    return { success: false, error: "Configuration Twilio WhatsApp incomplète.", processed: 0, sent: 0, failed: 0, blocked: 0 };
  }
  const safeLimit = Math.max(1, Math.min(120, Math.round(limit || 40)));
  const supabaseAdmin = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data: candidates, error } = await supabaseAdmin
    .from("human_whatsapp_outbound_queue")
    .select("id,owner_member_id,phone_e164,template_name,language_code,vars,quick_reply_payload,source,metadata,status,attempt_count,max_attempts,not_before_at,provider_message_id,sent_at")
    .in("status", ["queued", "scheduled", "failed"])
    .or("metadata->>provider.eq.twilio,metadata->>provider.eq.twilio_campaign")
    .lte("not_before_at", nowIso)
    .order("created_at", { ascending: true })
    .limit(safeLimit * 2);
  if (error) {
    return { success: false, error: error.message, processed: 0, sent: 0, failed: 0, blocked: 0 };
  }

  const rows = ((candidates || []) as OutboundQueueRow[]).slice(0, safeLimit * 2);
  const ownerRateMap = new Map<string, number>();
  const ownerDailyMap = new Map<string, number>();
  let processed = 0;
  let sent = 0;
  let failed = 0;
  let blocked = 0;

  const client = twilio(whatsappTwilioConfig.accountSid, whatsappTwilioConfig.authToken);

  for (const row of rows) {
    if (processed >= safeLimit) break;

    const currentRate = ownerRateMap.has(row.owner_member_id)
      ? Number(ownerRateMap.get(row.owner_member_id) || 0)
      : await computePerMinuteSentCount(row.owner_member_id);
    if (currentRate >= 1) {
      const pushMs = randomInt(30_000, 90_000);
      await supabaseAdmin
        .from("human_whatsapp_outbound_queue")
        .update({ status: "scheduled", not_before_at: new Date(Date.now() + pushMs).toISOString(), updated_at: new Date().toISOString() })
        .eq("id", row.id);
      continue;
    }
    ownerRateMap.set(row.owner_member_id, currentRate + 1);

    const currentDaily = ownerDailyMap.has(row.owner_member_id)
      ? Number(ownerDailyMap.get(row.owner_member_id) || 0)
      : await computeDailySentCount(row.owner_member_id);
    if (currentDaily >= 60) {
      await supabaseAdmin
        .from("human_whatsapp_outbound_queue")
        .update({ status: "scheduled", not_before_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), updated_at: new Date().toISOString() })
        .eq("id", row.id);
      continue;
    }
    ownerDailyMap.set(row.owner_member_id, currentDaily + 1);

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
        .update({ status: "blocked", cancelled_at: new Date().toISOString(), last_error: "Blocked: contact in blacklist", updated_at: new Date().toISOString() })
        .eq("id", row.id);
      continue;
    }

    const lockResult = await supabaseAdmin
      .from("human_whatsapp_outbound_queue")
      .update({ status: "sending", attempt_count: Number(row.attempt_count || 0) + 1, updated_at: new Date().toISOString() })
      .eq("id", row.id)
      .in("status", ["queued", "scheduled", "failed"]);
    if (lockResult.error) continue;

    const vars = Array.isArray(row.vars) ? row.vars.map((v) => String(v ?? "").trim()) : [];
    const contentSid = String((row.metadata || {}).content_sid || row.template_name || whatsappTwilioConfig.contentSid || "").trim();
    const contentVariables = parseTwilioContentVariables(vars);
    const messageText = buildCampaignMessage(vars, row.metadata || {});

    try {
      const delivered = await client.messages.create({
        from: whatsappTwilioConfig.whatsappFrom,
        to: normalizeTwilioWhatsAppAddress(row.phone_e164),
        contentSid,
        contentVariables,
        ...(whatsappTwilioConfig.statusCallbackUrl ? { statusCallback: whatsappTwilioConfig.statusCallbackUrl } : {}),
      });
      const sentAt = new Date().toISOString();
      await supabaseAdmin
        .from("human_whatsapp_outbound_queue")
        .update({
          status: "sent",
          provider_message_id: String(delivered.sid || "").trim() || null,
          sent_at: sentAt,
          last_error: null,
          updated_at: sentAt,
        })
        .eq("id", row.id);
      await supabaseAdmin.from("human_whatsapp_events").insert({
        queue_id: row.id,
        owner_member_id: row.owner_member_id,
        phone_e164: row.phone_e164,
        direction: "outbound",
        event_type: "sent",
        classification: null,
        message_text: messageText,
        provider_message_id: String(delivered.sid || "").trim() || null,
        payload: {
          provider: "twilio",
          channel: "template_campaign",
          sid: String(delivered.sid || "").trim() || null,
          status: String(delivered.status || "").trim() || null,
          to: String(delivered.to || "").trim() || null,
          from: String(delivered.from || "").trim() || null,
          content_sid: contentSid,
          content_variables: vars.reduce((acc, value, idx) => ({ ...acc, [idx + 1]: String(value || "").trim() }), {}),
          ...(row.metadata || {}),
        },
      });
      sent += 1;
      processed += 1;
    } catch (sendError) {
      const parsed = extractTwilioError(sendError);
      const nextAttempt = Number(row.attempt_count || 0) + 1;
      const exhausted = nextAttempt >= Math.max(1, Number(row.max_attempts || 2));
      // not_before_at is NOT NULL in DB — use far future for exhausted messages so sweep never re-picks them
      const retryAt = exhausted ? "2099-01-01T00:00:00.000Z" : new Date(Date.now() + randomInt(5 * 60_000, 20 * 60_000)).toISOString();
      await supabaseAdmin
        .from("human_whatsapp_outbound_queue")
        .update({
          status: exhausted ? "failed" : "scheduled",
          last_error: parsed.message || parsed.code || "Twilio send failed",
          not_before_at: retryAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      failed += 1;
      processed += 1;
    }
  }

  return { success: true, processed, sent, failed, blocked };
}
