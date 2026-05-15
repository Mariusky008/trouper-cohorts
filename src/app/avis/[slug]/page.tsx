import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { FiltrageCard } from "./_components/filtrage-card";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function AvisFiltrageePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { t: token } = await searchParams;

  const normalizedSlug = String(slug || "").trim().toLowerCase();
  if (!normalizedSlug) notFound();

  const supabase = createAdminClient();

  const { data: commerce, error } = await supabase
    .from("human_review_commercants")
    .select("id, nom, proprietaire, abonnement")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (error || !commerce || commerce.abonnement === "résilié") notFound();

  let prenom: string | null = null;
  if (token) {
    const { data: client } = await supabase
      .from("human_review_clients_finaux")
      .select("prenom, statut")
      .eq("lien_unique", token)
      .eq("commercant_id", commerce.id)
      .maybeSingle();

    if (client && !["avis_laissé", "insatisfait", "terminé"].includes(client.statut)) {
      prenom = client.prenom;
    }
  }

  return (
    <FiltrageCard
      slug={normalizedSlug}
      token={token ?? null}
      nomCommerce={commerce.nom}
      prenom={prenom}
    />
  );
}
