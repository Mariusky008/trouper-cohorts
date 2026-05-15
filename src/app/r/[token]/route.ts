import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const normalizedToken = String(token || "").trim();

  if (!normalizedToken) {
    redirect("/");
  }

  const supabase = createAdminClient();

  const { data: client } = await supabase
    .from("human_review_clients_finaux")
    .select("lien_unique, statut, human_review_commercants ( slug )")
    .eq("lien_unique", normalizedToken)
    .maybeSingle();

  if (!client) redirect("/");

  const commerce = client.human_review_commercants as unknown as { slug: string } | null;
  if (!commerce?.slug) redirect("/");

  // Déjà traité → page Google ou accueil
  if (["avis_laissé", "insatisfait", "terminé"].includes(client.statut)) {
    redirect("/");
  }

  redirect(`/avis/${commerce.slug}?t=${normalizedToken}`);
}
