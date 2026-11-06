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
 * FICHIER NAVIGATEUR.
 */
import { musiqueDanse } from "./musique-danse";

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
  emoji: string;
  danse: boolean;
  police: string;
  /** 💬 En duo : celui à qui il répond (en haut, il parle d'abord), et leurs deux prénoms. */
  duo?: { n: HTMLImageElement; p: HTMLImageElement; fond: string; env: number[]; duree: number; sous: Mot[][]; prenom: string; moi: string };
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

/** La fin : « Crée ton mème · clikme.fr ». */
function laFin(g: CanvasRenderingContext2D, police: string, fin: number): void {
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
  g.fillText("🎭", 0, -140);
  g.font = `900 66px ${police}`;
  g.fillStyle = "#FFF4E6";
  g.fillText("Crée ton mème", 0, 0);
  g.font = `900 46px ${police}`;
  g.fillStyle = "#FF2E9A";
  g.fillText("clikme.fr", 0, 80);
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

function dessiner(g: CanvasRenderingContext2D, S: Scene, T: number): void {
  if (S.duo) return dessinerDuo(g, S, T);
  const W = MEME_L;
  const H = MEME_H;
  const t = T - INTRO; // le temps de sa voix
  const amp = forceA(S.env, S.duree, t);
  const ouverte = amp > 0.28;
  const img = ouverte ? S.p : S.n;
  g.fillStyle = S.fond;
  g.fillRect(0, 0, W, H);
  // ─── sa figurine, plein cadre : elle arrive d'un coup, puis bouge sur sa voix (et danse) ───
  const arrivee = T < INTRO ? 1.35 - 0.35 * rebond(T / INTRO) : 1;
  const danse = S.danse && T >= INTRO ? Math.abs(Math.sin((Math.PI * (T - INTRO)) / 0.6)) : 0;
  const echelle = arrivee * (1.04 + amp * 0.03 + danse * 0.025);
  const angle = (Math.sin(T * 7.5) * amp * 1.6 + (S.danse ? Math.sin((Math.PI * (T - INTRO)) / 1.2) * 3 : 0)) * (Math.PI / 180);
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const base = Math.max(W / iw, H / ih);
  g.save();
  // (pivot : le bas du cadre, au milieu — là où est son socle)
  g.translate(W / 2, H * 0.94 - danse * 18);
  g.rotate(angle);
  g.scale(echelle, echelle);
  g.drawImage(img, (-iw * base) / 2, -ih * base * 0.94, iw * base, ih * base);
  g.restore();
  // le flash de l'arrivée
  if (T < 0.25) {
    g.fillStyle = `rgba(255,255,255,${0.85 * (1 - T / 0.25)})`;
    g.fillRect(0, 0, W, H);
  }
  // ─── l'emoji de ce qu'elle ressent ───
  if (S.emoji && T > INTRO * 0.6) {
    const e = rebond((T - INTRO * 0.6) / 0.4);
    g.save();
    g.translate(W - 120, 230);
    g.rotate((Math.sin(T * 4) * 10 * Math.PI) / 180);
    g.scale(e, e);
    g.font = `120px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(S.emoji, 0, 0);
    g.restore();
  }
  // ─── le petit « ClikMe » ───
  etiquette(g, S.police, 28, 52, [
    { t: "Clik", c: "#FFF4E6" },
    { t: "Me", c: "#FF2E9A" },
  ]);
  // ─── ses mots, façon TikTok ───
  sousTitres(g, S.police, S.sous, t, S.duree, H * 0.78);
  // ─── la fin : « Crée ton mème » ───
  laFin(g, S.police, T - (INTRO + S.duree + 0.15));
}

export type Meme = { blob: Blob; type: string; duree: number };

/**
 * 🎬 FABRIQUE LE MÈME (il se joue en vrai pendant qu'il s'enregistre, sur `toile` : on le voit naître).
 * `images` : bouche fermée / bouche ouverte (son visage du moment) ; `son` : sa voix (une adresse `data:` ou `blob:`) ;
 * `ecouter` : on l'entend pendant qu'il se fabrique.
 */
export async function fabriquerMeme(o: {
  ctx: AudioContext;
  toile: HTMLCanvasElement;
  images: { n: string; p: string };
  son: string;
  texte?: string;
  emoji?: string;
  danse?: boolean;
  ecouter?: boolean;
  surProgres?: (p: number) => void;
  /** 💬 En duo : le mème auquel il répond (ses images, sa voix, ses mots, son prénom) ; `moi` : son prénom à lui. */
  duo?: { images: { n: string; p: string }; son: string; texte?: string; prenom: string; moi: string };
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
  const [n, p, voix, musique, duo] = await Promise.all([
    image(o.images.n),
    image(o.images.p),
    voixDe(o.son),
    o.danse ? musiqueDanse(ctx.sampleRate).catch(() => null) : Promise.resolve(null),
    o.duo ? Promise.all([image(o.duo.images.n), image(o.duo.images.p), voixDe(o.duo.son)]) : Promise.resolve(null),
  ]);
  const duree = voix.duration;
  const police = `${getComputedStyle(document.body).fontFamily || "system-ui"}, "Arial Black", sans-serif`;
  const S: Scene = {
    n,
    p,
    fond: couleurDuFond(n),
    env: enveloppe(voix),
    duree,
    sous: paquets(motsDuTexte(o.texte ?? "", duree)),
    emoji: o.emoji ?? "",
    danse: Boolean(o.danse),
    police,
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
    v.gain.value = 0.28;
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
    for (const i of [n, p, ...(duo ? [duo[0], duo[1]] : [])]) URL.revokeObjectURL(i.src);
  }
  await arret;
  const type = (rec.mimeType || format || "video/webm").split(";")[0];
  return { blob: new Blob(morceaux, { type }), type, duree: total };
}
