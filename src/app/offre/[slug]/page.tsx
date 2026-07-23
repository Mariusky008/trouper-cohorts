// Lien de réservation TRAÇABLE de l'« Offre du moment ». Le pro colle /offre/[slug]
// dans son message WhatsApp / son bandeau ; chaque clic est compté (résultats
// RÉELS, jamais inventés), puis on redirige vers la vraie page de réservation
// (si des disponibilités sont configurées) ou vers la maquette du site.
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const str = (v: unknown) => (v == null ? "" : String(v));

export default async function OfferRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Destination par défaut : la maquette du site. On tente d'abord la vraie page
  // de réservation si le pro a configuré des créneaux.
  let dest = `/site-internet/apercu/${slug}`;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("human_vitrine_sites")
      .select("id, current_offer")
      .eq("slug", slug)
      .eq("channel", "letter")
      .maybeSingle();
    const row = (data as Record<string, unknown> | null) ?? null;
    if (row) {
      const id = str(row.id);
      // Incrément du compteur de clics (best-effort).
      const raw = row.current_offer;
      if (raw && typeof raw === "object") {
        const o = raw as Record<string, unknown>;
        const clicks = (typeof o.clicks === "number" ? o.clicks : 0) + 1;
        try {
          await supabase.from("human_vitrine_sites").update({ current_offer: { ...o, clicks } }).eq("id", id);
        } catch {
          /* colonne non migrée → best-effort */
        }
      }
      // Réservation réelle si des créneaux existent.
      try {
        const { count } = await supabase
          .from("human_site_availability")
          .select("id", { count: "exact", head: true })
          .eq("site_id", id);
        if ((count ?? 0) > 0) dest = `/site-internet/rdv/${slug}`;
      } catch {
        /* table non migrée → maquette */
      }
    }
  } catch {
    /* best-effort : on redirige quand même */
  }

  redirect(dest);
}
