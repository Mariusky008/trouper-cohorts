// Création manuelle d'un prospect "Site internet" (canal lettre).
// Le diagnostic full-auto (Places + site + Claude) viendra remplir variant/
// constats/synthese ; ici on crée la fiche à la main pour tester la lettre.
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

function normalizeWebsite(rawValue: unknown): string {
  let raw = String(rawValue || "").trim();
  if (!raw) return "";
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminUser();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  let payload: Record<string, unknown> | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const businessName = String(payload?.businessName || "").trim();
  const city = String(payload?.city || "").trim();
  const activite = String(payload?.activite || "").trim();
  const address = String(payload?.address || "").trim();
  const sourceWebsite = normalizeWebsite(payload?.sourceWebsite);
  const variantRaw = String(payload?.variant || "").trim().toUpperCase();
  const variant = variantRaw === "A" || variantRaw === "B" ? variantRaw : null;

  if (!businessName) return NextResponse.json({ error: "Le nom du commerce est obligatoire." }, { status: 400 });
  if (!city) return NextResponse.json({ error: "La ville est obligatoire." }, { status: 400 });
  if (!activite) return NextResponse.json({ error: "L'activité est obligatoire." }, { status: 400 });

  const baseSlug = slugify(businessName).slice(0, 60) || "prospect";
  const suffix = slugify(crypto.randomUUID()).slice(0, 6) || String(Date.now()).slice(-6);
  const slug = `${baseSlug}-${suffix}`.slice(0, 80);

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.from("human_vitrine_sites").insert({
    slug,
    channel: "letter",
    business_name: businessName,
    city,
    activite,
    address,
    source_website: sourceWebsite,
    variant,
    letter_status: "draft",
    metadata: { manual: true },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slug }, { status: 201 });
}
