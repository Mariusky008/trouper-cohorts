import { NextResponse } from "next/server";
import twilio from "twilio";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
  const whatsappFrom = String(process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886").trim();
  const contentSidJ6 = String(process.env.TWILIO_REVIEW_CONTENT_SID_J6 || "").trim();
  const appUrl = String(process.env.NEXT_PUBLIC_APP_URL || "").trim();

  if (!accountSid || !authToken || !contentSidJ6) {
    return NextResponse.json({
      skipped: true,
      reason: "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN ou TWILIO_REVIEW_CONTENT_SID_J6 manquants",
    });
  }

  const supabase = createAdminClient();

  // Clients à relancer : envoyés depuis 5 jours, pas encore relancés, pas répondu
  const cutoff = new Date(Date.now() - 5 * 86400000).toISOString();

  const { data: clients, error } = await supabase
    .from("human_review_clients_finaux")
    .select(`
      id, prenom, telephone, lien_unique,
      human_review_commercants ( slug, abonnement )
    `)
    .eq("statut", "envoyé")
    .is("date_envoi_j6", null)
    .lte("date_envoi_j1", cutoff)
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!clients?.length) return NextResponse.json({ sent: 0, skipped: 0 });

  const twilioClient = twilio(accountSid, authToken);
  let sent = 0;
  let skipped = 0;

  for (const client of clients) {
    const commerce = client.human_review_commercants as unknown as {
      slug: string;
      abonnement: string;
    } | null;

    if (!commerce || commerce.abonnement === "résilié") { skipped++; continue; }

    const lienFiltrage = `${appUrl}/avis/${commerce.slug}?t=${client.lien_unique}`;

    try {
      await twilioClient.messages.create({
        from: whatsappFrom,
        to: `whatsapp:${client.telephone}`,
        contentSid: contentSidJ6,
        contentVariables: JSON.stringify({
          "1": client.prenom,
          "2": lienFiltrage,
        }),
      });

      await supabase
        .from("human_review_clients_finaux")
        .update({ statut: "relancé", date_envoi_j6: new Date().toISOString() })
        .eq("id", client.id);

      sent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[review-booster-j6] Échec ${client.id}: ${msg}`);
      skipped++;
    }
  }

  return NextResponse.json({ sent, skipped });
}
