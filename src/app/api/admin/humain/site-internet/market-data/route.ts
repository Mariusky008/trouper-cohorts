// Gestion de la table de référence « recherches Google/mois » par métier + ville.
// L'admin y saisit de VRAIS volumes (outil de mots-clés) ; le diagnostic les
// réutilise pour tous les prospects du même couple métier/ville.
import { NextResponse } from "next/server";
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

export async function POST(request: Request) {
  const auth = await requireAdminUser();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  let payload: Record<string, unknown> | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }
  const metier = String(payload?.metier || "").trim();
  const city = String(payload?.city || "").trim();
  const n = parseInt(String(payload?.monthly_searches ?? "").replace(/\D/g, ""), 10);
  if (!metier || !city) return NextResponse.json({ error: "Métier et ville requis." }, { status: 400 });
  if (!Number.isFinite(n) || n <= 0) return NextResponse.json({ error: "Volume invalide." }, { status: 400 });

  const supabase = createAdminClient();
  // Upsert manuel (index unique sur des expressions → pas d'onConflict par nom).
  const { data: existing } = await supabase
    .from("human_site_market_data")
    .select("id")
    .ilike("metier", metier)
    .ilike("city", city)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("human_site_market_data")
      .update({ metier, city, monthly_searches: n, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from("human_site_market_data").insert({ metier, city, monthly_searches: n });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminUser();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });
  let payload: Record<string, unknown> | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }
  const id = String(payload?.id || "").trim();
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const supabase = createAdminClient();
  const { error } = await supabase.from("human_site_market_data").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 200 });
}
