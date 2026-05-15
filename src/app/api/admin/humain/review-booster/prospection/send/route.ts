import { NextResponse } from "next/server";
import twilio from "twilio";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/actions/review-booster-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await requireAdminUser();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const prospectIds: string[] = Array.isArray(body.prospectIds) ? body.prospectIds : [];
  const contentSid = String(body.contentSid || "").trim();

  if (!prospectIds.length) return NextResponse.json({ error: "Aucun prospect sélectionné." }, { status: 400 });
  if (!contentSid) return NextResponse.json({ error: "contentSid manquant." }, { status: 400 });

  const accountSid = String(process.env.TWILIO_ACCOUNT_SID || "").trim();
  const authToken = String(process.env.TWILIO_AUTH_TOKEN || "").trim();
  const whatsappFrom = String(process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886").trim();

  if (!accountSid || !authToken) {
    return NextResponse.json({ error: "Twilio credentials manquants." }, { status: 500 });
  }

  const supabase = createAdminClient();
  const twilioClient = twilio(accountSid, authToken);

  let sent = 0;
  let skipped = 0;

  for (const prospectId of prospectIds) {
    const { data: prospect, error: fetchError } = await supabase
      .from("human_review_prospects")
      .select("id, nom, telephone, proprietaire, statut")
      .eq("id", prospectId)
      .maybeSingle();

    if (fetchError || !prospect) { skipped++; continue; }
    if (prospect.statut !== "nouveau") { skipped++; continue; }

    try {
      await twilioClient.messages.create({
        from: whatsappFrom,
        to: `whatsapp:${prospect.telephone}`,
        contentSid,
        contentVariables: JSON.stringify({
          "1": prospect.proprietaire || "là",
          "2": prospect.nom,
        }),
      });

      await supabase
        .from("human_review_prospects")
        .update({
          statut: "contacté",
          date_contact: new Date().toISOString(),
          template_sid_used: contentSid,
        })
        .eq("id", prospectId);

      sent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[prospection-send] Échec ${prospectId}: ${msg}`);
      skipped++;
    }
  }

  return NextResponse.json({ sent, skipped });
}
