// /admin/humain/site-internet/lettres/[ville]
// Impression EN LOT : toutes les lettres d'une ville empilées (recto + verso
// pour chacune, une lettre par page A4 grâce à .sheet{page-break-after}).
// Cmd/Ctrl+P → Enregistrer en PDF → une pile prête à distribuer, en une fois.
// Réutilise composeLetterHtml → rendu identique à la lettre unique.
import { createAdminClient } from "@/lib/supabase/admin";
import { composeLetterHtml, readLetterStyles } from "@/lib/site-internet/letter-html";
import { PrintButton } from "../../lettre/[slug]/print-button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const str = (v: unknown) => (v == null ? "" : String(v));
const norm = (v: unknown) =>
  str(v).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
const cap = (s: string) => s.replace(/\b\p{L}/gu, (c) => c.toUpperCase());

const CORE =
  "id,slug,business_name,city,activite,address,variant,type_diagnostic,site_annee,google_rating,google_reviews,prix,diagnostic,letter_status,source_website";
const OPT = ",site_shot_manual,letter_overrides,search_volume";

// On n'imprime pas les lettres écartées/ignorées (pas de vraie offre).
const SKIP_STATUS = new Set(["skipped", "excluded"]);

export default async function LettresVillePage({ params }: { params: Promise<{ ville: string }> }) {
  const { ville: villeParam } = await params;
  const ville = decodeURIComponent(villeParam || "");
  const supabase = createAdminClient();

  // Sélection tolérante : si les colonnes optionnelles ne sont pas migrées, on
  // retombe sur les colonnes de base sans casser.
  let rows: Array<Record<string, unknown>> = [];
  let err: string | null = null;
  {
    const full = await supabase
      .from("human_vitrine_sites")
      .select(CORE + OPT)
      .eq("channel", "letter")
      .order("activite", { ascending: true })
      .limit(1000);
    if (!full.error && Array.isArray(full.data)) {
      rows = full.data as unknown as Array<Record<string, unknown>>;
    } else {
      const base = await supabase
        .from("human_vitrine_sites")
        .select(CORE)
        .eq("channel", "letter")
        .order("activite", { ascending: true })
        .limit(1000);
      if (!base.error && Array.isArray(base.data)) rows = base.data as unknown as Array<Record<string, unknown>>;
      else err = base.error?.message || full.error?.message || "Erreur Supabase";
    }
  }

  const nv = norm(ville);
  const selected = rows
    .filter((r) => {
      const rc = norm(r.city);
      return rc === nv || rc.includes(nv) || nv.includes(rc);
    })
    .filter((r) => !SKIP_STATUS.has(str(r.letter_status)))
    .sort((a, b) => {
      const av = norm(a.activite).localeCompare(norm(b.activite), "fr");
      return av !== 0 ? av : norm(a.business_name).localeCompare(norm(b.business_name), "fr");
    });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.popey.academy";
  const villeAff = cap(ville);

  if (err) {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif" }}>
        <h1 style={{ color: "#b91c1c" }}>Erreur</h1>
        <p><code>{err}</code></p>
        <p><a href="/admin/humain/site-internet/decouverte">← Découverte</a></p>
      </div>
    );
  }

  if (selected.length === 0) {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif" }}>
        <h1>Aucune lettre à imprimer pour « {villeAff} »</h1>
        <p>Aucun prospect (hors ignorés/exclus) pour cette ville.</p>
        <p><a href="/admin/humain/site-internet/decouverte">← Découverte</a></p>
      </div>
    );
  }

  // Composition de toutes les lettres (recto + verso), styles une seule fois.
  const styles = readLetterStyles();
  const bodies = await Promise.all(
    selected.map(async (place) => {
      const shotManual = str(place.site_shot_manual);
      const o = place.letter_overrides;
      const overrides = o && typeof o === "object" ? (o as Record<string, string>) : {};
      const svRaw = place.search_volume;
      const searchVolume = typeof svRaw === "number" && svRaw > 0 ? svRaw : null;
      const { recto, verso } = await composeLetterHtml({
        place,
        shotManual,
        overrides,
        searchVolume,
        slug: str(place.slug),
        appUrl,
      });
      return recto + verso;
    })
  );

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
          <strong>{villeAff}</strong> · {selected.length} lettre{selected.length > 1 ? "s" : ""} ({selected.length * 2} pages)
        </span>
        <PrintButton />
        <a href="/admin/humain/site-internet/decouverte" style={{ color: "#00E0A0", textDecoration: "none" }}>← Découverte</a>
        <span style={{ marginLeft: "auto", opacity: 0.6 }}>Cmd/Ctrl+P → Enregistrer en PDF</span>
      </div>

      <div id="letter-root" className="si-root" style={{ paddingTop: 8 }} dangerouslySetInnerHTML={{ __html: styles + bodies.join("") }} />
    </>
  );
}
