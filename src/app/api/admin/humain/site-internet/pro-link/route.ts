// Renvoie (et génère si besoin) le lien privé « Espace Pro » d'un prospect,
// pour que Marius le remette au commerçant après achat. Le jeton est créé une
// seule fois puis réutilisé.
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
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

  let payload: Record<string, unknown> | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }
  const slug = String(payload?.slug || "").trim();
  if (!slug) return NextResponse.json({ error: "slug requis" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: row, error: readErr } = await supabase
    .from("human_vitrine_sites")
    .select("id, pro_token")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();

  if (readErr && /pro_token/.test(readErr.message)) {
    return NextResponse.json({ error: "Colonne pro_token non migrée. Applique le SQL de l'Espace Pro." }, { status: 400 });
  }
  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site) return NextResponse.json({ error: "Prospect introuvable." }, { status: 404 });

  let token = String(site.pro_token || "");
  if (!token) {
    token = randomBytes(24).toString("base64url");
    const { error: updErr } = await supabase
      .from("human_vitrine_sites")
      .update({ pro_token: token })
      .eq("id", String(site.id));
    if (updErr) {
      const msg = /pro_token/.test(updErr.message)
        ? "Colonne pro_token non migrée. Applique le SQL de l'Espace Pro."
        : updErr.message;
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.popey.academy";
  const url = `${appUrl}/site-internet/pro/${slug}?k=${token}`;
  return NextResponse.json({ ok: true, url }, { status: 200 });
}
