import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ShortLinkProps = { params: Promise<{ handle: string }> };

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function slugifyCity(v: string): string {
  return String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type PlaceInfo = { citySlug: string; cityLabel: string; name: string; ref: string };

// Résolution du commerçant à partir du handle (pro_slug ou id). Partagée par generateMetadata
// (pour l'aperçu OG) et la page (pour la redirection).
async function lookupPlace(handle: string): Promise<PlaceInfo | null> {
  const admin = createAdminClient();
  type Row = {
    id: string;
    city: string | null;
    company_name: string | null;
    owner_display_name: string | null;
    metier: string | null;
    owner_member_id: string | null;
  };
  const cols = "id,city,company_name,owner_display_name,metier,owner_member_id";
  let place: Row | null = null;
  try {
    const bySlug = await admin.from("human_marketplace_places").select(cols).eq("pro_slug", handle).maybeSingle();
    place = (bySlug.data as Row | null) || null;
  } catch {
    place = null;
  }
  if (!place && isUuid(handle)) {
    const byId = await admin.from("human_marketplace_places").select(cols).eq("id", handle).maybeSingle();
    place = (byId.data as Row | null) || null;
  }
  if (!place) return null;
  return {
    citySlug: slugifyCity(place.city || "") || "dax",
    cityLabel: String(place.city || "").trim() || "ta ville",
    name: String(place.company_name || place.owner_display_name || place.metier || "Popey"),
    ref: String(place.owner_member_id || place.id),
  };
}

// Aperçu de lien (Open Graph) pour le partage WhatsApp/SMS : marque CLIENT « Popey » (pas la
// vitrine B2B « Popey Academy » du metadata racine), personnalisé selon la ville du commerçant.
export async function generateMetadata({ params }: ShortLinkProps): Promise<Metadata> {
  const { handle } = await params;
  const info = await lookupPlace(String(handle || "").trim());
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
  const info = await lookupPlace(String(handle || "").trim());
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
