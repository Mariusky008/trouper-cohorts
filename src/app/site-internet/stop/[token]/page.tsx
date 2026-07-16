// Page publique de désinscription (STOP). Le client ouvre le lien reçu → on lui
// confirme de quel établissement il se retire, puis un bouton valide le retrait.
// On ne désinscrit PAS au chargement (les scanners de liens ouvriraient la page) :
// c'est le clic explicite qui vaut retrait.
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { Unsub } from "./unsub";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  title: "Désinscription",
  robots: { index: false, follow: false },
};

const s = (v: unknown) => (v == null ? "" : String(v));

export default async function StopPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createAdminClient();

  let found = false;
  let already = false;
  let prenom = "";
  let business = "";
  try {
    const { data } = await supabase
      .from("human_site_contacts")
      .select("prenom, opted_out_at, site_id")
      .eq("unsub_token", token)
      .maybeSingle();
    const row = (data as Record<string, unknown> | null) ?? null;
    if (row) {
      found = true;
      prenom = s(row.prenom);
      already = Boolean(row.opted_out_at);
      const siteId = s(row.site_id);
      if (siteId) {
        const { data: site } = await supabase
          .from("human_vitrine_sites")
          .select("business_name")
          .eq("id", siteId)
          .maybeSingle();
        business = s((site as Record<string, unknown> | null)?.business_name);
      }
    }
  } catch {
    /* best-effort : on rendra l'état « lien invalide » */
  }

  return <Unsub token={token} business={business} prenom={prenom} found={found} already={already} />;
}
