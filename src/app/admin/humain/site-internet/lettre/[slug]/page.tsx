// /admin/humain/site-internet/lettre/[slug]
// Aperçu de la lettre N&B de prospection "refonte de site" (recto+verso dans un
// même template, variante A "pas de site" / B "refonte"). Imprimer via Cmd+P →
// Enregistrer en PDF (A4, sans marges), puis photocopie N&B pour la remise en
// main propre. Voir CAHIER_DES_CHARGES_SITE_INTERNET.md.
import { readFileSync } from "fs";
import { join } from "path";
import { createAdminClient } from "@/lib/supabase/admin";
import { PrintButton } from "./print-button";
import { LetterValidation } from "./letter-validation";
import { LetterDownload } from "./letter-download";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Constat = { statut?: string; label?: string; titre?: string; preuve?: string; texte?: string };

function injectVars(html: string, vars: Record<string, string>): string {
  let out = html;
  for (const [key, val] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, val ?? "");
  }
  return out;
}

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

// Constats par défaut (avant diagnostic) pour qu'une lettre saisie à la main
// reste lisible. Le 3e est toujours positif (pastille "good").
function defaultConstats(variant: string): Constat[] {
  if (variant === "A") {
    return [
      { statut: "bad", titre: "Vous n'avez aucun site web", preuve: "Aucun site n'est renseigné sur votre fiche Google Business." },
      { statut: "bad", titre: "Vos concurrents captent vos clients", preuve: "Ceux qui ont un site apparaissent avant vous sur Google." },
      { statut: "good", titre: "Une vraie réputation locale", preuve: "Vos clients vous recommandent — un site la rendrait visible." },
    ];
  }
  return [
    { statut: "mid", titre: "Un site d'une autre époque", preuve: "Design et technologies dépassés par rapport à aujourd'hui." },
    { statut: "bad", titre: "Illisible sur un téléphone", preuve: "Pas de version mobile adaptée aux smartphones." },
    { statut: "good", titre: "Une base de clients fidèles", preuve: "Votre réputation mérite une vitrine à la hauteur." },
  ];
}

async function buildQrSvg(targetUrl: string): Promise<string> {
  const base = "https://api.qrserver.com/v1/create-qr-code/";
  const svgUrl = `${base}?size=600x600&margin=10&format=svg&data=${encodeURIComponent(targetUrl)}`;
  try {
    const resp = await fetch(svgUrl, { cache: "no-store" });
    if (resp.ok) {
      const svg = await resp.text();
      // On retire l'éventuelle déclaration XML pour une injection inline propre.
      return svg.replace(/<\?xml[^>]*\?>/i, "").trim();
    }
  } catch {
    // fallback ci-dessous
  }
  const pngUrl = `${base}?size=600x600&margin=10&data=${encodeURIComponent(targetUrl)}`;
  return `<img src="${pngUrl}" alt="QR" style="width:100%;height:100%;object-fit:contain" />`;
}

export default async function SiteInternetLettrePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("human_vitrine_sites")
    .select(
      "id,slug,business_name,city,activite,address,variant,site_annee,constats,diagnostic,synthese,prix,letter_status,source_website"
    )
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();

  const place = (data as Record<string, unknown> | null) ?? null;

  if (!place) {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif" }}>
        <h1 style={{ color: "#b91c1c" }}>Prospect introuvable</h1>
        <p>
          Aucune ligne <code>channel=&quot;letter&quot;</code> avec{" "}
          <code>slug=&quot;{slug}&quot;</code> dans <code>human_vitrine_sites</code>.
        </p>
        {error && (
          <p style={{ marginTop: 12, color: "#b91c1c" }}>
            Erreur base : <code>{error.message}</code>
          </p>
        )}
        <p style={{ marginTop: 16 }}>
          <a href="/admin/humain/site-internet">← Retour à la liste</a>
        </p>
      </div>
    );
  }

  const str = (v: unknown) => (v == null ? "" : String(v));
  const variant = str(place.variant) === "A" ? "A" : str(place.variant) === "B" ? "B" : "B";
  const nom = str(place.business_name);
  const ville = str(place.city);
  const activite = str(place.activite);
  const adresse = str(place.address);
  const synthese = str(place.synthese);
  const prix = str(place.prix) || "690";

  // Constats : ceux validés en base, sinon défauts lisibles.
  const rawConstats = Array.isArray(place.constats) ? (place.constats as Constat[]) : [];
  const constats = rawConstats.length >= 3 ? rawConstats : defaultConstats(variant);

  // Horaires depuis le diagnostic si présents, sinon placeholders de mockup.
  const diag = (place.diagnostic && typeof place.diagnostic === "object" ? place.diagnostic : {}) as Record<string, unknown>;
  const horaires = (Array.isArray(diag.horaires) ? diag.horaires : []) as Array<{ jours?: string; horaires?: string }>;

  // Concurrents (variante A) : {name, note}. On tolère l'ancien format string[].
  const concRaw = Array.isArray(diag.concurrents) ? diag.concurrents : [];
  const conc = concRaw.map((c) =>
    typeof c === "string"
      ? { name: c, note: "" }
      : { name: str((c as Record<string, unknown>)?.name), note: str((c as Record<string, unknown>)?.note) }
  );

  const esc = (x: string) =>
    x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Variante A — lignes de résultats Google : uniquement de VRAIS concurrents
  // (nom + note). Aucun concurrent réel → on n'invente pas, on n'affiche que la
  // ligne « vous ». Le commerce ciblé est toujours mis en évidence « aucun site ».
  const compRows = conc
    .filter((c) => c.name)
    .slice(0, 2)
    .map((c) => {
      const meta = `${c.note ? `${esc(c.note)} · ` : ""}a un site web`;
      return `<div class="gr"><div class="nm">${esc(c.name)}<span class="meta">${meta}</span></div></div>`;
    })
    .join("");
  const googleRows =
    compRows +
    `<div class="gr vous"><div class="nm">${esc(nom)}</div><div class="tag">aucun site web</div></div>`;

  // Variante B — bulletin d'analyse : on n'affiche QUE ce qu'on a mesuré.
  const siteA = (diag.site && typeof diag.site === "object" ? diag.site : {}) as {
    https?: boolean; viewport?: boolean; year?: number | null; responseMs?: number | null; reachable?: boolean;
  };
  const hasSiteData = Boolean(diag.site && typeof diag.site === "object");
  const siteUrl = str(place.source_website)
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "") || "votre site";
  const ms = typeof siteA.responseMs === "number" ? siteA.responseMs : null;
  const auRow = (k: string, v: string, klass = "") =>
    `<div class="au"><span class="k">${k}</span><span class="v ${klass}">${v}</span></div>`;
  let auditRows = "";
  if (!hasSiteData) {
    auditRows = auRow("Analyse détaillée", "au dos, sur demande");
  } else if (siteA.reachable === false) {
    auditRows = auRow("Votre site aujourd'hui", "Injoignable", "bad");
  } else {
    if (siteA.year) auditRows += auRow("Dernière refonte estimée", String(siteA.year));
    auditRows += auRow("Version mobile", siteA.viewport ? "Oui" : "Non", siteA.viewport ? "good" : "bad");
    auditRows += auRow("Connexion sécurisée (HTTPS)", siteA.https ? "Oui" : "Non", siteA.https ? "good" : "bad");
    if (ms != null) auditRows += auRow("Vitesse d'affichage", `${(ms / 1000).toFixed(1).replace(".", ",")} s`, ms > 3000 ? "bad" : "good");
  }

  // Numéro / expéditeur : à définir en variables d'env avant la 1re impression
  // (cf. CAHIER_DES_CHARGES_SITE_INTERNET.md §11).
  const telephone = process.env.SITE_LETTER_PHONE || "06 XX XX XX XX";

  // Photo N&B optionnelle : dépose le résultat de photo_base64.py dans
  // src/templates/site-letter-photo.html. Absent → monogramme "M" du template.
  let photoHtml = "";
  try {
    photoHtml = readFileSync(join(process.cwd(), "src/templates/site-letter-photo.html"), "utf-8").trim();
  } catch {
    photoHtml = "";
  }

  // QR → landing trackée de prise de contact directe (décision D2). Le scan est
  // enregistré, puis la landing propose WhatsApp / appel / rappel.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.popey.academy";
  const contactUrl = `${appUrl}/site-internet/${slug}`;
  const qrSvg = await buildQrSvg(contactUrl);

  const now = new Date();
  const dateStr = `${MOIS[now.getMonth()]} ${now.getFullYear()}`;

  // Verso : on vend la garantie AVANT le prix (cf. retour terrain).
  const offreTitre = "Vous ne payez rien aujourd'hui.";
  const offreSub = "On crée votre site, on vous le montre, vous décidez ensuite — et vous ne payez que s'il vous plaît.";
  const demoTitre = "Voir gratuitement la maquette de votre futur site";
  const demoTexte =
    "Scannez et dites bonjour : je crée un aperçu de votre nouveau site rien que pour vous et je vous le montre. Il vous plaît ? On lance. Sinon, ça s'arrête là — sans frais, sans relance.";

  const vars: Record<string, string> = {
    date: dateStr,
    nom,
    adresse,
    ville,
    activite,
    depuis: "",
    jours1: horaires[0]?.jours ?? "Lun — Ven",
    horaires1: horaires[0]?.horaires ?? "9h00 — 18h00",
    jours2: horaires[1]?.jours ?? "Samedi",
    horaires2: horaires[1]?.horaires ?? "9h00 — 12h00",
    constat1_statut: constats[0]?.statut ?? "bad",
    constat1_titre: constats[0]?.titre ?? "",
    constat1_preuve: constats[0]?.preuve ?? "",
    constat2_statut: constats[1]?.statut ?? "bad",
    constat2_titre: constats[1]?.titre ?? "",
    constat2_preuve: constats[1]?.preuve ?? "",
    constat3_statut: constats[2]?.statut ?? "good",
    constat3_titre: constats[2]?.titre ?? "",
    constat3_preuve: constats[2]?.preuve ?? "",
    synthese,
    offre_titre: offreTitre,
    offre_sub: offreSub,
    demo_titre: demoTitre,
    demo_texte: demoTexte,
    prix,
    prix_avant: "",
    prix_note: "",
    variante_classe: variant === "A" ? "vA" : "vB",
    requete: `${activite} ${ville}`.trim().toLowerCase(),
    // Variante A : lignes Google réelles (concurrents + « vous »)
    google_rows: googleRows,
    // Variante B : bulletin d'analyse (uniquement les faits mesurés)
    site_url: siteUrl,
    audit_rows: auditRows,
    photo_html: photoHtml, // <img> N&B (photo_base64.py) si le fichier existe, sinon monogramme "M"
    telephone,
    qr_svg: qrSvg,
  };

  let templateHtml = "";
  try {
    templateHtml = readFileSync(
      join(process.cwd(), "src/templates/prospection-nb-template.html"),
      "utf-8"
    );
  } catch {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif", color: "red" }}>
        <h1>Template manquant</h1>
        <p>
          Dépose <code>src/templates/prospection-nb-template.html</code>.
        </p>
      </div>
    );
  }

  const filled = injectVars(templateHtml, vars);

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

  const statusLabel: Record<string, string> = {
    draft: "Brouillon",
    validated: "Validée",
    printed: "Imprimée",
    delivered: "Remise",
    contacted: "Contact reçu",
    skipped: "Ignorée",
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
          }
          .no-print {
            position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
            background: #1a1a2e; color: #fff; padding: 10px 20px;
            display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
            font-family: sans-serif; font-size: 14px;
          }
          .no-print a { color: #00E0A0; text-decoration: none; }
          ${extractStyles(filled)}
        `,
        }}
      />

      <div className="no-print">
        <span>
          Lettre <strong>{nom || slug}</strong> · {ville}
          <span
            style={{
              marginLeft: 8, background: variant === "A" ? "#f59e0b" : "#3b82f6",
              color: "#000", borderRadius: 4, padding: "1px 6px", fontSize: 12, fontWeight: 700,
            }}
          >
            Variante {variant}
          </span>
          <span style={{ marginLeft: 8, opacity: 0.7 }}>
            {statusLabel[str(place.letter_status)] ?? str(place.letter_status)}
          </span>
        </span>
        <PrintButton />
        <LetterDownload slug={slug} />
        <LetterValidation
          slug={slug}
          variant={variant}
          constats={constats.map((c) => ({
            statut: str(c.statut) || "bad",
            label: str(c.label),
            titre: str(c.titre),
            preuve: str(c.preuve),
          }))}
          synthese={synthese}
          prix={prix}
        />
        <a href="/admin/humain/site-internet">← Liste</a>
        <span style={{ marginLeft: "auto", opacity: 0.5 }}>QR → contact direct</span>
      </div>

      <div id="letter-root" dangerouslySetInnerHTML={{ __html: extractBody(filled) }} />
    </>
  );
}
