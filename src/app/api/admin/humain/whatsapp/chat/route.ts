import { NextResponse } from "next/server";
import { sendWhatsAppTextMessage } from "@/lib/actions/whatsapp-twilio";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ChatThread = {
  phone: string;
  lastAt: string;
  lastDirection: "inbound" | "outbound" | "status";
  lastMessage: string | null;
  inboundCount: number;
  outboundCount: number;
  unresolvedInboundCount: number;
};

type ChatMessage = {
  id: string;
  phone: string;
  direction: "inbound" | "outbound" | "status";
  text: string | null;
  classification: "positive" | "negative" | "stop" | "neutral" | null;
  eventType: string;
  createdAt: string;
};

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return { error: "Session requise." as const };
  const supabaseAdmin = createAdminClient();
  const { data: adminRow } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!adminRow?.user_id) return { error: "Acces admin requis." as const };
  const { data: memberRow } = await supabaseAdmin.from("human_members").select("id").eq("user_id", user.id).maybeSingle();
  return { userId: user.id, ownerMemberId: memberRow?.id || null } as const;
}

function extractTextFallback(payload: Record<string, unknown> | null | undefined): string | null {
  if (!payload || typeof payload !== "object") return null;
  const params = (payload.params || {}) as Record<string, unknown>;
  const fromParams = String(params.Body || params.ButtonText || "").trim();
  if (fromParams) return fromParams;
  return null;
}

function normalizePhone(raw: string | null | undefined): string {
  const value = String(raw || "").trim();
  if (!value) return "";
  const clean = value.replace(/[^\d+]/g, "");
  if (!clean) return "";
  if (clean.startsWith("+")) return clean.slice(0, 24);
  if (clean.startsWith("00")) return `+${clean.slice(2, 24)}`;
  if (clean.startsWith("0")) return `+33${clean.slice(1, 24)}`;
  return `+${clean.slice(0, 24)}`;
}

export async function GET(request: Request) {
  const admin = await requireAdminUser();
  if ("error" in admin) return NextResponse.json({ success: false, error: admin.error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const phoneFilter = normalizePhone(searchParams.get("phone"));
  const limitRaw = Number(searchParams.get("limit") || "500");
  const limit = Math.max(20, Math.min(2000, Number.isFinite(limitRaw) ? Math.round(limitRaw) : 500));
  const supabaseAdmin = createAdminClient();

  if (phoneFilter) {
    const { data, error } = await supabaseAdmin
      .from("human_whatsapp_events")
      .select("id,phone_e164,direction,event_type,classification,message_text,payload,created_at")
      .eq("phone_e164", phoneFilter)
      .order("created_at", { ascending: true })
      .limit(300);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    const messages: ChatMessage[] = ((data || []) as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id || ""),
      phone: String(row.phone_e164 || ""),
      direction: (String(row.direction || "status") as "inbound" | "outbound" | "status"),
      text: String(row.message_text || "").trim() || extractTextFallback((row.payload || {}) as Record<string, unknown>) || null,
      classification: (row.classification as "positive" | "negative" | "stop" | "neutral" | null) || null,
      eventType: String(row.event_type || ""),
      createdAt: String(row.created_at || ""),
    }));
    return NextResponse.json({ success: true, phone: phoneFilter, messages });
  }

  const { data, error } = await supabaseAdmin
    .from("human_whatsapp_events")
    .select("id,phone_e164,direction,event_type,classification,message_text,payload,created_at")
    .not("phone_e164", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });

  const threadMap = new Map<string, ChatThread>();
  ((data || []) as Array<Record<string, unknown>>).forEach((row) => {
    const phone = normalizePhone(String(row.phone_e164 || ""));
    if (!phone) return;
    const direction = (String(row.direction || "status") as "inbound" | "outbound" | "status");
    const createdAt = String(row.created_at || "");
    const text =
      String(row.message_text || "").trim() || extractTextFallback((row.payload || {}) as Record<string, unknown>) || null;

    if (!threadMap.has(phone)) {
      threadMap.set(phone, {
        phone,
        lastAt: createdAt,
        lastDirection: direction,
        lastMessage: text,
        inboundCount: 0,
        outboundCount: 0,
        unresolvedInboundCount: 0,
      });
    }
    const current = threadMap.get(phone)!;
    if (direction === "inbound") {
      current.inboundCount += 1;
      if (current.lastDirection !== "outbound") current.unresolvedInboundCount += 1;
    }
    if (direction === "outbound") {
      current.outboundCount += 1;
      current.unresolvedInboundCount = 0;
    }
  });

  const threads = Array.from(threadMap.values()).sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  return NextResponse.json({
    success: true,
    ownerMemberId: admin.ownerMemberId,
    threads,
  });
}

export async function POST(request: Request) {
  const admin = await requireAdminUser();
  if ("error" in admin) return NextResponse.json({ success: false, error: admin.error }, { status: 401 });
  if (!admin.ownerMemberId) {
    return NextResponse.json({ success: false, error: "Profil human_member admin introuvable." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as {
    phone?: string;
    message?: string;
  } | null;
  const phone = normalizePhone(body?.phone);
  const message = String(body?.message || "").trim();
  if (!phone) return NextResponse.json({ success: false, error: "Numero requis." }, { status: 400 });
  if (!message) return NextResponse.json({ success: false, error: "Message requis." }, { status: 400 });

  const result = await sendWhatsAppTextMessage(phone, message, {
    ownerMemberId: admin.ownerMemberId,
    source: "admin_chat",
    metadata: { channel: "admin_chat" },
  });
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true, sid: result.sid, status: result.status });
}
