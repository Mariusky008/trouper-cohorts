import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function requireAdminUser() {
  const userId = await getServerUserIdWithProxyFallback();
  if (!userId) return { error: "Session requise." as const };
  const supabaseAdmin = createAdminClient();
  const { data: adminRow, error: adminError } = await supabaseAdmin
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (adminError || !adminRow?.user_id) return { error: "Accès admin requis." as const };
  const { data: memberRow, error: memberError } = await supabaseAdmin.from("human_members").select("id").eq("user_id", userId).maybeSingle();
  if (memberError || !memberRow?.id) return { error: "Profil human_member admin introuvable." as const };
  return { ownerMemberId: String(memberRow.id) };
}

function normalizeVars(values: string[]): string[] {
  return values.map((value) => String(value || "").trim()).filter(Boolean).slice(0, 5);
}

export async function POST(request: Request) {
  const admin = await requireAdminUser();
  if ("error" in admin) return NextResponse.json({ success: false, error: admin.error }, { status: 401 });

  const payload: unknown = await request.json().catch(() => null);
  const slug =
    typeof payload === "object" && payload && "slug" in payload ? String((payload as { slug?: unknown }).slug || "").trim() : "";
  if (!slug) return NextResponse.json({ success: false, error: "Slug manquant." }, { status: 400 });

  const contentSid =
    String(process.env.TWILIO_WHATSAPP_CONTENT_SID_DIRECT || "").trim() || String(process.env.TWILIO_WHATSAPP_CONTENT_SID || "").trim();
  if (!contentSid) return NextResponse.json({ success: false, error: "Content SID Twilio manquant." }, { status: 400 });

  const supabaseAdmin = createAdminClient();
  const { data: siteRow, error: siteError } = await supabaseAdmin
    .from("human_vitrine_sites")
    .select("slug,status,public_url,business_name,city,category,whatsapp_phone_e164")
    .eq("slug", slug)
    .maybeSingle();
  if (siteError) return NextResponse.json({ success: false, error: siteError.message }, { status: 500 });
  if (!siteRow?.slug) return NextResponse.json({ success: false, error: "Vitrine introuvable." }, { status: 404 });

  const row = (siteRow || null) as
    | {
        slug: string;
        status: string | null;
        public_url: string | null;
        business_name: string | null;
        city: string | null;
        category: string | null;
        whatsapp_phone_e164: string | null;
      }
    | null;

  const status = String(row?.status || "").trim();
  if (status !== "approved") {
    return NextResponse.json({ success: false, error: "Statut invalide: approuve la vitrine avant l’envoi." }, { status: 400 });
  }

  const phoneE164 = String(row?.whatsapp_phone_e164 || "").trim();
  const publicUrl = String(row?.public_url || "").trim();
  if (!phoneE164) return NextResponse.json({ success: false, error: "WhatsApp manquant sur la vitrine." }, { status: 400 });
  if (!publicUrl) return NextResponse.json({ success: false, error: "URL publique manquante." }, { status: 400 });

  const businessName = String(row?.business_name || "").trim() || "Entreprise";
  const city = String(row?.city || "").trim() || "France";
  const category = String(row?.category || "").trim();

  const nowIso = new Date().toISOString();
  const vars = normalizeVars([businessName, city, category, publicUrl]);

  const { error: queueError } = await supabaseAdmin.from("human_whatsapp_outbound_queue").insert({
    owner_member_id: admin.ownerMemberId,
    phone_e164: phoneE164,
    template_name: contentSid,
    language_code: "fr",
    vars,
    quick_reply_payload: [],
    source: "admin_vitrine",
    metadata: {
      provider: "twilio_vitrine",
      vitrine_slug: slug,
      public_url: publicUrl,
      business_name: businessName,
      city,
      category,
      content_sid: contentSid,
    },
    status: "scheduled",
    attempt_count: 0,
    max_attempts: 2,
    random_delay_ms: 0,
    not_before_at: nowIso,
    updated_at: nowIso,
  });

  if (queueError) return NextResponse.json({ success: false, error: queueError.message }, { status: 400 });

  return NextResponse.json({ success: true }, { status: 200 });
}
