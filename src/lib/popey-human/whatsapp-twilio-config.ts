// Normalise le numéro émetteur WhatsApp. Twilio exige le canal en préfixe (`whatsapp:+E164`).
// On tolère qu'on saisisse juste `+33612345678` (on ajoute `whatsapp:`) pour éviter l'échec silencieux.
// On NE convertit PAS `06…` : ce format local est invalide pour Twilio (il faut `+336…`).
function normalizeWhatsAppFrom(value: string | undefined): string {
  const raw = String(value || "").trim();
  if (!raw) return "whatsapp:+14155238886"; // défaut = numéro démo (sandbox)
  if (raw.toLowerCase().startsWith("whatsapp:")) return `whatsapp:${raw.slice("whatsapp:".length).trim()}`;
  return `whatsapp:${raw}`;
}

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
  whatsappFrom: normalizeWhatsAppFrom(process.env.TWILIO_WHATSAPP_FROM),
  contentSid: String(process.env.TWILIO_WHATSAPP_CONTENT_SID || "").trim(),
  directContentSid: String(process.env.TWILIO_WHATSAPP_CONTENT_SID_DIRECT || "").trim(),
  // Catalogue Privilège — alertes commerçant (templates dédiés, approuvés par Meta) :
  alertOptinContentSid: String(process.env.TWILIO_WHATSAPP_CONTENT_SID_ALERT_OPTIN || "").trim(), // confirmation double opt-in ({{1}}=commerçant, {{2}}=ville)
  alertBroadcastContentSid: String(process.env.TWILIO_WHATSAPP_CONTENT_SID_ALERT_BROADCAST || "").trim(), // diffusion d'une offre ({{1}}=commerçant, {{2}}=offre, {{3}}=lien)
  matchContentSid: String(process.env.TWILIO_WHATSAPP_CONTENT_SID_MATCH || "").trim(), // « C'est un match » après visite validée ({{1}}=commerçant, {{2}}=récompense, {{3}}=lien)
  proDigestContentSid: String(process.env.TWILIO_WHATSAPP_CONTENT_SID_PRO_DIGEST || "").trim(), // digest hebdo au commerçant ({{1}}=commerçant, {{2}}=résumé semaine, {{3}}=lien à partager)
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
