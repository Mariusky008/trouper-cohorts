// Alerte « QR scanné » : quand un prospect ouvre sa maquette pour la 1re fois,
// on prévient Marius (e-mail + SMS + WhatsApp, best-effort). Déclenché par le
// NAVIGATEUR réel (beacon au montage) → pas les robots d'aperçu de lien.
// Dédup via metadata.scan_notified_at → une seule alerte par prospect (1er scan).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppTextMessage } from "@/lib/actions/whatsapp-twilio";
import { sendSms } from "@/lib/site-internet/accueil-sms";

export const dynamic = "force-dynamic";

function notifyTarget(): string {
  const explicit = String(process.env.SITE_LETTER_NOTIFY_WHATSAPP || "").trim();
  if (explicit) return explicit.startsWith("+") ? explicit : `+${explicit.replace(/\D/g, "")}`;
  const digits = String(process.env.SITE_LETTER_WHATSAPP || "").replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug) return NextResponse.json({ error: "Lien invalide." }, { status: 400 });

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("human_vitrine_sites")
    .select("id, metadata, business_name, city, activite, published, site_views")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  if (!row) return NextResponse.json({ ok: true }); // rien à signaler, discret

  // On n'alerte pas pour un site déjà publié (client réel), seulement pour la prospection.
  if (row.published) return NextResponse.json({ ok: true });

  const meta = (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<string, unknown>;
  if (meta.scan_notified_at) return NextResponse.json({ ok: true }); // déjà notifié → dédup

  const now = new Date().toISOString();
  try {
    await supabase.from("human_vitrine_sites").update({ metadata: { ...meta, scan_notified_at: now } }).eq("id", String(row.id));
  } catch {
    return NextResponse.json({ ok: true }); // si l'écriture échoue, on n'envoie pas (évite les doublons)
  }

  const commerce = String(row.business_name || "un commerce");
  const ville = String(row.city || "");
  const activite = String(row.activite || "");
  const appUrl = String(process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
  const adminLink = appUrl ? `${appUrl}/admin/humain/site-internet` : "";
  const text = `👀 QR scanné : ${commerce}${ville ? ` · ${ville}` : ""}${activite ? ` (${activite})` : ""} vient d'ouvrir sa maquette.`;

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
        subject: `QR scanné — ${commerce}${ville ? ` (${ville})` : ""}`,
        text: `${text}\n\n${adminLink ? `Admin : ${adminLink}` : ""}`,
      });
    }
  } catch {
    /* best-effort */
  }

  // SMS (Twilio).
  try {
    const smsTo = String(process.env.SITE_LETTER_NOTIFY_SMS || process.env.SITE_LETTER_PHONE || "").trim() || notifyTarget();
    if (smsTo) await sendSms(smsTo, text);
  } catch {
    /* best-effort */
  }

  // WhatsApp (bonus).
  try {
    const target = notifyTarget();
    if (target) await sendWhatsAppTextMessage(target, `${text}${adminLink ? ` — ${adminLink}` : ""}`, { source: "site_internet_scan" });
  } catch {
    /* best-effort */
  }

  return NextResponse.json({ ok: true });
}
