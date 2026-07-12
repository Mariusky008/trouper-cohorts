// /admin/humain/site-internet/lettre/[slug]
// Rendu V2 : le recto est choisi par `type_diagnostic` (7 modules), le verso
// est commun. La composition (recto + verso) est faite par composeLetterHtml
// (partagée avec l'impression en lot). Imprimer via Cmd+P → PDF (A4).
import { createAdminClient } from "@/lib/supabase/admin";
import { composeLetterHtml, readLetterStyles } from "@/lib/site-internet/letter-html";
import { FitLetter } from "./fit-letter";
import { PrintButton } from "./print-button";
import { LetterDownload } from "./letter-download";
import { LetterValidation } from "./letter-validation";
import { ScreenshotUpload } from "./screenshot-upload";
import { LetterContentEdit } from "./letter-content-edit";
import { ProLinkButton } from "./pro-link-button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const str = (v: unknown) => (v == null ? "" : String(v));

export default async function SiteInternetLettrePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("human_vitrine_sites")
    .select("id,slug,business_name,city,activite,address,variant,type_diagnostic,site_annee,google_rating,google_reviews,prix,diagnostic,letter_status,source_website")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();

  const place = (data as Record<string, unknown> | null) ?? null;
  if (!place) {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif" }}>
        <h1 style={{ color: "#b91c1c" }}>Prospect introuvable</h1>
        <p>Aucune ligne <code>channel=&quot;letter&quot;</code> avec <code>slug=&quot;{slug}&quot;</code>.</p>
        {error && <p style={{ color: "#b91c1c" }}>Erreur : <code>{error.message}</code></p>}
        <p><a href="/admin/humain/site-internet">← Retour</a></p>
      </div>
    );
  }

  // Capture manuelle + overrides + volume de recherche. Lecture tolérante : les
  // colonnes peuvent ne pas encore être migrées → on dégrade sans casser.
  let shotManual = "";
  let overrides: Record<string, string> = {};
  let searchVolume: number | null = null;
  {
    const { data: row2, error: e2 } = await supabase
      .from("human_vitrine_sites")
      .select("site_shot_manual, letter_overrides, search_volume")
      .eq("slug", slug)
      .eq("channel", "letter")
      .maybeSingle();
    if (!e2 && row2) {
      shotManual = str((row2 as Record<string, unknown>).site_shot_manual);
      const o = (row2 as Record<string, unknown>).letter_overrides;
      if (o && typeof o === "object") overrides = o as Record<string, string>;
      const sv = (row2 as Record<string, unknown>).search_volume;
      if (typeof sv === "number" && sv > 0) searchVolume = sv;
    } else {
      const { data: d3 } = await supabase
        .from("human_vitrine_sites")
        .select("site_shot_manual")
        .eq("slug", slug)
        .eq("channel", "letter")
        .maybeSingle();
      shotManual = str((d3 as Record<string, unknown> | null)?.site_shot_manual);
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.popey.academy";
  const { recto, verso, type, editableFields } = await composeLetterHtml({ place, shotManual, overrides, searchVolume, slug, appUrl });
  const styles = readLetterStyles();

  const nom = str(place.business_name);
  const ville = str(place.city);
  const prix = str(place.prix) || "690";

  const statusLabel: Record<string, string> = {
    draft: "Brouillon", validated: "Validée", printed: "Imprimée",
    delivered: "Remise", contacted: "Contact reçu", skipped: "Ignorée", excluded: "Exclu (site OK)",
  };

  return (
    <>
      <div
        className="no-print"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
          background: "#14140F", color: "#fff", padding: "10px 20px",
          display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
          fontFamily: "sans-serif", fontSize: 14,
        }}
      >
        <span>
          <strong>{nom || slug}</strong> · {ville}
          <span style={{ marginLeft: 8, background: "#B8A87A", color: "#000", borderRadius: 4, padding: "1px 7px", fontSize: 12, fontWeight: 700 }}>{type}</span>
          <span style={{ marginLeft: 8, opacity: 0.7 }}>{statusLabel[str(place.letter_status)] ?? str(place.letter_status)}</span>
        </span>
        <PrintButton />
        <LetterDownload slug={slug} />
        <LetterValidation slug={slug} type={type} prix={prix} />
        {type !== "SANS_SITE" && <ScreenshotUpload slug={slug} hasShot={/^data:image\//i.test(shotManual)} />}
        <LetterContentEdit slug={slug} fields={editableFields} />
        <ProLinkButton slug={slug} />
        <a href="/admin/humain/site-internet" style={{ color: "#00E0A0", textDecoration: "none" }}>← Liste</a>
        <span style={{ marginLeft: "auto", opacity: 0.5 }}>QR → contact direct</span>
      </div>

      <div id="letter-root" className="si-root" style={{ paddingTop: 8 }} dangerouslySetInnerHTML={{ __html: styles + recto + verso }} />
      <FitLetter />
    </>
  );
}
