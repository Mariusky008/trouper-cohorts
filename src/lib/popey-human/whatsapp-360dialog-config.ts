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

export const whatsapp360Config = {
  apiBaseUrl: String(process.env.WHATSAPP_360D_API_BASE_URL || "https://waba-v2.360dialog.io").trim(),
  apiKey: String(process.env.WHATSAPP_360D_API_KEY || "").trim(),
  templateNamespace: String(process.env.WHATSAPP_360D_NAMESPACE || "").trim(),
  templateSubmitPath: String(process.env.WHATSAPP_360D_TEMPLATE_SUBMIT_PATH || "/v1/configs/templates").trim(),
  webhookVerifyToken: String(process.env.WHATSAPP_360D_WEBHOOK_VERIFY_TOKEN || "").trim(),
  queueBatchSize: readInt(process.env.WHATSAPP_QUEUE_BATCH_SIZE, 20, 1, 300),
  queuePerMinuteLimit: readInt(process.env.WHATSAPP_QUEUE_PER_MINUTE_LIMIT, 20, 1, 200),
  queueMinDelayMs: readInt(process.env.WHATSAPP_QUEUE_MIN_DELAY_MS, 900, 0, 60000),
  queueMaxDelayMs: readInt(process.env.WHATSAPP_QUEUE_MAX_DELAY_MS, 2600, 100, 120000),
  queueRetryBaseDelaySec: readInt(process.env.WHATSAPP_QUEUE_RETRY_BASE_DELAY_SEC, 30, 5, 3600),
  queueMaxAttempts: readInt(process.env.WHATSAPP_QUEUE_MAX_ATTEMPTS, 4, 1, 20),
  blockAlertThreshold: readFloat(process.env.WHATSAPP_BLOCK_ALERT_THRESHOLD, 0.05, 0.001, 0.5),
};

export function isWhatsApp360Configured() {
  return Boolean(whatsapp360Config.apiBaseUrl && whatsapp360Config.apiKey);
}
