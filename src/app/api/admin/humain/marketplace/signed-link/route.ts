import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { signMarketplaceLandingContext } from "@/lib/popey-human/marketplace-landing-token";

export const dynamic = "force-dynamic";

type SignedLinkPayload = {
  clientName?: string;
  clientId?: string;
  clientPhone?: string;
  referrerName?: string;
  referrerId?: string;
  city?: string;
  expiresInHours?: number;
};

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

function slugifyCity(value: string): string {
  return trim(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return { error: "Session requise." as const };

  const supabaseAdmin = createAdminClient();
  const { data: adminRow } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!adminRow?.user_id) return { error: "Accès admin requis." as const };
  return { userId: user.id } as const;
}

export async function POST(request: Request) {
  const admin = await requireAdminUser();
  if ("error" in admin) return NextResponse.json({ success: false, error: admin.error }, { status: 401 });

  const body = (await request.json().catch(() => null)) as SignedLinkPayload | null;
  const clientName = trim(body?.clientName);
  const referrerName = trim(body?.referrerName);
  const city = trim(body?.city || "Dax") || "Dax";
  const clientId = trim(body?.clientId || crypto.randomUUID());
  const referrerId = trim(body?.referrerId || `ref-${crypto.randomUUID()}`);
  const clientPhone = normalizePhone(trim(body?.clientPhone || ""));
  const expiresInHoursRaw = Number(body?.expiresInHours ?? 168);
  const expiresInHours = Math.min(24 * 30, Math.max(1, Number.isFinite(expiresInHoursRaw) ? Math.round(expiresInHoursRaw) : 168));

  if (!clientName) return NextResponse.json({ success: false, error: "clientName requis." }, { status: 400 });
  if (!referrerName) return NextResponse.json({ success: false, error: "referrerName requis." }, { status: 400 });

  try {
    const exp = Math.floor(Date.now() / 1000) + expiresInHours * 60 * 60;
    const ctx = signMarketplaceLandingContext({
      clientId,
      referrerId,
      clientName,
      referrerName,
      clientPhone: clientPhone || undefined,
      city,
      exp,
    });
    const baseUrl = trim(process.env.NEXT_PUBLIC_APP_URL || "");
    const safeBase = baseUrl ? baseUrl.replace(/\/+$/, "") : "";
    const citySlug = slugifyCity(city || "dax") || "dax";
    const landingPath = `/privilege/${citySlug}?ctx=${encodeURIComponent(ctx)}`;
    const landingUrl = safeBase ? `${safeBase}${landingPath}` : landingPath;
    const waText = `Bonjour ${clientName}, voici ton catalogue de privilèges Popey offert par ${referrerName} : ${landingUrl}`;
    return NextResponse.json({
      success: true,
      landingUrl,
      whatsappText: waText,
      tokenExpiresAt: new Date(exp * 1000).toISOString(),
      payloadPreview: {
        clientName,
        referrerName,
        city,
        clientId,
        referrerId,
        clientPhone: clientPhone || null,
      },
    });
  } catch (error) {
    console.error("[admin/marketplace/signed-link] unexpected", error);
    return NextResponse.json({ success: false, error: "Impossible de générer le lien signé." }, { status: 500 });
  }
}
