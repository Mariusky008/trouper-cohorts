/**
 * 🎭 LE MÈME — 6 novembre 2026, le patron : « quand on fait parler sa figurine, faire comme un mème ultra moderne :
 * quand quelqu'un reçoit ma figurine, il va vouloir la partager ; donc très facile, partageable sans texte ni blabla ;
 * quand on le reçoit, on le voit directement en action, et il parle directement, sans appuyer sur play ».
 *
 * UNE VIDÉO VERTICALE (720 × 1280), FABRIQUÉE DANS LE TÉLÉPHONE, comme les films du Studio (`studio-montage.ts`) : sa
 * figurine plein cadre qui arrive d'un coup (zoom, flash), bouge sur ce qu'elle dit (la bouche s'ouvre sur sa voix, la
 * tête dodeline), son visage du moment, l'emoji de ce qu'elle ressent, la danse si elle danse (et sa musique) ; ses
 * mots en sous-titres façon TikTok, quelques mots à la fois, le mot dit en jaune ; un petit « ClikMe » ; et, à la fin,
 * une seconde « Crée ton mème · clikme.fr ». Une vidéo, c'est ce que WhatsApp montre et rejoue : elle part comme
 * fichier (la feuille de partage du téléphone), et la page du lien la joue toute seule.
 *
 * Le son ne peut pas partir tout seul sur une page (les navigateurs l'interdisent) : la vidéo, si — en silence, avec
 * ses sous-titres —, et le son au premier toucher.
 *
 * 💬 EN DUO (`duo`, « répondre en duo », le même jour) : la réponse à un mème garde le mème d'origine — sa figurine en
 * haut, qui parle d'abord (sa voix, ses mots), puis la sienne en bas, qui répond ; celle qui écoute s'assombrit un peu.
 *
 * 🏪 LE MÈME DU JOUR D'UN COMMERÇANT (7 novembre 2026, `memes-commerces.ts`) : sa figurine annonce une chose précise
 * (« 🍽️ LE MENU DU JOUR », son nom dessous : `annonce`) ; sans sa voix (`son` absent), elle danse sur la musique et
 * ses mots défilent ; à la fin, son nom (`fin`) au lieu de « Crée ton mème ». Jamais de voix fabriquée : sa voix à
 * lui, enregistrée, ou la musique.
 *
 * 🎬 TROIS FAÇONS DE LE DIRE (8 novembre 2026, `rendus.ts`) : avec `rendu`, le mème prend le graphisme choisi — 😂 la
 * BD (sa case, la bulle où ses mots s'écrivent, l'onomatopée), 🎭 le cinéma (le gros plan dans la pénombre, le mot fort
 * en géant, le sous-titre), 🌀 l'affiche (ses mots énormes, un par un ; sa figurine collée comme une photo). Son visage,
 * lui, est dans ses images. `apercuRendu` en dessine une image fixe (les trois vignettes du choix).
 *
 * FICHIER NAVIGATEUR.
 */
import { musiqueDanse } from "./musique-danse";
import type { Rendu } from "./rendus";

export const MEME_L = 720;
export const MEME_H = 1280;
const IPS = 30;
const INTRO = 0.45;
const FIN = 1.5;
const FORMATS = ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4;codecs=avc1,mp4a.40.2", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];

/** Le format vidéo que ce téléphone sait enregistrer (le MP4 d'abord : c'est celui que WhatsApp et l'iPhone lisent). */
export function formatMeme(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const f of FORMATS) {
    try {
      if (MediaRecorder.isTypeSupported(f)) return f;
    } catch {
      /* navigateur ancien */
    }
  }
  return "";
}
/** Ce téléphone sait-il fabriquer un mème ? */
export const memePossible = () => typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && typeof HTMLCanvasElement.prototype.captureStream === "function";

const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sortie = (x: number) => 1 - Math.pow(1 - cl(x), 3);
/** Un rebond qui dépasse un peu (l'arrivée de la figurine, les sous-titres qui « popent »). */
const rebond = (x: number) => {
  const t = cl(x);
  const c = 1.70158 * 1.4;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

/** Une image d'un autre site, rapatriée en `blob:` : le dessin reste « propre » (sinon, pas d'enregistrement). */
async function image(url: string): Promise<HTMLImageElement> {
  const r = await fetch(url, { mode: "cors", cache: "force-cache" });
  if (!r.ok) throw new Error("Sa figurine n’a pas pu être chargée.");
  const u = URL.createObjectURL(await r.blob());
  const i = new Image();
  i.decoding = "async";
  i.src = u;
  await i.decode();
  return i;
}

/** La force de sa voix, image par image (0 à 1) : la bouche s'ouvre dessus, la tête dodeline. */
function enveloppe(b: AudioBuffer): number[] {
  const d = b.getChannelData(0);
  const pas = Math.max(1, Math.floor(b.sampleRate / IPS));
  const l: number[] = [];
  for (let i = 0; i < d.length; i += pas) {
    let s = 0;
    const fin = Math.min(d.length, i + pas);
    for (let k = i; k < fin; k++) s += d[k] * d[k];
    l.push(Math.sqrt(s / Math.max(1, fin - i)));
  }
  const max = Math.max(0.0001, ...l);
  // (adoucie : la bouche ne claque pas à chaque image)
  return l.map((x, k) => cl(((x + (l[k - 1] ?? x)) / 2 / max) * 1.15));
}

type Mot = { mot: string; de: number; a: number };
/** Ses mots, posés sur sa voix : chacun à proportion de sa longueur, un petit temps après la ponctuation. */
export function motsDuTexte(texte: string, duree: number): Mot[] {
  const mots = texte.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (!mots.length || duree <= 0) return [];
  const poids = mots.map((m) => m.length + 2 + (/[.!?…]$/.test(m) ? 6 : /[,;:]$/.test(m) ? 3 : 0));
  const total = poids.reduce((a, b) => a + b, 0);
  let t = 0;
  return mots.map((mot, k) => {
    const de = t;
    t += (poids[k] / total) * duree;
    return { mot, de, a: t };
  });
}
/** Les sous-titres : trois mots au plus (ou 18 signes), qui se suivent. */
function paquets(mots: Mot[]): Mot[][] {
  const l: Mot[][] = [];
  let p: Mot[] = [];
  for (const m of mots) {
    const long = p.reduce((n, x) => n + x.mot.length + 1, 0) + m.mot.length;
    if (p.length && (p.length >= 3 || long > 18)) {
      l.push(p);
      p = [];
    }
    p.push(m);
    if (/[.!?…]$/.test(m.mot)) {
      l.push(p);
      p = [];
    }
  }
  if (p.length) l.push(p);
  return l;
}

type Scene = {
  n: HTMLImageElement;
  p: HTMLImageElement;
  fond: string;
  env: number[];
  duree: number;
  sous: Mot[][];
  /** Ses mots, un à un, posés sur sa voix. */
  mots: Mot[];
  emoji: string;
  danse: boolean;
  police: string;
  /** 🎬 Son graphisme (la BD, le cinéma, l'affiche) ; `trame` : les points de la BD ; `apercu` : une image fixe. */
  rendu?: RenduMeme;
  trame?: CanvasPattern | null;
  apercu?: boolean;
  /** 🏪 Ce qu'annonce un commerçant (en haut), et la fin à son nom. */
  annonce?: AnnonceMeme;
  fin?: FinMeme;
  /** 🎙️ Un message du talkie, envoyé en vidéo par WhatsApp : qui l'envoie, à qui (sa mise en page à lui). */
  message?: MessageMeme;
  /** 💬 En duo : celui à qui il répond (en haut, il parle d'abord), et leurs deux prénoms. */
  duo?: { n: HTMLImageElement; p: HTMLImageElement; fond: string; env: number[]; duree: number; sous: Mot[][]; prenom: string; moi: string };
  /** 🏡 Chez lui (« Univers », lot 5b) : son décor à la place du fond rose, et sa place (sa figurine, détourée, s'y assoit). */
  decor?: { img: HTMLImageElement; x: number; y: number; echelle: number };
};
const PAUSE_DUO = 0.35;
/** Quand commence sa voix à lui (en duo : après celle de l'autre). */
const debutVoix = (S: Scene) => INTRO + (S.duo ? S.duo.duree + PAUSE_DUO : 0);
const dureeTotale = (S: Scene) => debutVoix(S) + S.duree + FIN;

/** La couleur de son fond (le coin de son image), pour remplir ce que la figurine ne couvre pas quand elle bouge. */
function couleurDuFond(i: HTMLImageElement): string {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 4;
  const g = c.getContext("2d");
  if (!g) return "#E0218A";
  g.drawImage(i, 0, 0, i.naturalWidth * 0.06, i.naturalHeight * 0.06, 0, 0, 4, 4);
  const d = g.getImageData(1, 1, 1, 1).data;
  // (une figurine détourée, sur fond transparent : le rose ClikMe)
  if (d[3] < 128) return "#E0218A";
  return `rgb(${d[0]},${d[1]},${d[2]})`;
}

/** La force de la voix à l'instant `t` (depuis son début), 0 hors de sa voix. */
const forceA = (env: number[], duree: number, t: number) => (t >= 0 && t <= duree ? (env[Math.floor(cl(t / Math.max(0.001, duree)) * (env.length - 1))] ?? 0) : 0);

/** Ses mots, façon TikTok : le paquet du moment, le mot dit en jaune ; `y` : le milieu des sous-titres. */
function sousTitres(g: CanvasRenderingContext2D, police: string, sous: Mot[][], t: number, duree: number, y: number, taille = 70): void {
  const W = MEME_L;
  const paquet = sous.find((p) => t >= p[0].de - 0.05 && t < p[p.length - 1].a + 0.25) ?? null;
  if (!paquet || t > duree + 0.25) return;
  const pop = rebond((t - paquet[0].de + 0.05) / 0.22);
  g.save();
  g.translate(W / 2, y);
  g.scale(pop, pop);
  g.font = `900 ${taille}px ${police}`;
  g.textAlign = "left";
  g.textBaseline = "middle";
  g.lineJoin = "round";
  const mots = paquet.map((m) => m.mot.toUpperCase());
  const largeurs = mots.map((m) => g.measureText(m).width);
  const espace = g.measureText(" ").width;
  const lignes: number[][] = [[]];
  let largeur = 0;
  mots.forEach((_, i) => {
    if (largeur && largeur + espace + largeurs[i] > W - 80) {
      lignes.push([]);
      largeur = 0;
    }
    lignes[lignes.length - 1].push(i);
    largeur += (largeur ? espace : 0) + largeurs[i];
  });
  lignes.forEach((ligne, li) => {
    const total = ligne.reduce((n, i, j) => n + largeurs[i] + (j ? espace : 0), 0);
    let x = -total / 2;
    const yy = (li - (lignes.length - 1) / 2) * taille * 1.08;
    for (const i of ligne) {
      const dit = t >= paquet[i].de;
      g.lineWidth = taille * 0.23;
      g.strokeStyle = "#12060F";
      g.strokeText(mots[i], x, yy);
      g.fillStyle = dit && t < paquet[i].a + 0.15 ? "#FFE14D" : "#FFFFFF";
      g.fillText(mots[i], x, yy);
      x += largeurs[i] + espace;
    }
  });
  g.restore();
}

/** Une étiquette arrondie (le petit « ClikMe », le prénom d'une figurine). */
function etiquette(g: CanvasRenderingContext2D, police: string, x: number, y: number, morceaux: { t: string; c: string }[], taille = 30): void {
  g.save();
  g.font = `900 ${taille}px ${police}`;
  g.textBaseline = "middle";
  const l = morceaux.reduce((n, m) => n + g.measureText(m.t).width, 0) + 36;
  g.fillStyle = "rgba(18,6,15,.55)";
  g.beginPath();
  if (typeof g.roundRect === "function") g.roundRect(x, y, l, taille + 20, (taille + 20) / 2);
  else g.rect(x, y, l, taille + 20);
  g.fill();
  let cx = x + 18;
  for (const m of morceaux) {
    g.fillStyle = m.c;
    g.fillText(m.t, cx, y + (taille + 20) / 2);
    cx += g.measureText(m.t).width;
  }
  g.restore();
}

/** 🏪 Ce qu'annonce un commerçant : « 🍽️ LE MENU DU JOUR », et son nom. */
export type AnnonceMeme = { emoji: string; titre: string; nom: string };
/** La fin, autrement que « Crée ton mème » (un commerçant : son nom, sa ville). */
export type FinMeme = { emoji: string; titre: string; sous: string };

/** 🎙️ Un message du talkie : qui l'envoie, à qui. */
export type MessageMeme = { de: string; pour: string };
/**
 * (sa figurine, un peu plus petite et plus bas : le bandeau en haut, son visage au milieu — WhatsApp coupe le haut et le
 * bas de sa vignette —, ses mots sur son corps, au-dessus de la légende que WhatsApp pose sur le bas de la vidéo)
 */
const MESSAGE = { echelle: 0.8, decalage: 50, sousTitres: 0.73 };
/** 🏡 La hauteur de sa figurine chez lui, en part de la hauteur de son décor (comme dans son univers, `monde.tsx`). */
const TAILLE_CHEZ_LUI = 0.4;

/**
 * 🎙️ LE BANDEAU D'UN MESSAGE ENVOYÉ PAR WHATSAPP : « 🎙️ Message de Marius », « pour Karim » — droit, posé dès la
 * première image (WhatsApp en fait la vignette de la vidéo), au-dessus de son visage. Le 10 novembre 2026, sur un
 * iPhone, le bandeau d'annonce (penché, en rebond) sortait du cadre et cachait son visage : ici, rien ne bouge, l'emoji
 * est dessiné à part et la ligne est centrée à la main, rétrécie jusqu'à tenir.
 */
function leMessage(g: CanvasRenderingContext2D, police: string, m: MessageMeme): void {
  const W = MEME_L;
  const EMOJI = 52;
  const ecart = 14;
  const texte = `Message de ${m.de}`.trim();
  let taille = 48;
  g.save();
  g.textAlign = "left";
  g.textBaseline = "middle";
  g.font = `900 ${taille}px ${police}`;
  while (EMOJI + ecart + g.measureText(texte).width > W - 150 && taille > 26) {
    taille -= 2;
    g.font = `900 ${taille}px ${police}`;
  }
  const lt = Math.min(g.measureText(texte).width, W - 150 - EMOJI - ecart);
  const l = EMOJI + ecart + lt + 64;
  const h = 96;
  const x = (W - l) / 2;
  const y = 104;
  g.fillStyle = "rgba(18,6,15,.35)";
  g.beginPath();
  if (typeof g.roundRect === "function") g.roundRect(x + 4, y + 8, l, h, h / 2);
  else g.rect(x + 4, y + 8, l, h);
  g.fill();
  g.fillStyle = "#FFF4E6";
  g.beginPath();
  if (typeof g.roundRect === "function") g.roundRect(x, y, l, h, h / 2);
  else g.rect(x, y, l, h);
  g.fill();
  g.font = `${EMOJI}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  g.fillText("🎙️", x + 32, y + h / 2 + 2);
  g.font = `900 ${taille}px ${police}`;
  g.fillStyle = "#2A0F1F";
  g.fillText(texte, x + 32 + EMOJI + ecart, y + h / 2 + 3, lt);
  // à qui : dessous, en blanc cerné
  if (m.pour) {
    const pour = `pour ${m.pour}`;
    let tp = 40;
    g.font = `900 ${tp}px ${police}`;
    while (g.measureText(pour).width > W - 160 && tp > 24) {
      tp -= 2;
      g.font = `900 ${tp}px ${police}`;
    }
    const lp = Math.min(g.measureText(pour).width, W - 160);
    const xp = (W - lp) / 2;
    g.lineJoin = "round";
    g.lineWidth = tp * 0.26;
    g.strokeStyle = "#12060F";
    g.strokeText(pour, xp, y + h + tp * 0.95, lp);
    g.fillStyle = "#FFFFFF";
    g.fillText(pour, xp, y + h + tp * 0.95, lp);
  }
  g.restore();
}

/** L'annonce, en haut : un grand bandeau qui arrive en rebond, et le nom du commerce dessous. */
function lAnnonce(g: CanvasRenderingContext2D, police: string, a: AnnonceMeme, T: number): void {
  if (T < INTRO * 0.5) return;
  const W = MEME_L;
  const e = rebond((T - INTRO * 0.5) / 0.4);
  g.save();
  g.translate(W / 2, 190);
  g.rotate((-2.5 * Math.PI) / 180);
  g.scale(e, e);
  g.textAlign = "center";
  g.textBaseline = "middle";
  const titre = `${a.emoji} ${a.titre.toUpperCase()}`;
  let taille = 54;
  g.font = `900 ${taille}px ${police}`;
  while (g.measureText(titre).width > W - 110 && taille > 30) {
    taille -= 2;
    g.font = `900 ${taille}px ${police}`;
  }
  const l = g.measureText(titre).width + 56;
  const h = taille + 34;
  g.fillStyle = "#FFE14D";
  g.beginPath();
  if (typeof g.roundRect === "function") g.roundRect(-l / 2, -h / 2, l, h, 18);
  else g.rect(-l / 2, -h / 2, l, h);
  g.fill();
  g.lineWidth = 6;
  g.strokeStyle = "#12060F";
  g.stroke();
  g.fillStyle = "#12060F";
  g.fillText(titre, 0, 3);
  // son nom, dessous
  g.rotate((2.5 * Math.PI) / 180);
  let tn = 38;
  g.font = `900 ${tn}px ${police}`;
  while (g.measureText(a.nom).width > W - 120 && tn > 22) {
    tn -= 2;
    g.font = `900 ${tn}px ${police}`;
  }
  g.lineJoin = "round";
  g.lineWidth = tn * 0.24;
  g.strokeStyle = "#12060F";
  g.strokeText(a.nom, 0, h / 2 + tn * 0.95);
  g.fillStyle = "#FFFFFF";
  g.fillText(a.nom, 0, h / 2 + tn * 0.95);
  g.restore();
}

/** La fin : « Crée ton mème · clikme.fr » (ou celle d'un commerçant : son nom). */
function laFin(g: CanvasRenderingContext2D, police: string, fin: number, f?: FinMeme): void {
  if (fin <= 0) return;
  const W = MEME_L;
  const H = MEME_H;
  const a = sortie(fin / 0.35);
  g.fillStyle = `rgba(18,6,15,${0.78 * a})`;
  g.fillRect(0, 0, W, H);
  g.save();
  g.globalAlpha = a;
  g.translate(W / 2, H / 2);
  const e = rebond(fin / 0.45);
  g.scale(e, e);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `110px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  g.fillText(f?.emoji ?? "🎭", 0, -140);
  let taille = 66;
  g.font = `900 ${taille}px ${police}`;
  const titre = f?.titre ?? "Crée ton mème";
  while (g.measureText(titre).width > W - 80 && taille > 34) {
    taille -= 2;
    g.font = `900 ${taille}px ${police}`;
  }
  g.fillStyle = "#FFF4E6";
  g.fillText(titre, 0, 0);
  g.font = `900 46px ${police}`;
  g.fillStyle = "#FF2E9A";
  g.fillText(f?.sous ?? "clikme.fr", 0, 80);
  g.restore();
}

/** 💬 Le duo : l'autre en haut (il parle d'abord), lui en bas (il répond). */
function dessinerDuo(g: CanvasRenderingContext2D, S: Scene, T: number): void {
  const D = S.duo!;
  const W = MEME_L;
  const H = MEME_H;
  const moitie = H / 2;
  const tA = T - INTRO;
  const tB = T - debutVoix(S);
  const parleA = tA >= 0 && tA <= D.duree;
  const parleB = tB >= 0 && tB <= S.duree;
  const arrivee = T < INTRO ? 1.3 - 0.3 * rebond(T / INTRO) : 1;
  const moitieDe = (img: { n: HTMLImageElement; p: HTMLImageElement }, fond: string, y0: number, amp: number, parle: boolean, danse: number) => {
    const im = amp > 0.28 ? img.p : img.n;
    g.save();
    g.beginPath();
    g.rect(0, y0, W, moitie);
    g.clip();
    g.fillStyle = fond;
    g.fillRect(0, y0, W, moitie);
    const base = W / im.naturalWidth;
    const lh = im.naturalHeight * base;
    const e = arrivee * (1 + amp * 0.035 + danse * 0.03) * (parle ? 1.04 : 1);
    g.translate(W / 2, y0 + moitie);
    g.rotate((Math.sin(T * 7.5) * amp * 1.8 * Math.PI) / 180);
    g.scale(e, e);
    // (la tête et le buste : le haut de son image, un peu sous le bord)
    g.drawImage(im, -W / 2, -moitie - lh * 0.05, W, lh);
    g.restore();
    if (!parle && T >= INTRO) {
      g.fillStyle = "rgba(10,3,8,.38)";
      g.fillRect(0, y0, W, moitie);
    }
  };
  const ampA = forceA(D.env, D.duree, tA);
  const ampB = forceA(S.env, S.duree, tB);
  const danse = S.danse && T >= INTRO ? Math.abs(Math.sin((Math.PI * (T - INTRO)) / 0.6)) : 0;
  moitieDe(D, D.fond, 0, ampA, parleA, 0);
  moitieDe({ n: S.n, p: S.p }, S.fond, moitie, ampB, parleB, danse);
  // la ligne qui les sépare, et « ↩️ RÉPONSE » quand il répond
  const grad = g.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, "#FF2E9A");
  grad.addColorStop(1, "#F2C46B");
  g.fillStyle = grad;
  g.fillRect(0, moitie - 4, W, 8);
  if (tB > -0.2) {
    const e = rebond((tB + 0.2) / 0.35);
    g.save();
    g.translate(W / 2, moitie);
    g.scale(e, e);
    g.font = `900 30px ${S.police}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    const l = g.measureText("↩ RÉPONSE").width + 40;
    g.fillStyle = "#FFF4E6";
    g.beginPath();
    if (typeof g.roundRect === "function") g.roundRect(-l / 2, -26, l, 52, 26);
    else g.rect(-l / 2, -26, l, 52);
    g.fill();
    g.fillStyle = "#C2187A";
    g.fillText("↩ RÉPONSE", 0, 1);
    g.restore();
  }
  if (T < 0.25) {
    g.fillStyle = `rgba(255,255,255,${0.85 * (1 - T / 0.25)})`;
    g.fillRect(0, 0, W, H);
  }
  // leurs prénoms, le petit « ClikMe »
  etiquette(g, S.police, 24, 24, [{ t: D.prenom || "Lui", c: "#FFF4E6" }], 28);
  etiquette(g, S.police, 24, moitie + 24, [{ t: D.moi || "Moi", c: "#FFF4E6" }], 28);
  etiquette(g, S.police, W - 160, 24, [
    { t: "Clik", c: "#FFF4E6" },
    { t: "Me", c: "#FF2E9A" },
  ], 26);
  // l'emoji de ce qu'il ressent, dans sa moitié
  if (S.emoji && tB > -0.3) {
    const e = rebond((tB + 0.3) / 0.4);
    g.save();
    g.translate(W - 100, moitie + 110);
    g.rotate((Math.sin(T * 4) * 10 * Math.PI) / 180);
    g.scale(e, e);
    g.font = `96px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(S.emoji, 0, 0);
    g.restore();
  }
  // leurs mots, dans la moitié de celui qui parle
  sousTitres(g, S.police, D.sous, tA, D.duree, moitie - 110, 58);
  sousTitres(g, S.police, S.sous, tB, S.duree, H - 120, 58);
  laFin(g, S.police, T - (debutVoix(S) + S.duree + 0.15));
}

// ─── 🎬 TROIS FAÇONS DE LE DIRE (`rendus.ts`) : la BD, le cinéma, l'affiche ────────────────────────────────────
// (8 novembre 2026 : « la même figurine et la même phrase peuvent donner plusieurs créations très différentes » — et c'est
// d'abord SON visage qui change, choisi avec le graphisme ; ici, le graphisme, le cadrage, et ses mots qui arrivent au
// fil de sa voix)

/** Ce que le mème reçoit de l'interprétation choisie (son visage, lui, est dans ses images). */
export type RenduMeme = Pick<Rendu, "style" | "cadrage" | "onomatopee" | "mot" | "teinte">;

const PAL_BD = [
  ["#FFE14D", "#FF2E9A"],
  ["#7FE3FF", "#FF7A59"],
  ["#FFA6D2", "#6B2CF5"],
];
const PAL_CINEMA = [
  ["rgba(255,46,154,.5)", "#FF64B9"],
  ["rgba(77,124,254,.5)", "#8FB2FF"],
  ["rgba(255,154,61,.5)", "#FFB36B"],
];
const PAL_AFFICHE = [
  ["#C6FF3D", "#6B2CF5"],
  ["#2DE1C2", "#FF5A36"],
  ["#FFE14D", "#1C1CFF"],
];
const EMOJI = `"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
const deg = (d: number) => (d * Math.PI) / 180;

/** Son image dans une case, couvrante ; en gros plan, son visage (le haut de l'image) agrandi — sans jamais de vide. */
function figurineDansCase(g: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, l: number, h: number, gros: boolean, echelle = 1, angle = 0): void {
  const iw = img.naturalWidth || 1;
  const ih = img.naturalHeight || 1;
  // (la case toujours couverte ; en gros plan, son visage — à peu près la moitié de la largeur de l'image, vers 38 % de
  //  sa hauteur — en remplit presque la largeur : dans une case haute, couvrir suffit déjà)
  const couvre = Math.max(l / iw, h / ih);
  const base = (gros ? Math.max(couvre, (1.6 * l) / iw) : couvre) * echelle;
  const dw = iw * base;
  const dh = ih * base;
  let px = x + l / 2 - dw * 0.5;
  let py = y + h / 2 - dh * (gros ? 0.38 : 0.44);
  px = Math.min(x, Math.max(x + l - dw, px));
  py = Math.min(y, Math.max(y + h - dh, py));
  g.save();
  g.beginPath();
  g.rect(x, y, l, h);
  g.clip();
  g.translate(x + l / 2, y + h / 2);
  g.rotate(angle);
  g.translate(-(x + l / 2), -(y + h / 2));
  g.drawImage(img, px, py, dw, dh);
  g.restore();
}

/** Ses mots rangés en lignes qui tiennent dans `largeur` ; la taille descend jusqu'à `lignesMax`. */
function enLignes(g: CanvasRenderingContext2D, mots: string[], police: string, taille: number, largeur: number, lignesMax: number, min = 26): { taille: number; lignes: number[][] } {
  for (let t = taille; t >= min; t -= 2) {
    g.font = `900 ${t}px ${police}`;
    const espace = g.measureText(" ").width;
    const lignes: number[][] = [[]];
    let l = 0;
    let deborde = false;
    mots.forEach((m, i) => {
      const w = g.measureText(m).width;
      if (w > largeur) deborde = true;
      if (l && l + espace + w > largeur) {
        lignes.push([]);
        l = 0;
      }
      lignes[lignes.length - 1].push(i);
      l += (l ? espace : 0) + w;
    });
    if (!deborde && lignes.length <= lignesMax) return { taille: t, lignes };
  }
  g.font = `900 ${min}px ${police}`;
  return { taille: min, lignes: [mots.map((_, i) => i)] };
}

/** Le moment où un mot est dit (depuis le début de sa voix) ; dans un aperçu, tout est déjà dit. */
const ditA = (S: Scene, i: number) => (S.apercu ? -1 : (S.mots[i]?.de ?? 0));
/** Le mot fort est-il celui-ci ? (sans sa ponctuation, sans accents) */
const plat = (m: string) =>
  m
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
const estFort = (S: Scene, m: string) => Boolean(S.rendu?.mot) && plat(m) === plat(S.rendu!.mot);

/** Une étoile d'onomatopée (l'éclat de la BD). */
function eclat(g: CanvasRenderingContext2D, r: number, pointes = 14): void {
  g.beginPath();
  for (let k = 0; k < pointes * 2; k++) {
    const a = (Math.PI * k) / pointes - Math.PI / 2;
    const rr = k % 2 ? r * 0.62 : r * (k % 4 === 0 ? 1 : 0.88);
    g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  g.closePath();
}

/** 😂 HUMOUR, LA BD : la page tramée, les rayons, sa case ; la bulle où ses mots s'écrivent ; l'onomatopée qui claque. */
function dessinerBD(g: CanvasRenderingContext2D, S: Scene, T: number): void {
  const W = MEME_L;
  const H = MEME_H;
  const R = S.rendu!;
  const [fond, vif] = PAL_BD[R.teinte % 3];
  const t = T - INTRO;
  const amp = S.apercu ? 0 : forceA(S.env, S.duree, t);
  const img = amp > 0.28 ? S.p : S.n;
  g.fillStyle = fond;
  g.fillRect(0, 0, W, H);
  if (S.trame) {
    g.fillStyle = S.trame;
    g.fillRect(0, 0, W, H);
  }
  // les rayons, derrière la case
  g.save();
  g.strokeStyle = "rgba(18,6,15,.13)";
  g.lineWidth = 7;
  g.lineCap = "round";
  for (let k = 0; k < 24; k++) {
    const a = deg(k * 15 + (S.apercu ? 0 : T * 6));
    g.beginPath();
    g.moveTo(W / 2 + Math.cos(a) * 330, 770 + Math.sin(a) * 330);
    g.lineTo(W / 2 + Math.cos(a) * 1200, 770 + Math.sin(a) * 1200);
    g.stroke();
  }
  g.restore();
  // la case, avec sa figurine (elle arrive d'un coup, puis bouge sur sa voix)
  const arrivee = S.apercu ? 1 : T < INTRO ? 1.22 - 0.22 * rebond(T / INTRO) : 1;
  const danse = S.danse && T >= INTRO && !S.apercu ? Math.abs(Math.sin((Math.PI * (T - INTRO)) / 0.6)) : 0;
  g.save();
  g.translate(W / 2, 770);
  g.rotate(deg(-1.5));
  g.scale(arrivee, arrivee);
  g.translate(-W / 2, -770);
  g.fillStyle = "#12060F";
  g.fillRect(62, 374, 624, 800);
  figurineDansCase(g, img, 48, 360, 624, 800, R.cadrage === "gros-plan", 1 + amp * 0.035 + danse * 0.03, deg(Math.sin(T * 7.5) * amp * 1.6));
  g.lineWidth = 12;
  g.strokeStyle = "#12060F";
  g.strokeRect(48, 360, 624, 800);
  g.restore();
  // la bulle : ses mots s'y écrivent au fil de sa voix
  const mots = S.mots.map((m) => m.mot.toUpperCase());
  if (mots.length) {
    const { taille, lignes } = enLignes(g, mots, S.police, 66, 580, 4, 32);
    const pas = taille * 1.08;
    const hb = lignes.length * pas + 64;
    const yb = 46;
    g.save();
    g.fillStyle = "#12060F";
    g.beginPath();
    if (typeof g.roundRect === "function") g.roundRect(48, yb + 12, 648, hb, 46);
    else g.rect(48, yb + 12, 648, hb);
    g.fill();
    g.fillStyle = "#FFFFFF";
    g.strokeStyle = "#12060F";
    g.lineWidth = 10;
    g.beginPath();
    if (typeof g.roundRect === "function") g.roundRect(36, yb, 648, hb, 46);
    else g.rect(36, yb, 648, hb);
    g.fill();
    g.stroke();
    // la queue de la bulle, vers la case
    g.beginPath();
    g.moveTo(190, yb + hb - 6);
    g.lineTo(150, yb + hb + 64);
    g.lineTo(250, yb + hb - 6);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(190, yb + hb - 1);
    g.lineTo(150, yb + hb + 64);
    g.lineTo(250, yb + hb - 1);
    g.stroke();
    g.font = `900 ${taille}px ${S.police}`;
    g.textBaseline = "middle";
    g.textAlign = "left";
    const espace = g.measureText(" ").width;
    lignes.forEach((ligne, li) => {
      const total = ligne.reduce((n, i, j) => n + g.measureText(mots[i]).width + (j ? espace : 0), 0);
      let x = 36 + 324 - total / 2;
      const y = yb + 32 + pas * li + pas / 2;
      for (const i of ligne) {
        const w = g.measureText(mots[i]).width;
        if (t >= ditA(S, i) - 0.02) {
          g.fillStyle = estFort(S, mots[i]) ? "#FF2E9A" : "#12060F";
          g.fillText(mots[i], x, y);
        }
        x += w + espace;
      }
    });
    g.restore();
  }
  // l'onomatopée : elle claque quand sa phrase se termine
  const tOno = S.apercu ? 1 : (t - S.duree * 0.6) / 0.3;
  if (R.onomatopee && tOno > 0) {
    const e = S.apercu ? 1 : rebond(tOno);
    g.save();
    g.translate(530, 1060);
    g.rotate(deg(-10));
    g.scale(e, e);
    eclat(g, 150);
    g.fillStyle = vif;
    g.fill();
    g.lineWidth = 10;
    g.strokeStyle = "#12060F";
    g.lineJoin = "round";
    g.stroke();
    let to = 64;
    g.font = `900 ${to}px ${S.police}`;
    while (g.measureText(R.onomatopee).width > 230 && to > 30) {
      to -= 2;
      g.font = `900 ${to}px ${S.police}`;
    }
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineWidth = to * 0.24;
    g.strokeText(R.onomatopee, 0, 4);
    g.fillStyle = "#FFFFFF";
    g.fillText(R.onomatopee, 0, 4);
    g.restore();
  }
  etiquette(g, S.police, 70, 1088, [
    { t: "Clik", c: "#FFF4E6" },
    { t: "Me", c: "#FF2E9A" },
  ], 28);
}

/** 🎭 DRAMATIQUE, LE CINÉMA : le gros plan dans la pénombre (qui avance doucement), les bandes noires ; le mot fort en
 *  géant quand il le dit ; sa phrase en sous-titre, dans la bande du bas. */
function dessinerCinema(g: CanvasRenderingContext2D, S: Scene, T: number): void {
  const W = MEME_L;
  const H = MEME_H;
  const R = S.rendu!;
  const [lueur, accent] = PAL_CINEMA[R.teinte % 3];
  const t = T - INTRO;
  const amp = S.apercu ? 0 : forceA(S.env, S.duree, t);
  const img = amp > 0.28 ? S.p : S.n;
  const avance = S.apercu ? 0.03 : cl(T / Math.max(1, dureeTotale(S))) * 0.09;
  g.fillStyle = "#050206";
  g.fillRect(0, 0, W, H);
  figurineDansCase(g, img, 0, 0, W, H, R.cadrage === "gros-plan", 1 + avance + amp * 0.02, deg(Math.sin(T * 6) * amp * 0.8));
  // l'étalonnage : une teinte, puis la pénombre autour de son visage
  g.save();
  g.globalCompositeOperation = "soft-light";
  g.fillStyle = lueur;
  g.fillRect(0, 0, W, H);
  g.restore();
  const v = g.createRadialGradient(W / 2, H * 0.4, 160, W / 2, H * 0.42, 900);
  v.addColorStop(0, "rgba(5,2,6,0)");
  v.addColorStop(0.55, "rgba(5,2,6,.35)");
  v.addColorStop(1, "rgba(5,2,6,.95)");
  g.fillStyle = v;
  g.fillRect(0, 0, W, H);
  // les bandes noires
  g.fillStyle = "#000000";
  g.fillRect(0, 0, W, 150);
  g.fillRect(0, H - 270, W, 270);
  // « CLIKME PRÉSENTE », comme au générique ; l'emoji de ce qu'elle ressent
  g.save();
  g.font = `800 24px ${S.police}`;
  g.fillStyle = "#C9B8C2";
  g.textBaseline = "middle";
  let x = 40;
  for (const c of "CLIKME PRÉSENTE") {
    g.fillText(c, x, 78);
    x += g.measureText(c).width + 7;
  }
  if (S.emoji) {
    g.font = `64px ${EMOJI}`;
    g.textAlign = "right";
    g.fillText(S.emoji, W - 34, 80);
  }
  g.restore();
  // le mot fort, en géant, quand il est dit
  const mots = S.mots.map((m) => m.mot);
  const iFort = mots.findIndex((m) => estFort(S, m));
  const quand = S.apercu ? -1 : iFort >= 0 ? (S.mots[iFort]?.de ?? 0) : S.duree * 0.5;
  if (R.mot && t >= quand) {
    const e = S.apercu ? 1 : sortie((t - quand) / 0.5);
    let taille = 170;
    g.font = `900 ${taille}px ${S.police}`;
    while (g.measureText(R.mot).width > W - 60 && taille > 60) {
      taille -= 4;
      g.font = `900 ${taille}px ${S.police}`;
    }
    g.save();
    g.globalAlpha = e;
    g.translate(W / 2, H - 300);
    g.scale(0.92 + 0.08 * e, 0.92 + 0.08 * e);
    g.textAlign = "center";
    g.textBaseline = "alphabetic";
    g.shadowColor = accent;
    g.shadowBlur = 44;
    g.fillStyle = accent;
    g.fillText(R.mot, 0, 0);
    g.shadowBlur = 0;
    g.fillText(R.mot, 0, 0);
    g.restore();
  }
  // sa phrase, en sous-titre (le paquet du moment ; dans un aperçu, toute la phrase)
  g.save();
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "#F3EAEE";
  const serif = `italic 600 44px Georgia, "Times New Roman", serif`;
  g.font = serif;
  const morceaux = S.apercu ? [S.mots] : [S.sous.find((p) => t >= p[0].de - 0.05 && t < p[p.length - 1].a + 0.3) ?? []];
  const phrase = morceaux[0].map((m) => m.mot);
  if (phrase.length) {
    const lignes: string[] = [];
    let ligne = "";
    for (const m of phrase) {
      const essai = ligne ? `${ligne} ${m}` : m;
      if (ligne && g.measureText(essai).width > W - 90) {
        lignes.push(ligne);
        ligne = m;
      } else ligne = essai;
    }
    if (ligne) lignes.push(ligne);
    const vues = lignes.slice(0, 3);
    vues.forEach((l, k) => g.fillText(k === 0 && S.apercu ? `« ${l}` : l, W / 2, H - 135 + (k - (vues.length - 1) / 2) * 54));
  }
  g.restore();
}

/** 🌀 DÉCALÉ, L'AFFICHE : deux couleurs vives, des étoiles ; sa phrase en lettres énormes, un mot après l'autre ; sa
 *  figurine collée comme une photo ; l'emoji en badge. */
function dessinerAffiche(g: CanvasRenderingContext2D, S: Scene, T: number): void {
  const W = MEME_L;
  const H = MEME_H;
  const R = S.rendu!;
  const [a, b] = PAL_AFFICHE[R.teinte % 3];
  const t = T - INTRO;
  const amp = S.apercu ? 0 : forceA(S.env, S.duree, t);
  const img = amp > 0.28 ? S.p : S.n;
  g.fillStyle = a;
  g.fillRect(0, 0, W, H);
  g.fillStyle = b;
  g.beginPath();
  g.moveTo(0, H * 0.64);
  g.lineTo(W, H * 0.47);
  g.lineTo(W, H);
  g.lineTo(0, H);
  g.closePath();
  g.fill();
  // des étoiles
  const etoile = (x: number, y: number, r: number, c: string, rot: number) => {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.fillStyle = c;
    g.beginPath();
    for (let k = 0; k < 8; k++) {
      const rr = k % 2 ? r * 0.22 : r;
      const an = (Math.PI * k) / 4;
      g.lineTo(Math.cos(an) * rr, Math.sin(an) * rr);
    }
    g.closePath();
    g.fill();
    g.restore();
  };
  const tourne = S.apercu ? 0 : T * 0.8;
  etoile(640, 640, 46, "#FFFFFF", tourne);
  etoile(70, 720, 30, "#12060F", -tourne);
  etoile(330, 40, 28, "#12060F", tourne);
  // sa figurine, collée comme une photo (elle penche, et bouge sur sa voix)
  const arrivee = S.apercu ? 1 : T < INTRO ? 1.3 - 0.3 * rebond(T / INTRO) : 1;
  const danse = S.danse && T >= INTRO && !S.apercu ? Math.sin((Math.PI * (T - INTRO)) / 0.6) : 0;
  g.save();
  g.translate(468, 910);
  g.rotate(deg(6 + danse * 4 + Math.sin(T * 7.5) * amp * 2));
  g.scale(arrivee, arrivee);
  g.fillStyle = "#12060F";
  g.fillRect(-210 + 16, -290 + 18, 420, 580);
  g.fillStyle = "#FFFFFF";
  g.fillRect(-210, -290, 420, 580);
  figurineDansCase(g, img, -188, -268, 376, 536, R.cadrage === "gros-plan", 1 + amp * 0.03);
  g.restore();
  // sa phrase, en lettres énormes : un mot après l'autre, au fil de sa voix
  const mots = S.mots.map((m) => m.mot.toUpperCase());
  if (mots.length) {
    const { taille, lignes } = enLignes(g, mots, S.police, 112, 610, 5, 40);
    g.save();
    g.translate(46, 150);
    g.rotate(deg(-5));
    g.font = `900 ${taille}px ${S.police}`;
    g.textBaseline = "alphabetic";
    g.textAlign = "left";
    const espace = g.measureText(" ").width * 1.1;
    const dernier = mots.length - 1;
    lignes.forEach((ligne, li) => {
      let x = 0;
      const y = taille * 0.86 + li * taille * 1.02;
      for (const i of ligne) {
        const w = g.measureText(mots[i]).width;
        const quand = ditA(S, i);
        if (t >= quand - 0.02) {
          const e = S.apercu ? 1 : rebond((t - quand + 0.02) / 0.25);
          g.save();
          g.translate(x + w / 2, y - taille * 0.35);
          g.scale(e, e);
          g.translate(-(x + w / 2), -(y - taille * 0.35));
          if (i === dernier || estFort(S, mots[i])) {
            // le dernier mot : une étiquette rose, de travers
            g.save();
            g.translate(x + w / 2, y - taille * 0.35);
            g.rotate(deg(4));
            g.fillStyle = "#12060F";
            g.fillRect(-w / 2 - 14 + 9, -taille * 0.62 + 10, w + 28, taille * 1.08);
            g.fillStyle = "#FF2E9A";
            g.fillRect(-w / 2 - 14, -taille * 0.62, w + 28, taille * 1.08);
            g.fillStyle = "#FFFFFF";
            g.fillText(mots[i], -w / 2, taille * 0.34);
            g.restore();
          } else {
            const noir = i % 2 === 0;
            g.fillStyle = noir ? "#FFFFFF" : "#12060F";
            g.fillText(mots[i], x + 6, y + 6);
            g.fillStyle = noir ? "#12060F" : "#FFFFFF";
            g.fillText(mots[i], x, y);
          }
          g.restore();
        }
        x += w + espace;
      }
    });
    g.restore();
  }
  // l'emoji, en badge
  if (S.emoji) {
    g.save();
    g.translate(140, 1090);
    g.rotate(deg(-12 + (S.apercu ? 0 : Math.sin(T * 3) * 6)));
    g.fillStyle = "#12060F";
    g.beginPath();
    g.arc(10, 12, 92, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#FFFFFF";
    g.beginPath();
    g.arc(0, 0, 92, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = 10;
    g.strokeStyle = "#12060F";
    g.stroke();
    g.font = `104px ${EMOJI}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(S.emoji, 0, 6);
    g.restore();
  }
  // le petit « ClikMe », en ruban
  g.save();
  g.translate(44, 1218);
  g.rotate(deg(-3));
  g.fillStyle = "#12060F";
  g.fillRect(0, -30, 170, 56);
  g.font = `900 30px ${S.police}`;
  g.textBaseline = "middle";
  g.fillStyle = "#FFF4E6";
  g.fillText("Clik", 20, 0);
  g.fillStyle = "#FF2E9A";
  g.fillText("Me", 20 + g.measureText("Clik").width, 0);
  g.restore();
}

function dessinerRendu(g: CanvasRenderingContext2D, S: Scene, T: number): void {
  const st = S.rendu!.style;
  if (st === "cinema") dessinerCinema(g, S, T);
  else if (st === "affiche") dessinerAffiche(g, S, T);
  else dessinerBD(g, S, T);
  if (S.apercu) return;
  // le flash de l'arrivée ; la fin
  if (T < 0.25) {
    g.fillStyle = `rgba(255,255,255,${0.85 * (1 - T / 0.25)})`;
    g.fillRect(0, 0, MEME_L, MEME_H);
  }
  laFin(g, S.police, T - (INTRO + S.duree + 0.15), S.fin);
}

/** La trame de la BD (des points), une fois. */
function laTrame(g: CanvasRenderingContext2D): CanvasPattern | null {
  const c = document.createElement("canvas");
  c.width = 22;
  c.height = 22;
  const x = c.getContext("2d");
  if (!x) return null;
  x.fillStyle = "rgba(18,6,15,.16)";
  x.beginPath();
  x.arc(11, 11, 3.8, 0, Math.PI * 2);
  x.fill();
  return g.createPattern(c, "repeat");
}

const apercus = new Map<string, Promise<HTMLImageElement>>();
/** Une image pour les aperçus (gardée : les trois vignettes et leurs retours la reprennent). */
function imageApercu(url: string): Promise<HTMLImageElement> {
  let p = apercus.get(url);
  if (!p) {
    p = image(url);
    p.catch(() => apercus.delete(url));
    if (apercus.size > 24) apercus.delete(apercus.keys().next().value as string);
    apercus.set(url, p);
  }
  return p;
}

/**
 * 🖼️ L'APERÇU D'UNE INTERPRÉTATION : une image fixe du mème, toute sa phrase écrite, dessinée par le même code que la
 * vidéo (ce qu'il choisit, c'est ce qu'il aura). `toile` : 360 × 640 (la moitié du mème).
 */
export async function apercuRendu(toile: HTMLCanvasElement, o: { image: string; rendu: RenduMeme; texte: string; emoji?: string }): Promise<void> {
  const img = await imageApercu(o.image);
  toile.width = MEME_L / 2;
  toile.height = MEME_H / 2;
  const g = toile.getContext("2d");
  if (!g) return;
  const police = `${getComputedStyle(document.body).fontFamily || "system-ui"}, "Arial Black", sans-serif`;
  const mots = motsDuTexte(o.texte, 1);
  const S: Scene = {
    n: img,
    p: img,
    fond: "#E0218A",
    env: [0],
    duree: 1,
    sous: paquets(mots),
    mots,
    emoji: o.emoji ?? "",
    danse: false,
    police,
    rendu: o.rendu,
    trame: laTrame(g),
    apercu: true,
  };
  g.setTransform(0.5, 0, 0, 0.5, 0, 0);
  dessinerRendu(g, S, INTRO + 0.5);
  g.setTransform(1, 0, 0, 1, 0, 0);
}

function dessiner(g: CanvasRenderingContext2D, S: Scene, T: number): void {
  if (S.duo) return dessinerDuo(g, S, T);
  if (S.rendu && !S.annonce) return dessinerRendu(g, S, T);
  const W = MEME_L;
  const H = MEME_H;
  const t = T - INTRO; // le temps de sa voix
  const amp = forceA(S.env, S.duree, t);
  const ouverte = amp > 0.28;
  const img = ouverte ? S.p : S.n;
  g.fillStyle = S.fond;
  g.fillRect(0, 0, W, H);
  // ─── sa figurine, plein cadre : elle arrive d'un coup, puis bouge sur sa voix (et danse) ───
  // (🎙️ un message par WhatsApp : sa première image est la vignette de la vidéo — ni zoom ni flash, elle est entière)
  const arrivee = T < INTRO && !S.message ? 1.35 - 0.35 * rebond(T / INTRO) : 1;
  const danse = S.danse && T >= INTRO ? Math.abs(Math.sin((Math.PI * (T - INTRO)) / 0.6)) : 0;
  const echelle = arrivee * (1.04 + amp * 0.03 + danse * 0.025);
  const angle = (Math.sin(T * 7.5) * amp * 1.6 + (S.danse ? Math.sin((Math.PI * (T - INTRO)) / 1.2) * 3 : 0)) * (Math.PI / 180);
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (S.decor) {
    // ─── 🏡 chez lui : son décor (couvrant le cadre), sa figurine assise à sa place, avec son ombre ───
    const d = S.decor.img;
    const k = Math.max(W / d.naturalWidth, H / d.naturalHeight);
    const dw = d.naturalWidth * k;
    const dh = d.naturalHeight * k;
    const ox = (W - dw) / 2;
    const oy = (H - dh) / 2;
    g.drawImage(d, ox, oy, dw, dh);
    const px = ox + S.decor.x * dw;
    const py = oy + S.decor.y * dh;
    const fh = dh * TAILLE_CHEZ_LUI * Math.min(1.15, Math.max(0.9, S.decor.echelle));
    const fw = (fh * iw) / ih;
    g.save();
    g.fillStyle = "rgba(0,0,0,.32)";
    g.beginPath();
    g.ellipse(px, py - fh * 0.02, fw * 0.36, fh * 0.045, 0, 0, Math.PI * 2);
    g.fill();
    g.translate(px, py - danse * 12);
    g.rotate(angle);
    g.scale(echelle / 1.04, echelle / 1.04);
    g.drawImage(img, -fw / 2, -fh, fw, fh);
    g.restore();
  } else {
    const base = Math.max(W / iw, H / ih) * (S.message ? MESSAGE.echelle : 1);
    g.save();
    // (pivot : le bas du cadre, au milieu — là où est son socle)
    g.translate(W / 2, H * 0.94 - danse * 18 + (S.message ? MESSAGE.decalage : 0));
    g.rotate(angle);
    g.scale(echelle, echelle);
    g.drawImage(img, (-iw * base) / 2, -ih * base * 0.94, iw * base, ih * base);
    g.restore();
  }
  // le flash de l'arrivée
  if (T < 0.25 && !S.message) {
    g.fillStyle = `rgba(255,255,255,${0.85 * (1 - T / 0.25)})`;
    g.fillRect(0, 0, W, H);
  }
  // ─── l'emoji de ce qu'elle ressent ───
  if (S.emoji && T > INTRO * 0.6) {
    const e = rebond((T - INTRO * 0.6) / 0.4);
    g.save();
    // (🎙️ un message : à côté de son visage, sous le bandeau — jamais dessus)
    if (S.message) g.translate(W - 86, H * 0.42);
    else g.translate(W - 120, 230);
    g.rotate((Math.sin(T * 4) * 10 * Math.PI) / 180);
    g.scale(e, e);
    g.font = `${S.message ? 92 : 120}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(S.emoji, 0, 0);
    g.restore();
  }
  // ─── 😍 l'amour : des cœurs montent autour d'elle ───
  if (S.emoji === "😍" && T > INTRO * 0.6) coeurs(g, T, W, H);
  // ─── le petit « ClikMe » ───
  etiquette(g, S.police, 28, 52, [
    { t: "Clik", c: "#FFF4E6" },
    { t: "Me", c: "#FF2E9A" },
  ]);
  // ─── 🏪 ce qu'annonce un commerçant ───
  if (S.annonce) lAnnonce(g, S.police, S.annonce, T);
  // ─── 🎙️ un message par WhatsApp : qui l'envoie, à qui ───
  if (S.message) leMessage(g, S.police, S.message);
  // ─── ses mots, façon TikTok (🎙️ un message : plus haut — WhatsApp pose sa légende sur le bas de la vidéo ; 🏡 chez
  // lui : au-dessus de sa figurine, sa place est en bas) ───
  sousTitres(g, S.police, S.sous, t, S.duree, H * (S.decor ? 0.34 : S.message ? MESSAGE.sousTitres : 0.78));
  // ─── la fin : « Crée ton mème » (ou son nom) ───
  laFin(g, S.police, T - (INTRO + S.duree + 0.15), S.fin);
}

/** 😍 Des cœurs qui montent, en boucle (trois à la fois, chacun sur 2,4 s), de part et d'autre de la figurine. */
function coeurs(g: CanvasRenderingContext2D, T: number, W: number, H: number): void {
  const formes = ["💗", "❤️", "💕", "💖"];
  g.save();
  g.font = `84px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (let k = 0; k < 4; k++) {
    const p = ((T + k * 0.6) % 2.4) / 2.4;
    const x = (k % 2 ? W * 0.82 : W * 0.18) + Math.sin(T * 2 + k) * 26;
    const y = H * 0.7 - p * H * 0.45;
    g.globalAlpha = p < 0.15 ? p / 0.15 : 1 - Math.max(0, p - 0.6) / 0.4;
    g.fillText(formes[k % formes.length], x, y);
  }
  g.restore();
}

export type Meme = { blob: Blob; type: string; duree: number };

/** Sans voix (un commerçant qui n'a pas enregistré la sienne) : le temps de lire ses mots, entre 4 et 12 secondes. */
export const dureeSansVoix = (texte: string) => Math.min(12, Math.max(4, 1.6 + texte.replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length * 0.42));

/**
 * 🎬 FABRIQUE LE MÈME (il se joue en vrai pendant qu'il s'enregistre, sur `toile` : on le voit naître).
 * `images` : bouche fermée / bouche ouverte (son visage du moment) ; `son` : sa voix (une adresse `data:` ou `blob:`) —
 * sans voix, la figurine danse sur la musique le temps de lire ses mots ; `ecouter` : on l'entend pendant qu'il se fabrique.
 */
export async function fabriquerMeme(o: {
  ctx: AudioContext;
  toile: HTMLCanvasElement;
  images: { n: string; p: string };
  son?: string;
  /** 🏪 Un commerçant : ce qu'il annonce (en haut), et la fin à son nom. */
  annonce?: AnnonceMeme;
  fin?: FinMeme;
  texte?: string;
  emoji?: string;
  danse?: boolean;
  ecouter?: boolean;
  surProgres?: (p: number) => void;
  /** 💬 En duo : le mème auquel il répond (ses images, sa voix, ses mots, son prénom) ; `moi` : son prénom à lui. */
  duo?: { images: { n: string; p: string }; son: string; texte?: string; prenom: string; moi: string };
  /** 🎬 L'interprétation choisie (son graphisme) : pas en duo, ni pour un commerçant. */
  rendu?: RenduMeme;
  /**
   * 🎙️ Un message du talkie, réplique par réplique (`de`/`a` : en secondes de sa voix) : sa tête et son emoji changent à
   * chaque réplique, et ses mots se posent sur le temps de leur réplique (au lieu de `images`, `texte` et `emoji`).
   */
  repliques?: { de: number; a: number; texte: string; images: { n: string; p: string }; emoji: string }[];
  /** 🎙️ Un message envoyé en vidéo par WhatsApp : son bandeau (qui, à qui) et sa mise en page (`leMessage`). */
  message?: MessageMeme;
  /**
   * 🏡 Chez lui (« Univers », lot 5b — « sur WhatsApp, la conversation se passe chez celui qui envoie ») : son décor à
   * la place du fond rose, et sa place ; `images` sont alors sa figurine détourée, assise. Pas en duo, ni avec un rendu.
   */
  chezMoi?: { decor: string; x: number; y: number; echelle: number };
}): Promise<Meme> {
  const { ctx, toile } = o;
  if (!memePossible()) throw new Error("Ce téléphone ne sait pas fabriquer de vidéo.");
  toile.width = MEME_L;
  toile.height = MEME_H;
  const g = toile.getContext("2d");
  if (!g) throw new Error("Ce téléphone ne sait pas dessiner la vidéo.");
  const voixDe = (u: string) =>
    fetch(u)
      .then((r) => r.arrayBuffer())
      .then((a) => ctx.decodeAudioData(a));
  // (sans voix : un silence, le temps de lire ses mots — et la musique, qu'elle danse)
  const sansVoix = !o.son;
  const silence = () => Promise.resolve(ctx.createBuffer(1, Math.max(1, Math.round(ctx.sampleRate * dureeSansVoix(o.texte ?? ""))), ctx.sampleRate));
  // (🎙️ ses têtes, réplique par réplique : chaque image une seule fois)
  const charges = new Map<string, Promise<HTMLImageElement>>();
  const uneFois = (u: string) => {
    let x = charges.get(u);
    if (!x) charges.set(u, (x = image(u)));
    return x;
  };
  const tetes = o.repliques?.length
    ? await Promise.all(o.repliques.map(async (r) => ({ de: r.de, a: r.a, emoji: r.emoji, n: await uneFois(r.images.n), p: await uneFois(r.images.p) })))
    : null;
  const [n, p, voix, musique, duo, decor] = await Promise.all([
    image(o.images.n),
    image(o.images.p),
    o.son ? voixDe(o.son) : silence(),
    o.danse || sansVoix ? musiqueDanse(ctx.sampleRate).catch(() => null) : Promise.resolve(null),
    o.duo ? Promise.all([image(o.duo.images.n), image(o.duo.images.p), voixDe(o.duo.son)]) : Promise.resolve(null),
    // (🏡 son décor ; s'il ne se charge pas, le fond d'aujourd'hui)
    o.chezMoi && !o.duo ? image(o.chezMoi.decor).catch(() => null) : Promise.resolve(null),
  ]);
  const duree = voix.duration;
  const police = `${getComputedStyle(document.body).fontFamily || "system-ui"}, "Arial Black", sans-serif`;
  const mots = o.repliques?.length
    ? o.repliques.flatMap((r) => motsDuTexte(r.texte, Math.max(0, Math.min(duree, r.a) - r.de)).map((m) => ({ mot: m.mot, de: m.de + r.de, a: m.a + r.de })))
    : motsDuTexte(o.texte ?? "", duree);
  const rendu = o.rendu && !o.duo && !o.annonce && !o.message ? o.rendu : undefined;
  const S: Scene = {
    n,
    p,
    fond: couleurDuFond(n),
    env: enveloppe(voix),
    duree,
    sous: paquets(mots),
    mots,
    ...(rendu ? { rendu, trame: laTrame(g) } : {}),
    emoji: o.emoji ?? "",
    danse: Boolean(o.danse) || sansVoix,
    police,
    ...(o.annonce ? { annonce: o.annonce } : {}),
    ...(o.message ? { message: o.message } : {}),
    ...(o.fin ? { fin: o.fin } : {}),
    ...(decor && o.chezMoi && !rendu ? { decor: { img: decor, x: o.chezMoi.x, y: o.chezMoi.y, echelle: o.chezMoi.echelle } } : {}),
    ...(duo && o.duo
      ? {
          duo: {
            n: duo[0],
            p: duo[1],
            fond: couleurDuFond(duo[0]),
            env: enveloppe(duo[2]),
            duree: duo[2].duration,
            sous: paquets(motsDuTexte(o.duo.texte ?? "", duo[2].duration)),
            prenom: o.duo.prenom,
            moi: o.duo.moi,
          },
        }
      : {}),
  };
  const total = dureeTotale(S);

  // le son : sa voix (et la musique s'il danse), vers l'enregistrement — et vers ses oreilles
  const enregistree = ctx.createMediaStreamDestination();
  const sortieSon = ctx.createGain();
  sortieSon.connect(enregistree);
  if (o.ecouter) sortieSon.connect(ctx.destination);
  const lecture = ctx.createBufferSource();
  lecture.buffer = voix;
  lecture.connect(sortieSon);
  // (en duo : la voix de l'autre d'abord)
  let premiere: AudioBufferSourceNode | null = null;
  if (duo) {
    premiere = ctx.createBufferSource();
    premiere.buffer = duo[2];
    premiere.connect(sortieSon);
  }
  let fond: AudioBufferSourceNode | null = null;
  if (musique) {
    fond = ctx.createBufferSource();
    fond.buffer = musique;
    fond.loop = true;
    const v = ctx.createGain();
    // (sans voix, la musique est seule : plus fort)
    v.gain.value = sansVoix ? 0.7 : 0.28;
    fond.connect(v);
    v.connect(sortieSon);
  }
  if (ctx.state !== "running") await ctx.resume().catch(() => {});

  const format = formatMeme();
  const flux = new MediaStream([...toile.captureStream(IPS).getVideoTracks(), ...enregistree.stream.getAudioTracks()]);
  const rec = new MediaRecorder(flux, { ...(format ? { mimeType: format } : {}), videoBitsPerSecond: 3_500_000, audioBitsPerSecond: 128_000 });
  const morceaux: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data.size) morceaux.push(e.data);
  };
  const arret = new Promise<void>((ok) => (rec.onstop = () => ok()));
  // (🎙️ la tête et l'emoji de la réplique en cours, au temps de sa voix)
  const poser = (T: number) => {
    if (!tetes) return;
    const t = T - debutVoix(S);
    const x = tetes.find((r) => t >= r.de && t < r.a) ?? (t >= tetes[tetes.length - 1].a ? tetes[tetes.length - 1] : tetes[0]);
    S.n = x.n;
    S.p = x.p;
    S.emoji = x.emoji;
  };
  poser(0);
  dessiner(g, S, 0);
  const debut = ctx.currentTime + 0.15;
  premiere?.start(debut + INTRO);
  lecture.start(debut + debutVoix(S));
  fond?.start(debut);
  rec.start(250);
  try {
    await new Promise<void>((ok) => {
      const pas = () => {
        const T = Math.max(0, ctx.currentTime - debut);
        poser(T);
        dessiner(g, S, T);
        o.surProgres?.(Math.min(1, T / total));
        if (T >= total) ok();
        else requestAnimationFrame(pas);
      };
      requestAnimationFrame(pas);
    });
  } finally {
    for (const s of [lecture, fond, premiere])
      try {
        s?.stop();
      } catch {
        /* déjà fini */
      }
    if (rec.state !== "inactive") rec.stop();
    for (const i of [n, p, ...(duo ? [duo[0], duo[1]] : []), ...(tetes ?? []).flatMap((r) => [r.n, r.p])]) URL.revokeObjectURL(i.src);
  }
  await arret;
  const type = (rec.mimeType || format || "video/webm").split(";")[0];
  return { blob: new Blob(morceaux, { type }), type, duree: total };
}
