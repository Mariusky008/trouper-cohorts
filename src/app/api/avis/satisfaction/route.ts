import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const choix = String(body.choix || "").trim();
  const token = String(body.token || "").trim();
  const slug = String(body.slug || "").trim().toLowerCase();

  if (!choix || !slug || !["oui", "non"].includes(choix)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Récupérer le commerce
  const { data: commerce } = await supabase
    .from("human_review_commercants")
    .select("id, lien_avis")
    .eq("slug", slug)
    .maybeSingle();

  if (!commerce) return NextResponse.json({ error: "Commerce introuvable" }, { status: 404 });

  // Mettre à jour le client si on a un token
  if (token) {
    if (choix === "oui") {
      await supabase
        .from("human_review_clients_finaux")
        .update({ statut: "avis_laissé", satisfaction: "positif" })
        .eq("lien_unique", token)
        .eq("commercant_id", commerce.id)
        .in("statut", ["en_attente", "envoyé", "cliqué", "relancé"]);
    } else {
      await supabase
        .from("human_review_clients_finaux")
        .update({ statut: "cliqué", satisfaction: "negatif" })
        .eq("lien_unique", token)
        .eq("commercant_id", commerce.id)
        .in("statut", ["en_attente", "envoyé", "cliqué", "relancé"]);
    }
  }

  if (choix === "oui") {
    const lienAvis = String(commerce.lien_avis || "").trim();
    return NextResponse.json({
      redirect: lienAvis || `https://www.google.com/search?q=${encodeURIComponent(slug)}`,
    });
  }

  // NON → page feedback
  const feedbackUrl = token
    ? `/avis/${slug}/feedback?t=${encodeURIComponent(token)}`
    : `/avis/${slug}/feedback`;

  return NextResponse.json({ redirect: feedbackUrl });
}
