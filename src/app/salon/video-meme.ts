/**
 * 📤 LA VIDÉO D'UN MÈME DU SALON (`docs/univers/salon-du-duo.md`, section 4.7 ; le lot S5) — « La vidéo n'est fabriquée
 * que pour la partager (📤 WhatsApp) : le même moteur joue le mème dans une toile hors écran, enregistrée
 * (`MediaRecorder`) — dans le décor du salon — puis partagée. »
 *
 * Une vidéo verticale (720 × 1280), fabriquée dans le téléphone : la pièce du salon (sa plaque) et ma figurine en calques
 * (son corps, sa tête qui pivote autour du cou) ; la caméra s'approche d'elle, le projecteur s'allume, le clap
 * « Action ! », les mots arrivent dans la bulle de BD (ou la forme de ma voix, si elle n'est pas encore écrite), la tête
 * dodeline et parle, les emojis de sa tête s'envolent ; ma voix — ou, sans voix, la petite musique ; « Coupez ! », puis
 * une seconde « Fais ton mème avec ta figurine · clikme.fr ». Rien n'est envoyé au serveur : le fichier part par la
 * feuille de partage du téléphone (WhatsApp), ou s'enregistre.
 *
 * MODULE DU NAVIGATEUR : à n'importer que dans un composant client.
 */
import { formatMeme, memePossible } from "@/lib/direct/meme";
import { musiqueDanse } from "@/lib/direct/musique-danse";
import type { CalqueFigurine, CalqueImage } from "@/lib/direct/salon";
import type { Zone } from "@/lib/direct/pieces-duo";
import { MOT_MS, emojiDeTete, motMsAvecVoix, type MemeSalon, type TeteMeme } from "@/lib/direct/meme-salon";
import { formeDeVoix, niveauA, niveauFaux, niveauxDe } from "@/lib/direct/vocal";

export const VIDEO_L = 720;
export const VIDEO_H = 1280;
const IPS = 30;
/** (le temps : l'approche, « Action ! », la tenue, « Coupez ! », la fin) */
const T_ACTION = 0.5;
const T_MOTS = 0.95;
const TENUE = 1.2;
const COUPEZ = 0.8;
const FIN = 1.6;

/** Ce téléphone sait-il fabriquer la vidéo d'un mème ? */
export const videoPossible = memePossible;

export type VideoMeme = { blob: Blob; type: string; duree: number };

/** Une image, chargée en mémoire (la toile reste lisible : pas d'image d'ailleurs). */
async function image(url: string): Promise<HTMLImageElement> {
  const r = await fetch(url, { cache: "force-cache" });
  if (!r.ok) throw new Error("La pièce n’a pas pu être chargée.");
  const u = URL.createObjectURL(await r.blob());
  const i = new Image();
  i.decoding = "async";
  i.src = u;
  await i.decode();
  return i;
}

const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const doux = (x: number) => {
  const t = cl(x);
  return t * t * (3 - 2 * t);
};
const pop = (x: number) => {
  const t = cl(x);
  return t < 0.6 ? (t / 0.6) * 1.12 : 1.12 - ((t - 0.6) / 0.4) * 0.12;
};

/** Les emojis qui s'envolent de sa tête, selon la tête du mème. */
const ENVOLS: Record<TeteMeme, string[]> = {
  rire: ["😂", "🤣", "😂"],
  joie: ["😄", "✨"],
  euphorie: ["🤩", "✨", "⭐"],
  amour: ["❤️", "😍", "💕"],
  grimace: ["😜", "🤪"],
  tristesse: ["💧", "😢"],
  colere: ["💢", "💨"],
};

type Calque = { img: HTMLImageElement; c: CalqueImage };

/**
 * 🎬 FABRIQUE LA VIDÉO DU MÈME (elle se joue en vrai pendant qu'elle s'enregistre, sur `toile` : on la voit naître).
 * `figurine` : mes calques (sans calques, la pièce et la bulle seulement) ; `sens` : où elle regarde.
 */
export async function fabriquerVideoMeme(o: {
  ctx: AudioContext;
  toile: HTMLCanvasElement;
  plaque: string;
  figurine?: CalqueFigurine;
  sens: 1 | -1;
  meme: Pick<MemeSalon, "texte" | "tete" | "danse" | "voix">;
  surProgres?: (p: number) => void;
}): Promise<VideoMeme> {
  const { ctx, toile, meme } = o;
  if (!videoPossible()) throw new Error("Ce téléphone ne sait pas fabriquer de vidéo.");
  toile.width = VIDEO_L;
  toile.height = VIDEO_H;
  const g = toile.getContext("2d");
  if (!g) throw new Error("Ce téléphone ne sait pas dessiner la vidéo.");
  const W = VIDEO_L;
  const H = VIDEO_H;

  // ─── ce qu'il faut : la pièce, mes calques, ma voix (ou la musique) ───
  const voixUrl = meme.voix && meme.voix.duree > 0 ? meme.voix.url : "";
  const [plaque, corps, tete, voix] = await Promise.all([
    image(o.plaque),
    o.figurine ? image(o.figurine.corps.fichier).then((img): Calque => ({ img, c: o.figurine!.corps })) : Promise.resolve(null),
    o.figurine ? image(o.figurine.tete.fichier).then((img): Calque => ({ img, c: o.figurine!.tete })) : Promise.resolve(null),
    voixUrl
      ? fetch(voixUrl)
          .then((r) => r.arrayBuffer())
          .then((a) => ctx.decodeAudioData(a))
          .catch(() => null)
      : Promise.resolve(null),
  ]);
  // (sans voix — ou si elle ne se lit pas : la petite musique)
  const musique = voix ? null : await musiqueDanse(ctx.sampleRate).catch(() => null);
  const PW = plaque.naturalWidth;
  const PH = plaque.naturalHeight;
  const mots = meme.texte ? meme.texte.split(" ").filter(Boolean) : [];
  const dureeVoix = voix ? voix.duration : meme.voix?.duree && voixUrl ? meme.voix.duree : 0;
  const pasMot = dureeVoix > 0 ? motMsAvecVoix(mots.length, dureeVoix) / 1000 : MOT_MS / 1000;
  const finMots = T_MOTS + Math.max(mots.length * pasMot, dureeVoix);
  const danse = meme.danse ? 0.9 : 0;
  const tCoupez = finMots + danse + TENUE;
  const total = tCoupez + COUPEZ + FIN;
  const niveaux = niveauxDe(meme.voix?.niveaux);
  const niveau = (t: number) => (t < 0 || t > Math.max(dureeVoix, mots.length * pasMot) ? 0 : dureeVoix > 0 && niveaux.length ? niveauA(niveaux, t) : niveauFaux(t, 3));
  const forme = mots.length ? [] : formeDeVoix(niveaux.length ? niveaux : Array.from({ length: 40 }, (_, i) => niveauFaux(i * 0.06, 3)), 16);
  const police = `${getComputedStyle(document.body).fontFamily || "system-ui"}, "Arial Black", sans-serif`;
  const emojiPolice = `"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  const tete8 = meme.tete;
  const envols = Array.from({ length: 9 }, (_, i) => ({ e: ENVOLS[tete8][i % ENVOLS[tete8].length], t0: T_MOTS + 0.2 + i * 0.32, dx: ((i * 37) % 11) / 11 - 0.5, vie: 1.5 }));

  // ─── où est sa tête (sur la pièce, en pixels de la plaque) ───
  const boite = (z: Zone) => ({ x: z[0] * PW, y: z[1] * PH, w: z[2] * PW, h: z[3] * PH });
  const bt = tete ? boite(tete.c.boite) : { x: PW * 0.3, y: PH * 0.4, w: PW * 0.12, h: PH * 0.16 };
  const centreTete = { x: bt.x + bt.w / 2, y: bt.y + bt.h / 2 };
  const piv = o.figurine ? { x: o.figurine.tete.pivot[0] * PW, y: o.figurine.tete.pivot[1] * PH } : centreTete;

  // ─── la caméra : la pièce entière (en hauteur), puis ma figurine de près ───
  const k0 = Math.max(W / PW, H / PH);
  const camera = (T: number) => {
    const aller = doux(T / T_ACTION);
    const retour = doux((T - tCoupez) / 0.6);
    const p = aller * (1 - retour);
    const z = 1 + p * 0.75;
    const K = k0 * z;
    const vise = { x: PW / 2 + (centreTete.x - PW / 2) * (0.55 + 0.45 * p), y: PH * 0.55 + (centreTete.y + bt.h * 0.6 - PH * 0.55) * p };
    // (la pièce couvre toujours toute la vidéo)
    const demiW = W / (2 * K);
    const demiH = H / (2 * K);
    const cx = cl(vise.x, demiW, PW - demiW);
    const cy = cl(vise.y, demiH, PH - demiH);
    return { K, cx, cy, p };
  };
  const ecran = (cam: { K: number; cx: number; cy: number }, x: number, y: number) => ({ x: (x - cam.cx) * cam.K + W / 2, y: (y - cam.cy) * cam.K + H / 2 });

  const dessinerCalque = (cal: Calque) => {
    const b = boite(cal.c.boite);
    const [dx, dy, dw, dh] = cal.c.decoupe ?? [0, 0, 1, 1];
    const iw = cal.img.naturalWidth;
    const ih = cal.img.naturalHeight;
    g.drawImage(cal.img, dx * iw, dy * ih, dw * iw, dh * ih, b.x, b.y, b.w, b.h);
  };

  /** La bulle de BD au-dessus de sa tête : les mots dits jusqu'ici (ou la forme de ma voix). */
  const bulle = (T: number, tx: number, ty: number) => {
    if (T < T_MOTS || T > tCoupez + 0.3) return;
    const sortie = cl((T - tCoupez) / 0.3);
    const entree = pop((T - T_MOTS) / 0.25);
    const dits = Math.min(mots.length, Math.floor((T - T_MOTS) / pasMot) + 1);
    const taille = 46;
    g.save();
    g.font = `800 ${taille}px ${police}`;
    const max = W * 0.74;
    // (les lignes : les mots déjà dits, coupés à la largeur)
    const lignes: string[][] = [[]];
    const tous = mots.length ? mots : [];
    for (const m of tous) {
      const l = lignes[lignes.length - 1];
      const essai = [...l, m].join(" ");
      if (l.length && g.measureText(essai).width > max - 60) lignes.push([m]);
      else l.push(m);
    }
    const hl = taille * 1.22;
    const largeur = mots.length ? Math.min(max, Math.max(...lignes.map((l) => g.measureText(l.join(" ")).width)) + 64) : 420;
    const hauteur = mots.length ? lignes.length * hl + 44 : 110;
    const x = cl(tx, largeur / 2 + 24, W - largeur / 2 - 24);
    const y = Math.max(140 + hauteur, ty - 40);
    g.translate(x, y);
    g.scale(entree * (1 - sortie * 0.1), entree * (1 - sortie * 0.1));
    g.globalAlpha = 1 - sortie;
    // (son ombre, son trait, sa queue vers la tête)
    const r = 34;
    const contour = () => {
      g.beginPath();
      g.roundRect(-largeur / 2, -hauteur, largeur, hauteur, r);
    };
    g.fillStyle = "#1d0a1b";
    g.translate(0, 9);
    contour();
    g.fill();
    g.translate(0, -9);
    g.fillStyle = "#fff";
    g.strokeStyle = "#1d0a1b";
    g.lineWidth = 6;
    contour();
    g.fill();
    g.stroke();
    g.beginPath();
    const qx = cl(tx - x, -largeur / 2 + 50, largeur / 2 - 50);
    g.moveTo(qx - 22, -3);
    g.lineTo(qx, 34);
    g.lineTo(qx + 22, -3);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(qx - 22, 0);
    g.lineTo(qx, 34);
    g.lineTo(qx + 22, 0);
    g.stroke();
    g.fillStyle = "#1d0a1b";
    g.textAlign = "center";
    g.textBaseline = "middle";
    if (mots.length) {
      let n = 0;
      lignes.forEach((l, i) => {
        const montres = l.slice(0, Math.max(0, dits - n));
        n += l.length;
        if (!montres.length) return;
        // (alignés comme la ligne entière, les mots pas encore dits restent invisibles)
        const entiere = l.join(" ");
        const debut = -g.measureText(entiere).width / 2;
        g.textAlign = "left";
        g.fillText(montres.join(" "), debut, -hauteur + 22 + hl * (i + 0.5));
      });
    } else {
      // 🎙️ la forme de ma voix, qui se colore
      g.font = `${52}px ${emojiPolice}`;
      g.fillText("🎙️", -150, -hauteur / 2);
      const lus = Math.round(cl((T - T_MOTS) / Math.max(0.5, dureeVoix)) * forme.length);
      forme.forEach((h, i) => {
        g.fillStyle = i < lus ? "#ff2f8f" : "#d8c3d4";
        const bh = 14 + h * 58;
        g.beginPath();
        g.roundRect(-96 + i * 15, -hauteur / 2 - bh / 2, 9, bh, 5);
        g.fill();
      });
    }
    g.restore();
  };

  /** Un mot de lettrage (« Action ! », « Coupez ! »), qui claque. */
  const lettrage = (texte: string, T: number, t0: number, x: number, y: number, couleur: string, rot: number) => {
    const t = (T - t0) / 0.8;
    if (t < 0 || t > 1) return;
    g.save();
    g.translate(x, y);
    g.rotate((rot * Math.PI) / 180);
    const s = pop(t / 0.35);
    g.scale(s, s);
    g.globalAlpha = t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1;
    g.font = `900 78px ${police}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineJoin = "round";
    g.lineWidth = 14;
    g.strokeStyle = "#1d0a1b";
    g.strokeText(texte, 0, 0);
    g.fillStyle = couleur;
    g.fillText(texte, 0, 0);
    g.restore();
  };

  const dessiner = (T: number) => {
    const cam = camera(T);
    g.save();
    g.fillStyle = "#170816";
    g.fillRect(0, 0, W, H);
    // (la pièce, puis ma figurine : son corps, sa tête qui parle)
    g.setTransform(cam.K, 0, 0, cam.K, W / 2 - cam.cx * cam.K, H / 2 - cam.cy * cam.K);
    g.drawImage(plaque, 0, 0, PW, PH);
    const t = T - T_MOTS;
    const n = niveau(t);
    const dansant = meme.danse && T > finMots && T < finMots + danse ? Math.sin(((T - finMots) / 0.3) * Math.PI) : 0;
    if (corps) {
      g.save();
      const bc = boite(corps.c.boite);
      g.translate(bc.x + bc.w / 2, bc.y + bc.h * 0.74);
      g.rotate((dansant * 5 * Math.PI) / 180);
      g.translate(-(bc.x + bc.w / 2), -(bc.y + bc.h * 0.74));
      dessinerCalque(corps);
      if (tete) {
        const parle = T > T_MOTS && T < tCoupez ? Math.sin(T * 16) * n : 0;
        const angle = (o.sens * (Math.sin(T * 2.1) * 2.2 + parle * 4) + dansant * 6) * (Math.PI / 180);
        g.translate(piv.x, piv.y - Math.abs(parle) * bt.h * 0.025);
        g.rotate(angle);
        const s = 1 + n * 0.035;
        g.scale(s, s);
        g.translate(-piv.x, -piv.y);
        dessinerCalque(tete);
      }
      g.restore();
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    // (le projecteur : la pièce s'assombrit, un faisceau tombe sur elle)
    const ht = ecran(cam, centreTete.x, centreTete.y);
    const lum = cl(T / 0.35) * (1 - cl((T - tCoupez - 0.2) / 0.4));
    if (lum > 0) {
      g.save();
      g.globalAlpha = lum;
      const rg = g.createRadialGradient(ht.x, ht.y + 60, 30, ht.x, ht.y + 60, W * 0.9);
      rg.addColorStop(0, "rgba(255,236,190,.10)");
      rg.addColorStop(0.28, "rgba(8,4,10,.55)");
      rg.addColorStop(1, "rgba(8,4,10,.85)");
      g.fillStyle = rg;
      g.fillRect(0, 0, W, H);
      const fx = g.createLinearGradient(0, 0, 0, ht.y + 80);
      fx.addColorStop(0, "rgba(255,240,200,.30)");
      fx.addColorStop(1, "rgba(255,240,200,.06)");
      g.fillStyle = fx;
      g.beginPath();
      g.moveTo(ht.x - 70, 0);
      g.lineTo(ht.x + 70, 0);
      g.lineTo(ht.x + 230, ht.y + 120);
      g.lineTo(ht.x - 230, ht.y + 120);
      g.closePath();
      g.fill();
      g.restore();
    }
    // (les emojis de sa tête, qui s'envolent)
    g.save();
    g.font = `64px ${emojiPolice}`;
    g.textAlign = "center";
    for (const e of envols) {
      const v = (T - e.t0) / e.vie;
      if (v < 0 || v > 1 || e.t0 > tCoupez) continue;
      g.globalAlpha = v < 0.15 ? v / 0.15 : 1 - Math.max(0, v - 0.6) / 0.4;
      g.fillText(e.e, ht.x + e.dx * 300 + Math.sin(v * 6 + e.dx * 9) * 26, ht.y - 40 - v * 330);
    }
    g.restore();
    // (le clap, la bulle, « Coupez ! »)
    lettrage("Action !", T, T_ACTION - 0.1, ht.x + o.sens * 150, ht.y - bt.h * cam.K * 0.9, "#ffd43b", o.sens * -8);
    bulle(T, ht.x, ht.y - bt.h * cam.K * 0.55);
    lettrage("Coupez !", T, tCoupez, W / 2, H * 0.3, "#ff6fb1", -4);
    // (la petite marque)
    g.save();
    g.font = `800 30px ${police}`;
    g.textAlign = "right";
    g.fillStyle = "rgba(255,255,255,.75)";
    g.fillText("ClikMe", W - 28, H - 36);
    g.restore();
    // (la fin : « Fais ton mème avec ta figurine · clikme.fr »)
    const f = cl((T - tCoupez - COUPEZ) / 0.35);
    if (f > 0) {
      g.save();
      g.globalAlpha = f;
      g.fillStyle = "rgba(23,8,22,.92)";
      g.fillRect(0, 0, W, H);
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.font = `120px ${emojiPolice}`;
      g.fillText(emojiDeTete(tete8), W / 2, H * 0.4);
      g.fillStyle = "#fff";
      g.font = `900 54px ${police}`;
      g.fillText("Fais ton mème", W / 2, H * 0.52);
      g.fillText("avec ta figurine", W / 2, H * 0.57);
      g.fillStyle = "#ffd99a";
      g.font = `800 40px ${police}`;
      g.fillText("clikme.fr", W / 2, H * 0.65);
      g.restore();
    }
    g.restore();
  };

  // ─── le son : ma voix, ou la musique — vers l'enregistrement seulement ───
  const sortie = ctx.createMediaStreamDestination();
  const gain = ctx.createGain();
  gain.connect(sortie);
  const sources: AudioBufferSourceNode[] = [];
  if (voix) {
    const s = ctx.createBufferSource();
    s.buffer = voix;
    s.connect(gain);
    sources.push(s);
  } else if (musique) {
    const s = ctx.createBufferSource();
    s.buffer = musique;
    s.loop = true;
    const v = ctx.createGain();
    v.gain.value = 0.55;
    s.connect(v);
    v.connect(gain);
    sources.push(s);
  }
  if (ctx.state !== "running") await ctx.resume().catch(() => undefined);

  const format = formatMeme();
  const flux = new MediaStream([...toile.captureStream(IPS).getVideoTracks(), ...sortie.stream.getAudioTracks()]);
  const rec = new MediaRecorder(flux, { ...(format ? { mimeType: format } : {}), videoBitsPerSecond: 3_500_000, audioBitsPerSecond: 128_000 });
  const morceaux: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data.size) morceaux.push(e.data);
  };
  const arret = new Promise<void>((ok) => (rec.onstop = () => ok()));
  dessiner(0);
  const debut = ctx.currentTime + 0.15;
  if (voix) sources[0]?.start(debut + T_MOTS);
  else sources[0]?.start(debut + 0.2);
  // (la musique s'éteint à « Coupez ! »)
  if (!voix && sources.length) {
    gain.gain.setValueAtTime(1, debut + tCoupez);
    gain.gain.linearRampToValueAtTime(0, debut + tCoupez + COUPEZ + 0.6);
  }
  rec.start(250);
  try {
    await new Promise<void>((ok) => {
      const pas = () => {
        const T = Math.max(0, ctx.currentTime - debut);
        dessiner(T);
        o.surProgres?.(Math.min(1, T / total));
        if (T >= total) ok();
        else requestAnimationFrame(pas);
      };
      requestAnimationFrame(pas);
    });
  } finally {
    for (const s of sources)
      try {
        s.stop();
      } catch {
        /* déjà fini */
      }
    if (rec.state !== "inactive") rec.stop();
    for (const i of [plaque, corps?.img, tete?.img]) if (i) URL.revokeObjectURL(i.src);
  }
  await arret;
  const type = (rec.mimeType || format || "video/webm").split(";")[0];
  return { blob: new Blob(morceaux, { type }), type, duree: total };
}
