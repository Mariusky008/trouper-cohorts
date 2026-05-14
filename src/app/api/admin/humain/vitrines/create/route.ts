import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";
import { slugify } from "@/lib/popey-marketplace";

export const dynamic = "force-dynamic";

async function requireAdminUser() {
  const userId = await getServerUserIdWithProxyFallback();
  if (!userId) return { error: "Session requise." as const };
  const supabaseAdmin = createAdminClient();
  const { data: adminRow, error: adminError } = await supabaseAdmin
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (adminError || !adminRow?.user_id) return { error: "Accès admin requis." as const };
  return { ok: true as const };
}

function normalizeFrMobileToE164(rawValue: unknown): string | null {
  const raw = String(rawValue || "").trim();
  if (!raw) return null;

  let cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("00")) cleaned = `+${cleaned.slice(2)}`;

  if (cleaned.startsWith("+33")) {
    let rest = cleaned.slice(3).replace(/\D/g, "");
    if (rest.startsWith("0")) rest = rest.slice(1);
    if (rest.length !== 9) return null;
    if (rest[0] !== "6" && rest[0] !== "7") return null;
    return `+33${rest}`.slice(0, 24);
  }

  let digits = cleaned.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length !== 9) return null;
  if (digits[0] !== "6" && digits[0] !== "7") return null;
  return `+33${digits}`.slice(0, 24);
}

function normalizeWebsite(rawValue: unknown): string | null {
  let raw = String(rawValue || "").trim();
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminUser();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  let payload: any = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const businessName = String(payload?.businessName || "").trim();
  const city = String(payload?.city || "").trim();
  const category = String(payload?.category || "").trim();
  const sourceWebsite = normalizeWebsite(payload?.sourceWebsite);
  const whatsappPhoneE164 = normalizeFrMobileToE164(payload?.whatsappPhone);

  if (!businessName) return NextResponse.json({ error: "Le nom de l'entreprise est obligatoire." }, { status: 400 });
  if (!city) return NextResponse.json({ error: "La ville est obligatoire." }, { status: 400 });
  if (!category) return NextResponse.json({ error: "La catégorie est obligatoire." }, { status: 400 });
  if (!sourceWebsite) return NextResponse.json({ error: "URL du site invalide." }, { status: 400 });
  if (!whatsappPhoneE164) return NextResponse.json({ error: "WhatsApp obligatoire (France: 06/07 ou +33 6/7)." }, { status: 400 });

  const baseSlug = slugify(businessName).slice(0, 60) || "vitrine";
  const suffix = slugify(crypto.randomUUID()).slice(0, 6) || String(Date.now()).slice(-6);
  const slug = `${baseSlug}-${suffix}`.slice(0, 80);

  const supabaseAdmin = createAdminClient();
  const publicUrl = `https://vitrine.popey.academy/${slug}`;

  const { error } = await supabaseAdmin.from("human_vitrine_sites").insert({
    slug,
    business_name: businessName,
    city,
    category,
    source_website: sourceWebsite,
    whatsapp_phone_e164: whatsappPhoneE164,
    status: "queued",
    public_url: publicUrl,
    storage_prefix: slug,
    error_reason: null,
    metadata: { manual: true },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slug, publicUrl }, { status: 201 });
}
