import { NextRequest, NextResponse } from "next/server";
import { ensureHumanMemberForUserId } from "@/lib/actions/human-permissions";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";
import { smartScanProfileUpdateSchema } from "@/lib/popey-human/smart-scan-validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function normalizePublicSlug(input: string) {
  const base = String(input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.slice(0, 120);
}

export async function GET() {
  if (!smartScanFeatureFlags.enabled) {
    return NextResponse.json({ error: "Smart Scan desactive." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Session requise." }, { status: 401 });
  }

  const member = await ensureHumanMemberForUserId(user.id);
  if (!member) {
    return NextResponse.json({ error: "Profil Popey Human introuvable." }, { status: 404 });
  }

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("human_members")
    .select("id,first_name,last_name,metier,buddy_name,buddy_metier,trio_name,trio_metier,eclaireur_reward_mode,eclaireur_reward_percent,eclaireur_reward_fixed_eur,ville,phone,status,sector_id,metier_label,public_slug,offre_decouverte,bio,contact_link,onboarding_completed_at")
    .eq("id", member.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    profile: data || null,
  });
}

export async function POST(request: NextRequest) {
  if (!smartScanFeatureFlags.enabled) {
    return NextResponse.json({ error: "Smart Scan desactive." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Session requise." }, { status: 401 });
  }

  const member = await ensureHumanMemberForUserId(user.id);
  if (!member) {
    return NextResponse.json({ error: "Profil Popey Human introuvable." }, { status: 404 });
  }

  const parsed = smartScanProfileUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload profil invalide." }, { status: 400 });
  }
  const body = parsed.data;

  const supabaseAdmin = createAdminClient();
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if ("firstName" in body) payload.first_name = String(body.firstName || "").trim() || null;
  if ("lastName" in body) payload.last_name = String(body.lastName || "").trim() || null;
  if ("metier" in body) payload.metier = String(body.metier || "").trim() || null;
  if ("buddyName" in body) payload.buddy_name = String(body.buddyName || "").trim() || null;
  if ("buddyMetier" in body) payload.buddy_metier = String(body.buddyMetier || "").trim() || null;
  if ("trioName" in body) payload.trio_name = String(body.trioName || "").trim() || null;
  if ("trioMetier" in body) payload.trio_metier = String(body.trioMetier || "").trim() || null;
  if ("eclaireurRewardMode" in body) {
    payload.eclaireur_reward_mode = body.eclaireurRewardMode === "fixed" ? "fixed" : "percent";
  }
  if ("eclaireurRewardPercent" in body) {
    const rewardPercent = Number.parseFloat(String(body.eclaireurRewardPercent || "").replace(",", "."));
    payload.eclaireur_reward_percent = Number.isFinite(rewardPercent) && rewardPercent > 0 ? rewardPercent : null;
  }
  if ("eclaireurRewardFixedEur" in body) {
    const rewardFixedEur = Number.parseFloat(String(body.eclaireurRewardFixedEur || "").replace(",", "."));
    payload.eclaireur_reward_fixed_eur = Number.isFinite(rewardFixedEur) && rewardFixedEur > 0 ? rewardFixedEur : null;
  }
  if ("ville" in body) payload.ville = String(body.ville || "").trim() || null;
  if ("phone" in body) payload.phone = String(body.phone || "").trim() || null;
  if ("sectorId" in body) payload.sector_id = String(body.sectorId || "").trim() || null;
  if ("metierLabel" in body) payload.metier_label = String(body.metierLabel || "").trim() || null;
  if ("publicSlug" in body) {
    const raw = String(body.publicSlug || "").trim();
    payload.public_slug = raw ? normalizePublicSlug(raw) || null : null;
  }
  if ("offreDecouverte" in body) payload.offre_decouverte = String(body.offreDecouverte || "").trim() || null;
  if ("bio" in body) payload.bio = String(body.bio || "").trim() || null;
  if ("contactLink" in body) payload.contact_link = String(body.contactLink || "").trim() || null;
  if (typeof body.onboardingCompleted === "boolean") {
    payload.onboarding_completed_at = body.onboardingCompleted ? new Date().toISOString() : null;
  }

  const { data, error } = await supabaseAdmin
    .from("human_members")
    .update(payload)
    .eq("id", member.id)
    .select("id,first_name,last_name,metier,buddy_name,buddy_metier,trio_name,trio_metier,eclaireur_reward_mode,eclaireur_reward_percent,eclaireur_reward_fixed_eur,ville,phone,status,sector_id,metier_label,public_slug,offre_decouverte,bio,contact_link,onboarding_completed_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    profile: data || null,
  });
}
