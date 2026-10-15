/**
 * 🎬 LE MONTAGE DE L'INTERVIEW — fait par le téléphone, sans serveur.
 *
 * « À la fin de l'interview, il faut que tu fasses quand même un joli montage
 * comme tu l'as fait avec la dernière vidéo. » La dernière vidéo, c'est
 * l'épisode du Bordeaux : l'ardoise du jour qui s'écrit à la craie, le
 * fantôme qui arrive dans une pluie d'étincelles, qui parle avec une bulle,
 * qui se fait petit au coin de l'ardoise quand le chef parle, et qui dit « à
 * demain » sur l'ardoise de fin. Ce fichier refait exactement ça, avec les
 * trois prises filmées à la place des photos.
 *
 * ─── POURQUOI DANS LE TÉLÉPHONE ──────────────────────────────────────────
 *
 * Monter une vidéo sur un serveur demande une machine qui tourne plusieurs
 * minutes — ce n'est pas ce que sait faire l'hébergement du site. Le
 * téléphone, lui, sait dessiner une image trente fois par seconde et
 * l'enregistrer avec son son. Le montage se « joue » donc une fois, sous les
 * yeux du commerçant, et c'est cet enregistrement qui devient la vidéo : une
 * minute de montage pour une minute de vidéo, et rien à attendre ailleurs.
 *
 * ─── LE SON DE SA RÉPONSE VIENT DU FICHIER, PAS DU LECTEUR ───────────────
 *
 * Sur iPhone, un lecteur vidéo ne joue un son qu'après un toucher de l'écran,
 * et le montage démarre tout seul à la fin de l'interview. Les prises sont
 * donc jouées MUETTES pour l'image, et leur son est décodé à part puis calé
 * sur l'image au moment où elle démarre vraiment. Si ce décodage échoue, on
 * retombe sur le son du lecteur, et l'écran d'essai dit lequel a servi.
 *
 * FICHIER NAVIGATEUR.
 */
import {
  FIN,
  OUVERTURE,
  QUESTIONS,
  REPLIQUES,
  coteDuMontage,
  dureeFin,
  enteteArdoise,
  dureeOuverture,
  type Cote,
  type IdQuestion,
  type IdReplique,
  type SousTitre,
} from "@/lib/direct/interview-fantome";
import { MARQUE } from "@/lib/marque";

export const LARGEUR = 720;
export const HAUTEUR = 1280;
/** La vidéo du chef en haut, la bande d'ardoise en dessous (487 px). */
const HAUT_VIDEO = 793;
const IPS = 30;
const DOSSIER = "/direct/interview";

const CRAIE = "#EEEEE4";
const CRAIE_DOUCE = "rgba(238,238,228,.78)";
const CRAIE_J = "#F6DE78";
const ENCRE = "#1E1E22";

/* ═══ LES FORMATS QUE LE TÉLÉPHONE SAIT ÉCRIRE ═════════════════════════════
 *
 * Le MP4 d'abord : c'est ce que WhatsApp et Instagram acceptent sans
 * discuter. L'iPhone l'écrit ; les Chrome récents aussi. Les autres écrivent
 * du WebM, que l'écran d'essai signale — il faudra le convertir avant de le
 * publier ailleurs que sur ClikMe.
 */
const FORMATS = [
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  "video/mp4;codecs=avc1,mp4a.40.2",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

export function formatVideo(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const f of FORMATS) {
    try {
      if (MediaRecorder.isTypeSupported(f)) return f;
    } catch {
      /* navigateur ancien : on laisse le défaut */
    }
  }
  return "";
}

/* ═══ LES ÉLÉMENTS ═════════════════════════════════════════════════════════ */

export type Elements = {
  /** Bouche fermée → grande ouverte. */
  fantome: HTMLImageElement[];
  ardoise: HTMLImageElement;
  bande: HTMLImageElement;
  grain: HTMLImageElement;
  logo: HTMLImageElement;
  voix: Record<IdReplique, AudioBuffer>;
  /** L'ouverture de la bouche, trente valeurs par seconde de réplique. */
  bouche: Record<IdReplique, Float32Array>;
  sons: { gril: AudioBuffer; craie: AudioBuffer; cloches: AudioBuffer; souffle: AudioBuffer };
  police: { craie: string; bulle: string };
};

function image(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, ko) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => ko(new Error(`Image introuvable : ${src}`));
    i.src = src;
  });
}

async function son(ctx: BaseAudioContext, src: string): Promise<AudioBuffer> {
  const r = await fetch(src);
  if (!r.ok) throw new Error(`Son introuvable : ${src}`);
  return ctx.decodeAudioData(await r.arrayBuffer());
}

/** L'énergie d'un son, par pas de `pas` secondes (première piste). */
export function energie(buf: AudioBuffer, pas: number): Float32Array {
  const d = buf.getChannelData(0);
  const n = Math.max(1, Math.round(buf.sampleRate * pas));
  const out = new Float32Array(Math.ceil(d.length / n));
  for (let k = 0; k < out.length; k++) {
    const a = k * n;
    const b = Math.min(d.length, a + n);
    let s = 0;
    for (let i = a; i < b; i++) s += d[i] * d[i];
    out[k] = Math.sqrt(s / Math.max(1, b - a));
  }
  return out;
}

/** La bouche suit la voix : l'énergie, ramenée entre 0 et 1, lissée sur trois images. */
export function ouvertures(buf: AudioBuffer): Float32Array {
  const e = energie(buf, 1 / IPS);
  const tri = Array.from(e).filter((v) => v > 0).sort((a, b) => a - b);
  const ref = tri[Math.floor(tri.length * 0.92)] || 1;
  const o = new Float32Array(e.length);
  for (let k = 0; k < e.length; k++) {
    const m = ((e[k - 1] ?? e[k]) + e[k] + (e[k + 1] ?? e[k])) / 3;
    o[k] = Math.min(1, m / ref);
  }
  return o;
}

async function polices(): Promise<Elements["police"]> {
  const nom = "Craie ClikMe";
  if (typeof FontFace !== "undefined") {
    for (const [poids, fichier] of [["400", "kalam-400"], ["700", "kalam-700"]] as const) {
      try {
        const f = new FontFace(nom, `url(${DOSSIER}/${fichier}.woff2) format("woff2")`, { weight: poids });
        await f.load();
        document.fonts.add(f);
      } catch {
        /* la craie retombera sur une écriture manuscrite du système */
      }
    }
  }
  // LA POLICE DES BULLES EST CELLE DE L'APPLICATION : `next/font` lui donne un
  // nom à lui, qu'on lit sur un élément plutôt que de le deviner.
  const sonde = document.createElement("span");
  sonde.style.fontFamily = "var(--font-clikme), Poppins, system-ui, sans-serif";
  sonde.textContent = "a";
  document.body.appendChild(sonde);
  const bulle = getComputedStyle(sonde).fontFamily || "system-ui, sans-serif";
  sonde.remove();
  try {
    await document.fonts.load(`700 27px ${bulle}`);
  } catch {
    /* repli sur la police du système */
  }
  return { craie: `"${nom}", "Comic Sans MS", cursive`, bulle };
}

export async function chargerElements(ctx: BaseAudioContext): Promise<Elements> {
  const ids = Object.keys(REPLIQUES) as IdReplique[];
  const [fantome, ardoise, bande, grain, logo, voixListe, gril, craie, cloches, souffle, police] = await Promise.all([
    Promise.all([0, 1, 2, 3].map((k) => image(`${DOSSIER}/fantome-${k}.webp`))),
    image(`${DOSSIER}/ardoise.webp`),
    image(`${DOSSIER}/ardoise-bande.webp`),
    image(`${DOSSIER}/grain-craie.webp`),
    image("/clikme-logo-blanc.png"),
    Promise.all(ids.map((id) => son(ctx, `${DOSSIER}/voix/${id}.mp3`))),
    son(ctx, `${DOSSIER}/gril.mp3`),
    son(ctx, `${DOSSIER}/craie.mp3`),
    son(ctx, `${DOSSIER}/cloches.mp3`),
    son(ctx, `${DOSSIER}/souffle.mp3`),
    polices(),
  ]);
  const voix = {} as Record<IdReplique, AudioBuffer>;
  const bouche = {} as Record<IdReplique, Float32Array>;
  ids.forEach((id, k) => {
    voix[id] = voixListe[k];
    bouche[id] = ouvertures(voixListe[k]);
  });
  return { fantome, ardoise, bande, grain, logo, voix, bouche, sons: { gril, craie, cloches, souffle }, police };
}

/* ═══ LES OUTILS DE DESSIN ═════════════════════════════════════════════════ */

const borne = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
/** Départ et arrivée en douceur. */
const doux = (x: number) => {
  const t = borne(x);
  return t * t * (3 - 2 * t);
};
/** 0 avant `debut`, 1 après `debut + duree`, en douceur entre les deux. */
const entree = (t: number, debut: number, duree: number) => doux((t - debut) / duree);

function toile(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

function couperLignes(c2d: CanvasRenderingContext2D, texte: string, largeur: number): string[] {
  const lignes: string[] = [];
  for (const seg of texte.split("|")) {
    let cur = "";
    for (const m of seg.split(" ").filter(Boolean)) {
      const essai = cur ? `${cur} ${m}` : m;
      if (cur && c2d.measureText(essai).width > largeur) {
        lignes.push(cur);
        cur = m;
      } else cur = essai;
    }
    if (cur) lignes.push(cur);
  }
  return lignes;
}

/** Les espaces fines avant « : ! ? » et dans les guillemets, comme sur une vraie ardoise. */
const fr = (t: string) =>
  t
    .replace(/\s*([:!?;])/g, " $1")
    .replace(/«\s*/g, "« ")
    .replace(/\s*»/g, " »");

type Bloc = { lignes: HTMLCanvasElement[]; interligne: number };

/**
 * UNE LIGNE À LA CRAIE : le texte, troué par le grain, avec un léger halo
 * poudreux dessous. On n'utilise pas les filtres du dessin — l'iPhone ne les
 * connaît pas — mais l'ombre portée, qui existe partout.
 */
function ligneCraie(texte: string, police: string, taille: number, couleur: string, grain: HTMLImageElement): HTMLCanvasElement {
  const m = toile(1, 1).getContext("2d")!;
  m.font = police;
  const w = m.measureText(texte).width;
  const c = toile(w + 28, taille * 1.6);
  const g = c.getContext("2d")!;
  g.font = police;
  g.textBaseline = "middle";
  g.fillStyle = couleur;
  g.fillText(texte, 14, c.height / 2);
  const motif = g.createPattern(grain, "repeat");
  if (motif) {
    g.globalCompositeOperation = "destination-in";
    g.fillStyle = motif;
    g.fillRect(0, 0, c.width, c.height);
  }
  g.globalCompositeOperation = "destination-over";
  g.shadowColor = "rgba(230,230,220,.5)";
  g.shadowBlur = taille * 0.12;
  g.fillStyle = "rgba(230,230,220,.14)";
  g.fillText(texte, 14, c.height / 2);
  return c;
}

class Craie {
  private cache = new Map<string, Bloc>();
  constructor(private el: Elements) {}

  bloc(texte: string, taille: number, poids: 400 | 700, couleur = CRAIE, largeur = 600, interligne = taille * 1.22): Bloc {
    const cle = [texte, taille, poids, couleur, largeur].join("§");
    const deja = this.cache.get(cle);
    if (deja) return deja;
    const police = `${poids} ${taille}px ${this.el.police.craie}`;
    const m = toile(1, 1).getContext("2d")!;
    m.font = police;
    const lignes = couperLignes(m, fr(texte), largeur).map((l) => ligneCraie(l, police, taille, couleur, this.el.grain));
    const b = { lignes, interligne };
    this.cache.set(cle, b);
    return b;
  }
}

/** Le bloc s'écrit de gauche à droite, ligne après ligne, jusqu'à `progres`. */
function ecrire(c2d: CanvasRenderingContext2D, b: Bloc, cx: number, cy: number, progres: number, alpha = 1) {
  if (progres <= 0 || alpha <= 0) return;
  const tot = b.lignes.reduce((s, l) => s + l.width, 0);
  let reste = progres * tot;
  let y = cy - (b.interligne * b.lignes.length) / 2 + b.interligne / 2;
  c2d.save();
  c2d.globalAlpha = alpha;
  for (const l of b.lignes) {
    const vis = borne(reste, 0, l.width);
    reste -= l.width;
    if (vis > 0) c2d.drawImage(l, 0, 0, vis, l.height, cx - l.width / 2, y - l.height / 2, vis, l.height);
    y += b.interligne;
  }
  c2d.restore();
}

/** Le trait de craie qui souligne, tracé à la main. */
function trait(c2d: CanvasRenderingContext2D, el: Elements, cx: number, y: number, largeur: number, progres: number) {
  if (progres <= 0) return;
  const w = largeur * progres;
  c2d.save();
  c2d.globalAlpha = 0.9;
  c2d.strokeStyle = CRAIE;
  c2d.lineWidth = 5;
  c2d.lineCap = "round";
  c2d.beginPath();
  for (let x = 0; x <= w; x += 8) {
    const yy = y + Math.sin(x / 37) * 2.2 - (x / largeur) * 4;
    if (x === 0) c2d.moveTo(cx - largeur / 2 + x, yy);
    else c2d.lineTo(cx - largeur / 2 + x, yy);
  }
  c2d.stroke();
  // le grain, comme sur les lettres : quelques trous dans le trait
  const motif = c2d.createPattern(el.grain, "repeat");
  if (motif) {
    c2d.globalCompositeOperation = "destination-out";
    c2d.globalAlpha = 0.35;
    c2d.fillStyle = motif;
    c2d.fillRect(cx - largeur / 2 - 4, y - 10, w + 8, 20);
  }
  c2d.restore();
}

/* ─── la bulle du fantôme ─── */
type Bulle = { toile: HTMLCanvasElement; w: number; h: number };
const MARGE = 16;

function cheminArrondi(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function fabriquerBulle(texte: string, police: string, largeurMax = 540): Bulle {
  const f = `700 27px ${police}`;
  const m = toile(1, 1).getContext("2d")!;
  m.font = f;
  const lignes = couperLignes(m, fr(texte), largeurMax - 56);
  const lw = Math.max(...lignes.map((l) => m.measureText(l).width));
  const w = Math.ceil(lw + 56);
  const h = lignes.length * 36 + 38;
  const c = toile(w + 2 * MARGE, h + 2 * MARGE);
  const g = c.getContext("2d")!;
  g.shadowColor = "rgba(0,0,0,.35)";
  g.shadowBlur = 14;
  g.shadowOffsetY = 4;
  g.fillStyle = "rgba(255,255,255,.98)";
  cheminArrondi(g, MARGE, MARGE, w, h, 26);
  g.fill();
  g.shadowColor = "transparent";
  g.font = f;
  g.fillStyle = ENCRE;
  g.textAlign = "center";
  g.textBaseline = "middle";
  lignes.forEach((l, k) => g.fillText(l, MARGE + w / 2, MARGE + 19 + 18 + k * 36));
  return { toile: c, w, h };
}

/** La bulle, centrée en `cx`, posée au-dessus de `bas`, la pointe vers `xPointe`. */
function dessinerBulle(c2d: CanvasRenderingContext2D, b: Bulle, cx: number, bas: number, xPointe: number, alpha: number) {
  if (alpha <= 0) return;
  const x = borne(cx - b.w / 2, 14, LARGEUR - 14 - b.w);
  const y = bas - 26 - b.h;
  const e = 0.92 + 0.08 * alpha;
  c2d.save();
  c2d.globalAlpha = alpha;
  c2d.translate(x + b.w / 2, y + b.h);
  c2d.scale(e, e);
  c2d.translate(-(x + b.w / 2), -(y + b.h));
  c2d.drawImage(b.toile, x - MARGE, y - MARGE);
  const px = borne(xPointe, x + 34, x + b.w - 34);
  c2d.fillStyle = "rgba(255,255,255,.98)";
  c2d.beginPath();
  c2d.moveTo(px - 22, y + b.h - 2);
  c2d.lineTo(px + 22, y + b.h - 2);
  c2d.lineTo(px + 4, y + b.h + 26);
  c2d.closePath();
  c2d.fill();
  c2d.restore();
}

/* ─── le fantôme ─── */
type Place = { cx: number; bas: number; h: number };
function dessinerFantome(
  c2d: CanvasRenderingContext2D,
  el: Elements,
  p: Place,
  t: number,
  ouverture: number,
  angle = 0,
  alpha = 1,
) {
  if (alpha <= 0) return;
  const img = el.fantome[Math.min(3, Math.round(borne(ouverture) * 3))];
  const souffle = Math.sin(t * 2 * Math.PI * 1.05);
  const sx = 1 - 0.02 * ouverture + 0.012 * souffle;
  const sy = 1 + 0.03 * ouverture - 0.012 * souffle;
  const h = p.h * sy;
  const w = p.h * (img.width / img.height) * sx;
  const flotte = (p.h / 600) * 11 * Math.sin(t * 2 * Math.PI * 0.55);
  // son ombre au sol, qui ne flotte pas : un disque flou, écrasé
  c2d.save();
  c2d.translate(p.cx, p.bas - 6);
  c2d.scale(1, 0.18);
  const r = w * 0.32;
  const om = c2d.createRadialGradient(0, 0, 0, 0, 0, r);
  om.addColorStop(0, `rgba(0,0,0,${0.32 * alpha})`);
  om.addColorStop(1, "rgba(0,0,0,0)");
  c2d.fillStyle = om;
  c2d.fillRect(-r, -r, 2 * r, 2 * r);
  c2d.restore();
  c2d.save();
  c2d.globalAlpha = alpha;
  c2d.translate(p.cx, p.bas + flotte);
  if (angle) c2d.rotate((angle * Math.PI) / 180);
  c2d.drawImage(img, -w / 2, -h, w, h);
  c2d.restore();
}

/** Les étincelles quand il arrive ou qu'il salue — les mêmes que dans l'épisode. */
const ETINCELLES = Array.from({ length: 18 }, (_, k) => {
  const a = Math.sin(k * 12.9898) * 43758.5453;
  const b = Math.sin(k * 78.233) * 12345.678;
  return { u: (a - Math.floor(a)) * 2 - 1, v: (b - Math.floor(b)) * 2 - 1, k };
});
function etincelles(c2d: CanvasRenderingContext2D, cx: number, cy: number, age: number, rayon = 260) {
  if (age < 0 || age > 1.2) return;
  c2d.save();
  for (const { u, v, k } of ETINCELLES) {
    const r = rayon * (0.3 + 0.7 * age) * (0.6 + 0.4 * Math.abs(u));
    const x = cx + r * Math.cos(k * 0.7 + u);
    const y = cy + r * Math.sin(k * 0.7 + v) * 0.8;
    const s = 13 * (1 - age / 1.2);
    if (s < 1) continue;
    c2d.fillStyle = `rgba(255,246,214,${0.9 * (1 - age / 1.2)})`;
    c2d.beginPath();
    c2d.moveTo(x, y - s);
    c2d.lineTo(x + s * 0.25, y - s * 0.25);
    c2d.lineTo(x + s, y);
    c2d.lineTo(x + s * 0.25, y + s * 0.25);
    c2d.lineTo(x, y + s);
    c2d.lineTo(x - s * 0.25, y + s * 0.25);
    c2d.lineTo(x - s, y);
    c2d.lineTo(x - s * 0.25, y - s * 0.25);
    c2d.closePath();
    c2d.fill();
  }
  c2d.restore();
}

/** L'image du chef, recadrée pour remplir le haut sans la déformer. */
function dessinerVideo(c2d: CanvasRenderingContext2D, v: HTMLVideoElement) {
  const vw = v.videoWidth;
  const vh = v.videoHeight;
  if (!vw || !vh) {
    c2d.fillStyle = "#14110F";
    c2d.fillRect(0, 0, LARGEUR, HAUT_VIDEO);
    return;
  }
  const s = Math.max(LARGEUR / vw, HAUT_VIDEO / vh);
  const w = LARGEUR / s;
  const h = HAUT_VIDEO / s;
  // UN PEU AU-DESSUS DU MILIEU : c'est là que sont les visages, debout derrière un comptoir.
  c2d.drawImage(v, (vw - w) / 2, (vh - h) * 0.38, w, h, 0, 0, LARGEUR, HAUT_VIDEO);
}

function noir(c2d: CanvasRenderingContext2D, a: number) {
  if (a <= 0) return;
  c2d.save();
  c2d.globalAlpha = borne(a);
  c2d.fillStyle = "#000";
  c2d.fillRect(0, 0, LARGEUR, HAUTEUR);
  c2d.restore();
}

/* ═══ LE MONTAGE ═══════════════════════════════════════════════════════════ */

export type Reglages = {
  commerce: string;
  ville: string;
  plat: string;
  prix: string;
  /** Où était le fantôme sur l'aperçu, pendant l'interview. */
  coteApercu: Cote;
};

export type PriseAMonter = {
  url: string;
  question: IdQuestion;
  /** En secondes depuis le début de la prise. */
  questionDebut: number;
  questionFin: number;
  /** Où couper la prise : la fin de sa parole, plus un souffle. */
  coupe: number;
  /** Le son de la prise, décodé — `null` si le téléphone n'a pas su. */
  audio: AudioBuffer | null;
  sousTitres: SousTitre[];
};

export type Montage = {
  blob: Blob;
  type: string;
  duree: number;
  /** Ce qui a servi pour le son des réponses, prise par prise. */
  sonDesReponses: ("fichier" | "lecteur" | "aucun")[];
};

type Segment = { genre: "ouverture" } | { genre: "prise"; k: number } | { genre: "fin" };

export async function monter(o: {
  ctx: AudioContext;
  el: Elements;
  prises: PriseAMonter[];
  reglages: Reglages;
  toile: HTMLCanvasElement;
  /** Le commerçant entend-il le montage pendant qu'il se fabrique ? */
  ecouter: boolean;
  surProgres?: (p: number) => void;
  /** L'image d'attente du lecteur : l'ardoise du jour, une fois écrite, avec le fantôme. */
  surAffiche?: (image: string) => void;
  signal?: AbortSignal;
}): Promise<Montage> {
  const { ctx, el, prises, reglages } = o;
  const c2d = o.toile.getContext("2d");
  if (!c2d) throw new Error("Ce téléphone ne sait pas dessiner la vidéo.");
  if (typeof o.toile.captureStream !== "function") throw new Error("Ce téléphone ne sait pas enregistrer un dessin animé (captureStream).");
  o.toile.width = LARGEUR;
  o.toile.height = HAUTEUR;
  const craie = new Craie(el);
  const cote = coteDuMontage(reglages.coteApercu);
  const aGauche = cote === "gauche";

  /* ─── les lecteurs, muets, un par prise ─── */
  const lecteurs = await Promise.all(
    prises.map(
      (p) =>
        new Promise<HTMLVideoElement>((ok) => {
          const v = document.createElement("video");
          v.muted = true;
          v.playsInline = true;
          v.setAttribute("playsinline", "");
          v.preload = "auto";
          // VISIBLE, MAIS À PEINE : un lecteur caché du tout n'avance plus ses images sur certains téléphones.
          Object.assign(v.style, { position: "fixed", left: "0", top: "0", width: "2px", height: "2px", opacity: "0.01", pointerEvents: "none" });
          const fini = () => ok(v);
          v.addEventListener("loadeddata", fini, { once: true });
          v.addEventListener("error", fini, { once: true });
          setTimeout(fini, 5000);
          v.src = p.url;
          document.body.appendChild(v);
        }),
    ),
  );

  /* ─── le son : un bus, un compresseur, la sortie enregistrée (et les haut-parleurs si on écoute) ─── */
  const sortie = ctx.createMediaStreamDestination();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 3;
  comp.attack.value = 0.005;
  comp.release.value = 0.2;
  const bus = ctx.createGain();
  bus.connect(comp);
  comp.connect(sortie);
  const ecoute = ctx.createGain();
  ecoute.gain.value = o.ecouter ? 1 : 0;
  comp.connect(ecoute);
  ecoute.connect(ctx.destination);
  const sources: AudioScheduledSourceNode[] = [];

  const jouer = (buf: AudioBuffer, quand: number, gain = 1, offset = 0, duree?: number) => {
    const s = ctx.createBufferSource();
    s.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = gain;
    s.connect(g);
    g.connect(bus);
    const q = Math.max(ctx.currentTime, quand);
    const off = offset + Math.max(0, ctx.currentTime - quand);
    if (duree != null) {
      if (duree - (q - quand) <= 0.02) return;
      s.start(q, off, duree - (q - quand) + 0.05);
      g.gain.setValueAtTime(gain, quand + Math.max(0, duree - 0.08));
      g.gain.linearRampToValueAtTime(0, quand + duree);
    } else s.start(q, off);
    sources.push(s);
  };
  const crayon = (quand: number, duree: number, gain = 0.85) => {
    const d = Math.min(duree, el.sons.craie.duration - 0.1);
    jouer(el.sons.craie, quand, gain, Math.random() * Math.max(0, el.sons.craie.duration - d - 0.05), d);
  };

  // le grésillement du gril, en fond, d'un bout à l'autre
  const lit = ctx.createGain();
  lit.gain.value = 0;
  lit.connect(bus);
  const gril = ctx.createBufferSource();
  gril.buffer = el.sons.gril;
  gril.loop = true;
  gril.connect(lit);
  const niveauLit = (quand: number, niveau: number, en = 0.4) => {
    lit.gain.cancelScheduledValues(quand);
    lit.gain.setValueAtTime(lit.gain.value, quand);
    lit.gain.linearRampToValueAtTime(niveau, quand + en);
  };

  /* ─── l'enregistreur ─── */
  const format = formatVideo();
  const flux = new MediaStream([...o.toile.captureStream(IPS).getVideoTracks(), ...sortie.stream.getAudioTracks()]);
  const rec = new MediaRecorder(flux, { ...(format ? { mimeType: format } : {}), videoBitsPerSecond: 4_000_000, audioBitsPerSecond: 128_000 });
  const morceaux: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size) morceaux.push(e.data);
  };
  const arrete = new Promise<void>((ok) => (rec.onstop = () => ok()));

  /* ─── le plan ─── */
  const dOuv = dureeOuverture(el.voix.bonjour.duration);
  const dFin = dureeFin(el.voix["a-demain"].duration);
  const estime = dOuv + prises.reduce((s, p) => s + p.coupe, 0) + dFin;
  const segments: Segment[] = [{ genre: "ouverture" }, ...prises.map((_, k) => ({ genre: "prise" as const, k })), { genre: "fin" }];
  const sonDesReponses: Montage["sonDesReponses"] = prises.map(() => "aucun");

  // les blocs de craie, préparés une fois
  const entete = enteteArdoise(reglages.commerce);
  const MENU = [
    { b: craie.bloc(entete.avant, 46, 400), cy: 200, debut: 0.2, duree: 0.5 },
    { b: craie.bloc(entete.nom, 84, 700, CRAIE, 640), cy: 284, debut: 0.6, duree: 0.6 },
    { b: craie.bloc(reglages.plat, 48, 700, CRAIE_J, 600), cy: 404, debut: 1.3, duree: 0.7 },
  ];
  const lignesPlat = MENU[2].b.lignes.length;
  if (reglages.prix.trim()) MENU.push({ b: craie.bloc(reglages.prix, 60, 700), cy: 404 + (lignesPlat - 1) * 30 + 78, debut: 2.1, duree: 0.4 });
  const ADIEU = [
    { b: craie.bloc(reglages.commerce, 80, 700), cy: 220, debut: 0.25, duree: 0.7 },
    { b: craie.bloc(reglages.ville, 42, 400), cy: 312, debut: 0.95, duree: 0.3 },
  ];
  const bulles = new Map<IdReplique, Bulle>();
  const bulle = (id: IdReplique) => {
    let b = bulles.get(id);
    if (!b) bulles.set(id, (b = fabriquerBulle(REPLIQUES[id], el.police.bulle)));
    return b;
  };
  const TITRES = Object.fromEntries(QUESTIONS.map((q) => [q.id, q.titre])) as Record<IdQuestion, string>;
  const mention = `Essai ${MARQUE} · la voix du fantôme est une voix de synthèse`;

  const GRAND_ARD: Place = { cx: 360, bas: 1262, h: 560 };
  const GRAND: Place = { cx: aGauche ? 225 : 495, bas: 1266, h: 470 };
  const PETIT: Place = { cx: aGauche ? 128 : 592, bas: 1272, h: 265 };
  /** Le milieu de la place laissée à la craie, à côté du petit fantôme. */
  const X_TEXTE = aGauche ? 478 : 242;
  const mi = (a: Place, b: Place, q: number): Place => ({ cx: a.cx + (b.cx - a.cx) * q, bas: a.bas + (b.bas - a.bas) * q, h: a.h + (b.h - a.h) * q });
  const bouche = (id: IdReplique, t: number) => {
    const b = el.bouche[id];
    const i = Math.floor(t * IPS);
    return i >= 0 && i < b.length ? b[i] : 0;
  };

  /* ─── chaque image ─── */
  const ouverture = (t: number) => {
    c2d.drawImage(el.ardoise, 0, 0, LARGEUR, HAUTEUR);
    for (const m of MENU) ecrire(c2d, m.b, LARGEUR / 2, m.cy, doux((t - m.debut) / m.duree));
    trait(c2d, el, LARGEUR / 2, 334, 300, doux((t - 1.2) / 0.35));
    const arrivee = entree(t, 0.3, 0.7);
    const place = { ...GRAND_ARD, bas: GRAND_ARD.bas + 900 * (1 - arrivee) };
    const tv = t - OUVERTURE.voix;
    dessinerFantome(c2d, el, place, t, bouche("bonjour", tv));
    etincelles(c2d, 360, 900, t - 0.4);
    const al = entree(t, OUVERTURE.voix - 0.15, 0.2) * (1 - entree(t, OUVERTURE.voix + el.voix.bonjour.duration + 0.25, 0.2));
    dessinerBulle(c2d, bulle("bonjour"), 360, place.bas - place.h * 0.97, 360, al);
    noir(c2d, 1 - t / 0.3);
  };

  const prise = (k: number, tc: number, tl: number) => {
    const p = prises[k];
    dessinerVideo(c2d, lecteurs[k]);
    const voile = c2d.createLinearGradient(0, HAUT_VIDEO - 110, 0, HAUT_VIDEO);
    voile.addColorStop(0, "rgba(10,8,6,0)");
    voile.addColorStop(1, "rgba(10,8,6,.6)");
    c2d.fillStyle = voile;
    c2d.fillRect(0, HAUT_VIDEO - 110, LARGEUR, 110);
    c2d.drawImage(el.bande, 0, HAUT_VIDEO, LARGEUR, HAUTEUR - HAUT_VIDEO);

    const repond = tc - (p.questionFin + 0.05);
    // l'ardoise : la question en titre, puis ce qu'il dit, à la craie
    const titreAvecSousTitres = p.sousTitres.length > 0;
    const titre = titreAvecSousTitres
      ? craie.bloc(TITRES[p.question], 32, 400, CRAIE_DOUCE, 430)
      : craie.bloc(TITRES[p.question], 54, 700, CRAIE, 430);
    ecrire(c2d, titre, X_TEXTE, titreAvecSousTitres ? 848 : 1018, doux((repond - 0.05) / 0.5));
    p.sousTitres.forEach((s, j) => {
      const suivant = j + 1 < p.sousTitres.length ? p.sousTitres[j + 1].debut : s.fin + 0.8;
      if (tc < s.debut - 0.05 || tc >= suivant - 0.05) return;
      const b = craie.bloc(s.texte, 40, 700, CRAIE, 430, 50);
      ecrire(c2d, b, X_TEXTE, 1040, doux((tc - s.debut + 0.05) / Math.max(0.35, Math.min(0.8, (s.fin - s.debut) * 0.6))), 1 - entree(tc, suivant - 0.17, 0.12));
    });

    // le fantôme : grand quand il demande, petit au coin quand le chef répond
    const q = entree(repond, 0, 0.4);
    const place = mi(GRAND, PETIT, q);
    let angle = 0;
    for (const s of p.sousTitres) if (tc >= s.debut && tc < s.debut + 0.35) angle = 4 * Math.sin((tc - s.debut) * 22);
    if (!p.sousTitres.length && repond > 0) angle = 2.5 * Math.sin(tc * 1.7) * Math.max(0, Math.sin(tc * 0.45));
    dessinerFantome(c2d, el, place, tc, bouche(p.question, tc - p.questionDebut), angle);
    const al = entree(tc, p.questionDebut - 0.1, 0.2) * (1 - entree(tc, p.questionFin + 0.2, 0.2));
    const teteY = place.bas - place.h * 0.97;
    dessinerBulle(c2d, bulle(p.question), place.cx + (aGauche ? 110 : -110), teteY + 6, place.cx + (aGauche ? 30 : -30), al);
    noir(c2d, 1 - tl / 0.25);
  };

  const fin = (t: number) => {
    c2d.drawImage(el.ardoise, 0, 0, LARGEUR, HAUTEUR);
    for (const m of ADIEU) ecrire(c2d, m.b, LARGEUR / 2, m.cy, doux((t - m.debut) / m.duree));
    const finVoix = FIN.voix + el.voix["a-demain"].duration;
    const a = entree(t, finVoix + 0.3, 0.6);
    if (a > 0) {
      const lw = 170;
      const lh = (el.logo.height * lw) / el.logo.width;
      c2d.save();
      c2d.globalAlpha = a * 0.95;
      c2d.drawImage(el.logo, (LARGEUR - lw) / 2, 372, lw, lh);
      c2d.globalAlpha = a * 0.8;
      c2d.font = `500 14px ${el.police.bulle}`;
      c2d.fillStyle = "rgb(200,205,198)";
      c2d.textAlign = "center";
      c2d.fillText(mention, LARGEUR / 2, 1250);
      c2d.restore();
    }
    // il apparaît au milieu, dit « à demain », puis fait un petit salut
    const e = 0.7 + 0.3 * entree(t, 0, 0.35);
    const salut = t - (finVoix + 0.2);
    const saut = salut > 0 ? 40 * Math.abs(Math.sin(Math.min(salut, 1.2) * Math.PI / 0.6)) * (1 - (Math.min(salut, 1.2) / 1.2) * 0.3) : 0;
    const angle = salut > 0 ? 7 * Math.sin(salut * 9) * Math.max(0, 1 - salut / 1.6) : 0;
    dessinerFantome(c2d, el, { ...GRAND_ARD, h: GRAND_ARD.h * e, bas: GRAND_ARD.bas - saut }, t, bouche("a-demain", t - FIN.voix), angle);
    etincelles(c2d, 360, 920, t - 0.05, 220);
    etincelles(c2d, 360, 900, salut, 300);
    const al = entree(t, FIN.voix - 0.15, 0.2) * (1 - entree(t, finVoix + 0.25, 0.2));
    dessinerBulle(c2d, bulle("a-demain"), 360, GRAND_ARD.bas - GRAND_ARD.h * 0.97 + 10, 360, al);
    noir(c2d, (t - (dFin - 0.5)) / 0.5);
  };

  /* ─── les sons de chaque temps, posés quand il commence ─── */
  const sonsOuverture = (t0: number) => {
    niveauLit(t0, 0.42, 0.6);
    for (const m of MENU) crayon(t0 + m.debut, m.duree);
    crayon(t0 + 1.2, 0.35, 0.6);
    jouer(el.sons.souffle, t0 + 0.15, 0.55);
    jouer(el.sons.cloches, t0 + 0.35, 0.5);
    jouer(el.voix.bonjour, t0 + OUVERTURE.voix, 0.95);
  };
  const sonsFin = (t0: number) => {
    niveauLit(t0, 0.4, 0.4);
    lit.gain.setValueAtTime(0.4, t0 + dFin - 0.9);
    lit.gain.linearRampToValueAtTime(0, t0 + dFin);
    for (const m of ADIEU) crayon(t0 + m.debut, m.duree);
    jouer(el.sons.souffle, t0, 0.5);
    jouer(el.voix["a-demain"], t0 + FIN.voix, 0.95);
    jouer(el.sons.cloches, t0 + FIN.voix + el.voix["a-demain"].duration + 0.25, 0.55);
  };
  /** Une prise : appelé quand sa vidéo démarre vraiment, `zero` = l'heure de son début. */
  const sonsPrise = (k: number, zero: number, v: HTMLVideoElement) => {
    const p = prises[k];
    niveauLit(ctx.currentTime, 0.16, 0.5);
    jouer(el.sons.souffle, ctx.currentTime, 0.3);
    jouer(el.voix[p.question], zero + p.questionDebut, 0.95);
    crayon(zero + p.questionFin + 0.1, 0.5, 0.6);
    for (const s of p.sousTitres) crayon(zero + s.debut, Math.max(0.35, Math.min(0.8, (s.fin - s.debut) * 0.6)), 0.45);
    // SA RÉPONSE : muette pendant la question (le micro a entendu le fantôme
    // dans le haut-parleur), puis à pleine voix.
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.setValueAtTime(0, zero + p.questionFin + 0.05);
    g.gain.linearRampToValueAtTime(1, zero + p.questionFin + 0.15);
    g.connect(bus);
    if (p.audio) {
      const s = ctx.createBufferSource();
      s.buffer = p.audio;
      s.connect(g);
      s.start(ctx.currentTime, Math.min(p.audio.duration - 0.01, v.currentTime));
      s.stop(zero + p.coupe + 0.05);
      sources.push(s);
      sonDesReponses[k] = "fichier";
    } else {
      try {
        const s = ctx.createMediaElementSource(v);
        v.muted = false;
        s.connect(g);
        sonDesReponses[k] = "lecteur";
      } catch {
        sonDesReponses[k] = "aucun";
      }
    }
  };

  /* ─── la boucle : l'horloge du son mène, l'image suit ─── */
  if (ctx.state !== "running") await ctx.resume().catch(() => {});
  gril.start();
  sources.push(gril);
  ouverture(0);
  rec.start(1000);
  const T0 = ctx.currentTime + 0.12;
  sonsOuverture(T0);

  let seg = 0;
  let debutSeg = T0;
  let lance = false;
  let sonsPoses = false;
  let derniere = -1;
  let bloqueDepuis = 0;
  let affiche = false;
  let erreur: Error | null = null;

  await new Promise<void>((fini) => {
    const suivant = (maintenant: number) => {
      const s = segments[seg];
      if (s.genre === "prise") lecteurs[s.k].pause();
      seg += 1;
      debutSeg = maintenant;
      lance = false;
      sonsPoses = false;
      if (seg >= segments.length) return fini();
      if (segments[seg].genre === "fin") sonsFin(maintenant);
    };
    const tic = () => {
      if (seg >= segments.length) return;
      if (erreur) return fini();
      if (o.signal?.aborted) {
        erreur = new Error("Montage interrompu.");
        return fini();
      }
      const maintenant = ctx.currentTime;
      const t = maintenant - debutSeg;
      const s = segments[seg];
      const dessiner = maintenant - derniere >= 1 / (IPS + 2);
      if (s.genre === "ouverture") {
        if (dessiner) ouverture(Math.max(0, t));
        if (dessiner && !affiche && t >= 2.8) {
          affiche = true;
          try {
            o.surAffiche?.(o.toile.toDataURL("image/jpeg", 0.82));
          } catch {
            /* pas d'image d'attente : le lecteur montrera sa première image */
          }
        }
        if (t >= dOuv) suivant(maintenant);
      } else if (s.genre === "prise") {
        const v = lecteurs[s.k];
        const p = prises[s.k];
        if (!lance) {
          lance = true;
          bloqueDepuis = maintenant;
          v.currentTime = 0;
          v.play().catch(() => {
            /* muet : la lecture ne devrait jamais être refusée — sinon, le garde-fou ci-dessous passe la prise */
          });
        }
        const tc = v.currentTime;
        if (tc > 0.02 && !sonsPoses) {
          // LA VIDÉO TOURNE VRAIMENT : on cale le son sur elle.
          sonsPoses = true;
          sonsPrise(s.k, maintenant - tc, v);
        }
        if (dessiner) prise(s.k, tc, t);
        if (tc > 0.02) bloqueDepuis = maintenant;
        if (tc >= p.coupe || v.ended || maintenant - bloqueDepuis > 3) suivant(maintenant);
      } else {
        if (dessiner) fin(Math.max(0, t));
        if (t >= dFin) suivant(maintenant);
      }
      if (seg >= segments.length) return;
      if (dessiner) derniere = maintenant;
      o.surProgres?.(borne((maintenant - T0) / estime));
      requestAnimationFrame(tic);
    };
    requestAnimationFrame(tic);
  });

  // une image noire de plus, puis on arrête
  noir(c2d, 1);
  await new Promise((r) => setTimeout(r, 150));
  if (rec.state !== "inactive") rec.stop();
  await arrete;
  for (const s of sources) {
    try {
      s.stop();
    } catch {
      /* déjà arrêtée */
    }
  }
  bus.disconnect();
  comp.disconnect();
  ecoute.disconnect();
  lit.disconnect();
  for (const v of lecteurs) {
    v.pause();
    v.removeAttribute("src");
    v.load();
    v.remove();
  }
  flux.getTracks().forEach((t) => t.stop());
  if (erreur) throw erreur;
  const type = rec.mimeType || format || "video/webm";
  return { blob: new Blob(morceaux, { type }), type, duree: ctx.currentTime - T0, sonDesReponses };
}
