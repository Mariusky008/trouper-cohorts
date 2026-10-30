/**
 * 🎞️ LE DESSIN DU REEL DU JOUR — image par image (les règles sont dans `reel-du-jour.ts`, l'enregistrement
 * dans `reel-montage.ts`). La même signature que l'interview « Face au fantôme » : ses polices (Anton en
 * géant, Poppins, Playfair), les petites étiquettes roses espacées, le cadre aux quatre coins roses, le fond
 * des cartes de question.
 *
 *   · L'ACCROCHE : la photo de son plat qui arrive de très près ; en bas, « CE MIDI CHEZ BERGINE » en rose,
 *     son plat en géant, son prix en rose.
 *   · SA PHRASE : sa vidéo (ou sa photo, s'il ne se montre pas) dans le cadre, ses mots qui s'allument un à un.
 *   · L'APPEL, comme une carte de question : « LA SURPRISE DU CHEF · LES 15 PREMIERS qui ouvrent ma cage dorée
 *     gagnent une surprise. » Son fantôme dans la cage dorée pousse, la cage s'envole, il est libre — une pluie
 *     d'or, un cadeau. Puis « Lien dans ma bio ». Sans surprise aujourd'hui : son fantôme libre, qui invite.
 *
 * TOUT CE QUI COMPTE RESTE DANS LA ZONE SÛRE d'un Reel : ni sous la légende d'Instagram en bas (au-dessus de
 * 1 080 px sur 1 280), ni sous ses boutons à droite.
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
  dessinerCadre,
  dessinerGrain,
  dessinerSousTitres,
  eclairDuClic,
  hasard,
  largeurTexte,
  lueur,
  mix,
  rebond,
  rectArrondi,
  sortie,
  tailleQuiTient,
  texte,
  type Polices,
} from "./interview-signature";
import { enPied, svgCage } from "./famille-video";
import { REEL, type AppelDuReel, type PhraseDuReel } from "./reel-du-jour";

const OR = "#F2C762";
/** La marge de gauche des cartes de l'interview. */
const X = 52;

export type ImagesReel = {
  /** La photo du jour (son plat). */
  photo: HTMLImageElement | null;
  /** Le fond des cartes de question (`fabriquerFondCarte`). */
  fondCarte: HTMLCanvasElement | null;
  cage: HTMLImageElement | null;
  /** Son fantôme à lui, qui salue : dans la cage, puis libre. */
  hote: HTMLImageElement | null;
  grain: HTMLCanvasElement | null;
};

export type SceneReel = {
  plat: string;
  prix: string;
  /** « CE MIDI CHEZ BERGINE », « AUJOURD'HUI À L'ATELIER » (`enteteArdoise`). */
  entete: string;
  /** En haut à gauche, sous « FACE AU FANTÔME » : « Chez Bergine · Dax ». */
  nomCadre: string;
  phrase: PhraseDuReel | null;
  appel: AppelDuReel;
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

/** Des lignes sur deux au plus, coupées là où elles s'équilibrent — quand une seule ligne tomberait sous `seuil` × `max`. */
function enLignes(g: CanvasRenderingContext2D, t: string, police: (taille: number) => string, max: number, largeur: number, seuil = 0.7): { lignes: string[]; taille: number } {
  const seule = [t];
  const tSeule = tailleQuiTient(g, seule, police, max, largeur, 1, 4);
  const mots = t.split(/\s+/);
  if (tSeule >= max * seuil || mots.length < 2) return { lignes: seule, taille: tSeule };
  let mieux = seule;
  let ecart = Infinity;
  for (let k = 1; k < mots.length; k++) {
    const l = [mots.slice(0, k).join(" "), mots.slice(k).join(" ")];
    const e = Math.max(...l.map((x) => x.length));
    if (e < ecart) {
      ecart = e;
      mieux = l;
    }
  }
  return { lignes: mieux, taille: tailleQuiTient(g, mieux, police, max, largeur, 1, 4) };
}

/** Une ligne en géant, l'`accent` (un chiffre, un « ? ») en rose. */
function ligneGeante(g: CanvasRenderingContext2D, l: string, x: number, y: number, police: string, accent: string | null) {
  const i = accent ? l.indexOf(accent) : -1;
  if (i < 0 || !accent) return texte(g, l, x, y, police, CREME, { ls: 1, ombre: 4 });
  const avant = l.slice(0, i);
  texte(g, avant, x, y, police, CREME, { ls: 1, ombre: 4 });
  const xa = x + largeurTexte(g, avant, police, 1);
  texte(g, accent, xa, y, police, ROSE, { ls: 1, ombre: 4 });
  texte(g, l.slice(i + accent.length), xa + largeurTexte(g, accent, police, 1), y, police, CREME, { ls: 1, ombre: 4 });
}

/** Le dégradé de la nuit, du bas : les mots se lisent sur n'importe quelle photo. */
function nuitDuBas(g: CanvasRenderingContext2D, depuis: number, a: number) {
  const d = g.createLinearGradient(0, depuis, 0, H);
  d.addColorStop(0, "rgba(20,12,9,0)");
  d.addColorStop(0.45, `rgba(20,12,9,${a * 0.75})`);
  d.addColorStop(1, `rgba(20,12,9,${a})`);
  g.fillStyle = d;
  g.fillRect(0, depuis, W, H - depuis);
}

/* ═══ L'ACCROCHE ════════════════════════════════════════════════════════════ */
function accroche(g: CanvasRenderingContext2D, P: Polices, s: SceneReel, im: ImagesReel, u: number) {
  if (im.photo) couvrirImage(g, im.photo, im.photo.naturalWidth, im.photo.naturalHeight, { z: mix(1.34, 1.06, sortie(u / 0.55)) + 0.022 * u });
  else {
    g.fillStyle = NUIT;
    g.fillRect(0, 0, W, H);
  }
  nuitDuBas(g, 400, 0.94);
  dessinerCadre(g, P, u - 0.25, s.nomCadre);
  // DE BAS EN HAUT : le prix, son plat en géant, l'étiquette — le tout au-dessus de la légende d'Instagram
  const police = (t: number) => `${t}px ${P.affiche}`;
  const { lignes, taille } = enLignes(g, s.plat.trim().toLocaleUpperCase("fr-FR"), police, 150, 616);
  const pas = taille * 1.0;
  const prix = s.prix.trim();
  const yPrix = 1040;
  const yDerniere = prix ? yPrix - 96 : 1040;
  const yPremiere = yDerniere - (lignes.length - 1) * pas;
  const entre = (d: number) => sortie((u - d) / 0.3);
  g.save();
  g.globalAlpha = entre(0.15);
  // au-dessus des capitales d'Anton (elles montent presque jusqu'à la taille de la police)
  texte(g, s.entete, X + 4, yPremiere - taille * 0.98 - 14 - 20 * (1 - entre(0.15)), `800 23px ${P.texte}`, ROSE, { ls: 5, ombre: 2 });
  g.restore();
  lignes.forEach((l, k) => {
    const a = entre(0.22 + 0.08 * k);
    g.save();
    g.globalAlpha = a;
    texte(g, l, X, yPremiere + k * pas + 47 * (1 - a), police(taille), CREME, { ls: 1, ombre: 4 });
    g.restore();
  });
  if (prix) {
    const b = rebond((u - 0.55) / 0.4);
    if (b > 0) {
      g.save();
      g.translate(X, yPrix);
      g.scale(b, b);
      texte(g, prix, 0, 0, `86px ${P.affiche}`, ROSE, { ls: 1, ombre: 4 });
      g.restore();
    }
  }
  eclairDuClic(g, u - 0.02);
}

/* ═══ SA PHRASE ═════════════════════════════════════════════════════════════ */
function saPhrase(g: CanvasRenderingContext2D, P: Polices, s: SceneReel, im: ImagesReel, u: number, morceaux: MorceauDit[], depuis: number) {
  const v = s.video;
  if (v && v.readyState >= 2 && v.videoWidth) couvrirImage(g, v, v.videoWidth, v.videoHeight, { fy: 0.38, z: 1 + 0.02 * u });
  else if (im.photo) couvrirImage(g, im.photo, im.photo.naturalWidth, im.photo.naturalHeight, { z: 1.08 + 0.035 * u, fx: 0.46 + 0.02 * u });
  else {
    g.fillStyle = NUIT;
    g.fillRect(0, 0, W, H);
  }
  nuitDuBas(g, 760, 0.55);
  dessinerCadre(g, P, depuis, s.nomCadre);
  if (!s.phrase) return;
  const tr = s.phrase.de + u;
  const dernier = morceaux[morceaux.length - 1];
  const m = morceaux.find((x) => tr >= x.de && tr < x.fin) ?? (dernier && tr >= dernier.de ? dernier : undefined);
  dessinerSousTitres(g, P, m, tr);
  eclairDuClic(g, u);
}

/* ═══ L'APPEL ═══════════════════════════════════════════════════════════════ */
/** Une étoile d'or à quatre branches. */
function etoile(g: CanvasRenderingContext2D, x: number, y: number, r: number, a: number) {
  if (r <= 0 || a <= 0) return;
  g.save();
  g.globalAlpha = a;
  g.translate(x, y);
  g.fillStyle = OR;
  g.beginPath();
  for (let k = 0; k < 8; k++) {
    const rr = k % 2 ? r * 0.28 : r;
    const ang = (k * Math.PI) / 4 - Math.PI / 2;
    g.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
  }
  g.closePath();
  g.fill();
  g.restore();
}

/** Le cadeau : une boîte rose, son ruban d'or, son nœud. */
function cadeau(g: CanvasRenderingContext2D, cx: number, bas: number, e: number, angle: number) {
  if (e <= 0) return;
  g.save();
  g.translate(cx, bas);
  g.rotate(angle);
  g.scale(e, e);
  g.fillStyle = ROSE;
  rectArrondi(g, -48, -74, 96, 74, 9);
  g.fill();
  g.fillStyle = "#D61E7E";
  rectArrondi(g, -55, -94, 110, 26, 7);
  g.fill();
  g.fillStyle = OR;
  g.fillRect(-8, -94, 16, 94);
  for (const sens of [-1, 1]) {
    g.beginPath();
    g.ellipse(sens * 19, -102, 20, 11, sens * -0.45, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

/** Les temps de l'appel (depuis son début) : la cage arrive, tremble, s'envole ; le chemin. */
const APPEL = { cage: 0.3, tremble: 0.85, libre: 1.4, chemin: 1.75, lien: 2.05 } as const;

function lAppel(g: CanvasRenderingContext2D, P: Polices, s: SceneReel, im: ImagesReel, u: number) {
  if (im.fondCarte) g.drawImage(im.fondCarte, 0, 0);
  else {
    g.fillStyle = NUIT;
    g.fillRect(0, 0, W, H);
  }
  // les rayures du plateau, qui glissent (celles des cartes de question)
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

  // LES MOTS, comme une carte : l'étiquette rose, les lignes en géant, la phrase dessous
  const a = s.appel;
  const entre = (d: number) => sortie((u - d) / 0.3);
  g.save();
  g.globalAlpha = entre(0.05);
  texte(g, a.etiquette, X + 4, 214 - 20 * (1 - entre(0.05)), `800 23px ${P.texte}`, ROSE, { ls: 5 });
  g.restore();
  const taille = tailleQuiTient(g, a.lignes, (t) => `${t}px ${P.affiche}`, 120, 600, 1, 4);
  const pas = taille * 1.02;
  const y0 = 214 + taille * 0.98;
  a.lignes.forEach((l, k) => {
    const e = entre(0.1 + 0.08 * k);
    g.save();
    g.globalAlpha = e;
    ligneGeante(g, l, X, y0 + k * pas + 47 * (1 - e), `${taille}px ${P.affiche}`, a.accent);
    g.restore();
  });
  // LA PHRASE DESSOUS, lisible : sur deux lignes plutôt qu'en petit
  const ySous = y0 + (a.lignes.length - 1) * pas + 62;
  const { lignes: sous, taille: tSous } = enLignes(g, a.sous, (t) => `600 ${t}px ${P.texte}`, 36, 600, 0.95);
  g.save();
  g.globalAlpha = entre(0.32);
  sous.forEach((l, k) => texte(g, l, X + 4, ySous + k * tSous * 1.25, `600 ${tSous}px ${P.texte}`, "rgba(255,244,230,.92)"));
  g.restore();

  // LE FANTÔME : dans la cage dorée, qui pousse ; la cage s'envole ; il est libre, sous une pluie d'or
  // sous la phrase (vers 540 px), au-dessus du chemin (vers 990 px)
  const cx = 330;
  const bas = 950;
  const haut = 300;
  const arrive = rebond((u - APPEL.cage) / 0.42);
  const libre = a.cage ? borne((u - APPEL.libre) / 0.35) : 1;
  const lueurA = a.cage ? 0.25 + 0.75 * libre : arrive;
  if (lueurA > 0) lueur(g, cx, bas - haut * 0.5, 330, a.cage ? `rgba(242,199,98,${0.4 * lueurA})` : `rgba(255,46,154,${0.34 * lueurA})`);
  const pousse = a.cage && u > APPEL.tremble && u < APPEL.libre ? Math.sin((u - APPEL.tremble) * 42) * 0.06 : 0;
  const saut = libre > 0 && libre < 1 ? Math.sin(libre * Math.PI) * 46 : 0;
  if (arrive > 0) {
    g.save();
    g.translate(cx, bas);
    g.scale(arrive, arrive);
    enPied(g, im.hote, 0, -saut, haut * (a.cage && libre <= 0 ? 0.82 : 1), pousse + (libre >= 1 ? 0.05 * Math.sin(u * 3.2) : 0));
    g.restore();
  }
  if (a.cage && im.cage && libre < 1) {
    // la cage, par-dessus lui ; elle tremble quand il pousse, puis s'envole
    const envol = sortie(libre);
    g.save();
    g.globalAlpha = borne(1 - envol * 1.7);
    g.translate(cx, bas + 20 - 260 * envol);
    g.scale(arrive, arrive);
    g.rotate(pousse * 0.6);
    g.drawImage(im.cage, -130, -360, 260, 380);
    g.restore();
  }
  if (a.cage && libre > 0) {
    // LA PLUIE D'OR, et le cadeau qui sort avec lui
    for (let k = 0; k < 14; k++) {
      const ang = hasard(k) * Math.PI * 2;
      const d = mix(40, 170 + 60 * hasard(k + 20), sortie(borne((u - APPEL.libre) / 0.8)));
      const vie = 1 - borne((u - APPEL.libre - 0.5 - hasard(k + 40) * 0.6) / 0.6);
      etoile(g, cx + Math.cos(ang) * d, bas - haut * 0.55 + Math.sin(ang) * d * 0.8, 10 + 14 * hasard(k + 60), vie);
    }
    cadeau(g, cx + 170, bas - 10, rebond((u - APPEL.libre - 0.15) / 0.4), 0.12 * Math.sin(u * 4));
  }

  // LE CHEMIN
  const b = rebond((u - (a.cage ? APPEL.chemin : 0.75)) / 0.4);
  if (b > 0) {
    g.save();
    g.translate(cx, 995);
    g.scale(b, b);
    g.fillStyle = ROSE;
    const w = Math.max(440, largeurTexte(g, a.bas, `800 42px ${P.texte}`) + 90);
    rectArrondi(g, -w / 2, -46, w, 92, 46);
    g.fill();
    texte(g, a.bas, 0, 15, `800 42px ${P.texte}`, "#FFFFFF", { align: "center" });
    g.restore();
  }
  const l = sortie((u - (a.cage ? APPEL.lien : 1.05)) / 0.4);
  if (l > 0 && s.lien) {
    g.save();
    g.globalAlpha = l;
    texte(g, s.lien, cx, 1072, `600 24px ${P.texte}`, "rgba(255,244,230,.8)", { align: "center", ls: 1 });
    g.restore();
  }
}

/** Une image du Reel, à `t` secondes de son début. `morceaux` : ceux de sa phrase (`morceauxDuReel`). */
export function dessinerReel(g: CanvasRenderingContext2D, P: Polices, s: SceneReel, im: ImagesReel, t: number, morceaux: MorceauDit[]) {
  const T = tempsDuReel(s.phrase);
  if (t < T.phrase) accroche(g, P, s, im, t);
  else if (t < T.appel) saPhrase(g, P, s, im, t - T.phrase, morceaux, t - 0.25);
  else lAppel(g, P, s, im, t - T.appel);
  if (im.grain) dessinerGrain(g, im.grain, t);
}

/** Les morceaux de sa phrase à l'écran (dix-sept signes au plus chacun). */
export const morceauxDuReel = (phrase: PhraseDuReel | null) => (phrase ? morceauxDeMots(phrase.mots) : []);
