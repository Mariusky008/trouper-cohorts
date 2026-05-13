import { NextResponse } from "next/server";
import { sendWhatsAppMediaMessage, sendWhatsAppTextMessage } from "@/lib/actions/whatsapp-twilio";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CHAT_ATTACHMENTS_BUCKET = "admin-whatsapp-chat-attachments";
const MAX_ATTACHMENT_BYTES = 12 * 1024 * 1024;
const WHATSAPP_WINDOW_HOURS = 24;

type ChatThread = {
  phone: string;
  displayName: string | null;
  lastAt: string;
  lastReceivedAt: string | null;
  lastDirection: "inbound" | "outbound" | "status";
  lastMessage: string | null;
  inboundCount: number;
  outboundCount: number;
  unresolvedInboundCount: number;
  isUnreadLatest: boolean;
};

type ChatMessage = {
  id: string;
  phone: string;
  direction: "inbound" | "outbound" | "status";
  text: string | null;
  attachments: Array<{ url: string; contentType: string | null; fileName: string | null }>;
  classification: "positive" | "negative" | "stop" | "neutral" | null;
  eventType: string;
  providerMessageId: string | null;
  createdAt: string;
};

async function requireAdminUser() {
  const userId = await getServerUserIdWithProxyFallback();
  if (!userId) return { error: "Session requise." as const };
  const supabaseAdmin = createAdminClient();
  const { data: adminRow } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (!adminRow?.user_id) return { error: "Acces admin requis." as const };
  const { data: memberRow } = await supabaseAdmin.from("human_members").select("id").eq("user_id", userId).maybeSingle();
  return { userId, ownerMemberId: memberRow?.id || null } as const;
}

function splitName(fullName: string) {
  const cleaned = String(fullName || "").trim();
  if (!cleaned) return { firstName: "", lastName: "", full: "" };
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "", full: "" };
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName, full: cleaned };
}

function safeFileName(value: string) {
  const raw = String(value || "").trim() || "piece-jointe";
  const sanitized = raw.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  return sanitized.slice(0, 120) || "piece-jointe";
}

type StoredAttachment = {
  bucket: string;
  path: string;
  contentType: string | null;
  originalName: string | null;
  sizeBytes: number | null;
};

function readStoredAttachments(payload: Record<string, unknown> | null | undefined): StoredAttachment[] {
  if (!payload || typeof payload !== "object") return [];
  const raw = (payload.attachments || []) as unknown;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : null))
    .filter(Boolean)
    .map((item) => ({
      bucket: String(item!.bucket || "").trim(),
      path: String(item!.path || "").trim(),
      contentType: String(item!.contentType || "").trim() || null,
      originalName: String(item!.originalName || "").trim() || null,
      sizeBytes: Number.isFinite(Number(item!.sizeBytes)) ? Number(item!.sizeBytes) : null,
    }))
    .filter((item) => Boolean(item.bucket && item.path));
}

function extractTextFallback(payload: Record<string, unknown> | null | undefined): string | null {
  if (!payload || typeof payload !== "object") return null;
  const params = (payload.params || {}) as Record<string, unknown>;
  const fromParams = String(params.Body || params.ButtonText || "").trim();
  if (fromParams) return fromParams;
  const attachments = readStoredAttachments(payload);
  const firstAttachment = attachments[0];
  if (firstAttachment?.originalName) return firstAttachment.originalName;
  const mediaUrls = (payload.media_urls || []) as unknown;
  if (Array.isArray(mediaUrls) && mediaUrls.length > 0) return "Pièce jointe";
  return null;
}

function formatAdminMessageText(raw: string | null | undefined): string | null {
  const value = String(raw || "").trim();
  if (!value) return null;
  const templateMatch = /^Template\s+HX[0-9a-f]{10,}:\s*/i.exec(value);
  if (templateMatch) return value.slice(templateMatch[0].length).trim() || null;
  if (value.toLowerCase().startsWith("template fallback twilio")) {
    const idx = value.indexOf(":");
    if (idx >= 0) return value.slice(idx + 1).trim() || null;
    return value;
  }
  return value;
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
      .select("id,phone_e164,direction,event_type,classification,message_text,provider_message_id,payload,created_at")
      .eq("phone_e164", phoneFilter)
      .order("created_at", { ascending: true })
      .limit(300);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    const rows = (data || []) as Array<Record<string, unknown>>;
    const attachmentsByBucket = new Map<string, Set<string>>();
    const storedAttachmentsById = new Map<string, StoredAttachment[]>();
    rows.forEach((row) => {
      const payload = (row.payload || {}) as Record<string, unknown>;
      const stored = readStoredAttachments(payload);
      if (!stored.length) return;
      const id = String(row.id || "");
      storedAttachmentsById.set(id, stored);
      stored.forEach((attachment) => {
        if (!attachmentsByBucket.has(attachment.bucket)) attachmentsByBucket.set(attachment.bucket, new Set());
        attachmentsByBucket.get(attachment.bucket)!.add(attachment.path);
      });
    });

    const signedUrlByKey = new Map<string, string>();
    for (const [bucket, pathsSet] of attachmentsByBucket.entries()) {
      const paths = Array.from(pathsSet.values());
      const { data: signedUrls } = await supabaseAdmin.storage.from(bucket).createSignedUrls(paths, 60 * 60);
      (signedUrls || []).forEach((signed) => {
        const path = String((signed as any)?.path || "").trim();
        const signedUrl = String((signed as any)?.signedUrl || "").trim();
        if (!path || !signedUrl) return;
        signedUrlByKey.set(`${bucket}:${path}`, signedUrl);
      });
    }

    const messages: ChatMessage[] = rows.map((row) => {
      const payload = (row.payload || {}) as Record<string, unknown>;
      const storedAttachments = storedAttachmentsById.get(String(row.id || "")) || readStoredAttachments(payload);
      const attachments = storedAttachments
        .map((attachment) => ({
          url: signedUrlByKey.get(`${attachment.bucket}:${attachment.path}`) || "",
          contentType: attachment.contentType,
          fileName: attachment.originalName,
        }))
        .filter((attachment) => Boolean(attachment.url));
      const rawText = String(row.message_text || "").trim() || extractTextFallback(payload) || "";
      return {
        id: String(row.id || ""),
        phone: String(row.phone_e164 || ""),
        direction: (String(row.direction || "status") as "inbound" | "outbound" | "status"),
        text: formatAdminMessageText(rawText),
        attachments,
        classification: (row.classification as "positive" | "negative" | "stop" | "neutral" | null) || null,
        eventType: String(row.event_type || ""),
        providerMessageId: String(row.provider_message_id || "").trim() || null,
        createdAt: String(row.created_at || ""),
      };
    });
    return NextResponse.json({ success: true, phone: phoneFilter, messages });
  }

  const { data, error } = await supabaseAdmin
    .from("human_whatsapp_events")
    .select("id,phone_e164,direction,event_type,classification,message_text,provider_message_id,payload,created_at")
    .not("phone_e164", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });

  type ThreadAccumulator = {
    phone: string;
    displayName: string | null;
    lastAt: string;
    lastDirection: "inbound" | "outbound" | "status";
    lastMessage: string | null;
    inboundCount: number;
    outboundCount: number;
    lastInboundAt: string | null;
    lastOutboundAt: string | null;
  };
  const threadMap = new Map<string, ThreadAccumulator>();
  ((data || []) as Array<Record<string, unknown>>).forEach((row) => {
    const phone = normalizePhone(String(row.phone_e164 || ""));
    if (!phone) return;
    const direction = (String(row.direction || "status") as "inbound" | "outbound" | "status");
    const createdAt = String(row.created_at || "");
    const text =
      formatAdminMessageText(
        String(row.message_text || "").trim() || extractTextFallback((row.payload || {}) as Record<string, unknown>) || null,
      ) || null;

    if (!threadMap.has(phone)) {
      threadMap.set(phone, {
        phone,
        displayName: null,
        lastAt: createdAt,
        lastDirection: direction,
        lastMessage: text,
        inboundCount: 0,
        outboundCount: 0,
        lastInboundAt: direction === "inbound" ? createdAt : null,
        lastOutboundAt: direction === "outbound" ? createdAt : null,
      });
    }
    const current = threadMap.get(phone)!;
    if (!current.lastMessage && direction !== "status" && text) {
      current.lastMessage = text;
    }
    if (direction === "inbound") {
      current.inboundCount += 1;
      if (!current.lastInboundAt) current.lastInboundAt = createdAt;
    }
    if (direction === "outbound") {
      current.outboundCount += 1;
      if (!current.lastOutboundAt) current.lastOutboundAt = createdAt;
    }
  });

  const phones = Array.from(threadMap.keys());
  const nameByPhone = new Map<string, string>();
  if (admin.ownerMemberId && phones.length > 0) {
    const [contactsResult, scoutsResult, leadsResult] = await Promise.all([
      supabaseAdmin
        .from("human_smart_scan_contacts")
        .select("phone_e164,full_name")
        .eq("owner_member_id", admin.ownerMemberId)
        .in("phone_e164", phones)
        .limit(300),
      supabaseAdmin
        .from("human_scouts")
        .select("phone,first_name,last_name")
        .eq("owner_member_id", admin.ownerMemberId)
        .in("phone", phones)
        .limit(300),
      supabaseAdmin
        .from("human_leads")
        .select("phone,client_name")
        .eq("owner_member_id", admin.ownerMemberId)
        .in("phone", phones)
        .limit(300),
    ]);
    ((contactsResult.data as Array<{ phone_e164: string | null; full_name: string | null }> | null) || []).forEach((row) => {
      const phone = normalizePhone(row.phone_e164 || "");
      const fullName = String(row.full_name || "").trim();
      if (!phone || !fullName) return;
      nameByPhone.set(phone, fullName);
    });
    ((scoutsResult.data as Array<{ phone: string | null; first_name: string | null; last_name: string | null }> | null) || []).forEach(
      (row) => {
        const phone = normalizePhone(row.phone || "");
        if (!phone || nameByPhone.has(phone)) return;
        const label = [String(row.first_name || "").trim(), String(row.last_name || "").trim()].filter(Boolean).join(" ").trim();
        if (!label) return;
        nameByPhone.set(phone, label);
      },
    );
    ((leadsResult.data as Array<{ phone: string | null; client_name: string | null }> | null) || []).forEach((row) => {
      const phone = normalizePhone(row.phone || "");
      if (!phone || nameByPhone.has(phone)) return;
      const label = String(row.client_name || "").trim();
      if (!label) return;
      nameByPhone.set(phone, label);
    });
  }

  const threads = Array.from(threadMap.values())
    .map((thread) => {
      const label = nameByPhone.get(thread.phone) || null;
      const name = label ? splitName(label) : null;
      const display = name?.firstName ? name.firstName : label;
      const isUnreadLatest = Boolean(thread.lastInboundAt && (!thread.lastOutboundAt || thread.lastInboundAt > thread.lastOutboundAt));
      return {
        phone: thread.phone,
        displayName: display || null,
        lastAt: thread.lastAt,
        lastReceivedAt: thread.lastInboundAt,
        lastDirection: thread.lastDirection,
        lastMessage: thread.lastMessage,
        inboundCount: thread.inboundCount,
        outboundCount: thread.outboundCount,
        unresolvedInboundCount: isUnreadLatest ? 1 : 0,
        isUnreadLatest,
      } satisfies ChatThread;
    })
    .sort((a, b) => {
      const unreadA = a.isUnreadLatest ? 1 : 0;
      const unreadB = b.isUnreadLatest ? 1 : 0;
      if (unreadA !== unreadB) return unreadB - unreadA;
      return (b.lastReceivedAt || b.lastAt).localeCompare(a.lastReceivedAt || a.lastAt);
    });
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

  const contentType = String(request.headers.get("content-type") || "").toLowerCase();
  const supabaseAdmin = createAdminClient();

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const phone = normalizePhone(String(formData.get("phone") || ""));
    const message = String(formData.get("message") || "").trim();
    const rawFileItems = [...formData.getAll("files"), ...formData.getAll("file")];
    const fileItems = rawFileItems
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const candidate = item as File;
        if (typeof (candidate as unknown as { arrayBuffer?: unknown }).arrayBuffer !== "function") return null;
        if (!("name" in candidate)) return null;
        return candidate;
      })
      .filter(Boolean) as File[];
    const files = fileItems.filter((file) => Number(file.size || 0) > 0).slice(0, 5);
    if (!phone) return NextResponse.json({ success: false, error: "Numero requis." }, { status: 400 });
    if (!message && files.length === 0) {
      return NextResponse.json({ success: false, error: "Message ou pièce jointe requis." }, { status: 400 });
    }
    if (files.some((file) => file.size > MAX_ATTACHMENT_BYTES)) {
      return NextResponse.json({ success: false, error: "Fichier trop volumineux (max 12MB)." }, { status: 400 });
    }

    if (files.length === 0) {
      const result = await sendWhatsAppTextMessage(phone, message, {
        ownerMemberId: admin.ownerMemberId,
        source: "admin_chat",
        metadata: { channel: "admin_chat" },
      });
      if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      return NextResponse.json({ success: true, sid: result.sid, status: result.status });
    }

    const cutoffIso = new Date(Date.now() - WHATSAPP_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
    const { data: lastInbound } = await supabaseAdmin
      .from("human_whatsapp_events")
      .select("created_at")
      .eq("phone_e164", phone)
      .eq("direction", "inbound")
      .order("created_at", { ascending: false })
      .limit(1);
    const lastInboundAt = String(((lastInbound as Array<{ created_at?: string | null }> | null) || [])[0]?.created_at || "").trim();
    if (!lastInboundAt || lastInboundAt < cutoffIso) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Fenêtre WhatsApp fermée (Twilio 63016). Le contact doit d'abord t'écrire sur WhatsApp pour rouvrir la fenêtre (24h), puis tu pourras envoyer une pièce jointe.",
        },
        { status: 400 },
      );
    }

    const phoneSlug = phone.replace(/[^\d]/g, "") || "unknown";
    const basePrefix = `whatsapp-chat/${admin.ownerMemberId}/${phoneSlug}`;
    const attachments: StoredAttachment[] = [];
    const signedUrls: string[] = [];
    for (const file of files) {
      const filePath = `${basePrefix}/${Date.now()}-${safeFileName(file.name)}`;
      const { error: uploadError } = await supabaseAdmin.storage.from(CHAT_ATTACHMENTS_BUCKET).upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || undefined,
      });
      if (uploadError) {
        return NextResponse.json({ success: false, error: `Upload impossible: ${uploadError.message}` }, { status: 400 });
      }
      const { data: signed, error: signedError } = await supabaseAdmin.storage
        .from(CHAT_ATTACHMENTS_BUCKET)
        .createSignedUrl(filePath, 60 * 60);
      if (signedError || !signed?.signedUrl) {
        return NextResponse.json({ success: false, error: `URL de partage impossible: ${signedError?.message || "erreur storage"}` }, { status: 400 });
      }
      attachments.push({
        bucket: CHAT_ATTACHMENTS_BUCKET,
        path: filePath,
        contentType: String(file.type || "").trim() || null,
        originalName: String(file.name || "").trim() || null,
        sizeBytes: Number.isFinite(file.size) ? file.size : null,
      });
      signedUrls.push(String(signed.signedUrl || "").trim());
    }

    const result = await sendWhatsAppMediaMessage(
      phone,
      { caption: message || undefined, mediaUrls: signedUrls },
      {
        ownerMemberId: admin.ownerMemberId,
        source: "admin_chat",
        metadata: { channel: "admin_chat", attachments },
      },
    );
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, sid: result.sid, status: result.status });
  }

  const body = (await request.json().catch(() => null)) as { phone?: string; message?: string } | null;
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
