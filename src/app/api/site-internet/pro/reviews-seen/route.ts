// Acquittement de l'alerte « nouvel avis » (Espace Pro, jeton privé). Quand le
// pro clique « J'ai vu / répondu », on aligne pro_reviews_seen / pro_rating_seen
// sur les valeurs Google actuelles → l'alerte disparaît jusqu'au prochain avis.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug);
  const token = s(p?.token);
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("human_vitrine_sites")
    .select("id, pro_token, google_reviews, google_rating")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const reviews = typeof site.google_reviews === "number" ? site.google_reviews : null;
  const rating = typeof site.google_rating === "number" ? site.google_rating : null;
  try {
    const { error } = await supabase
      .from("human_vitrine_sites")
      .update({ pro_reviews_seen: reviews, pro_rating_seen: rating })
      .eq("id", s(site.id));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } catch (e) {
    return NextResponse.json({ error: String(e).slice(0, 120) }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
