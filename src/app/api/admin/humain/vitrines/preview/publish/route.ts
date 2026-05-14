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
  const { data, error: fetchError } = await supabaseAdmin
    .from("human_vitrine_sites")
    .select("slug,status,storage_prefix,preview_storage_prefix,preview_url,preview_token")
    .eq("slug", slug)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  const row = (data || null) as
    | {
        slug: string;
        status: string | null;
        storage_prefix: string | null;
        preview_storage_prefix: string | null;
        preview_url: string | null;
        preview_token: string | null;
      }
    | null;
  if (!row?.slug) return NextResponse.json({ error: "Vitrine introuvable." }, { status: 404 });

  const previewPrefix = String(row.preview_storage_prefix || "").trim();
  if (!previewPrefix) return NextResponse.json({ error: "Aucune preview à publier." }, { status: 400 });

  const currentStatus = String(row.status || "").trim();
  const nextStatus = ["approved", "sent"].includes(currentStatus) ? currentStatus : "uploaded";
  const nowIso = new Date().toISOString();

  const { error: updateError } = await supabaseAdmin
    .from("human_vitrine_sites")
    .update({
      storage_prefix: previewPrefix,
      status: nextStatus,
      preview_storage_prefix: "",
      preview_url: "",
      preview_token: "",
      updated_at: nowIso,
    })
    .eq("slug", slug);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 200 });
}
