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
  const instructions =
    typeof payload === "object" && payload && "instructions" in payload
      ? String((payload as { instructions?: unknown }).instructions || "").trim().slice(0, 6000)
      : "";

  if (!slug) return NextResponse.json({ error: "Slug manquant." }, { status: 400 });

  const supabaseAdmin = createAdminClient();
  const nowIso = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("human_vitrine_sites")
    .update({ revision_instructions: instructions, updated_at: nowIso })
    .eq("slug", slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 200 });
}

