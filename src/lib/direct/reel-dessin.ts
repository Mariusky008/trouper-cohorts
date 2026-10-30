/**
 * 🎞️ LE DESSIN DU REEL DU JOUR — image par image (les règles sont dans `reel-du-jour.ts`, l'enregistrement
 * dans `reel-montage.ts`).
 *
 *   · L'ACCROCHE : la photo de son plat en plein écran, qui arrive de très près ; son plat en géant, son prix.
 *   · SA PHRASE : sa vidéo (ou sa photo, s'il ne se montre pas), ses mots qui s'allument un à un.
 *   · L'APPEL : la cage dorée tombe, tremble, se soulève — un cadeau dessous, « 15 surprises du chef » (son
 *     vrai stock) ; sans surprise aujourd'hui, son fantôme qui invite. Puis le chemin : « Lien dans ma bio ».
 *
 * Pas d'émoji dessiné : un téléphone sans la police des émojis afficherait des carrés.
 *
 * FICHIER NAVIGATEUR : il dessine sur la toile du montage.
 */
import { morceauxDeMots, type MorceauDit } from "./interview-fantome";
import {
  HAUTEUR as H,
  LARGEUR as W,
  CREME,
  NUIT,
  ROSE,
  borne,
  couvrirImage,
  dessinerGrain,
  dessinerSousTitres,
  douce,
  eclairDuClic,
  largeurTexte,
  lueur,
  mix,
  rebond,
  rectArrondi,
  sortie,
  texte,
  type Polices,
} from "./interview-signature";
import { enPied, svgCage } from "./famille-video";
import { REEL, appelDuReel, type PhraseDuReel } from "./reel-du-jour";

const OR = "#F2C762";

export type ImagesReel = {
  /** La photo du jour (son plat). */
  photo: HTMLImageElement | null;
  /** La même, floutée : le fond de l'appel. */
  fond: HTMLCanvasElement | null;
  cage: HTMLImageElement | null;
  /** Son fantôme à lui (l'appel sans surprise). */
  hote: HTMLImageElement | null;
  grain: HTMLCanvasElement | null;
};

export type SceneReel = {
  plat: string;
  prix: string;
  commerce: string;
  phrase: PhraseDuReel | null;
  appel: ReturnType<typeof appelDuReel>;
  /** « clikme.fr/f/son-lien », sous le chemin. */
  lien: string | null;
  /** Sa prise, pendant sa phrase — `null` : sa photo à la place (il ne se montre pas, ou pas de vidéo). */
  video: HTMLVideoElement | null;
};

/** Les temps de la scène : où commencent sa phrase et l'appel, et la fin. */
export function tempsDuReel(phrase: PhraseDuReel | null) {
  const accroche = phrase ? REEL.accroche : REEL.accrocheSansPhrase;
  const longueur = phrase ? phrase.a - phrase.de : 0;
  return { phrase: accroche, appel: accroche + longueur, fin: accroche + longueur + REEL.appel };
}

function image(src: string): Promise<HTMLImageElement | null> {
  return new Promise((ok) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => ok(null);
    i.src = src;
  });
}

/** La cage dorée de la surprise du chef (la même que sur sa page), une fois. */
export const chargerCageDoree = () => image(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgCage(OR))}`);

/** Le plat en géant : la plus grande taille où il tient, sur deux lignes au plus. */
function lignesDuPlat(g: CanvasRenderingContext2D, P: Polices, plat: string): { lignes: string[]; taille: number } {
  const mots = plat.trim().toLocaleUpperCase("fr-FR").split(/\s+/).filter(Boolean);
  const police = (t: number) => `${t}px ${P.affiche}`;
  for (let taille = 132; taille >= 48; taille -= 6) {
    if (largeurTexte(g, mots.join(" "), police(taille), 2) <= 640) return { lignes: [mots.join(" ")], taille };
    for (let c = 1; c < mots.length; c++) {
      const l = [mots.slice(0, c).join(" "), mots.slice(c).join(" ")];
      if (l.every((x) => largeurTexte(g, x, police(taille), 2) <= 640)) return { lignes: l, taille };
    }
  }
  return { lignes: [mots.join(" ")], taille: 44 };
}

function fondNoir(g: CanvasRenderingContext2D) {
  g.fillStyle = NUIT;
  g.fillRect(0, 0, W, H);
}

/** Un dégradé sombre, en haut ou en bas : les mots se lisent sur n'importe quelle photo. */
function ombreBord(g: CanvasRenderingContext2D, haut: boolean, h: number, a: number) {
  const d = haut ? g.createLinearGradient(0, 0, 0, h) : g.createLinearGradient(0, H, 0, H - h);
  d.addColorStop(0, `rgba(0,0,0,${a})`);
  d.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = d;
  g.fillRect(0, haut ? 0 : H - h, W, h);
}

/* ═══ L'ACCROCHE ════════════════════════════════════════════════════════════ */
function accroche(g: CanvasRenderingContext2D, P: Polices, s: SceneReel, im: ImagesReel, u: number) {
  if (im.photo) couvrirImage(g, im.photo, im.photo.naturalWidth, im.photo.naturalHeight, { z: mix(1.32, 1.06, sortie(u / 0.55)) + 0.025 * u });
  else fondNoir(g);
  ombreBord(g, true, 560, 0.72);
  const { lignes, taille } = lignesDuPlat(g, P, s.plat);
  const e = rebond((u - 0.12) / 0.42);
  if (e > 0) {
    g.save();
    g.translate(W / 2, 250);
    g.scale(e, e);
    lignes.forEach((l, i) => texte(g, l, 0, (i - (lignes.length - 1) / 2) * taille * 0.98 + taille * 0.36, `${taille}px ${P.affiche}`, CREME, { align: "center", ls: 2, contour: 10, ombre: 5 }));
    g.restore();
  }
  const prix = s.prix.trim();
  const b = rebond((u - 0.5) / 0.4);
  if (prix && b > 0) {
    const y = 250 + (lignes.length * taille) / 2 + 74;
    const w = largeurTexte(g, prix, `900 46px ${P.texte}`) + 64;
    g.save();
    g.translate(W / 2, y);
    g.scale(b, b);
    g.rotate(-0.04);
    g.fillStyle = ROSE;
    rectArrondi(g, -w / 2, -40, w, 80, 40);
    g.fill();
    texte(g, prix, 0, 16, `900 46px ${P.texte}`, "#FFFFFF", { align: "center" });
    g.restore();
  }
  // CHEZ QUI : en bas, discret
  const a = borne((u - 0.7) / 0.3);
  if (a > 0 && s.commerce.trim()) {
    ombreBord(g, false, 260, 0.55 * a);
    g.save();
    g.globalAlpha = a;
    texte(g, s.commerce.trim(), W / 2, H - 120, `800 34px ${P.texte}`, CREME, { align: "center", ombre: 3 });
    g.restore();
  }
  eclairDuClic(g, u - 0.02);
}

/* ═══ SA PHRASE ═════════════════════════════════════════════════════════════ */
function saPhrase(g: CanvasRenderingContext2D, P: Polices, s: SceneReel, im: ImagesReel, u: number, morceaux: MorceauDit[]) {
  const v = s.video;
  if (v && v.readyState >= 2 && v.videoWidth) couvrirImage(g, v, v.videoWidth, v.videoHeight, { fy: 0.38, z: 1 + 0.02 * u });
  else if (im.photo) couvrirImage(g, im.photo, im.photo.naturalWidth, im.photo.naturalHeight, { z: 1.08 + 0.035 * u, fx: 0.46 + 0.02 * u });
  else fondNoir(g);
  ombreBord(g, false, 520, 0.6);
  if (!s.phrase) return;
  const tr = s.phrase.de + u;
  const m = morceaux.find((x) => tr >= x.de && tr < x.fin) ?? (tr >= (morceaux[morceaux.length - 1]?.de ?? Infinity) ? morceaux[morceaux.length - 1] : undefined);
  dessinerSousTitres(g, P, m, tr, 1000);
  eclairDuClic(g, u);
}

/* ═══ L'APPEL ═══════════════════════════════════════════════════════════════ */
/** Le cadeau sous la cage : une boîte rose, son ruban d'or, son nœud. */
function cadeau(g: CanvasRenderingContext2D, cx: number, bas: number, e: number) {
  g.save();
  g.translate(cx, bas);
  g.scale(e, e);
  g.fillStyle = ROSE;
  rectArrondi(g, -95, -150, 190, 150, 14);
  g.fill();
  g.fillStyle = "#D61E7E";
  rectArrondi(g, -108, -190, 216, 52, 12);
  g.fill();
  g.fillStyle = OR;
  g.fillRect(-16, -190, 32, 190);
  g.fillRect(-108, -172, 216, 20);
  for (const sens of [-1, 1]) {
    g.beginPath();
    g.ellipse(sens * 38, -206, 40, 22, sens * -0.45, 0, Math.PI * 2);
    g.fill();
  }
  g.beginPath();
  g.arc(0, -200, 16, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

function lAppel(g: CanvasRenderingContext2D, P: Polices, s: SceneReel, im: ImagesReel, u: number) {
  if (im.fond) g.drawImage(im.fond, 0, 0, W, H);
  else fondNoir(g);
  g.fillStyle = "rgba(10,4,8,.62)";
  g.fillRect(0, 0, W, H);
  const Y = 820;
  if (s.appel.cage) {
    // LA CAGE TOMBE, TREMBLE, SE SOULÈVE : le cadeau dessous
    const tombe = rebond(u / 0.42);
    const tremble = u > 0.45 && u < 0.95 ? Math.sin((u - 0.45) * 46) * 0.05 * (1 - (u - 0.45) / 0.5) : 0;
    const leve = douce(borne((u - 0.95) / 0.5));
    const ouvert = borne((u - 1.05) / 0.4);
    if (ouvert > 0) {
      lueur(g, W / 2, Y - 110, 420 * ouvert, `rgba(242,199,98,${0.55 * ouvert})`);
      cadeau(g, W / 2, Y, rebond(ouvert));
    }
    if (im.cage && leve < 1) {
      g.save();
      g.globalAlpha = 1 - borne((leve - 0.7) / 0.3);
      g.translate(W / 2, mix(-500, Y + 30, tombe) - 900 * leve);
      g.rotate(tremble);
      g.drawImage(im.cage, -170, -500, 340, 500);
      g.restore();
    }
  } else {
    const e = rebond(u / 0.5);
    lueur(g, W / 2, Y - 180, 400, "rgba(255,46,154,.34)");
    enPied(g, im.hote, W / 2, Y + 20, 380 * e, 0.06 * Math.sin(u * 3));
  }
  // CE QU'IL Y A DEDANS : le vrai stock, ou l'invitation
  const t = sortie((u - (s.appel.cage ? 1.1 : 0.35)) / 0.4);
  if (t > 0) {
    g.save();
    g.globalAlpha = t;
    let taille = 78;
    while (taille > 40 && largeurTexte(g, s.appel.haut, `${taille}px ${P.affiche}`, 1) > 620) taille -= 4;
    texte(g, s.appel.haut, W / 2, mix(260, 240, t), `${taille}px ${P.affiche}`, CREME, { align: "center", ls: 1, ombre: 5 });
    texte(g, s.appel.sous, W / 2, 316, `italic 700 40px ${P.serif}`, s.appel.cage ? OR : ROSE, { align: "center" });
    g.restore();
  }
  // LE CHEMIN
  const b = rebond((u - (s.appel.cage ? 1.55 : 0.8)) / 0.4);
  if (b > 0) {
    g.save();
    g.translate(W / 2, 1000);
    g.scale(b, b);
    g.fillStyle = ROSE;
    rectArrondi(g, -280, -54, 560, 108, 54);
    g.fill();
    texte(g, s.appel.bas, 0, 17, `800 46px ${P.texte}`, "#FFFFFF", { align: "center" });
    g.restore();
  }
  const l = sortie((u - (s.appel.cage ? 1.9 : 1.15)) / 0.4);
  if (l > 0 && s.lien) {
    g.save();
    g.globalAlpha = l;
    texte(g, s.lien, W / 2, 1110, `600 30px ${P.texte}`, "rgba(255,244,230,.88)", { align: "center" });
    g.restore();
  }
  eclairDuClic(g, u);
}

/** Une image du Reel, à `t` secondes de son début. `morceaux` : ceux de sa phrase (`morceauxDuReel`). */
export function dessinerReel(g: CanvasRenderingContext2D, P: Polices, s: SceneReel, im: ImagesReel, t: number, morceaux: MorceauDit[]) {
  const T = tempsDuReel(s.phrase);
  if (t < T.phrase) accroche(g, P, s, im, t);
  else if (t < T.appel) saPhrase(g, P, s, im, t - T.phrase, morceaux);
  else lAppel(g, P, s, im, t - T.appel);
  if (im.grain) dessinerGrain(g, im.grain, t);
}

/** Les morceaux de sa phrase à l'écran (dix-sept signes au plus chacun). */
export const morceauxDuReel = (phrase: PhraseDuReel | null) => (phrase ? morceauxDeMots(phrase.mots) : []);
