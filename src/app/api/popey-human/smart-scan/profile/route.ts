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
  const rewardPercent = Number.parseFloat(String(body.eclaireurRewardPercent || "").replace(",", "."));
  const rewardFixedEur = Number.parseFloat(String(body.eclaireurRewardFixedEur || "").replace(",", "."));
  const payload: Record<string, unknown> = {
    first_name: String(body.firstName || "").trim() || null,
    last_name: String(body.lastName || "").trim() || null,
    metier: String(body.metier || "").trim() || null,
    buddy_name: String(body.buddyName || "").trim() || null,
    buddy_metier: String(body.buddyMetier || "").trim() || null,
    trio_name: String(body.trioName || "").trim() || null,
    trio_metier: String(body.trioMetier || "").trim() || null,
    eclaireur_reward_mode: body.eclaireurRewardMode === "fixed" ? "fixed" : "percent",
    eclaireur_reward_percent: Number.isFinite(rewardPercent) && rewardPercent > 0 ? rewardPercent : null,
    eclaireur_reward_fixed_eur: Number.isFinite(rewardFixedEur) && rewardFixedEur > 0 ? rewardFixedEur : null,
    ville: String(body.ville || "").trim() || null,
    phone: String(body.phone || "").trim() || null,
    sector_id: String(body.sectorId || "").trim() || null,
    metier_label: String(body.metierLabel || "").trim() || null,
    public_slug: (() => {
      const raw = String(body.publicSlug || "").trim();
      if (!raw) return null;
      const normalized = normalizePublicSlug(raw);
      return normalized || null;
    })(),
    offre_decouverte: String(body.offreDecouverte || "").trim() || null,
    bio: String(body.bio || "").trim() || null,
    contact_link: String(body.contactLink || "").trim() || null,
    updated_at: new Date().toISOString(),
  };
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
