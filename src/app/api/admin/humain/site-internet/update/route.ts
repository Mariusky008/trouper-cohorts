// Écran de validation : l'admin ajuste ce que le diagnostic a proposé
// (variante, 3 constats, synthèse, prix) puis valide avant impression.
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

  let payload: Record<string, unknown> | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const slug = String(payload?.slug || "").trim();
  if (!slug) return NextResponse.json({ error: "slug requis" }, { status: 400 });

  const patch: Record<string, unknown> = {};

  const variantRaw = String(payload?.variant || "").trim().toUpperCase();
  if (variantRaw === "A" || variantRaw === "B") patch.variant = variantRaw;

  if (Array.isArray(payload?.constats)) {
    const constats = (payload!.constats as Array<Record<string, unknown>>).slice(0, 3).map((c) => ({
      statut: ["bad", "mid", "good"].includes(String(c?.statut)) ? String(c.statut) : "bad",
      label: String(c?.label || "").slice(0, 60),
      titre: String(c?.titre || "").slice(0, 140),
    }));
    patch.constats = constats;
  }

  if (typeof payload?.synthese === "string") patch.synthese = payload.synthese.slice(0, 400);

  if (payload?.prix != null) {
    const prix = parseInt(String(payload.prix), 10);
    if (Number.isFinite(prix) && prix >= 0) patch.prix = prix;
  }

  if (payload?.validate === true) patch.letter_status = "validated";

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("human_vitrine_sites")
    .update(patch)
    .eq("slug", slug)
    .eq("channel", "letter");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 200 });
}
