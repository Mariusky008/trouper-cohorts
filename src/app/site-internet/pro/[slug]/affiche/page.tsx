// Affiche A5 à imprimer (Espace Pro, jeton ?k=…). Le pro l'imprime et la pose à
// sa caisse : un QR « laissez-moi un avis Google » ou « réservez en ligne ».
// Le QR est généré côté serveur (SVG net, imprimable). Rien n'est inventé : nom,
// note et avis viennent des vraies données Google.
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import QRCode from "qrcode";
import { PrintBar } from "./print-button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Affiche à imprimer",
  robots: { index: false, follow: false },
};

const str = (v: unknown) => (v == null ? "" : String(v));

async function qrSvg(target: string, accent: string): Promise<string> {
  try {
    const svg = await QRCode.toString(target, {
      type: "svg",
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark: accent, light: "#00000000" },
    });
    return svg.replace(/<\?xml[^>]*\?>/i, "").trim();
  } catch {
    return "";
  }
}

export default async function AffichePro({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ k?: string; type?: string }>;
}) {
  const { slug } = await params;
  const { k, type } = await searchParams;
  const token = str(k).trim();
  const kind: "avis" | "rdv" = type === "rdv" ? "rdv" : "avis";

  const notFound = (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui", padding: 24, textAlign: "center" }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Lien introuvable</h1>
        <p style={{ color: "#666" }}>Ce lien privé n&apos;est plus valide.</p>
      </div>
    </main>
  );
  if (!token) return notFound;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("business_name, city, activite, google_rating, google_reviews, google_place_id, pro_token")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const row = (data as Record<string, unknown> | null) ?? null;
  if (!row || !row.pro_token || str(row.pro_token) !== token) return notFound;

  const nom = str(row.business_name) || "Votre commerce";
  const ville = str(row.city);
  const placeId = str(row.google_place_id);
  const rating = typeof row.google_rating === "number" ? row.google_rating : null;
  const reviews = typeof row.google_reviews === "number" ? row.google_reviews : null;
  const note = rating != null ? rating.toFixed(1).replace(".", ",") : null;

  const base = String(process.env.NEXT_PUBLIC_SITE_URL || "https://www.popey.academy").replace(/\/+$/, "");
  const reviewLink = placeId
    ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${nom} ${ville}`)}`;
  const siteUrl = `${base}/site-internet/apercu/${encodeURIComponent(slug)}`;

  const accent = "#14140F";
  const target = kind === "avis" ? reviewLink : siteUrl;
  const svg = await qrSvg(target, accent);

  const copy =
    kind === "avis"
      ? {
          k: "Votre avis compte",
          h: "Vous êtes reparti·e content·e ?",
          p: "Laissez-nous un avis Google — 30 secondes, ça nous aide énormément.",
          cta: "Scannez pour laisser votre avis",
        }
      : {
          k: "Réservez en ligne",
          h: "Prenez rendez-vous en 30 secondes",
          p: "À toute heure, sans appeler. Scannez et choisissez votre créneau.",
          cta: "Scannez pour réserver",
        };

  const avisHref = `?k=${encodeURIComponent(token)}&type=avis`;
  const rdvHref = `?k=${encodeURIComponent(token)}&type=rdv`;

  return (
    <main className="affwrap">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .affwrap{--ink:#14140F;--soft:#6E6E64;--gold:#B8862F;--paper:#FCFBF9;
            font-family:'Inter',system-ui,-apple-system,sans-serif;background:#E9E7E0;color:var(--ink);
            min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:22px 16px 60px;-webkit-font-smoothing:antialiased;}
          .aff-bar{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;justify-content:center;}
          .aff-bar .t{text-decoration:none;border:1px solid #D6D3CC;background:#fff;color:var(--ink);border-radius:22px;padding:9px 15px;font-size:13px;font-weight:600;}
          .aff-bar .t.on{background:var(--ink);color:#fff;border-color:var(--ink);}
          .aff-bar .pr{border:none;background:var(--gold);color:#fff;border-radius:22px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
          /* A5 portrait : 148 × 210 mm */
          .aff{width:148mm;min-height:210mm;background:var(--paper);border-radius:6px;box-shadow:0 24px 60px -28px rgba(0,0,0,.4);
            padding:20mm 16mm;display:flex;flex-direction:column;align-items:center;text-align:center;position:relative;overflow:hidden;}
          .aff::before{content:"";position:absolute;top:0;left:0;right:0;height:9mm;background:var(--ink);}
          .aff .k{margin-top:6mm;font-size:11pt;letter-spacing:.28em;text-transform:uppercase;color:var(--gold);font-weight:700;}
          .aff .nom{font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:27pt;line-height:1.08;margin:5mm 0 2mm;}
          .aff .ville{font-size:11pt;color:var(--soft);}
          .aff .rate{display:inline-flex;align-items:center;gap:7px;margin-top:5mm;font-size:12pt;}
          .aff .rate .st{color:var(--gold);letter-spacing:2px;}
          .aff .rate b{font-weight:700;}
          .aff .rate span{color:var(--soft);}
          .aff .h{font-family:Georgia,serif;font-size:18pt;font-weight:700;margin:9mm 0 3mm;line-height:1.2;}
          .aff .p{font-size:11.5pt;color:var(--soft);line-height:1.5;max-width:95mm;}
          .aff .qr{margin:9mm 0 4mm;width:62mm;height:62mm;display:flex;align-items:center;justify-content:center;}
          .aff .qr svg{width:100%;height:100%;}
          .aff .cta{font-size:12pt;font-weight:700;color:var(--ink);}
          .aff .foot{margin-top:auto;padding-top:8mm;font-size:8.5pt;color:#A6A69C;letter-spacing:.02em;}
          .aff .foot b{color:var(--soft);font-weight:600;}
          @media print{
            @page{size:A5 portrait;margin:0;}
            html,body{background:#fff;}
            .affwrap{padding:0;background:#fff;min-height:auto;}
            .aff-bar{display:none;}
            .aff{width:148mm;min-height:210mm;box-shadow:none;border-radius:0;}
          }
          `,
        }}
      />
      <PrintBar avisHref={avisHref} rdvHref={rdvHref} current={kind} />

      <div className="aff">
        <div className="k">{copy.k}</div>
        <div className="nom">{nom}</div>
        {ville ? <div className="ville">{ville}</div> : null}
        {kind === "avis" && note && reviews != null && reviews > 0 ? (
          <div className="rate">
            <span className="st">{"★".repeat(Math.max(1, Math.min(5, Math.round(rating as number))))}</span>
            <b>{note}</b>
            <span>· {reviews} avis Google</span>
          </div>
        ) : null}

        <div className="h">{copy.h}</div>
        <div className="p">{copy.p}</div>

        <div className="qr" dangerouslySetInnerHTML={{ __html: svg }} />
        <div className="cta">↑ {copy.cta}</div>

        <div className="foot">
          Ouvrez l&apos;appareil photo de votre téléphone et visez le code — pas d&apos;application à installer.
        </div>
      </div>
    </main>
  );
}
