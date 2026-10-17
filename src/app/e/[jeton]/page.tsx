// 👥 L'ACCÈS PERSONNEL D'UN MEMBRE DE L'ÉQUIPE — `/e/<jeton>`, le lien que son
// responsable lui a envoyé par WhatsApp (« Mon équipe », `echanges-equipe.tsx`).
//
// Ses 50 € du mois, les offres des commerçants à glisser, ses bons, et
// « Valider un bon » quand un commerçant ou un client vient au comptoir. Rien
// d'autre : l'offre de la boutique, ses cadeaux, son équipe restent au
// responsable.
//
// LA PAGE NE COMPTE PAS LE MEMBRE DANS L'ÉQUIPE : l'aperçu que WhatsApp fait du
// lien passe par ici. C'est le premier appel de la page elle-même (la route
// des échanges) qui le fait.
import type { Metadata, Viewport } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { lireLeSite } from "@/lib/site-internet/fiche-du-site";
import { familleDuDouble } from "@/lib/direct/double-metiers";
import { MARQUE } from "@/lib/marque";
import { EspaceMembre } from "./espace-membre";

export const dynamic = "force-dynamic";

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#120C09" };

/* SON PROPRE MANIFESTE (`manifest.webmanifest/route.ts`) : posée sur l'écran
   d'accueil, l'icône rouvre SON accès, pas clikme.fr. */
export async function generateMetadata({ params }: { params: Promise<{ jeton: string }> }): Promise<Metadata> {
  const { jeton } = await params;
  const j = decodeURIComponent(String(jeton ?? ""));
  return {
    title: { absolute: `Mon accès — ${MARQUE}` },
    robots: { index: false, follow: false },
    ...(/^[A-Za-z0-9_-]{24,64}$/.test(j) ? { manifest: `/e/${j}/manifest.webmanifest` } : {}),
    appleWebApp: { capable: true, title: "Mon accès", statusBarStyle: "black-translucent" },
    icons: {
      icon: [
        { url: "/direct/icone-autour.svg", type: "image/svg+xml" },
        { url: "/direct/icone-autour-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/direct/icone-autour-180.png",
    },
  };
}

const str = (v: unknown) => String(v ?? "").trim();

function Introuvable() {
  return (
    <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", background: "#120C09", color: "#FFF4E6", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 380 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>Ce lien n’est plus valable</h1>
        <p style={{ color: "#CDB8A4", lineHeight: 1.5, margin: 0 }}>Demande-en un nouveau à ton responsable : il peut te le renvoyer depuis « Mon équipe ».</p>
      </div>
    </main>
  );
}

export default async function Page({ params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params;
  const j = decodeURIComponent(String(jeton ?? ""));
  if (!/^[A-Za-z0-9_-]{24,64}$/.test(j)) return <Introuvable />;
  try {
    const supabase = createAdminClient();
    const { data: lm } = await supabase.from("human_echanges_membres").select("prenom, site_id, retire_le").eq("jeton", j).maybeSingle();
    const m = lm as { prenom?: string; site_id?: string; retire_le?: string | null } | null;
    if (!m?.site_id || m.retire_le) return <Introuvable />;
    const { data: ls } = await supabase.from("human_vitrine_sites").select("slug").eq("id", m.site_id).maybeSingle();
    const slug = str((ls as { slug?: string } | null)?.slug);
    const lu = slug ? await lireLeSite(slug).catch(() => null) : null;
    if (!lu) return <Introuvable />;
    const c = lu.carte;
    return (
      <EspaceMembre
        jeton={j}
        prenom={str(m.prenom)}
        commerce={{ nom: c.nom, slug, famille: familleDuDouble(c), metier: c.metier, branche: c.branche, photo: c.photo || "" }}
      />
    );
  } catch {
    return <Introuvable />;
  }
}
