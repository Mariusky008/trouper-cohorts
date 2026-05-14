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

function toMetiers(rawValue: unknown): string[] {
  if (!rawValue) return [];
  if (Array.isArray(rawValue)) {
    return rawValue
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 60);
  }
  return String(rawValue || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 60);
}

export async function POST(request: Request) {
  const auth = await requireAdminUser();
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: 401 });

  const payload: unknown = await request.json().catch(() => null);
  const city =
    typeof payload === "object" && payload && "city" in payload ? String((payload as { city?: unknown }).city || "").trim() : "";
  const metiers =
    typeof payload === "object" && payload && "metiers" in payload ? toMetiers((payload as { metiers?: unknown }).metiers) : [];
  const batchSizeRaw =
    typeof payload === "object" && payload && "batchSize" in payload ? Number((payload as { batchSize?: unknown }).batchSize) : 5;
  const maxRatingRaw =
    typeof payload === "object" && payload && "maxRating" in payload ? Number((payload as { maxRating?: unknown }).maxRating) : 3.5;
  const dryRun =
    typeof payload === "object" && payload && "dryRun" in payload ? Boolean((payload as { dryRun?: unknown }).dryRun) : false;

  const batchSize = Math.max(1, Math.min(30, Number.isFinite(batchSizeRaw) ? Math.floor(batchSizeRaw) : 5));
  const maxRating = Math.max(0, Math.min(5, Number.isFinite(maxRatingRaw) ? maxRatingRaw : 3.5));

  if (!city) return NextResponse.json({ success: false, error: "Ville obligatoire." }, { status: 400 });
  if (metiers.length === 0) return NextResponse.json({ success: false, error: "Au moins 1 métier est requis." }, { status: 400 });

  const supabaseAdmin = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("human_vitrine_jobs")
    .insert({
      status: "queued",
      city,
      metiers,
      batch_size: batchSize,
      max_rating: maxRating,
      dry_run: dryRun,
      updated_at: nowIso,
    })
    .select("id,status")
    .maybeSingle();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  return NextResponse.json({ success: true, jobId: String((data as { id?: unknown } | null)?.id || "") }, { status: 200 });
}

