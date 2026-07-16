// Carte de partage générée à la volée (WhatsApp, SMS, réseaux) : la vraie photo
// du pro en fond + son nom + « Votre nouveau site ». Bien plus léché qu'une photo
// brute. Robuste : si la photo ne se charge pas, on retombe sur un dégradé accent.
import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveMetier } from "@/lib/site-internet/metier-profiles";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Votre nouveau site";

const str = (v: unknown) => (v == null ? "" : String(v));
const cap = (s: string) => s.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_m, p, c) => p + c.toUpperCase());

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let nom = "Votre commerce";
  let role = "";
  let accent = "#8A4A3B";
  let bg: string | null = null;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("human_vitrine_sites")
      .select("business_name, city, activite, diagnostic")
      .eq("slug", slug)
      .eq("channel", "letter")
      .maybeSingle();
    const row = (data as Record<string, unknown> | null) ?? null;
    if (row) {
      nom = str(row.business_name) || nom;
      const ville = cap(str(row.city));
      const activite = str(row.activite);
      const mp = resolveMetier(activite);
      accent = mp.profil === "B" ? "#2C5A6E" : mp.profil === "C" ? "#2E4A3C" : "#8A4A3B";
      const metierLabel = mp.entry?.label ? cap(mp.entry.label) : cap(activite);
      role = [metierLabel, ville].filter(Boolean).join(" · ");
      // Photo réelle → data URI (aucun fetch externe dans le rendu de l'image).
      const photo = (Array.isArray((row.diagnostic as Record<string, unknown>)?.photos)
        ? ((row.diagnostic as Record<string, unknown>).photos as unknown[])
        : [])
        .map((x) => str(x))
        .find((u) => /^https?:\/\//i.test(u));
      if (photo) {
        try {
          const res = await fetch(photo);
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            const ct = res.headers.get("content-type") || "image/jpeg";
            if (buf.length < 5_000_000) bg = `data:${ct};base64,${buf.toString("base64")}`;
          }
        } catch {
          /* photo indisponible → dégradé */
        }
      }
    }
  } catch {
    /* best-effort → carte générique */
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: `linear-gradient(135deg, ${accent}, #16160F)`,
          fontFamily: "sans-serif",
        }}
      >
        {bg && (
          <img src={bg} width={1200} height={630} style={{ position: "absolute", inset: 0, width: 1200, height: 630, objectFit: "cover" }} alt="" />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background: "linear-gradient(180deg, rgba(10,10,8,0.15) 0%, rgba(10,10,8,0.55) 52%, rgba(10,10,8,0.92) 100%)",
          }}
        />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 68, width: "100%" }}>
          <div style={{ display: "flex", color: "#E4B850", fontSize: 26, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" }}>
            ✦ Votre nouveau site
          </div>
          <div style={{ display: "flex", color: "#FFFFFF", fontSize: 74, fontWeight: 800, lineHeight: 1.04, marginTop: 16, maxWidth: 1010 }}>
            {nom}
          </div>
          {role && (
            <div style={{ display: "flex", color: "rgba(255,255,255,0.86)", fontSize: 30, marginTop: 16 }}>{role}</div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
