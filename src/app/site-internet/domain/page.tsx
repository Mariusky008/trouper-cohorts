// Résolveur de DOMAINE PERSO. Le proxy réécrit la racine d'un domaine client
// (ex. salon-elodie.fr/) vers cette route. On lit l'en-tête Host, on retrouve le
// site publié correspondant (custom_domain), et on rend SA maquette — l'URL reste
// celle du commerçant. Seuls les sites publiés sont servis.
import type { Metadata } from "next";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import ApercuMaquette from "../apercu/[slug]/page";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = { robots: { index: false, follow: false } };

const s = (v: unknown) => (v == null ? "" : String(v));

function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui", padding: 24, textAlign: "center" }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Site en préparation</h1>
        <p style={{ color: "#666" }}>Ce site n&apos;est pas encore en ligne. Revenez bientôt.</p>
      </div>
    </main>
  );
}

export default async function DomainSite() {
  const h = await headers();
  const host = s(h.get("host")).split(":")[0].toLowerCase().replace(/^www\./, "");
  if (!host) return <NotFound />;

  const supabase = createAdminClient();
  let slug = "";
  try {
    const { data } = await supabase
      .from("human_vitrine_sites")
      .select("slug")
      .eq("custom_domain", host)
      .eq("published", true)
      .eq("channel", "letter")
      .maybeSingle();
    slug = s((data as Record<string, unknown> | null)?.slug);
  } catch {
    /* colonnes non migrées → site en préparation */
  }
  if (!slug) return <NotFound />;

  // Rend la maquette du site (mode publié) sous le domaine du commerçant.
  return ApercuMaquette({ params: Promise.resolve({ slug }) });
}
