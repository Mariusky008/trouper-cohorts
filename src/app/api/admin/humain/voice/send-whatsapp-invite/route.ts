import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";
import { sendWhatsAppTextMessage } from "@/lib/actions/whatsapp-twilio";

export const dynamic = "force-dynamic";

function trim(value: unknown): string {
  return String(value || "").trim();
}

function normalizePhone(raw: string): string {
  const clean = trim(raw).replace(/[^\d+]/g, "");
  if (!clean) return "";
  if (clean.startsWith("+")) return clean.slice(0, 24);
  if (clean.startsWith("00")) return `+${clean.slice(2, 24)}`;
  if (clean.startsWith("0")) return `+33${clean.slice(1, 24)}`;
  return `+${clean.slice(0, 24)}`;
}

async function requireAdminUser() {
  const userId = await getServerUserIdWithProxyFallback();
  if (!userId) return { error: "Session requise." as const };
  const supabaseAdmin = createAdminClient();
  const { data: adminRow } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (!adminRow?.user_id) return { error: "Accès admin requis." as const };
  const { data: memberRow } = await supabaseAdmin.from("human_members").select("id").eq("user_id", userId).maybeSingle();
  if (!memberRow?.id) return { error: "human_member introuvable." as const };
  return { userId, ownerMemberId: String(memberRow.id) } as const;
}

export async function POST(request: Request) {
  const admin = await requireAdminUser();
  if ("error" in admin) return NextResponse.json({ success: false, error: admin.error }, { status: 401 });

  const body = (await request.json().catch(() => null)) as null | {
    phone?: string;
    firstName?: string;
    city?: string;
    job?: string;
  };

  const phone = normalizePhone(trim(body?.phone || ""));
  const firstName = trim(body?.firstName || "");
  const city = trim(body?.city || "Dax") || "Dax";
  const job = trim(body?.job || "coach") || "coach";

  if (!phone) return NextResponse.json({ success: false, error: "phone requis." }, { status: 400 });

  const baseUrl = trim(process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
  const rappelUrl = baseUrl ? `${baseUrl}/popey-human/rappel` : "/popey-human/rappel";

  const greeting = firstName ? `Bonjour ${firstName},` : "Bonjour,";
  const text = [
    `${greeting} c'est l'assistant de Jean-Philippe de Popey.`,
    `On référence en ce moment un seul ${job} sur ${city} et votre profil correspond.`,
    `Si ça vous intéresse, répondez juste RAPPEL et je vous appelle (9h-12h, 14h-18h30), ou cliquez ici : ${rappelUrl}`,
  ].join(" ");

  const sent = await sendWhatsAppTextMessage(phone, text, {
    ownerMemberId: admin.ownerMemberId,
    source: "voice_outreach_invite_v1",
    metadata: {
      flow: "voice_outreach_v1",
      first_name: firstName || null,
      city,
      job,
      rappel_url: rappelUrl,
    },
  });

  if (!sent.success) {
    return NextResponse.json({ success: false, error: sent.error || "Envoi WhatsApp impossible." }, { status: 400 });
  }

  return NextResponse.json({ success: true, to: phone });
}

