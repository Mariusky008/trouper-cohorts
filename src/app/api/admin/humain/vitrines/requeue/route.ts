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

export async function POST(request: Request) {
  const auth = await requireAdminUser();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const payload: unknown = await request.json().catch(() => null);
  const slug =
    typeof payload === "object" && payload && "slug" in payload ? String((payload as { slug?: unknown }).slug || "").trim() : "";
  if (!slug) return NextResponse.json({ error: "Slug manquant." }, { status: 400 });

  const supabaseAdmin = createAdminClient();
  const now = new Date().toISOString();

  const { data: row, error } = await supabaseAdmin
    .from("human_vitrine_sites")
    .update({
      status: "queued",
      approved_at: null,
      rejected_at: null,
      sent_at: null,
      error_reason: null,
      updated_at: now,
    })
    .eq("slug", slug)
    .select("slug,status")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row?.slug) return NextResponse.json({ error: "Vitrine introuvable." }, { status: 404 });

  return NextResponse.json({ ok: true, slug: row.slug, status: row.status }, { status: 200 });
}
