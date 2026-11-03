/**
 * 🎬 LE MONTAGE DU STUDIO — fait par le téléphone, sous les yeux du commerçant, comme l'interview.
 *
 * C'est `outils/clikme-studio/lili-ross/scene.html` (et `figurine.js`) redessiné sur une toile, image par image : la
 * même scène, les mêmes temps, les mêmes courbes. Ce qui était des balises HTML posées par `poser(T)` est ici dessiné
 * par `dessiner(T)` : la vidéo et sa caméra, les coupes en zoom flouté, le retour en arrière, les textes qui montent
 * d'un masque, le polaroïd, la carte de fin, et la figurine sur son ressort.
 *
 * ─── POURQUOI DANS LE TÉLÉPHONE ──────────────────────────────────────────
 *
 * Pour la même raison que l'interview (`interview-montage.ts`) : un serveur qui monte une vidéo pendant des minutes,
 * l'hébergement du site ne sait pas le faire ; le téléphone sait dessiner trente images par seconde et les
 * enregistrer avec leur son. Le film se joue donc une fois (21 s, 24,5 avec la figurine) et c'est cet
 * enregistrement qui devient la vidéo.
 *
 * ─── SA VIDÉO, PAR DEUX LECTEURS ─────────────────────────────────────────
 *
 * Un lecteur qui saute à un autre instant met jusqu'à un tiers de seconde à repartir. Les plans (`plansDuFilm`) se
 * jouent donc à tour de rôle sur DEUX lecteurs muets : pendant que l'un joue un plan, l'autre attend, déjà calé sur
 * le suivant. Le retour en arrière et le polaroïd n'ont pas besoin de lecteur : ce sont des images figées, tirées de
 * sa vidéo avant le montage.
 *
 * FICHIER NAVIGATEUR.
 */
import { formatVideo, lecteurMuet } from "./interview-montage";
import {
  APPELS_T,
  INTRO_FIGURINE,
  NB_MOMENTS,
  TEMPS,
  bullesDeLaFigurine,
  debutChapitre,
  dureeDuFilm,
  enDeuxLignes,
  finDeSource,
  numero,
  plansDuFilm,
  propre,
  MAX_NOM_MOMENT,
  type Plan,
  type TextesStudio,
} from "./studio";
import { fabriquerMusiqueStudio } from "./studio-musique";

/** Le film se dessine sur 1080 × 1920 (les mesures de l'atelier) ; la toile, elle, fait 720 × 1280. */
const W = 1080;
const H = 1920;
export const LARGEUR_STUDIO = 720;
export const HAUTEUR_STUDIO = 1280;
const ECHELLE = LARGEUR_STUDIO / W;
const IPS = 30;

// ─── petits outils (ceux de scene.html) ─────────────────────────────────────────────────────────
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t: number, a: number, b: number) => cl((t - a) / (b - a));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const oCub = (k: number) => 1 - Math.pow(1 - k, 3);
const oQui = (k: number) => 1 - Math.pow(1 - k, 5);
const iCub = (k: number) => k * k * k;
const ioCub = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const oBack = (k: number, s = 1.6) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);
const pts = (t: number, liste: [number, number][]) => {
  if (t <= liste[0][0]) return liste[0][1];
  for (let i = 1; i < liste.length; i++)
    if (t <= liste[i][0]) {
      const [a, va] = liste[i - 1];
      const [b, vb] = liste[i];
      return lerp(va, vb, (t - a) / (b - a));
    }
  return liste[liste.length - 1][1];
};
const hasard = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const ressortAmorti = (t: number, ampl: number, tau: number, f: number) => (t < 0 ? 0 : ampl * Math.exp(-t / tau) * Math.cos(2 * Math.PI * f * t));
const tangage = (t: number, ampl: number, tau: number, f: number) => (t < 0 ? 0 : ampl * Math.exp(-t / tau) * Math.sin(2 * Math.PI * f * t));

function toile(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}
function ctx2d(c: HTMLCanvasElement): CanvasRenderingContext2D {
  const g = c.getContext("2d");
  if (!g) throw new Error("Ce téléphone ne sait pas dessiner la vidéo.");
  return g;
}

// ─── les éléments : polices, fantôme, socle, figurine ───────────────────────────────────────────

export type ElementsStudio = {
  /** Playfair Display italique (titres) et Poppins (petites capitales), ou leurs replis. */
  serif: string;
  sans: string;
  fantome: HTMLImageElement | null;
  /** La figurine : son buste détouré, et le socle commun en bois. `null` : le film sans figurine. */
  figurine: { corps: HTMLImageElement; socle: HTMLImageElement } | null;
};

function image(src: string): Promise<HTMLImageElement | null> {
  return new Promise((ok) => {
    const i = new Image();
    if (/^https?:/i.test(src) && !src.startsWith(window.location.origin)) i.crossOrigin = "anonymous";
    i.onload = () => ok(i);
    i.onerror = () => ok(null);
    i.src = src;
  });
}

const POLICES: [string, string, string, string][] = [
  ["Studio PF", "playfair-display-latin-600-italic", "600", "italic"],
  ["Studio PF", "playfair-display-latin-700-italic", "700", "italic"],
  ["Studio PF", "playfair-display-latin-800-italic", "800", "italic"],
  ["Studio PO", "poppins-latin-500-normal", "500", "normal"],
  ["Studio PO", "poppins-latin-600-normal", "600", "normal"],
  ["Studio PO", "poppins-latin-700-normal", "700", "normal"],
];

/** Les polices de l'atelier (servies par le site : `public/studio/f/`, licence SIL OFL jointe). */
async function polices(): Promise<{ serif: string; sans: string }> {
  let pf = 0;
  let po = 0;
  if (typeof FontFace !== "undefined") {
    await Promise.all(
      POLICES.map(async ([nom, fichier, poids, style]) => {
        try {
          const f = new FontFace(nom, `url(/studio/f/${fichier}.woff2) format("woff2")`, { weight: poids, style });
          await f.load();
          document.fonts.add(f);
          if (nom === "Studio PF") pf++;
          else po++;
        } catch {
          /* la police de repli fera l'affaire */
        }
      }),
    );
  }
  return {
    serif: pf ? `"Studio PF", Georgia, serif` : "Georgia, 'Times New Roman', serif",
    sans: po ? `"Studio PO", system-ui, sans-serif` : "system-ui, -apple-system, sans-serif",
  };
}

export async function chargerStudio(figurine: string | null): Promise<ElementsStudio> {
  const [p, fantome, corps, socle] = await Promise.all([
    polices(),
    image("/clikme-fantome.png"),
    figurine ? image(figurine) : Promise.resolve(null),
    figurine ? image("/studio/socle.webp") : Promise.resolve(null),
  ]);
  return { ...p, fantome, figurine: corps && socle ? { corps, socle } : null };
}

// ─── sa vidéo : ce qu'elle dure, ses images figées ──────────────────────────────────────────────

export type InfosVideo = { duree: number; largeur: number; hauteur: number };

/** Ce que dure sa vidéo, et sa taille. Une vidéo enregistrée par un navigateur annonce parfois une durée infinie. */
export function lireLaVideo(url: string): Promise<InfosVideo> {
  return new Promise((ok, ko) => {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    const fini = () => {
      v.removeAttribute("src");
      v.load();
    };
    const lu = () => {
      if (Number.isFinite(v.duration) && v.duration > 0) {
        const r = { duree: v.duration, largeur: v.videoWidth || 720, hauteur: v.videoHeight || 1280 };
        fini();
        ok(r);
        return true;
      }
      return false;
    };
    v.addEventListener("loadedmetadata", () => {
      if (lu()) return;
      v.addEventListener("durationchange", () => void lu());
      v.currentTime = 1e7;
    });
    v.addEventListener("error", () => ko(new Error("Cette vidéo ne se lit pas sur ce téléphone.")));
    setTimeout(() => ko(new Error("Cette vidéo met trop de temps à s'ouvrir.")), 15000);
    v.src = url;
  });
}

function caler(v: HTMLVideoElement, s: number): Promise<void> {
  return new Promise((ok) => {
    if (Math.abs(v.currentTime - s) < 0.02 && v.readyState >= 2) {
      ok();
      return;
    }
    const fin = () => {
      v.removeEventListener("seeked", fin);
      clearTimeout(minute);
      ok();
    };
    const minute = setTimeout(fin, 3000);
    v.addEventListener("seeked", fin);
    v.currentTime = s;
  });
}

/** Des images figées de sa vidéo, aux instants voulus, sur une toile de `largeur` pixels. */
export async function imagesDe(url: string, temps: number[], largeur: number): Promise<HTMLCanvasElement[]> {
  const v = await lecteurMuet(url);
  try {
    const out: HTMLCanvasElement[] = [];
    for (const s of temps) {
      await caler(v, Math.max(0, s));
      const iw = v.videoWidth || 720;
      const ih = v.videoHeight || 1280;
      const c = toile(largeur, (largeur * ih) / iw);
      try {
        ctx2d(c).drawImage(v, 0, 0, c.width, c.height);
      } catch {
        /* une image manquante reste noire */
      }
      out.push(c);
    }
    return out;
  } finally {
    v.pause();
    v.remove();
  }
}

// ─── l'écriture ─────────────────────────────────────────────────────────────────────────────────

type Ecrire = { police: string; couleur: string; espace?: number; align?: CanvasTextAlign };

/** Un texte, avec un espacement entre les lettres (en em) — lettre par lettre, pour que tous les téléphones le fassent. */
function ecrire(g: CanvasRenderingContext2D, texte: string, x: number, y: number, o: Ecrire) {
  g.font = o.police;
  g.textBaseline = "alphabetic";
  const taille = parseFloat(/(\d+(?:\.\d+)?)px/.exec(o.police)?.[1] ?? "40");
  const esp = (o.espace ?? 0) * taille;
  if (!esp) {
    g.textAlign = o.align ?? "left";
    g.fillStyle = o.couleur;
    g.fillText(texte, x, y);
    return;
  }
  const lettres = [...texte];
  const larg = lettres.reduce((n, l) => n + g.measureText(l).width + esp, -esp);
  let cx = o.align === "center" ? x - larg / 2 : o.align === "right" ? x - larg : x;
  g.textAlign = "left";
  g.fillStyle = o.couleur;
  for (const l of lettres) {
    g.fillText(l, cx, y);
    cx += g.measureText(l).width + esp;
  }
}

function largeurDe(g: CanvasRenderingContext2D, texte: string, police: string, espace = 0): number {
  g.font = police;
  const taille = parseFloat(/(\d+(?:\.\d+)?)px/.exec(police)?.[1] ?? "40");
  if (!espace) return g.measureText(texte).width;
  const lettres = [...texte];
  return lettres.reduce((n, l) => n + g.measureText(l).width + espace * taille, -espace * taille);
}

/** La taille qui fait tenir `textes` dans `largeur`, sans dépasser `max` ni descendre sous `min`. */
function tailleQuiTient(g: CanvasRenderingContext2D, textes: string[], police: (t: number) => string, max: number, min: number, largeur: number): number {
  let t = max;
  while (t > min && Math.max(...textes.map((x) => largeurDe(g, x, police(t)))) > largeur) t -= 2;
  return t;
}

/** Les lignes d'un paragraphe qui tient dans `largeur`. */
function lignes(g: CanvasRenderingContext2D, texte: string, police: string, largeur: number): string[] {
  g.font = police;
  const out: string[] = [];
  let cur = "";
  for (const mot of texte.split(" ")) {
    const essai = cur ? `${cur} ${mot}` : mot;
    if (cur && g.measureText(essai).width > largeur) {
      out.push(cur);
      cur = mot;
    } else cur = essai;
  }
  if (cur) out.push(cur);
  return out;
}

/** Un texte qui monte d'un masque : on ne voit que sa ligne, il entre par le bas (k de 0 à 1). */
function monteDuMasque(g: CanvasRenderingContext2D, k: number, haut: number, y: number, dessin: (dy: number) => void) {
  g.save();
  g.beginPath();
  g.rect(-W, y - haut, 3 * W, haut * 1.32);
  g.clip();
  dessin((1 - k) * haut * 1.1);
  g.restore();
}

// ─── la scène ───────────────────────────────────────────────────────────────────────────────────

type Scene = {
  el: ElementsStudio;
  /** Les deux polices (celles de `el`, à portée de main). */
  serif: string;
  sans: string;
  textes: TextesStudio;
  noms: string[];
  plans: Plan[];
  /** Avec la figurine, le film commence après son intro. */
  D: number;
  total: number;
  /** La taille de sa vidéo posée en plein écran (« cover »), et son décalage. */
  W0: number;
  H0: number;
  L0: number;
  T0: number;
  /** Les images du retour en arrière (de la fin vers le premier moment), l'image figée du polaroïd. */
  retour: HTMLCanvasElement[];
  fige: HTMLCanvasElement | null;
  grain: HTMLCanvasElement;
  vignette: HTMLCanvasElement;
  lignesTv: HTMLCanvasElement;
  bulles: ReturnType<typeof bullesDeLaFigurine>;
  /** Pour les flous : une petite toile réutilisée. */
  petit: HTMLCanvasElement;
};

function fabriquerGrain(): HTMLCanvasElement {
  const t = toile(256, 256);
  const g = ctx2d(t);
  const d = g.createImageData(256, 256);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = 128 + (hasard(i * 0.71) - 0.5) * 140;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  g.putImageData(d, 0, 0);
  return t;
}

function fabriquerVignette(): HTMLCanvasElement {
  const t = toile(W / 4, H / 4);
  const g = ctx2d(t);
  g.scale(0.25, 0.25);
  const v = g.createRadialGradient(W / 2, H * 0.45, H * 0.38, W / 2, H * 0.45, H * 0.72);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,.42)");
  g.fillStyle = v;
  g.fillRect(0, 0, W, H);
  return t;
}

function fabriquerLignes(): HTMLCanvasElement {
  const t = toile(8, 6);
  const g = ctx2d(t);
  g.fillStyle = "rgba(255,255,255,.07)";
  g.fillRect(0, 0, 8, 2);
  return t;
}

/** Où poser sa vidéo, au zoom z, le point (fx, fy) de l'image restant immobile — sans jamais montrer un bord. */
function placeVideo(S: Scene, z: number, fx: number, fy: number) {
  const px = S.L0 + fx * S.W0;
  const py = S.T0 + fy * S.H0;
  const w = S.W0 * z;
  const h = S.H0 * z;
  let l = px - fx * w;
  let t = py - fy * h;
  l = Math.min(0, Math.max(W - w, l));
  t = Math.min(0, Math.max(H - h, t));
  return { l, t, w, h };
}

/** Les zooms des cinq chapitres : poussée lente, coup de zoom, recul… (temps depuis le début du chapitre). */
const ZOOMS: [number, number][][] = [
  [
    [0, 1.0],
    [2, 1.07],
  ],
  [
    [0, 1.0],
    [1.2, 1.035],
  ],
  [
    [0, 1.03],
    [2, 1.1],
  ],
  [
    [0, 1.0],
    [0.5, 1.04],
    [2, 1.15],
  ],
  [
    [0, 1.06],
    [2, 1.0],
  ],
];
/** Le point qu'on garde immobile : un peu au-dessus du centre, là où l'on tient ce qu'on montre. */
const POINT = { fx: 0.5, fy: 0.42 };

function camera(tf: number): { z: number; fx: number; fy: number } {
  if (tf < TEMPS.accroche) return { z: lerp(1.1, 1.16, oCub(seg(tf, 0, 2))), fx: 0.5, fy: 0.4 };
  if (tf < TEMPS.retour) return { z: 1.04, ...POINT };
  for (let k = 0; k < NB_MOMENTS; k++) {
    const a = debutChapitre(k);
    if (tf < a + TEMPS.chapitre) {
      const u = tf - a;
      let z = pts(u, ZOOMS[k]);
      if (k === 1 && u >= 1.2) z = lerp(1.035, 1.16, oQui(seg(u, 1.2, 1.36))) + 0.03 * seg(u, 1.36, 2);
      return { z, ...POINT };
    }
  }
  return { z: lerp(1.12, 1.0, ioCub(seg(tf, TEMPS.voila, TEMPS.declic))), fx: 0.5, fy: 0.4 };
}

const COUPES = [4.5, 6.5, 8.5, 10.5, 12.5];

/** Une image de sa vidéo, posée avec la caméra, et ses effets (glissement, flou, grossissement). */
function dessinerSource(
  g: CanvasRenderingContext2D,
  S: Scene,
  src: CanvasImageSource,
  p: { l: number; t: number; w: number; h: number },
  dx: number,
  sc: number,
  flou: number,
  alpha = 1,
) {
  g.save();
  g.globalAlpha = alpha;
  g.translate(W / 2 + dx, H / 2);
  g.scale(sc, sc);
  g.translate(-W / 2, -H / 2);
  if (flou > 0.3) {
    // UN FLOU QUI MARCHE PARTOUT : l'image dessinée en tout petit, puis agrandie
    const f = 1 + flou / 2.2;
    const pc = S.petit;
    pc.width = Math.max(8, Math.round(W / 4 / f));
    pc.height = Math.max(8, Math.round(H / 4 / f));
    const pg = ctx2d(pc);
    pg.drawImage(src, (p.l * pc.width) / W, (p.t * pc.height) / H, (p.w * pc.width) / W, (p.h * pc.height) / H);
    g.imageSmoothingQuality = "high";
    g.drawImage(pc, 0, 0, W, H);
  } else g.drawImage(src, p.l, p.t, p.w, p.h);
  g.restore();
}

// ─── la figurine : où est-elle à l'instant T (celle de figurine.js) ────────────────────────────

type EtatFig = { X: number; Y: number; s: number; L: number; phi: number; sol: number };

function etatFigurine(T: number, D: number): EtatFig | null {
  const flottement = 1.4 * Math.sin(2 * Math.PI * 0.7 * T);
  const sursaut = (tb: number) => -0.08 * Math.sin(Math.PI * seg(T, tb, tb + 0.2));
  if (T < D) {
    const e: EtatFig = { X: 540, Y: 1700, s: 1.0, L: 1, phi: 0, sol: 1700 };
    if (T < 0.3) {
      const k = seg(T, 0, 0.3);
      e.Y = lerp(-120, 1700, k * k);
      e.L = 1.12;
    } else {
      const u = T - 0.3;
      e.L = 1 - ressortAmorti(u, 0.36, 0.3, 2.6) + sursaut(0.55) + sursaut(1.5);
      e.phi = tangage(u, 7, 0.65, 1.3) + flottement * seg(T, 0.6, 1.2);
    }
    if (T >= 2.82) {
      const k = ioCub(seg(T, 2.82, 3.0));
      e.L = lerp(e.L, 0.58, k);
      e.phi = lerp(e.phi, 0, k);
    }
    if (T >= 3.0) {
      const u = T - 3.0;
      e.Y = 1700 - 2600 * u - 6500 * u * u;
      e.L = lerp(0.58, 1.22, oCub(seg(T, 3.0, 3.1)));
    }
    return e;
  }
  // pendant le 2e et le 4e chapitre, elle passe la tête par la droite
  for (const [a, b] of PASSAGES) {
    if (T >= a - 0.01 && T < b) {
      const k = oCub(seg(T, a, a + 0.26));
      const ks = seg(T, b - 0.17, b);
      const u = T - (a + 0.26);
      return {
        X: lerp(1260, 900, k) + 360 * ks * ks,
        Y: 1720 - Math.sin(Math.PI * seg(T, a, a + 0.26)) * 110,
        s: 0.5,
        sol: 1720,
        L: 1 - ressortAmorti(u, 0.25, 0.2, 3) + sursaut(a + 0.23),
        phi: -7 * k + tangage(u, -9, 0.35, 1.7) + 0.6 * flottement,
      };
    }
  }
  const P = D + 15.22; // 18,72 avec l'intro : juste après le déclic, sur le polaroïd
  if (T >= P) {
    const e: EtatFig = { X: 905, Y: 1880, s: 0.42, L: 1, phi: -3, sol: 1880 };
    if (T < P + 0.28) {
      const k = seg(T, P, P + 0.28);
      e.Y = lerp(1000, 1880, k * k);
      e.L = 1.1;
      e.phi = 0;
      return e;
    }
    if (T < P + 3.1) {
      let L = 1 - ressortAmorti(T - (P + 0.28), 0.3, 0.22, 2.8);
      for (const tb of [0.28, 0.78, 1.28, 1.78, 2.28]) L -= Math.max(0, tangage(T - (P + tb), 0.2, 0.12, 2.6));
      e.L = L;
      e.phi = -3 + tangage(T - (P + 0.28), -6, 0.5, 1.4) + 0.8 * flottement;
      return e;
    }
    // le saut jusqu'à la carte de fin
    const k = seg(T, P + 3.23, P + 3.7);
    if (T < P + 3.23) {
      e.L = lerp(1, 0.62, ioCub(seg(T, P + 3.1, P + 3.23)));
      e.phi = lerp(-3, 0, seg(T, P + 3.1, P + 3.23));
      return e;
    }
    if (T < P + 3.7) {
      e.X = lerp(905, 400, k);
      e.s = lerp(0.42, 0.66, k);
      e.Y = lerp(1880, 1600, k) - Math.sin(Math.PI * k) * 520;
      e.sol = lerp(1880, 1600, k);
      e.L = lerp(1.18, 1.0, k);
      e.phi = -10 * Math.sin(Math.PI * k);
      return e;
    }
    const u = T - (P + 3.7);
    return { X: 400, Y: 1600, s: 0.66, sol: 1600, L: 1 - ressortAmorti(u, 0.34, 0.3, 2.6) + sursaut(P + 4.13), phi: tangage(u, 6, 0.7, 1.3) + flottement * seg(T, P + 3.88, P + 4.48) };
  }
  return null;
}
/** Ses deux passages (temps du film avec l'intro), pendant le 2e et le 4e chapitre — ceux de Lili Ross. */
const PASSAGES: [number, number][] = [
  [9.05, 9.95],
  [12.55, 13.9],
];

/**
 * LA FIGURINE, DANS SON REPÈRE : le socle commun (sa bague à 53 % de la largeur, 29 % de la hauteur), le ressort
 * redessiné (onze spires, comme figurine.js), et son buste, accroché au bout du ressort.
 */
const FIG = { socleL: 330, longueur: 150, busteH: 640, busteLmax: 560 };

function dessinerFigurine(g: CanvasRenderingContext2D, S: Scene, e: EtatFig) {
  const f = S.el.figurine;
  if (!f) return;
  const sw = FIG.socleL;
  const sh = (sw * f.socle.naturalHeight) / Math.max(1, f.socle.naturalWidth);
  let bh = FIG.busteH;
  let bw = (bh * f.corps.naturalWidth) / Math.max(1, f.corps.naturalHeight);
  if (bw > FIG.busteLmax) {
    bw = FIG.busteLmax;
    bh = (bw * f.corps.naturalHeight) / Math.max(1, f.corps.naturalWidth);
  }
  // l'ombre au sol
  const haut = cl((e.sol - e.Y) / 700);
  const rx = 200 * e.s * (1 - 0.5 * haut);
  const ry = 32 * e.s * (1 - 0.5 * haut);
  g.save();
  const om = g.createRadialGradient(e.X, e.sol, 0, e.X, e.sol, rx);
  om.addColorStop(0, `rgba(70,20,40,${0.42 * (1 - haut)})`);
  om.addColorStop(1, "rgba(70,20,40,0)");
  g.fillStyle = om;
  g.beginPath();
  g.ellipse(e.X, e.sol, rx, ry, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();

  g.save();
  g.translate(e.X, e.Y);
  g.scale(e.s, e.s);
  // le socle : son bas à (0, 0)
  g.drawImage(f.socle, -sw / 2, -sh, sw, sh);
  const bas = { x: (0.535 - 0.5) * sw, y: -sh * 0.71 };
  const phi = (e.phi * Math.PI) / 180;
  const l = FIG.longueur * e.L;
  const tx = bas.x + l * Math.sin(phi);
  const ty = bas.y - l * Math.cos(phi);
  // le ressort : des demi-ellipses le long d'une courbe, l'arrière sombre, l'avant en acier
  const cx = bas.x;
  const cy = bas.y - Math.hypot(tx - bas.x, ty - bas.y) * 0.5;
  const spires: { px: number; py: number; ang: number }[] = [];
  for (let k = 0; k < 11; k++) {
    const u = (k + 0.5) / 11;
    const px = (1 - u) ** 2 * bas.x + 2 * (1 - u) * u * cx + u * u * tx;
    const py = (1 - u) ** 2 * bas.y + 2 * (1 - u) * u * cy + u * u * ty;
    const dx = 2 * (1 - u) * (cx - bas.x) + 2 * u * (tx - cx);
    const dy = 2 * (1 - u) * (cy - bas.y) + 2 * u * (ty - cy);
    spires.push({ px, py, ang: Math.atan2(dy, dx) + Math.PI / 2 });
  }
  const acier = g.createLinearGradient(bas.x - 24, 0, bas.x + 24, 0);
  acier.addColorStop(0, "#2d2930");
  acier.addColorStop(0.28, "#99939f");
  acier.addColorStop(0.46, "#f4f0f6");
  acier.addColorStop(0.62, "#aaa4b0");
  acier.addColorStop(1, "#36313b");
  g.lineCap = "round";
  for (const [dos, couleur, epais] of [
    [true, "#3b3540", 4.5],
    [false, acier, 6.5],
  ] as const) {
    g.strokeStyle = couleur;
    g.lineWidth = epais;
    for (const sp of spires) {
      g.beginPath();
      g.ellipse(sp.px, sp.py, 23, 5.5, sp.ang, dos ? Math.PI : 0, dos ? 2 * Math.PI : Math.PI);
      g.stroke();
    }
  }
  // le buste, au bout du ressort, penché un peu plus que lui
  g.translate(tx, ty);
  g.rotate(phi * 1.25);
  g.drawImage(f.corps, -bw / 2, -bh + 6, bw, bh);
  g.restore();
}

/** Le haut de sa tête, à l'écran : là où pointent ses bulles. */
function teteDe(S: Scene, e: EtatFig): { x: number; y: number } {
  const f = S.el.figurine;
  if (!f) return { x: e.X, y: e.Y };
  const sh = (FIG.socleL * f.socle.naturalHeight) / Math.max(1, f.socle.naturalWidth);
  const bh = Math.min(FIG.busteH, (FIG.busteLmax * f.corps.naturalHeight) / Math.max(1, f.corps.naturalWidth));
  return { x: e.X, y: e.Y - e.s * (sh * 0.71 + FIG.longueur * e.L + bh) };
}

/**
 * UNE BULLE : au-dessus de sa tête, la pointe vers elle — ou, à la fin, à sa droite (`aDroite`), pour ne pas couvrir
 * la phrase de la carte de fin. Elle se recale pour ne jamais sortir de l'écran.
 */
function bulle(g: CanvasRenderingContext2D, S: Scene, texte: string, cible: { x: number; y: number }, k: number, ks: number, echelle = 1, aDroite = false) {
  if (k <= 0 || ks >= 1) return;
  const police = `600 ${Math.round(56 * echelle)}px ${S.sans}`;
  const tw = largeurDe(g, texte, police);
  const pw = tw + 80 * echelle;
  const ph = 112 * echelle;
  const x = aDroite ? Math.min(cible.x + 90, W - 36 - pw) : cl(cible.x - pw * 0.55, 36, W - 36 - pw);
  const y = aDroite ? cible.y + 150 : Math.max(80, cible.y - 40 * echelle - ph);
  const sc = oBack(cl(k), 2.2) * (1 - 0.6 * ks);
  const qx = cl(cible.x, x + 44, x + pw - 44);
  const origine = aDroite ? { x, y: y + ph / 2 } : { x: qx, y: y + ph + 14 };
  g.save();
  g.globalAlpha = cl(k * 3) * (1 - ks);
  g.translate(origine.x, origine.y);
  g.scale(sc, sc);
  g.translate(-origine.x, -origine.y);
  g.shadowColor = "rgba(90,30,50,.22)";
  g.shadowBlur = 40;
  g.shadowOffsetY = 18;
  g.fillStyle = "#fff";
  g.beginPath();
  g.roundRect(x, y, pw, ph, 46 * echelle);
  g.fill();
  g.shadowColor = "transparent";
  g.beginPath();
  if (aDroite) {
    g.moveTo(x + 2, y + ph / 2 - 18);
    g.lineTo(x - 22, y + ph / 2);
    g.lineTo(x + 2, y + ph / 2 + 18);
  } else {
    g.moveTo(qx - 18, y + ph - 2);
    g.lineTo(qx, y + ph + 22);
    g.lineTo(qx + 18, y + ph - 2);
  }
  g.fill();
  ecrire(g, texte, x + pw / 2, y + ph / 2 + 20 * echelle, { police, couleur: "#3A1F2E", align: "center" });
  g.restore();
}

// ─── une image du film ──────────────────────────────────────────────────────────────────────────

/** L'image de sa vidéo à l'instant (le lecteur qui joue, ou une image figée), si elle est prête. */
type Sources = { image: CanvasImageSource | null };

function dessiner(g: CanvasRenderingContext2D, S: Scene, T: number, n: number, src: Sources) {
  const tf = T - S.D;
  g.setTransform(ECHELLE, 0, 0, ECHELLE, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = "source-over";
  g.fillStyle = "#120A0E";
  g.fillRect(0, 0, W, H);

  if (tf >= 0) dessinerFilm(g, S, tf, n, src);
  if (S.el.figurine) dessinerIntroEtFigurine(g, S, T);

  // le grain qui vit
  g.save();
  g.globalCompositeOperation = "overlay";
  g.globalAlpha = 0.075;
  const ox = Math.floor(hasard(n + 1) * 256);
  const oy = Math.floor(hasard(n + 7) * 256);
  for (let x = -ox; x < W; x += 256) for (let y = -oy; y < H; y += 256) g.drawImage(S.grain, x, y);
  g.restore();
}

function dessinerFilm(g: CanvasRenderingContext2D, S: Scene, tf: number, n: number, src: Sources) {
  const t = S.textes;
  const enRetour = tf >= TEMPS.accroche && tf < TEMPS.retour;
  const polaroid = tf >= TEMPS.declic;

  // ───── sa vidéo, et la caméra ─────
  if (!polaroid || tf < 15.2) {
    const cam = camera(tf);
    const p = placeVideo(S, cam.z, cam.fx, cam.fy);
    let dx = 0;
    let flou = 0;
    let sc = 1;
    for (const c of COUPES) {
      if (tf >= c - 0.12 && tf < c) {
        const k = iCub(seg(tf, c - 0.12, c));
        dx = -k * 90;
        flou = k * 14;
        sc = 1 + k * 0.28;
      }
      if (tf >= c && tf < c + 0.14) {
        const k = 1 - oCub(seg(tf, c, c + 0.14));
        dx = k * 90;
        flou = k * 14;
        sc = 1 + k * 0.28;
      }
    }
    if (enRetour) {
      dx += (hasard(n) - 0.5) * 34;
      const k = seg(tf, TEMPS.accroche, TEMPS.retour);
      const i = Math.min(S.retour.length - 1, Math.floor(k * S.retour.length));
      const im = S.retour[i];
      if (im) {
        g.save();
        g.filter = "saturate(.55) contrast(1.15)";
        dessinerSource(g, S, im, p, dx, sc, flou);
        g.restore();
        // les images fantômes : celles d'avant, en transparence
        for (const j of [1, 2]) {
          const f = S.retour[Math.max(0, i - j)];
          if (!f) continue;
          g.save();
          g.globalCompositeOperation = "screen";
          dessinerSource(g, S, f, p, dx + j * 26, 1, 0, 0.42 / j);
          g.restore();
        }
      }
    } else if (polaroid) {
      if (S.fige) dessinerSource(g, S, S.fige, p, 0, 1, 0);
    } else if (src.image) {
      dessinerSource(g, S, src.image, p, dx, sc, flou);
    } else if (S.fige) dessinerSource(g, S, S.fige, p, dx, sc, flou);
  }

  // assombri pendant l'accroche, dégradé pour les textes, vignettage
  const sombre = tf < TEMPS.accroche ? 0.48 - 0.18 * seg(tf, 1.6, 2.0) : enRetour ? 0.15 : 0;
  if (sombre > 0) {
    g.fillStyle = `rgba(11,5,8,${sombre})`;
    g.fillRect(0, 0, W, H);
  }
  const deg = tf < TEMPS.retour ? 0.6 : tf < TEMPS.declic ? 1 : 0;
  if (deg > 0) {
    const d = g.createLinearGradient(0, 0, 0, H);
    d.addColorStop(0, `rgba(10,4,8,${0.55 * deg})`);
    d.addColorStop(0.16, "rgba(10,4,8,0)");
    d.addColorStop(0.52, "rgba(10,4,8,0)");
    d.addColorStop(1, `rgba(10,4,8,${0.72 * deg})`);
    g.fillStyle = d;
    g.fillRect(0, 0, W, H);
  }
  if (!polaroid) g.drawImage(S.vignette, 0, 0, W, H);
  if (enRetour) {
    g.save();
    const motif = g.createPattern(S.lignesTv, "repeat");
    if (motif) {
      g.fillStyle = motif;
      g.fillRect(0, 0, W, H);
    }
    const by = ((tf - TEMPS.accroche) / 0.5) * 2100 - 120;
    const bande = g.createLinearGradient(0, by, 0, by + 120);
    bande.addColorStop(0, "rgba(255,255,255,0)");
    bande.addColorStop(0.5, "rgba(255,255,255,.22)");
    bande.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = bande;
    g.fillRect(0, by, W, 120);
    // ◀◀ qui clignote
    g.globalAlpha = Math.floor(tf * 12) % 2 ? 1 : 0.35;
    g.font = `700 64px ${S.sans}`;
    g.textAlign = "right";
    g.fillStyle = "rgba(255,60,120,.8)";
    g.fillText("◀◀", W - 80 + 3, 364);
    g.fillStyle = "rgba(60,200,255,.8)";
    g.fillText("◀◀", W - 80 - 3, 364);
    g.fillStyle = "#fff";
    g.fillText("◀◀", W - 80, 364);
    g.restore();
  }

  // ───── l'accroche ─────
  if (tf < TEMPS.accroche) {
    const [l1, l2] = enDeuxLignes(t.titre);
    g.save();
    g.globalAlpha = 1 - seg(tf, 1.78, 1.98);
    const gros = 1 + 0.08 * iCub(seg(tf, 1.72, 2.0));
    g.translate(W / 2, 900);
    g.scale(gros, gros);
    g.translate(-W / 2, -900);
    const petit = oCub(seg(tf, 0.05, 0.45));
    g.save();
    g.globalAlpha *= petit;
    ecrire(g, t.commerce.toLocaleUpperCase("fr-FR"), W / 2, 668, { police: `600 28px ${S.sans}`, couleur: "#FFD3DF", espace: lerp(0.9, 0.5, oCub(seg(tf, 0.05, 0.6))), align: "center" });
    g.restore();
    const taille = tailleQuiTient(g, [l1, l2].filter(Boolean), (x) => `italic 700 ${x}px ${S.serif}`, 200, 90, 980);
    const police = `italic 700 ${taille}px ${S.serif}`;
    [l1, l2].forEach((ligne, i) => {
      if (!ligne) return;
      const y = 712 + taille * 0.86 + i * taille * 1.02;
      monteDuMasque(g, oQui(seg(tf, 0.12 + i * 0.16, 0.62 + i * 0.16)), taille, y, (dy) => {
        g.shadowColor = "rgba(0,0,0,.35)";
        g.shadowBlur = 50;
        g.shadowOffsetY = 10;
        ecrire(g, ligne, W / 2, y + dy, { police, couleur: "#fff", align: "center" });
        g.shadowColor = "transparent";
      });
    });
    const ks = oCub(seg(tf, 0.62, 1.0));
    if (t.sous) {
      const ysous = 712 + taille * 0.86 + (l2 ? taille * 1.02 : 0) + 74;
      g.save();
      g.globalAlpha *= ks;
      const police2 = `500 34px ${S.sans}`;
      const sous = t.sous.toLocaleUpperCase("fr-FR");
      ecrire(g, sous, W / 2, ysous + (1 - ks) * 24, { police: police2, couleur: "#FFB8CC", espace: 0.34, align: "center" });
      const lw = largeurDe(g, sous, police2, 0.34);
      const trait = 70 * oCub(seg(tf, 0.75, 1.2));
      g.fillStyle = "#FFB8CC";
      g.fillRect(W / 2 - lw / 2 - 26 - trait, ysous - 12 + (1 - ks) * 24, trait, 2);
      g.fillRect(W / 2 + lw / 2 + 26, ysous - 12 + (1 - ks) * 24, trait, 2);
      g.restore();
    }
    g.restore();
  }

  // ───── l'en-tête et la progression ─────
  const te = tf < TEMPS.retour ? 0 : tf < TEMPS.voila ? oCub(seg(tf, 2.55, 2.9)) : 1 - seg(tf, 12.5, 12.8);
  if (te > 0) {
    g.save();
    g.globalAlpha = te;
    g.shadowColor = "rgba(0,0,0,.45)";
    g.shadowBlur = 14;
    ecrire(g, t.commerce.toLocaleUpperCase("fr-FR"), W / 2, 176, { police: `600 30px ${S.sans}`, couleur: "#fff", espace: 0.42, align: "center" });
    g.shadowColor = "transparent";
    const x0 = W / 2 - (5 * 96 + 4 * 10) / 2;
    for (let k = 0; k < NB_MOMENTS; k++) {
      const x = x0 + k * 106;
      g.fillStyle = "rgba(255,255,255,.28)";
      g.beginPath();
      g.roundRect(x, 206, 96, 6, 3);
      g.fill();
      const r = seg(tf, debutChapitre(k), debutChapitre(k) + TEMPS.chapitre);
      if (r > 0) {
        g.fillStyle = "#FFB8CC";
        g.beginPath();
        g.roundRect(x, 206, 96 * r, 6, 3);
        g.fill();
      }
    }
    g.restore();
  }

  // ───── les chapitres ─────
  for (let k = 0; k < NB_MOMENTS; k++) {
    const a = debutChapitre(k);
    const b = a + TEMPS.chapitre;
    if (tf < a || tf >= b) continue;
    const u = tf - a;
    const sortie = seg(tf, b - 0.16, b);
    g.save();
    g.globalAlpha = 1 - sortie;
    g.translate(-iCub(sortie) * 160, 0);
    const nom = propre(S.noms[k], MAX_NOM_MOMENT);
    const yTitre = 1490;
    const yNum = nom ? 1370 : 1470;
    const kn = oQui(seg(u, 0.08, 0.5));
    g.save();
    g.globalAlpha *= kn;
    g.font = `italic 800 150px ${S.serif}`;
    g.textAlign = "left";
    g.lineWidth = 2.5;
    g.strokeStyle = "rgba(255,214,226,.95)";
    g.strokeText(numero(k), 76, yNum + (1 - kn) * 60);
    g.restore();
    if (nom) {
      const taille = tailleQuiTient(g, [nom], (x) => `italic 600 ${x}px ${S.serif}`, 96, 52, 930);
      const police = `italic 600 ${taille}px ${S.serif}`;
      monteDuMasque(g, oQui(seg(u, 0.16, 0.62)), taille, yTitre, (dy) => {
        g.shadowColor = "rgba(0,0,0,.45)";
        g.shadowBlur = 30;
        g.shadowOffsetY = 6;
        ecrire(g, nom, 76, yTitre + dy, { police, couleur: "#fff" });
        g.shadowColor = "transparent";
      });
      const ks = oCub(seg(u, 0.36, 0.8));
      g.fillStyle = "#FFB8CC";
      g.fillRect(80, yTitre + 34, 56 * ks, 2);
    }
    g.restore();
  }

  // ───── et voilà ─────
  if (tf >= TEMPS.voila && tf < TEMPS.declic) {
    g.save();
    g.globalAlpha = 1 - seg(tf, 14.3, 14.5);
    const y = 1395;
    monteDuMasque(g, oQui(seg(tf, 12.62, 13.1)), 170, y, (dy) => {
      g.shadowColor = "rgba(0,0,0,.4)";
      g.shadowBlur = 50;
      g.shadowOffsetY = 10;
      ecrire(g, "Et voilà.", W / 2, y + dy, { police: `italic 700 170px ${S.serif}`, couleur: "#fff", align: "center" });
      g.shadowColor = "transparent";
    });
    const k = oCub(seg(tf, 13.0, 13.45));
    g.globalAlpha *= k;
    ecrire(g, t.voila.toLocaleUpperCase("fr-FR"), W / 2, 1478, { police: `500 32px ${S.sans}`, couleur: "#FFD3DF", espace: lerp(0.7, 0.4, k), align: "center" });
    g.restore();
  }

  // ───── le polaroïd ─────
  if (polaroid) dessinerPolaroid(g, S, tf);

  // ───── la fin ─────
  if (tf >= TEMPS.fin) dessinerFin(g, S, tf);

  // ───── le flash blanc (chacun borné dans le temps) ─────
  let fl = 1 - seg(tf, 0, 0.18);
  if (tf >= TEMPS.retour) fl = Math.max(fl, 0.85 * (1 - seg(tf, 2.5, 2.72)));
  for (const c of COUPES) if (tf >= c && tf < c + 0.12) fl = Math.max(fl, 0.25 * (1 - seg(tf, c, c + 0.12)));
  if (tf >= TEMPS.declic) fl = Math.max(fl, 1 - oCub(seg(tf, 14.5, 14.85)));
  if (S.el.figurine && tf < 0.02) fl = 0;
  if (fl > 0.002) {
    g.fillStyle = `rgba(255,255,255,${fl})`;
    g.fillRect(0, 0, W, H);
  }
}

const FEN_W = 560;
const FEN_H = 825;
const BORD = 22;
const BAS_CARTE = 110;
const APPEL_Y = [560, 760, 960, 1160, 1360];

function dessinerPolaroid(g: CanvasRenderingContext2D, S: Scene, tf: number) {
  const t = S.textes;
  const appels = S.noms.map((x, i) => ({ nom: propre(x, MAX_NOM_MOMENT), i })).filter((a) => a.nom);
  const centre = appels.length ? { x: 392, y: 1005 } : { x: 540, y: 1060 };
  // le fond rose poudré
  const kf = seg(tf, 14.6, 14.95);
  if (kf > 0) {
    g.save();
    g.globalAlpha = kf;
    const f = g.createRadialGradient(W * 0.3, H * 0.2, 0, W * 0.3, H * 0.2, H * 0.95);
    f.addColorStop(0, "#FBE7EB");
    f.addColorStop(0.45, "#F6D9DE");
    f.addColorStop(1, "#EFC7CF");
    g.fillStyle = f;
    g.fillRect(0, 0, W, H);
    g.restore();
  }
  // le titre
  const tfo = tf < 18.42 ? oCub(seg(tf, 15.0, 15.3)) : 1 - seg(tf, 18.42, 18.62);
  if (tfo > 0) {
    g.save();
    g.globalAlpha = tfo;
    ecrire(g, t.commerce.toLocaleUpperCase("fr-FR"), W / 2, 316, { police: `600 26px ${S.sans}`, couleur: "#B4657E", espace: lerp(0.8, 0.46, oCub(seg(tf, 15.0, 15.5))), align: "center" });
    const taille = tailleQuiTient(g, [t.complet], (x) => `italic 700 ${x}px ${S.serif}`, 112, 60, 980);
    monteDuMasque(g, oQui(seg(tf, 15.0, 15.45)), taille, 440, (dy) =>
      ecrire(g, t.complet, W / 2, 440 + dy, { police: `italic 700 ${taille}px ${S.serif}`, couleur: "#3A1F2E", align: "center" }),
    );
    g.restore();
  }
  // la carte : de plein écran au polaroïd, tournée, qui s'en va à la fin
  const k = ioCub(seg(tf, 14.62, 15.17));
  const kb = oBack(seg(tf, 14.62, 15.2), 1.1);
  const fw = lerp(W, FEN_W, k);
  const fh = lerp(H, FEN_H, k);
  const bord = lerp(0, BORD, k);
  const basC = lerp(0, BAS_CARTE, k);
  const cw = fw + 2 * bord;
  const ch = fh + bord + basC;
  const cx = lerp(W / 2, centre.x, k);
  const cy = lerp(H / 2, centre.y, k);
  let rot = lerp(0, -2.5, kb) + Math.sin((tf - 15.2) * 0.9) * 0.6 * seg(tf, 15.2, 15.8);
  let sortieY = 0;
  let sortieO = 1;
  if (tf >= 18.42) {
    const ks = seg(tf, 18.42, 18.74) ** 2;
    sortieY = ks * 1500;
    rot += -ks * 16;
    sortieO = 1 - seg(tf, 18.6, 18.74);
  }
  if (sortieO > 0 && S.fige) {
    g.save();
    g.globalAlpha = sortieO;
    g.translate(cx, cy + sortieY);
    g.rotate((rot * Math.PI) / 180);
    if (k > 0) {
      g.shadowColor = `rgba(90,30,50,${0.35 * k})`;
      g.shadowBlur = 80 * k;
      g.shadowOffsetY = 30 * k;
      g.fillStyle = "#FFFDF9";
      g.fillRect(-cw / 2, -ch / 2, cw, ch);
      g.shadowColor = "transparent";
    }
    // la fenêtre : son image figée, posée « cover »
    g.save();
    g.beginPath();
    g.rect(-cw / 2 + bord, -ch / 2 + bord, fw, fh);
    g.clip();
    const iw = S.fige.width;
    const ih = S.fige.height;
    const e = Math.max(fw / iw, fh / ih);
    g.drawImage(S.fige, -cw / 2 + bord + (fw - iw * e) / 2, -ch / 2 + bord + (fh - ih * e) / 2, iw * e, ih * e);
    g.restore();
    const kl = oCub(seg(tf, 15.1, 15.5));
    if (kl > 0 && basC > 20) {
      g.globalAlpha = sortieO * kl;
      const legende = `${t.commerce} · ${t.titre.charAt(0).toLocaleLowerCase("fr-FR")}${t.titre.slice(1)}`;
      const taille = tailleQuiTient(g, [legende], (x) => `italic 600 ${x}px ${S.serif}`, 44, 24, cw - 40);
      ecrire(g, legende, 0, ch / 2 - basC / 2 + taille * 0.35, { police: `italic 600 ${taille}px ${S.serif}`, couleur: "#3A1F2E", align: "center" });
    }
    g.restore();
  }
  // ses mots, un par temps, à droite de la carte
  const fin = 1 - seg(tf, 18.4, 18.58);
  const decal = (NB_MOMENTS - appels.length) * 100;
  appels.forEach((a, j) => {
    const t0 = APPELS_T[j];
    const kt = oQui(seg(tf, t0 + 0.12, t0 + 0.5));
    const kp = seg(tf, t0, t0 + 0.22);
    if (kp <= 0) return;
    const y = APPEL_Y[j] + decal;
    g.save();
    // l'étoile qui éclot
    const r = 14 * oBack(kp, 2.4) * fin;
    g.fillStyle = "#fff";
    g.strokeStyle = "#E46A93";
    g.lineWidth = 5;
    g.beginPath();
    g.arc(736, y + 18, Math.max(0, r), 0, Math.PI * 2);
    g.fill();
    g.stroke();
    const hr = 14 + 30 * seg(tf, t0, t0 + 0.5);
    g.globalAlpha = (1 - seg(tf, t0, t0 + 0.5)) * fin;
    g.fillStyle = "rgba(255,255,255,.55)";
    g.beginPath();
    g.arc(736, y + 18, hr, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = kt * fin;
    g.translate((1 - kt) * 60, 0);
    const taille = tailleQuiTient(g, [a.nom], (x) => `italic 600 ${x}px ${S.serif}`, 50, 26, W - 770 - 24);
    ecrire(g, a.nom, 770, y + 34, { police: `italic 600 ${taille}px ${S.serif}`, couleur: "#3A1F2E" });
    ecrire(g, numero(a.i), 772, y + 72, { police: `600 21px ${S.sans}`, couleur: "#C7708C", espace: 0.3 });
    g.restore();
  });
  // les étoiles qui scintillent
  for (const [x, y, t0] of [
    [120, 470, 16.2],
    [700, 470, 15.7],
    [80, 1250, 17.2],
    [690, 1540, 16.7],
    [990, 1500, 17.9],
    [960, 440, 18.1],
    [200, 1600, 18.3],
  ] as const) {
    const u = tf - t0;
    const a = u < 0 ? 0 : Math.max(0, Math.sin(Math.min(1, u / 0.7) * Math.PI));
    if (a <= 0) continue;
    g.save();
    g.globalAlpha = a * (1 - seg(tf, 18.5, 18.7));
    g.translate(x, y);
    g.rotate((u * 90 * Math.PI) / 180);
    g.scale(0.4 + a, 0.4 + a);
    g.shadowColor = "rgba(255,255,255,.9)";
    g.shadowBlur = 18;
    ecrire(g, "✦", 0, 14, { police: `400 40px ${S.serif}`, couleur: "#fff", align: "center" });
    g.restore();
  }
}

function dessinerFin(g: CanvasRenderingContext2D, S: Scene, tf: number) {
  const t = S.textes;
  const avecFig = Boolean(S.el.figurine);
  g.save();
  g.globalAlpha = oCub(seg(tf, 18.66, 18.92));
  const z = 1 + 0.02 * seg(tf, 18.66, 21);
  g.translate(W / 2, H / 2);
  g.scale(z, z);
  g.translate(-W / 2, -H / 2);
  const f = g.createRadialGradient(W / 2, H * 0.38, 0, W / 2, H * 0.38, H * 0.62);
  f.addColorStop(0, "#FBE9ED");
  f.addColorStop(0.55, "#F4D3DA");
  f.addColorStop(1, "#EBBFC9");
  g.fillStyle = f;
  g.fillRect(-40, -40, W + 80, H + 80);

  const phrase = propre(t.phrase, 200);
  const policePhrase = `italic 600 52px ${S.serif}`;
  const lp = phrase ? lignes(g, phrase, policePhrase, 820).slice(0, 4) : [];
  const tailleMarque = tailleQuiTient(g, [t.commerce], (x) => `italic 700 ${x}px ${S.serif}`, 190, 80, 1000);
  // la hauteur du bloc : en haut avec la figurine (elle prend le bas), au milieu sans elle
  const hBloc = 30 + 40 + tailleMarque * 1.1 + 56 + lp.length * 69;
  const y0 = avecFig ? 290 : (H - hBloc) / 2 - 40;
  const kh = oCub(seg(tf, 18.75, 19.15));
  g.save();
  g.globalAlpha *= kh;
  ecrire(g, t.titre.toLocaleUpperCase("fr-FR"), W / 2, y0 + 26, { police: `600 26px ${S.sans}`, couleur: "#B4657E", espace: lerp(0.9, 0.52, oCub(seg(tf, 18.75, 19.3))), align: "center" });
  g.restore();
  const yM = y0 + 60 + tailleMarque * 0.9;
  monteDuMasque(g, oQui(seg(tf, 18.72, 19.25)), tailleMarque, yM, (dy) => {
    const policeM = `italic 700 ${tailleMarque}px ${S.serif}`;
    const lw = largeurDe(g, t.commerce, policeM);
    // le reflet qui passe sur son nom
    const pos = lerp(1, 0, ioCub(seg(tf, 19.3, 20.2)));
    const x0 = W / 2 - lw / 2;
    const reflet = g.createLinearGradient(x0 - lw, 0, x0 + 2 * lw, 0);
    const c = 0.33 + pos * 0.34;
    reflet.addColorStop(0, "#3A1F2E");
    reflet.addColorStop(cl(c - 0.04), "#3A1F2E");
    reflet.addColorStop(cl(c), "#D98AA4");
    reflet.addColorStop(cl(c + 0.04), "#3A1F2E");
    reflet.addColorStop(1, "#3A1F2E");
    g.font = policeM;
    g.textAlign = "center";
    g.fillStyle = reflet;
    g.fillText(t.commerce, W / 2, yM + dy);
  });
  g.fillStyle = "#C7708C";
  const filet = 200 * oCub(seg(tf, 19.0, 19.5));
  g.fillRect(W / 2 - filet / 2, yM + tailleMarque * 0.25 + 8, filet, 2);
  if (lp.length) {
    const kp = oCub(seg(tf, 19.2, 19.75));
    g.save();
    g.globalAlpha *= kp;
    lp.forEach((l, i) => ecrire(g, l, W / 2, yM + tailleMarque * 0.25 + 100 + i * 69 + (1 - kp) * 30, { police: policePhrase, couleur: "#4A2A3B", align: "center" }));
    g.restore();
  }
  const ks = oCub(seg(tf, 19.7, 20.15));
  g.save();
  g.globalAlpha *= ks;
  const signe = "Réalisé avec ClikMe Studio";
  const ps = `500 26px ${S.sans}`;
  const lw = largeurDe(g, signe, ps, 0.08);
  const yS = H - 215 + (1 - ks) * 20;
  const fant = S.el.fantome;
  const fw = fant ? 54 : 0;
  const x0 = W / 2 - (lw + fw + 16) / 2;
  if (fant) g.drawImage(fant, x0, yS - 40, fw, (fw * fant.naturalHeight) / Math.max(1, fant.naturalWidth));
  ecrire(g, signe, x0 + fw + 16, yS, { police: ps, couleur: "#8E5A6E", espace: 0.08 });
  g.restore();
  g.restore();
}

function dessinerIntroEtFigurine(g: CanvasRenderingContext2D, S: Scene, T: number) {
  const D = S.D;
  // le fond de l'intro
  const fo = T < D ? 1 - seg(T, 3.36, 3.5) : 0;
  if (fo > 0) {
    g.save();
    g.globalAlpha = fo;
    const f = g.createRadialGradient(W / 2, H * 0.62, 0, W / 2, H * 0.62, H * 0.6);
    f.addColorStop(0, "#FFF3F5");
    f.addColorStop(0.45, "#F8DCE2");
    f.addColorStop(1, "#EEC2CC");
    g.fillStyle = f;
    g.fillRect(0, 0, W, H);
    const lum = g.createRadialGradient(540, 1070, 0, 540, 1070, 650);
    lum.addColorStop(0, "rgba(255,255,255,.75)");
    lum.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = lum;
    g.fillRect(0, 0, W, H);
    g.globalAlpha = fo * oCub(seg(T, 0.35, 0.8)) * (1 - seg(T, 2.8, 3.0));
    ecrire(g, S.textes.commerce.toLocaleUpperCase("fr-FR"), W / 2, 216, { police: `600 26px ${S.sans}`, couleur: "#B4657E", espace: 0.46, align: "center" });
    for (const [x, y, t0] of [
      [150, 520, 0.7],
      [880, 600, 1.0],
      [110, 1180, 1.3],
      [930, 1300, 0.85],
      [820, 380, 1.6],
      [240, 330, 1.9],
    ] as const) {
      const u = T - t0 + 0.4;
      const a = u < 0 ? 0 : Math.max(0, Math.sin(Math.min(1, u / 0.8) * Math.PI));
      if (a <= 0) continue;
      g.save();
      g.globalAlpha = fo * a;
      g.translate(x, y);
      g.rotate((u * 80 * Math.PI) / 180);
      g.scale(0.4 + a, 0.4 + a);
      ecrire(g, "✦", 0, 16, { police: `400 46px ${S.serif}`, couleur: "#fff", align: "center" });
      g.restore();
    }
    g.restore();
  }
  const e = etatFigurine(T, D);
  if (e) dessinerFigurine(g, S, e);
  // les bulles
  const B = S.bulles;
  const liste: { t: string; a: number; b: number; ech?: number; droite?: boolean }[] = [
    { t: B.bonjour, a: 0.55, b: 1.5 },
    { t: B.bienvenue, a: 1.5, b: 2.82 },
    { t: B.passages[0], a: 9.28, b: 9.82, ech: 0.92 },
    { t: B.passages[1], a: 12.78, b: 13.74, ech: 0.92 },
    { t: B.aBientot, a: D + 19.35, b: 1e9, droite: true },
  ];
  if (!e) return;
  const tete = teteDe(S, e);
  for (const x of liste) {
    if (T < x.a || T >= x.b) continue;
    bulle(g, S, x.t, tete, seg(T, x.a, x.a + 0.28), seg(T, x.b - 0.14, x.b), x.ech ?? 1, x.droite);
  }
}

// ─── le montage ─────────────────────────────────────────────────────────────────────────────────

export type ReglagesStudio = {
  url: string;
  video: InfosVideo;
  moments: number[];
  noms: string[];
  textes: TextesStudio;
};

export type FilmStudio = { blob: Blob; type: string; duree: number; affiche: string };

/**
 * LE FILM SE JOUE ET S'ENREGISTRE. `ecouter` : il entend la musique pendant le montage (sinon, elle ne va qu'à
 * l'enregistrement). Rend la vidéo, sa durée, et son affiche (l'accroche, son titre sur sa vidéo).
 */
export async function monterStudio(o: {
  ctx: AudioContext;
  el: ElementsStudio;
  r: ReglagesStudio;
  toile: HTMLCanvasElement;
  ecouter: boolean;
  surProgres?: (p: number) => void;
  signal?: AbortSignal;
}): Promise<FilmStudio> {
  const { ctx, el, r } = o;
  const avecFig = Boolean(el.figurine);
  const D = avecFig ? INTRO_FIGURINE : 0;
  const total = dureeDuFilm(avecFig);
  const g = ctx2d(o.toile);
  if (typeof o.toile.captureStream !== "function") throw new Error("Ce téléphone ne sait pas enregistrer un dessin animé (captureStream).");
  o.toile.width = LARGEUR_STUDIO;
  o.toile.height = HAUTEUR_STUDIO;

  const plans = plansDuFilm(r.video.duree, r.moments);
  const sFin = finDeSource(r.video.duree);
  const chap0 = plans.find((p) => p.role === "chapitre")?.s0 ?? 0;
  // les images figées : le retour en arrière (de la fin vers le premier moment), le polaroïd
  const tempsRetour = Array.from({ length: 7 }, (_, k) => lerp(sFin, chap0, k / 6));
  // LES IMAGES L'UNE APRÈS L'AUTRE : un iPhone n'aime pas décoder la même vidéo dans quatre lecteurs à la fois
  const musiqueEnRoute = fabriquerMusiqueStudio({ figurine: avecFig });
  const retour = await imagesDe(r.url, tempsRetour, 540);
  const figees = await imagesDe(r.url, [sFin], Math.min(1080, r.video.largeur || 1080));
  const musique = await musiqueEnRoute;
  if (o.signal?.aborted) throw new DOMException("Montage arrêté", "AbortError");

  const iw = r.video.largeur || 720;
  const ih = r.video.hauteur || 1280;
  const W0 = Math.max(W, (H * iw) / ih);
  const H0 = (W0 * ih) / iw;
  const S: Scene = {
    el,
    serif: el.serif,
    sans: el.sans,
    textes: r.textes,
    noms: r.noms,
    plans,
    D,
    total,
    W0,
    H0,
    L0: (W - W0) / 2,
    T0: (H - H0) / 2,
    retour,
    fige: figees[0] ?? null,
    grain: fabriquerGrain(),
    vignette: fabriquerVignette(),
    lignesTv: fabriquerLignes(),
    bulles: bullesDeLaFigurine(r.textes, r.noms),
    petit: toile(64, 64),
  };

  // les deux lecteurs : le plan i se joue sur le lecteur i % 2 ; l'autre attend, calé sur le suivant
  const lecteurs = await Promise.all([lecteurMuet(r.url), lecteurMuet(r.url)]);
  await Promise.all([caler(lecteurs[0], plans[0].s0), caler(lecteurs[1], plans[1].s0)]);
  let actif = -1;
  const suivrePlans = (tf: number) => {
    const i = plans.findIndex((p) => tf >= p.de && tf < p.a);
    if (i === actif) return;
    if (actif >= 0) lecteurs[actif % 2].pause();
    actif = i;
    if (i < 0) return;
    const v = lecteurs[i % 2];
    const p = plans[i];
    v.playbackRate = p.vitesse;
    const attendu = p.s0 + (tf - p.de) * p.vitesse;
    if (Math.abs(v.currentTime - attendu) > 0.25) v.currentTime = attendu;
    void v.play().catch(() => {});
    const n = plans[i + 1];
    if (n) {
      const w = lecteurs[(i + 1) % 2];
      w.pause();
      if (Math.abs(w.currentTime - n.s0) > 0.04) w.currentTime = n.s0;
    }
  };

  // le son : la musique vers l'enregistrement (et vers ses oreilles s'il écoute)
  const enregistree = ctx.createMediaStreamDestination();
  const lecture = ctx.createBufferSource();
  lecture.buffer = musique;
  lecture.connect(enregistree);
  if (o.ecouter) lecture.connect(ctx.destination);
  if (ctx.state !== "running") await ctx.resume().catch(() => {});

  const format = formatVideo();
  const flux = new MediaStream([...o.toile.captureStream(IPS).getVideoTracks(), ...enregistree.stream.getAudioTracks()]);
  const rec = new MediaRecorder(flux, { ...(format ? { mimeType: format } : {}), videoBitsPerSecond: 6_000_000, audioBitsPerSecond: 128_000 });
  const morceaux: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data.size) morceaux.push(e.data);
  };
  const arret = new Promise<void>((ok) => (rec.onstop = () => ok()));

  // la première image avant de lancer l'enregistrement : pas d'image noire au début
  dessiner(g, S, 0, 0, { image: null });
  let affiche = "";
  const tAffiche = D + 1.3;
  const debut = ctx.currentTime + 0.2;
  lecture.start(debut);
  rec.start(250);
  let n = 0;
  try {
    await new Promise<void>((ok, ko) => {
      const image = () => {
        if (o.signal?.aborted) {
          ko(new DOMException("Montage arrêté", "AbortError"));
          return;
        }
        const T = Math.max(0, ctx.currentTime - debut);
        const tf = T - D;
        suivrePlans(tf);
        const v = actif >= 0 ? lecteurs[actif % 2] : null;
        dessiner(g, S, T, n++, { image: v && v.readyState >= 2 ? v : null });
        if (!affiche && T >= tAffiche) affiche = o.toile.toDataURL("image/jpeg", 0.78);
        o.surProgres?.(Math.min(1, T / total));
        if (T >= total + 0.15) ok();
        else requestAnimationFrame(image);
      };
      requestAnimationFrame(image);
    });
  } finally {
    try {
      lecture.stop();
    } catch {
      /* déjà fini */
    }
    if (rec.state !== "inactive") rec.stop();
    lecteurs.forEach((v) => {
      v.pause();
      v.remove();
    });
  }
  await arret;
  const type = rec.mimeType || format || "video/webm";
  // UNE AFFICHE QUI PASSE : la route des annonces prend une image en clair de 900 000 signes au plus
  if (affiche.length > 880_000) affiche = o.toile.toDataURL("image/jpeg", 0.5);
  return { blob: new Blob(morceaux, { type }), type, duree: total, affiche };
}

/** Pour l'essai d'une image seule (la page d'essai et les vérifications) : la scène posée à l'instant T. */
export async function poserUneImage(o: { el: ElementsStudio; r: ReglagesStudio; toile: HTMLCanvasElement; T: number }): Promise<void> {
  const plans = plansDuFilm(o.r.video.duree, o.r.moments);
  const D = o.el.figurine ? INTRO_FIGURINE : 0;
  const tf = o.T - D;
  const p = plans.find((x) => tf >= x.de && tf < x.a);
  const s = p ? p.s0 + (tf - p.de) * p.vitesse : finDeSource(o.r.video.duree);
  const sFin = finDeSource(o.r.video.duree);
  const chap0 = plans.find((x) => x.role === "chapitre")?.s0 ?? 0;
  const images = await imagesDe(o.r.url, [s, sFin], Math.min(1080, o.r.video.largeur || 1080));
  const retour = await imagesDe(o.r.url, Array.from({ length: 7 }, (_, k) => lerp(sFin, chap0, k / 6)), 540);
  const iw = o.r.video.largeur || 720;
  const ih = o.r.video.hauteur || 1280;
  const W0 = Math.max(W, (H * iw) / ih);
  const H0 = (W0 * ih) / iw;
  o.toile.width = LARGEUR_STUDIO;
  o.toile.height = HAUTEUR_STUDIO;
  const S: Scene = {
    el: o.el,
    serif: o.el.serif,
    sans: o.el.sans,
    textes: o.r.textes,
    noms: o.r.noms,
    plans,
    D,
    total: dureeDuFilm(Boolean(o.el.figurine)),
    W0,
    H0,
    L0: (W - W0) / 2,
    T0: (H - H0) / 2,
    retour,
    fige: images[1] ?? null,
    grain: fabriquerGrain(),
    vignette: fabriquerVignette(),
    lignesTv: fabriquerLignes(),
    bulles: bullesDeLaFigurine(o.r.textes, o.r.noms),
    petit: toile(64, 64),
  };
  // l'image figée de l'instant tient lieu de lecteur
  dessiner(ctx2d(o.toile), S, o.T, Math.round(o.T * IPS), { image: p ? (images[0] ?? null) : null });
}
