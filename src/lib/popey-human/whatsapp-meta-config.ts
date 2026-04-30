function readInt(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function readFloat(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number.parseFloat(String(value || ""));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

export const whatsappMetaConfig = {
  graphBaseUrl: String(process.env.WHATSAPP_META_GRAPH_BASE_URL || "https://graph.facebook.com").trim(),
  apiVersion: String(process.env.WHATSAPP_META_API_VERSION || "v21.0").trim(),
  permanentAccessToken: String(process.env.WHATSAPP_META_PERMANENT_ACCESS_TOKEN || "").trim(),
  phoneNumberId: String(process.env.WHATSAPP_META_PHONE_NUMBER_ID || "").trim(),
  wabaId: String(process.env.WHATSAPP_META_WABA_ID || "").trim(),
  webhookVerifyToken: String(process.env.WHATSAPP_META_WEBHOOK_VERIFY_TOKEN || "").trim(),
  crmWebhookUrl: String(process.env.WHATSAPP_CRM_WEBHOOK_URL || "").trim(),
  crmWebhookBearer: String(process.env.WHATSAPP_CRM_WEBHOOK_BEARER || "").trim(),
  queueBatchSize: readInt(process.env.WHATSAPP_QUEUE_BATCH_SIZE, 20, 1, 300),
  queuePerMinuteLimit: readInt(process.env.WHATSAPP_QUEUE_PER_MINUTE_LIMIT, 20, 1, 200),
  queueDailyLimit: readInt(process.env.WHATSAPP_QUEUE_DAILY_LIMIT, 50, 1, 5000),
  queueMinDelayMs: readInt(process.env.WHATSAPP_QUEUE_MIN_DELAY_MS, 900, 0, 60000),
  queueMaxDelayMs: readInt(process.env.WHATSAPP_QUEUE_MAX_DELAY_MS, 2600, 100, 120000),
  queueRetryBaseDelaySec: readInt(process.env.WHATSAPP_QUEUE_RETRY_BASE_DELAY_SEC, 30, 5, 3600),
  queueMaxAttempts: readInt(process.env.WHATSAPP_QUEUE_MAX_ATTEMPTS, 4, 1, 20),
  stopAlertThreshold: readFloat(process.env.WHATSAPP_STOP_ALERT_THRESHOLD, 0.05, 0.001, 0.5),
};

export function isWhatsAppMetaConfigured() {
  return Boolean(
    whatsappMetaConfig.graphBaseUrl &&
      whatsappMetaConfig.apiVersion &&
      whatsappMetaConfig.phoneNumberId &&
      whatsappMetaConfig.permanentAccessToken,
  );
}
