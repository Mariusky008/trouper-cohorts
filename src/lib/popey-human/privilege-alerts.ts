import { createAdminClient } from "@/lib/supabase/admin";

// Traite les réponses WhatsApp entrantes pour les abonnés aux alertes commerçant.
//   - "OUI / yes / ok / je confirme…" sur un abonné 'pending' → 'confirmed' (double opt-in)
//   - "NON / STOP / arrêt / désinscri…"                       → 'unsubscribed'
// Les alertes partant via Twilio, les réponses arrivent au webhook Twilio (form From/Body/ButtonText)
// ET, le cas échéant, au webhook Meta (payload entry/changes/messages) : on gère les deux formats.
// Ne casse jamais le webhook : toute erreur est avalée.

type MetaInboundMessage = {
  from?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string; payload?: string };
  interactive?: { button_reply?: { title?: string; id?: string } };
};
type MetaWebhookPayload = {
  entry?: Array<{ changes?: Array<{ value?: { messages?: MetaInboundMessage[] } }> }>;
};

function extractText(msg: MetaInboundMessage): string {
  if (msg.type === "text") return String(msg.text?.body || "");
  if (msg.type === "button") return String(msg.button?.text || msg.button?.payload || "");
  if (msg.type === "interactive") return String(msg.interactive?.button_reply?.title || msg.interactive?.button_reply?.id || "");
  return "";
}

function normalize(text: string): string {
  return String(text || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Désinscription : NON (template opt-in) OU STOP (template diffusion) + variantes.
const UNSUB_RE = /\b(non|stop|arret|arretez|desinscri|desabonn|unsubscribe)\b/;
// Confirmation : OUI + variantes.
const CONFIRM_RE = /\b(oui|yes|ok|confirme|confirmer|interesse|interessee|d'accord|daccord)\b/;

// Cœur partagé : applique la réponse d'un numéro à son abonnement (résilient).
async function applyAlertReply(phoneE164: string, rawText: string): Promise<void> {
  const norm = normalize(rawText);
  if (!phoneE164 || !norm) return;
  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();
  if (UNSUB_RE.test(norm)) {
    await supabase
      .from("human_privilege_alert_subscribers")
      .update({ status: "unsubscribed", unsubscribed_at: nowIso, updated_at: nowIso })
      .eq("phone", phoneE164)
      .neq("status", "unsubscribed");
  } else if (CONFIRM_RE.test(norm)) {
    await supabase
      .from("human_privilege_alert_subscribers")
      .update({ status: "confirmed", confirmed_at: nowIso, updated_at: nowIso })
      .eq("phone", phoneE164)
      .eq("status", "pending");
  }
}

// Webhook META (payload entry/changes/messages).
export async function handlePrivilegeAlertReply(payload: unknown): Promise<void> {
  try {
    const data = payload as MetaWebhookPayload;
    const entries = Array.isArray(data?.entry) ? data.entry : [];
    if (!entries.length) return;
    for (const entry of entries) {
      for (const change of entry?.changes || []) {
        for (const msg of change?.value?.messages || []) {
          const fromDigits = String(msg?.from || "").replace(/[^\d]/g, "");
          if (!fromDigits) continue;
          await applyAlertReply("+" + fromDigits, extractText(msg));
        }
      }
    }
  } catch (error) {
    console.error("[privilege-alerts] meta reply handling failed", error);
  }
}

// Webhook TWILIO (form data : From=whatsapp:+33…, Body, ButtonText, ButtonPayload).
export async function handlePrivilegeAlertReplyTwilio(params: Record<string, string>): Promise<void> {
  try {
    const fromDigits = String(params.From || params.WaId || "").replace(/[^\d]/g, "");
    if (!fromDigits) return;
    const text = String(params.ButtonText || params.Body || params.ButtonPayload || "");
    await applyAlertReply("+" + fromDigits, text);
  } catch (error) {
    console.error("[privilege-alerts] twilio reply handling failed", error);
  }
}
