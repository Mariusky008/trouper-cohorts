// Composition d'UNE lettre (recto + verso) à partir d'une ligne prospect.
// Extrait de la page /lettre/[slug] pour être réutilisé tel quel par
// l'impression en lot (toutes les lettres d'une ville en un seul PDF) — même
// rendu, zéro divergence. La page unique garde en plus le panneau d'édition
// (editableFields), l'impression en lot l'ignore.
import { readFileSync } from "fs";
import { join } from "path";
import QRCode from "qrcode";
import { isDirectoryUrl, directoryPlatformName } from "@/lib/site-internet/directories";

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
export const LETTER_MODULES = ["SANS_SITE", "MOBILE_CASSE", "FUITE_APPEL", "NON_SECURISE", "DECLASSE_GOOGLE", "VETUSTE", "SANS_RESA"];

const str = (v: unknown) => (v == null ? "" : String(v));
const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function injectVars(html: string, vars: Record<string, string>): string {
  let out = html;
  for (const [key, val] of Object.entries(vars)) out = out.replaceAll(`{{${key}}}`, val ?? "");
  return out;
}

async function buildQr(targetUrl: string): Promise<string> {
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

export function readLetterStyles(): string {
  return readTpl("styles.html");
}

export type EditableField = { key: string; label: string; value: string; multiline?: boolean };

export type ComposedLetter = {
  recto: string;
  verso: string;
  type: string;
  editableFields: EditableField[];
};

export async function composeLetterHtml(input: {
  place: Record<string, unknown>;
  shotManual: string;
  overrides: Record<string, string>;
  searchVolume: number | null;
  slug: string;
  appUrl: string;
}): Promise<ComposedLetter> {
  const { place, shotManual, overrides, searchVolume, slug, appUrl } = input;

  const nom = str(place.business_name);
  const ville = str(place.city);
  const activite = str(place.activite);
  const adresse = str(place.address);
  const prix = str(place.prix) || "690";
  const capWords = (s: string) => s.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_m, p, c) => p + c.toUpperCase());
  const villeAff = capWords(ville);
  const metierSing = activite.trim().toLowerCase().replace(/s$/u, "") || "professionnel";
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

  const rawSource = str(place.source_website);
  const website = isDirectoryUrl(rawSource) ? "" : rawSource;
  const directoryUrl = str(diag.directory_url) || (isDirectoryUrl(rawSource) ? rawSource : "");
  const platform = directoryPlatformName(directoryUrl);

  let type = str(place.type_diagnostic);
  if (!LETTER_MODULES.includes(type)) {
    const hasSite = Boolean(website);
    if (!hasSite) type = "SANS_SITE";
    else if (siteA.viewport === false) type = "MOBILE_CASSE";
    else if (siteA.hasCallButton === false) type = "FUITE_APPEL";
    else if (siteA.https === false) type = "NON_SECURISE";
    else type = "VETUSTE";
  }
  if (type === "EXCLU") type = "VETUSTE";

  const now = new Date();
  const mois = MOIS[now.getMonth()];
  const annee = String(now.getFullYear());
  const requete = `${activite} ${ville}`.trim().toLowerCase();
  const year = typeof siteA.year === "number" ? siteA.year : null;
  const noteStr = rating != null ? `${rating.toFixed(1).replace(".", ",")} ★` : "";
  const urlDomain =
    website
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split(/[/?#]/)[0]
      .trim() || "votre-site.fr";

  const note = rating != null ? rating.toFixed(1).replace(".", ",") : "";
  const constate_tag = "";

  const sans_titre1 = platform
    ? `Vous avez une fiche ${platform}, mais pas de site à vous`
    : "Vos clients ne voient pas votre travail";
  const sans_texte1 = platform
    ? `Sur ${platform}, vous êtes une ligne parmi d'autres. Un site à vous ne parle que de vous — et il vous appartient.`
    : "Votre fiche Google n'affiche aucun site : juste une adresse et un numéro.";

  const compResults = conc
    .slice(0, 2)
    .map((c) => `<div class="result"><div class="r-name">${esc(c.name)}</div><div class="r-meta">${c.note ? esc(c.note) + " · " : ""}a un site web</div></div>`)
    .join("");
  const meRow = `<div class="result me"><div class="r-name">${esc(nom)}</div><div class="badge">Aucun site web</div></div>`;
  // Honnête : sans site, le pro n'est pas « tout en bas » de la page — il
  // n'apparaît simplement PAS dans ces résultats cliquables (il n'a qu'une fiche).
  const google_results = conc.length
    ? `<div class="serp-hint">Ceux qui ont un site s'affichent, cliquables :</div>${compResults}<div class="serp-down">Et vous&nbsp;: une fiche Google, mais aucun site à ouvrir.</div>${meRow}`
    : meRow;
  const noms = conc.slice(0, 2).map((c) => c.name);
  const concurrents_phrase = noms.length
    ? `Sur « ${esc(requete)} », ${esc(noms.join(" et "))} apparaissent avec leur site. Pas vous.`
    : `Chaque jour, des clients cherchent « ${esc(requete)} » — et tombent sur ceux qui ont un site.`;

  const sans_conseq = platform
    ? `Vous êtes sur ${platform}, mais pas sur un site à vous — une ligne parmi d'autres.`
    : reviews != null && reviews >= 1 && note
      ? `Vos clients vous notent ${note}/5 sur Google. Mais sans site, rien ne transforme les curieux en appels.`
      : `Le client clique sur ceux qui ont un site. Le vôtre n'existe pas encore.`;

  // Compteur d'avis RÉEL (honnête) — SANS_SITE avec une réputation existante :
  // on montre l'actif déjà acquis (chiffre présent, vrai), la promesse (un site
  // + l'Assistant Avis pour en récolter plus) reste portée par optim_body. Aucun
  // chiffre futur inventé. Vide si pas d'avis → pas de ligne (A4 préservé).
  const reputation_line =
    reviews != null && reviews >= 1 && note
      ? `<div class="rep-line"><b>Déjà ${reviews} avis</b> sur Google (${note}/5) : une vraie réputation — mais sans site, rien ne la transforme en appels.</div>`
      : "";

  let rank = 1;
  const serpComp = conc
    .slice(0, 3)
    .map((c) => `<div class="srow"><div class="srank">${rank++}</div><div><div class="sname">${esc(c.name)}</div><div class="smeta">${c.note ? esc(c.note) + " · " : ""}a un site web</div></div></div>`)
    .join("");
  const serp_rows =
    serpComp +
    `<div class="sgap">· · ·</div><div class="srow me"><div class="srank">↓</div><div><div class="sname">${esc(nom)}</div><div class="smeta">${noteStr ? noteStr + " · " : ""}plus bas dans les résultats</div></div><div class="sbadge">Vous êtes ici</div></div>`;

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
  const qr_maquette = await buildQr(`${appUrl}/site-internet/apercu/${slug}`);
  const sous_titre = `${activite}${ville ? ` · ${ville}` : ""}`;

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

  const previewPhoto = (Array.isArray(diag.photos) ? diag.photos : [])
    .map((p) => str(p))
    .find((u) => /^https?:\/\//i.test(u)) || "";
  const demain_hero = previewPhoto
    ? `<img class="mk-shot" src="${esc(previewPhoto)}" alt="" onerror="this.remove()" /><span class="mk-scrim"></span>`
    : "";

  const SYNTHESES: Record<string, string> = {
    FUITE_APPEL: "La différence : <b>un client qui hésite… ou un client qui vous appelle.</b>",
    MOBILE_CASSE: "La différence : <b>un client qui referme… ou un client qui vous appelle.</b>",
    VETUSTE: "La différence : <b>un client qui doute… ou un client qui vous choisit.</b>",
  };
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
  const negDefaults = NEG[type] ?? [];
  const posDefaults = POS[type] ?? [];
  const negItems = negDefaults.map((d, i) => ov(`neg${i + 1}`, d));
  const posItems = posDefaults.map((d, i) => ov(`pos${i + 1}`, d));
  const neg3 = ov("neg3", "");
  const pos3 = ov("pos3", "");
  if (neg3) negItems.push(neg3);
  if (pos3) posItems.push(pos3);
  const ba_points_neg = negItems.length ? baPointsHtml(negItems, "neg") : "";
  const ba_points_pos = posItems.length ? baPointsHtml(posItems, "pos") : "";

  const HOOK_FALLBACK: Record<string, string> = {
    FUITE_APPEL: "Un client qui vous trouve sur Google<br>doit pouvoir vous appeler en un geste.",
    MOBILE_CASSE: "Aujourd'hui, la plupart de vos clients<br>vous découvrent sur leur téléphone.",
    VETUSTE: `Votre travail a évolué.<br>Votre site, lui, ${year ? `est resté en ${year}.` : "est resté à une autre époque."}`,
    NON_SECURISE: "Avant même d'ouvrir votre site,<br>vos clients lisent « Non sécurisé ».",
    DECLASSE_GOOGLE: "Vos clients cherchent, vos concurrents apparaissent.<br>Vous, plus bas.",
    SANS_RESA: "Vos clients réservent le soir, à 22 h.<br>À cette heure-là, votre site ne répond pas.",
    SANS_SITE: "",
  };
  const hook_headline = ov("hook_headline", HOOK_FALLBACK[type] ?? "");
  const hook_miss = ov("hook_miss", "Et il semblerait que vous passiez à côté d'une partie de ces clients.");
  const hook_block = searchVolume
    ? `<div class="hook"><div class="hook-num">≈ ${searchVolume}</div><div class="hook-cap">recherches Google pour <b>« ${esc(metierSing)} à ${esc(villeAff)} »</b> chaque mois.</div><div class="hook-miss">${hook_miss}</div></div>`
    : hook_headline
      ? `<div class="hook"><div class="hook-cap big">${hook_headline}</div></div>`
      : "";
  const shortAddr = adresse
    .replace(/,?\s*France\s*$/i, "")
    .replace(/\b\d{4,6}\b/g, "")
    .replace(/\s*,\s*,\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .replace(/[\s,]+$/, "")
    .trim();
  const idFull = shortAddr ? `${nom} · ${shortAddr}` : nom;
  const withAddr = Boolean(shortAddr) && idFull.length <= 56;
  const idText = withAddr ? `${esc(nom)} · ${esc(shortAddr)}` : esc(nom);
  const idLen = (withAddr ? idFull : nom).length;
  const hookid_style = idLen > 58 ? "font-size:11.5px" : idLen > 44 ? "font-size:13px" : "";
  const hook_id = `<div class="hook-id" style="${hookid_style}">${idText}</div>`;

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

  const story_q = ov(
    "story_q",
    searchVolume
      ? "Pourquoi vous choisiraient-elles, plutôt qu'un autre&nbsp;?"
      : "Pourquoi un client vous choisirait-il, plutôt qu'un autre&nbsp;?"
  );
  const story_d = ov(
    "story_d",
    "En quelques secondes sur son téléphone, un visiteur décide : <b>vous contacter</b>… ou continuer ses recherches ailleurs."
  );
  const optim_body = ov(
    "optim_body",
    "J'ai préparé une première version de votre site, pensée pour que ceux qui vous découvrent aient tout de suite envie de vous contacter : <b>appel en un geste</b>, <b>avis en avant</b>, une vraie clarté — et un moyen simple d'obtenir <b>plus d'avis Google</b>, en un geste après chaque client."
  );
  const story_result =
    `<div class="story-q">${story_q}</div>` +
    `<div class="story-d">${story_d}</div>` +
    `<div class="optim-body">${optim_body}</div>`;

  const prepared_line = ov("prepared_line", "");
  const prepared_block = prepared_line ? `<div class="prepared">${prepared_line}</div>` : "";

  const preview_cta =
    `<div class="preview-cta" style="margin:0 auto;"><span class="qr-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#14140F" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><line x1="14.5" y1="14.5" x2="14.5" y2="21"/><line x1="18" y1="14.5" x2="18" y2="18"/><line x1="21" y1="17.5" x2="21" y2="21"/></svg></span>Retournez la feuille : scannez le QR, <b>essayez votre maquette en direct</b> →</div>`;

  const prep_tag = `<div class="prep-tag">✦ Version préparée pour vous</div>`;

  const editableFields: EditableField[] = [];
  if (!searchVolume && HOOK_FALLBACK[type]) editableFields.push({ key: "hook_headline", label: "Accroche (titre, si pas de chiffre)", value: hook_headline, multiline: true });
  if (searchVolume) editableFields.push({ key: "hook_miss", label: "Phrase sous le chiffre (la tension)", value: hook_miss, multiline: true });
  if (STEP[type]) editableFields.push({ key: "story_step", label: "Phrase d'introduction du visuel", value: story_step, multiline: true });
  negDefaults.forEach((_, i) => editableFields.push({ key: `neg${i + 1}`, label: `Aujourd'hui — point ${i + 1}`, value: negItems[i] ?? "" }));
  if (negDefaults.length) editableFields.push({ key: "neg3", label: "Aujourd'hui — point 3 (facultatif)", value: neg3 });
  posDefaults.forEach((_, i) => editableFields.push({ key: `pos${i + 1}`, label: `Demain — point ${i + 1}`, value: posItems[i] ?? "" }));
  if (posDefaults.length) editableFields.push({ key: "pos3", label: "Demain — point 3 (facultatif)", value: pos3 });
  if (SYNTHESES[type]) editableFields.push({ key: "ba_synthese", label: "Phrase de synthèse", value: ba_synthese, multiline: true });
  editableFields.push({ key: "story_q", label: "Question du bas", value: story_q, multiline: true });
  editableFields.push({ key: "story_d", label: "Le comportement du visiteur (sous la question)", value: story_d, multiline: true });
  editableFields.push({ key: "optim_body", label: "Ce que j'ai préparé (paragraphe)", value: optim_body, multiline: true });
  editableFields.push({ key: "prepared_line", label: "Phrase avant le QR (« c'est prêt »)", value: prepared_line, multiline: true });
  editableFields.push({ key: "search_volume", label: "Recherches Google / mois (chiffre réel — vide = masqué)", value: searchVolume ? String(searchVolume) : "" });

  const diag_eyebrow = ["Diagnostic personnalisé", ville, `${mois} ${annee}`].filter(Boolean).join(" · ");

  const vars: Record<string, string> = {
    mois, annee, nom_commerce: nom, adresse, ville, telephone, prix,
    diag_eyebrow,
    hook_block, hook_id, story_step, story_result, constate_tag, prepared_block, prep_tag, preview_cta,
    requete_metier: requete,
    google_results,
    reputation_line,
    concurrents_phrase,
    serp_rows,
    sans_titre1, sans_texte1, sans_conseq,
    ba_points_neg, ba_points_pos,
    url_site: urlDomain,
    copyright_line: year ? `© ${year} — Tous droits réservés` : "",
    new_sub: `${activite}${villeAff ? ` · ${villeAff}` : ""}`,
    sous_titre,
    vetuste_annee: year ? `est resté en ${year}.` : "est resté à une autre époque.",
    compteur_line: "Visiteurs : 004821",
    site_shot,
    demain_hero,
    ba_synthese,
    stars_html:
      rating != null
        ? `${"★".repeat(Math.max(1, Math.min(5, Math.round(rating))))}<span class="off">${"★".repeat(5 - Math.max(1, Math.min(5, Math.round(rating))))}</span><b> ${note}</b>`
        : `<span class="off">★★★★★</span><b> Nouveau</b>`,
    qr_maquette,
    photo_marius,
  };

  const recto = injectVars(readTpl(`recto/${type}.html`), vars);
  const verso = injectVars(readTpl("verso.html"), vars);
  return { recto, verso, type, editableFields };
}
