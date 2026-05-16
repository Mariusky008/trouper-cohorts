import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ token: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const normalizedToken = String(token || "").trim();
  if (!normalizedToken) return NextResponse.json({ error: "Token manquant" }, { status: 400 });

  const body = await request.json().catch(() => null);
  const id = String(body?.id || "").trim();
  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  const supabase = createAdminClient();

  // Verify the avis belongs to the commerce identified by this token
  const { data: commerce } = await supabase
    .from("human_review_commercants")
    .select("id")
    .eq("token_saisie", normalizedToken)
    .maybeSingle();

  if (!commerce) return NextResponse.json({ error: "Commerce introuvable" }, { status: 404 });

  const { error } = await supabase
    .from("human_review_avis_negatifs")
    .update({ traite: true, traite_at: new Date().toISOString() })
    .eq("id", id)
    .eq("commercant_id", commerce.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
