// Composition d'UNE lettre (recto + verso) à partir d'une ligne prospect.
// Extrait de la page /lettre/[slug] pour être réutilisé tel quel par
// l'impression en lot (toutes les lettres d'une ville en un seul PDF) — même
// rendu, zéro divergence. La page unique garde en plus le panneau d'édition
// (editableFields), l'impression en lot l'ignore.
import { readFileSync } from "fs";
import { join } from "path";
import QRCode from "qrcode";
import { isDirectoryUrl, directoryPlatformName } from "@/lib/site-internet/directories";
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
  else out = tokens.slice(0, 2).join(" "); // 3 mots : ordre incertain → tel quel
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
  const isSansSite = type === "SANS_SITE";
  // M3 « cabinet » (santé, B + C) → recto sobre « Très peu d'infos » + questions.
  const useCRecto = isSansSite && moteur === "M3_cabinet";
  // M4 « confiance » (droit/chiffre, patrimoine) → recto expertise, aucun avis.
  const useM4 = isSansSite && moteur === "M4_confiance";
  // M2 « temps » (artisans établis) → recto « votre téléphone travaille plus que vous ».
  const useM2 = isSansSite && moteur === "M2_temps";
  const secteur: Secteur = mp.entry?.secteur ?? "flux";
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
  const csv3ConcRow = (c: { name: string }) =>
    `<div class="res"><div><div class="n">${esc(cleanCompName(c.name))}</div><div class="m">${esc(metierLabel)} · ${esc(villeAff)}</div></div><div class="tagweb">Site web</div></div>`;
  const csv3_concurrents = conc.slice(0, 2).map(csv3ConcRow).join("");
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
  // M1 « acquisition » : la jauge d'avis n'est crédible que s'il y a un volume,
  // des avis existants et au moins un concurrent chiffré. Sinon → recto générique.
  const useM1 =
    isSansSite && moteur === "M1_acquisition" && Boolean(searchVolume) &&
    reviews != null && reviews >= 1 && conc.some((c) => c.avis != null);
  const m1Goal = 50;
  const m1Reviews = reviews ?? 0;
  const m1FillPct = Math.max(6, Math.min(100, Math.round((m1Reviews / m1Goal) * 100)));
  const m1_gauge =
    `<div class="m1-gtop"><div class="l">Avis Google</div><div class="n">${m1Reviews}${note ? ` <span>· ★ ${note}</span>` : ""}</div></div>` +
    `<div class="m1-bar"><div class="m1-fill" style="width:${m1FillPct}%"></div></div>` +
    `<div class="m1-legend"><span>${m1Reviews} avis</span><span>Objectif conseillé : <b>${m1Goal} avis</b></span></div>`;
  const m1_concurrents = conc
    .filter((c) => c.avis != null)
    .slice()
    .sort((a, b) => (b.avis ?? 0) - (a.avis ?? 0))
    .slice(0, 3)
    .map((c) => `<div class="m1-crow"><span class="nm">${esc(cleanCompName(c.name))}</span><span class="right"><span class="av">${c.avis} <i>avis</i></span><span class="tagweb">Site web</span></span></div>`)
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

  // ── Recto M2 — TEMPS (artisans, déonto none) : « votre téléphone travaille ──
  //    plus que vous ». Le site filtre les appels ; l'artisan ne rappelle que
  //    les vraies demandes. Confirmation = devis/rappel (jamais « Réservé »).
  const urgent = Boolean(mp.entry?.urgencesOps);
  const m2_hook = ov("m2_hook", `Votre téléphone travaille<br>plus que vous.`);
  const m2_hook_sub = ov(
    "m2_hook_sub",
    `Chaque appel vous interrompt en plein chantier — souvent pour la même question.`
  );
  // Les questions qui coupent une intervention (concrètes, vécues). Vraies.
  const m2Qlist = [
    "« Vous intervenez sur quelle zone ? »",
    "« C'est quoi vos tarifs ? »",
    "« Vous faites des devis gratuits ? »",
    "« Vous pouvez venir quand ? »",
    "« Vous êtes disponible en urgence ? »",
    "« Vous vous déplacez le week-end ? »",
  ];
  const m2_questions = m2Qlist.map((q) => `<span>${esc(q)}</span>`).join("");
  const m2_pivot = ov(
    "m2_pivot",
    `<b>Votre site répond à tout ça pendant que vous travaillez.</b><br>Vous ne rappelez que les <span class="u">vraies</span> demandes.`
  );
  const m2_today = ov("m2_today", `Un numéro.<br>Et le téléphone qui sonne<br>en plein chantier.`);
  const m2_prep = ov(
    "m2_prep",
    `<b>J'ai préparé la première version de votre site.</b> Il répond aux questions, oriente les devis, et ${urgent ? "trie l'urgence" : "filtre les demandes"} — pour ne vous laisser que les appels qui en valent la peine.`
  );
  // Carte DEMAIN M2 : mini-site + 3 fonctions « assistant » (pas d'avis : l'angle
  // est le temps, pas la réputation). Tri urgence si urgencesOps.
  const m2Fn3 = urgent
    ? `<div><span class="ck">—</span><span><b>Trie l'urgence</b> et vous alerte tout de suite</span></div>`
    : `<div><span class="ck">—</span><span><b>Filtre</b> les demandes, ne garde que les vraies</span></div>`;
  const demain_m2 =
    `<div class="dm-wrap"><div class="dm-mini"><div class="dm-screen">` +
    `<div class="dm-hero"><div class="dm-role">${esc(metierLabel)} · ${esc(villeAff)}</div><div class="dm-name">${esc(destName)}</div></div>` +
    `<div class="dm-btns"><span class="b1"></span><span class="b2"></span></div>` +
    `<div class="dm-row"><div class="dm-l"></div><div class="dm-l s"></div></div>` +
    `<div class="dm-gal"><i></i><i></i><i></i></div>` +
    `</div></div>` +
    `<div class="dm-bubble">${ai_bubble}<div class="dm-ok">${check} ${esc(ai_booked)}</div></div></div>` +
    `<div class="m1-fx"><div><span class="ck">—</span><span><b>Répond</b> zone, tarifs, délais — 24 h/24</span></div>` +
    `<div><span class="ck">—</span><span><b>Prépare</b> les demandes de devis</span></div>` +
    m2Fn3 + `</div>`;

  // ── Recto M4 — CONFIANCE (droit/chiffre, déonto droit) : « votre premier ────
  //    rendez-vous commence avant que le client pousse la porte ». Le site est
  //    une PREUVE d'expertise, pas une pub. Jamais d'avis, de volume, de promesse.
  const m4_hook = ov("m4_hook", `Votre premier rendez-vous<br>commence bien avant.`);
  const m4_hook_sub = ov(
    "m4_hook_sub",
    `Avant de pousser votre porte, un ${esc(termeSing)} cherche à savoir qui vous êtes — et ne trouve presque rien.`
  );
  // Ce que le site mettra en avant (contenu, pas affirmation invérifiable).
  const m4Plist = [
    "Votre parcours et vos années d'exercice",
    "Vos domaines d'intervention",
    "Votre méthode, expliquée simplement",
    "Le cadre et le déroulé d'un premier rendez-vous",
  ];
  const m4_points = m4Plist.map((p) => `<div class="m4-pt"><span class="ck">—</span><span>${esc(p)}</span></div>`).join("");
  const m4_pivot = ov(
    "m4_pivot",
    `On ne choisit pas ${metierArticle === "une" ? "une" : "un"} ${esc(metierLabel)} au hasard.<br><b>On choisit celui en qui on a <span class="u">confiance</span></b> — et la confiance se prépare en ligne.`
  );
  const m4_today = ov("m4_today", `Une adresse.<br>Un numéro.<br>Et rien sur qui vous êtes.`);
  const m4_prep = ov(
    "m4_prep",
    `<b>J'ai préparé la première version de votre site.</b> Il présente votre parcours, vos domaines et votre méthode — pour qu'un ${esc(termeSing)} vous accorde sa confiance avant même le premier rendez-vous.`
  );
  // Carte DEMAIN M4 : mini-site + 3 fonctions « prestige ». Aucun avis.
  const demain_m4 =
    `<div class="dm-wrap"><div class="dm-mini"><div class="dm-screen">` +
    `<div class="dm-hero"><div class="dm-role">${esc(metierLabel)} · ${esc(villeAff)}</div><div class="dm-name">${esc(destName)}</div></div>` +
    `<div class="dm-btns"><span class="b1"></span><span class="b2"></span></div>` +
    `<div class="dm-row"><div class="dm-l"></div><div class="dm-l s"></div></div>` +
    `<div class="dm-gal"><i></i><i></i><i></i></div>` +
    `</div></div>` +
    `<div class="dm-bubble">${ai_bubble}<div class="dm-ok">${check} ${esc(ai_booked)}</div></div></div>` +
    `<div class="m1-fx"><div><span class="ck">—</span><span><b>Présente</b> votre parcours et vos domaines</span></div>` +
    `<div><span class="ck">—</span><span><b>Explique</b> le déroulé d'un rendez-vous</span></div>` +
    `<div><span class="ck">—</span><span><b>Prend</b> les premiers rendez-vous</span></div></div>`;

  if (type === "SANS_SITE") {
    editableFields.push({ key: "display_name", label: "Nom d'usage (en-tête)", value: destName });
    editableFields.push({ key: "display_metier", label: `Métier affiché (profil ${mp.profil})`, value: metierLabel });
    editableFields.push({ key: "metier_article", label: "Article (un / une)", value: metierArticle });
    if (!useM4) editableFields.push({ key: "secteur_constat", label: "Ligne de constat (secteur)", value: secteur_constat, multiline: true });
    if (useM1) {
      // Recto M1 (commerce, jauge d'avis) : champs propres à l'angle acquisition.
      editableFields.push({ key: "m1_hook_sub", label: "Hook — sous-titre (recherches/mois)", value: m1_hook_sub, multiline: true });
      editableFields.push({ key: "m1_comp_intro", label: "Intro concurrents (jauge)", value: m1_comp_intro, multiline: true });
      editableFields.push({ key: "m1_synth", label: "Synthèse sous les concurrents", value: m1_synth, multiline: true });
      editableFields.push({ key: "m1_verdict", label: "Verdict (réputation visible)", value: m1_verdict, multiline: true });
      editableFields.push({ key: "m1_prep", label: "Proposition (j'ai préparé…)", value: m1_prep, multiline: true });
    } else if (useCRecto) {
      // Recto santé (B/C) : champs propres au hook factuel + pivot « secrétaire ».
      editableFields.push({ key: "cs_hook_sub", label: "Hook — sous-titre", value: cs_hook_sub, multiline: true });
      editableFields.push({ key: "cs_who", label: "Ligne « diagnostic préparé pour »", value: cs_who, multiline: true });
      editableFields.push({ key: "cs_pivot", label: "La bascule (secrétaire / 21 h)", value: cs_pivot, multiline: true });
      editableFields.push({ key: "cs_prep", label: "Proposition (j'ai préparé…)", value: cs_prep, multiline: true });
    } else if (useM2) {
      // Recto M2 (artisans, temps) : hook « téléphone » + bascule « vraies demandes ».
      editableFields.push({ key: "m2_hook", label: "Hook (accroche)", value: m2_hook, multiline: true });
      editableFields.push({ key: "m2_hook_sub", label: "Hook — sous-titre", value: m2_hook_sub, multiline: true });
      editableFields.push({ key: "m2_pivot", label: "La bascule (vraies demandes)", value: m2_pivot, multiline: true });
      editableFields.push({ key: "m2_prep", label: "Proposition (j'ai préparé…)", value: m2_prep, multiline: true });
    } else if (useM4) {
      // Recto M4 (droit, confiance) : hook « avant la porte » + registre sobre.
      editableFields.push({ key: "m4_hook", label: "Hook (accroche)", value: m4_hook, multiline: true });
      editableFields.push({ key: "m4_hook_sub", label: "Hook — sous-titre", value: m4_hook_sub, multiline: true });
      editableFields.push({ key: "m4_pivot", label: "La bascule (confiance)", value: m4_pivot, multiline: true });
      editableFields.push({ key: "m4_prep", label: "Proposition (j'ai préparé…)", value: m4_prep, multiline: true });
    } else {
      editableFields.push({ key: "ss_p3", label: "Phrase d'accroche des bénéfices", value: ss_p3, multiline: true });
      editableFields.push({ key: "ss_b1", label: "Bénéfice 1", value: ss_b1 });
      editableFields.push({ key: "ss_b2", label: "Bénéfice 2", value: ss_b2 });
      editableFields.push({ key: "ss_b3", label: "Bénéfice 3", value: ss_b3 });
      editableFields.push({ key: "ss_transition", label: "Constat sous le face-à-face", value: ss_transition, multiline: true });
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
    // Recto M2 (artisans : temps)
    m2_hook, m2_hook_sub, m2_questions, m2_pivot, m2_today, demain_m2, m2_prep,
    // Recto M4 (droit : confiance)
    m4_hook, m4_hook_sub, m4_points, m4_pivot, m4_today, demain_m4, m4_prep,
    // Ligne de constat sectorielle (§5 bis)
    secteur_constat,
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

  // Santé (profils B et C) sans site → recto sobre « Très peu d'infos » (pas de
  // volume : un praticien de santé est souvent déjà plein). Seul le profil A
  // (commerce) garde le recto volume + avis.
  const rectoFile = useM1
    ? "recto/SANS_SITE_M1.html"
    : useM2
      ? "recto/SANS_SITE_M2.html"
      : useM4
        ? "recto/SANS_SITE_M4.html"
        : useCRecto
          ? "recto/SANS_SITE_C.html"
          : `recto/${type}.html`;
  const recto = injectVars(readTpl(rectoFile), vars);
  const verso = injectVars(readTpl("verso.html"), vars);
  return { recto, verso, type, editableFields };
}
