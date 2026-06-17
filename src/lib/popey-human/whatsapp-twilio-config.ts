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
  directContentSid: String(process.env.TWILIO_WHATSAPP_CONTENT_SID_DIRECT || "").trim(),
  // Catalogue Privilège — alertes commerçant (templates dédiés, approuvés par Meta) :
  alertOptinContentSid: String(process.env.TWILIO_WHATSAPP_CONTENT_SID_ALERT_OPTIN || "").trim(), // confirmation double opt-in ({{1}}=commerçant, {{2}}=ville)
  alertBroadcastContentSid: String(process.env.TWILIO_WHATSAPP_CONTENT_SID_ALERT_BROADCAST || "").trim(), // diffusion d'une offre ({{1}}=commerçant, {{2}}=offre, {{3}}=lien)
  matchContentSid: String(process.env.TWILIO_WHATSAPP_CONTENT_SID_MATCH || "").trim(), // « C'est un match » après visite validée ({{1}}=commerçant, {{2}}=récompense, {{3}}=lien)
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

export function isWhatsAppTwilioDirectConfigured() {
  return Boolean(
    whatsappTwilioConfig.accountSid &&
      whatsappTwilioConfig.authToken &&
      whatsappTwilioConfig.whatsappFrom &&
      (whatsappTwilioConfig.directContentSid || whatsappTwilioConfig.contentSid),
  );
}
