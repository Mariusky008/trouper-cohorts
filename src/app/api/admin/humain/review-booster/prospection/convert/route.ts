import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/actions/review-booster-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminUser();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const prospectId = String(body.prospectId || "").trim();
  if (!prospectId) return NextResponse.json({ error: "prospectId manquant." }, { status: 400 });

  const supabase = createAdminClient();

  const { data: prospect, error: fetchError } = await supabase
    .from("human_review_prospects")
    .select("id, nom, telephone, proprietaire, ville, secteur, place_id, statut")
    .eq("id", prospectId)
    .maybeSingle();

  if (fetchError || !prospect) {
    return NextResponse.json({ error: "Prospect introuvable." }, { status: 404 });
  }

  const baseSlug = prospect.nom
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "commerce";
  const suffix = crypto.randomUUID().slice(0, 6);
  const slug = `${baseSlug}-${suffix}`;
  const tokenSaisie = crypto.randomUUID();

  const lienAvis = prospect.place_id
    ? `https://search.google.com/local/writereview?placeid=${prospect.place_id}`
    : null;

  const { data: commercant, error: insertError } = await supabase
    .from("human_review_commercants")
    .insert({
      nom: prospect.nom,
      proprietaire: prospect.proprietaire || null,
      telephone: prospect.telephone,
      ville: prospect.ville,
      secteur: prospect.secteur || null,
      slug,
      token_saisie: tokenSaisie,
      place_id: prospect.place_id || null,
      lien_avis: lienAvis,
      mensualite: 79,
      date_debut: new Date().toISOString().split("T")[0],
    })
    .select("id, slug")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabase
    .from("human_review_prospects")
    .update({ statut: "converti" })
    .eq("id", prospectId);

  return NextResponse.json({ commercantId: commercant.id, slug: commercant.slug }, { status: 201 });
}
