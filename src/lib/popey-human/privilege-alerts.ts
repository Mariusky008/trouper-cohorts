import { createAdminClient } from "@/lib/supabase/admin";

// Traite les réponses WhatsApp entrantes pour les abonnés aux alertes commerçant.
// Isolé du cœur du webhook Meta : on ne fait que mettre à jour le statut de l'abonné.
//   - "OUI / yes / ok / je confirme…" sur un abonné 'pending' → 'confirmed' (double opt-in)
//   - "STOP / arrêt / désinscri…"                            → 'unsubscribed'
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

export async function handlePrivilegeAlertReply(payload: unknown): Promise<void> {
  try {
    const data = payload as MetaWebhookPayload;
    const entries = Array.isArray(data?.entry) ? data.entry : [];
    if (!entries.length) return;

    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    for (const entry of entries) {
      for (const change of entry?.changes || []) {
        for (const msg of change?.value?.messages || []) {
          const fromDigits = String(msg?.from || "").replace(/[^\d]/g, "");
          if (!fromDigits) continue;
          const phoneE164 = "+" + fromDigits;
          const norm = normalize(extractText(msg));
          if (!norm) continue;

          if (/\b(stop|arret|arretez|desinscri|desabonn|unsubscribe)\b/.test(norm)) {
            await supabase
              .from("human_privilege_alert_subscribers")
              .update({ status: "unsubscribed", unsubscribed_at: nowIso, updated_at: nowIso })
              .eq("phone", phoneE164)
              .neq("status", "unsubscribed");
          } else if (/\b(oui|yes|ok|confirme|confirmer|interesse|interessee|d'accord|daccord)\b/.test(norm)) {
            await supabase
              .from("human_privilege_alert_subscribers")
              .update({ status: "confirmed", confirmed_at: nowIso, updated_at: nowIso })
              .eq("phone", phoneE164)
              .eq("status", "pending");
          }
        }
      }
    }
  } catch (error) {
    console.error("[privilege-alerts] reply handling failed", error);
  }
}
