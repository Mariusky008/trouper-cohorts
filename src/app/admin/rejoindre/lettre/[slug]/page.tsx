// /admin/rejoindre/lettre/[slug] — Aperçu recto+verso de la lettre d'invitation
// Imprimer via Cmd+P → Enregistrer en PDF (format A4, sans marges).
import { readFileSync } from "fs";
import { join } from "path";
import { createAdminClient } from "@/lib/supabase/admin";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function injectVars(html: string, vars: Record<string, string>): string {
  let out = html;
  for (const [key, val] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, val);
  }
  return out;
}

export default async function LettreSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const supabase = createAdminClient();
  let place: Record<string, unknown> | null = null;
  let lookupError: string | null = null;
  {
    const full = await supabase
      .from("human_marketplace_places")
      .select("id, company_name, prenom, genre, activite, metier, city, city_slug, commerce_slug, reco_status, deadline_at, type_membre")
      .eq("commerce_slug", slug)
      .maybeSingle();
    if (full.error) {
      const safe = await supabase
        .from("human_marketplace_places")
        .select("id, company_name, prenom, metier, city, commerce_slug")
        .eq("commerce_slug", slug)
        .maybeSingle();
      place = (safe.data as Record<string, unknown> | null) ?? null;
      lookupError = safe.error ? safe.error.message || String(safe.error) : null;
    } else {
      place = (full.data as Record<string, unknown> | null) ?? null;
    }
  }

  if (!place) {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif" }}>
        <h1 style={{ color: "#b91c1c" }}>Commerçant introuvable</h1>
        <p>
          Aucune ligne avec <code>commerce_slug = &quot;{slug}&quot;</code>.
        </p>
        {lookupError && (
          <p style={{ marginTop: 12, color: "#b91c1c" }}>
            Erreur base : <code>{lookupError}</code>
          </p>
        )}
      </div>
    );
  }

  const str = (v: unknown) => (v == null ? "" : String(v));
  const prenom = str(place.prenom) || str(place.company_name);
  const ville = str(place.city) || str(place.city_slug);
  const ville_maj = ville.toUpperCase();
  const metier = str(place.metier);
  const isArtisan = str(place.type_membre) === "artisan";

  const qrTargetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.popey.academy"}/rejoindre/${slug}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=10&data=${encodeURIComponent(qrTargetUrl)}`;
  let qrDataUri = qrApiUrl;
  try {
    const resp = await fetch(qrApiUrl, { cache: "no-store" });
    if (resp.ok) {
      const buf = Buffer.from(await resp.arrayBuffer());
      qrDataUri = `data:image/png;base64,${buf.toString("base64")}`;
    }
  } catch {
    // fallback : URL directe
  }

  let rectoHtml = "";
  let versoHtml = "";
  const versoFile = isArtisan
    ? "src/templates/popey-invitation-verso-artisan.html"
    : "src/templates/popey-invitation-verso.html";
  try {
    rectoHtml = readFileSync(join(process.cwd(), "src/templates/popey-invitation-recto.html"), "utf-8");
    versoHtml = readFileSync(join(process.cwd(), versoFile), "utf-8");
  } catch {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif", color: "red" }}>
        <h1>Templates HTML manquants</h1>
        <p>Dépose les fichiers dans <code>src/templates/</code> :</p>
        <ul>
          <li><code>popey-invitation-recto.html</code></li>
          <li><code>popey-invitation-verso.html</code></li>
          <li><code>popey-invitation-verso-artisan.html</code></li>
        </ul>
      </div>
    );
  }

  // Variables recto : prenom + ville
  const rectoFilled = injectVars(rectoHtml, { prenom, ville });
  // Variables verso : ville, ville_maj, qr_url
  const versoFilled = injectVars(versoHtml, { ville, ville_maj, qr_url: qrDataUri });

  const extractBody = (html: string) => {
    const m = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    return m ? m[1] : html;
  };
  const extractStyles = (html: string) => {
    const out: string[] = [];
    const re = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let m;
    while ((m = re.exec(html)) !== null) out.push(m[1]);
    return out.join("\n");
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @page { margin: 0; size: A4; }
          @media print {
            .no-print { display: none !important; }
            header, nav, footer, [class*="sidebar"], [class*="navbar"] { display: none !important; }
            body, html { margin: 0 !important; padding: 0 !important; }
            main { padding: 0 !important; margin: 0 !important; max-width: none !important; }
            .page-sep { page-break-after: always; break-after: page; }
          }
          .no-print {
            position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
            background: #1a1a2e; color: #fff; padding: 10px 20px;
            display: flex; align-items: center; gap: 16px;
            font-family: sans-serif; font-size: 14px;
          }
          .no-print button {
            background: #07B083; color: #0B0D12; border: none;
            padding: 8px 20px; border-radius: 8px; font-weight: 800;
            font-size: 14px; cursor: pointer;
          }
          .no-print a { color: #00E0A0; text-decoration: none; }
          .page-sep { page-break-after: always; }
          ${extractStyles(rectoFilled)}
          ${extractStyles(versoFilled)}
        `,
        }}
      />

      <div className="no-print">
        <span>
          Lettre de <strong>{prenom}</strong> · {metier} · {ville}
          {isArtisan && <span style={{ marginLeft: 8, background: "#fbbf24", color: "#000", borderRadius: 4, padding: "1px 6px", fontSize: 12 }}>Artisan</span>}
        </span>
        <PrintButton />
        <a href={`/admin/rejoindre`}>← Retour aux leads</a>
        <a href={`/admin/rejoindre/lettre`}>← Tous les prospects</a>
        <span style={{ marginLeft: "auto", opacity: 0.5 }}>QR → {qrTargetUrl}</span>
      </div>

      {/* Recto */}
      <div
        className="page-sep"
        dangerouslySetInnerHTML={{ __html: extractBody(rectoFilled) }}
      />

      {/* Verso */}
      <div
        dangerouslySetInnerHTML={{ __html: extractBody(versoFilled) }}
      />
    </>
  );
}
