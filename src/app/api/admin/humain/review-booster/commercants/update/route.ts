import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/actions/review-booster-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminUser();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const id = String(body.id || "").trim();
  if (!id) return NextResponse.json({ error: "ID manquant." }, { status: 400 });

  const allowed = [
    "nom", "proprietaire", "telephone", "email", "ville", "secteur",
    "place_id", "lien_avis", "abonnement", "mensualite",
    "nb_avis_debut", "nb_avis_actuel", "note_actuelle",
  ] as const;

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) patch[key] = body[key] ?? null;
  }

  // Regénérer le lien_avis si place_id fourni
  if (body.place_id) {
    patch.lien_avis = `https://search.google.com/local/writereview?placeid=${body.place_id}`;
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("human_review_commercants")
    .update(patch)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
