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

type StorageEntry = { name?: string; id?: string | null };

async function listAllFiles(supabase: ReturnType<typeof createAdminClient>, bucket: string, rootPrefix: string) {
  const pending: string[] = [rootPrefix.replace(/^\/+|\/+$/g, "")];
  const files: string[] = [];

  while (pending.length > 0 && files.length < 5000) {
    const current = pending.shift();
    if (!current) continue;

    let offset = 0;
    while (offset < 5000) {
      const { data, error } = await supabase.storage.from(bucket).list(current, { limit: 100, offset });
      if (error) break;
      if (!data || data.length === 0) break;

      for (const rawEntry of data as StorageEntry[]) {
        const name = String(rawEntry?.name || "").trim();
        if (!name) continue;
        const fullPath = `${current}/${name}`.replace(/^\/+/, "");
        if (rawEntry?.id) files.push(fullPath);
        else pending.push(fullPath);
      }

      if (data.length < 100) break;
      offset += 100;
    }
  }

  return files;
}

export async function POST(request: Request) {
  const auth = await requireAdminUser();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const payload: unknown = await request.json().catch(() => null);
  const slug =
    typeof payload === "object" && payload && "slug" in payload ? String((payload as { slug?: unknown }).slug || "").trim() : "";
  if (!slug) return NextResponse.json({ error: "Slug manquant." }, { status: 400 });

  const supabaseAdmin = createAdminClient();
  const bucket = String(process.env.SUPABASE_VITRINES_BUCKET || "vitrines").trim() || "vitrines";

  const { data: row, error: readError } = await supabaseAdmin
    .from("human_vitrine_sites")
    .select("slug,storage_prefix,preview_storage_prefix")
    .eq("slug", slug)
    .maybeSingle();

  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
  if (!row?.slug) return NextResponse.json({ error: "Vitrine introuvable." }, { status: 404 });

  const storagePrefix = String((row as { storage_prefix?: unknown }).storage_prefix || "").trim() || slug;
  const previewPrefix = String((row as { preview_storage_prefix?: unknown }).preview_storage_prefix || "").trim();

  const prefixes = [storagePrefix, previewPrefix].map((value) => String(value || "").trim()).filter(Boolean);

  for (const prefix of prefixes) {
    try {
      const files = await listAllFiles(supabaseAdmin, bucket, prefix);
      if (files.length > 0) await supabaseAdmin.storage.from(bucket).remove(files);
    } catch {}
  }

  const { error: deleteError } = await supabaseAdmin.from("human_vitrine_sites").delete().eq("slug", slug);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  return NextResponse.json({ ok: true }, { status: 200 });
}

