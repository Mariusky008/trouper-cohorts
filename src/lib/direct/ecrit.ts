/**
 * ✍️ ÉCRIRE, PARTAGER — lot M1 « l'écrit et les liens » (cahier des charges : `docs/univers/messages-ecrits.md`, validé
 * par le propriétaire le 14 novembre 2026 : « oui pour les trois »).
 *
 * Un message écrit est DIT PAR LA FIGURINE (sa bulle, sa tête, jamais une voix de synthèse) ; un lien devient un
 * aperçu préparé par le serveur (l'image recopiée chez nous : le site ne sait pas qui a reçu le lien).
 *
 * Ici, LES RÈGLES, sans serveur (le navigateur et `scripts/verifier-messages.mjs` les lisent aussi) : le texte (1 000
 * signes, rien d'invisible), le lien qu'il contient, les adresses que le serveur refuse d'aller lire (jamais le réseau
 * interne : localhost, les réseaux privés, les adresses IP nues), ce qu'une page dit d'elle-même (ses balises de
 * partage), les sites connus, ce que les figurines lisent d'un message, les phrases de l'écran.
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : aucun accès à la base ici, aucun import qui ne soit pas un type.
 */

export const ECRIT = {
  /** Les signes d'un message écrit, au plus. */
  max: 1000,
  /** Les messages écrits par personne et par jour (les vocaux gardent leurs 100). */
  parJour: 300,
  /** Ce que la bulle de la figurine en montre ; le fil montre tout. */
  bulle: 140,
  /** Le début du message dans la notification. */
  notif: 60,
  /** Effacer son message : dans les 24 heures. */
  effacer: 24 * 3_600_000,
} as const;

/** 🔗 Ce que le serveur s'autorise pour l'aperçu d'un lien. */
export const APERCU = {
  /** Le temps pour lire la page, ou l'image. */
  delai: 5_000,
  /** La page : 1 Mo au plus ; l'image : 4 Mo au plus. */
  page: 1024 * 1024,
  image: 4 * 1024 * 1024,
  /** Les redirections suivies, au plus. */
  redirections: 3,
  /** L'image recopiée : 600 pixels de large au plus. */
  largeur: 600,
  titreMax: 120,
  siteMax: 60,
  urlMax: 2000,
} as const;

// ─── le texte ──────────────────────────────────────────────────────────────────────────────────────
/** Les signes, comptés comme on les voit (un emoji compte pour un). */
export const signes = (t: string) => [...t].length;

/**
 * ✅ UN MESSAGE ÉCRIT, NETTOYÉ : sans caractères invisibles ni de contrôle (les retours à la ligne restent, deux d'affilée
 * au plus), sans espaces en trop ; `null` s'il est vide ou trop long. Les emojis passent tels quels.
 */
export function texteEcrit(x: unknown): string | null {
  if (typeof x !== "string") return null;
  const t = x
    .replace(/\r\n?/g, "\n")
    // (les caractères de contrôle, les marques de direction, les espaces sans largeur — pas le liant des emojis)
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F​‎‏‪-‮⁦-⁩﻿]/g, "")
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!t || signes(t) > ECRIT.max) return null;
  return t;
}

/** ⏱️ Le temps que la figurine met à le dire (les mots apparaissent l'un après l'autre) : de 2 à 12 secondes. */
export const dureeDeLecture = (t: string) => Math.round(Math.min(12, Math.max(2, 1.2 + signes(t.slice(0, ECRIT.bulle)) * 0.055)) * 10) / 10;

/** Ce que la bulle montre : les 140 premiers signes (coupés à un mot, avec « … »). */
export function texteDeBulle(t: string): string {
  const l = [...t.replace(/\s+/g, " ").trim()];
  if (l.length <= ECRIT.bulle) return l.join("");
  const coupe = l.slice(0, ECRIT.bulle - 1).join("");
  const k = coupe.lastIndexOf(" ");
  return `${(k > ECRIT.bulle * 0.6 ? coupe.slice(0, k) : coupe).trimEnd()}…`;
}

// ─── le lien ───────────────────────────────────────────────────────────────────────────────────────
const LIEN = /https?:\/\/[^\s<>"'«»]+/i;
/**
 * 🔗 LE PREMIER LIEN D'UN MESSAGE (`http://` ou `https://`), sans la ponctuation qui le suit (« … ici. », « (ici) »).
 * `null` : pas de lien, ou une adresse qui ne tient pas debout.
 */
export function lienDuTexte(t: string): { url: string; site: string } | null {
  const m = LIEN.exec(t);
  return m ? lienBrut(sansPonctuation(m[0])) : null;
}
/** (la ponctuation de la phrase, pas du lien ; une parenthèse fermante seulement si elle n'en ferme pas une du lien) */
function sansPonctuation(brut: string): string {
  for (;;) {
    const avant = brut;
    brut = brut.replace(/[.,;:!?…]+$/, "");
    if (brut.endsWith(")") && (brut.match(/\(/g)?.length ?? 0) < (brut.match(/\)/g)?.length ?? 0)) brut = brut.slice(0, -1);
    if (brut === avant) return brut;
  }
}
function lienBrut(brut: string): { url: string; site: string } | null {
  if (brut.length > APERCU.urlMax) return null;
  try {
    const u = new URL(brut);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname) return null;
    return { url: u.toString(), site: siteDe(u.hostname) };
  } catch {
    return null;
  }
}
/**
 * 🔗 LE TEXTE EN MORCEAUX, SES LIENS À PART (le fil les rend cliquables, lot M1) : `{ texte }`, ou `{ texte, url, site }`
 * pour un lien (le texte tel qu'il a été tapé). Recollés, les morceaux redonnent le texte.
 */
export function morceauxDuTexte(t: string): { texte: string; url?: string; site?: string }[] {
  const r: { texte: string; url?: string; site?: string }[] = [];
  const re = new RegExp(LIEN.source, "gi");
  let k = 0;
  for (let m = re.exec(t); m; m = re.exec(t)) {
    const brut = sansPonctuation(m[0]);
    const l = lienBrut(brut);
    if (!l) continue;
    if (m.index > k) r.push({ texte: t.slice(k, m.index) });
    r.push({ texte: brut, ...l });
    k = m.index + brut.length;
  }
  if (k < t.length) r.push({ texte: t.slice(k) });
  return r;
}
/** « youtube.com », « lemonde.fr » : le site, sans « www. ». */
export const siteDe = (hote: string) => hote.toLowerCase().replace(/^www\./, "").slice(0, APERCU.siteMax);

// ─── les adresses que le serveur refuse d'aller lire ───────────────────────────────────────────────
const NOMS_INTERNES = /(^|\.)(localhost|local|internal|intranet|lan|home|corp|localdomain|home\.arpa)$/i;
/** Une adresse IP (v4 ou v6) écrite telle quelle, ou un nom qui y ressemble (« 0x7f.1 », « 2130706433 »). */
export function ressembleAUneIp(hote: string): boolean {
  const h = hote.replace(/^\[|\]$/g, "");
  if (h.includes(":")) return true;
  if (/^[0-9.]+$/.test(h)) return true;
  return /^(0x[0-9a-f]+|[0-9]+)(\.(0x[0-9a-f]+|[0-9]+)){0,3}$/i.test(h);
}

const v4 = (ip: string): number[] | null => {
  const p = ip.split(".");
  if (p.length !== 4) return null;
  const n = p.map((x) => (/^\d{1,3}$/.test(x) ? Number(x) : NaN));
  return n.every((x) => Number.isInteger(x) && x >= 0 && x <= 255) ? n : null;
};
/**
 * 🚫 UNE ADRESSE INTERNE, OU QUI N'EST PAS LE WEB PUBLIC : la machine elle-même, les réseaux privés, le lien local, les
 * adresses réservées et la diffusion ; en IPv6 aussi (et les adresses IPv4 qui s'y cachent). Ce que le serveur trouve
 * en demandant l'adresse d'un site passe ici avant qu'il ne s'y connecte.
 */
export function adresseInterne(ip: string): boolean {
  const a = ip.trim().toLowerCase().replace(/^\[|\]$/g, "");
  const n = v4(a);
  if (n) {
    const [x, y] = n;
    return (
      x === 0 || x === 10 || x === 127 || x >= 224 ||
      (x === 100 && y >= 64 && y <= 127) ||
      (x === 169 && y === 254) ||
      (x === 172 && y >= 16 && y <= 31) ||
      (x === 192 && y === 0 && n[2] === 0) ||
      (x === 192 && y === 0 && n[2] === 2) ||
      (x === 192 && y === 168) ||
      (x === 198 && (y === 18 || y === 19)) ||
      (x === 198 && y === 51 && n[2] === 100) ||
      (x === 203 && y === 0 && n[2] === 113)
    );
  }
  if (!a.includes(":")) return true;
  // (IPv6 : l'IPv4 qui s'y cache, puis les plages réservées)
  const cache = /(?:^|:)(\d{1,3}(?:\.\d{1,3}){3})$/.exec(a);
  if (cache && (a.startsWith("::ffff:") || a.startsWith("::") || a.startsWith("64:ff9b:"))) return adresseInterne(cache[1]);
  if (a === "::" || a === "::1") return true;
  const premier = parseInt(a.split(":")[0] || "0", 16);
  if (Number.isNaN(premier)) return true;
  return (premier & 0xfe00) === 0xfc00 || (premier & 0xffc0) === 0xfe80 || (premier & 0xff00) === 0xff00 || premier === 0x2001 && /^2001:0?db8:/.test(a) || premier === 0;
}

/**
 * ✅ UNE ADRESSE QUE LE SERVEUR PEUT ALLER LIRE : http ou https, sans identifiant ni mot de passe, sur le port habituel,
 * un nom (jamais une adresse IP nue, jamais un nom interne). Le nom sera encore vérifié une fois traduit en adresse (le
 * serveur refuse de s'y connecter s'il mène au réseau interne).
 */
export function urlLisible(x: string): URL | null {
  try {
    const u = new URL(x);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (u.username || u.password) return null;
    if (u.port && u.port !== "80" && u.port !== "443") return null;
    const h = u.hostname.toLowerCase();
    if (!h || !h.includes(".") || ressembleAUneIp(h) || NOMS_INTERNES.test(h)) return null;
    if (x.length > APERCU.urlMax) return null;
    return u;
  } catch {
    return null;
  }
}

// ─── ce qu'une page dit d'elle-même ────────────────────────────────────────────────────────────────
const ENTITES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", laquo: "«", raquo: "»", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", hellip: "…", mdash: "—", ndash: "–",
  eacute: "é", egrave: "è", ecirc: "ê", euml: "ë", agrave: "à", acirc: "â", ccedil: "ç", ocirc: "ô", ucirc: "û", ugrave: "ù", icirc: "î", iuml: "ï", oelig: "œ", euro: "€", copy: "©", reg: "®", trade: "™", middot: "·",
};
const decoder = (t: string) =>
  t.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const c = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(c) && c > 0 && c < 0x110000 ? String.fromCodePoint(c) : "";
    }
    return ENTITES[e.toLowerCase()] ?? m;
  });
const propre = (t: string, max: number) => {
  const x = decoder(t).replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  return signes(x) > max ? `${[...x].slice(0, max - 1).join("").trimEnd()}…` : x;
};
/** La valeur d'une balise `<meta property|name="…" content="…">`, quel que soit l'ordre de ses attributs. */
function meta(html: string, noms: string[]): string {
  for (const balise of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const nom = /\b(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(balise)?.[1]?.toLowerCase();
    if (!nom || !noms.includes(nom)) continue;
    const c = /\bcontent\s*=\s*"([^"]*)"/i.exec(balise)?.[1] ?? /\bcontent\s*=\s*'([^']*)'/i.exec(balise)?.[1];
    if (c && c.trim()) return c.trim();
  }
  return "";
}
/**
 * 📰 CE QU'UNE PAGE DIT D'ELLE-MÊME (ses balises de partage) : son titre (sinon `<title>`), son site, son image (une
 * adresse absolue, http ou https). Rien de plus : jamais le texte de la page.
 */
export function apercuDuHtml(html: string, base: string): { titre: string; site: string; image: string } {
  const tete = html.slice(0, 300_000);
  const titre = propre(meta(tete, ["og:title", "twitter:title"]) || /<title[^>]*>([\s\S]*?)<\/title>/i.exec(tete)?.[1] || "", APERCU.titreMax);
  const site = propre(meta(tete, ["og:site_name", "application-name"]), APERCU.siteMax);
  let image = "";
  const brute = meta(tete, ["og:image:secure_url", "og:image", "og:image:url", "twitter:image", "twitter:image:src"]);
  if (brute) {
    try {
      const u = new URL(decoder(brute), base);
      if (u.protocol === "http:" || u.protocol === "https:") image = u.toString();
    } catch {
      image = "";
    }
  }
  return { titre, site, image };
}

// ─── les sites connus ──────────────────────────────────────────────────────────────────────────────
/** 🎵 Les sites de musique et de vidéo connus : une carte un peu plus belle ; un toucher les ouvre sans détour. */
export const SITES_CONNUS: { site: RegExp; sorte: "musique" | "video" }[] = [
  { site: /(^|\.)(youtube\.com|youtu\.be|m\.youtube\.com)$/, sorte: "video" },
  { site: /(^|\.)(spotify\.com|open\.spotify\.com)$/, sorte: "musique" },
  { site: /(^|\.)deezer\.(com|page\.link)$/, sorte: "musique" },
  { site: /(^|\.)music\.apple\.com$/, sorte: "musique" },
];
export const sorteDuSite = (site: string): "musique" | "video" | null => SITES_CONNUS.find((x) => x.site.test(site.toLowerCase()))?.sorte ?? null;
/** « Tu quittes ClikMe pour lemonde.fr » : ce qu'on dit avant d'ouvrir un site que ClikMe ne connaît pas. */
export const phraseDepart = (site: string) => `Tu quittes ClikMe pour ${site}`;

// ─── ce que les figurines en lisent ────────────────────────────────────────────────────────────────
/**
 * 👀 CE QUE LES FIGURINES LISENT D'UN MESSAGE ÉCRIT (l'aparté, le mot de la fin, l'étagère) : le texte, sans l'adresse du
 * lien ; d'un lien, seulement son titre. Jamais l'image.
 */
export function texteLuDeLEcrit(f: { texte?: unknown; lien?: { titre?: unknown } | null }): string {
  const t = (typeof f.texte === "string" ? f.texte : "").replace(new RegExp(LIEN.source, "gi"), " ").replace(/\s+/g, " ").trim();
  const titre = typeof f.lien?.titre === "string" ? f.lien.titre.trim() : "";
  return [t, titre].filter(Boolean).join(t && titre ? " — " : "");
}

// ─── les phrases (validées par le propriétaire le 14 novembre 2026, section 10) ────────────────────
export const PHRASES_ECRIT = {
  champ: "Écrire…",
  motInterdit: "Ça, ta figurine ne le dit pas. Réessaie autrement 🙂",
  vide: "Écris quelque chose d’abord.",
  long: "Un message de 1 000 signes au plus.",
  assez: "Assez de messages pour aujourd’hui : reviens demain.",
  ferme: "Écrire n’est pas encore ouvert.",
  effaceTrop: "Il ne peut plus être effacé (24 heures au plus).",
  effaceAutre: "Ce message n’est pas le tien : tu ne peux pas l’effacer.",
} as const;
/** 🔔 « ✍️ Léa t'a écrit » (le début du message) ; un lien : « 🔗 Léa t'a envoyé un lien » (son titre). */
export function notifEcrit(prenom: string, x: { texte?: string; lien?: { titre?: string; site?: string } | null }): { titre: string; corps: string } {
  const qui = prenom.trim() || "Un proche";
  const t = (x.texte ?? "").replace(new RegExp(LIEN.source, "gi"), " ").replace(/\s+/g, " ").trim();
  if (x.lien && (!t || signes(t) < 3)) return { titre: `🔗 ${qui} t’a envoyé un lien`, corps: x.lien.titre || x.lien.site || "Viens voir 👀" };
  const debut = signes(t) > ECRIT.notif ? `${[...t].slice(0, ECRIT.notif - 1).join("").trimEnd()}…` : t;
  return { titre: `✍️ ${qui} t’a écrit`, corps: debut || "Viens lire 👀" };
}
/** La ligne de « Chez moi » : le début du message, ou le lien (« 🔗 Le titre du lien »). */
export function ligneDeLEcrit(x: { texte?: string; lien?: { titre?: string; site?: string } | null }): string {
  const t = (x.texte ?? "").replace(new RegExp(LIEN.source, "gi"), " ").replace(/\s+/g, " ").trim();
  if (x.lien && (!t || signes(t) < 3)) return `🔗 ${x.lien.titre || x.lien.site || "Un lien"}`;
  return t;
}

// ─── ce qu'on mesure (section 8) ───────────────────────────────────────────────────────────────────
/** Les compteurs du jour (`stats/messages/<jour>.json`). */
export type StatsJourMessages = { ecrits: number; vocaux: number; liens: number; apercus: number; sansApercu: number; effaces: number; ecrivains: number };
export const STATS_MESSAGES_VIDES: StatsJourMessages = { ecrits: 0, vocaux: 0, liens: 0, apercus: 0, sansApercu: 0, effaces: 0, ecrivains: 0 };
