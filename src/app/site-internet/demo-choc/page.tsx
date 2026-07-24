// DÉMO « CHOC » de démarchage — page HÔTE prête à dégainer sur le terrain.
// Marius ouvre CE lien devant le prospect : un site de « partenaire » (un hôtel de
// démonstration) où l'on réserve → et à la confirmation, l'assistante recommande
// le commerce démarché (la « cible » désignée dans l'admin), avec son offre et le
// lien vers son vrai site de démo. Un seul lien, aucune confusion possible.
//
// HONNÊTETÉ : l'hôtel est une DÉMONSTRATION (badge visible), pas un vrai
// établissement. La recommandation est un exemple du mécanisme. La cible se règle
// dans /admin/humain/site-internet (bouton « 🎯 Cibler »).
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { DemarchageBooking, type DemarchageTarget } from "../apercu/[slug]/demarchage-booking";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const str = (v: unknown) => String(v ?? "").trim();
const capWords = (s: string) => s.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_m, p, c) => p + c.toUpperCase());
const ACCENT = "#1F5F6B";

export default async function DemoChocPage() {
  const supabase = createAdminClient();
  let target: DemarchageTarget | null = null;
  try {
    const { data } = await supabase
      .from("human_vitrine_sites")
      .select("slug, business_name, city, activite, current_offer")
      .eq("metadata->>demarchage_target", "true")
      .limit(1)
      .maybeSingle();
    const t = data as Record<string, unknown> | null;
    const tSlug = str(t?.slug);
    if (t && tSlug) {
      const rawOffer = t.current_offer && typeof t.current_offer === "object" ? (t.current_offer as Record<string, unknown>) : null;
      const offText = rawOffer ? str(rawOffer.text) : "";
      target = {
        slug: tSlug,
        nom: str(t.business_name) || "notre partenaire",
        ville: capWords(str(t.city)) || "votre ville",
        activite: str(t.activite) || "ses prestations",
        offerText: offText || "une offre de bienvenue rien que pour vous",
        offerIsExample: !offText,
      };
    }
  } catch {
    /* pas de cible exploitable */
  }

  const ville = target?.ville || "Dax";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F5F3EE",
        fontFamily: "'Inter',system-ui,-apple-system,sans-serif",
        color: "#17201F",
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      {/* Bandeau démo (jamais montré comme un vrai établissement) */}
      <div style={{ background: "#17201F", color: "#CDE7E2", fontSize: 11, textAlign: "center", padding: "7px 14px", letterSpacing: ".04em" }}>
        Démonstration Popey · exemple de site partenaire
      </div>

      {/* Hero hôtel */}
      <header
        style={{
          position: "relative",
          minHeight: 340,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "24px 22px 26px",
          color: "#fff",
          background: `linear-gradient(180deg,rgba(15,25,26,.15),rgba(15,25,26,.82)), linear-gradient(150deg,#2C6B77,#122A2E)`,
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: ".24em", textTransform: "uppercase", opacity: 0.9 }}>Hôtel · {ville}</div>
        <h1 style={{ fontFamily: "Georgia,serif", fontSize: 34, fontWeight: 600, lineHeight: 1.05, margin: "9px 0 8px" }}>Hôtel du Collectif</h1>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
          <span style={{ color: "#FFCF4D" }}>★★★★</span>
          <span style={{ opacity: 0.85 }}>Séjour au cœur de {ville}</span>
        </div>
      </header>

      {/* Corps : réserver une chambre */}
      <section style={{ padding: "22px 22px 30px" }}>
        <div style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: ACCENT, fontWeight: 800 }}>Votre séjour</div>
        <h2 style={{ fontFamily: "Georgia,serif", fontSize: 22, fontWeight: 600, margin: "6px 0 8px" }}>Réservez votre chambre</h2>
        <p style={{ fontSize: 14, color: "#5B6360", lineHeight: 1.55, marginBottom: 18 }}>
          Chambres élégantes, petit-déjeuner maison, à deux pas des thermes. Choisissez vos dates — c&apos;est confirmé en un geste.
        </p>
        <button
          type="button"
          data-book-demo
          style={{
            width: "100%",
            background: ACCENT,
            color: "#fff",
            border: "none",
            borderRadius: 14,
            padding: 16,
            fontSize: 15.5,
            fontWeight: 800,
            fontFamily: "inherit",
            cursor: "pointer",
            boxShadow: `0 16px 32px -14px ${ACCENT}`,
          }}
        >
          📅 Réserver une chambre
        </button>

        {!target && (
          <div style={{ marginTop: 20, background: "#FFF7E8", border: "1px solid #F0DCA8", borderRadius: 13, padding: "14px 16px", fontSize: 13.5, lineHeight: 1.5, color: "#7A5A16" }}>
            <b>Aucune cible active.</b> Va dans{" "}
            <Link href="/admin/humain/site-internet" style={{ color: "#B45309", fontWeight: 700 }}>
              l&apos;admin Site internet
            </Link>{" "}
            et clique <b>« 🎯 Cibler »</b> sur le commerce que tu démarches. Il apparaîtra ici à la fin de la réservation.
          </div>
        )}
      </section>

      {target && <DemarchageBooking target={target} hostNom="Hôtel du Collectif" accent={ACCENT} />}
    </main>
  );
}
