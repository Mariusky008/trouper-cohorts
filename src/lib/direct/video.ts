/**
 * 🎬 ÉCRIRE, PARTAGER — lot M3 « les vidéos » (cahier des charges : `docs/univers/messages-ecrits.md`, section 6, validé
 * par le propriétaire le 14 novembre 2026).
 *
 * Une vidéo part dans la conversation, une à la fois, 30 secondes au plus (25 Mo), avec une légende si on veut. Le
 * téléphone en tire trois images (au début, au milieu, à la fin) : elles passent au service de modération avant que la
 * vidéo soit livrée (le son n'est pas contrôlé : une limite connue) ; celle du milieu devient sa vignette. Le serveur
 * n'a pas de quoi décoder une vidéo : il lit sa DURÉE dans son en-tête (MP4 et MOV : la boîte `mvhd` ; WebM : l'élément
 * `Duration`), sans rien décoder.
 *
 * Ici, LES RÈGLES, sans serveur (le navigateur et `scripts/verifier-messages.mjs` les lisent aussi) : les limites, les
 * formats, la durée lue dans le fichier, la notification, la ligne de « Chez moi », ce que les figurines en lisent (la
 * légende, jamais la vidéo), les phrases de l'écran.
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : aucun accès à la base ici, aucun import qui ne soit pas un type.
 */
import { ECRIT, signes } from "./ecrit";

export const VIDEO = {
  /** Ce qui arrive au serveur, au plus. */
  max: 25 * 1024 * 1024,
  /** Les vidéos par personne et par jour. */
  parJour: 10,
  /** La durée, en secondes, au plus (une demi-seconde de tolérance : l'arrondi des téléphones). */
  duree: 30,
  /** Les images tirées de la vidéo pour la modération (au début, au milieu, à la fin). */
  images: 3,
  /** Une image tirée, au plus, avant d'être lue (une adresse `data:`). */
  imageMax: 600 * 1024,
  /** La vignette, en pixels (son grand côté), au plus. */
  vignette: 480,
  /** Le temps que la figurine la montre, dans la scène (en secondes). */
  montre: 4,
} as const;

/** Les formats pris : ceux des téléphones (MP4 sur Android, MOV sur iPhone) et du navigateur (WebM). */
export const FORMATS_VIDEO: Record<string, "mp4" | "mov" | "webm"> = { "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" };
/** « video/mp4; codecs=… » → « mp4 » ; `null` : un format qu'on ne prend pas. */
export const extVideo = (type: unknown): "mp4" | "mov" | "webm" | null => (typeof type === "string" ? (FORMATS_VIDEO[type.split(";")[0].trim().toLowerCase()] ?? null) : null);
/** « 45 s : 30 secondes au plus » : ce qu'on dit d'une vidéo trop longue (avant l'envoi, et au serveur). */
export const phraseTropLongue = (secondes: number) => `${Math.round(secondes)} s : ${VIDEO.duree} secondes au plus`;
/** Trop longue ? (une demi-seconde de tolérance) */
export const tropLongue = (secondes: number) => secondes > VIDEO.duree + 0.5;

// ─── la durée, lue dans le fichier (sans rien décoder) ─────────────────────────────────────────────
const u32 = (o: Uint8Array, i: number) => ((o[i] << 24) | (o[i + 1] << 16) | (o[i + 2] << 8) | o[i + 3]) >>> 0;
const u64 = (o: Uint8Array, i: number) => u32(o, i) * 2 ** 32 + u32(o, i + 4);
const type4 = (o: Uint8Array, i: number) => String.fromCharCode(o[i], o[i + 1], o[i + 2], o[i + 3]);

/**
 * ⏱️ LA DURÉE D'UN MP4 OU D'UN MOV, en secondes : la boîte `moov/mvhd` (son échelle de temps et sa durée), où qu'elle soit
 * dans le fichier. `null` : ce n'est pas un MP4 ou un MOV lisible.
 */
export function dureeDuMp4(o: Uint8Array): number | null {
  const parcourir = (debut: number, fin: number, profondeur: number): number | null => {
    let i = debut;
    while (i + 8 <= fin) {
      let taille = u32(o, i);
      const t = type4(o, i + 4);
      let entete = 8;
      if (taille === 1) {
        if (i + 16 > fin) return null;
        taille = u64(o, i + 8);
        entete = 16;
      } else if (taille === 0) taille = fin - i;
      if (taille < entete || i + taille > fin) return null;
      if (t === "moov" && profondeur === 0) return parcourir(i + entete, i + taille, 1);
      if (t === "mvhd" && profondeur === 1) {
        const v = o[i + entete];
        const p = i + entete + 4;
        const [echelle, duree] = v === 1 ? [u32(o, p + 16), u64(o, p + 20)] : [u32(o, p + 8), u32(o, p + 12)];
        return echelle > 0 ? duree / echelle : null;
      }
      i += taille;
    }
    return null;
  };
  // (un MP4 ou un MOV commence par une boîte : « ftyp », ou directement « moov », « mdat », « wide »…)
  if (o.length < 16 || !/^(ftyp|moov|mdat|wide|free|skip)$/.test(type4(o, 4))) return null;
  return parcourir(0, o.length, 0);
}

/** (un nombre de taille variable d'EBML : sa longueur, et sa valeur — avec ou sans le bit de tête) */
function vint(o: Uint8Array, i: number, garderTete: boolean): { n: number; v: number; inconnu: boolean } | null {
  const premier = o[i];
  if (premier === undefined || premier === 0) return null;
  let n = 1;
  while (n <= 8 && !(premier & (0x80 >> (n - 1)))) n++;
  if (n > 8 || i + n > o.length) return null;
  let v = garderTete ? premier : premier & (0xff >> n);
  let tousUn = v === 0xff >> n;
  for (let k = 1; k < n; k++) {
    v = v * 256 + o[i + k];
    if (o[i + k] !== 0xff) tousUn = false;
  }
  return { n, v, inconnu: !garderTete && tousUn };
}

/**
 * ⏱️ LA DURÉE D'UN WEBM, en secondes : `Segment/Info/Duration` (en unités de `TimecodeScale`, une milliseconde par
 * défaut). `null` : pas un WebM, ou une durée qu'il ne donne pas (ce que font souvent les enregistrements du navigateur).
 */
export function dureeDuWebm(o: Uint8Array): number | null {
  if (o.length < 4 || u32(o, 0) !== 0x1a45dfa3) return null;
  let echelle = 1_000_000;
  let duree: number | null = null;
  const parcourir = (debut: number, fin: number, profondeur: number) => {
    let i = debut;
    while (i < fin) {
      const id = vint(o, i, true);
      if (!id) return;
      const taille = vint(o, i + id.n, false);
      if (!taille) return;
      const dedans = i + id.n + taille.n;
      const bout = taille.inconnu ? fin : Math.min(fin, dedans + taille.v);
      if (id.v === 0x18538067 && profondeur === 0) return parcourir(dedans, bout, 1); // Segment
      if (id.v === 0x1549a966 && profondeur === 1) return parcourir(dedans, bout, 2); // Info
      if (profondeur === 2 && id.v === 0x2ad7b1) {
        let v = 0;
        for (let k = dedans; k < bout; k++) v = v * 256 + o[k];
        if (v > 0) echelle = v;
      }
      if (profondeur === 2 && id.v === 0x4489) {
        const vue = new DataView(o.buffer, o.byteOffset + dedans, bout - dedans);
        duree = bout - dedans === 8 ? vue.getFloat64(0) : bout - dedans === 4 ? vue.getFloat32(0) : null;
      }
      if (taille.inconnu) return;
      i = bout;
    }
  };
  if (o.length >= 4) {
    const entete = vint(o, 0, true);
    const t = entete ? vint(o, entete.n, false) : null;
    if (entete && t) parcourir(entete.n + t.n + t.v, o.length, 0);
  }
  return duree !== null && Number.isFinite(duree) && duree > 0 ? (duree * echelle) / 1e9 : null;
}

/** 🔔 La notification : « 🎬 Léa t'a envoyé une vidéo », et sa légende (le début). */
export function notifVideo(prenom: string, legende?: string): { titre: string; corps: string } {
  const qui = prenom.trim() || "Un proche";
  const t = (legende ?? "").trim();
  return { titre: `🎬 ${qui} t’a envoyé une vidéo`, corps: t ? (signes(t) > ECRIT.notif ? `${[...t].slice(0, ECRIT.notif - 1).join("").trimEnd()}…` : t) : "Viens voir 👀" };
}
/** La ligne de « Chez moi » : « 🎬 La légende », ou « 🎬 Une vidéo ». */
export const ligneVideo = (legende?: string) => `🎬 ${(legende ?? "").trim() || "Une vidéo"}`;
/** 👀 Ce que les figurines lisent d'une vidéo : sa légende, jamais la vidéo. */
export const texteLuDeLaVideo = (f: { legende?: unknown }) => (typeof f.legende === "string" ? f.legende.trim() : "");

// ─── les phrases (section 10 du cahier ; sans accord, jamais le mot interdit) ──────────────────────
export const PHRASES_VIDEO = {
  refusee: "Cette vidéo ne peut pas partir.",
  injoignable: "La vidéo n’a pas pu être vérifiée. Réessaie dans un instant.",
  assez: "Assez de vidéos pour aujourd’hui : reviens demain.",
  ferme: "Les vidéos ne sont pas encore ouvertes.",
  lourde: "Cette vidéo est trop lourde : 25 Mo au plus.",
  absente: "Ta vidéo n’est pas arrivée. Réessaie.",
  illisible: "Ce fichier n’est pas une vidéo.",
  format: "Ce format de vidéo n’est pas pris.",
  images: "Les images de ta vidéo ne sont pas arrivées. Réessaie.",
} as const;
