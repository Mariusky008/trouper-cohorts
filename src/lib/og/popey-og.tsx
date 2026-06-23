import { ImageResponse } from "next/og";

// Vignette d'aperçu de lien (Open Graph) Popey — marque CLIENT. Générée dynamiquement (PNG)
// pour le partage WhatsApp/SMS. 1200×630 = format recommandé. Partagée par les routes
// opengraph-image (racine, /m/<ville>, /c/<slug>) ; on ne fait varier que le sous-titre.
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export function popeyOgImage(subtitle: string): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 90,
          background: "linear-gradient(135deg, #0B0D12 0%, #15192a 55%, #0e2a22 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, letterSpacing: 10, color: "#9fb0c0" }}>
          LE CLUB DES BONS PLANS
        </div>
        <div style={{ display: "flex", fontSize: 150, fontWeight: 800, lineHeight: 1, marginTop: 14 }}>
          <span>Pop</span>
          <span style={{ color: "#36e0a0" }}>ey</span>
        </div>
        <div style={{ display: "flex", fontSize: 50, marginTop: 24, color: "#e6edf3", maxWidth: 1000 }}>{subtitle}</div>
        <div style={{ display: "flex", marginTop: 46 }}>
          {["Offres", "Gratuités", "Privilèges"].map((c) => (
            <div
              key={c}
              style={{
                display: "flex",
                fontSize: 30,
                color: "#bfe9d6",
                border: "2px solid rgba(54,224,160,0.5)",
                borderRadius: 999,
                padding: "12px 26px",
                marginRight: 18,
              }}
            >
              {c}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", marginTop: 56, fontSize: 30, color: "#7a8a9a" }}>popey.academy</div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
