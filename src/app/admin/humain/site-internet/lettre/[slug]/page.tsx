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

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Constat = { statut?: string; label?: string; titre?: string; texte?: string };

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
      { statut: "bad", label: "Sur Google", titre: "Votre commerce est introuvable" },
      { statut: "bad", label: "Sur mobile", titre: "Aucun site à présenter" },
      { statut: "good", label: "Votre réputation", titre: "Des clients prêts à vous recommander" },
    ];
  }
  return [
    { statut: "bad", label: "Votre site actuel", titre: "Conçu il y a plus de 10 ans" },
    { statut: "mid", label: "Sur mobile", titre: "Difficile à lire sur un téléphone" },
    { statut: "good", label: "Votre réputation", titre: "Une base de clients fidèles" },
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
  const anneeSite = str(place.site_annee);
  const synthese = str(place.synthese);
  const prix = str(place.prix) || "690";

  // Constats : ceux validés en base, sinon défauts lisibles.
  const rawConstats = Array.isArray(place.constats) ? (place.constats as Constat[]) : [];
  const constats = rawConstats.length >= 3 ? rawConstats : defaultConstats(variant);

  // Horaires depuis le diagnostic si présents, sinon placeholders de mockup.
  const diag = (place.diagnostic && typeof place.diagnostic === "object" ? place.diagnostic : {}) as Record<string, unknown>;
  const horaires = (Array.isArray(diag.horaires) ? diag.horaires : []) as Array<{ jours?: string; horaires?: string }>;

  // Numéro / expéditeur : à définir en variables d'env avant la 1re impression
  // (cf. CAHIER_DES_CHARGES_SITE_INTERNET.md §11).
  const telephone = process.env.SITE_LETTER_PHONE || "06 XX XX XX XX";
  const whatsappDigits = (process.env.SITE_LETTER_WHATSAPP || "").replace(/\D/g, "");

  // QR → prise de contact directe (décision D2). WhatsApp si numéro configuré,
  // sinon fallback sur l'URL de l'app. La landing trackée remplacera ceci.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.popey.academy";
  const contactUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(`Bonjour, je vous contacte au sujet de mon site (${nom}).`)}`
    : `${appUrl}/site-internet/${slug}`;
  const qrSvg = await buildQrSvg(contactUrl);

  const now = new Date();
  const dateStr = `${MOIS[now.getMonth()]} ${now.getFullYear()}`;

  const offre =
    variant === "A"
      ? { titre: "Votre site, en ligne en 72 heures.", sub: "Enfin visible sur Google et impeccable sur mobile." }
      : { titre: "Une refonte complète en 72 heures.", sub: "Un site moderne et mobile, sans y passer de temps." };

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
    constat1_label: constats[0]?.label ?? "",
    constat1_titre: constats[0]?.titre ?? "",
    constat2_statut: constats[1]?.statut ?? "bad",
    constat2_label: constats[1]?.label ?? "",
    constat2_titre: constats[1]?.titre ?? "",
    constat3_statut: constats[2]?.statut ?? "good",
    constat3_label: constats[2]?.label ?? "",
    constat3_titre: constats[2]?.titre ?? "",
    synthese,
    offre_titre: offre.titre,
    offre_sub: offre.sub,
    prix,
    prix_avant: "",
    prix_note: "Tout compris, sans abonnement.",
    variante_classe: variant === "A" ? "vA" : "vB",
    requete: `${activite} ${ville}`.trim().toLowerCase(),
    concurrent1: str((diag.concurrents as string[] | undefined)?.[0]),
    concurrent2: str((diag.concurrents as string[] | undefined)?.[1]),
    annee_site: anneeSite,
    photo_html: "", // fallback monogramme "M" dans le template (photo via photo_base64.py plus tard)
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
        <LetterValidation
          slug={slug}
          variant={variant}
          constats={constats.map((c) => ({
            statut: str(c.statut) || "bad",
            label: str(c.label),
            titre: str(c.titre),
          }))}
          synthese={synthese}
          prix={prix}
        />
        <a href="/admin/humain/site-internet">← Liste</a>
        <span style={{ marginLeft: "auto", opacity: 0.5 }}>QR → contact direct</span>
      </div>

      <div dangerouslySetInnerHTML={{ __html: extractBody(filled) }} />
    </>
  );
}
