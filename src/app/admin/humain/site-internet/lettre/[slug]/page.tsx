// /admin/humain/site-internet/lettre/[slug]
// Rendu V2 : le recto est choisi par `type_diagnostic` (7 modules), le verso
// est commun. On compose styles + recto/{type} + verso et on injecte les tokens
// {{…}}. Imprimer via Cmd+P → PDF (A4). Cf. BRIEF_LETTRE_PROSPECTION_V2.
import { readFileSync } from "fs";
import { join } from "path";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDirectoryUrl, directoryPlatformName } from "@/lib/site-internet/directories";
import { PrintButton } from "./print-button";
import { LetterDownload } from "./letter-download";
import { LetterValidation } from "./letter-validation";
import { ScreenshotUpload } from "./screenshot-upload";

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

  // Une fiche d'annuaire (Doctolib, Facebook, PagesJaunes…) n'est pas le site du
  // commerçant → on la traite comme absence de site (honnêteté).
  const rawSource = str(place.source_website);
  const website = isDirectoryUrl(rawSource) ? "" : rawSource;
  // Plateforme/annuaire éventuel (Doctolib, Facebook…) : sert l'angle SANS_SITE
  // « vous êtes sur X mais vous n'avez pas de site à vous ».
  const directoryUrl = str(diag.directory_url) || (isDirectoryUrl(rawSource) ? rawSource : "");
  const platform = directoryPlatformName(directoryUrl);

  // type_diagnostic (fallback dérivé pour les anciennes fiches)
  let type = str(place.type_diagnostic);
  if (!MODULES.includes(type)) {
    const hasSite = Boolean(website);
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
  // Domaine seul (sans protocole, www, chemin ni paramètres) — sinon on affiche
  // des URL énormes type « doctolib.fr/dieteticien/...?profile_skipped=true ».
  const urlDomain =
    website
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split(/[/?#]/)[0]
      .trim() || "votre-site.fr";

  // Réputation (3e constat) — 4 paliers HONNÊTES selon le volume d'avis.
  // Aucune formule flatteuse tant que le volume ne la justifie pas.
  //  0-10   → réputation encore peu visible (opportunité)
  //  10-30  → pas encore assez d'avis pour rassurer
  //  30-80  → bonne réputation à mieux mettre en valeur
  //  80+    → excellente réputation, le site doit la porter
  const note = rating != null ? rating.toFixed(1).replace(".", ",") : "";
  const noteFrag = note ? ` (${note}/5)` : "";
  const nbAvis = reviews ?? 0;
  let reputation_titre: string;
  let reputation_texte: string;
  if (nbAvis >= 80) {
    reputation_titre = `Une excellente réputation${note ? ` : ${note}/5 sur ${nbAvis} avis` : ""}`;
    reputation_texte =
      type === "SANS_SITE"
        ? "Il ne manque qu'un site pour transformer cette réputation en appels."
        : "Votre site devrait la mettre davantage en avant — aujourd'hui, elle ne se voit pas.";
  } else if (nbAvis >= 30) {
    reputation_titre = "Une bonne réputation qui mérite d'être mise en valeur";
    reputation_texte = `Avec ${nbAvis} avis${noteFrag}, la confiance est là. Un site clair la rend visible et donne envie de vous appeler.`;
  } else if (nbAvis >= 10) {
    reputation_titre = "Pas encore assez d'avis pour rassurer";
    reputation_texte = `Avec ${nbAvis} avis${noteFrag}, un nouveau client hésite encore. Votre réputation est bonne — donnez-lui une vitrine qui inspire confiance et incite davantage de clients à en laisser.`;
  } else if (nbAvis >= 1) {
    reputation_titre = "Votre réputation est encore peu visible";
    reputation_texte = `Avec ${nbAvis} avis${noteFrag}, elle ne rassure pas encore. Un site soigné met vos clients en confiance et donne envie d'en laisser davantage.`;
  } else {
    reputation_titre = "Vos futurs clients sont déjà sur Google";
    reputation_texte = "Il suffit d'un bon site pour transformer les curieux en appels et en rendez-vous.";
  }

  // Bulletin de note ("scorecard") — UNIQUEMENT des critères réellement mesurés,
  // pour que chaque étoile soit défendable. Aucun axe inventé.
  //  Mobile   ← balise viewport détectée sur la page
  //  Sécurité ← HTTPS
  //  Appel    ← lien tel: cliquable présent
  //  Avis     ← volume d'avis Google
  const starRow = (n: number) =>
    Array.from({ length: 5 }, (_, i) => `<span class="${i < n ? "on" : "off"}">★</span>`).join("");
  const scCell = (label: string, n: number) =>
    `<div class="sc-cell"><div class="sc-l">${label}</div><div class="sc-stars">${starRow(n)}</div></div>`;
  let scorecard = "";
  if (type !== "SANS_SITE") {
    const nMobile = siteA.viewport === true ? 4 : siteA.viewport === false ? 1 : 3;
    const nSecu = siteA.https === true ? 5 : 1;
    const nAppel = siteA.hasCallButton === true ? 5 : 2;
    const nAvis = nbAvis >= 80 ? 5 : nbAvis >= 30 ? 4 : nbAvis >= 10 ? 3 : nbAvis >= 1 ? 2 : 1;
    scorecard =
      `<div class="scorecard"><div class="sc-cap">Votre présence en ligne, aujourd'hui</div>` +
      `<div class="sc-row">${scCell("Mobile", nMobile)}${scCell("Sécurité", nSecu)}${scCell("Appel", nAppel)}${scCell("Avis", nAvis)}</div></div>`;
  }

  // 1er constat SANS_SITE — adapté si le commerçant n'a qu'une fiche annuaire :
  // on ne dit pas « aucune présence » (faux), mais « pas de site À VOUS ».
  const sans_titre1 = platform
    ? `Vous avez une fiche ${platform}, mais pas de site à vous`
    : "Vos clients ne voient pas votre travail";
  const sans_texte1 = platform
    ? `Sur ${platform}, vous êtes une ligne parmi d'autres. Un site à vous ne parle que de vous — et il vous appartient.`
    : "Votre fiche Google n'affiche aucun site : juste une adresse et un numéro.";

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

  // Représentation du site actuel (modules « site existant ») — OPTION A honnête.
  // Par défaut : un schéma neutre, clairement un croquis (jamais une fausse capture
  // qui prétendrait être le site exact du commerçant). Le vrai diagnostic est porté
  // par le texte des constats (signaux réellement mesurés) et par les surcouches.
  // Si l'admin a collé SA propre capture (prise sur mobile, fidèle), elle prime.
  // Lecture tolérante de la capture manuelle : la colonne peut ne pas encore
  // exister (migration non appliquée) → on ignore sans casser la lettre.
  let shotManual = "";
  {
    const { data: shotRow } = await supabase
      .from("human_vitrine_sites")
      .select("site_shot_manual")
      .eq("slug", slug)
      .eq("channel", "letter")
      .maybeSingle();
    shotManual = str((shotRow as Record<string, unknown> | null)?.site_shot_manual);
  }
  const wireframe =
    `<div class="wireframe">` +
    `<div class="wf-bar"></div><div class="wf-hero"></div>` +
    `<div class="wf-l"></div><div class="wf-l s"></div><div class="wf-l"></div><div class="wf-l s"></div>` +
    `<div class="wf-tag">Schéma — votre site actuel</div>` +
    `</div>`;
  let site_shot = wireframe;
  if (type !== "SANS_SITE" && /^data:image\//i.test(shotManual)) {
    site_shot = `<img class="shot" src="${shotManual}" alt="Votre site actuel" />`;
  }

  // Vraie 1re photo Google du pro pour le mockup « Demain/Possible ». Repli propre :
  // si absente ou si elle ne charge pas à l'impression, on retombe sur le dégradé.
  const previewPhoto = (Array.isArray(diag.photos) ? diag.photos : [])
    .map((p) => str(p))
    .find((u) => /^https?:\/\//i.test(u)) || "";
  const demain_hero = previewPhoto
    ? `<img class="mk-shot" src="${esc(previewPhoto)}" alt="" onerror="this.remove()" /><span class="mk-scrim"></span>`
    : "";

  // Bandeau honnête : « Diagnostic personnalisé · {ville} · {mois} {annee} ».
  // Jamais de fausse mention (ex. « réalisé manuellement en 14 min »).
  const diag_eyebrow = ["Diagnostic personnalisé", ville, `${mois} ${annee}`]
    .filter(Boolean)
    .join(" · ");

  // Titre auto-rétréci pour les noms longs (évite le débordement A4 sur 2 lignes).
  const nameLen = nom.length;
  const title_style =
    nameLen > 42 ? "font-size:26px;line-height:1.06" :
    nameLen > 34 ? "font-size:30px;line-height:1.06" :
    nameLen > 24 ? "font-size:36px;line-height:1.05" : "";

  const vars: Record<string, string> = {
    mois, annee, nom_commerce: nom, adresse, ville, telephone, prix,
    diag_eyebrow, title_style,
    requete_metier: requete,
    google_results,
    concurrents_phrase,
    serp_rows,
    reputation_titre, reputation_texte,
    sans_titre1, sans_texte1,
    url_site: urlDomain,
    copyright_line: year ? `© ${year} — Tous droits réservés` : "",
    ba_neg_3: year ? `Figé depuis ${year}` : "Pensé pour l'ordinateur",
    new_sub: `${activite}${ville ? ` · ${ville}` : ""}`,
    sous_titre,
    vetuste_annee: year ? `est resté en ${year}.` : "est resté à une autre époque.",
    compteur_line: "Visiteurs : 004821",
    site_shot,
    scorecard,
    demain_hero,
    note_txt: note ? ` ${note}` : "",
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
        {type !== "SANS_SITE" && <ScreenshotUpload slug={slug} hasShot={/^data:image\//i.test(shotManual)} />}
        <a href="/admin/humain/site-internet" style={{ color: "#00E0A0", textDecoration: "none" }}>← Liste</a>
        <span style={{ marginLeft: "auto", opacity: 0.5 }}>QR → contact direct</span>
      </div>

      <div id="letter-root" className="si-root" style={{ paddingTop: 8 }} dangerouslySetInnerHTML={{ __html: styles + filledRecto + filledVerso }} />
    </>
  );
}
