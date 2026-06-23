import type { Metadata } from "next";
import { lookupSharePlace } from "@/lib/popey-human/place-share";

export const dynamic = "force-dynamic";

type ShortLinkProps = { params: Promise<{ handle: string }> };

// Aperçu de lien (Open Graph) pour le partage WhatsApp/SMS : marque CLIENT « Popey » (pas la
// vitrine B2B du metadata racine), personnalisé selon la ville du commerçant. L'image d'aperçu
// est servie par la route opengraph-image voisine.
export async function generateMetadata({ params }: ShortLinkProps): Promise<Metadata> {
  const { handle } = await params;
  const info = await lookupSharePlace(String(handle || "").trim());
  const cityLabel = info?.cityLabel || "ta ville";
  const title = `Popey — les bons plans de ${cityLabel}`;
  const description = `Le catalogue des meilleurs commerçants de ${cityLabel} : offres, gratuités et privilèges à swiper. Deviens leur habitué·e et sois prévenu·e en premier de leurs coups de feu.`;
  return {
    title,
    description,
    openGraph: { title, description, siteName: "Popey", locale: "fr_FR", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

// Lien court partageable : /c/<pro_slug|id>. On NE fait PLUS de redirect serveur (qui empêcherait
// le crawler WhatsApp de lire l'aperçu) → on rend une page légère avec l'OG ci-dessus, puis on
// redirige le vrai visiteur côté client vers le catalogue de sa ville (avec le référent du commerçant).
export default async function ShortShareRedirect({ params }: ShortLinkProps) {
  const { handle } = await params;
  const info = await lookupSharePlace(String(handle || "").trim());
  const target = info
    ? `/m/${info.citySlug}?ref_id=${encodeURIComponent(info.ref)}&ref_name=${encodeURIComponent(info.name)}`
    : "/m/dax";
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        background: "#0B0D12",
        color: "#fff",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: 24,
        textAlign: "center",
      }}
    >
      <script dangerouslySetInnerHTML={{ __html: `window.location.replace(${JSON.stringify(target)});` }} />
      <noscript>
        <meta httpEquiv="refresh" content={`0;url=${target}`} />
      </noscript>
      <div style={{ fontWeight: 800, fontSize: 24 }}>
        Pop<span style={{ color: "#36e0a0" }}>ey</span>
      </div>
      <p style={{ opacity: 0.8 }}>On ouvre le catalogue…</p>
      <a href={target} style={{ color: "#36e0a0", fontWeight: 700, textDecoration: "none" }}>
        Continuer →
      </a>
    </main>
  );
}
