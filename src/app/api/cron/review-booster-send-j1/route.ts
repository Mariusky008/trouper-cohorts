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
  const contentSidJ1 = String(process.env.TWILIO_REVIEW_CONTENT_SID_J1 || "").trim();
  const appUrl = String(process.env.NEXT_PUBLIC_APP_URL || "https://www.popey.academy").trim();

  if (!accountSid || !authToken || !contentSidJ1) {
    return NextResponse.json({
      skipped: true,
      reason: "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN ou TWILIO_REVIEW_CONTENT_SID_J1 manquants",
    });
  }

  const supabase = createAdminClient();

  // Clients à contacter : prestation hier ou avant-hier, pas encore envoyé
  const { data: clients, error } = await supabase
    .from("human_review_clients_finaux")
    .select(`
      id, prenom, telephone, lien_unique,
      human_review_commercants ( nom, abonnement )
    `)
    .eq("statut", "en_attente")
    .is("date_envoi_j1", null)
    .lte("date_prestation", new Date(Date.now() - 86400000).toISOString().split("T")[0])
    .gte("date_prestation", new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0])
    .limit(50);

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

    if (!commerce || commerce.abonnement === "résilié") { skipped++; continue; }

    // Template 3 variables :
    // {{1}} = prénom client
    // {{2}} = nom du commerce
    // {{3}} = URL de tracking (popey.academy/ra/[token]) → log clic → redirect Google
    try {
      await twilioClient.messages.create({
        from: whatsappFrom,
        to: `whatsapp:${client.telephone}`,
        contentSid: contentSidJ1,
        contentVariables: JSON.stringify({
          "1": client.prenom,
          "2": commerce.nom,
          "3": `${appUrl}/ra/${client.lien_unique}`,
        }),
      });

      await supabase
        .from("human_review_clients_finaux")
        .update({ statut: "envoyé", date_envoi_j1: new Date().toISOString() })
        .eq("id", client.id);

      sent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[review-booster-j1] Échec ${client.id}: ${msg}`);
      skipped++;
    }
  }

  return NextResponse.json({ sent, skipped });
}
