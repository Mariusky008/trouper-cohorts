/**
 * 📺 LA TÉLÉ DE LA PIÈCE DU DUO (`docs/univers/piece-du-duo.md`, « La télé ») — le propriétaire, le 15 novembre 2026 :
 * « quand on met un lien dans le chat, qu'il s'affiche sur la télé de la scène directement » ; un bouton « allumer » ; le
 * dernier lien ; sinon « un lien lambda d'un clip chanson YouTube ». Puis, à la session de l'univers : « oui, prépare la
 * télé », en morceau autonome que la maquette de la pièce vivante n'aura qu'à brancher (à la place de son clip fixe).
 *
 * CE QU'ELLE PASSE (`ProgrammeTele`) :
 *   - le DERNIER LIEN YOUTUBE que les deux se sont envoyé (`youtube`) : lu dans l'écran, à l'intérieur de la pièce ;
 *   - un lien TikTok ou Instagram plus récent (`ouvrir`) : ils se lisent mal hors de leur appli — la télé montre son
 *     aperçu (fait au lot M1) avec « ▶ Ouvrir sur TikTok » ;
 *   - aucun lien : un CLIP DE SECOURS (`secours`), dans la courte liste choisie par le propriétaire (jamais par une
 *     session : la page d'essais, « 📺 La télé du duo ») ; aucune liste : la télé reste éteinte (`eteinte`).
 *   - une vidéo qui refuse d'être lue hors de YouTube (les erreurs 101, 150… du lecteur) : la télé passe à un clip de
 *     secours, et propose de la regarder sur YouTube.
 *
 * LE SON : sur iPhone, une vidéo ne joue avec le son qu'après un geste — le bouton « ▶ Allumer » est ce geste. Si le
 * téléphone refuse encore, le lecteur de YouTube reste là, avec son propre bouton de lecture.
 *
 * C'est la télé de LEUR pièce, pas un visionnage commun en direct : chacun l'allume chez lui.
 *
 * Ce fichier est partagé (l'écran et le serveur).
 */

export const TELE = {
  /** Les clips de secours, au plus. */
  secoursMax: 8,
  /** Les messages relus, au plus (les plus récents), pour trouver le dernier lien. */
  messagesLus: 80,
} as const;

export const PHRASES_TELE = {
  allumer: "▶ Allumer la télé",
  eteindre: "Éteindre",
  ouvrir: (p: Plateforme) => `▶ Ouvrir sur ${NOMS_PLATEFORMES[p]}`,
  refuse: "Cette vidéo ne se regarde que sur YouTube : un clip en attendant.",
  surYouTube: "▶ La regarder sur YouTube",
  eteinte: "Envoyez-vous un lien YouTube : il passera ici.",
  secours: "En attendant votre premier lien",
} as const;

export type Plateforme = "youtube" | "tiktok" | "instagram";
const NOMS_PLATEFORMES: Record<Plateforme, string> = { youtube: "YouTube", tiktok: "TikTok", instagram: "Instagram" };

/** Une zone sur l'image de la pièce (la télé, son écran seul) : x, y, largeur, hauteur, de 0 à 1 (`pieces-duo.ts`). */
export type ZoneTele = [number, number, number, number];

/** Un clip de secours (une vidéo YouTube), choisi par le propriétaire. */
export type ClipSecours = { id: string; debut?: number; titre?: string };

/**
 * 🎵 LES CLIPS DE SECOURS DU PROPRIÉTAIRE (15 novembre 2026, ses cinq liens, envoyés à la session de l'univers) : la liste
 * tant qu'il n'en a pas rangé une autre sur la page d'essais (« 📺 La télé du duo »).
 */
export const CLIPS_DU_PROPRIETAIRE: ClipSecours[] = [{ id: "7CGKeID7nRc" }, { id: "nd8RD3tjNQE" }, { id: "R2KeQqLzr00" }, { id: "ko70cExuzZM" }, { id: "e5s8MdtnbMM" }];

export type ProgrammeTele =
  | { sorte: "youtube"; id: string; debut?: number; url: string; titre?: string; apercu?: string; moi: boolean; le: string }
  | { sorte: "ouvrir"; plateforme: "tiktok" | "instagram"; url: string; titre?: string; apercu?: string; moi: boolean; le: string }
  | { sorte: "secours"; id: string; debut?: number; titre?: string }
  | { sorte: "eteinte" };

const ID = /^[A-Za-z0-9_-]{11}$/;
const hote = (u: URL) => u.hostname.toLowerCase().replace(/^(www|m|music)\./, "");

/** « 90 », « 90s », « 1m30s », « 1h2m3s » : le début, en secondes (au plus 10 heures). */
function secondes(x: string | null): number | undefined {
  if (!x) return undefined;
  const t = x.trim();
  let n = 0;
  if (/^\d+s?$/.test(t)) n = parseInt(t, 10);
  else {
    const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(t);
    if (!m || !(m[1] || m[2] || m[3])) return undefined;
    n = Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
  }
  return n > 0 && n < 36_000 ? n : undefined;
}

/**
 * 🎬 LA VIDÉO YOUTUBE D'UNE ADRESSE : son identifiant (11 signes), et son début s'il est donné. Toutes les formes :
 * `youtube.com/watch?v=…`, `youtu.be/…`, `/shorts/…`, `/embed/…`, `/live/…`, `m.` et `music.youtube.com`,
 * `youtube-nocookie.com/embed/…`. `null` : ce n'est pas une vidéo YouTube.
 */
export function videoYouTube(adresse: string): { id: string; debut?: number } | null {
  let u: URL;
  try {
    u = new URL(adresse.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const h = hote(u);
  let id = "";
  if (h === "youtu.be") id = u.pathname.split("/")[1] ?? "";
  else if (h === "youtube.com" || h === "youtube-nocookie.com") {
    if (u.pathname === "/watch") id = u.searchParams.get("v") ?? "";
    else {
      const m = /^\/(shorts|embed|live|v)\/([^/?#]+)/.exec(u.pathname);
      id = m?.[2] ?? "";
    }
  } else return null;
  if (!ID.test(id)) return null;
  const debut = secondes(u.searchParams.get("t") ?? u.searchParams.get("start"));
  return { id, ...(debut ? { debut } : {}) };
}

/** La plateforme d'une adresse (YouTube, TikTok, Instagram), ou `null`. */
export function plateformeDe(adresse: string): Plateforme | null {
  if (videoYouTube(adresse)) return "youtube";
  try {
    const h = new URL(adresse.trim()).hostname.toLowerCase();
    if (/(^|\.)tiktok\.com$/.test(h)) return "tiktok";
    if (/(^|\.)instagram\.com$/.test(h)) return "instagram";
  } catch {
    return null;
  }
  return null;
}

/** L'image d'une vidéo YouTube (servie par YouTube), quand le message n'a pas d'aperçu à lui. */
export const vignetteYouTube = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/** Le lien pour la regarder sur YouTube (au début donné). */
export const surYouTube = (id: string, debut?: number) => `https://www.youtube.com/watch?v=${id}${debut ? `&t=${debut}s` : ""}`;

/**
 * Les clips de secours, tels qu'il les a collés (une adresse par ligne, ou une liste) : les vidéos YouTube gardées (sans
 * double, huit au plus), le reste refusé (on le lui montre).
 */
export function clipsDeSecours(x: unknown): { clips: ClipSecours[]; refuses: string[] } {
  const lignes = (Array.isArray(x) ? x.map((v) => (typeof v === "string" ? v : ((v as { url?: unknown })?.url ?? ""))) : String(x ?? "").split(/\r?\n/))
    .map((l) => String(l).trim())
    .filter(Boolean)
    .slice(0, 40);
  const clips: ClipSecours[] = [];
  const refuses: string[] = [];
  for (const l of lignes) {
    const v = videoYouTube(l);
    if (!v) refuses.push(l.slice(0, 200));
    else if (!clips.some((c) => c.id === v.id) && clips.length < TELE.secoursMax) clips.push(v);
  }
  return { clips, refuses };
}

/** Les clips de secours rangés, relus (ce qui ne tient pas debout est écarté). */
export function clipsValides(x: unknown): ClipSecours[] {
  return (Array.isArray(x) ? x : [])
    .map((c) => {
      const o = (c ?? {}) as Record<string, unknown>;
      const id = typeof o.id === "string" && ID.test(o.id) ? o.id : "";
      const debut = typeof o.debut === "number" && o.debut > 0 && o.debut < 36_000 ? Math.round(o.debut) : undefined;
      const titre = typeof o.titre === "string" ? o.titre.trim().slice(0, 120) : "";
      return id ? { id, ...(debut ? { debut } : {}), ...(titre ? { titre } : {}) } : null;
    })
    .filter((c): c is ClipSecours => Boolean(c))
    .slice(0, TELE.secoursMax);
}

/** Le clip de secours du jour (il change chaque jour, le même pour les deux ce jour-là). `cle` : la paire, et le jour. */
export function secoursDuJour(clips: ClipSecours[], cle: string): ClipSecours | null {
  if (!clips.length) return null;
  let n = 0;
  for (const c of cle) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  return clips[n % clips.length];
}

/** Le clip qui prend le relais d'une vidéo refusée : le suivant dans la liste (jamais elle-même). */
export function secoursApres(clips: ClipSecours[], refusees: string[]): ClipSecours | null {
  return clips.find((c) => !refusees.includes(c.id)) ?? null;
}

/** Le programme d'un lien collé (l'essai de la télé, sur la page d'essais) : sans message, sans aperçu à lui. */
export function programmeDuLien(adresse: string): ProgrammeTele | null {
  const v = videoYouTube(adresse);
  if (v) return { sorte: "youtube", id: v.id, ...(v.debut ? { debut: v.debut } : {}), url: adresse.trim(), moi: true, le: new Date().toISOString() };
  const p = plateformeDe(adresse);
  if (p === "tiktok" || p === "instagram") return { sorte: "ouvrir", plateforme: p, url: adresse.trim(), moi: true, le: new Date().toISOString() };
  return null;
}
