import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type RegisterBody = {
  fullName?: string;
  phone?: string;
  city?: string;
  sponsorName?: string;
  sponsorRefCode?: string;
  sponsorMemberId?: string;
};

type HumanMemberRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  metier_label: string | null;
  metier: string | null;
  ville: string | null;
  onboarding_completed_at: string | null;
};

function trim(value: unknown, max = 160) {
  return String(value || "").trim().slice(0, max);
}

function slugify(value: string) {
  return trim(value, 120)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizePhoneToE164(raw: string) {
  let digits = trim(raw, 40).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("0")) digits = `33${digits.slice(1)}`;
  if (digits.length < 8 || digits.length > 15) return "";
  return `+${digits}`;
}

function splitName(fullName: string) {
  const tokens = trim(fullName, 120).split(/\s+/).filter(Boolean);
  if (!tokens.length) return { firstName: "", lastName: "" };
  return {
    firstName: tokens[0] || "",
    lastName: tokens.slice(1).join(" ").trim(),
  };
}

function makeShortCode() {
  const raw = randomUUID().replace(/-/g, "").toUpperCase();
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

async function resolveOwnerMember(input: { supabaseAdmin: ReturnType<typeof createAdminClient>; sponsorMemberId: string }) {
  const { supabaseAdmin, sponsorMemberId } = input;
  const explicitId = trim(sponsorMemberId, 120);
  if (explicitId) {
    const bySponsor = await supabaseAdmin
      .from("human_members")
      .select("id,first_name,last_name,metier_label,metier,ville,onboarding_completed_at")
      .eq("id", explicitId)
      .not("onboarding_completed_at", "is", null)
      .maybeSingle();
    if (bySponsor.data?.id) return bySponsor.data as HumanMemberRow;
  }

  const fallbackEnvId = trim(process.env.POPEY_ECLAIREUR_FALLBACK_MEMBER_ID, 120);
  if (fallbackEnvId) {
    const byEnv = await supabaseAdmin
      .from("human_members")
      .select("id,first_name,last_name,metier_label,metier,ville,onboarding_completed_at")
      .eq("id", fallbackEnvId)
      .not("onboarding_completed_at", "is", null)
      .maybeSingle();
    if (byEnv.data?.id) return byEnv.data as HumanMemberRow;
  }

  const candidates = await supabaseAdmin
    .from("human_members")
    .select("id,first_name,last_name,metier_label,metier,ville,onboarding_completed_at")
    .not("onboarding_completed_at", "is", null)
    .limit(200);
  const rows = (candidates.data as HumanMemberRow[] | null) || [];
  if (!rows.length) return null;

  const scored = rows
    .map((row) => {
      const full = `${trim(row.first_name)} ${trim(row.last_name)}`.toLowerCase();
      const metier = trim(row.metier_label || row.metier).toLowerCase();
      let score = 0;
      if (full.includes("jean-philippe roth") || full.includes("jean philippe roth")) score += 100;
      if (metier.includes("coach business")) score += 80;
      if (metier.includes("coaching entreprise")) score += 60;
      if (full.includes("popey")) score += 40;
      return { row, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored[0]?.row || rows[0] || null;
}

async function createInviteRecord(input: {
  supabaseAdmin: ReturnType<typeof createAdminClient>;
  ownerMemberId: string;
  scoutId: string;
}) {
  const inviteToken = randomUUID().replace(/-/g, "").toLowerCase();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  let shortCode: string | null = makeShortCode();
  const payload: Record<string, unknown> = {
    owner_member_id: input.ownerMemberId,
    scout_id: input.scoutId,
    invite_token: inviteToken,
    expires_at: expiresAt,
    accepted_at: new Date().toISOString(),
  };
  if (shortCode) payload.short_code = shortCode;

  const insertedWithCode = await input.supabaseAdmin.from("human_scout_invites").insert(payload);
  if (insertedWithCode.error) {
    const message = String(insertedWithCode.error.message || "").toLowerCase();
    if (message.includes("short_code")) {
      shortCode = null;
      delete payload.short_code;
      const fallbackInsert = await input.supabaseAdmin.from("human_scout_invites").insert(payload);
      if (fallbackInsert.error) {
        return {
          error: fallbackInsert.error.message || "Impossible de créer l'invitation éclaireur.",
          inviteToken: "",
          shortCode: null as string | null,
          expiresAt: "",
        };
      }
    } else {
      return {
        error: insertedWithCode.error.message || "Impossible de créer l'invitation éclaireur.",
        inviteToken: "",
        shortCode: null as string | null,
        expiresAt: "",
      };
    }
  }

  return { error: null as string | null, inviteToken, shortCode, expiresAt };
}

function buildWhatsappShareMessage(input: {
  referralUrl: string;
}) {
  return (
    "Salut ! J'ai trouvé ce catalogue de privilèges exclusifs à prix réduits sur Dax (santé/bien être, Ostéo, Coach...). " +
    `C'est cadeau, et en plus, ça nous permet de soutenir les commerçants locaux ! Regarde ici : ${input.referralUrl}`
  );
}

export async function POST(request: NextRequest) {
  const supabaseAdmin = createAdminClient();
  const body = (await request.json().catch(() => null)) as RegisterBody | null;

  const fullName = trim(body?.fullName, 120);
  const phone = normalizePhoneToE164(trim(body?.phone, 40));
  const cityRaw = trim(body?.city, 90) || "Dax";
  const citySlug = slugify(cityRaw) || "dax";
  const cityLabel = citySlug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  const sponsorName = trim(body?.sponsorName, 120) || "Popey";
  const sponsorRefCode = trim(body?.sponsorRefCode, 60) || null;
  const sponsorMemberId = trim(body?.sponsorMemberId, 120);

  if (!fullName || !phone) {
    return NextResponse.json(
      { success: false, error: "Nom complet et numéro WhatsApp sont obligatoires." },
      { status: 400 },
    );
  }

  const ownerMember = await resolveOwnerMember({ supabaseAdmin, sponsorMemberId });
  if (!ownerMember?.id) {
    return NextResponse.json(
      { success: false, error: "Aucun membre sponsor disponible pour créer le lien éclaireur." },
      { status: 500 },
    );
  }

  const { firstName, lastName } = splitName(fullName);
  if (!firstName) {
    return NextResponse.json({ success: false, error: "Le prénom est obligatoire." }, { status: 400 });
  }

  let scoutId = "";
  const existingScout = await supabaseAdmin
    .from("human_scouts")
    .select("id")
    .eq("owner_member_id", ownerMember.id)
    .eq("phone", phone)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existingScout.data?.id) {
    scoutId = existingScout.data.id;
    await supabaseAdmin
      .from("human_scouts")
      .update({
        scout_type: "perso",
        first_name: firstName,
        last_name: lastName || null,
        ville: cityLabel,
        phone,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", scoutId)
      .eq("owner_member_id", ownerMember.id);
  } else {
    const createdScout = await supabaseAdmin
      .from("human_scouts")
      .insert({
        owner_member_id: ownerMember.id,
        scout_type: "perso",
        first_name: firstName,
        last_name: lastName || null,
        ville: cityLabel,
        phone,
        status: "active",
        commission_rate: 0.1,
        total_paid: 0,
        pending_earnings: 0,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (createdScout.error || !createdScout.data?.id) {
      return NextResponse.json(
        { success: false, error: createdScout.error?.message || "Impossible de créer l'apporteur." },
        { status: 500 },
      );
    }
    scoutId = createdScout.data.id;
  }

  const invite = await createInviteRecord({
    supabaseAdmin,
    ownerMemberId: ownerMember.id,
    scoutId,
  });
  if (invite.error) {
    return NextResponse.json({ success: false, error: invite.error }, { status: 500 });
  }

  const baseUrl = trim(process.env.NEXT_PUBLIC_APP_URL, 200) || "https://www.popey.academy";
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const rawRef = invite.shortCode
    ? invite.shortCode.replace(/[^A-Z0-9]/gi, "").toLowerCase()
    : invite.inviteToken.slice(0, 10);
  const referralUrl = `${normalizedBase}/privilege/${citySlug}?ref=${encodeURIComponent(rawRef)}&ref_name=${encodeURIComponent(firstName)}&sponsor=${encodeURIComponent(sponsorName)}&scout_token=${encodeURIComponent(invite.inviteToken)}`;
  const previewUrl = `${normalizedBase}/popey-human/eclaireur-webapp-preview?token=${encodeURIComponent(invite.inviteToken)}`;
  const whatsappMessage = buildWhatsappShareMessage({ referralUrl });
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;

  await supabaseAdmin.from("human_scout_notification_log").insert({
    scout_id: scoutId,
    event_type: "public_affiliate_signup",
    payload_json: {
      source: "privilege_affiliation_button",
      scout_name: fullName,
      scout_phone: phone,
      city_slug: citySlug,
      city_label: cityLabel,
      sponsor_name: sponsorName,
      sponsor_member_id: sponsorMemberId || ownerMember.id,
      sponsor_ref_code: sponsorRefCode,
      generated_ref_code: rawRef,
      referral_url: referralUrl,
      preview_url: previewUrl,
      invite_token: invite.inviteToken,
      short_code: invite.shortCode,
    },
    status: "sent",
  });

  return NextResponse.json({
    success: true,
    scoutId,
    ownerMemberId: ownerMember.id,
    inviteToken: invite.inviteToken,
    shortCode: invite.shortCode,
    referralCode: rawRef,
    referralUrl,
    previewUrl,
    whatsappMessage,
    whatsappShareUrl,
    expiresAt: invite.expiresAt,
  });
}
