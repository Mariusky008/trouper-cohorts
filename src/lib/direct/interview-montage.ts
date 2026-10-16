/**
 * 🎬 LE MONTAGE DE L'INTERVIEW — fait par le téléphone, sans serveur.
 *
 * « À la fin de l'interview, il faut que tu fasses quand même un joli montage
 * comme tu l'as fait avec la dernière vidéo. » La dernière vidéo, c'est
 * l'épisode du Bordeaux : l'ardoise du jour qui s'écrit à la craie, le
 * fantôme qui arrive dans une pluie d'étincelles, qui parle avec une bulle,
 * qui se fait petit au coin de l'ardoise quand le chef parle, et qui dit « à
 * demain » sur l'ardoise de fin. Ce fichier refait exactement ça, avec le
 * reporter de ClikMe et les prises de l'interview.
 *
 * ET PENDANT QU'IL RÉPOND, CE QU'IL MONTRE : la photo ou la vidéo ajoutée à
 * la question passe en grand, son visage reste dans un médaillon — ou, s'il a
 * choisi de ne pas se montrer, c'est son fantôme qui parle, avec sa voix.
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
 * et le montage démarre tout seul. Les prises sont donc jouées MUETTES pour
 * l'image, et leur son est décodé à part puis calé sur l'image au moment où
 * elle démarre vraiment. Si ce décodage échoue, on retombe sur le son du
 * lecteur, et l'écran d'essai dit lequel a servi.
 *
 * FICHIER NAVIGATEUR.
 */
import {
  CLOCHE,
  DEBIT_SON,
  FIN,
  IDS_REPLIQUES,
  OUVERTURE,
  QUESTIONS,
  REPLIQUES,
  coteDuMontage,
  debitDuMontage,
  dureeFin,
  enteteArdoise,
  dureeOuverture,
  repliquesDuLieu,
  type Cote,
  type IdQuestion,
  type IdReplique,
  type Mode,
  type SousTitre,
} from "@/lib/direct/interview-fantome";
import { MARQUE } from "@/lib/marque";
import { BRODERIE, arcsDuNom, lignesDuNom, type Pt } from "@/lib/direct/fantome-assis";

export const LARGEUR = 720;
export const HAUTEUR = 1280;
/** La vidéo du chef en haut, la bande d'ardoise en dessous (487 px). */
const HAUT_VIDEO = 793;
const IPS = 30;
const DOSSIER = "/direct/interview";

const CRAIE = "#EEEEE4";
const CRAIE_DOUCE = "rgba(238,238,228,.78)";
const CRAIE_J = "#F6DE78";
/** Le rose de ClikMe, celui du « ? » de la cloche. */
const ROSE = "#FF2E9A";
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

/** Le chef qui ne se montre pas n'enregistre que sa voix. */
const FORMATS_AUDIO = ["audio/mp4", "audio/mp4;codecs=mp4a.40.2", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];

export function formatAudio(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const f of FORMATS_AUDIO) {
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
  /** Le reporter de ClikMe, bouche fermée → grande ouverte. */
  reporter: HTMLImageElement[];
  /** Le fantôme du chef — à sa place quand il ne veut pas se montrer. */
  chef: HTMLImageElement[];
  ardoise: HTMLImageElement;
  bande: HTMLImageElement;
  grain: HTMLImageElement;
  logo: HTMLImageElement;
  voix: Record<IdReplique, AudioBuffer>;
  /** L'ouverture de la bouche, trente valeurs par seconde de réplique. */
  bouche: Record<IdReplique, Float32Array>;
  /** Qui a parlé pour le reporter : « elevenlabs:eleven_v3 », « openai:ash »… ou « secours ». */
  sourceVoix: string;
  sons: { gril: AudioBuffer; craie: AudioBuffer; cloches: AudioBuffer; souffle: AudioBuffer };
  police: { craie: string; bulle: string; enseigne: string };
};

/** Changer un texte de réplique → changer ce numéro, sinon le cache resservirait l'ancienne voix. */
export const VERSION_VOIX = "2";

function image(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, ko) => {
    const i = new Image();
    // UNE PHOTO D'AILLEURS (son stockage en ligne) SE DEMANDE « SANS COOKIES » : sans
    // cette permission, elle salirait le dessin et la vidéo ne pourrait plus s'enregistrer.
    if (/^https?:/i.test(src) && !src.startsWith(window.location.origin)) i.crossOrigin = "anonymous";
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

/**
 * LA BOUCHE SUIT LA VOIX : l'énergie, ramenée entre 0 et 1, lissée sur trois
 * images. `depuis` ignore le début (pour la réponse du chef : le micro y a
 * entendu le reporter dans le haut-parleur, et son fantôme ne doit pas parler
 * à sa place).
 */
export function ouvertures(buf: AudioBuffer, depuis = 0): Float32Array {
  const e = energie(buf, 1 / IPS);
  const k0 = Math.min(e.length, Math.max(0, Math.floor(depuis * IPS)));
  const tri = Array.from(e.subarray(k0)).filter((v) => v > 0).sort((a, b) => a - b);
  const ref = tri[Math.floor(tri.length * 0.92)] || 1;
  const o = new Float32Array(e.length);
  for (let k = k0; k < e.length; k++) {
    const m = ((e[k - 1] ?? e[k]) + e[k] + (e[k + 1] ?? e[k])) / 3;
    o[k] = Math.min(1, m / ref);
  }
  return o;
}

const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * LA VOIX DU REPORTER : LIAM, PAR LE SERVEUR — OU TOUTES CELLES DE SECOURS.
 *
 * TOUT OU RIEN. Une réplique refusée au milieu (un quota, une limite de
 * requêtes simultanées) ne doit pas donner un reporter qui change de voix
 * entre deux questions : au premier échec, on reprend TOUTES les répliques de
 * secours. Deux demandes à la fois seulement — un compte ElevenLabs modeste en
 * refuse davantage —, et une seconde chance après un refus pour cause
 * d'affluence.
 */
async function chargerVoix(ctx: BaseAudioContext): Promise<{ voix: Record<IdReplique, AudioBuffer>; source: string }> {
  const voix = {} as Record<IdReplique, AudioBuffer>;
  let source = "";
  try {
    const une = async (id: IdReplique) => {
      for (let essai = 0; essai < 2; essai++) {
        const stop = new AbortController();
        const minuterie = setTimeout(() => stop.abort(), 25_000);
        try {
          const r = await fetch(`/api/direct/interview/voix?id=${id}&v=${VERSION_VOIX}`, { signal: stop.signal });
          if (r.ok) {
            source = source || r.headers.get("x-interview-voix") || "serveur";
            voix[id] = await ctx.decodeAudioData(await r.arrayBuffer());
            return;
          }
          if (r.status !== 429 && r.status < 500) throw new Error(`HTTP ${r.status}`);
          if (r.status === 503) throw new Error("voix non configurée");
        } finally {
          clearTimeout(minuterie);
        }
        await attendre(1500);
      }
      throw new Error("voix indisponible");
    };
    const file = [...IDS_REPLIQUES];
    let echec = false;
    await Promise.all(
      [0, 1].map(async () => {
        while (file.length && !echec) {
          try {
            await une(file.shift()!);
          } catch (e) {
            echec = true;
            throw e;
          }
        }
      }),
    );
    return { voix, source };
  } catch {
    const liste = await Promise.all(IDS_REPLIQUES.map((id) => son(ctx, `${DOSSIER}/voix/${id}.mp3`)));
    const secours = {} as Record<IdReplique, AudioBuffer>;
    IDS_REPLIQUES.forEach((id, k) => (secours[id] = liste[k]));
    return { voix: secours, source: "secours" };
  }
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
  // ET CELLE DU NOM BRODÉ SUR LA CASQUETTE, comme dans l'expérience du restaurant
  sonde.style.fontFamily = "var(--font-enseigne), Georgia, serif";
  document.body.appendChild(sonde);
  const enseigne = getComputedStyle(sonde).fontFamily || "Georgia, serif";
  sonde.remove();
  try {
    await Promise.all([document.fonts.load(`700 27px ${bulle}`), document.fonts.load(`800 60px ${bulle}`), document.fonts.load(`italic 400 30px ${enseigne}`)]);
  } catch {
    /* repli sur la police du système */
  }
  return { craie: `"${nom}", "Comic Sans MS", cursive`, bulle, enseigne };
}

/**
 * LES IMAGES DE SON FANTÔME, bouche fermée → grande ouverte, même cadre. Par
 * défaut, le chef du Bordeaux ; au comptoir, le fantôme de son métier (ses
 * poses « repos », « parle-1 », « parle-2 »).
 */
export const CHEF_DU_BORDEAUX = [0, 1, 2, 3].map((k) => `${DOSSIER}/chef-${k}.webp`);
export const chefEnPied = (dossier: string) => ["repos", "parle-1", "parle-2", "parle-2"].map((p) => `${dossier}${p}.webp`);

export async function chargerElements(ctx: BaseAudioContext, imagesDuChef: string[] = CHEF_DU_BORDEAUX): Promise<Elements> {
  const quatre = (nom: string) => Promise.all([0, 1, 2, 3].map((k) => image(`${DOSSIER}/${nom}-${k}.webp`)));
  const [reporter, chef, ardoise, bande, grain, logo, voix, gril, craie, cloches, souffle, police] = await Promise.all([
    quatre("reporter"),
    Promise.all(imagesDuChef.map(image)),
    image(`${DOSSIER}/ardoise.webp`),
    image(`${DOSSIER}/ardoise-bande.webp`),
    image(`${DOSSIER}/grain-craie.webp`),
    image("/clikme-logo-blanc.png"),
    chargerVoix(ctx),
    son(ctx, `${DOSSIER}/gril.mp3`),
    son(ctx, `${DOSSIER}/craie.mp3`),
    son(ctx, `${DOSSIER}/cloches.mp3`),
    son(ctx, `${DOSSIER}/souffle.mp3`),
    polices(),
  ]);
  const bouche = {} as Record<IdReplique, Float32Array>;
  for (const id of IDS_REPLIQUES) bouche[id] = ouvertures(voix.voix[id]);
  return {
    reporter,
    chef,
    ardoise,
    bande,
    grain,
    logo,
    voix: voix.voix,
    bouche,
    sourceVoix: voix.source,
    sons: { gril, craie, cloches, souffle },
    police,
  };
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
  images: HTMLImageElement[],
  p: Place,
  t: number,
  ouverture: number,
  angle = 0,
  alpha = 1,
) {
  if (alpha <= 0) return;
  const img = images[Math.min(3, Math.round(borne(ouverture) * 3))];
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

/**
 * UNE IMAGE (le chef filmé, sa photo, sa vidéo) RECADRÉE POUR REMPLIR UN
 * RECTANGLE sans la déformer, un peu au-dessus du milieu — c'est là que sont
 * les visages, debout derrière un comptoir. `zoom` > 1 resserre (le lent
 * travelling sur une photo).
 */
function couvrir(
  c2d: CanvasRenderingContext2D,
  src: CanvasImageSource,
  sw: number,
  sh: number,
  x: number,
  y: number,
  w: number,
  h: number,
  zoom = 1,
  focus = 0.38,
) {
  if (!sw || !sh) {
    c2d.fillStyle = "#14110F";
    c2d.fillRect(x, y, w, h);
    return;
  }
  const s = Math.max(w / sw, h / sh) * zoom;
  const cw = w / s;
  const ch = h / s;
  c2d.drawImage(src, (sw - cw) / 2, (sh - ch) * focus, cw, ch, x, y, w, h);
}

const tailleDe = (m: HTMLVideoElement | HTMLImageElement): [number, number] =>
  m instanceof HTMLVideoElement ? [m.videoWidth, m.videoHeight] : [m.naturalWidth, m.naturalHeight];

/** Son visage dans un médaillon, pendant que sa photo ou sa vidéo passe en grand. */
function medaillon(c2d: CanvasRenderingContext2D, v: HTMLVideoElement, cx: number, cy: number, r: number, alpha: number) {
  if (alpha <= 0) return;
  c2d.save();
  c2d.globalAlpha = alpha;
  c2d.shadowColor = "rgba(0,0,0,.45)";
  c2d.shadowBlur = 18;
  c2d.beginPath();
  c2d.arc(cx, cy, r + 6, 0, Math.PI * 2);
  c2d.fillStyle = "#fff";
  c2d.fill();
  c2d.shadowColor = "transparent";
  c2d.beginPath();
  c2d.arc(cx, cy, r, 0, Math.PI * 2);
  c2d.clip();
  const [vw, vh] = tailleDe(v);
  couvrir(c2d, v, vw, vh, cx - r, cy - r, 2 * r, 2 * r, 1.05, 0.32);
  c2d.restore();
}

function noir(c2d: CanvasRenderingContext2D, a: number) {
  if (a <= 0) return;
  c2d.save();
  c2d.globalAlpha = borne(a);
  c2d.fillStyle = "#000";
  c2d.fillRect(0, 0, LARGEUR, HAUTEUR);
  c2d.restore();
}

/* ═══ LA CLOCHE DU RESTAURANT ══════════════════════════════════════════════
 *
 * L'étape 1 de l'expérience (`boutique/experience-table.tsx`), rejouée dans la
 * vidéo : les mêmes images, aux mêmes places — en fractions du cadre, qui a la
 * proportion de la salle (9 × 16, comme la vidéo) —, et le même mouvement de
 * la cloche. Seule différence : personne ne la touche, elle se soulève toute
 * seule, et le plat apparaît dessous.
 */
const RESTAURANT = {
  salle: "/direct/table/restaurant/salle.webp",
  cloche: "/direct/table/restaurant/cloche-cuivre.webp",
  assis: "/direct/double/assis/montre.webp",
};
/** Un pixel CSS de l'expérience vue sur un téléphone de 390 px de large, en pixels de la vidéo. */
const PX = LARGEUR / 390;
/** La place laissée autour de la cloche pour son ombre. */
const MARGE_OMBRE = 80;
const TITRE_CLOCHE = { texte: "Qu’est-ce que le chef te prépare aujourd’hui", fin: " ?", haut: 124 * (HAUTEUR / 844) };

/** Tout ce qui ne bouge pas, dessiné une fois : sur un téléphone, une ombre floue par image coûte cher. */
type DecorCloche = {
  /** Étape 1 : la salle, son voile, le fantôme assis et son nom brodé, le pied de page. */
  fond: HTMLCanvasElement;
  /** La cloche et son ombre (MARGE_OMBRE tout autour). */
  cloche: HTMLCanvasElement;
  titre: { toile: HTMLCanvasElement; marge: number };
  fleche: HTMLCanvasElement;
  /** Étape 2 : la même salle, remontée d'un quart et assombrie, sous son voile. */
  fond2: HTMLCanvasElement;
  /** Le plat en pleine largeur, fondu en haut et en bas — ou sa scène, l'assiette et son fantôme. */
  plat: { toile: HTMLCanvasElement; y: number };
  /** « ♥ Le coup de cœur du chef ». */
  badge: HTMLCanvasElement;
  /** Le trait, le nom du plat et son prix. */
  carte: HTMLCanvasElement;
  /** Le bas de la cloche (milieu) et sa taille. */
  g: { cx: number; bas: number; w: number; h: number };
};

/** `cubic-bezier()` du CSS, pour rejouer les mêmes mouvements. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const f = (u: number, a: number, b: number) => 3 * (1 - u) * (1 - u) * u * a + 3 * (1 - u) * u * u * b + u * u * u;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let bas = 0;
    let haut = 1;
    let u = x;
    for (let i = 0; i < 22; i++) {
      u = (bas + haut) / 2;
      if (f(u, x1, x2) < x) bas = u;
      else haut = u;
    }
    return f(u, y1, y2);
  };
}
/** `xrSouleve` : cubic-bezier(.3,.1,.3,1). */
const SOULEVE = bezier(0.3, 0.1, 0.3, 1);
const SORTIE = bezier(0, 0, 0.58, 1);
const EASE = bezier(0.25, 0.1, 0.25, 1);

/** Les lignes d'un titre, équilibrées comme `text-wrap: balance`. */
function lignesEquilibrees(c2d: CanvasRenderingContext2D, texte: string, largeur: number): string[] {
  const coupe = (l: number) => couperLignes(c2d, texte, l);
  const n = coupe(largeur).length;
  let bas = largeur / Math.max(1, n);
  let haut = largeur;
  for (let i = 0; i < 14; i++) {
    const m = (bas + haut) / 2;
    if (coupe(m).length > n) bas = m;
    else haut = m;
  }
  return coupe(haut);
}

/** Un point d'une courbe de Bézier quadratique, et sa direction. */
function surCourbe(arc: readonly Pt[], t: number) {
  const [p0, p1, p2] = arc;
  const u = 1 - t;
  return {
    x: u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    y: u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    a: Math.atan2(2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]), 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0])),
  };
}
function longueursArc(arc: readonly Pt[], n = 80): number[] {
  const cum = [0];
  let avant = surCourbe(arc, 0);
  for (let i = 1; i <= n; i++) {
    const q = surCourbe(arc, i / n);
    cum.push(cum[i - 1] + Math.hypot(q.x - avant.x, q.y - avant.y));
    avant = q;
  }
  return cum;
}

/** LE TEXTE POSÉ LETTRE À LETTRE SUR LA COURBE, centré — le `textPath` de l'expérience, à la main. */
function texteSurCourbe(c2d: CanvasRenderingContext2D, texte: string, arc: readonly Pt[], peindre: (ch: string, x: number) => void) {
  const cum = longueursArc(arc);
  const L = cum[cum.length - 1];
  const lettres = [...texte];
  const largeurs = lettres.map((ch) => c2d.measureText(ch).width);
  let s = (L - largeurs.reduce((a, b) => a + b, 0)) / 2;
  lettres.forEach((ch, i) => {
    const mi = s + largeurs[i] / 2;
    let j = 1;
    while (j < cum.length - 1 && cum[j] < mi) j++;
    const t = (j - 1 + (mi - cum[j - 1]) / Math.max(1e-6, cum[j] - cum[j - 1])) / (cum.length - 1);
    const p = surCourbe(arc, borne(t));
    c2d.save();
    c2d.translate(p.x, p.y);
    c2d.rotate(p.a);
    peindre(ch, -largeurs[i] / 2);
    c2d.restore();
    s += largeurs[i];
  });
}

/**
 * SON NOM BRODÉ SUR LA CASQUETTE ET LE TABLIER, par-dessus l'image posée en
 * `x, y, w, h` — les arcs, la taille et le fil crème de l'expérience.
 */
function broderie(c2d: CanvasRenderingContext2D, nom: string, x: number, y: number, w: number, h: number, police: string) {
  const b = BRODERIE.montre;
  const lignes = lignesDuNom(nom);
  const arcs = arcsDuNom(b.arc, lignes.length).map((arc) => arc.map(([u, v]) => [x + u * w, y + v * h] as Pt));
  let taille = (lignes.length === 1 ? 0.074 : 0.05) * h;
  c2d.font = `italic 400 ${taille}px ${police}`;
  lignes.forEach((l, i) => {
    const place = longueursArc(arcs[i]).pop()! * 0.98;
    const long = c2d.measureText(l).width;
    if (long > place) taille = Math.min(taille, (taille * place) / long);
  });
  const fil = c2d.createLinearGradient(x + 0.3 * w, y, x + 0.75 * w, y + 0.06 * h);
  fil.addColorStop(0, "#F7EEDF");
  fil.addColorStop(0.55, "#EADCC5");
  fil.addColorStop(1, "#BFAE93");
  const brode = (dessiner: (peindre: (ch: string, x0: number) => void) => void, t: number, couleur: string | CanvasGradient) => {
    c2d.save();
    c2d.font = `italic 400 ${t}px ${police}`;
    c2d.textBaseline = "alphabetic";
    c2d.shadowColor = "rgba(0,0,0,.55)";
    c2d.shadowBlur = Math.max(1, h / 1010);
    c2d.shadowOffsetY = (1.6 * h) / 1010;
    c2d.lineWidth = t * 0.07;
    c2d.strokeStyle = "rgba(30,18,10,.55)";
    c2d.fillStyle = couleur;
    // LE CONTOUR D'ABORD, PUIS LE FIL : « paint-order: stroke » de l'expérience
    dessiner((ch, x0) => c2d.strokeText(ch, x0, 0));
    c2d.shadowColor = "transparent";
    dessiner((ch, x0) => c2d.fillText(ch, x0, 0));
    c2d.restore();
  };
  lignes.forEach((l, i) => brode((peindre) => texteSurCourbe(c2d, l, arcs[i], peindre), taille, fil));
  // le plastron du tablier
  const [tx, ty, tl, tr] = b.tablier;
  let f = 0.044 * h;
  c2d.font = `italic 400 ${f}px ${police}`;
  const long = c2d.measureText(nom).width;
  if (long > tl * w) f = (f * tl * w) / long;
  c2d.save();
  c2d.translate(x + tx * w, y + ty * h);
  c2d.rotate((tr * Math.PI) / 180);
  c2d.font = `italic 400 ${f}px ${police}`;
  const lt = c2d.measureText(nom).width;
  brode((peindre) => peindre(nom, -lt / 2), f, "#E6D7C0");
  c2d.restore();
}

/**
 * LE PLAT DE L'ÉTAPE 2, EN PLEINE LARGEUR — `.xr-plat-photo` de l'expérience.
 * « Le plat est entouré de flou au lieu d'être dans son assiette » : un ovale,
 * puis une carte posée sur la table, ne valaient pas l'étape 2. On fait comme
 * elle : SA SCÈNE quand le restaurant en a une (l'assiette servie, son fantôme
 * assis derrière — composée une fois pour toutes), sinon SA PHOTO, telle
 * qu'il l'a prise, sur toute la largeur, fondue dans la nuit en haut et en bas.
 */
function platPleinePage(img: HTMLImageElement, scene: boolean): { toile: HTMLCanvasElement; y: number } {
  const W = LARGEUR;
  const h = scene ? (W * img.naturalHeight) / img.naturalWidth : 0.48 * HAUTEUR;
  const c = toile(W, h);
  const g = c.getContext("2d")!;
  if (scene) g.drawImage(img, 0, 0, W, h);
  else couvrir(g, img, img.naturalWidth, img.naturalHeight, 0, 0, W, h, 1, 0.6);
  // le fondu, comme le `mask-image` du CSS (scène : 7 % / 90 % ; photo : 9 % / 84 %)
  const [haut, bas] = scene ? [0.07, 0.9] : [0.09, 0.84];
  const m = g.createLinearGradient(0, 0, 0, h);
  m.addColorStop(0, "rgba(0,0,0,0)");
  m.addColorStop(haut, "rgba(0,0,0,1)");
  m.addColorStop(bas, "rgba(0,0,0,1)");
  m.addColorStop(1, "rgba(0,0,0,0)");
  g.globalCompositeOperation = "destination-in";
  g.fillStyle = m;
  g.fillRect(0, 0, W, h);
  return { toile: c, y: (scene ? 0.158 : 0.13) * HAUTEUR };
}

/**
 * LA SCÈNE DE L'ÉTAPE 1, PRÉPARÉE : les places du CSS de l'expérience
 * (`.xr-cloche` left 3 %, bottom 33 %, width 76 % ; `.xr-fant.montre` right
 * −8 %, bottom 40 % ; le titre à 124 px du haut), dans le cadre
 * de la vidéo, qui a la proportion de la salle. Rejette si une image manque —
 * la vidéo se monte alors sans la cloche, et l'écran d'essai le dit.
 */
async function preparerCloche(
  quoi: { photo: string; scene?: string },
  r: Reglages,
  police: Elements["police"],
): Promise<DecorCloche> {
  // SA SCÈNE SI ELLE EXISTE ET SE CHARGE ; sinon sa photo
  const vue = quoi.scene ? await image(quoi.scene).then((img) => ({ img, scene: true })).catch(() => null) : null;
  const [salle, cloche, assis, plat] = await Promise.all([
    image(RESTAURANT.salle),
    image(RESTAURANT.cloche),
    image(RESTAURANT.assis),
    vue ? Promise.resolve(vue) : image(quoi.photo).then((img) => ({ img, scene: false })),
  ]);
  const W = LARGEUR;
  const H = HAUTEUR;

  // LE FOND : la salle, le voile de l'étape 1, le fantôme assis qui montre la cloche, son nom brodé
  const fond = toile(W, H);
  const f = fond.getContext("2d")!;
  couvrir(f, salle, salle.naturalWidth, salle.naturalHeight, 0, 0, W, H, 1, 0.5);
  const voile = f.createLinearGradient(0, 0, 0, H);
  voile.addColorStop(0, "rgba(18,12,9,.7)");
  voile.addColorStop(0.3, "rgba(18,12,9,.25)");
  voile.addColorStop(0.55, "rgba(18,12,9,.1)");
  voile.addColorStop(1, "rgba(18,12,9,.7)");
  f.fillStyle = voile;
  f.fillRect(0, 0, W, H);
  // UN PEU PLUS GRAND QUE LES 24 % DU CSS : un téléphone est plus haut que la vidéo
  // (390 × 844 contre 9 × 16), et c'est à côté de la cloche qu'on le juge — sur le
  // téléphone, il fait les sept dixièmes de sa largeur.
  const fh = 0.27 * H;
  const fw = (fh * assis.naturalWidth) / assis.naturalHeight;
  const fx = 1.08 * W - fw;
  const fy = 0.6 * H - fh;
  f.save();
  f.shadowColor = "rgba(0,0,0,.45)";
  f.shadowOffsetY = 10 * PX;
  f.shadowBlur = 14 * PX;
  f.drawImage(assis, fx, fy, fw, fh);
  f.restore();
  broderie(f, r.commerce, fx, fy, fw, fh, police.enseigne);
  // « Une rencontre avec … », entre deux traits, en bas — sur les deux étapes
  const piedDePage = (g: CanvasRenderingContext2D) => {
    g.save();
    g.font = `500 ${15 * PX}px ${police.bulle}`;
    g.fillStyle = "#F3E2D0";
    g.textAlign = "center";
    g.textBaseline = "middle";
    const pied = `Une rencontre avec ${r.commerce}`;
    const yPied = H - 44;
    g.fillText(pied, W / 2, yPied);
    const lp = g.measureText(pied).width;
    const trait = Math.max(14 * PX, Math.min(56 * PX, (W - lp) / 2 - 24 * PX - 30));
    g.fillStyle = "rgba(255,244,230,.4)";
    g.fillRect(W / 2 - lp / 2 - 12 * PX - trait, yPied - 1, trait, 2);
    g.fillRect(W / 2 + lp / 2 + 12 * PX, yPied - 1, trait, 2);
    g.restore();
  };
  piedDePage(f);

  // LA CLOCHE ET SON OMBRE (`drop-shadow(0 16px 16px rgba(0,0,0,.55))`)
  const w = 0.76 * W;
  const h = (w * cloche.naturalHeight) / cloche.naturalWidth;
  const cl = toile(w + 2 * MARGE_OMBRE, h + 2 * MARGE_OMBRE);
  const c = cl.getContext("2d")!;
  c.shadowColor = "rgba(0,0,0,.55)";
  c.shadowOffsetY = 16 * PX;
  c.shadowBlur = 16 * PX;
  c.drawImage(cloche, MARGE_OMBRE, MARGE_OMBRE, w, h);
  const cx = 0.03 * W + w / 2;
  const bas = 0.67 * H;

  // LE TITRE, avec son « ? » rose
  const taille = 0.094 * W;
  const largeur = W - 2 * 22 * PX;
  const interligne = taille * 1.08;
  const t0 = toile(1, 1).getContext("2d")!;
  const policeTitre = `800 ${taille}px ${police.bulle}`;
  t0.font = policeTitre;
  const lignes = lignesEquilibrees(t0, TITRE_CLOCHE.texte + TITRE_CLOCHE.fin, largeur);
  const marge = 60;
  const ti = toile(W, lignes.length * interligne + 2 * marge);
  const tc = ti.getContext("2d")!;
  tc.font = policeTitre;
  if ("letterSpacing" in tc) tc.letterSpacing = `${-0.025 * taille}px`;
  tc.textBaseline = "middle";
  tc.shadowColor = "rgba(0,0,0,.6)";
  tc.shadowOffsetY = 4 * PX;
  tc.shadowBlur = 26 * PX;
  lignes.forEach((l, i) => {
    const derniere = i === lignes.length - 1 && l.endsWith(TITRE_CLOCHE.fin);
    const blanc = derniere ? l.slice(0, -TITRE_CLOCHE.fin.length) : l;
    const lb = tc.measureText(blanc).width;
    const lr = derniere ? tc.measureText(TITRE_CLOCHE.fin).width : 0;
    const x = (W - lb - lr) / 2;
    const y = marge + interligne * (i + 0.5);
    tc.fillStyle = "#FFF4E6";
    tc.fillText(blanc, x, y);
    if (derniere) {
      tc.fillStyle = ROSE;
      tc.fillText(TITRE_CLOCHE.fin, x + lb, y);
    }
  });

  // LA FLÈCHE ROSE, qui luit
  const fl = toile(120, 120);
  const fc = fl.getContext("2d")!;
  fc.font = `800 ${30 * PX}px ${police.bulle}`;
  fc.textAlign = "center";
  fc.textBaseline = "middle";
  fc.fillStyle = ROSE;
  fc.shadowColor = "rgba(255,46,154,.7)";
  fc.shadowBlur = 12 * PX;
  fc.fillText("↑", 60, 60);

  // ═══ L'ÉTAPE 2 ═══ la salle remontée d'un quart (`.xr-plan.remonte`), assombrie, sous le voile de l'étape 2
  const fond2 = toile(W, H);
  const f2 = fond2.getContext("2d")!;
  f2.fillStyle = "#120C09";
  f2.fillRect(0, 0, W, H);
  couvrir(f2, salle, salle.naturalWidth, salle.naturalHeight, 0, -0.24 * H, W, H, 1, 0.5);
  f2.fillStyle = "rgba(0,0,0,.22)"; // `brightness(.78)`
  f2.fillRect(0, 0, W, H);
  const voile2 = f2.createLinearGradient(0, 0, 0, H);
  voile2.addColorStop(0, "rgba(18,12,9,.6)");
  voile2.addColorStop(0.22, "rgba(18,12,9,0)");
  voile2.addColorStop(0.46, "rgba(18,12,9,0)");
  voile2.addColorStop(0.64, "rgba(18,12,9,.75)");
  voile2.addColorStop(0.82, "rgba(18,12,9,.97)");
  voile2.addColorStop(1, "#120C09");
  f2.fillStyle = voile2;
  f2.fillRect(0, 0, W, H);
  piedDePage(f2);

  // « ♥ Le coup de cœur du chef » (`.xr-badge`)
  const tb = 16 * PX;
  const t1 = toile(1, 1).getContext("2d")!;
  t1.font = `700 ${tb}px ${police.bulle}`;
  const motBadge = "Le coup de cœur du chef";
  const bw = 14 * PX + 22 * PX + 10 * PX + t1.measureText(motBadge).width + 18 * PX;
  const bh = 42 * PX;
  const badge = toile(bw + 4, bh + 4);
  const bc = badge.getContext("2d")!;
  cheminArrondi(bc, 2, 2, bw, bh, bh / 2);
  bc.fillStyle = "rgba(18,12,9,.72)";
  bc.fill();
  bc.lineWidth = 1.5 * PX;
  bc.strokeStyle = ROSE;
  bc.stroke();
  bc.save();
  bc.translate(2 + 14 * PX, 2 + (bh - 22 * PX) / 2);
  bc.scale((22 * PX) / 24, (22 * PX) / 24);
  bc.fillStyle = ROSE;
  bc.fill(new Path2D("M12 20s-7.5-4.6-9.2-9.3C1.6 7.4 3.8 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.2 0 5.4 2.9 4.2 6.2C19.5 15.4 12 20 12 20Z"));
  bc.restore();
  bc.font = `700 ${tb}px ${police.bulle}`;
  bc.fillStyle = "#FFF4E6";
  bc.textBaseline = "middle";
  bc.fillText(motBadge, 2 + 14 * PX + 22 * PX + 10 * PX, 2 + bh / 2);

  // LE TRAIT, LE NOM DU PLAT ET SON PRIX (`.xr-trait`, `.xr-plat`, `.xr-prix`)
  const ca = toile(W, 220);
  const cc = ca.getContext("2d")!;
  const trait2 = cc.createLinearGradient(W * 0.3, 0, W * 0.7, 0);
  trait2.addColorStop(0, "rgba(255,244,230,0)");
  trait2.addColorStop(0.5, "rgba(255,244,230,.4)");
  trait2.addColorStop(1, "rgba(255,244,230,0)");
  cc.fillStyle = trait2;
  cc.fillRect(W * 0.3, 10, W * 0.4, 2);
  cc.textAlign = "center";
  cc.textBaseline = "middle";
  cc.font = `600 ${20 * PX}px ${police.bulle}`;
  cc.fillStyle = "#FFF4E6";
  const lignesPlat = couperLignes(cc, r.plat.trim(), W - 90).slice(0, 2);
  lignesPlat.forEach((l, i) => cc.fillText(l, W / 2, 62 + i * 44));
  if (r.prix.trim()) {
    cc.font = `400 ${17 * PX}px ${police.bulle}`;
    cc.fillStyle = "#E8D5C2";
    cc.fillText(r.prix.trim(), W / 2, 62 + lignesPlat.length * 44 + 8);
  }

  return {
    fond,
    cloche: cl,
    titre: { toile: ti, marge },
    fleche: fl,
    fond2,
    plat: platPleinePage(plat.img, plat.scene),
    badge,
    carte: ca,
    g: { cx, bas, w, h },
  };
}

/**
 * LA DÉCOUVERTE, IMAGE PAR IMAGE — les deux premières étapes de l'expérience.
 * Étape 1 : le titre monte, la flèche sautille, puis à `CLOCHE.leve` la cloche
 * se soulève (`xrSouleve`, 0,85 s) et la lueur s'allume (`xrLueur`, 0,9 s).
 * Étape 2, à la fin du geste comme dans l'application (0,9 s) : la salle
 * remonte en fondu, le plat arrive (`xrArrive`), le badge monte (`xrMonte`),
 * puis son nom et son prix.
 */
function decouverte(c2d: CanvasRenderingContext2D, d: DecorCloche, t: number) {
  const { cx, bas, w, h } = d.g;
  const a = t - CLOCHE.leve;
  /** Le temps de l'étape 2. */
  const b = a - 0.9;
  const deux = doux(b / 0.6);

  // ═══ ÉTAPE 1 ═══
  if (deux < 1) {
    c2d.drawImage(d.fond, 0, 0);

    // LA LUEUR, derrière la cloche
    if (a > 0) {
      const p = a / 0.9;
      const echelle = 0.6 + 1.8 * SORTIE(p);
      const op = p < 0.5 ? SORTIE(p / 0.5) : 1 - 0.1 * SORTIE((p - 0.5) / 0.5);
      const lw = 0.8 * w;
      const lh = 0.6 * h;
      c2d.save();
      c2d.globalAlpha = op;
      c2d.translate(cx, bas - 0.08 * h - lh / 2);
      c2d.scale(echelle, (echelle * lh) / lw);
      const g = c2d.createRadialGradient(0, 0, 0, 0, 0, lw / 2);
      g.addColorStop(0, "rgba(255,226,170,.95)");
      g.addColorStop(0.5, "rgba(255,176,90,.5)");
      g.addColorStop(1, "rgba(255,176,90,0)");
      c2d.fillStyle = g;
      c2d.fillRect(-lw / 2, -lw / 2, lw, lw);
      c2d.restore();
    }

    // LA CLOCHE : posée, puis `xrSouleve` — elle se décolle, puis s'envole en tournant
    const p = a / 0.85;
    if (p < 1) {
      let tx = 0;
      let ty = 0;
      let r = 0;
      if (p > 0 && p < 0.3) {
        const q = SOULEVE(p / 0.3);
        ty = -14 * PX * q;
        r = -2 * q;
      } else if (p >= 0.3) {
        const q = SOULEVE((p - 0.3) / 0.7);
        tx = 0.18 * w * q;
        ty = -14 * PX + (-1.5 * h + 14 * PX) * q;
        r = -2 - 22 * q;
      }
      c2d.save();
      c2d.globalAlpha = 1 - SOULEVE(borne(p));
      c2d.translate(cx + tx, bas + ty);
      c2d.rotate((r * Math.PI) / 180);
      c2d.drawImage(d.cloche, -w / 2 - MARGE_OMBRE, -h - MARGE_OMBRE);
      c2d.restore();
    }

    // LA FLÈCHE, tant que la cloche est posée (`xrHop`, 1,4 s)
    if (a < 0) {
      const saut = 8 * PX * (0.5 - 0.5 * Math.cos((t / 1.4) * 2 * Math.PI));
      c2d.save();
      c2d.globalAlpha = entree(t, 0.3, 0.3);
      c2d.drawImage(d.fleche, cx - d.fleche.width / 2, bas - h - 16 * PX - saut - d.fleche.height / 2);
      c2d.restore();
    }

    // LE TITRE (`xrMonte`, 0,7 s)
    const m = EASE(borne(t / 0.7));
    c2d.save();
    c2d.globalAlpha = m;
    c2d.drawImage(d.titre.toile, 0, TITRE_CLOCHE.haut - d.titre.marge + 14 * PX * (1 - m));
    c2d.restore();
  }

  // ═══ ÉTAPE 2 ═══
  if (deux > 0) {
    c2d.save();
    c2d.globalAlpha = deux;
    c2d.drawImage(d.fond2, 0, 0);
    c2d.restore();

    // LE PLAT (`xrArrive`, 0,6 s : il monte de 20 px et grandit de 4 %), puis la caméra s'en approche
    const k = EASE(borne(b / 0.6));
    if (k > 0) {
      const zoom = (0.96 + 0.04 * k) * (1 + 0.04 * borne((b - 0.6) / 3.4));
      const pl = d.plat;
      c2d.save();
      c2d.globalAlpha = k;
      c2d.translate(LARGEUR / 2, pl.y + pl.toile.height / 2 + 20 * PX * (1 - k));
      c2d.scale(zoom, zoom);
      c2d.drawImage(pl.toile, -LARGEUR / 2, -pl.toile.height / 2);
      c2d.restore();
    }

    // LE BADGE (`xrMonte`, 0,6 s) — une fois le titre de l'étape 1 effacé
    const kb = EASE(borne((b - 0.45) / 0.6));
    if (kb > 0) {
      c2d.save();
      c2d.globalAlpha = kb;
      c2d.drawImage(d.badge, 0.05 * LARGEUR, (112 / 844) * HAUTEUR + 14 * PX * (1 - kb));
      c2d.restore();
    }

    // SON NOM ET SON PRIX
    const n = doux((b - 0.5) / 0.5);
    if (n > 0) {
      c2d.save();
      c2d.globalAlpha = n;
      c2d.drawImage(d.carte, 0, 0.655 * HAUTEUR + 16 * (1 - n));
      c2d.restore();
    }
  }

  noir(c2d, 1 - t / 0.3);
  noir(c2d, (t - (CLOCHE.duree - 0.35)) / 0.35);
}

/* ═══ LE MONTAGE ═══════════════════════════════════════════════════════════ */

export type Reglages = {
  commerce: string;
  ville: string;
  plat: string;
  prix: string;
  /** Où était le reporter sur l'aperçu, pendant l'interview. */
  coteApercu: Cote;
  /** Le chef filmé, ou son fantôme à sa place. */
  mode: Mode;
  /**
   * La photo de son plat : la vidéo s'ouvre alors sur la cloche qu'on soulève.
   * `scene` : l'assiette servie avec son fantôme derrière, quand le restaurant
   * en a une (l'étape 2 de l'expérience la montre à la place de la photo).
   */
  cloche: { photo: string; scene?: string } | null;
};

/** La photo ou la vidéo qu'il a ajoutée à une question, après l'interview. */
export type Media = { genre: "photo" | "video"; url: string };

export type PriseAMonter = {
  /** La vidéo de la prise — `null` quand il n'a enregistré que sa voix. */
  url: string | null;
  question: IdQuestion;
  /** Ce que dit le reporter, en secondes depuis le début de la prise. */
  paroles: { id: IdReplique; debut: number }[];
  questionFin: number;
  /** Où couper la prise : la fin de sa parole, plus un souffle. */
  coupe: number;
  /** Le son de la prise, décodé — `null` si le téléphone n'a pas su. */
  audio: AudioBuffer | null;
  /** La bouche de son fantôme, trente valeurs par seconde de prise (quand il ne se montre pas). */
  bouche: Float32Array | null;
  sousTitres: SousTitre[];
  media: Media | null;
};

export type Montage = {
  blob: Blob;
  type: string;
  duree: number;
  /** Ce qui a servi pour le son des réponses, prise par prise. */
  sonDesReponses: ("fichier" | "lecteur" | "aucun")[];
  /** La photo ou la vidéo de chaque réponse : montrée, absente, ou illisible par ce téléphone. */
  mediaDesReponses: ("montre" | "aucun" | "illisible")[];
  /** La cloche du restaurant : montrée, pas demandée, ou sa photo illisible. */
  cloche: "montree" | "aucune" | "illisible";
};

type Segment = { genre: "ouverture" } | { genre: "cloche" } | { genre: "prise"; k: number } | { genre: "fin" };
type MediaPret = { genre: "photo"; img: HTMLImageElement } | { genre: "video"; v: HTMLVideoElement };

/** Un lecteur muet, prêt à donner ses images. */
function lecteurMuet(url: string, boucle = false): Promise<HTMLVideoElement> {
  return new Promise((ok) => {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.loop = boucle;
    v.setAttribute("playsinline", "");
    v.preload = "auto";
    // VISIBLE, MAIS À PEINE : un lecteur caché du tout n'avance plus ses images sur certains téléphones.
    Object.assign(v.style, { position: "fixed", left: "0", top: "0", width: "2px", height: "2px", opacity: "0.01", pointerEvents: "none" });
    const fini = () => ok(v);
    v.addEventListener("loadeddata", fini, { once: true });
    v.addEventListener("error", fini, { once: true });
    setTimeout(fini, 5000);
    v.src = url;
    document.body.appendChild(v);
  });
}

export async function monter(o: {
  ctx: AudioContext;
  el: Elements;
  prises: PriseAMonter[];
  reglages: Reglages;
  toile: HTMLCanvasElement;
  /** Le commerçant entend-il le montage pendant qu'il se fabrique ? */
  ecouter: boolean;
  surProgres?: (p: number) => void;
  /** L'image d'attente du lecteur : l'ardoise du jour, une fois écrite, avec le reporter. */
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
  const enFantome = reglages.mode === "fantome";

  /* ─── les lecteurs (muets) et les photos ─── */
  const lecteurs = await Promise.all(prises.map((p) => (p.url ? lecteurMuet(p.url) : Promise.resolve(null))));
  const medias: (MediaPret | null)[] = await Promise.all(
    prises.map(async (p): Promise<MediaPret | null> => {
      if (!p.media) return null;
      if (p.media.genre === "photo") {
        const img = await image(p.media.url).catch(() => null);
        return img ? { genre: "photo", img } : null;
      }
      const v = await lecteurMuet(p.media.url, true);
      return v.videoWidth ? { genre: "video", v } : null;
    }),
  );
  // LA CLOCHE : préparée une fois ; une photo illisible et la vidéo s'en passe
  const decor = reglages.cloche ? await preparerCloche(reglages.cloche, reglages, el.police).catch(() => null) : null;

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
    } else {
      if (off >= buf.duration) return;
      s.start(q, off);
    }
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
  // LA LONGUEUR PRÉVUE : l'ouverture, la cloche, ses réponses coupées, la fin — voir `debitDuMontage`.
  const prevue = 7 + (decor ? CLOCHE.duree : 0) + prises.reduce((t, p) => t + p.coupe, 0) + 6;
  const rec = new MediaRecorder(flux, {
    ...(format ? { mimeType: format } : {}),
    videoBitsPerSecond: debitDuMontage(prevue),
    audioBitsPerSecond: DEBIT_SON,
  });
  const morceaux: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size) morceaux.push(e.data);
  };
  const arrete = new Promise<void>((ok) => (rec.onstop = () => ok()));

  /* ─── le plan ─── */
  // LE BONJOUR ET L'AU REVOIR : nommés pour Le Bordeaux, sans nom de lieu ailleurs
  const LIEU = repliquesDuLieu(reglages.commerce);
  const dOuv = dureeOuverture(el.voix[LIEU.bonjour].duration);
  const dFin = dureeFin(el.voix[LIEU.adieu].duration);
  const estime = dOuv + (decor ? CLOCHE.duree : 0) + prises.reduce((s, p) => s + p.coupe, 0) + dFin;
  // LE RESTAURANT : après le bonjour du reporter, on soulève la cloche, puis on revient à l'interview
  const segments: Segment[] = [
    { genre: "ouverture" },
    ...(decor ? [{ genre: "cloche" as const }] : []),
    ...prises.map((_, k) => ({ genre: "prise" as const, k })),
    { genre: "fin" },
  ];
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
    ...(reglages.ville.trim() ? [{ b: craie.bloc(reglages.ville, 42, 400), cy: 312, debut: 0.95, duree: 0.3 }] : []),
  ];
  const bulles = new Map<string, Bulle>();
  const bulle = (texte: string) => {
    let b = bulles.get(texte);
    if (!b) bulles.set(texte, (b = fabriquerBulle(texte, el.police.bulle)));
    return b;
  };
  const texteDe = (paroles: { id: IdReplique }[]) => paroles.map((p) => REPLIQUES[p.id]).join(" ");
  const TITRES = Object.fromEntries(QUESTIONS.map((q) => [q.id, q.titre])) as Record<IdQuestion, string>;
  const mention = `Essai ${MARQUE} · la voix du reporter est une voix de synthèse`;

  /* les places : le reporter grand quand il demande, petit au coin quand le chef répond ;
     le fantôme du chef dans le haut, de l'autre côté, quand c'est lui qui parle */
  const GRAND_ARD: Place = { cx: 360, bas: 1262, h: 560 };
  const GRAND: Place = { cx: aGauche ? 225 : 495, bas: 1266, h: 470 };
  const PETIT: Place = { cx: aGauche ? 128 : 592, bas: 1272, h: 265 };
  const CHEF_HAUT: Place = { cx: aGauche ? 505 : 215, bas: 808, h: 440 };
  const REPORTER_FIN: Place = { cx: 200, bas: 1262, h: 460 };
  const CHEF_FIN: Place = { cx: 525, bas: 1262, h: 440 };
  /** Le milieu de la place laissée à la craie, à côté du petit reporter. */
  const X_TEXTE = aGauche ? 478 : 242;
  const mi = (a: Place, b: Place, q: number): Place => ({ cx: a.cx + (b.cx - a.cx) * q, bas: a.bas + (b.bas - a.bas) * q, h: a.h + (b.h - a.h) * q });
  const bouche = (id: IdReplique, t: number) => {
    const b = el.bouche[id];
    const i = Math.floor(t * IPS);
    return i >= 0 && i < b.length ? b[i] : 0;
  };
  const boucheReporter = (paroles: { id: IdReplique; debut: number }[], t: number) => {
    for (const p of paroles) if (t >= p.debut && t < p.debut + el.voix[p.id].duration) return bouche(p.id, t - p.debut);
    return 0;
  };

  /* ─── chaque image ─── */
  const ouverture = (t: number) => {
    c2d.drawImage(el.ardoise, 0, 0, LARGEUR, HAUTEUR);
    for (const m of MENU) ecrire(c2d, m.b, LARGEUR / 2, m.cy, doux((t - m.debut) / m.duree));
    trait(c2d, el, LARGEUR / 2, 334, 300, doux((t - 1.2) / 0.35));
    const arrivee = entree(t, 0.3, 0.7);
    const place = { ...GRAND_ARD, bas: GRAND_ARD.bas + 900 * (1 - arrivee) };
    dessinerFantome(c2d, el.reporter, place, t, bouche(LIEU.bonjour, t - OUVERTURE.voix));
    etincelles(c2d, 360, 900, t - 0.4);
    const al = entree(t, OUVERTURE.voix - 0.15, 0.2) * (1 - entree(t, OUVERTURE.voix + el.voix[LIEU.bonjour].duration + 0.25, 0.2));
    dessinerBulle(c2d, bulle(REPLIQUES[LIEU.bonjour]), 360, place.bas - place.h * 0.97, 360, al);
    noir(c2d, 1 - t / 0.3);
  };

  /** Le haut d'une prise sans visage ni photo : l'ardoise, et le plat du jour écrit dessus. */
  const fondArdoise = (tc: number) => {
    couvrir(c2d, el.ardoise, el.ardoise.naturalWidth, el.ardoise.naturalHeight, 0, 0, LARGEUR, HAUT_VIDEO, 1, 0);
    ecrire(c2d, craie.bloc(reglages.plat, 46, 700, CRAIE_J, 600), LARGEUR / 2, 112, doux(tc / 0.8));
  };
  const dessinerMedia = (m: MediaPret, k: number, tc: number, alpha: number) => {
    c2d.save();
    c2d.globalAlpha = alpha;
    if (m.genre === "photo") {
      // UNE PHOTO NE RESTE PAS FIGÉE : elle avance doucement, comme une caméra qui s'approche du plat
      couvrir(c2d, m.img, m.img.naturalWidth, m.img.naturalHeight, 0, 0, LARGEUR, HAUT_VIDEO, 1 + 0.09 * borne(tc / prises[k].coupe), 0.5);
    } else couvrir(c2d, m.v, m.v.videoWidth, m.v.videoHeight, 0, 0, LARGEUR, HAUT_VIDEO, 1, 0.5);
    c2d.restore();
  };

  const prise = (k: number, tc: number, tl: number) => {
    const p = prises[k];
    const m = medias[k];
    const v = lecteurs[k];
    const repond = tc - (p.questionFin + 0.05);
    // LE HAUT : son visage pendant la question et au début de sa réponse, puis ce qu'il montre
    const partMedia = m ? (enFantome ? 1 : entree(repond, 1.2, 0.45)) : 0;
    if (v && partMedia < 1) couvrir(c2d, v, v.videoWidth, v.videoHeight, 0, 0, LARGEUR, HAUT_VIDEO);
    else if (!v && !m) fondArdoise(tc);
    if (m && partMedia > 0) dessinerMedia(m, k, tc, partMedia);
    if (v && m) medaillon(c2d, v, aGauche ? LARGEUR - 150 : 150, 168, 116, partMedia);
    const voile = c2d.createLinearGradient(0, HAUT_VIDEO - 110, 0, HAUT_VIDEO);
    voile.addColorStop(0, "rgba(10,8,6,0)");
    voile.addColorStop(1, "rgba(10,8,6,.6)");
    c2d.fillStyle = voile;
    c2d.fillRect(0, HAUT_VIDEO - 110, LARGEUR, 110);
    c2d.drawImage(el.bande, 0, HAUT_VIDEO, LARGEUR, HAUTEUR - HAUT_VIDEO);

    // L'ARDOISE : la question en titre, puis ce qu'il dit, à la craie
    const avecSousTitres = p.sousTitres.length > 0;
    const titre = avecSousTitres ? craie.bloc(TITRES[p.question], 32, 400, CRAIE_DOUCE, 430) : craie.bloc(TITRES[p.question], 54, 700, CRAIE, 430);
    ecrire(c2d, titre, X_TEXTE, avecSousTitres ? 848 : 1018, doux((repond - 0.05) / 0.5));
    let reaction = 0;
    p.sousTitres.forEach((s, j) => {
      const suivant = j + 1 < p.sousTitres.length ? p.sousTitres[j + 1].debut : s.fin + 0.8;
      if (tc >= s.debut && tc < s.debut + 0.35) reaction = 4 * Math.sin((tc - s.debut) * 22);
      if (tc < s.debut - 0.05 || tc >= suivant - 0.05) return;
      const b = craie.bloc(s.texte, 40, 700, CRAIE, 430, 50);
      ecrire(c2d, b, X_TEXTE, 1040, doux((tc - s.debut + 0.05) / Math.max(0.35, Math.min(0.8, (s.fin - s.debut) * 0.6))), 1 - entree(tc, suivant - 0.17, 0.12));
    });

    // SON FANTÔME, quand il ne se montre pas : dans le haut, et il parle avec SA voix
    if (enFantome) {
      const i = Math.floor(tc * IPS);
      const ouv = repond > 0 && p.bouche && i < p.bouche.length ? p.bouche[i] : 0;
      dessinerFantome(c2d, el.chef, CHEF_HAUT, tc + 0.7, ouv, 2 * Math.sin(tc * 1.3) + (repond > 0 ? reaction * 0.6 : 0));
    }

    // LE REPORTER : grand quand il demande, petit au coin pendant la réponse
    const place = mi(GRAND, PETIT, entree(repond, 0, 0.4));
    let angle = enFantome ? 0 : reaction;
    if (!avecSousTitres && repond > 0) angle = 2.5 * Math.sin(tc * 1.7) * Math.max(0, Math.sin(tc * 0.45));
    dessinerFantome(c2d, el.reporter, place, tc, boucheReporter(p.paroles, tc), angle);
    const debutQ = p.paroles[0]?.debut ?? 0;
    const al = entree(tc, debutQ - 0.1, 0.2) * (1 - entree(tc, p.questionFin + 0.2, 0.2));
    const teteY = place.bas - place.h * 0.97;
    dessinerBulle(c2d, bulle(texteDe(p.paroles)), place.cx + (aGauche ? 110 : -110), teteY + 6, place.cx + (aGauche ? 30 : -30), al);
    noir(c2d, 1 - tl / 0.25);
  };

  const fin = (t: number) => {
    c2d.drawImage(el.ardoise, 0, 0, LARGEUR, HAUTEUR);
    for (const m of ADIEU) ecrire(c2d, m.b, LARGEUR / 2, m.cy, doux((t - m.debut) / m.duree));
    const finVoix = FIN.voix + el.voix[LIEU.adieu].duration;
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
    // ils apparaissent, le reporter dit « à demain », puis un petit salut
    const e = 0.7 + 0.3 * entree(t, 0, 0.35);
    const salut = t - (finVoix + 0.2);
    const saut = salut > 0 ? 40 * Math.abs(Math.sin((Math.min(salut, 1.2) * Math.PI) / 0.6)) * (1 - (Math.min(salut, 1.2) / 1.2) * 0.3) : 0;
    const angle = salut > 0 ? 7 * Math.sin(salut * 9) * Math.max(0, 1 - salut / 1.6) : 0;
    const placeR = enFantome ? REPORTER_FIN : GRAND_ARD;
    if (enFantome) dessinerFantome(c2d, el.chef, { ...CHEF_FIN, h: CHEF_FIN.h * e, bas: CHEF_FIN.bas - saut * 0.8 }, t + 0.7, 0, -angle * 0.8);
    dessinerFantome(c2d, el.reporter, { ...placeR, h: placeR.h * e, bas: placeR.bas - saut }, t, bouche(LIEU.adieu, t - FIN.voix), angle);
    etincelles(c2d, 360, 920, t - 0.05, 220);
    etincelles(c2d, 360, 900, salut, 300);
    const al = entree(t, FIN.voix - 0.15, 0.2) * (1 - entree(t, finVoix + 0.25, 0.2));
    dessinerBulle(c2d, bulle(REPLIQUES[LIEU.adieu]), placeR.cx, placeR.bas - placeR.h * 0.97 + 10, placeR.cx, al);
    noir(c2d, (t - (dFin - 0.5)) / 0.5);
  };

  /* ─── les sons de chaque temps, posés quand il commence ─── */
  const sonsOuverture = (t0: number) => {
    niveauLit(t0, 0.42, 0.6);
    for (const m of MENU) crayon(t0 + m.debut, m.duree);
    crayon(t0 + 1.2, 0.35, 0.6);
    jouer(el.sons.souffle, t0 + 0.15, 0.55);
    jouer(el.sons.cloches, t0 + 0.35, 0.5);
    jouer(el.voix[LIEU.bonjour], t0 + OUVERTURE.voix, 0.95);
  };
  const sonsFin = (t0: number) => {
    niveauLit(t0, 0.4, 0.4);
    lit.gain.setValueAtTime(0.4, t0 + dFin - 0.9);
    lit.gain.linearRampToValueAtTime(0, t0 + dFin);
    for (const m of ADIEU) crayon(t0 + m.debut, m.duree);
    jouer(el.sons.souffle, t0, 0.5);
    jouer(el.voix[LIEU.adieu], t0 + FIN.voix, 0.95);
    jouer(el.sons.cloches, t0 + FIN.voix + el.voix[LIEU.adieu].duration + 0.25, 0.55);
  };
  const sonsCloche = (t0: number) => {
    niveauLit(t0, 0.3, 0.5);
    jouer(el.sons.souffle, t0 + CLOCHE.leve, 0.55);
    jouer(el.sons.cloches, t0 + CLOCHE.leve + 0.3, 0.55);
  };
  /** Une prise : appelé quand elle démarre vraiment, `zero` = l'heure de son début. */
  const sonsPrise = (k: number, zero: number, v: HTMLVideoElement | null) => {
    const p = prises[k];
    niveauLit(ctx.currentTime, 0.16, 0.5);
    jouer(el.sons.souffle, ctx.currentTime, 0.3);
    for (const pa of p.paroles) jouer(el.voix[pa.id], zero + pa.debut, 0.95);
    crayon(zero + p.questionFin + 0.1, 0.5, 0.6);
    for (const s of p.sousTitres) crayon(zero + s.debut, Math.max(0.35, Math.min(0.8, (s.fin - s.debut) * 0.6)), 0.45);
    // SA RÉPONSE : muette pendant la question (le micro a entendu le reporter
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
      const depuis = v ? v.currentTime : Math.max(0, ctx.currentTime - zero);
      s.start(ctx.currentTime, Math.min(p.audio.duration - 0.01, depuis));
      s.stop(zero + p.coupe + 0.05);
      sources.push(s);
      sonDesReponses[k] = "fichier";
    } else if (v) {
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
  let mediaLance = false;
  let derniere = -1;
  let bloqueDepuis = 0;
  let affiche = false;
  let erreur: Error | null = null;

  await new Promise<void>((fini) => {
    const suivant = (maintenant: number) => {
      const s = segments[seg];
      if (s.genre === "prise") {
        lecteurs[s.k]?.pause();
        const m = medias[s.k];
        if (m?.genre === "video") m.v.pause();
      }
      seg += 1;
      debutSeg = maintenant;
      lance = false;
      sonsPoses = false;
      mediaLance = false;
      if (seg >= segments.length) return fini();
      if (segments[seg].genre === "cloche") sonsCloche(maintenant);
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
      } else if (s.genre === "cloche") {
        if (dessiner && decor) decouverte(c2d, decor, Math.max(0, t));
        if (t >= CLOCHE.duree) suivant(maintenant);
      } else if (s.genre === "prise") {
        const v = lecteurs[s.k];
        const p = prises[s.k];
        const m = medias[s.k];
        let tc = t;
        if (v) {
          // FILMÉ : la vidéo mène, et le son se cale sur elle quand elle tourne vraiment
          if (!lance) {
            lance = true;
            bloqueDepuis = maintenant;
            v.currentTime = 0;
            v.play().catch(() => {
              /* muet : la lecture ne devrait jamais être refusée — sinon, le garde-fou ci-dessous passe la prise */
            });
          }
          tc = v.currentTime;
          if (tc > 0.02 && !sonsPoses) {
            sonsPoses = true;
            sonsPrise(s.k, maintenant - tc, v);
          }
          if (tc > 0.02) bloqueDepuis = maintenant;
        } else if (!sonsPoses) {
          // SA VOIX SEULE : c'est l'horloge qui mène
          sonsPoses = true;
          sonsPrise(s.k, debutSeg, null);
        }
        if (m?.genre === "video" && !mediaLance && (enFantome || tc - p.questionFin > 1.1)) {
          mediaLance = true;
          m.v.currentTime = 0;
          m.v.play().catch(() => {});
        }
        if (dessiner) prise(s.k, tc, t);
        if (tc >= p.coupe || (v && (v.ended || maintenant - bloqueDepuis > 3))) suivant(maintenant);
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
  await attendre(150);
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
  const aRanger = [...lecteurs, ...medias.map((m) => (m?.genre === "video" ? m.v : null))];
  for (const v of aRanger) {
    if (!v) continue;
    v.pause();
    v.removeAttribute("src");
    v.load();
    v.remove();
  }
  flux.getTracks().forEach((t) => t.stop());
  if (erreur) throw erreur;
  const type = rec.mimeType || format || "video/webm";
  // UNE VIDÉO QUE CE TÉLÉPHONE NE SAIT PAS LIRE NE DISPARAÎT PAS EN SILENCE : l'écran d'essai le dit
  const mediaDesReponses = prises.map((p, k) => (!p.media ? "aucun" : medias[k] ? "montre" : "illisible")) as Montage["mediaDesReponses"];
  const cloche: Montage["cloche"] = !reglages.cloche ? "aucune" : decor ? "montree" : "illisible";
  return { blob: new Blob(morceaux, { type }), type, duree: ctx.currentTime - T0, sonDesReponses, mediaDesReponses, cloche };
}
