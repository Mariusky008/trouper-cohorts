import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/actions/review-booster-admin";
import { slugify } from "@/lib/popey-marketplace";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminUser();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const nom = String(body.nom || "").trim();
  const proprietaire = String(body.proprietaire || "").trim();
  const telephone = String(body.telephone || "").trim();
  const email = String(body.email || "").trim();
  const ville = String(body.ville || "Dax").trim();
  const secteur = String(body.secteur || "").trim();
  const placeId = String(body.place_id || "").trim();
  const lienAvisDirect = String(body.lien_avis || "").trim();
  const mensualite = Number(body.mensualite) || 79;
  const nbAvisDebut = Number(body.nb_avis_debut) || 0;
  const nbAvisActuel = Number(body.nb_avis_actuel) || nbAvisDebut;
  const noteActuelle = body.note_actuelle ? Number(body.note_actuelle) : null;

  if (!nom) return NextResponse.json({ error: "Le nom est obligatoire." }, { status: 400 });

  const baseSlug = slugify(nom).slice(0, 60) || "commerce";
  const suffix = slugify(crypto.randomUUID()).slice(0, 6) || String(Date.now()).slice(-6);
  const slug = `${baseSlug}-${suffix}`.slice(0, 80);
  const tokenSaisie = crypto.randomUUID();

  // Priorité : lien saisi directement > généré depuis place_id
  const lienAvis = lienAvisDirect ||
    (placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : null);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("human_review_commercants")
    .insert({
      nom,
      proprietaire: proprietaire || null,
      telephone: telephone || null,
      email: email || null,
      ville,
      secteur: secteur || null,
      slug,
      token_saisie: tokenSaisie,
      place_id: placeId || null,
      lien_avis: lienAvis,
      mensualite,
      nb_avis_debut: nbAvisDebut,
      nb_avis_actuel: nbAvisActuel,
      note_actuelle: noteActuelle,
      date_debut: new Date().toISOString().split("T")[0],
    })
    .select("id, slug, token_saisie")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    {
      id: data.id,
      slug: data.slug,
      token_saisie: data.token_saisie,
      lien_filtrage: `/avis/${data.slug}`,
      lien_saisie: `/saisie/${data.token_saisie}`,
    },
    { status: 201 }
  );
}
