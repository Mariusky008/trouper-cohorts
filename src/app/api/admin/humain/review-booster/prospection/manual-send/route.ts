import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

  const prenom = String(body.prenom || "").trim();
  const entreprise = String(body.entreprise || "").trim();
  const nbAvis = String(body.nbAvis || "").trim();
  const noteMoyenne = String(body.noteMoyenne || "").trim();
  const telephone = String(body.telephone || "").trim();
  const contentSid = String(body.contentSid || "").trim();

  if (!entreprise) return NextResponse.json({ error: "Nom de l'entreprise obligatoire." }, { status: 400 });
  if (!telephone) return NextResponse.json({ error: "Numéro de téléphone obligatoire." }, { status: 400 });
  if (!contentSid) return NextResponse.json({ error: "Content SID obligatoire." }, { status: 400 });

  const supabase = createAdminClient();

  const { error } = await supabase.from("human_whatsapp_outbound_queue").insert({
    owner_member_id: auth.ownerMemberId,
    phone_e164: telephone,
    template_name: contentSid,
    language_code: "fr",
    vars: [
      prenom ? ` ${prenom}` : ",",
      entreprise,
      nbAvis ? `${nbAvis} avis` : "peu d'avis",
      noteMoyenne || "bonne",
    ],
    quick_reply_payload: [],
    source: "admin_review_prospection_manual",
    metadata: {
      content_sid: contentSid,
      entreprise,
      prenom: prenom || null,
      nb_avis: nbAvis || null,
      note_moyenne: noteMoyenne || null,
    },
    status: "scheduled",
    attempt_count: 0,
    max_attempts: 2,
    random_delay_ms: 0,
    not_before_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[manual-send] supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
