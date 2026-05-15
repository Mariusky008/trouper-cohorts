import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { FeedbackForm } from "./_components/feedback-form";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function AvisFeedbackPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { t: token } = await searchParams;

  const normalizedSlug = String(slug || "").trim().toLowerCase();
  if (!normalizedSlug || !token) notFound();

  const supabase = createAdminClient();

  const { data: commerce, error } = await supabase
    .from("human_review_commercants")
    .select("id, nom, proprietaire")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (error || !commerce) notFound();

  const { data: client } = await supabase
    .from("human_review_clients_finaux")
    .select("prenom, statut")
    .eq("lien_unique", token)
    .eq("commercant_id", commerce.id)
    .maybeSingle();

  if (!client) notFound();

  const proprietaire = String(commerce.proprietaire || "").trim().split(/\s+/)[0] || "le gérant";

  return (
    <FeedbackForm
      slug={normalizedSlug}
      token={token}
      nomCommerce={commerce.nom}
      proprietaire={proprietaire}
    />
  );
}
