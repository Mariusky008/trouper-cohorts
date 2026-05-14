import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";

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

function safeToken() {
  const token = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
  return String(token).replace(/[^a-z0-9]/gi, "").slice(0, 24).toLowerCase();
}

export async function POST(request: Request) {
  const auth = await requireAdminUser();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const payload: unknown = await request.json().catch(() => null);
  const slug =
    typeof payload === "object" && payload && "slug" in payload ? String((payload as { slug?: unknown }).slug || "").trim() : "";
  if (!slug) return NextResponse.json({ error: "Slug manquant." }, { status: 400 });

  const token = safeToken();
  const prefix = `${slug}-preview-${token.slice(-6)}`.slice(0, 120);
  const previewUrl = `https://vitrine.popey.academy/preview/${slug}?t=${token}`;
  const nowIso = new Date().toISOString();

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("human_vitrine_sites")
    .update({
      status: "queued_preview",
      preview_storage_prefix: prefix,
      preview_token: token,
      preview_url: previewUrl,
      preview_generated_at: nowIso,
      error_reason: null,
      updated_at: nowIso,
    })
    .eq("slug", slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, previewUrl }, { status: 200 });
}

