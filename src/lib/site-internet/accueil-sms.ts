// Envoi SMS (Twilio) pour l'accueil intelligent — le « buzz dans la poche » de
// la démo. Réutilise les identifiants Twilio existants + un numéro d'envoi SMS
// (TWILIO_SMS_FROM) ou un Messaging Service (TWILIO_MESSAGING_SERVICE_SID).
// Best-effort : ne jette jamais, renvoie un statut.
import twilio from "twilio";

const sid = () => String(process.env.TWILIO_ACCOUNT_SID || "").trim();
const token = () => String(process.env.TWILIO_AUTH_TOKEN || "").trim();
const smsFrom = () => String(process.env.TWILIO_SMS_FROM || "").trim();
const messagingSid = () => String(process.env.TWILIO_MESSAGING_SERVICE_SID || "").trim();

export function isSmsConfigured(): boolean {
  return Boolean(sid() && token() && (smsFrom() || messagingSid()));
}

// Normalise un numéro FR (ou déjà international) en E.164.
export function toE164(raw: string): string {
  let d = String(raw || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return d;
  d = d.replace(/\D/g, "");
  if (d.startsWith("00")) return "+" + d.slice(2);
  if (d.startsWith("33")) return "+" + d;
  if (d.startsWith("0")) return "+33" + d.slice(1);
  if (d.length >= 6) return "+33" + d; // repli FR
  return "";
}

export async function sendSms(to: string, body: string): Promise<{ ok: boolean; reason?: string }> {
  if (!isSmsConfigured()) return { ok: false, reason: "not_configured" };
  const dest = toE164(to);
  if (!dest || dest.replace(/\D/g, "").length < 8) return { ok: false, reason: "bad_number" };
  try {
    const client = twilio(sid(), token());
    const params: Record<string, string> = { to: dest, body: body.slice(0, 480) };
    if (messagingSid()) params.messagingServiceSid = messagingSid();
    else params.from = smsFrom();
    await client.messages.create(params as unknown as Parameters<typeof client.messages.create>[0]);
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: String(e).slice(0, 120) };
  }
}
