import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { SaisieForm } from "./_components/saisie-form";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function SaisiePage({ params }: PageProps) {
  const { token } = await params;
  const normalizedToken = String(token || "").trim();
  if (!normalizedToken) notFound();

  const supabase = createAdminClient();

  const { data: commerce, error } = await supabase
    .from("human_review_commercants")
    .select("id, nom, abonnement")
    .eq("token_saisie", normalizedToken)
    .maybeSingle();

  if (error || !commerce || commerce.abonnement === "résilié") notFound();

  return <SaisieForm token={normalizedToken} nomCommerce={commerce.nom} />;
}
