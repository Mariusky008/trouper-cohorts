/**
 * 💥 UN GAG (`mes-reactions.ts`) : une petite vidéo carrée (720 px, 3 à 5 secondes), fabriquée dans le téléphone comme
 * un mème (`meme.ts` : elle se joue en vrai pendant qu'elle s'enregistre). Les bruits sont fabriqués ici — jamais une voix.
 *
 *   · 💨 le prout : elle attend… sursaute, un nuage vert sort derrière elle (sa durée, sa taille et le bruit suivent
 *     l'intensité, de « pfft » à interminable), puis son visage gêné et une goutte de sueur ;
 *   · 🤧 l'éternuement : elle inspire, se gonfle, la tête part en arrière… ATCHOUM, la tête en avant, les postillons ;
 *   · 😴 elle s'endort : les yeux fermés, elle se balance, des « Z » montent, elle ronfle… et se réveille en sursaut ;
 *   · 🫢 le hoquet : trois « hic ! », un petit bond à chaque fois.
 * Ses poses détourées (sa figurine seule, et le visage du gag) si elle les a ; sinon sa figurine de tous les jours et
 * l'emoji. « clikme.fr », discret, dans un coin (le patron : une marque discrète sur les gags, rien sur les stickers).
 *
 * FICHIER NAVIGATEUR.
 */
import { formatMeme } from "./meme";
import { boite } from "./sticker";
import { dureeProut, type CleGag } from "./mes-reactions";

const T = 720;
const IPS = 30;
const EMOJI = `"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const cloche = (x: number) => Math.sin(Math.PI * cl(x));

export type ImagesGag = { fond: string; seule?: string; visage?: string };

async function charger(url: string): Promise<HTMLImageElement> {
  const r = await fetch(url, { mode: "cors", cache: "force-cache" });
  if (!r.ok) throw new Error("Sa figurine n’a pas pu se charger.");
  const u = URL.createObjectURL(await r.blob());
  const i = new Image();
  i.src = u;
  await i.decode();
  return i;
}

/** Combien de temps dure chaque gag (le prout : selon son intensité). */
export function dureeGag(gag: CleGag, intensite = 3): number {
  if (gag === "prout") return 0.7 + dureeProut(intensite) + 1.4;
  if (gag === "eternue") return 3.3;
  if (gag === "dort") return 4.2;
  return 3.3;
}

// ─── les bruits (fabriqués ici, jamais une voix) ─────────────────────────────────────────────────
function bruitBlanc(ctx: AudioContext, duree: number): AudioBufferSourceNode {
  const b = ctx.createBuffer(1, Math.max(1, Math.ceil(ctx.sampleRate * duree)), ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = ctx.createBufferSource();
  s.buffer = b;
  return s;
}
function enveloppe(ctx: AudioContext, sortie: AudioNode, t0: number, monte: number, tient: number, descend: number, fort: number): GainNode {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(fort, t0 + monte);
  g.gain.setValueAtTime(fort, t0 + monte + tient);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + monte + tient + descend);
  g.connect(sortie);
  return g;
}
/** 💨 Le prout : une note grave qui « flûte » (une modulation rapide), un souffle dessous, et un petit « pft » au bout. */
function prout(ctx: AudioContext, sortie: AudioNode, t0: number, duree: number, intensite: number) {
  const o = ctx.createOscillator();
  o.type = "sawtooth";
  const f = 98 - 7 * intensite;
  o.frequency.setValueAtTime(f, t0);
  for (let k = 1; k < 8; k++) o.frequency.linearRampToValueAtTime(f * (0.88 + Math.random() * 0.24) * (1 - (0.25 * k) / 8), t0 + (duree * k) / 8);
  const passe = ctx.createBiquadFilter();
  passe.type = "lowpass";
  passe.frequency.value = 480 + 50 * intensite;
  passe.Q.value = 7;
  const flute = ctx.createGain();
  flute.gain.value = 0.55;
  const lfo = ctx.createOscillator();
  lfo.type = "square";
  lfo.frequency.value = 26 + Math.random() * 10;
  const profondeur = ctx.createGain();
  profondeur.gain.value = 0.45;
  lfo.connect(profondeur).connect(flute.gain);
  const env = enveloppe(ctx, sortie, t0, 0.03, Math.max(0, duree - 0.12), 0.09, 0.5 + 0.07 * intensite);
  o.connect(passe).connect(flute).connect(env);
  const souffle = bruitBlanc(ctx, duree);
  const bande = ctx.createBiquadFilter();
  bande.type = "bandpass";
  bande.frequency.value = 320;
  const sg = enveloppe(ctx, sortie, t0, 0.03, Math.max(0, duree - 0.12), 0.09, 0.18);
  souffle.connect(bande).connect(sg);
  for (const n of [o, lfo, souffle]) {
    n.start(t0);
    n.stop(t0 + duree + 0.15);
  }
  const pft = bruitBlanc(ctx, 0.12);
  const pf = ctx.createBiquadFilter();
  pf.type = "bandpass";
  pf.frequency.value = 900;
  pft.connect(pf).connect(enveloppe(ctx, sortie, t0 + duree, 0.005, 0.02, 0.08, 0.35));
  pft.start(t0 + duree);
}
/** 🤧 L'éternuement : un souffle qui monte (elle inspire), puis l'éclat. */
function atchoum(ctx: AudioContext, sortie: AudioNode, t0: number, inspire: number) {
  const a = bruitBlanc(ctx, inspire);
  const fa = ctx.createBiquadFilter();
  fa.type = "highpass";
  fa.frequency.setValueAtTime(700, t0);
  fa.frequency.exponentialRampToValueAtTime(2600, t0 + inspire);
  a.connect(fa).connect(enveloppe(ctx, sortie, t0, inspire * 0.9, 0, 0.08, 0.22));
  a.start(t0);
  const b = bruitBlanc(ctx, 0.5);
  const fb = ctx.createBiquadFilter();
  fb.type = "bandpass";
  fb.frequency.value = 1800;
  fb.Q.value = 0.8;
  b.connect(fb).connect(enveloppe(ctx, sortie, t0 + inspire, 0.008, 0.06, 0.32, 0.9));
  b.start(t0 + inspire);
  const sourd = ctx.createOscillator();
  sourd.frequency.setValueAtTime(130, t0 + inspire);
  sourd.frequency.exponentialRampToValueAtTime(55, t0 + inspire + 0.2);
  sourd.connect(enveloppe(ctx, sortie, t0 + inspire, 0.005, 0.02, 0.2, 0.6));
  sourd.start(t0 + inspire);
  sourd.stop(t0 + inspire + 0.3);
}
/** 😴 Un ronflement : un souffle grave qui râpe, puis un petit sifflement. */
function ronfle(ctx: AudioContext, sortie: AudioNode, t0: number) {
  const r = bruitBlanc(ctx, 1);
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 380;
  const rape = ctx.createGain();
  rape.gain.value = 0.6;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 32;
  const p = ctx.createGain();
  p.gain.value = 0.4;
  lfo.connect(p).connect(rape.gain);
  r.connect(f).connect(rape).connect(enveloppe(ctx, sortie, t0, 0.35, 0.3, 0.25, 0.8));
  r.start(t0);
  lfo.start(t0);
  lfo.stop(t0 + 1);
  const s = ctx.createOscillator();
  s.frequency.setValueAtTime(760, t0 + 1);
  s.frequency.exponentialRampToValueAtTime(470, t0 + 1.45);
  s.connect(enveloppe(ctx, sortie, t0 + 1, 0.05, 0.25, 0.15, 0.05));
  s.start(t0 + 1);
  s.stop(t0 + 1.5);
}
/** 🫢 Un « hic » : une note brève qui tombe, et un petit clic. */
function hic(ctx: AudioContext, sortie: AudioNode, t0: number) {
  const o = ctx.createOscillator();
  o.type = "triangle";
  o.frequency.setValueAtTime(980, t0);
  o.frequency.exponentialRampToValueAtTime(600, t0 + 0.08);
  o.connect(enveloppe(ctx, sortie, t0, 0.005, 0.03, 0.06, 0.45));
  o.start(t0);
  o.stop(t0 + 0.12);
}
function boing(ctx: AudioContext, sortie: AudioNode, t0: number) {
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(420, t0);
  o.frequency.exponentialRampToValueAtTime(160, t0 + 0.3);
  o.connect(enveloppe(ctx, sortie, t0, 0.01, 0.05, 0.25, 0.25));
  o.start(t0);
  o.stop(t0 + 0.35);
}

// ─── l'image ─────────────────────────────────────────────────────────────────────────────────
// (`cadre` : là où est sa figurine dans ses poses détourées — le même pour toutes : elle ne saute pas d'un visage à l'autre)
type Images = { fond: HTMLImageElement; seule: HTMLImageElement | null; visage: HTMLImageElement | null; cadre?: { x: number; y: number; w: number; h: number } };
type Pose = { dy: number; sx: number; sy: number; rot: number; visage: boolean };

function dessinerFigurine(g: CanvasRenderingContext2D, im: Images, p: Pose) {
  const detouree = Boolean(im.seule && im.visage);
  const img = detouree ? (p.visage ? im.visage! : im.seule!) : im.fond;
  g.save();
  if (detouree) {
    // DÉTOURÉE : elle tient en entier, au plus près (son cadre), posée en bas
    const c = im.cadre ?? { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
    const k = Math.min((T * 0.9) / c.w, (T * 0.88) / c.h);
    g.translate(T / 2, T * 0.97 + p.dy);
    g.rotate(p.rot);
    g.scale(p.sx, p.sy);
    g.drawImage(img, c.x, c.y, c.w, c.h, (-c.w * k) / 2, -c.h * k, c.w * k, c.h * k);
  } else {
    // sa photo remplit le carré (un peu plus grande : ses bords ne se voient pas quand elle bouge)
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const k = Math.max(T / iw, T / ih) * 1.12;
    g.translate(T / 2, T * 1.06 + p.dy);
    g.rotate(p.rot);
    g.scale(p.sx, p.sy);
    g.drawImage(img, (-iw * k) / 2, -ih * k * 0.94, iw * k, ih * k);
  }
  g.restore();
}
function emoji(g: CanvasRenderingContext2D, e: string, x: number, y: number, taille: number, alpha = 1, rot = 0) {
  g.save();
  g.globalAlpha = alpha;
  g.translate(x, y);
  g.rotate(rot);
  g.font = `${taille}px ${EMOJI}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(e, 0, 0);
  g.restore();
}
function marque(g: CanvasRenderingContext2D, police: string) {
  g.save();
  g.globalAlpha = 0.72;
  g.font = `800 24px ${police}`;
  g.textAlign = "right";
  g.textBaseline = "alphabetic";
  g.fillStyle = "#FFFFFF";
  g.shadowColor = "rgba(0,0,0,.5)";
  g.shadowBlur = 6;
  g.fillText("clikme.fr", T - 22, T - 22);
  g.restore();
}
function bulle(g: CanvasRenderingContext2D, texte: string, x: number, y: number, police: string, alpha: number) {
  g.save();
  g.globalAlpha = alpha;
  g.font = `900 44px ${police}`;
  const w = g.measureText(texte).width + 36;
  g.fillStyle = "#FFFFFF";
  g.beginPath();
  g.roundRect(x - w / 2, y - 34, w, 68, 34);
  g.fill();
  g.fillStyle = "#2A0F1F";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(texte, x, y + 2);
  g.restore();
}

/** Une image du gag, au temps `t`. */
function dessiner(g: CanvasRenderingContext2D, gag: CleGag, intensite: number, im: Images, t: number, police: string, emojiVisage: string) {
  const detouree = Boolean(im.seule && im.visage);
  g.clearRect(0, 0, T, T);
  let pose: Pose = { dy: 0, sx: 1, sy: 1, rot: Math.sin(t * 2.2) * 0.015, visage: false };
  let secousse = 0;
  const apres: (() => void)[] = [];
  const avant: (() => void)[] = [];
  if (gag === "prout") {
    const d = dureeProut(intensite);
    const a = 0.7;
    const dans = t >= a && t < a + d;
    if (t >= a) {
      const u = t - a;
      pose = { ...pose, dy: -34 * cloche(u / 0.28), sx: 1 + 0.05 * cloche(u / 0.28), sy: 1 - 0.05 * cloche(u / 0.28), visage: true };
    }
    if (dans) secousse = 1.5 + intensite;
    // le nuage : des bouffées vertes, derrière elle, plus nombreuses et plus grosses avec l'intensité
    const n = 2 + intensite * 2;
    avant.push(() => {
      for (let k = 0; k < n; k++) {
        const t0 = a + (d * k) / n;
        const u = (t - t0) / 1.8;
        if (u < 0 || u > 1) continue;
        // (sur les côtés, en bas : elles débordent de derrière elle, et s'étalent en montant)
        const cote = k % 2 ? 1 : -1;
        const x = T / 2 + cote * (150 + 22 * intensite + 26 * (k % 3) + u * 60);
        const y = T * 0.86 - u * (120 + 12 * intensite);
        const r = 34 + u * (74 + 16 * intensite);
        const grad = g.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(170,210,90,${0.78 * (1 - u)})`);
        grad.addColorStop(1, "rgba(120,170,60,0)");
        g.fillStyle = grad;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      }
    });
    if (t >= a + d) apres.push(() => emoji(g, "💧", T * 0.68, T * 0.24 + 12 * Math.sin(t * 5), 64));
    if (!detouree && t >= a) apres.push(() => emoji(g, emojiVisage, T - 92, 120, 110));
  } else if (gag === "eternue") {
    const inspire = 1.3;
    const a = 0.45;
    if (t >= a && t < a + inspire) {
      const u = (t - a) / inspire;
      pose = { ...pose, sy: 1 + 0.07 * u, sx: 1 - 0.02 * u, rot: -0.09 * u, visage: true };
    } else if (t >= a + inspire) {
      const u = t - a - inspire;
      pose = { ...pose, rot: 0.16 * cloche(u / 0.5), sx: 1 + 0.05 * cloche(u / 0.3), dy: 10 * cloche(u / 0.4), visage: u < 0.6 };
      if (u < 0.35) secousse = 7;
      for (let k = 0; k < 7; k++) {
        const v = (u - k * 0.03) / 0.9;
        if (v > 0 && v < 1) apres.push(() => emoji(g, "💦", T * 0.6 + v * (180 + k * 22), T * 0.32 + Math.sin(k) * 60 + v * v * 140, 46, 1 - v, k));
      }
      if (u < 0.12) apres.push(() => {
        g.fillStyle = `rgba(255,255,255,${0.6 * (1 - u / 0.12)})`;
        g.fillRect(0, 0, T, T);
      });
    }
    if (!detouree && t >= a && t < a + inspire + 0.6) apres.push(() => emoji(g, emojiVisage, T - 92, 120, 110));
  } else if (gag === "dort") {
    const a = 0.4;
    const fin = 3.4;
    if (t >= a && t < fin) {
      pose = { ...pose, rot: Math.sin((t - a) * 1.6) * 0.05, dy: 6 * Math.sin((t - a) * 1.6 * 2), visage: true };
      for (let k = 0; k < 3; k++) {
        const v = ((t - a + k * 0.6) % 1.8) / 1.8;
        apres.push(() => {
          g.save();
          g.globalAlpha = Math.sin(Math.PI * v);
          g.font = `900 ${48 + k * 14}px ${police}`;
          g.lineWidth = 8;
          g.strokeStyle = "#2A0F1F";
          g.fillStyle = "#FFFFFF";
          g.strokeText("Z", T * 0.66 + v * 90 + k * 20, T * 0.3 - v * 150);
          g.fillText("Z", T * 0.66 + v * 90 + k * 20, T * 0.3 - v * 150);
          g.restore();
        });
      }
      if (!detouree) apres.push(() => emoji(g, emojiVisage, T - 92, 120, 110));
    } else if (t >= fin) {
      const u = t - fin;
      pose = { ...pose, dy: -44 * cloche(u / 0.35), sy: 1 + 0.06 * cloche(u / 0.35) };
      apres.push(() => emoji(g, "‼️", T * 0.7, T * 0.2, 90, cl(1 - (u - 0.5) / 0.3)));
    }
  } else {
    const hics = [0.6, 1.5, 2.4];
    for (const h of hics) {
      const u = t - h;
      if (u >= 0 && u < 0.5) {
        pose = { ...pose, dy: -30 * cloche(u / 0.28), visage: u < 0.4 };
        apres.push(() => bulle(g, "hic !", T * 0.72, T * 0.22 - u * 30, police, cl(1 - (u - 0.3) / 0.2)));
        if (!detouree && u < 0.4) apres.push(() => emoji(g, emojiVisage, T - 92, 120, 110));
      }
    }
  }
  g.save();
  if (secousse) g.translate((Math.random() - 0.5) * secousse * 2, (Math.random() - 0.5) * secousse * 2);
  if (!detouree) {
    g.fillStyle = "#C2367F";
    g.fillRect(-20, -20, T + 40, T + 40);
  }
  if (detouree) {
    // (le fond d'abord, puis le nuage derrière elle, puis elle)
    const fond = g.createRadialGradient(T / 2, T * 0.4, 40, T / 2, T * 0.45, T * 0.75);
    fond.addColorStop(0, "#FF9AD0");
    fond.addColorStop(0.6, "#C2367F");
    fond.addColorStop(1, "#5E1240");
    g.fillStyle = fond;
    g.fillRect(-20, -20, T + 40, T + 40);
    avant.forEach((f) => f());
    dessinerFigurine(g, im, pose);
  } else {
    dessinerFigurine(g, im, pose);
    avant.forEach((f) => f());
  }
  g.restore();
  apres.forEach((f) => f());
  marque(g, police);
}

/** 💥 FABRIQUE LE GAG : il se joue en vrai sur `toile` (on le voit naître, on l'entend) pendant qu'il s'enregistre. */
export async function fabriquerGag(o: {
  gag: CleGag;
  intensite: number;
  images: ImagesGag;
  emoji: string;
  toile: HTMLCanvasElement;
  ctx: AudioContext;
  police: string;
  surProgres?: (p: number) => void;
}): Promise<{ blob: Blob; type: string; duree: number }> {
  const { ctx, toile } = o;
  toile.width = T;
  toile.height = T;
  const g = toile.getContext("2d");
  if (!g) throw new Error("Ce téléphone ne sait pas dessiner ici.");
  const [fond, seule, visage] = await Promise.all([charger(o.images.fond), o.images.seule ? charger(o.images.seule).catch(() => null) : null, o.images.visage ? charger(o.images.visage).catch(() => null) : null]);
  const im: Images = { fond, seule, visage, ...(seule && visage ? { cadre: boite(seule) } : {}) };
  const total = dureeGag(o.gag, o.intensite);
  const enregistree = ctx.createMediaStreamDestination();
  const sortie = ctx.createGain();
  sortie.connect(enregistree);
  sortie.connect(ctx.destination);
  if (ctx.state !== "running") await ctx.resume().catch(() => {});
  const format = formatMeme();
  const flux = new MediaStream([...toile.captureStream(IPS).getVideoTracks(), ...enregistree.stream.getAudioTracks()]);
  const rec = new MediaRecorder(flux, { ...(format ? { mimeType: format } : {}), videoBitsPerSecond: 2_500_000, audioBitsPerSecond: 128_000 });
  const morceaux: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data.size) morceaux.push(e.data);
  };
  const arret = new Promise<void>((ok) => (rec.onstop = () => ok()));
  dessiner(g, o.gag, o.intensite, im, 0, o.police, o.emoji);
  const debut = ctx.currentTime + 0.15;
  // les bruits, à leur place
  if (o.gag === "prout") prout(ctx, sortie, debut + 0.7, dureeProut(o.intensite), o.intensite);
  else if (o.gag === "eternue") atchoum(ctx, sortie, debut + 0.45, 1.3);
  else if (o.gag === "dort") {
    ronfle(ctx, sortie, debut + 0.6);
    ronfle(ctx, sortie, debut + 2.1);
    boing(ctx, sortie, debut + 3.4);
  } else for (const h of [0.6, 1.5, 2.4]) hic(ctx, sortie, debut + h);
  rec.start(250);
  try {
    await new Promise<void>((ok) => {
      const pas = () => {
        const t = Math.max(0, ctx.currentTime - debut);
        dessiner(g, o.gag, o.intensite, im, Math.min(t, total), o.police, o.emoji);
        o.surProgres?.(Math.min(1, t / total));
        if (t >= total + 0.1) ok();
        else requestAnimationFrame(pas);
      };
      requestAnimationFrame(pas);
    });
  } finally {
    if (rec.state !== "inactive") rec.stop();
    sortie.disconnect();
    for (const i of [fond, seule, visage]) if (i) URL.revokeObjectURL(i.src);
  }
  await arret;
  const type = (rec.mimeType || format || "video/webm").split(";")[0];
  return { blob: new Blob(morceaux, { type }), type, duree: total };
}
