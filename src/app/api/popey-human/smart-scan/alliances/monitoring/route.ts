import { NextRequest, NextResponse } from "next/server";
import { ensureHumanMemberForUserId } from "@/lib/actions/human-permissions";
import { getWhatsAppQueueMonitoring } from "@/lib/actions/whatsapp-meta";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!smartScanFeatureFlags.enabled) {
    return NextResponse.json({ error: "Smart Scan desactive." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") === "internal" ? "internal" : "b2b";
  const hoursRaw = Number(searchParams.get("hours") || "24");
  const hours = Number.isFinite(hoursRaw) ? Math.max(1, Math.min(168, Math.round(hoursRaw))) : 24;
  const sinceIso = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Session requise." }, { status: 401 });
  }

  const ensured = await ensureHumanMemberForUserId(user.id);
  if (!ensured?.id) {
    return NextResponse.json({ error: "Profil Popey Human introuvable." }, { status: 400 });
  }

  const ownerMemberId = ensured.id;
  const supabaseAdmin = createAdminClient();

  const [searchRunsResult, invitesResult, whatsappMonitoring] = await Promise.all([
    supabaseAdmin
      .from("human_smart_scan_alliance_search_runs")
      .select("id,provider,city,source_metier,target_metiers,radius_km,total_found,metadata,created_at")
      .eq("owner_member_id", ownerMemberId)
      .eq("provider", provider)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(25),
    supabaseAdmin
      .from("human_smart_scan_alliance_invites")
      .select("status,created_at")
      .eq("owner_member_id", ownerMemberId)
      .gte("created_at", sinceIso)
      .limit(5000),
    getWhatsAppQueueMonitoring({ ownerMemberId, hours }),
  ]);

  if (searchRunsResult.error) {
    return NextResponse.json({ error: searchRunsResult.error.message }, { status: 400 });
  }
  if (invitesResult.error) {
    return NextResponse.json({ error: invitesResult.error.message }, { status: 400 });
  }
  if ("error" in whatsappMonitoring) {
    return NextResponse.json({ error: whatsappMonitoring.error }, { status: 400 });
  }

  const inviteCounts: Record<string, number> = {};
  ((invitesResult.data as Array<{ status: string | null }> | null) || []).forEach((row) => {
    const key = String(row.status || "unknown");
    inviteCounts[key] = Number(inviteCounts[key] || 0) + 1;
  });

  return NextResponse.json({
    success: true,
    ownerMemberId,
    provider,
    windowHours: hours,
    sinceIso,
    alliance: {
      searchRuns: searchRunsResult.data || [],
      inviteCounts,
    },
    whatsapp: whatsappMonitoring,
  });
}

