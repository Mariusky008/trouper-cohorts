import { NextResponse } from "next/server";
import twilio from "twilio";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Délai minimum entre envoi WhatsApp et envoi SMS fallback (6 heures)
const SMS_FALLBACK_DELAY_HOURS = 6;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;
  return new URL(request.url).searchParams.get("secret") === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accountSid = String(process.env.TWILIO_ACCOUNT_SID || "").trim();
  const authToken = String(process.env.TWILIO_AUTH_TOKEN || "").trim();
  const smsFrom = String(process.env.TWILIO_SMS_FROM || "").trim();
  const appUrl = String(process.env.NEXT_PUBLIC_APP_URL || "https://www.popey.academy").trim();

  if (!accountSid || !authToken || !smsFrom) {
    return NextResponse.json({
      skipped: true,
      reason: "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN ou TWILIO_SMS_FROM manquants",
    });
  }

  const supabase = createAdminClient();

  // Clients dont le WhatsApp a été envoyé il y a plus de SMS_FALLBACK_DELAY_HOURS
  // mais qui n'ont pas encore reçu de SMS fallback
  const cutoff = new Date(Date.now() - SMS_FALLBACK_DELAY_HOURS * 60 * 60 * 1000).toISOString();

  const { data: clients, error } = await supabase
    .from("human_review_clients_finaux")
    .select(`
      id, prenom, telephone, lien_unique,
      human_review_commercants ( nom, abonnement )
    `)
    .eq("statut", "envoyé")
    .not("date_envoi_j1", "is", null)
    .lte("date_envoi_j1", cutoff)
    .is("date_envoi_sms", null)
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!clients?.length) return NextResponse.json({ sent: 0, skipped: 0 });

  const twilioClient = twilio(accountSid, authToken);
  let sent = 0;
  let skipped = 0;

  for (const client of clients) {
    const commerce = client.human_review_commercants as unknown as {
      nom: string;
      abonnement: string;
    } | null;

    if (!commerce || commerce.abonnement === "résilié" || !client.telephone) {
      skipped++;
      continue;
    }

    const reviewUrl = `${appUrl}/ra/${client.lien_unique}`;
    const body = `Bonjour ${client.prenom}, ${commerce.nom} vous remercie de votre visite ! Pourriez-vous nous laisser un avis Google ? ${reviewUrl}`;

    try {
      const delivered = await twilioClient.messages.create({
        from: smsFrom,
        to: client.telephone,
        body,
      });

      const now = new Date().toISOString();

      await supabase
        .from("human_review_clients_finaux")
        .update({ date_envoi_sms: now })
        .eq("id", client.id);

      // Logger dans human_whatsapp_events pour apparaître dans le chat avec badge SMS
      await supabase.from("human_whatsapp_events").insert({
        phone_e164: client.telephone,
        direction: "outbound",
        event_type: "sent",
        classification: null,
        message_text: body,
        provider_message_id: String(delivered.sid || "").trim() || null,
        payload: {
          channel: "sms",
          provider: "twilio_sms",
          sid: String(delivered.sid || "").trim() || null,
          source: "review_booster_sms_fallback",
          commerce_nom: commerce.nom,
          client_prenom: client.prenom,
        },
      });

      sent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[review-booster-sms-fallback] Échec SMS ${client.id}: ${msg}`);
      skipped++;
    }
  }

  return NextResponse.json({ sent, skipped });
}
