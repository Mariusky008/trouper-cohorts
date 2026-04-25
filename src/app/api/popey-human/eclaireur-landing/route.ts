import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ProRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  metier_label: string | null;
  metier: string | null;
  ville: string | null;
  eclaireur_reward_mode: string | null;
  eclaireur_reward_percent: number | null;
  eclaireur_reward_fixed_eur: number | null;
  onboarding_completed_at: string | null;
};

type ApiProItem = {
  memberId: string;
  fullName: string;
  metier: string;
  ville: string;
  rewardLabel: string;
  matchScore: number;
  isFallback?: boolean;
};

function cleanText(value: unknown, max = 120) {
  return String(value || "").trim().slice(0, max);
}

function normalizePhone(value: string) {
  return value.replace(/\s+/g, "").replace(/[-.]/g, "");
}

function toCommissionRate(pro: ProRow) {
  const mode = String(pro.eclaireur_reward_mode || "").toLowerCase();
  if (mode === "percent") {
    const raw = Number(pro.eclaireur_reward_percent || 0);
    if (Number.isFinite(raw) && raw > 0) {
      return raw > 1 ? Math.min(raw / 100, 1) : Math.min(raw, 1);
    }
  }
  return 0.1;
}

function rewardLabel(pro: ProRow) {
  const mode = String(pro.eclaireur_reward_mode || "").toLowerCase();
  if (mode === "percent") {
    const raw = Number(pro.eclaireur_reward_percent || 0);
    if (Number.isFinite(raw) && raw > 0) {
      const normalized = raw > 1 ? raw : raw * 100;
      return `${Math.round(normalized)}%`;
    }
  }
  if (mode === "fixed") {
    const raw = Number(pro.eclaireur_reward_fixed_eur || 0);
    if (Number.isFinite(raw) && raw > 0) {
      return `${Math.round(raw)} EUR`;
    }
  }
  return "10%";
}

function generateShortCode() {
  const raw = randomUUID().replace(/-/g, "").toUpperCase();
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

async function findPopeyAcademyFallbackMember(supabaseAdmin: ReturnType<typeof createAdminClient>) {
  const byExplicitId = cleanText(process.env.POPEY_ECLAIREUR_FALLBACK_MEMBER_ID, 120);
  if (byExplicitId) {
    const explicit = await supabaseAdmin
      .from("human_members")
      .select(
        "id,first_name,last_name,metier_label,metier,ville,eclaireur_reward_mode,eclaireur_reward_percent,eclaireur_reward_fixed_eur,onboarding_completed_at"
      )
      .eq("id", byExplicitId)
      .not("onboarding_completed_at", "is", null)
      .maybeSingle();
    if (explicit.data?.id) return explicit.data as ProRow;
  }

  const candidates = await supabaseAdmin
    .from("human_members")
    .select(
      "id,first_name,last_name,metier_label,metier,ville,eclaireur_reward_mode,eclaireur_reward_percent,eclaireur_reward_fixed_eur,onboarding_completed_at"
    )
    .not("onboarding_completed_at", "is", null)
    .limit(200);
  const rows = (candidates.data as ProRow[] | null) || [];
  if (!rows.length) return null;

  const scoreMember = (row: ProRow) => {
    const full = `${cleanText(row.first_name)} ${cleanText(row.last_name)}`.toLowerCase();
    const metier = cleanText(row.metier_label || row.metier, 120).toLowerCase();
    let score = 0;
    if (metier.includes("coaching entreprise")) score += 100;
    if (metier.includes("coach business")) score += 95;
    if (metier.includes("coach")) score += 50;
    if (metier.includes("entreprise")) score += 40;
    if (full.includes("jean-philippe roth") || full.includes("jean philippe roth")) score += 35;
    if (full.includes("popey")) score += 25;
    return score;
  };

  const sorted = rows
    .map((row) => ({ row, score: scoreMember(row) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  return sorted[0]?.row || null;
}

export async function GET(request: NextRequest) {
  const supabaseAdmin = createAdminClient();
  const q = cleanText(request.nextUrl.searchParams.get("q"), 80).toLowerCase();
  const cityQuery = cleanText(request.nextUrl.searchParams.get("ville"), 80).toLowerCase();

  const { data, error } = await supabaseAdmin
    .from("human_members")
    .select(
      "id,first_name,last_name,metier_label,metier,ville,eclaireur_reward_mode,eclaireur_reward_percent,eclaireur_reward_fixed_eur,onboarding_completed_at"
    )
    .not("onboarding_completed_at", "is", null)
    .not("metier", "is", null)
    .limit(80);
  if (error) {
    return NextResponse.json({ error: error.message || "Impossible de charger les professionnels." }, { status: 500 });
  }

  const pros = ((data as ProRow[] | null) || [])
    .map((row) => {
      const fullName = [cleanText(row.first_name), cleanText(row.last_name)].filter(Boolean).join(" ").trim() || "Professionnel Popey";
      const metier = cleanText(row.metier_label || row.metier, 90) || "Metier non renseigne";
      const ville = cleanText(row.ville, 90) || "Ville non renseignee";
      const cityMatch = cityQuery && ville.toLowerCase() === cityQuery ? 18 : cityQuery && ville.toLowerCase().includes(cityQuery) ? 10 : 0;
      const queryMatch = q && `${fullName} ${metier} ${ville}`.toLowerCase().includes(q) ? 12 : q ? -10 : 0;
      const base = 70 + cityMatch + queryMatch;
      const matchScore = Math.max(55, Math.min(98, base));
      return {
        memberId: row.id,
        fullName,
        metier,
        ville,
        rewardLabel: rewardLabel(row),
        matchScore,
      } as ApiProItem;
    })
    .filter((row) => {
      if (!q) return true;
      const haystack = `${row.fullName} ${row.metier} ${row.ville}`.toLowerCase();
      return haystack.includes(q);
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 24) as ApiProItem[];

  const fallbackMember = await findPopeyAcademyFallbackMember(supabaseAdmin);
  if (fallbackMember?.id) {
    const fallbackVille = cityQuery ? cleanText(cityQuery, 90) : cleanText(fallbackMember.ville, 90) || "France";
    const fallbackItem: ApiProItem = {
      memberId: fallbackMember.id,
      fullName: "Popey Academy",
      metier: "Coaching entreprise",
      ville: fallbackVille,
      rewardLabel: rewardLabel(fallbackMember),
      matchScore: 99,
      isFallback: true,
    };
    const withoutDuplicate = pros.filter((item) => item.memberId !== fallbackItem.memberId);
    withoutDuplicate.unshift(fallbackItem);
    return NextResponse.json({ pros: withoutDuplicate.slice(0, 24) });
  }

  return NextResponse.json({ pros });
}

export async function POST(request: NextRequest) {
  const supabaseAdmin = createAdminClient();
  const body = (await request.json().catch(() => null)) as
    | {
        firstName?: string;
        lastName?: string;
        age?: number | string;
        city?: string;
        phone?: string;
        email?: string;
        situation?: string;
        contactsCountRange?: string;
        selectedProMemberId?: string;
      }
    | null;

  const firstName = cleanText(body?.firstName, 80);
  const lastName = cleanText(body?.lastName, 80);
  const city = cleanText(body?.city, 90);
  const phone = normalizePhone(cleanText(body?.phone, 40));
  const email = cleanText(body?.email, 160).toLowerCase();
  const situation = cleanText(body?.situation, 80);
  const contactsCountRange = cleanText(body?.contactsCountRange, 40);
  const selectedProMemberId = cleanText(body?.selectedProMemberId, 120);
  const ageRaw = Number(body?.age || 0);
  const age = Number.isFinite(ageRaw) ? Math.round(ageRaw) : 0;

  if (!firstName || !city || !phone || !selectedProMemberId || !situation || !contactsCountRange || age < 18 || age > 90) {
    return NextResponse.json({ error: "Inscription incomplete. Merci de remplir tous les champs obligatoires." }, { status: 400 });
  }

  const { data: pro, error: proError } = await supabaseAdmin
    .from("human_members")
    .select(
      "id,first_name,last_name,metier_label,metier,ville,eclaireur_reward_mode,eclaireur_reward_percent,eclaireur_reward_fixed_eur,onboarding_completed_at"
    )
    .eq("id", selectedProMemberId)
    .maybeSingle();
  if (proError || !pro || !pro.onboarding_completed_at) {
    return NextResponse.json({ error: "Professionnel introuvable." }, { status: 400 });
  }

  const proRow = pro as ProRow;
  const nowIso = new Date().toISOString();
  const commissionRate = toCommissionRate(proRow);

  let scoutId = "";
  const existingByPhone = await supabaseAdmin
    .from("human_scouts")
    .select("id")
    .eq("owner_member_id", selectedProMemberId)
    .eq("phone", phone)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existingByPhone.data?.id) {
    scoutId = existingByPhone.data.id;
  } else if (email) {
    const existingByEmail = await supabaseAdmin
      .from("human_scouts")
      .select("id")
      .eq("owner_member_id", selectedProMemberId)
      .eq("email", email)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (existingByEmail.data?.id) {
      scoutId = existingByEmail.data.id;
    }
  }

  if (!scoutId) {
    const { data: insertedScout, error: scoutError } = await supabaseAdmin
      .from("human_scouts")
      .insert({
        owner_member_id: selectedProMemberId,
        scout_type: "pro",
        first_name: firstName,
        last_name: lastName || null,
        ville: city,
        phone,
        email: email || null,
        status: "active",
        commission_rate: commissionRate,
        total_paid: 0,
        pending_earnings: 0,
        updated_at: nowIso,
      })
      .select("id")
      .single();
    if (scoutError || !insertedScout?.id) {
      return NextResponse.json({ error: scoutError?.message || "Impossible de creer l eclaireur." }, { status: 500 });
    }
    scoutId = insertedScout.id;
  } else {
    await supabaseAdmin
      .from("human_scouts")
      .update({
        first_name: firstName,
        last_name: lastName || null,
        ville: city,
        phone,
        email: email || null,
        scout_type: "pro",
        status: "active",
        commission_rate: commissionRate,
        updated_at: nowIso,
      })
      .eq("id", scoutId)
      .eq("owner_member_id", selectedProMemberId);
  }

  const inviteToken = randomUUID().replace(/-/g, "");
  const shortCode = generateShortCode();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  const { error: inviteError } = await supabaseAdmin.from("human_scout_invites").insert({
    owner_member_id: selectedProMemberId,
    scout_id: scoutId,
    invite_token: inviteToken.toLowerCase(),
    short_code: shortCode,
    expires_at: expiresAt,
    accepted_at: nowIso,
  });
  if (inviteError) {
    return NextResponse.json({ error: inviteError.message || "Impossible de generer le lien." }, { status: 500 });
  }

  const proName =
    [cleanText(proRow.first_name), cleanText(proRow.last_name)].filter(Boolean).join(" ").trim() || cleanText(proRow.metier_label || proRow.metier, 90);
  await supabaseAdmin.from("human_notifications").insert({
    member_id: selectedProMemberId,
    type: "personnelle",
    title: "Nouvel eclaireur active",
    message: `${firstName} ${lastName}`.trim()
      ? `${firstName} ${lastName}`.trim() + " vient de rejoindre votre reseau eclaireur."
      : "Un nouvel eclaireur vient de rejoindre votre reseau.",
    impact: `scout:landing-signup:${scoutId}`,
    is_read: false,
  });

  return NextResponse.json({
    success: true,
    scoutId,
    inviteToken,
    shortCode,
    selectedPro: {
      memberId: selectedProMemberId,
      name: proName,
      metier: cleanText(proRow.metier_label || proRow.metier, 90),
      ville: cleanText(proRow.ville, 90),
    },
    previewUrl: `https://www.popey.academy/popey-human/eclaireur-webapp-preview?token=${inviteToken.toLowerCase()}`,
    detailsUrl: `https://www.popey.academy/popey-human/eclaireur/${inviteToken.toLowerCase()}`,
  });
}
