// Composition d'UNE lettre (recto + verso) à partir d'une ligne prospect.
// Extrait de la page /lettre/[slug] pour être réutilisé tel quel par
// l'impression en lot (toutes les lettres d'une ville en un seul PDF) — même
// rendu, zéro divergence. La page unique garde en plus le panneau d'édition
// (editableFields), l'impression en lot l'ignore.
import { readFileSync } from "fs";
import { join } from "path";
import QRCode from "qrcode";
import { isDirectoryUrl, directoryPlatformName, bookingPlatformName } from "@/lib/site-internet/directories";
import { resolveMetier, confirmationBooked } from "@/lib/site-internet/metier-profiles";
import type { Secteur } from "@/lib/site-internet/metier-profiles";

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

// Nom d'usage professionnel pour l'en-tête : « Rodriguez Marc Daniel Gérard
// Antoine » → « Marc Rodriguez ». On ne devine pas l'ordre à 3 mots pile (trop
// risqué) ; à 4 mots et plus, l'état civil FR est presque toujours « NOM Prénom
// Prénom… » → on rend « Prénom NOM ». Les raisons sociales (Cabinet, Centre…)
// ne sont jamais inversées. Toujours corrigeable à la main (champ éditable).
const BIZ_WORDS = /(cabinet|centre|espace|maison|institut|studio|sarl|eurl|sasu|sas|eirl|\bei\b|scp|scm|clinique|p[oô]le|groupe|association|asso|sophro|kin[eé]|ost[eé]o|psycho|naturo|coach|therap)/i;
// Nettoie une ponctuation orpheline en début/fin (« Cabinet d'Ostéopathie - » →
// « Cabinet d'Ostéopathie ») : sur une lettre personnalisée, un tiret esseulé
// hurle « template automatique ».
const trimName = (s: string) => s.replace(/^[\s\-–—,;:·|/]+|[\s\-–—,;:·|/]+$/gu, "").trim();
export function usageName(full: string): string {
  // Apify colle souvent la catégorie/ville au nom (« Cabinet d'Ostéopathie -
  // ostéopathe à Bayonne », « Marie Dupont, Psychologue, Bayonne ») → on coupe
  // au premier séparateur «  -  » / «  , » pour ne garder que le vrai nom.
  const cut = str(full).split(/\s[-–—]\s|,\s/)[0];
  const clean = cut.replace(/\s+/g, " ").trim();
  const tokens = clean.split(" ").filter(Boolean);
  // Titre honorifique (avocat, notaire, médecin) : « Maître Claire Etcheverry »
  // → « Maître Etcheverry » (titre + nom), jamais « Maître Claire » (trop familier).
  const HONORIFIC = /^(ma[iî]tre|me|dr|docteur|pr|professeur)\.?$/i;
  let out: string;
  if (tokens.length >= 3 && HONORIFIC.test(tokens[0])) out = `${tokens[0]} ${tokens[tokens.length - 1]}`;
  else if (tokens.length <= 2) out = clean;
  else if (BIZ_WORDS.test(clean)) {
    // Raison sociale : on garde jusqu'à 3 mots, mais on ne coupe pas juste avant
    // une ponctuation (sinon tiret orphelin) → on l'inclut ou on s'arrête avant.
    out = trimName(tokens.slice(0, 3).join(" "));
    if (!out) out = trimName(tokens.slice(0, 2).join(" "));
  } else if (tokens.length >= 4) out = `${tokens[1]} ${tokens[0]}`; // NOM P1 P2 P3 → P1 NOM
  else {
    // 3 mots : « L'Atelier de Sophie » (enseigne avec liaison / apostrophe) → on
    // garde tout ; « Jean Martin Dupont » (état civil) → on garde les 2 premiers.
    const enseigne = /\b(de|du|des|le|la|les|aux?|au|chez|et|by)\b|['&]/i.test(clean);
    out = enseigne ? clean : tokens.slice(0, 2).join(" ");
  }
  return trimName(out) || clean;
}

// SECTEUR → une seule ligne de constat (§5 bis MOTEURS_ET_DEONTOLOGIE). Elle
// énonce un COMPORTEMENT général du client final (autorisé), jamais un procès
// d'intention sur ce que pensent SES clients. Le secteur ne change QUE cette
// ligne et le vocabulaire, jamais la structure. {metier} = libellé au singulier.
function secteurConstat(secteur: Secteur, metier: string): string {
  switch (secteur) {
    case "urgence":
      return `Quand on cherche un ${metier}, on retient celui qu'on peut joindre tout de suite — et celui qui rassure.`;
    case "soin":
      return `Choisir un ${metier}, c'est intime. On veut comprendre votre approche avant d'oser appeler — souvent tard le soir.`;
    case "emotion":
      return `Pour un choix aussi personnel, on ne compare pas des prix : on cherche un style, un univers. Le vôtre se découvre en ligne.`;
    case "flux":
    default:
      return `On choisit avec les yeux : vos photos, vos horaires, vos avis — en moins de trois secondes, sur mobile.`;
  }
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
    .map((c) => {
      if (typeof c === "string") return { name: c, note: "", avis: null as number | null };
      const o = c as Record<string, unknown>;
      const avisNum = typeof o.avis === "number" ? o.avis : typeof o.reviews === "number" ? o.reviews : null;
      return { name: str(o.name), note: str(o.note), avis: avisNum };
    })
    .filter((c) => c.name);

  const rawSource = str(place.source_website);
  const website = isDirectoryUrl(rawSource) ? "" : rawSource;
  const directoryUrl = str(diag.directory_url) || (isDirectoryUrl(rawSource) ? rawSource : "");
  const platform = directoryPlatformName(directoryUrl);
  // Signaux pour le gabarit (photo-gating / résa-gating) : on n'affirme « aucune
  // photo » / « aucune réservation » QUE si c'est vrai sur la fiche Google.
  const gPhotoCount = (Array.isArray(diag.photos) ? diag.photos : []).filter((p) => /^https?:\/\//i.test(str(p))).length;
  const hasGooglePhotos = gPhotoCount > 0;
  const hasOnlineBooking = Boolean(bookingPlatformName(directoryUrl)) || Boolean(website);

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
  // SANS_SITE a sa propre grammaire (refonte) → champs dédiés plus bas.
  if (type !== "SANS_SITE") {
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
  }
  editableFields.push({ key: "search_volume", label: "Recherches Google / mois (chiffre réel — vide = masqué)", value: searchVolume ? String(searchVolume) : "" });

  const diag_eyebrow = ["Diagnostic personnalisé", ville, `${mois} ${annee}`].filter(Boolean).join(" · ");

  // ── Recto SANS_SITE (refonte UX : Choc → Preuve → Face-à-face → Action) ─────
  // Le PROFIL du métier (config métier-profiles) pilote le vocabulaire, les
  // contacts, le volet avis et les 3 bénéfices — sans réécrire la lettre. Métier
  // hors liste → profil A (générique). C = santé encadrée : « patients », aucun
  // avis, pas de WhatsApp, ton sobre.
  const mp = resolveMetier(activite);
  const def = mp.def;
  // MOTEUR = l'angle de la lettre (hypothèse ; le configurateur corrige après le
  // scan). Il pilote QUEL recto sans site on utilise. La déontologie (portée par
  // le profil / def) reste ce qui limite ce qu'on a le droit d'écrire.
  const moteur = mp.entry?.moteur ?? "M1_acquisition";
  const secteur: Secteur = mp.entry?.secteur ?? "flux";
  // Déontologie : pilote ce que la lettre a le DROIT de dire (avis, WhatsApp,
  // ton). Le moteur, lui, n'ajuste que l'angle de l'accroche. Un seul gabarit.
  const deonto = mp.entry?.deontologie ?? "none";
  const termePublic = mp.entry?.terme || def.terme_public; // clients / patients (override métier possible)
  const termeSing = termePublic.replace(/s$/u, ""); // client / patient
  // Libellé métier + article corrigeables par prospect (genre : « une
  // psychologue » ; précision : « coach de vie »). Défauts = config.
  const metierLabel = ov("display_metier", mp.entry?.label || metierSing);
  const metierArticle = ov("metier_article", mp.entry?.article || "un");
  // Nom d'usage pour l'en-tête et le pied (jamais l'état civil complet).
  const destName = ov("display_name", usageName(nom));
  // Ligne de constat sectorielle (une seule ligne, corrigeable) — §5 bis.
  const secteur_constat = ov("secteur_constat", secteurConstat(secteur, metierLabel));
  // 1) LE CHOC — le chiffre en héros, la phrase (au vocabulaire du profil), le
  //    destinataire. Profil C : sous-ligne sobre recentrée sur la findabilité.
  const heroCap = `${def.heroSujet} ${def.heroVerbe} ${metierArticle} <b>${esc(metierLabel)}</b> à <b>${esc(villeAff)}</b> chaque mois.`;
  const heroSubHtml = def.heroSub ? `<div class="ss-herosub">${esc(def.heroSub)}</div>` : "";
  const ss_hero = searchVolume
    ? `<div class="ss-num">≈ ${searchVolume}</div>` +
      `<div class="ss-cap">${heroCap}</div>` +
      heroSubHtml +
      `<div class="ss-dest">Diagnostic personnalisé pour <b>${esc(destName)}</b>.</div>`
    : `<div class="ss-cap big">Vos futurs ${esc(termePublic)} cherchent ${metierArticle} <b>${esc(metierLabel)}</b> à <b>${esc(villeAff)}</b> sur Google.</div>` +
      heroSubHtml +
      `<div class="ss-dest">Diagnostic personnalisé pour <b>${esc(destName)}</b>.</div>`;
  // 2) LA PREUVE — 3 concurrents « qui ont un site », propres, aérés.
  // Nom propre du concurrent : Apify colle souvent le métier/la ville au nom
  // (« Fanny Moleres - Psychologue à … », « X (Volckaert), Psychologue, EMDR »).
  // On coupe au 1er séparateur pour ne garder que le nom.
  const cleanCompName = (raw: string) => {
    const s = str(raw).trim();
    let cut = s.split(/\s[-–—]\s| \(|,\s/)[0].trim();
    if (cut.length < 2) cut = s;
    cut = trimName(cut);
    // Nom trop long → tronque proprement au mot, pour ne pas déborder sur 2 lignes.
    if (cut.length > 30) {
      const words = cut.slice(0, 30).split(" ");
      words.pop();
      cut = trimName(words.join(" ")) + "…";
    }
    return cut;
  };
  const concRow = (c: { name: string; note: string; avis: number | null }) => {
    const noteNum = str(c.note).replace(/★/g, "").trim();
    const bits = [noteNum ? `★ ${noteNum}` : "", c.avis != null ? `${c.avis} avis` : ""].filter(Boolean).join("&nbsp;·&nbsp;");
    return `<div class="cc-row"><div class="cc-name">${esc(cleanCompName(c.name))}</div><div class="cc-meta">${bits}</div><div class="cc-site">Site web</div></div>`;
  };
  // Volontairement : le prospect N'apparaît PAS dans cette liste simulée (sans
  // site, Google ne l'affiche pas ici). Son absence est mise en scène dans la
  // carte « Aujourd'hui » du face-à-face ci-dessous.
  const concurrents_list = conc.slice(0, 3).map(concRow).join("");
  // 3) LE FACE-À-FACE — deux cartes Avant/Après. Carte DEMAIN = mini-aperçu de
  //    l'ACCUEIL INTELLIGENT (bulle + « Réservé ✓ » + ligne aspirationnelle),
  //    réglé par profil (A chaleureux 24 h/24 ; C sobre « en séance »). Plus de
  //    volet avis/contacts ici : la réputation vit dans la maquette (profil A).
  const eyeOff = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#A6A69C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7c2.1 0 3.9.8 5.4 1.9"/><path d="M22 12s-3.6 7-10 7c-2.1 0-3.9-.8-5.4-1.9"/><circle cx="12" cy="12" r="3"/><line x1="3" y1="3" x2="21" y2="21"/></svg>`;
  const check = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FBFAF7" stroke-width="2.6"><polyline points="5,12.5 10,17 19,7"/></svg>`;
  const ai_bubble = ov("ai_bubble", def.accueilBubble);
  const ai_line = ov("ai_line", def.accueilLine);
  const ai_slot = ov("ai_slot", def.accueilSlot);
  // Pastille de confirmation selon le métier (réserve / rappel / devis / acompte).
  const ai_booked = confirmationBooked(mp.entry?.confirmation ?? "reserve", ai_slot);
  // ── Carte DEMAIN v2 : un MINI-SITE (hero + boutons + galerie), avec l'accueil
  //    (bulle + « Réservé ») qui vit dedans. Rend DEMAIN nettement plus fort que
  //    AUJOURD'HUI (rien → une vraie vitrine). Étoiles schématiques SEULEMENT si
  //    le profil affiche les avis (jamais en C, déontologie).
  const busyWordL = mp.profil === "A" ? "occupé" : "en séance"; // commerce vs soin
  const dmStars = def.avis_affichage && note ? `<div class="dm-stars">★★★★★ ${note}</div>` : "";
  const demain_card =
    `<div class="dm-wrap"><div class="dm-mini"><div class="dm-screen">` +
    `<div class="dm-hero"><div class="dm-role">${esc(metierLabel)} · ${esc(villeAff)}</div><div class="dm-name">${esc(destName)}</div></div>` +
    `<div class="dm-btns"><span class="b1"></span><span class="b2"></span></div>` +
    dmStars +
    `<div class="dm-row"><div class="dm-l"></div><div class="dm-l s"></div></div>` +
    `<div class="dm-gal"><i></i><i></i><i></i></div>` +
    `</div></div>` +
    `<div class="dm-bubble">${ai_bubble}<div class="dm-ok">${check} ${esc(ai_booked)}</div></div></div>` +
    `<div class="dm-tail">Une vraie vitrine — <b>et un accueil qui répond et réserve.</b><br><i>Même ${busyWordL}. Même à 23 h.</i></div>`;
  void ai_line;
  const faceoff =
    `<div class="faceoff2">` +
    `<div class="fo-card fo-today"><div class="fo-lbl">Aujourd'hui</div><div class="fo-eye">${eyeOff}</div><div class="fo-cn">${esc(destName)}</div><div class="fo-invis">Invisible sur cette recherche</div><div class="fo-invsub">Absent des premiers résultats</div></div>` +
    `<div class="fo-arrow"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A6A69C" stroke-width="1.8"><line x1="4" y1="12" x2="19" y2="12"/><polyline points="13,6 20,12 13,18"/></svg></div>` +
    `<div class="fo-card fo-tomorrow ai-card"><div class="fo-lbl">Demain</div>${demain_card}</div>` +
    `</div>`;
  const ss_transition = ov(
    "ss_transition",
    `Aujourd'hui, quand un ${termeSing} tape cette recherche, il tombe sur vos concurrents — présents, avec un site et un moyen de les joindre. Votre cabinet, lui, n'apparaît pas dans ces résultats.`
  );
  // 4) L'ACTION — on pivote direct vers la solution. Accroche + 3 bénéfices (du
  //    profil), puis le QR. Vocabulaire clients/patients selon le profil.
  const introN = searchVolume ? `ces ${searchVolume} recherches` : "ces recherches";
  // Angle avis autorisé seulement si le profil le permet (pas en C). Quand une
  // vraie réputation existe (note ≥ 4,5), on la valorise sans rien inventer.
  const avisAllowed = def.avis_affichage;
  const goodRep = avisAllowed && reviews != null && reviews >= 1 && rating != null && rating >= 4.5 && Boolean(note);
  const ss_p3 = ov(
    "ss_p3",
    goodRep
      ? `Vous avez déjà d'excellents avis (${note}/5) — mais aucun site pour les mettre en valeur. J'ai préparé le vôtre, pour transformer ${introN} en ${termePublic} qui vous découvrent :`
      : `J'ai préparé la première version de votre site pour transformer ${introN} en ${termePublic} qui vous découvrent :`
  );
  // Les 3 bénéfices viennent du PROFIL (déontologie respectée). Corrigeables.
  const ss_b1 = ov("ss_b1", def.benefices[0]);
  const ss_b2 = ov("ss_b2", def.benefices[1]);
  const ss_b3 = ov("ss_b3", def.benefices[2]);
  const ss_action =
    `<div class="ss-action"><p class="ss-lead">${ss_p3}</p>` +
    `<div class="ss-bullets"><div>— ${ss_b1}</div><div>— ${ss_b2}</div><div>— ${ss_b3}</div></div></div>`;
  // Pied : nom d'usage (jamais l'état civil complet — effet « scrapé »/Big
  // Brother qui casse la chaleur du « j'ai préparé ça pour vous »).
  const ss_footer = `<div class="ss-footer">Diagnostic préparé pour ${esc(destName)}</div>`;
  const cta_full = `<div class="cta-full">Retournez la feuille : scannez le QR, essayez votre accueil en direct →</div>`;

  // ── Recto PROFIL C v3 (santé encadrée : psychologue, kiné, orthoptiste) ──────
  // Hook FACTUEL (« très peu d'infos » sur vous en ligne), preuve (mock Google
  // avec des consœurs qui ont un site), carte Aujourd'hui→Demain (l'accueil),
  // puis UNE seule bascule : « une secrétaire ne répond pas à 21 h — votre site,
  // si ». Pas de volume, pas d'avis. Le chiffre de recherches disparaît du recto.
  const cs_hook_sub = ov("cs_hook_sub", `C'est ce que vos futurs ${termePublic} trouvent sur vous en ligne.`);
  // Juste le nom : le métier + la ville sont déjà dans l'en-tête, la recherche
  // et sous chaque concurrent → « — métier à ville » ici serait redondant.
  const cs_who = ov("cs_who", `Diagnostic préparé pour <b>${esc(destName)}</b>.`);
  // Concurrents : source ÉDITABLE (un nom par ligne). L'opérateur peut supprimer
  // une ligne hors-sujet (ex. un salon de massage remonté à tort par Google). On
  // fournit jusqu'à 3 candidats ; les 2 premières lignes s'affichent sur la lettre.
  const cs_concurrents_src = ov(
    "cs_concurrents_src",
    conc.slice(0, 3).map((c) => cleanCompName(c.name)).join("\n")
  );
  const csv3ConcRow = (name: string) =>
    `<div class="res"><div><div class="n">${esc(name)}</div><div class="m">${esc(metierLabel)} · ${esc(villeAff)}</div></div><div class="tagweb">Site web</div></div>`;
  const csv3_concurrents = cs_concurrents_src
    .split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 2)
    .map(csv3ConcRow).join("");
  const cs_pivot = ov(
    "cs_pivot",
    `Une secrétaire ne répond pas à 21 h, ni le dimanche.<br><b>Votre site, <span class="u">si</span>.</b> Et il ne vous interrompt jamais<br>pour redonner vos tarifs.`
  );
  const cs_prep = ov(
    "cs_prep",
    `<b>J'ai préparé la première version de votre site.</b> Il présente votre approche, répond aux questions pratiques à toute heure, et prend les rendez-vous — sans jamais vous déranger.`
  );
  const cs_stamp = `Diagnostic préparé pour ${esc(destName)} · ${esc(villeAff)}`;
  // Liste des questions répétitives (moteur M3 « Cabinet ») — la meilleure
  // accroche pour ce moteur : concrète, vécue. Adaptée selon que le métier est
  // conventionné (carte Vitale / ordonnance) ou non (tarifs / première fois).
  const reimbursed = /kin[eé]|orthopt|orthophon|podolog|infirmi|sage[- ]?femme|dentiste|p[ée]dicure/i.test(activite);
  const csQlist = reimbursed
    ? ["« Où est-ce qu'on peut se garer ? »", "« Quels sont vos horaires ? »", "« Prenez-vous la carte Vitale ? »", "« Comment modifier mon rendez-vous ? »", "« Faut-il apporter une ordonnance ? »", "« Avez-vous de la place cette semaine ? »"]
    : ["« Où est-ce qu'on peut se garer ? »", "« Quels sont vos horaires ? »", "« Quels sont vos tarifs ? »", "« Comment modifier mon rendez-vous ? »", "« C'est comment, une première séance ? »", "« Avez-vous de la place cette semaine ? »"];
  const cs_questions = csQlist.map((q) => `<span>${esc(q)}</span>`).join("");

  // ── Recto M1 — ACQUISITION (commerce, déonto none) : la JAUGE d'avis ────────
  // Pour un commerce avec des avis existants + des concurrents mieux notés : on
  // montre la PROGRESSION (barre + objectif 50), on classe les concurrents par
  // nombre d'avis RÉELS (badge « Site web », fait vérifiable), on donne un cap.
  // JAMAIS de promesse chiffrée de résultat. Déclenché seulement si les données
  // rendent la jauge crédible (le prospect a des avis, des concurrents chiffrés).
  const m1Goal = 50;
  const m1Reviews = reviews ?? 0;
  const m1FillPct = Math.max(6, Math.min(100, Math.round((m1Reviews / m1Goal) * 100)));
  const m1_gauge =
    `<div class="m1-gtop"><div class="l">Avis Google</div><div class="n">${m1Reviews}${note ? ` <span>· ★ ${note}</span>` : ""}</div></div>` +
    `<div class="m1-bar"><div class="m1-fill" style="width:${m1FillPct}%"></div></div>` +
    `<div class="m1-legend"><span>${m1Reviews} avis</span><span>Objectif conseillé : <b>${m1Goal} avis</b></span></div>`;
  // Concurrents : source ÉDITABLE (un par ligne : « Nom | nb avis »). L'opérateur
  // peut supprimer une ligne hors-sujet. On fournit jusqu'à 4 candidats triés par
  // nombre d'avis ; les 3 premières lignes s'affichent → supprimer un intrus fait
  // remonter le suivant tout en gardant 3 lignes.
  const m1_concurrents_src = ov(
    "m1_concurrents_src",
    conc
      .filter((c) => c.avis != null)
      .slice()
      .sort((a, b) => (b.avis ?? 0) - (a.avis ?? 0))
      .slice(0, 4)
      .map((c) => `${cleanCompName(c.name)} | ${c.avis}`)
      .join("\n")
  );
  const m1_concurrents = m1_concurrents_src
    .split("\n").map((l) => l.trim()).filter(Boolean)
    .map((line) => {
      // On extrait le dernier nombre de la ligne comme nombre d'avis ; le reste
      // (débarrassé du séparateur final) est le nom — tolère les noms à tiret.
      const m = line.match(/^(.*?)[\s|—–-]*(\d[\d\s]*)\s*(?:avis)?$/i);
      const name = (m ? m[1] : line).trim();
      const avis = m ? m[2].replace(/\s/g, "") : "";
      return { name, avis };
    })
    .filter((r) => r.name)
    .slice(0, 3)
    .map((r) => {
      const av = r.avis ? `<span class="av">${esc(r.avis)} <i>avis</i></span>` : "";
      return `<div class="m1-crow"><span class="nm">${esc(r.name)}</span><span class="right">${av}<span class="tagweb">Site web</span></span></div>`;
    })
    .join("");
  // Ligne de synthèse CONDITIONNELLE : ne jamais dire « pas de site » à qui en a un.
  const m1_synth = ov("m1_synth", website
    ? `Toutes ont un site qui rassure et donne envie.<br><b>Le vôtre s'arrête à la vitrine.</b>`
    : `Toutes ont un site.<br><b>Vous n'apparaissez nulle part.</b>`);
  const m1_verdict = ov("m1_verdict", `Votre réputation existe.<br><b>Elle n'est pas encore assez visible.</b>`);
  const m1_hook_sub = ov("m1_hook_sub", `personnes recherchent <b>« ${esc(requete)} »</b><br>chaque mois sur Google.`);
  const m1_today = ov("m1_today", website ? "Un site vitrine.<br>Et c'est tout." : "Une fiche Google.<br>Et c'est tout.");
  const m1_hook_big = `≈ ${searchVolume}`;
  const m1_comp_intro = ov("m1_comp_intro", `Les plus visibles de votre secteur en ont bien plus :`);
  const m1_prep = ov(
    "m1_prep",
    `<b>J'ai déjà préparé une première version de votre nouveau site.</b> Il met vos avis en valeur, répond aux questions à toute heure, et prend les rendez-vous.`
  );
  // Carte DEMAIN M1 : mini-site + les 3 FONCTIONS (dont « demande l'avis » si permis).
  const m1SolicitFn = def.avis_sollicitation ? `<div><span class="ck">—</span><span><b>Demande l'avis</b> après chaque ${esc(termeSing)}</span></div>` : "";
  const demain_m1 =
    `<div class="dm-wrap"><div class="dm-mini"><div class="dm-screen">` +
    `<div class="dm-hero"><div class="dm-role">${esc(metierLabel)} · ${esc(villeAff)}</div><div class="dm-name">${esc(destName)}</div></div>` +
    `<div class="dm-btns"><span class="b1"></span><span class="b2"></span></div>` +
    (note ? `<div class="dm-stars">★★★★★ ${note}</div>` : "") +
    `<div class="dm-row"><div class="dm-l"></div><div class="dm-l s"></div></div>` +
    `<div class="dm-gal"><i></i><i></i><i></i></div>` +
    `</div></div>` +
    `<div class="dm-bubble">${ai_bubble}<div class="dm-ok">${check} ${esc(ai_booked)}</div></div></div>` +
    `<div class="m1-fx"><div><span class="ck">—</span><span><b>Répond</b> aux questions, 24 h/24</span></div>` +
    `<div><span class="ck">—</span><span><b>Réserve</b> les rendez-vous</span></div>` +
    m1SolicitFn + `</div>`;


  // ══ GABARIT UNIQUE (lettre profil A, décliné B/C/D) ═════════════════════════
  // Un seul design (recto/SANS_SITE.html) paramétré par DEUX axes indépendants :
  //  • déonto (A commerce / B santé praticité / C santé encadrée / D droit) →
  //    ce que la lettre a le DROIT de dire (avis, WhatsApp, ton).
  //  • moteur → ajuste UNIQUEMENT l'accroche.
  // Structure invariante : HERO → 2 raisons (jamais 3) → solution « employé
  // numérique » → QR. Barres d'avis PROPORTIONNELLES. Aucune affirmation
  // invérifiable. Bloc avis/relance (les 4 situations « commerce ») ABSENT en C/D.
  const avisAff = def.avis_affichage; // A + B
  const avisSol = def.avis_sollicitation; // A seul
  const goodReput = avisAff && Boolean(note) && reviews != null && reviews >= 30 && rating != null && rating >= 4.5;
  const concAvis = conc.filter((c) => c.avis != null).slice().sort((a, b) => (b.avis ?? 0) - (a.avis ?? 0));
  // Concurrents éditables (barres / SERP) : source « Nom | avis », 1 par ligne.
  // L'opérateur peut retirer une ligne hors-sujet ; le nombre d'avis est reparsé.
  const la_concurrents_src = ov(
    "la_concurrents_src",
    concAvis.slice(0, 3).map((c) => `${cleanCompName(c.name)} | ${c.avis}`).join("\n")
  );
  const concForProof = la_concurrents_src
    .split("\n").map((l) => l.trim()).filter(Boolean)
    .map((line) => {
      const m = line.match(/^(.*?)[\s|—–-]*(\d[\d\s]*)?\s*(?:avis)?$/i);
      const name = (m ? m[1] : line).trim();
      const avis = m && m[2] ? parseInt(m[2].replace(/\s/g, ""), 10) : null;
      return { name, avis };
    })
    .filter((r) => r.name);
  const concProofAvis = concForProof.filter((c) => c.avis != null) as Array<{ name: string; avis: number }>;

  const hero_big = searchVolume ? `≈ ${searchVolume}` : "Très peu.";
  const hero_l1 = searchVolume
    ? `personnes recherchent <b>« ${esc(metierLabel)} à ${esc(villeAff)} »</b> chaque mois.`
    : `C'est ce que vos futurs ${esc(termePublic)} trouvent sur vous en ligne.`;
  const hero_l2 = ov(
    "hero_l2",
    moteur === "M2_temps"
      ? `Aujourd'hui, tout passe par votre téléphone — et il sonne souvent pour des questions auxquelles un site répondrait seul.`
      : deonto === "none"
        ? goodReput
          ? `Bonne nouvelle : votre réputation est déjà l'une des meilleures de ${esc(villeAff)}. Mais aujourd'hui, presque personne ne la voit.`
          : `Aujourd'hui, ceux qui vous cherchent tombent d'abord sur des concurrents déjà bien présents en ligne.`
        : `Aujourd'hui, sans site, on vous trouve — mais on ne vous découvre pas.`
  );
  const diag_label = deonto === "none" ? (goodReput ? "Le diagnostic — deux choses à savoir" : "Le diagnostic — deux raisons à cela") : "Le diagnostic — deux constats";

  // ── Proof builders ──────────────────────────────────────────────────────────
  const repcardHtml = (big: string, n: number | null, cap: string, showStars: boolean) =>
    `<div class="repcard"><div class="rep-h">★ Avis Google</div><div class="rep-big">${esc(big)}</div>` +
    (showStars ? `<div class="rep-stars">★★★★★</div>` : "") +
    `<div class="rep-n">${n != null ? n : 0} avis</div>` +
    `<div class="rep-cap">${cap}</div></div>`;
  const barsHtml = (rows: Array<{ name: string; avis: number; me?: boolean }>, cap: string) => {
    const maxA = Math.max(1, ...rows.map((r) => r.avis));
    const body = rows
      .map((r) => {
        const pct = Math.max(r.me ? 2 : 4, Math.round((r.avis / maxA) * 100));
        const sub = r.me ? "" : `<small>concurrent</small>`;
        return `<div class="brow${r.me ? " me" : ""}"><span class="bn">${esc(r.name)}${sub}</span><span class="btrack"><span class="bf" style="width:${pct}%"></span></span><span class="bv">${r.avis}</span></div>`;
      })
      .join("");
    return `<div class="pf-h"><span class="g">★ Avis Google</span> — à ${esc(villeAff)}</div>${body}<div class="pf-cap">${cap}</div>`;
  };
  const ficheHtml = (miss: string[]) => {
    const cross = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#A6A69C" stroke-width="2"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>`;
    const rows = miss.map((m) => `<span>${cross} ${m}</span>`).join("");
    return `<div class="gname">${esc(destName)}</div><div class="gmeta">${esc(metierLabel)} · ${esc(villeAff)}</div>` +
      `<div class="gbtns"><span>Appeler</span><span>Itinéraire</span></div><div class="gmiss">${rows}</div>`;
  };
  const serpHtml = () => {
    const top = (concForProof.length ? concForProof : conc.map((c) => ({ name: c.name }))).slice(0, 3);
    const rows = top
      .map((c) => `<div class="srow"><span class="sn">${esc(c.name)}</span><span class="stag">Site web</span></div>`)
      .join("");
    return `${rows}<div class="srow me"><span class="sn">${esc(destName)}</span><span class="stag">Aucun site</span></div>`;
  };
  const reimbursedM = /kin[eé]|orthopt|orthophon|podolog|infirmi|sage[- ]?femme|dentiste|p[ée]dicure/i.test(activite);
  const qList = reimbursedM
    ? ["« Prenez-vous la carte Vitale ? »", "« Quels sont vos horaires ? »", "« Où est-ce qu'on peut se garer ? »", "« Faut-il une ordonnance ? »"]
    : ["« Quels sont vos horaires ? »", "« Quels sont vos tarifs ? »", "« Où est-ce qu'on peut se garer ? »", "« Avez-vous de la place ? »"];
  const questionsHtml = () =>
    `<div class="qt">Ce qu'on vous demande au téléphone</div>` + qList.map((q) => `<span class="q">${esc(q)}</span>`).join("");

  // ── Raison 1 ────────────────────────────────────────────────────────────────
  let r1_title: string, r1_text: string, r1_proof: string;
  if (avisAff) {
    if (goodReput) {
      r1_title = ov("r1_title", "Votre réputation est<br>un véritable atout.");
      r1_text = ov("r1_text", `${reviews} avis, une note de ${note} : peu de professionnels atteignent ce niveau. C'est déjà l'un de vos meilleurs arguments pour convaincre un nouveau ${esc(termeSing)}.`);
      r1_proof = repcardHtml(note as string, reviews, "Une base de confiance déjà solide.", true);
    } else if (concProofAvis.length >= 1) {
      const top = concProofAvis.slice(0, 2);
      r1_title = ov("r1_title", "Votre réputation n'est pas<br>encore assez visible.");
      r1_text = ov("r1_text", `Vos ${esc(termePublic)} vous recommandent déjà. Mais avec ${reviews ?? 0} avis, une personne qui ne vous connaît pas hésitera plus qu'en voyant un concurrent à ${top[0].avis}.`);
      r1_proof = barsHtml(
        [{ name: "Vous", avis: reviews ?? 0, me: true }, ...top.map((c) => ({ name: c.name, avis: c.avis }))],
        `<b>Vos concurrents directs</b> sont déjà bien plus visibles sur Google.`
      );
    } else {
      r1_title = ov("r1_title", "Votre réputation<br>ne se voit pas encore.");
      r1_text = ov("r1_text", `Avec ${reviews != null ? `${reviews} avis` : "peu d'avis"} et aucun site, une personne qui ne vous connaît pas a peu d'éléments pour vous choisir.`);
      r1_proof = repcardHtml(note || "Nouveau", reviews, "Chaque avis compte — encore faut-il qu'on les voie.", Boolean(note));
    }
  } else {
    r1_title = ov("r1_title", "On vous trouve,<br>mais on ne vous découvre pas.");
    r1_text = ov("r1_text", `Quand un ${esc(termeSing)} cherche ${metierArticle} ${esc(metierLabel)} à ${esc(villeAff)}, il tombe d'abord sur des confrères qui ont un site — et une image claire de leur cabinet.`);
    r1_proof = concForProof.length || conc.length ? `<div class="serp">${serpHtml()}</div>` : ficheHtml(["Aucun site à visiter", "Aucune présentation de votre cabinet"]);
  }

  // ── Raison 2 ────────────────────────────────────────────────────────────────
  let r2_title: string, r2_text: string, r2_proof: string;
  if (avisAff) {
    const miss: string[] = [];
    if (!hasGooglePhotos) miss.push("Aucune photo de vos réalisations");
    miss.push("Aucun site à visiter");
    if (!hasOnlineBooking) miss.push("Aucune réservation en ligne");
    r2_title = ov("r2_title", `Vos futurs ${esc(termePublic)} ne<br>découvrent presque rien de vous.`);
    r2_text = ov("r2_text", `Sur Google, on trouve une adresse et un numéro. Aucune présentation de qui vous êtes, ni de ce qui vous rend différent.`);
    r2_proof = ficheHtml(miss);
  } else {
    r2_title = ov("r2_title", `Sans site, tout repose<br>sur le téléphone.`);
    r2_text = ov("r2_text", `On vous appelle pour des questions simples — horaires, accès, prise en charge. Autant d'interruptions, et de ${esc(termePublic)} qui renoncent quand ça sonne occupé.`);
    r2_proof = `<div class="qmini">${questionsHtml()}</div>`;
  }

  // ── Solution : mini-site personnalisé + 4 situations (adaptées à la déonto) ──
  const rdvLabel = deonto === "none" ? "Réserver" : "Prendre RDV";
  const mStarsOrCap = avisAff && note
    ? `<div class="mstars"><span class="s">★★★★★</span> ${note}${reviews != null ? ` · ${reviews} avis` : ""}</div>`
    : `<div class="mcap">Prise de rendez-vous en ligne · infos pratiques</div>`;
  const mini_phone =
    `<div class="mini"><div class="msc">` +
    `<div class="mtop"><div class="z"><div class="mr">${esc(metierLabel)} · ${esc(villeAff)}</div><div class="mn">${esc(destName)}</div></div></div>` +
    mStarsOrCap +
    `<div class="mbtns"><span class="call">Appeler</span><span class="rdv">${rdvLabel}</span></div>` +
    `<div class="mgl"><i></i><i></i><i></i></div><div style="height:26px"></div>` +
    `<div class="mbub">${ai_bubble}<div class="ok">✓ ${esc(ai_booked)}</div></div>` +
    `</div></div>`;
  const capIco = {
    chat: `<path d="M4 5h16v11H8l-4 4z"/>`,
    cal: `<rect x="4" y="5" width="16" height="16" rx="2"/><line x1="4" y1="9" x2="20" y2="9"/><line x1="9" y1="3" x2="9" y2="6"/><line x1="15" y1="3" x2="15" y2="6"/>`,
    star: `<polygon points="12,3 14.5,9 21,9.5 16,13.5 17.5,20 12,16.5 6.5,20 8,13.5 3,9.5 9.5,9"/>`,
    heart: `<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>`,
    shield: `<path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>`,
  };
  const capHtml = (ico: string, sit: string, res: string) =>
    `<div class="cap"><span class="ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16160F" stroke-width="1.6">${ico}</svg></span><div class="tx"><div class="sit">${sit}</div><div class="res">${res}</div></div></div>`;
  let capsArr: string[];
  if (avisSol) {
    // A — commerce : le bloc « employé numérique » complet (avis + relance).
    capsArr = [
      capHtml(capIco.chat, "Un client hésite.", "Votre site le rassure immédiatement."),
      capHtml(capIco.cal, "Une place se libère demain.", "Votre site aide à la remplir."),
      capHtml(capIco.star, "Une prestation vient de se terminer.", "Votre prochain avis Google est déjà en préparation."),
      capHtml(capIco.heart, "Un ancien client vous a oublié.", "Votre site lui rappelle que vous existez."),
    ];
  } else if (avisAff) {
    // B — santé praticité : sobre, sans avis sollicités ni relance commerciale.
    capsArr = [
      capHtml(capIco.chat, "Un patient hésite à franchir le pas.", "Votre site le met en confiance."),
      capHtml(capIco.chat, "Une question, tard le soir.", "Votre site y répond, sans vous déranger."),
      capHtml(capIco.cal, "Avant le rendez-vous.", "Votre site transmet l'essentiel : accès, déroulé."),
      capHtml(capIco.cal, "Votre agenda tourne.", "Votre site prend les rendez-vous, même en séance."),
    ];
  } else {
    // C / D — santé encadrée & droit : registre confiance, aucun avis, aucune relance.
    capsArr = [
      capHtml(capIco.shield, `Un futur ${esc(termeSing)} vous découvre.`, "Votre site inspire d'emblée le sérieux."),
      capHtml(capIco.chat, "Une question pratique, hors horaires.", "Votre site y répond, avec sobriété."),
      capHtml(capIco.cal, "Avant la première rencontre.", "Votre site en explique le cadre."),
      capHtml(capIco.cal, "Un rendez-vous à prendre.", "Votre site s'en charge, à toute heure."),
    ];
  }
  const caps = capsArr.join("");
  const sol_k = "Votre nouveau site & assistant";
  const sol_h = ov(
    "sol_h",
    deonto === "none"
      ? `Pendant que vous travaillez,<br>votre site accueille vos ${esc(termePublic)}.`
      : `Votre site présente votre ${deonto === "droit" ? "cabinet" : "pratique"}<br>et répond à vos ${esc(termePublic)}, à toute heure.`
  );
  const cta_t = deonto === "none"
    ? "Découvrez ce que votre futur site ferait — dès cette semaine."
    : "Découvrez votre nouveau site — il est déjà prêt.";
  const cta_mid = "Il est déjà prêt. Comptez moins de deux minutes.";

  if (type === "SANS_SITE") {
    editableFields.push({ key: "display_name", label: "Nom d'usage (en-tête)", value: destName });
    editableFields.push({ key: "display_metier", label: `Métier affiché (profil ${mp.profil})`, value: metierLabel });
    editableFields.push({ key: "metier_article", label: "Article (un / une)", value: metierArticle });
    // Gabarit unique : champs communs A/B/C/D.
    editableFields.push({ key: "hero_l2", label: "Accroche — 2e ligne (sous le chiffre)", value: hero_l2, multiline: true });
    editableFields.push({ key: "r1_title", label: "Raison 1 — titre", value: r1_title, multiline: true });
    editableFields.push({ key: "r1_text", label: "Raison 1 — texte", value: r1_text, multiline: true });
    editableFields.push({ key: "r2_title", label: "Raison 2 — titre", value: r2_title, multiline: true });
    editableFields.push({ key: "r2_text", label: "Raison 2 — texte", value: r2_text, multiline: true });
    editableFields.push({ key: "sol_h", label: "Solution — titre", value: sol_h, multiline: true });
    if (avisAff) {
      editableFields.push({ key: "la_concurrents_src", label: "Concurrents (barres) — 1 par ligne « Nom | avis ». Supprimez une ligne hors-sujet.", value: la_concurrents_src, multiline: true });
    }
  }

  const vars: Record<string, string> = {
    mois, annee, nom_commerce: nom, adresse, ville, telephone, prix,
    diag_eyebrow,
    hook_block, hook_id, story_step, story_result, constate_tag, prepared_block, prep_tag, preview_cta,
    requete_metier: requete,
    google_results,
    reputation_line,
    // Recto SANS_SITE refondu
    ss_hero,
    concurrents_list,
    faceoff,
    ss_transition,
    ss_action,
    ss_footer,
    cta_full,
    // Recto PROFIL C v3 (santé encadrée)
    cs_hook_sub, cs_who, csv3_concurrents, cs_pivot, cs_prep, cs_stamp, cs_questions,
    ai_bubble, ai_booked, demain_card,
    // Recto M1 (acquisition commerce : jauge d'avis)
    m1_hook_big, m1_hook_sub, m1_gauge, m1_comp_intro, m1_concurrents, m1_synth,
    m1_verdict, m1_today, demain_m1, m1_prep,
    // Ligne de constat sectorielle (§5 bis)
    secteur_constat,
    // Gabarit unique (lettre profil A, décliné B/C/D)
    hero_big, hero_l1, hero_l2, diag_label,
    r1_title, r1_text, r1_proof, r2_title, r2_text, r2_proof,
    sol_k, sol_h, mini_phone, caps, cta_t, cta_mid,
    dest_name: destName,
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

  // UN SEUL gabarit pour SANS_SITE (recto/SANS_SITE.html), décliné A/B/C/D par la
  // déontologie et l'accroche par le moteur. Les autres diagnostics (site vétuste,
  // mobile cassé…) gardent leur recto dédié.
  const rectoFile = `recto/${type}.html`;
  const recto = injectVars(readTpl(rectoFile), vars);
  const verso = injectVars(readTpl("verso.html"), vars);
  return { recto, verso, type, editableFields };
}
