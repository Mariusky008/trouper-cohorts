import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function requireAdminWithMember() {
  const userId = await getServerUserIdWithProxyFallback();
  if (!userId) return { error: "Session requise." as const };
  const supabase = createAdminClient();
  const { data: adminRow } = await supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (!adminRow?.user_id) return { error: "Accès admin requis." as const };
  const { data: memberRow } = await supabase.from("human_members").select("id").eq("user_id", userId).maybeSingle();
  if (!memberRow?.id) return { error: "Profil human_member introuvable." as const };
  return { ownerMemberId: String(memberRow.id) };
}

export async function POST(request: Request) {
  const auth = await requireAdminWithMember();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const prospectIds: string[] = Array.isArray(body.prospectIds) ? body.prospectIds : [];
  const contentSid = String(body.contentSid || "").trim();

  if (!prospectIds.length) return NextResponse.json({ error: "Aucun prospect sélectionné." }, { status: 400 });
  if (!contentSid) return NextResponse.json({ error: "contentSid manquant." }, { status: 400 });

  const supabase = createAdminClient();
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

    const { error: queueError } = await supabase.from("human_whatsapp_outbound_queue").insert({
      owner_member_id: auth.ownerMemberId,
      phone_e164: prospect.telephone,
      template_name: contentSid,
      language_code: "fr",
      vars: [prospect.proprietaire ? ` ${prospect.proprietaire}` : ",", prospect.nom],
      quick_reply_payload: [],
      source: "admin_review_prospection",
      metadata: {
        content_sid: contentSid,
        prospect_id: prospectId,
        prospect_nom: prospect.nom,
      },
      status: "pending",
      attempt_count: 0,
      max_attempts: 2,
      random_delay_ms: 0,
      not_before_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (queueError) { skipped++; continue; }

    await supabase
      .from("human_review_prospects")
      .update({
        statut: "contacté",
        date_contact: new Date().toISOString(),
        template_sid_used: contentSid,
      })
      .eq("id", prospectId);

    sent++;
  }

  return NextResponse.json({ sent, skipped });
}
