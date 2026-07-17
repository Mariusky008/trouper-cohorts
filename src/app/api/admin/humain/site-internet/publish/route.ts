// Passage « démo → client » (admin). Publie/dépublie le site (retire l'habillage
// démo côté public) et enregistre le domaine perso éventuel. Renvoie l'état + le
// lien Espace Pro (court) et l'URL publique à transmettre au commerçant.
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireAdminUser() {
  const userId = await getServerUserIdWithProxyFallback();
  if (!userId) return { error: "Session requise." as const };
  const supabaseAdmin = createAdminClient();
  const { data: adminRow, error } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (error || !adminRow?.user_id) return { error: "Accès admin requis." as const };
  return { ok: true as const };
}

const s = (v: unknown) => String(v ?? "").trim();
const normDomain = (v: unknown) =>
  s(v).toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "") || null;

export async function POST(request: Request) {
  const auth = await requireAdminUser();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug);
  if (!slug) return NextResponse.json({ error: "slug requis" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: row, error: readErr } = await supabase
    .from("human_vitrine_sites")
    .select("id, pro_token, published, custom_domain")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  if (readErr && /published|custom_domain/.test(readErr.message)) {
    return NextResponse.json({ error: "Colonnes non migrées. Applique le SQL « publish »." }, { status: 400 });
  }
  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site) return NextResponse.json({ error: "Prospect introuvable." }, { status: 404 });

  const patch: Record<string, unknown> = {};
  if (typeof p?.published === "boolean") {
    patch.published = p.published;
    patch.published_at = p.published ? new Date().toISOString() : null;
    if (p.published) patch.letter_status = "client";
  }
  if ("custom_domain" in (p || {})) patch.custom_domain = normDomain(p?.custom_domain);

  if (Object.keys(patch).length) {
    const { error: updErr } = await supabase.from("human_vitrine_sites").update(patch).eq("id", s(site.id));
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  // Jeton Espace Pro (créé si absent, court).
  let token = s(site.pro_token);
  if (!token) {
    token = randomBytes(9).toString("base64url");
    await supabase.from("human_vitrine_sites").update({ pro_token: token }).eq("id", s(site.id));
  }

  const appUrl = s(process.env.NEXT_PUBLIC_APP_URL) || "https://www.popey.academy";
  const published = "published" in patch ? Boolean(patch.published) : Boolean(site.published);
  const customDomain = "custom_domain" in patch ? (patch.custom_domain as string | null) : (s(site.custom_domain) || null);
  const publicUrl = customDomain ? `https://${customDomain}` : `${appUrl}/site-internet/apercu/${slug}`;

  return NextResponse.json({
    ok: true,
    published,
    customDomain,
    proUrl: `${appUrl}/p/${token}`,
    publicUrl,
  });
}
