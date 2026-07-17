// Lead public depuis la landing de contact (QR de la lettre "Site internet").
// Enregistre contact_lead_at + passe letter_status à 'contacted' + stocke le
// lead dans metadata. Route publique (pas d'auth admin) : on ne lit/écrit que
// via le slug d'une fiche channel='letter', et on n'expose rien en retour.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppTextMessage } from "@/lib/actions/whatsapp-twilio";
import { sendSms } from "@/lib/site-internet/accueil-sms";

export const dynamic = "force-dynamic";

// Numéro qui reçoit l'alerte de lead (E.164). Priorité à SITE_LETTER_NOTIFY_WHATSAPP,
// sinon on dérive de SITE_LETTER_WHATSAPP (digits "33..." -> "+33...").
function notifyTarget(): string {
  const explicit = String(process.env.SITE_LETTER_NOTIFY_WHATSAPP || "").trim();
  if (explicit) return explicit.startsWith("+") ? explicit : `+${explicit.replace(/\D/g, "")}`;
  const digits = String(process.env.SITE_LETTER_WHATSAPP || "").replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) return NextResponse.json({ error: "Lien invalide." }, { status: 400 });

  let payload: Record<string, unknown> | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const name = String(payload?.name || "").trim().slice(0, 80);
  const phoneRaw = String(payload?.phone || "").trim();
  const phoneDigits = phoneRaw.replace(/\D/g, "");
  if (phoneDigits.length < 9 || phoneDigits.length > 15) {
    return NextResponse.json({ error: "Numéro de téléphone invalide." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("human_vitrine_sites")
    .select("id, metadata, contact_lead_at, business_name, city")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();

  if (!row) return NextResponse.json({ error: "Fiche introuvable." }, { status: 404 });

  const now = new Date().toISOString();
  const meta = (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<string, unknown>;
  const leads = Array.isArray(meta.leads) ? (meta.leads as unknown[]) : [];
  leads.push({ name, phone: phoneRaw.slice(0, 40), at: now });

  const patch: Record<string, unknown> = {
    metadata: { ...meta, leads },
    letter_status: "contacted",
  };
  // Ne réécrit pas la date du 1er contact.
  if (!row.contact_lead_at) patch.contact_lead_at = now;

  const { error } = await supabase.from("human_vitrine_sites").update(patch).eq("id", String(row.id));
  if (error) return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });

  // ── Alertes best-effort (jamais bloquantes). Plusieurs canaux pour la fiabilité :
  //    e-mail + SMS (fiables, sans fenêtre de 24 h) + WhatsApp (bonus). ──────────
  const commerce = String(row.business_name || "un commerce");
  const ville = String(row.city || "");
  const who = name ? `${name} (${commerce}${ville ? ` · ${ville}` : ""})` : `${commerce}${ville ? ` · ${ville}` : ""}`;
  const appUrl = String(process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
  const adminLink = appUrl ? `${appUrl}/admin/humain/site-internet` : "";
  const text = `🔔 Nouveau contact « Site internet » : ${who} souhaite être rappelé au ${phoneRaw}.`;

  // E-mail (Resend).
  try {
    const to = String(process.env.SITE_NOTIFY_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || "").trim();
    const key = String(process.env.RESEND_API_KEY || "").trim();
    const from = String(process.env.RESEND_FROM || "").trim() || "Popey Academy <contact@popey.academy>";
    if (to && key) {
      const { Resend } = await import("resend");
      await new Resend(key).emails.send({
        from,
        to,
        subject: `Nouveau contact — ${commerce}${ville ? ` (${ville})` : ""}`,
        text: `${text}\n\n${adminLink ? `Admin : ${adminLink}` : ""}`,
      });
    }
  } catch {
    /* best-effort */
  }

  // SMS (Twilio) vers le numéro d'alerte.
  try {
    const smsTo = String(process.env.SITE_LETTER_NOTIFY_SMS || process.env.SITE_LETTER_PHONE || "").trim() || notifyTarget();
    if (smsTo) await sendSms(smsTo, text);
  } catch {
    /* best-effort */
  }

  // WhatsApp (bonus — peut échouer hors fenêtre de session, d'où l'e-mail/SMS).
  try {
    const target = notifyTarget();
    if (target) await sendWhatsAppTextMessage(target, `${text}${adminLink ? ` — ${adminLink}` : ""}`, { source: "site_internet_lead" });
  } catch {
    /* best-effort */
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
