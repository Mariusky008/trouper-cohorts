import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const token = String(body.token || "").trim();
  const slug = String(body.slug || "").trim().toLowerCase();
  const message = String(body.message || "").trim();

  if (!token || !slug || !message) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: commerce } = await supabase
    .from("human_review_commercants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!commerce) return NextResponse.json({ error: "Commerce introuvable" }, { status: 404 });

  const { data: client } = await supabase
    .from("human_review_clients_finaux")
    .select("id, statut")
    .eq("lien_unique", token)
    .eq("commercant_id", commerce.id)
    .maybeSingle();

  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  // Sauvegarder l'avis négatif
  await supabase.from("human_review_avis_negatifs").insert({
    client_final_id: client.id,
    commercant_id: commerce.id,
    message,
  });

  // Mettre à jour le statut du client
  await supabase
    .from("human_review_clients_finaux")
    .update({ statut: "insatisfait", avis_prive: message })
    .eq("id", client.id);

  return NextResponse.json({ success: true });
}
