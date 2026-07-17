// Page publique de prise de rendez-vous (mini-agenda). Reliée depuis la maquette
// (« Prendre rendez-vous ») quand le pro a configuré ses disponibilités. Non
// indexée. Toute la logique de créneaux vit dans le widget client.
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveMetier } from "@/lib/site-internet/metier-profiles";
import { BookingWidget } from "./booking-widget";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = { title: "Prendre rendez-vous", robots: { index: false, follow: false } };

const s = (v: unknown) => (v == null ? "" : String(v));
const cap = (t: string) => t.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_m, p, c) => p + c.toUpperCase());

export default async function RdvPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("business_name, city, activite")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const row = (data as Record<string, unknown> | null) ?? null;

  if (!row) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui", padding: 24, textAlign: "center" }}>
        <p style={{ color: "#666" }}>Ce lien n&apos;est plus valide.</p>
      </main>
    );
  }

  const nom = s(row.business_name) || "Votre rendez-vous";
  const ville = cap(s(row.city));
  const mp = resolveMetier(s(row.activite));
  const accent = mp.profil === "B" ? "#2C5A6E" : mp.profil === "C" ? "#2E4A3C" : "#8A4A3B";

  return <BookingWidget slug={slug} nom={nom} ville={ville} accent={accent} />;
}
