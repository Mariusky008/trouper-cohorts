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
import { LetterContentEdit } from "./letter-content-edit";
import { ProLinkButton } from "./pro-link-button";

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

  const note = rating != null ? rating.toFixed(1).replace(".", ",") : "";
  // Le gros bulletin d'étoiles est retiré (trop clinique, il concurrençait le
  // récit). On garde le signal « c'est mesuré, pas une opinion » via une micro-
  // mention sous le visuel + le défaut réel porté par les puces « Aujourd'hui ».
  const constate_tag = type !== "SANS_SITE" ? `<div class="constate">Constaté sur votre site</div>` : "";

  // 1er constat SANS_SITE — adapté si le commerçant n'a qu'une fiche annuaire :
  // on ne dit pas « aucune présence » (faux), mais « pas de site À VOUS ».
  const sans_titre1 = platform
    ? `Vous avez une fiche ${platform}, mais pas de site à vous`
    : "Vos clients ne voient pas votre travail";
  const sans_texte1 = platform
    ? `Sur ${platform}, vous êtes une ligne parmi d'autres. Un site à vous ne parle que de vous — et il vous appartient.`
    : "Votre fiche Google n'affiche aucun site : juste une adresse et un numéro.";

  // SANS_SITE — le SERP raconte un parcours : les concurrents (qui ont un site)
  // d'abord, puis ↓, puis vous tout en bas (aucun site). L'œil descend l'histoire.
  const compResults = conc
    .slice(0, 2)
    .map((c) => `<div class="result"><div class="r-name">${esc(c.name)}</div><div class="r-meta">${c.note ? esc(c.note) + " · " : ""}a un site web</div></div>`)
    .join("");
  const meRow = `<div class="result me"><div class="r-name">${esc(nom)}</div><div class="badge">Aucun site web</div></div>`;
  const google_results = conc.length
    ? `<div class="serp-hint">D'abord, ceux qui ont un site :</div>${compResults}<div class="serp-down">↓ et vous, tout en bas</div>${meRow}`
    : meRow;
  const noms = conc.slice(0, 2).map((c) => c.name);
  const concurrents_phrase = noms.length
    ? `Sur « ${esc(requete)} », ${esc(noms.join(" et "))} apparaissent avec leur site. Pas vous.`
    : `Chaque jour, des clients cherchent « ${esc(requete)} » — et tombent sur ceux qui ont un site.`;

  // Conséquence honnête (ACTE final avant le climax) — adaptée à la situation.
  // On parle du SITE qui manque, jamais d'une invisibilité totale (fiche Google existe).
  const sans_conseq = platform
    ? `Vous êtes sur ${platform}, mais pas sur un site à vous — une ligne parmi d'autres.`
    : reviews != null && reviews >= 1 && note
      ? `Vos clients vous notent ${note}/5 sur Google. Mais sans site, rien ne transforme les curieux en appels.`
      : `Le client clique sur ceux qui ont un site. Le vôtre n'existe pas encore.`;

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
      // Colonne letter_overrides pas encore migrée → on lit juste la capture.
      const { data: d3 } = await supabase
        .from("human_vitrine_sites")
        .select("site_shot_manual")
        .eq("slug", slug)
        .eq("channel", "letter")
        .maybeSingle();
      shotManual = str((d3 as Record<string, unknown> | null)?.site_shot_manual);
    }
  }
  const ov = (k: string, def: string) => {
    const v = overrides[k];
    return typeof v === "string" && v.trim() ? v : def;
  };
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

  // ── « UNE SEULE HISTOIRE » — un seul fil narratif, lu en < 10 s ───────────
  // Grammaire commune à tous les modules :
  //   crochet (chiffre de demande OU accroche) → identité → étape → visuel
  //   → conséquence rebouclée → preuve discrète → un seul CTA (au dos).
  // Chaque texte a un DÉFAUT calculé ; l'admin peut le remplacer (ov(clé, défaut)).

  // Points avant/après (before/after) — inchangés, toujours éditables.
  const SYNTHESES: Record<string, string> = {
    FUITE_APPEL: "La différence : <b>un client qui hésite… ou un client qui vous appelle.</b>",
    MOBILE_CASSE: "La différence : <b>un client qui referme… ou un client qui vous appelle.</b>",
    VETUSTE: "La différence : <b>un client qui doute… ou un client qui vous choisit.</b>",
  };
  // Constat → conséquence : chaque défaut est suivi de son effet business réel.
  const NEG: Record<string, string[]> = {
    FUITE_APPEL: ["Numéro à recopier à la main → moins d'appels", "Rien n'invite à vous joindre tout de suite"],
    MOBILE_CASSE: ["Illisible sans zoomer → on referme", "Pensé pour l'ordinateur, pas le mobile"],
  };
  const POS: Record<string, string[]> = {
    FUITE_APPEL: ["Appeler en un seul geste", "Avis Google mis en avant"],
    MOBILE_CASSE: ["Clair au premier regard", "Appel en un geste"],
  };
  const negIcon = '<svg width="13" height="13" viewBox="0 0 24 24" stroke="#A6A69C" stroke-width="2.5" fill="none"><line x1="6" y1="12" x2="18" y2="12"/></svg>';
  const posIcon = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#14140F" stroke-width="2.2"><polyline points="5,12.5 10,17 19,7"/></svg>';
  const baPointsHtml = (items: string[], kind: "neg" | "pos") =>
    `<div class="ba-points">${items.map((t) => `<div class="ba-pt ${kind}"><span class="m">${kind === "neg" ? negIcon : posIcon}</span>${esc(t)}</div>`).join("")}</div>`;

  const ba_synthese = ov("ba_synthese", SYNTHESES[type] ?? "");
  const negItems = (NEG[type] ?? []).map((d, i) => ov(`neg${i + 1}`, d));
  const posItems = (POS[type] ?? []).map((d, i) => ov(`pos${i + 1}`, d));
  const ba_points_neg = negItems.length ? baPointsHtml(negItems, "neg") : "";
  const ba_points_pos = posItems.length ? baPointsHtml(posItems, "pos") : "";

  // 1) LE CROCHET (hook_block). Si un VRAI volume de recherche est saisi, il devient
  //    le titre — le chiffre qui fait mal. Sinon, une accroche honnête par module
  //    (aucun chiffre inventé). L'identité (nom + adresse) passe en sous-ligne.
  const HOOK_FALLBACK: Record<string, string> = {
    FUITE_APPEL: "Un client qui vous trouve sur Google<br>doit pouvoir vous appeler en un geste.",
    MOBILE_CASSE: "Aujourd'hui, la plupart de vos clients<br>vous découvrent sur leur téléphone.",
    VETUSTE: `Votre travail a évolué.<br>Votre site, lui, ${year ? `est resté en ${year}.` : "est resté à une autre époque."}`,
    NON_SECURISE: "Avant même d'ouvrir votre site,<br>vos clients lisent « Non sécurisé ».",
    DECLASSE_GOOGLE: "Vos clients cherchent, vos concurrents apparaissent.<br>Vous, plus bas.",
    SANS_RESA: "Vos clients réservent le soir, à 22 h.<br>À cette heure-là, votre site ne répond pas.",
    SANS_SITE: "", // l'ouverture est portée par la scène (« Un client cherche… »)
  };
  const hook_headline = ov("hook_headline", HOOK_FALLBACK[type] ?? "");
  const hook_block = searchVolume
    ? `<div class="hook"><div class="hook-num">≈ ${searchVolume}</div><div class="hook-cap">recherches Google pour <b>« ${esc(activite.toLowerCase())} à ${esc(ville)} »</b><br>chaque mois, près de chez vous.</div></div>`
    : hook_headline
      ? `<div class="hook"><div class="hook-cap big">${hook_headline}</div></div>`
      : "";
  const hook_id = `<div class="hook-id">${esc(nom)}${adresse ? ` · ${esc(adresse)}` : ""}</div>`;

  // 2) L'ÉTAPE (story_step) : introduit le visuel du module.
  const STEP: Record<string, string> = {
    FUITE_APPEL: "Aujourd'hui, voici ce qu'il trouve en vous cherchant — et ce que ce serait <b>demain</b> :",
    MOBILE_CASSE: "Voici votre site <b>tel qu'il s'affiche sur un téléphone</b> — et ce que ce serait demain :",
    VETUSTE: "Votre site aujourd'hui — et ce qu'il pourrait être <b>dès cette semaine</b> :",
    NON_SECURISE: "Voici ce que votre navigateur affiche <b>avant même votre site</b> :",
    DECLASSE_GOOGLE: `Sur « ${esc(requete)} », voici <b>l'ordre dans lequel Google vous classe</b> :`,
    SANS_RESA: "Voici votre site quand un client veut réserver, un soir :",
    SANS_SITE: "",
  };
  const story_step = ov("story_step", STEP[type] ?? "");

  // 3) LA CONSÉQUENCE — une QUESTION qui engage + les détails qui font la différence.
  //    (remplace le long paragraphe). Le chiffre est déjà porté par le crochet en
  //    tête : ici on reboucle par « elles » sans le répéter.
  const story_q = ov(
    "story_q",
    searchVolume
      ? "Pourquoi vous choisiraient-elles, plutôt qu'un autre&nbsp;?"
      : "Pourquoi un client vous choisirait-il, plutôt qu'un autre&nbsp;?"
  );
  const story_d = ov(
    "story_d",
    "Souvent, ce sont les détails : <b>appeler en un clic</b> · <b>des avis rassurants</b> · <b>un site récent et mobile</b>."
  );
  const story_result = `<div class="story-q">${story_q}</div><div class="story-d">${story_d}</div>`;

  // 4) L'ÉMOTION juste avant le renvoi au dos : la version existe DÉJÀ (vraie —
  //    la maquette est réellement générée pour ce prospect) → projection.
  const prepared_line = ov("prepared_line", "Cette version existe déjà. Nous l'avons préparée pour vous.");
  const prepared_block = `<div class="prepared">${prepared_line}</div>`;

  // 5) LE CTA unique vers le verso (au dos) — concret : « votre futur site, déjà prêt ».
  const preview_cta =
    `<div class="preview-cta" style="margin:0 auto;"><span class="qr-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#14140F" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><line x1="14.5" y1="14.5" x2="14.5" y2="21"/><line x1="18" y1="14.5" x2="18" y2="18"/><line x1="21" y1="17.5" x2="21" y2="21"/></svg></span>Au dos : scannez pour voir <b>votre futur site, déjà prêt</b> →</div>`;

  // Micro-tag « préparée pour vous » au-dessus du téléphone « Demain » (before/after).
  const prep_tag = `<div class="prep-tag">✦ Version préparée pour vous</div>`;

  // Liste des champs éditables du module courant (pour le panneau d'édition).
  const editableFields: { key: string; label: string; value: string; multiline?: boolean }[] = [];
  if (!searchVolume && HOOK_FALLBACK[type]) editableFields.push({ key: "hook_headline", label: "Accroche (titre, si pas de chiffre)", value: hook_headline, multiline: true });
  if (STEP[type]) editableFields.push({ key: "story_step", label: "Phrase d'introduction du visuel", value: story_step, multiline: true });
  negItems.forEach((v, i) => editableFields.push({ key: `neg${i + 1}`, label: `Aujourd'hui — point ${i + 1}`, value: v }));
  posItems.forEach((v, i) => editableFields.push({ key: `pos${i + 1}`, label: `Demain — point ${i + 1}`, value: v }));
  if (SYNTHESES[type]) editableFields.push({ key: "ba_synthese", label: "Phrase de synthèse", value: ba_synthese, multiline: true });
  editableFields.push({ key: "story_q", label: "Question du bas", value: story_q, multiline: true });
  editableFields.push({ key: "story_d", label: "Détails (sous la question)", value: story_d, multiline: true });
  editableFields.push({ key: "prepared_line", label: "Phrase « préparée pour vous » (avant le QR)", value: prepared_line, multiline: true });
  editableFields.push({ key: "search_volume", label: "Recherches Google / mois (chiffre réel — vide = masqué)", value: searchVolume ? String(searchVolume) : "" });

  // Bandeau honnête : « Diagnostic personnalisé · {ville} · {mois} {annee} ».
  // Jamais de fausse mention (ex. « réalisé manuellement en 14 min »).
  const diag_eyebrow = ["Diagnostic personnalisé", ville, `${mois} ${annee}`]
    .filter(Boolean)
    .join(" · ");

  const vars: Record<string, string> = {
    mois, annee, nom_commerce: nom, adresse, ville, telephone, prix,
    diag_eyebrow,
    hook_block, hook_id, story_step, story_result, constate_tag, prepared_block, prep_tag, preview_cta,
    requete_metier: requete,
    google_results,
    concurrents_phrase,
    serp_rows,
    sans_titre1, sans_texte1, sans_conseq,
    ba_points_neg, ba_points_pos,
    url_site: urlDomain,
    copyright_line: year ? `© ${year} — Tous droits réservés` : "",
    new_sub: `${activite}${ville ? ` · ${ville}` : ""}`,
    sous_titre,
    vetuste_annee: year ? `est resté en ${year}.` : "est resté à une autre époque.",
    compteur_line: "Visiteurs : 004821",
    site_shot,
    demain_hero,
    ba_synthese,
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
        <LetterContentEdit slug={slug} fields={editableFields} />
        <ProLinkButton slug={slug} />
        <a href="/admin/humain/site-internet" style={{ color: "#00E0A0", textDecoration: "none" }}>← Liste</a>
        <span style={{ marginLeft: "auto", opacity: 0.5 }}>QR → contact direct</span>
      </div>

      <div id="letter-root" className="si-root" style={{ paddingTop: 8 }} dangerouslySetInnerHTML={{ __html: styles + filledRecto + filledVerso }} />
    </>
  );
}
