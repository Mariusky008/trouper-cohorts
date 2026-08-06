// Page légale unique (ancres) référencée par le pied de page de la home.
// Contenu minimal & honnête : à compléter par l'éditeur. Ne pas inventer de
// clauses juridiques.
import type { Metadata } from "next";
import { MARQUE } from "@/lib/marque";
import Link from "next/link";

export const metadata: Metadata = { title: `${MARQUE} — Informations légales`, robots: { index: false } };

const PHONE = process.env.SITE_LETTER_PHONE || "07 68 23 33 47";
const EMAIL = process.env.SITE_LETTER_EMAIL || "contact@popey.academy";

const SECTIONS: Array<{ id: string; t: string; body: string[] }> = [
  {
    id: "mentions",
    t: "Mentions légales",
    body: [
      `Éditeur : ${MARQUE} — service d'accompagnement web pour commerçants, artisans et professionnels de proximité (Sud-Ouest de la France).`,
      `Contact : ${PHONE} · ${EMAIL}`,
      "Hébergement : Vercel Inc. Les coordonnées complètes de l'éditeur (raison sociale, SIRET, adresse) sont communiquées sur simple demande et seront ajoutées ici.",
    ],
  },
  { id: "cgu", t: "Conditions générales d'utilisation", body: ["La création d'une première version de site et l'assistante sont proposées gratuitement, sans engagement. L'utilisation du service implique l'acceptation des présentes conditions. Version détaillée en cours de finalisation — disponible sur demande."] },
  { id: "cgv", t: "Conditions générales de vente", body: ["Les options payantes (diffusion, avis, réseau, statistiques…) sont facturées selon la formule choisie, résiliable à tout moment. Le détail des tarifs et modalités est communiqué avant tout paiement. Version détaillée en cours de finalisation."] },
  { id: "remboursement", t: "Politique de remboursement", body: ["Vous commencez gratuitement. Pour les options payantes, aucun engagement de durée : vous pouvez arrêter quand vous le souhaitez. Toute demande de remboursement est étudiée de bonne foi — contactez-nous."] },
  { id: "confidentialite", t: "Confidentialité (données)", body: ["Nous n'utilisons que des données publiques (fiche Google) pour créer votre aperçu, et les informations que vous nous confiez. Aucune donnée n'est partagée avec un tiers sans votre accord. Vous pouvez demander la suppression de votre aperçu à tout moment."] },
];

export default function LegalPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 22px 80px", fontFamily: "'Inter',system-ui,sans-serif", color: "#1C201C", lineHeight: 1.6 }}>
      <Link href="/" style={{ color: "#0EA5A5", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>← Retour à l&apos;accueil</Link>
      <h1 style={{ fontSize: 30, fontWeight: 850, letterSpacing: "-.02em", margin: "18px 0 6px" }}>Informations légales</h1>
      <p style={{ color: "#71766C", fontSize: 14 }}>{MARQUE} · {EMAIL} · {PHONE}</p>
      <nav style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "20px 0 30px" }}>
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} style={{ fontSize: 13, fontWeight: 700, color: "#0B7A55", background: "#EAF7F1", borderRadius: 999, padding: "7px 13px", textDecoration: "none" }}>{s.t}</a>
        ))}
      </nav>
      {SECTIONS.map((s) => (
        <section key={s.id} id={s.id} style={{ scrollMarginTop: 24, marginTop: 28 }}>
          <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 8 }}>{s.t}</h2>
          {s.body.map((p, i) => (
            <p key={i} style={{ fontSize: 14.5, color: "#3A3E38", marginBottom: 8 }}>{p}</p>
          ))}
        </section>
      ))}
    </main>
  );
}
