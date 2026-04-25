import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type WeeklyStats = {
  newContacts: number;
  pendingScouts: number;
  potential: number;
};

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const { searchParams } = new URL(request.url);
  return searchParams.get("secret") === secret;
}

function toDigitsPhone(value: string | null | undefined) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("33")) return digits;
  if (digits.startsWith("0")) return `33${digits.slice(1)}`;
  return digits;
}

async function dispatchWhatsAppMessage(input: { phone: string; message: string; memberId: string }) {
  const webhookUrl = String(process.env.WHATSAPP_CRON_WEBHOOK_URL || "").trim();
  const bearer = String(process.env.WHATSAPP_CRON_WEBHOOK_BEARER || "").trim();

  if (!webhookUrl) {
    return { ok: false as const, dryRun: true as const, reason: "WHATSAPP_CRON_WEBHOOK_URL manquant" };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    },
    body: JSON.stringify({
      phone: input.phone,
      message: input.message,
      memberId: input.memberId,
      channel: "whatsapp",
      source: "weekly_report",
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return {
      ok: false as const,
      dryRun: false as const,
      reason: text || `Webhook HTTP ${response.status}`,
    };
  }

  return { ok: true as const, dryRun: false as const };
}

async function getWeeklyStatsForMember(memberId: string, sinceIso: string, untilIso: string): Promise<WeeklyStats> {
  const supabase = createAdminClient();

  const [{ count: newContacts }, { count: pendingScouts }, { data: sessions }] = await Promise.all([
    supabase
      .from("human_smart_scan_contacts")
      .select("*", { count: "exact", head: true })
      .eq("owner_member_id", memberId)
      .gte("created_at", sinceIso)
      .lte("created_at", untilIso),
    supabase
      .from("human_scouts")
      .select("*", { count: "exact", head: true })
      .eq("owner_member_id", memberId)
      .in("status", ["invited", "pending"]),
    supabase
      .from("human_smart_scan_daily_sessions")
      .select("target_potential_eur")
      .eq("owner_member_id", memberId)
      .gte("created_at", sinceIso)
      .lte("created_at", untilIso)
      .order("created_at", { ascending: false })
      .limit(7),
  ]);

  const potentialRows = (sessions as Array<{ target_potential_eur: number | null }> | null) || [];
  const potential =
    potentialRows.length > 0
      ? Math.round(
          potentialRows.reduce((sum, row) => sum + Number(row.target_potential_eur || 0), 0) / potentialRows.length
        )
      : 0;

  return {
    newContacts: Number(newContacts || 0),
    pendingScouts: Number(pendingScouts || 0),
    potential: Number.isFinite(potential) ? potential : 0,
  };
}

async function handleWeeklyWhatsAppCron(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const since = new Date(now);
  since.setUTCDate(now.getUTCDate() - 7);
  const sinceIso = since.toISOString();
  const untilIso = now.toISOString();

  const { data: members, error } = await supabase
    .from("human_members")
    .select("id,first_name,phone,public_slug,status")
    .eq("status", "active");
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const activeMembers =
    ((members as Array<{ id: string; first_name: string | null; phone: string | null; public_slug: string | null; status: string }> | null) ||
      [])
      .filter((member) => toDigitsPhone(member.phone).length >= 9);

  let sent = 0;
  let dryRun = 0;
  const failures: Array<{ memberId: string; reason: string }> = [];

  for (const member of activeMembers) {
    const stats = await getWeeklyStatsForMember(member.id, sinceIso, untilIso);
    const phone = toDigitsPhone(member.phone);
    const firstName = String(member.first_name || "").trim() || "Membre";
    const slug = String(member.public_slug || "").trim();
    const link = slug ? `https://www.popey.academy/popey-link/${slug}` : "https://www.popey.academy/popey-human/app";
    const message = `Bonjour ${firstName} - cette semaine sur Popey :
• ${stats.newContacts} nouveaux contacts a activer
• ${stats.pendingScouts} eclaireurs en attente
• Potentiel estime : ~${stats.potential} EUR

Ouvrir Popey -> ${link}`;

    const dispatch = await dispatchWhatsAppMessage({
      phone,
      message,
      memberId: member.id,
    });

    if (dispatch.ok) {
      sent += 1;
      continue;
    }
    if (dispatch.dryRun) {
      dryRun += 1;
      continue;
    }
    failures.push({ memberId: member.id, reason: dispatch.reason });
  }

  return NextResponse.json({
    success: failures.length === 0,
    totalActiveMembers: activeMembers.length,
    sent,
    dryRun,
    failures,
    window: {
      since: sinceIso,
      until: untilIso,
    },
  });
}

export async function GET(request: Request) {
  return handleWeeklyWhatsAppCron(request);
}

export async function POST(request: Request) {
  return handleWeeklyWhatsAppCron(request);
}
