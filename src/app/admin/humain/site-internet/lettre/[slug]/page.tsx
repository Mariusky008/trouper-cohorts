// /admin/humain/site-internet/lettre/[slug]
// UNE lettre : A4, recto seul, noir et blanc. Un seul gabarit — plus de
// diagnostic, plus de verso, plus de variante par nombre d'avis. La composition
// (et les deux règles d'exclusion) vit dans composeLetterHtml, partagée avec
// l'impression en lot. Imprimer via Cmd+P → PDF (A4).
//
// ?filet=1 → variante --no-solid-header : le bandeau noir devient un double
// filet, au cas où le tirage d'essai sur papier épais donne un aplat irrégulier.
import { createAdminClient } from "@/lib/supabase/admin";
import { composeLetterHtml, readLetterStyles } from "@/lib/site-internet/letter-html";
import { FitLetter } from "./fit-letter";
import { PrintButton } from "./print-button";
import { LetterDownload } from "./letter-download";
import { LetterValidation } from "./letter-validation";
import { LetterContentEdit } from "./letter-content-edit";
import { ProLinkButton } from "./pro-link-button";
import { PublishButton } from "./publish-button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const str = (v: unknown) => (v == null ? "" : String(v));

export default async function SiteInternetLettrePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const sansAplat = str(Array.isArray(sp.filet) ? sp.filet[0] : sp.filet) === "1";
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("human_vitrine_sites")
    .select("id,slug,business_name,city,activite,address,google_rating,google_reviews,diagnostic,letter_status")
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

  // Corrections manuelles (nom, métier, adresse). Lecture tolérante : la colonne
  // peut ne pas être migrée → on dégrade sans casser.
  let overrides: Record<string, string> = {};
  {
    const { data: row2 } = await supabase
      .from("human_vitrine_sites")
      .select("letter_overrides")
      .eq("slug", slug)
      .eq("channel", "letter")
      .maybeSingle();
    const o = (row2 as Record<string, unknown> | null)?.letter_overrides;
    if (o && typeof o === "object") overrides = o as Record<string, string>;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.clikme.fr";
  const { html, exclusion, editableFields } = await composeLetterHtml({ place, overrides, slug, appUrl, sansAplat });
  const styles = readLetterStyles();

  const nom = str(place.business_name);
  const ville = str(place.city);

  const statusLabel: Record<string, string> = {
    draft: "Brouillon", validated: "Validée", printed: "Imprimée",
    delivered: "Remise", contacted: "Contact reçu", skipped: "Ignorée", excluded: "Exclu",
  };

  // Une exclusion n'est pas une erreur technique : c'est une décision, et elle
  // doit s'expliquer à l'écran pour que l'opérateur sache pourquoi ce prospect
  // ne sortira jamais de l'imprimante.
  if (exclusion) {
    const titre =
      exclusion.raison === "deontologie"
        ? "Cette lettre ne doit pas être imprimée"
        : "Fiche trop incomplète pour imprimer";
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 720, lineHeight: 1.6 }}>
        <h1 style={{ color: exclusion.raison === "deontologie" ? "#b91c1c" : "#92400e" }}>{titre}</h1>
        <p><strong>{nom || slug}</strong> · {ville}</p>
        <p>{exclusion.detail}</p>
        {exclusion.raison === "deontologie" ? (
          <p style={{ color: "#6b7280" }}>
            Cette lettre repose sur la publication d&apos;annonces commerciales dans un fil public :
            c&apos;est incompatible avec les professions réglementées. Il n&apos;existe pas de version
            adoucie — une lettre distincte, au message et au vocabulaire entièrement différents,
            reste à écrire pour ces profils.
          </p>
        ) : (
          <p style={{ color: "#6b7280" }}>
            Le sous-titre affirme ce qui est déjà dans l&apos;espace du commerçant. Tant que ces
            éléments manquent, aucune formulation n&apos;est vraie. Relancez le diagnostic pour
            récupérer les horaires et les photos, ou corrigez la fiche à la main.
          </p>
        )}
        <p><a href="/admin/humain/site-internet">← Liste</a></p>
      </div>
    );
  }

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
          <span style={{ marginLeft: 8, opacity: 0.7 }}>{statusLabel[str(place.letter_status)] ?? str(place.letter_status)}</span>
        </span>
        <PrintButton />
        <LetterDownload slug={slug} />
        <LetterValidation slug={slug} />
        <LetterContentEdit slug={slug} fields={editableFields} />
        <ProLinkButton slug={slug} />
        <PublishButton slug={slug} />
        <a
          href={sansAplat ? `/admin/humain/site-internet/lettre/${slug}` : `/admin/humain/site-internet/lettre/${slug}?filet=1`}
          style={{ color: "#00E0A0", textDecoration: "none" }}
        >
          {sansAplat ? "Bandeau plein" : "Bandeau au filet"}
        </a>
        <a href="/admin/humain/site-internet" style={{ color: "#00E0A0", textDecoration: "none" }}>← Liste</a>
        <span style={{ marginLeft: "auto", opacity: 0.5 }}>QR → son espace</span>
      </div>

      <div id="letter-root" className="si-root" style={{ paddingTop: 8 }} dangerouslySetInnerHTML={{ __html: styles + html }} />
      <FitLetter />
    </>
  );
}
