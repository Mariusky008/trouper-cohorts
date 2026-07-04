// /admin/humain/site-internet/lettre/[slug]
// Rendu V2 : le recto est choisi par `type_diagnostic` (7 modules), le verso
// est commun. On compose styles + recto/{type} + verso et on injecte les tokens
// {{…}}. Imprimer via Cmd+P → PDF (A4). Cf. BRIEF_LETTRE_PROSPECTION_V2.
import { readFileSync } from "fs";
import { join } from "path";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import { PrintButton } from "./print-button";
import { LetterDownload } from "./letter-download";
import { LetterValidation } from "./letter-validation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const MODULES = ["SANS_SITE", "MOBILE_CASSE", "FUITE_APPEL", "NON_SECURISE", "DECLASSE_GOOGLE", "VETUSTE", "SANS_RESA"];

const str = (v: unknown) => (v == null ? "" : String(v));
const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function injectVars(html: string, vars: Record<string, string>): string {
  let out = html;
  for (const [key, val] of Object.entries(vars)) out = out.replaceAll(`{{${key}}}`, val ?? "");
  return out;
}

async function buildQr(targetUrl: string): Promise<string> {
  // QR généré localement (lib qrcode) → aucune dépendance réseau, toujours
  // présent et scannable, imprimable en vectoriel.
  try {
    const svg = await QRCode.toString(targetUrl, {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#14140F", light: "#00000000" },
    });
    return svg.replace(/<\?xml[^>]*\?>/i, "").trim();
  } catch {
    return "";
  }
}

function readTpl(rel: string): string {
  return readFileSync(join(process.cwd(), "src/templates/site-internet", rel), "utf-8");
}

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

  const nom = str(place.business_name);
  const ville = str(place.city);
  const activite = str(place.activite);
  const adresse = str(place.address);
  const prix = str(place.prix) || "690";
  const rating = typeof place.google_rating === "number" ? place.google_rating : null;
  const reviews = typeof place.google_reviews === "number" ? place.google_reviews : null;

  const diag = (place.diagnostic && typeof place.diagnostic === "object" ? place.diagnostic : {}) as Record<string, unknown>;
  const siteA = (diag.site && typeof diag.site === "object" ? diag.site : {}) as {
    https?: boolean; viewport?: boolean; year?: number | null; reachable?: boolean; hasCallButton?: boolean;
  };
  const concRaw = Array.isArray(diag.concurrents) ? diag.concurrents : [];
  const conc = concRaw
    .map((c) => (typeof c === "string" ? { name: c, note: "" } : { name: str((c as Record<string, unknown>)?.name), note: str((c as Record<string, unknown>)?.note) }))
    .filter((c) => c.name);

  // type_diagnostic (fallback dérivé pour les anciennes fiches)
  let type = str(place.type_diagnostic);
  if (!MODULES.includes(type)) {
    const hasSite = Boolean(str(place.source_website));
    if (!hasSite) type = "SANS_SITE";
    else if (siteA.viewport === false) type = "MOBILE_CASSE";
    else if (siteA.hasCallButton === false) type = "FUITE_APPEL";
    else if (siteA.https === false) type = "NON_SECURISE";
    else type = "VETUSTE";
  }
  if (type === "EXCLU") type = "VETUSTE"; // on ouvre quand même une fiche EXCLU

  const now = new Date();
  const mois = MOIS[now.getMonth()];
  const annee = String(now.getFullYear());
  const requete = `${activite} ${ville}`.trim().toLowerCase();
  const year = typeof siteA.year === "number" ? siteA.year : null;
  const noteStr = rating != null ? `${rating.toFixed(1).replace(".", ",")} ★` : "";
  const urlDomain = str(place.source_website).replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/+$/, "") || "votre-site.fr";

  // Réputation (3e constat) — 3 paliers HONNÊTES selon le volume d'avis :
  //  ≥ 50 avis  → vraie preuve sociale, on la met en avant
  //  1-49 avis  → pas encore assez pour rassurer : un site moderne aide à en gagner
  //  0 avis     → opportunité pure
  const TRUST_REVIEWS = 50;
  const note = rating != null ? rating.toFixed(1).replace(".", ",") : "";
  let reputation_titre: string;
  let reputation_texte: string;
  if (rating != null && reviews != null && reviews >= TRUST_REVIEWS) {
    reputation_titre = `${note}/5 sur ${reviews} avis : vos clients vous adorent`;
    reputation_texte =
      type === "SANS_SITE"
        ? "Il ne manque qu'un site pour transformer cette réputation en appels."
        : "Votre site mérite d'être à la hauteur de cette réputation.";
  } else if (reviews != null && reviews >= 1) {
    reputation_titre = "Pas encore assez d'avis pour rassurer";
    reputation_texte = `Avec ${reviews} avis${note ? ` (${note}/5)` : ""}, un nouveau client hésite encore. Un site moderne et bien visible inspire confiance — et donne envie d'en laisser plus.`;
  } else {
    reputation_titre = "Vos futurs clients sont déjà sur Google";
    reputation_texte = "Il suffit d'un bon site pour transformer les curieux en appels et en rendez-vous.";
  }

  // Résultats Google (SANS_SITE)
  const compResults = conc
    .slice(0, 2)
    .map((c) => `<div class="result"><div class="r-name">${esc(c.name)}</div><div class="r-meta">${c.note ? esc(c.note) + " · " : ""}a un site web</div></div>`)
    .join("");
  const google_results = compResults + `<div class="result me"><div class="r-name">${esc(nom)}</div><div class="badge">Aucun site web</div></div>`;
  const noms = conc.slice(0, 2).map((c) => c.name);
  const concurrents_phrase = noms.length
    ? `Sur « ${esc(requete)} », ${esc(noms.join(" et "))} apparaissent avec leur site. Pas vous.`
    : `Chaque jour, des clients cherchent « ${esc(requete)} » — et tombent sur ceux qui ont un site.`;

  // SERP (DECLASSE_GOOGLE)
  let rank = 1;
  const serpComp = conc
    .slice(0, 3)
    .map((c) => `<div class="srow"><div class="srank">${rank++}</div><div><div class="sname">${esc(c.name)}</div><div class="smeta">${c.note ? esc(c.note) + " · " : ""}a un site web</div></div></div>`)
    .join("");
  const serp_rows =
    serpComp +
    `<div class="sgap">· · ·</div><div class="srow me"><div class="srank">↓</div><div><div class="sname">${esc(nom)}</div><div class="smeta">${noteStr ? noteStr + " · " : ""}plus bas dans les résultats</div></div><div class="sbadge">Vous êtes ici</div></div>`;

  // Photo signature (optionnelle). On accepte un fichier image direct
  // (src/templates/site_photo.jpg|png) encodé en base64, ou un HTML pré-fait.
  let photo_marius = `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#A6A69C" stroke-width="1.4"><circle cx="12" cy="9" r="3.4"/><path d="M5.5 19a6.5 6.5 0 0 1 13 0"/></svg>`;
  const photoImg = (() => {
    for (const [file, mime] of [["site_photo.jpg", "image/jpeg"], ["site_photo.png", "image/png"], ["site_photo.jpeg", "image/jpeg"]] as const) {
      try {
        const buf = readFileSync(join(process.cwd(), "src/templates", file));
        return `<img src="data:${mime};base64,${buf.toString("base64")}" alt="Marius" />`;
      } catch {
        /* essaie le suivant */
      }
    }
    try {
      return readFileSync(join(process.cwd(), "src/templates/site-letter-photo.html"), "utf-8").trim() || null;
    } catch {
      return null;
    }
  })();
  if (photoImg) photo_marius = photoImg;

  const telephone = process.env.SITE_LETTER_PHONE || "07 XX XX XX XX";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.popey.academy";
  const qr_maquette = await buildQr(`${appUrl}/site-internet/apercu/${slug}`);
  const sous_titre = `${activite}${ville ? ` · ${ville}` : ""}`;

  const vars: Record<string, string> = {
    mois, annee, nom_commerce: nom, adresse, ville, telephone, prix,
    requete_metier: requete,
    google_results,
    concurrents_phrase,
    serp_rows,
    reputation_titre, reputation_texte,
    url_site: urlDomain,
    copyright_line: year ? `© ${year} — Tous droits réservés` : "",
    ba_neg_3: year ? `Figé depuis ${year}` : "Pensé pour l'ordinateur",
    new_sub: `${activite} · ${ville}${noteStr ? ` · ${noteStr}` : ""}`,
    sous_titre,
    vetuste_annee: year ? `est resté en ${year}.` : "est resté à une autre époque.",
    compteur_line: "Visiteurs : 004821",
    qr_maquette,
    photo_marius,
  };

  const filledRecto = injectVars(readTpl(`recto/${type}.html`), vars);
  const filledVerso = injectVars(readTpl("verso.html"), vars);
  const styles = readTpl("styles.html");

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
        <a href="/admin/humain/site-internet" style={{ color: "#00E0A0", textDecoration: "none" }}>← Liste</a>
        <span style={{ marginLeft: "auto", opacity: 0.5 }}>QR → contact direct</span>
      </div>

      <div id="letter-root" className="si-root" style={{ paddingTop: 8 }} dangerouslySetInnerHTML={{ __html: styles + filledRecto + filledVerso }} />
    </>
  );
}
