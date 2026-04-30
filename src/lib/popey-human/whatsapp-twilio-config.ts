function readBoolean(value: string | undefined, fallback: boolean): boolean {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (!normalized) return fallback;
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

export const whatsappTwilioConfig = {
  accountSid: String(process.env.TWILIO_ACCOUNT_SID || "").trim(),
  authToken: String(process.env.TWILIO_AUTH_TOKEN || "").trim(),
  whatsappFrom: String(process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886").trim(),
  contentSid: String(process.env.TWILIO_WHATSAPP_CONTENT_SID || "").trim(),
  isSandbox: readBoolean(process.env.TWILIO_WHATSAPP_SANDBOX_MODE, true),
  inboundWebhookUrl: String(process.env.TWILIO_WHATSAPP_INBOUND_WEBHOOK_URL || "").trim(),
  statusCallbackUrl: String(process.env.TWILIO_WHATSAPP_STATUS_CALLBACK_URL || "").trim(),
  sandboxJoinCode: String(process.env.TWILIO_WHATSAPP_SANDBOX_JOIN_CODE || "").trim(),
  validateWebhookSignature: readBoolean(process.env.TWILIO_WHATSAPP_VALIDATE_WEBHOOK_SIGNATURE, false),
  crmWebhookUrl: String(process.env.TWILIO_WHATSAPP_CRM_WEBHOOK_URL || process.env.WHATSAPP_CRM_WEBHOOK_URL || "").trim(),
  crmWebhookBearer: String(process.env.TWILIO_WHATSAPP_CRM_WEBHOOK_BEARER || process.env.WHATSAPP_CRM_WEBHOOK_BEARER || "").trim(),
};

export function isWhatsAppTwilioConfigured() {
  return Boolean(
    whatsappTwilioConfig.accountSid &&
      whatsappTwilioConfig.authToken &&
      whatsappTwilioConfig.whatsappFrom &&
      whatsappTwilioConfig.contentSid,
  );
}
