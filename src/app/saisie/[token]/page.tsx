import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { SaisieForm } from "./_components/saisie-form";

export const dynamic = "force-dynamic";

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
    .select("id, nom, secteur, ville, abonnement, nb_avis_debut, nb_avis_actuel, note_actuelle, last_relance_at")
    .eq("token_saisie", normalizedToken)
    .maybeSingle();

  if (error || !commerce || commerce.abonnement === "résilié") notFound();

  const today = new Date().toISOString().split("T")[0];

  const [{ data: clientsAujourdhui }, { data: avisNegatifs }, { count: totalClients }] = await Promise.all([
    supabase
      .from("human_review_clients_finaux")
      .select("id, prenom, created_at")
      .eq("commercant_id", commerce.id)
      .gte("date_prestation", today)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("human_review_avis_negatifs")
      .select("id, message, created_at, human_review_clients_finaux(prenom, telephone)")
      .eq("commercant_id", commerce.id)
      .eq("traite", false)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("human_review_clients_finaux")
      .select("id", { count: "exact", head: true })
      .eq("commercant_id", commerce.id)
      .not("telephone", "is", null),
  ]);

  const relanceEnabled = Boolean(process.env.TWILIO_REVIEW_CONTENT_SID_RELANCE);

  return (
    <SaisieForm
      token={normalizedToken}
      commerce={{
        nom: commerce.nom,
        secteur: commerce.secteur ?? null,
        ville: commerce.ville ?? null,
        nbAvisDebut: commerce.nb_avis_debut ?? 0,
        nbAvisActuel: commerce.nb_avis_actuel ?? 0,
        noteActuelle: commerce.note_actuelle ? Number(commerce.note_actuelle) : null,
        lastRelanceAt: commerce.last_relance_at ?? null,
      }}
      totalClients={totalClients ?? 0}
      relanceEnabled={relanceEnabled}
      clientsAujourdhui={(clientsAujourdhui ?? []).map((c) => ({
        id: c.id,
        prenom: c.prenom,
        createdAt: c.created_at,
      }))}
      avisNegatifs={(avisNegatifs ?? []).map((a) => {
        const client = a.human_review_clients_finaux as unknown as { prenom: string; telephone: string } | null;
        return {
          id: a.id,
          message: a.message,
          createdAt: a.created_at,
          clientPrenom: client?.prenom ?? null,
          clientTelephone: client?.telephone ?? null,
        };
      })}
    />
  );
}
