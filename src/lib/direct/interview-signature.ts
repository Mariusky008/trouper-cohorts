/**
 * 🎬 LA SIGNATURE « FACE AU FANTÔME » — ce qui fait reconnaître l'émission.
 *
 * « Est-ce que le mode "en interview" a bien été pensé pour que le résultat
 * soit à la hauteur de ce que tu viens de réaliser ? » Les épisodes de
 * Jean-Marie et de Lou (`outils/face-au-fantome/`) ont une signature : le clic
 * et son nom en géant, une carte par question, les mots qui s'allument un à
 * un, les mots qui frappent, le coup de zoom, la carte de fin avec le prix et
 * le bouton, une musique, et la même petite mélodie à chaque fin. Ce fichier
 * les dessine et les fait sonner pour le montage du téléphone
 * (`interview-montage.ts`), image par image, en 720 × 1280 — les épisodes
 * étaient en 1080 × 1920 : toutes leurs mesures sont ici aux deux tiers.
 *
 * ─── CE QUI CHANGE PAR RAPPORT AUX ÉPISODES ─────────────────────────────
 *
 * LE TÉLÉPHONE DESSINE EN DIRECT, trente fois par seconde, pendant qu'il
 * enregistre. Pas de flou par filtre (Safari ne le connaît pas sur une toile :
 * on réduit puis on agrandit), pas d'ombre floue sur chaque mot (un contour
 * et une ombre décalée font le même effet pour rien), et tout ce qui ne bouge
 * pas est dessiné une fois.
 *
 * LA MUSIQUE EST FABRIQUÉE ICI, note par note. Celle des épisodes vient d'une
 * banque de sons dont la licence n'autorise pas qu'on la mette dans chaque
 * vidéo de chaque commerçant. Celle-ci est à nous.
 *
 * FICHIER NAVIGATEUR.
 */
import type { CarteDeQuestion, MorceauDit } from "@/lib/direct/interview-fantome";

export const LARGEUR = 720;
export const HAUTEUR = 1280;
const W = LARGEUR;
const H = HAUTEUR;

export const ROSE = "#FF2E9A";
export const CREME = "#FFF4E6";
export const NUIT = "#140C09";
const ENCRE = "#1E1E22";

/** Les trois polices de l'émission : l'affiche (Anton), le texte (Poppins), l'enseigne (Playfair). */
export type Polices = { affiche: string; texte: string; serif: string };

/* ═══ LES OUTILS ═══════════════════════════════════════════════════════════ */

export const borne = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
/** Part vite, arrive doucement. */
export const sortie = (x: number) => 1 - Math.pow(1 - borne(x), 3);
export const douce = (x: number) => {
  const t = borne(x);
  return t * t * (3 - 2 * t);
};
/** Dépasse un peu, puis revient : ce qui « tombe » à sa place. */
export const rebond = (x: number) => {
  const t = borne(x);
  const c1 = 1.9;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
export const mix = (a: number, b: number, x: number) => a + (b - a) * x;
/** Un hasard qui donne toujours le même nombre pour le même `n` : la même vidéo deux fois. */
export function hasard(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function toile(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}
const ctx2d = (c: HTMLCanvasElement) => c.getContext("2d")!;

type AvecEspacement = CanvasRenderingContext2D & { letterSpacing?: string };
function espacer(g: CanvasRenderingContext2D, px: number) {
  const e = g as AvecEspacement;
  if ("letterSpacing" in e) e.letterSpacing = `${px}px`;
}

/**
 * UNE IMAGE QUI COUVRE UN RECTANGLE : (fx, fy) le point de l'image posé au
 * point (tx, ty) du rectangle, `z` le zoom — et l'image couvre toujours tout.
 */
export function couvrirImage(
  g: CanvasRenderingContext2D,
  img: CanvasImageSource,
  iw: number,
  ih: number,
  o: { fx?: number; fy?: number; z?: number; tx?: number; ty?: number; x?: number; y?: number; w?: number; h?: number } = {},
) {
  const { fx = 0.5, fy = 0.42, z = 1, tx = 0.5, ty = 0.5, x = 0, y = 0, w = W, h = H } = o;
  if (!iw || !ih) {
    g.fillStyle = NUIT;
    g.fillRect(x, y, w, h);
    return;
  }
  const s = Math.max(w / iw, h / ih) * z;
  const dw = iw * s;
  const dh = ih * s;
  const px = Math.min(x, Math.max(x + w - dw, x + w * tx - fx * dw));
  const py = Math.min(y, Math.max(y + h - dh, y + h * ty - fy * dh));
  g.drawImage(img, px, py, dw, dh);
}

/** UN FLOU QUI MARCHE PARTOUT : l'image réduite très petit, puis agrandie en deux fois. */
export function flouter(img: CanvasImageSource, iw: number, ih: number, force = 16, w = W, h = H): HTMLCanvasElement {
  const petit = toile(w / force, h / force);
  const pg = ctx2d(petit);
  pg.imageSmoothingQuality = "high";
  couvrirImage(pg, img, iw, ih, { w: petit.width, h: petit.height });
  const moyen = toile(w / 4, h / 4);
  const mg = ctx2d(moyen);
  mg.imageSmoothingQuality = "high";
  mg.drawImage(petit, 0, 0, moyen.width, moyen.height);
  const out = toile(w, h);
  const og = ctx2d(out);
  og.imageSmoothingQuality = "high";
  og.drawImage(moyen, 0, 0, w, h);
  return out;
}

/** Une lueur ronde, du centre vers rien. */
export function lueur(g: CanvasRenderingContext2D, x: number, y: number, r: number, couleur: string) {
  const d = g.createRadialGradient(x, y, 0, x, y, r);
  d.addColorStop(0, couleur);
  d.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = d;
  g.fillRect(0, 0, W, H);
}

/** LE BORD DE L'IMAGE QUI S'ASSOMBRIT, dessiné une fois : sur chaque image, une simple copie. */
export function fabriquerVignette(): HTMLCanvasElement {
  const t = toile(W, H);
  const g = ctx2d(t);
  const v = g.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.48, H * 0.82);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,.55)");
  g.fillStyle = v;
  g.fillRect(0, 0, W, H);
  return t;
}

/** LE GRAIN DE LA PELLICULE : un bruit fixe, déplacé à chaque dixième de seconde. */
export function fabriquerGrain(): HTMLCanvasElement {
  const t = toile(360, 640);
  const g = ctx2d(t);
  const d = g.createImageData(360, 640);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = 128 + (hasard(i) - 0.5) * 255;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  g.putImageData(d, 0, 0);
  return t;
}
export function dessinerGrain(g: CanvasRenderingContext2D, grain: HTMLCanvasElement, t: number) {
  g.save();
  g.globalCompositeOperation = "overlay";
  g.globalAlpha = 0.05;
  const i = Math.floor(t * 10);
  const ox = -Math.floor(hasard(i) * 360);
  const oy = -Math.floor(hasard(i + 1) * 640);
  for (let x = ox; x < W; x += 360) for (let y = oy; y < H; y += 640) g.drawImage(grain, x, y);
  g.restore();
}

/** LE CLIC : l'image s'assombrit un instant, puis un éclair blanc. `v` : le temps depuis le clic. */
export function eclairDuClic(g: CanvasRenderingContext2D, v: number) {
  if (v >= -0.08 && v < 0) {
    g.fillStyle = "rgba(0,0,0,.55)";
    g.fillRect(0, 0, W, H);
  }
  if (v >= 0 && v < 0.32) {
    g.fillStyle = `rgba(255,255,255,${Math.pow(1 - v / 0.32, 2)})`;
    g.fillRect(0, 0, W, H);
  }
}

/** LA TRAÎNÉE DE LUMIÈRE ROSE qui balaie l'image, après le coup de zoom. */
export function fuite(g: CanvasRenderingContext2D, u: number, force = 1) {
  if (u < 0 || u > 1) return;
  g.save();
  g.globalCompositeOperation = "screen";
  const x = mix(-200, W + 200, sortie(u));
  const a = Math.sin(Math.PI * u) * 0.55 * force;
  const d = g.createRadialGradient(x, H * 0.4, 0, x, H * 0.4, 470);
  d.addColorStop(0, `rgba(255,70,160,${a})`);
  d.addColorStop(0.5, `rgba(255,140,60,${a * 0.5})`);
  d.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = d;
  g.fillRect(0, 0, W, H);
  g.restore();
}

export function rectArrondi(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** Un texte, avec au besoin un contour sombre et une ombre décalée (pas d'ombre floue : elle coûte cher). */
export function texte(
  g: CanvasRenderingContext2D,
  t: string,
  x: number,
  y: number,
  police: string,
  couleur: string,
  o: { align?: CanvasTextAlign; ls?: number; contour?: number; ombre?: number } = {},
) {
  g.save();
  g.font = police;
  g.textAlign = o.align ?? "left";
  g.textBaseline = "alphabetic";
  espacer(g, o.ls ?? 0);
  if (o.ombre) {
    g.fillStyle = "rgba(0,0,0,.45)";
    g.fillText(t, x, y + o.ombre);
  }
  if (o.contour) {
    g.lineJoin = "round";
    g.lineWidth = o.contour;
    g.strokeStyle = "rgba(0,0,0,.82)";
    g.strokeText(t, x, y);
  }
  g.fillStyle = couleur;
  g.fillText(t, x, y);
  g.restore();
}
export function largeurTexte(g: CanvasRenderingContext2D, t: string, police: string, ls = 0) {
  g.save();
  g.font = police;
  espacer(g, ls);
  const w = g.measureText(t).width;
  g.restore();
  return w;
}
/** La plus grande taille (pas de `pas`) où toutes les lignes tiennent dans `largeur`. */
function tailleQuiTient(g: CanvasRenderingContext2D, lignes: string[], police: (taille: number) => string, max: number, largeur: number, ls = 0, pas = 4) {
  let taille = max;
  while (taille > 20 && lignes.some((l) => largeurTexte(g, l, police(taille), ls) > largeur)) taille -= pas;
  return taille;
}

/* ═══ LE CADRE DE L'ÉMISSION ═══════════════════════════════════════════════
 * Quatre coins roses, et en haut à gauche le nom de l'émission et le sien. */
/** `emission` : le nom de l'émission en haut à gauche — « LE REPORTER CLIKME » pour le film du reporter. */
export function dessinerCadre(g: CanvasRenderingContext2D, p: Polices, u: number, nom: string, emission = "FACE AU FANTÔME") {
  if (u < 0) return;
  const s = mix(1.08, 1, sortie(u / 0.22));
  const a = borne(u / 0.12);
  g.save();
  g.globalAlpha = a;
  g.translate(W / 2, H / 2);
  g.scale(s, s);
  g.translate(-W / 2, -H / 2);
  g.strokeStyle = ROSE;
  g.lineWidth = 7;
  g.lineCap = "round";
  const m = 37;
  const L = 64;
  for (const [x, y, dx, dy] of [
    [m, m + 40, 1, 1],
    [W - m, m + 40, -1, 1],
    [m, H - m - 93, 1, -1],
    [W - m, H - m - 93, -1, -1],
  ]) {
    g.beginPath();
    g.moveTo(x, y + dy * L);
    g.lineTo(x, y);
    g.lineTo(x + dx * L, y);
    g.stroke();
  }
  g.restore();
  g.save();
  g.globalAlpha = a;
  g.beginPath();
  g.arc(65, 133, 7, 0, Math.PI * 2);
  g.fillStyle = ROSE;
  g.fill();
  texte(g, emission, 83, 141, `800 21px ${p.texte}`, CREME, { ls: 3, ombre: 2 });
  texte(g, nom, 83, 172, `600 20px ${p.texte}`, "rgba(255,244,230,.88)", { ombre: 2 });
  g.restore();
}

/* ═══ LES SOUS-TITRES MOT À MOT ═══════════════════════════════════════════
 * Chaque mot sort en rebondissant quand il est dit ; celui qu'on entend est en
 * rose, et les mots forts (son plat, son prix) y restent. */
export function dessinerSousTitres(g: CanvasRenderingContext2D, p: Polices, m: MorceauDit | undefined, t: number, yBas = 923) {
  if (!m) return;
  const taille = 56;
  const police = `900 ${taille}px ${p.texte}`;
  const esp = largeurTexte(g, " ", police) + taille * 0.16;
  const largeurs = m.mots.map((w) => largeurTexte(g, w.m, police));
  let lignes = [m.mots.map((_, k) => k)];
  const total = largeurs.reduce((s, x) => s + x, 0) + esp * (m.mots.length - 1);
  if (total > 626 && m.mots.length > 1) {
    const coupe = Math.ceil(m.mots.length / 2);
    lignes = [m.mots.slice(0, coupe).map((_, k) => k), m.mots.slice(coupe).map((_, k) => k + coupe)];
  }
  const pas = taille * 1.12;
  lignes.forEach((ligne, li) => {
    const lw = ligne.reduce((s, k) => s + largeurs[k], 0) + esp * (ligne.length - 1);
    // un mot seul plus large que l'écran se resserre plutôt que de déborder
    const serre = Math.min(1, 660 / Math.max(1, lw));
    let x = W / 2 - (lw * serre) / 2;
    const y = yBas - (lignes.length - 1 - li) * pas;
    for (const k of ligne) {
      const w = m.mots[k];
      const dt = t - (w.a - 0.04);
      if (dt >= 0) {
        const courant = t >= w.a && t < w.b + 0.04;
        const s = (0.72 + 0.28 * rebond(dt / 0.14)) * (courant ? 1.07 : 1) * serre;
        g.save();
        g.translate(x + (largeurs[k] * serre) / 2, y - taille * 0.35);
        g.scale(s, s);
        texte(g, w.m, -largeurs[k] / 2, taille * 0.35, police, courant || w.fort ? ROSE : "#FFFFFF", { contour: 11, ombre: 4 });
        g.restore();
      }
      x += (largeurs[k] + esp) * serre;
    }
  });
}

/* ═══ LES MOTS QUI FRAPPENT ════════════════════════════════════════════════
 * « Douce. Vraie. Pleine de surprises. » — chaque mot en plein écran, qui
 * tombe de très haut, avec un éclair, un choc et une secousse. */
export function dessinerFrappe(g: CanvasRenderingContext2D, p: Polices, mot: string, u: number, duree: number, y = H / 2) {
  if (u < 0 || u > duree) return;
  const m = mot.replace(/[,.…!?;:«»"]/g, "").toLocaleUpperCase("fr-FR");
  const taille = tailleQuiTient(g, [m], (t) => `${t}px ${p.affiche}`, 213, 640, 3, 6);
  const s = u < 0.12 ? mix(1.9, 1, sortie(u / 0.12)) : 1 + 0.05 * (u - 0.12);
  const a = Math.min(1, u / 0.05, (duree - u) / 0.12);
  g.save();
  g.globalAlpha = borne(a);
  g.translate(W / 2, y);
  g.scale(s, s);
  texte(g, m, 0, taille * 0.36, `${taille}px ${p.affiche}`, ROSE, { align: "center", ls: 3, ombre: 10 });
  g.restore();
  if (u < 0.09) {
    g.fillStyle = `rgba(255,255,255,${0.5 * (1 - u / 0.09)})`;
    g.fillRect(0, 0, W, H);
  }
}
/** La secousse de l'image au moment d'une frappe : [dx, dy]. */
export function secousse(u: number): [number, number] {
  if (u < 0 || u >= 0.2) return [0, 0];
  return [Math.sin(u * 140) * 11 * (1 - u / 0.2), Math.cos(u * 110) * 7 * (1 - u / 0.2)];
}

/* ═══ LA CARTE D'UNE QUESTION ══════════════════════════════════════════════ */

/** Le fond des cartes, dessiné une fois : la nuit, une lueur rose en bas, une lueur ambre en haut. */
export function fabriquerFondCarte(): HTMLCanvasElement {
  const t = toile(W, H);
  const g = ctx2d(t);
  g.fillStyle = NUIT;
  g.fillRect(0, 0, W, H);
  lueur(g, 587, 1040, 667, "rgba(255,46,154,.42)");
  lueur(g, 80, 173, 507, "rgba(255,150,60,.18)");
  return t;
}

export function dessinerCarte(g: CanvasRenderingContext2D, p: Polices, fond: HTMLCanvasElement, c: CarteDeQuestion, u: number) {
  g.drawImage(fond, 0, 0);
  // les rayures du plateau, qui glissent
  g.save();
  g.globalAlpha = 0.06;
  g.strokeStyle = CREME;
  g.lineWidth = 1.4;
  g.beginPath();
  for (let k = -20; k < 40; k++) {
    g.moveTo(k * 47 + u * 40, 0);
    g.lineTo(k * 47 - 400 + u * 40, H);
  }
  g.stroke();
  g.restore();
  const entre = (d: number) => sortie((u - d) / 0.3);
  g.save();
  g.globalAlpha = entre(0.05);
  // assez haut pour que l'accent d'un « É » en très gros ne le touche pas
  texte(g, c.num, 56, 343 - 20 * (1 - entre(0.05)), `800 23px ${p.texte}`, ROSE, { ls: 5 });
  g.restore();
  const lignes = [c.l1, c.l2].filter(Boolean);
  const derniere = lignes.length - 1;
  // « ? » prend son espace, « … » se colle
  const fin = c.fin === "?" ? " ?" : c.fin;
  const avecFin = lignes.map((l, k) => (k === derniere ? l + fin : l));
  const taille = tailleQuiTient(g, avecFin, (t) => `${t}px ${p.affiche}`, 166, 616, 1, 4);
  const police = `${taille}px ${p.affiche}`;
  const y0 = 533;
  const pas = taille * 1.06;
  lignes.forEach((l, k) => {
    const a = entre(0.1 + 0.08 * k);
    g.save();
    g.globalAlpha = a;
    const y = y0 + k * pas + 47 * (1 - a);
    texte(g, l, 52, y, police, CREME, { ls: 1 });
    if (k === derniere && fin) texte(g, fin, 52 + largeurTexte(g, l, police, 1), y, police, ROSE, { ls: 1 });
    g.restore();
  });
  const ySous = y0 + derniere * pas + Math.max(70, taille * 0.5);
  g.save();
  g.globalAlpha = entre(0.32);
  // la question dite, en dessous : elle se resserre si elle est longue
  const sous = c.sous.filter(Boolean);
  const tSous = tailleQuiTient(g, sous, (t) => `600 ${t}px ${p.texte}`, 35, 616, 0, 1);
  sous.forEach((l, k) => texte(g, l, 56, ySous + k * tSous * 1.28, `600 ${tSous}px ${p.texte}`, "rgba(255,244,230,.86)"));
  g.restore();
}

/* ═══ LE PLAN SIGNATURE : LE CLIC, ET SON NOM EN GÉANT ═════════════════════ */
export type Titre = {
  /** Le fond, déjà flouté (sa photo) — la nuit sinon. */
  fond: HTMLCanvasElement | null;
  nom: string;
  /** En haut à gauche : « FACE AU FANTÔME », puis « DAX · AUJOURD'HUI ». */
  haut: string;
  /** En bas, à l'enseigne : « la pièce du moment », puis le plat, en rose. */
  bas: [string, string];
  /** Le nom de l'émission — « FACE AU FANTÔME » par défaut. */
  emission?: string;
};

export function dessinerTitre(g: CanvasRenderingContext2D, p: Polices, o: Titre, u: number) {
  if (o.fond) {
    g.save();
    g.translate(W / 2, H / 2);
    const z = 1.06 + (0.04 * u) / 2.8;
    g.scale(z, z);
    g.drawImage(o.fond, -W / 2, -H / 2);
    g.restore();
  } else {
    g.fillStyle = NUIT;
    g.fillRect(0, 0, W, H);
  }
  g.fillStyle = "rgba(20,12,9,.42)";
  g.fillRect(0, 0, W, H);
  lueur(g, 360, 427, 547, "rgba(255,46,154,.32)");
  // SON NOM : une ligne s'il tient en grand, deux sinon
  const nom = o.nom.toLocaleUpperCase("fr-FR");
  const police = (t: number) => `${t}px ${p.affiche}`;
  let lignes = [nom];
  let taille = tailleQuiTient(g, lignes, police, 300, 660, 9, 6);
  const mots = nom.split(/\s+/);
  if (taille < 170 && mots.length > 1) {
    let mieux = [nom];
    let ecart = Infinity;
    for (let k = 1; k < mots.length; k++) {
      const a = mots.slice(0, k).join(" ");
      const b = mots.slice(k).join(" ");
      if (Math.max(a.length, b.length) < ecart) {
        ecart = Math.max(a.length, b.length);
        mieux = [a, b];
      }
    }
    lignes = mieux;
    taille = tailleQuiTient(g, lignes, police, 240, 660, 7, 6);
  }
  const q = sortie((u - 0.06) / 0.32);
  const pas = taille * 0.98;
  const yMilieu = 610 - 11 * u;
  const dessinerNom = (alpha: number, echelle: number) => {
    g.save();
    g.globalAlpha = borne(alpha);
    g.translate(W / 2, yMilieu);
    g.scale(echelle, echelle);
    lignes.forEach((l, k) => {
      const y = (k - (lignes.length - 1) / 2) * pas + taille * 0.36;
      texte(g, l, 0, y, police(taille), CREME, { align: "center", ls: lignes.length > 1 ? 7 : 9 });
    });
    g.restore();
  };
  // l'écho qui s'efface donne le mouvement que le flou donnait dans l'épisode
  if (q < 1) dessinerNom(0.28 * (1 - q), mix(1.4, 1.06, q));
  dessinerNom(q * 1.4, mix(1.25, 1, q));
  const bas = g.createLinearGradient(0, 987, 0, H);
  bas.addColorStop(0, "rgba(20,12,9,0)");
  bas.addColorStop(1, "rgba(20,12,9,.82)");
  g.fillStyle = bas;
  g.fillRect(0, 987, W, H - 987);
  const a = sortie((u - 0.35) / 0.4);
  g.save();
  g.globalAlpha = a;
  texte(g, o.emission ?? "FACE AU FANTÔME", 49, 133, `800 23px ${p.texte}`, ROSE, { ls: 5, ombre: 2 });
  texte(g, o.haut, 49, 167, `600 20px ${p.texte}`, "rgba(255,244,230,.8)", { ls: 3, ombre: 2 });
  g.restore();
  const b = sortie((u - 0.55) / 0.45);
  if (b > 0) {
    g.save();
    g.globalAlpha = b;
    g.translate(0, 20 * (1 - b));
    const [l1, l2] = o.bas;
    if (l1) texte(g, l1, W / 2, 1153, `italic 600 44px ${p.serif}`, CREME, { align: "center", ombre: 3 });
    if (l2) {
      const t2 = tailleQuiTient(g, [l2], (t) => `italic 600 ${t}px ${p.serif}`, 64, 660, 0, 2);
      texte(g, l2, W / 2, l1 ? 1222 : 1190, `italic 600 ${t2}px ${p.serif}`, ROSE, { align: "center", ombre: 3 });
    }
    g.restore();
  }
}

/* ═══ LA CARTE DE FIN ══════════════════════════════════════════════════════ */
export type Fin = {
  fond: HTMLCanvasElement | null;
  /** La photo de la carte postale : sa photo, ou une image de lui prise pendant l'interview. */
  photo: { src: CanvasImageSource; w: number; h: number } | null;
  legende: string;
  /** « AUJOURD'HUI CHEZ MAISON LOU » */
  entete: string;
  plat: [string, string];
  prix: string;
  /** Sa ville, ou rien. */
  infos: string;
  bouton: string;
  logo: HTMLImageElement;
  /** Le texte qui tourne sur le tampon. */
  tampon: string;
  mention: string;
};

/**
 * `u` : le temps depuis le début de la carte ; `signature` : l'instant (en `u`)
 * de la mélodie ; `reporter` dessine le fantôme dans le tampon ; `bulle` : ce
 * qu'il dit, et quand.
 */
export function dessinerFin(
  g: CanvasRenderingContext2D,
  p: Polices,
  f: Fin,
  u: number,
  t: number,
  signature: number,
  reporter: (cx: number, cy: number, r: number) => void,
  bulle: { lignes: [string, string]; de: number; a: number } | null,
) {
  if (f.fond) g.drawImage(f.fond, 0, 0);
  else {
    g.fillStyle = NUIT;
    g.fillRect(0, 0, W, H);
  }
  g.fillStyle = "rgba(20,12,9,.55)";
  g.fillRect(0, 0, W, H);
  lueur(g, 360, 900, 600, "rgba(255,46,154,.28)");
  // LA CARTE POSTALE : l'image plein écran se pose, un peu de travers
  const pr = rebond(u / 0.7);
  const q = sortie(u / 0.55);
  const cible = { x: 113, y: 100, w: 493, h: 573 };
  const x = mix(0, cible.x, q);
  const y = mix(0, cible.y, q);
  const w = mix(W, cible.w, q);
  const h = mix(H, cible.h, q);
  g.save();
  g.translate(x + w / 2, y + h / 2);
  g.rotate(mix(0, -0.06, pr));
  g.fillStyle = "rgba(0,0,0,.35)";
  g.fillRect(-w / 2 + 10 * q, -h / 2 + 18 * q, w, h);
  const bord = 15 * q;
  g.fillStyle = "#FBF6EE";
  g.fillRect(-w / 2, -h / 2, w, h);
  const ph = h - 2 * bord - 64 * q;
  g.save();
  g.beginPath();
  g.rect(-w / 2 + bord, -h / 2 + bord, w - 2 * bord, ph);
  g.clip();
  if (f.photo) couvrirImage(g, f.photo.src, f.photo.w, f.photo.h, { x: -w / 2 + bord, y: -h / 2 + bord, w: w - 2 * bord, h: ph, z: mix(1.1, 1, q) });
  else {
    g.fillStyle = ROSE;
    g.fillRect(-w / 2 + bord, -h / 2 + bord, w - 2 * bord, ph);
  }
  g.restore();
  g.globalAlpha = q;
  const tl = tailleQuiTient(g, [f.legende], (s) => `italic 600 ${s}px ${p.serif}`, 31, w - 40, 0, 1);
  texte(g, f.legende, 0, h / 2 - 25, `italic 600 ${tl}px ${p.serif}`, "#2A1A12", { align: "center" });
  g.restore();
  // LE TAMPON DE L'ÉMISSION, avec le fantôme qui parle dedans
  const st = rebond((u - 1.0) / 0.35);
  if (st > 0) {
    g.save();
    g.translate(587, 140);
    g.rotate(-0.25 + 0.15 * Math.sin(t * 0.6));
    g.scale(st, st);
    g.beginPath();
    g.arc(0, 0, 88, 0, Math.PI * 2);
    g.fillStyle = ROSE;
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = "rgba(255,255,255,.85)";
    g.beginPath();
    g.arc(0, 0, 79, 0, Math.PI * 2);
    g.stroke();
    g.font = `800 15px ${p.texte}`;
    g.fillStyle = "#fff";
    g.textAlign = "center";
    const n = f.tampon.length;
    for (let k = 0; k < n; k++) {
      g.save();
      g.rotate((k / n) * Math.PI * 2 + t * 0.25);
      g.translate(0, -64);
      g.fillText(f.tampon[k], 0, 5);
      g.restore();
    }
    g.save();
    g.beginPath();
    g.arc(0, 0, 51, 0, Math.PI * 2);
    g.fillStyle = "#fff";
    g.fill();
    g.clip();
    reporter(0, 0, 51);
    g.restore();
    g.restore();
  }
  // CE QUE DIT LE FANTÔME : une bulle blanche sous le tampon
  if (bulle && u > bulle.de && u < bulle.a) {
    const v = u - bulle.de;
    const a = Math.min(1, v / 0.15, (bulle.a - u) / 0.25);
    const s = mix(0.7, 1, sortie(v / 0.2));
    const pol = `800 22px ${p.texte}`;
    const bw = Math.max(...bulle.lignes.map((l) => largeurTexte(g, l, pol))) + 44;
    const bx = Math.min(W - 24 - bw / 2, 603);
    g.save();
    g.globalAlpha = borne(a);
    g.translate(bx, 267);
    g.scale(s, s);
    rectArrondi(g, -bw / 2, 0, bw, bulle.lignes[1] ? 85 : 54, 27);
    g.fillStyle = "#fff";
    g.fill();
    g.beginPath();
    g.moveTo(587 - bx - 20, 1);
    g.lineTo(587 - bx - 7, -29);
    g.lineTo(587 - bx + 20, 1);
    g.fill();
    texte(g, bulle.lignes[0], 0, 35, pol, ENCRE, { align: "center" });
    if (bulle.lignes[1]) texte(g, bulle.lignes[1], 0, 66, pol, ENCRE, { align: "center" });
    g.restore();
  }
  // LES LIGNES : chez qui, quoi, combien, où
  const ligne = (d: number) => sortie((u - d) / 0.35);
  const avecPrix = Boolean(f.prix.trim());
  const pPlat = (s: number) => `900 ${s}px ${p.texte}`;
  const tPlat = tailleQuiTient(g, f.plat.filter(Boolean), pPlat, 43, avecPrix ? 400 : 600, 0, 2);
  const L: [number, () => void][] = [
    [0.55, () => texte(g, f.entete, 61, 740, `800 23px ${p.texte}`, ROSE, { ls: 4 })],
    [
      0.68,
      () => {
        texte(g, f.plat[0], 61, 795, pPlat(tPlat), CREME);
        if (f.plat[1]) texte(g, f.plat[1], 61, 795 + tPlat * 1.14, pPlat(tPlat), CREME);
      },
    ],
    [0.82, () => avecPrix && texte(g, f.prix, 659, 845, `${tailleQuiTient(g, [f.prix], (s) => `${s}px ${p.affiche}`, 100, 240, 0, 4)}px ${p.affiche}`, ROSE, { align: "right" })],
    [0.95, () => f.infos && texte(g, f.infos, 61, 893, `600 21px ${p.texte}`, "rgba(255,244,230,.85)")],
  ];
  for (const [d, dessiner] of L) {
    const a = ligne(d);
    if (a <= 0) continue;
    g.save();
    g.globalAlpha = a;
    g.translate(0, 17 * (1 - a));
    dessiner();
    g.restore();
  }
  // LE BOUTON, qui bat sur la mélodie
  const cu = sortie((u - 1.25) / 0.35);
  if (cu > 0) {
    const sv = u - signature;
    const bat = sv > 0 && sv < 0.6 ? 1 + 0.07 * Math.sin((sv / 0.6) * Math.PI) : 1;
    g.save();
    g.globalAlpha = cu;
    g.translate(W / 2, 979);
    g.scale(bat, bat);
    rectArrondi(g, -267, -41, 534, 83, 41);
    g.fillStyle = ENCRE;
    g.fill();
    g.lineWidth = 4;
    g.strokeStyle = ROSE;
    g.stroke();
    const pol = `800 31px ${p.texte}`;
    const lh = 44;
    const lw = (f.logo.width * lh) / Math.max(1, f.logo.height);
    const tw = largeurTexte(g, f.bouton, pol);
    const x0 = -(tw + 14 + lw) / 2;
    texte(g, f.bouton, x0, 11, pol, "#fff");
    g.drawImage(f.logo, x0 + tw + 14, -lh / 2 - 3, lw, lh);
    g.restore();
  }
  // LES CONFETTIS DE LA MÉLODIE
  const su = u - signature;
  if (su > 0 && su < 1.2) {
    for (let k = 0; k < 16; k++) {
      const ang = (k / 16) * Math.PI * 2 + hasard(k);
      const d = 200 + 280 * sortie(su / 1.2) * (0.6 + hasard(k + 4) * 0.6);
      g.save();
      g.globalAlpha = 1 - su / 1.2;
      g.fillStyle = k % 2 ? ROSE : "#FFE3A3";
      g.translate(W / 2 + Math.cos(ang) * d * 1.1, 979 + Math.sin(ang) * d * 0.5);
      g.rotate(ang);
      g.fillRect(-9, -2, 18, 4);
      g.restore();
    }
  }
  if (f.mention) {
    g.save();
    g.globalAlpha = 0.8 * sortie((u - 1.4) / 0.4);
    texte(g, f.mention, W / 2, 1237, `600 15px ${p.texte}`, "rgba(255,244,230,.7)", { align: "center" });
    g.restore();
  }
}

/* ═══ LE SON ═══════════════════════════════════════════════════════════════ */

const freq = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

/** Un bruit blanc d'une seconde, toujours le même. */
export function bruitBlanc(ctx: BaseAudioContext): AudioBuffer {
  const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = hasard(i * 0.37) * 2 - 1;
  return b;
}

/** Une salle : la réverbération qui donne de l'air à la mélodie et aux chocs. */
export function reverbe(ctx: BaseAudioContext): ConvolverNode {
  const sr = ctx.sampleRate;
  const ir = ctx.createBuffer(2, Math.round(sr * 2.2), sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < d.length; i++) d[i] = (hasard(i * 1.3 + ch * 7.7) * 2 - 1) * Math.pow(1 - i / d.length, 3.2);
  }
  const c = ctx.createConvolver();
  c.buffer = ir;
  return c;
}

/** Où vont les sons : le contexte, un bruit blanc, la sortie, et la salle (réverbération). */
export type SortieSon = { ctx: BaseAudioContext; bruit: AudioBuffer; dest: AudioNode; salle: AudioNode };

function souffle(s: SortieSon, t: number, dur: number, type: BiquadFilterType, f: number, vel: number, q = 1): GainNode {
  const src = s.ctx.createBufferSource();
  src.buffer = s.bruit;
  const fl = s.ctx.createBiquadFilter();
  fl.type = type;
  fl.frequency.value = f;
  fl.Q.value = q;
  const gg = s.ctx.createGain();
  gg.gain.setValueAtTime(vel, t);
  gg.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(fl);
  fl.connect(gg);
  gg.connect(s.dest);
  src.start(t, hasard(t) * 0.5, dur + 0.02);
  return gg;
}
function coupSourd(s: SortieSon, t: number, f0: number, f1: number, dur: number, vel: number) {
  const o = s.ctx.createOscillator();
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6);
  const gg = s.ctx.createGain();
  gg.gain.setValueAtTime(vel, t);
  gg.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(gg);
  gg.connect(s.dest);
  o.start(t);
  o.stop(t + dur + 0.05);
}
function note(s: SortieSon, t: number, f: number, vel: number, dur: number, avecSalle = true) {
  const o = s.ctx.createOscillator();
  o.type = "sine";
  o.frequency.value = f;
  const gg = s.ctx.createGain();
  gg.gain.setValueAtTime(0.0001, t);
  gg.gain.linearRampToValueAtTime(vel, t + 0.006);
  gg.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(gg);
  gg.connect(s.dest);
  if (avecSalle) gg.connect(s.salle);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** LE CLIC DE L'APPAREIL : deux claquements secs, un coup sourd, un souffle. */
export function sonClic(s: SortieSon, t: number) {
  souffle(s, t, 0.02, "highpass", 3500, 0.5);
  souffle(s, t + 0.045, 0.025, "highpass", 2500, 0.4);
  coupSourd(s, t, 90, 40, 0.5, 0.45);
  souffle(s, t, 0.9, "highpass", 5000, 0.12).connect(s.salle);
}
/** UNE CARTE ARRIVE : un souffle qui monte, puis deux notes claires. */
export function sonCarte(s: SortieSon, t: number) {
  const src = s.ctx.createBufferSource();
  src.buffer = s.bruit;
  const fl = s.ctx.createBiquadFilter();
  fl.type = "bandpass";
  fl.Q.value = 1.4;
  fl.frequency.setValueAtTime(400, t - 0.08);
  fl.frequency.exponentialRampToValueAtTime(5000, t + 0.2);
  const gg = s.ctx.createGain();
  gg.gain.setValueAtTime(0.0001, t - 0.08);
  gg.gain.linearRampToValueAtTime(0.5, t + 0.08);
  gg.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
  src.connect(fl);
  fl.connect(gg);
  gg.connect(s.dest);
  src.start(Math.max(0, t - 0.08), 0, 0.45);
  note(s, t + 0.18, freq(84), 0.12, 0.92);
  note(s, t + 0.27, freq(91), 0.12, 0.92);
}
/** LA CARTE S'EN VA : un souffle bref. */
export function sonSortieCarte(s: SortieSon, t: number) {
  souffle(s, t, 0.3, "bandpass", 2500, 0.18, 0.7);
}
/** UN MOT QUI FRAPPE : un coup sourd et un souffle. */
export function sonFrappe(s: SortieSon, t: number) {
  coupSourd(s, t, 120, 38, 0.6, 0.5);
  souffle(s, t, 0.22, "bandpass", 2200, 0.26, 0.7).connect(s.salle);
}
/** LE COUP DE ZOOM : une note qui plonge dans le grave. */
export function sonZoom(s: SortieSon, t: number) {
  const o = s.ctx.createOscillator();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(220, t);
  o.frequency.exponentialRampToValueAtTime(55, t + 0.9);
  const fl = s.ctx.createBiquadFilter();
  fl.type = "lowpass";
  fl.frequency.value = 600;
  const gg = s.ctx.createGain();
  gg.gain.setValueAtTime(0.0001, t);
  gg.gain.linearRampToValueAtTime(0.16, t + 0.08);
  gg.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
  o.connect(fl);
  fl.connect(gg);
  gg.connect(s.dest);
  gg.connect(s.salle);
  o.start(t);
  o.stop(t + 1.2);
  souffle(s, t, 0.5, "bandpass", 900, 0.2, 0.6).connect(s.salle);
}
/** Un petit tic : une ligne de la carte de fin qui se pose. */
export function sonTic(s: SortieSon, t: number) {
  const o = s.ctx.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(900, t);
  o.frequency.exponentialRampToValueAtTime(1500, t + 0.05);
  const gg = s.ctx.createGain();
  gg.gain.setValueAtTime(0.08, t);
  gg.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
  o.connect(gg);
  gg.connect(s.dest);
  o.start(t);
  o.stop(t + 0.1);
}
/** Le tampon qui se pose. */
export function sonTampon(s: SortieSon, t: number) {
  coupSourd(s, t, 160, 60, 0.3, 0.6);
}
/** LA SIGNATURE SONORE : la même petite mélodie à chaque fin d'épisode. */
export function sonSignature(s: SortieSon, t: number) {
  souffle(s, t, 0.015, "highpass", 4000, 0.7);
  for (const [n, d] of [
    [76, 0.06],
    [83, 0.24],
  ])
    for (const [h, a] of [
      [1, 0.32],
      [4, 0.06],
      [2.01, 0.08],
    ])
      note(s, t + d, freq(n) * h, a, h === 1 ? 1.6 : 0.4);
}

/* ═══ LA MUSIQUE : UNE BOUCLE HOUSE DE HUIT MESURES, NOTE PAR NOTE ═════════
 *
 * 118 battements par minute : la grosse caisse à chaque temps, le clap sur le
 * deux et le quatre, la charleston entre les temps, une basse qui répond, des
 * accords courts (la mineur, fa, do, sol). Seize secondes, rendues une fois
 * hors du temps, puis jouées en boucle sous l'interview.
 */
export const BPM = 118;
export async function fabriquerMusique(sr = 44100): Promise<AudioBuffer> {
  const temps = 60 / BPM;
  const mesures = 8;
  const duree = mesures * 4 * temps;
  const ctx = new OfflineAudioContext(2, Math.ceil(duree * sr), sr);
  const maitre = ctx.createDynamicsCompressor();
  maitre.threshold.value = -16;
  maitre.ratio.value = 4;
  maitre.attack.value = 0.005;
  maitre.release.value = 0.12;
  maitre.connect(ctx.destination);
  const bruit = bruitBlanc(ctx);
  const ton = (t: number, f0: number, f1: number, dur: number, vel: number) => {
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + 0.12);
    const gg = ctx.createGain();
    gg.gain.setValueAtTime(vel, t);
    gg.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(gg);
    gg.connect(maitre);
    o.start(t);
    o.stop(t + dur + 0.02);
  };
  const frotte = (t: number, dur: number, type: BiquadFilterType, f: number, vel: number, q = 0.8, pan = 0) => {
    const src = ctx.createBufferSource();
    src.buffer = bruit;
    const fl = ctx.createBiquadFilter();
    fl.type = type;
    fl.frequency.value = f;
    fl.Q.value = q;
    const gg = ctx.createGain();
    gg.gain.setValueAtTime(vel, t);
    gg.gain.exponentialRampToValueAtTime(0.001, t + dur);
    const pn = ctx.createStereoPanner();
    pn.pan.value = pan;
    src.connect(fl);
    fl.connect(gg);
    gg.connect(pn);
    pn.connect(maitre);
    src.start(t, hasard(t * 3) * 0.6, dur + 0.02);
  };
  // la mineur, fa, do, sol : la basse, et l'accord
  const GRILLE = [
    { basse: 45, accord: [57, 60, 64] },
    { basse: 41, accord: [57, 60, 65] },
    { basse: 48, accord: [55, 60, 64] },
    { basse: 43, accord: [55, 59, 62] },
  ];
  // la basse et les accords passent par un filtre qui « respire » avec la grosse caisse
  const souffleGain = ctx.createGain();
  souffleGain.connect(maitre);
  for (let m = 0; m < mesures; m++) {
    const g = GRILLE[m % 4];
    for (let b = 0; b < 4; b++) {
      const t = (m * 4 + b) * temps;
      ton(t, 150, 45, 0.34, 0.95);
      souffleGain.gain.setValueAtTime(0.35, t);
      souffleGain.gain.linearRampToValueAtTime(1, t + temps * 0.45);
      if (b % 2 === 1) {
        frotte(t, 0.16, "bandpass", 1400, 0.42);
        frotte(t + 0.012, 0.14, "bandpass", 1700, 0.3);
      }
      frotte(t + temps / 2, 0.09, "highpass", 8000, 0.16, 0.7, 0.25);
      for (const k of [1, 3]) frotte(t + (k * temps) / 4, 0.03, "highpass", 9500, 0.06, 0.7, -0.3);
      // la basse, entre les temps
      const tb = t + temps / 2;
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = freq(g.basse - 12);
      const fl = ctx.createBiquadFilter();
      fl.type = "lowpass";
      fl.Q.value = 4;
      fl.frequency.setValueAtTime(520, tb);
      fl.frequency.exponentialRampToValueAtTime(140, tb + temps * 0.45);
      const gg = ctx.createGain();
      gg.gain.setValueAtTime(0.0001, tb);
      gg.gain.linearRampToValueAtTime(0.34, tb + 0.01);
      gg.gain.exponentialRampToValueAtTime(0.001, tb + temps * 0.48);
      o.connect(fl);
      fl.connect(gg);
      gg.connect(souffleGain);
      o.start(tb);
      o.stop(tb + temps * 0.5);
      // l'accord, court, sur le contretemps
      for (const n of g.accord) {
        const a = ctx.createOscillator();
        a.type = "triangle";
        a.frequency.value = freq(n);
        const fa = ctx.createBiquadFilter();
        fa.type = "lowpass";
        fa.frequency.value = 2400;
        const ga = ctx.createGain();
        ga.gain.setValueAtTime(0.0001, tb);
        ga.gain.linearRampToValueAtTime(0.055, tb + 0.008);
        ga.gain.exponentialRampToValueAtTime(0.001, tb + 0.26);
        a.connect(fa);
        fa.connect(ga);
        ga.connect(souffleGain);
        a.start(tb);
        a.stop(tb + 0.3);
      }
    }
    // une nappe douce sous toute la mesure
    for (const n of g.accord) {
      const t0 = m * 4 * temps;
      const nappe = ctx.createOscillator();
      nappe.type = "sine";
      nappe.frequency.value = freq(n + 12);
      const gn = ctx.createGain();
      gn.gain.setValueAtTime(0.0001, t0);
      gn.gain.linearRampToValueAtTime(0.018, t0 + 0.4);
      gn.gain.setValueAtTime(0.018, t0 + 4 * temps - 0.3);
      gn.gain.linearRampToValueAtTime(0.0001, t0 + 4 * temps);
      nappe.connect(gn);
      gn.connect(souffleGain);
      nappe.start(t0);
      nappe.stop(t0 + 4 * temps + 0.02);
    }
  }
  return ctx.startRendering();
}
