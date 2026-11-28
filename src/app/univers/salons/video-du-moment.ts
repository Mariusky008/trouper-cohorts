"use client";

/**
 * 🎬 LA VIDÉO DE MA RÉACTION (les grands moments, lot R5 ; refaite en montage le 27/11 — V1 ; `docs/univers/grands-moments.md`).
 * Pour TikTok et les Reels : le téléphone la fabrique lui-même, sans serveur (rien à payer). Un canevas 720 × 1280, 5 s :
 * 1. le moment arrive : la télé en grand qui s'approche, le compteur qui monte (0:26… 0:27… 0:28…), ma figurine assise ;
 * 2. le flash : l'écran blanchit, tout tremble, ma figurine explose à l'écran (rayons, aura, son geste), sa bulle claque,
 *    les émojis et les confettis jaillissent ;
 * 3. la fin : « Et toi, tu réagis comment ? » et l'adresse du moment. Le canevas est filmé (`captureStream` + `MediaRecorder`) :
 * en MP4 quand le téléphone sait le faire (iPhone, Chrome récent), sinon en WebM. Il ne sait pas : pas de vidéo, l'image
 * reste.
 *
 * 🎙 « Dis-le » (V2, validé le 28/11) : sans rien, la vidéo est muette. Avec sa voix (trois secondes, enregistrées au micro
 * dans la feuille), elle part au moment du flash, quand sa figurine explose, et sa bouche la suit (sa figurine bouche
 * ouverte, `?bouche=1` ; sans elle, sa figurine bat sur sa voix). Rien ne part au serveur : sa voix n'est que dans la
 * vidéo qu'il envoie lui-même. Le téléphone ne sait pas mettre le son : la vidéo reste muette (`avecVoix: false`).
 * Jamais de voix de synthèse, jamais de bruitage.
 */
import { eclatsDuMoment, type Moment } from "@/lib/direct/grands-moments";
import { MOMENT_PARTAGE as MP, PHRASES_MOMENT as P, VOIX_MOMENT, adresseCourte, minuteDuMoment, type MomentPartage } from "@/lib/direct/moment-partage";
import { boucheOuverte, enveloppeDe } from "@/lib/direct/bouche";

export const VIDEO_MOMENT = { largeur: 720, hauteur: 1280, ms: 5000, ips: 30, debit: 3_000_000 } as const;
/** le montage (en secondes) : le compteur monte jusqu'au flash, ma figurine explose, puis « Et toi ? » */
export const MONTAGE = { arrive: 1.6, fin: 4.2 } as const;

const FORMATS = ["video/mp4;codecs=avc1.42E01E", "video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
/** 🎙 avec sa voix : l'image et le son — H.264 d'abord (ce que TikTok, Instagram et WhatsApp lisent partout), avec de l'AAC
 *  (l'iPhone, Chrome), sinon de l'Opus (un Chromium sans AAC : sans ça, « video/mp4 » seul y donnerait du VP9) */
const FORMATS_SON = ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4;codecs=avc1,mp4a.40.2", "video/mp4;codecs=avc1.42E01E,opus", "video/mp4;codecs=avc1,opus", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];

/** Le format que ce téléphone sait filmer ("" : il ne sait pas) ; `son` : avec sa voix. */
export function formatVideo(son = false): string {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined" || typeof HTMLCanvasElement === "undefined") return "";
  if (typeof (HTMLCanvasElement.prototype as { captureStream?: unknown }).captureStream !== "function") return "";
  return (son ? FORMATS_SON : FORMATS).find((f) => MediaRecorder.isTypeSupported?.(f)) ?? "";
}

/**
 * 🎙 Sa voix, prête à entrer dans la vidéo. `ctx` : le son du téléphone, réveillé dans le toucher « Dis-le » (sinon
 * l'iPhone le garde endormi) ; `son` : ce qu'il a dit au micro.
 */
export type VoixDuMoment = { son: Blob; ctx: AudioContext };
type VoixPrete = { piste: MediaStreamTrack; lancer: (dans: number) => void; enveloppe: number[]; duree: number };

/** Sa voix décodée, en piste de son pour la vidéo, et son volume (la bouche) ; `null` : le téléphone ne sait pas. */
async function voixPrete(v: VoixDuMoment): Promise<VoixPrete | null> {
  const { ctx, son } = v;
  if (typeof ctx.createMediaStreamDestination !== "function") return null;
  try {
    if (ctx.state === "suspended") await ctx.resume().catch(() => undefined);
    const tampon = await ctx.decodeAudioData(await son.arrayBuffer());
    const sortie = ctx.createMediaStreamDestination();
    const piste = sortie.stream.getAudioTracks()[0];
    if (!piste) return null;
    const duree = Math.min(tampon.duration, VOIX_MOMENT.max);
    const lancer = (dans: number) => {
      const lecture = ctx.createBufferSource();
      lecture.buffer = tampon;
      lecture.connect(sortie);
      lecture.start(ctx.currentTime + dans, 0, duree);
    };
    return { piste, lancer, enveloppe: enveloppeDe(tampon.getChannelData(0), tampon.sampleRate), duree };
  } catch {
    return null;
  }
}

const image = (src: string) =>
  new Promise<HTMLImageElement | null>((ok) => {
    const i = new Image();
    i.decoding = "async";
    i.onload = () => ok(i);
    i.onerror = () => ok(null);
    i.src = src;
  });

const borne = (x: number) => Math.min(1, Math.max(0, x));
const sortie = (x: number) => 1 - Math.pow(1 - borne(x), 3);
/** l'arrivée qui dépasse un peu, puis se pose */
const rebond = (x: number) => {
  const c = 1.9;
  const u = borne(x) - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
};

function arrondi(c: CanvasRenderingContext2D, x: number, y: number, l: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + l, y, x + l, y + h, r);
  c.arcTo(x + l, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + l, y, r);
  c.closePath();
}

/** les lignes de la bulle (au plus trois) */
function lignes(c: CanvasRenderingContext2D, texte: string, max: number): string[] {
  const mots = texte.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let l = "";
  for (const m of mots) {
    const essai = l ? `${l} ${m}` : m;
    if (c.measureText(essai).width <= max || !l) l = essai;
    else {
      out.push(l);
      l = m;
    }
  }
  if (l) out.push(l);
  if (out.length > 3) return [...out.slice(0, 2), `${out.slice(2).join(" ").slice(0, 18)}…`];
  return out;
}

/**
 * Fabrique la vidéo du moment ; `voix` : 🎙 avec sa voix, posée au flash. `null` : le téléphone ne sait pas filmer, ou une
 * image manque ; `avecVoix: false` : demandée, sa voix n'a pas pu y entrer (la vidéo est muette).
 */
export async function fabriquerVideoDuMoment({ moment, m, police, voix }: { moment: MomentPartage; m: Moment; police: string; voix?: VoixDuMoment }): Promise<{ fichier: File; avecVoix: boolean } | null> {
  const dite = voix && formatVideo(true) ? await voixPrete(voix) : null;
  const format = formatVideo(Boolean(dite));
  if (!format) return null;
  const [mini, fig, figParle] = await Promise.all([
    image(`/api/direct/moment/${moment.id}/miniature`),
    image(`/api/direct/moment/${moment.id}/figurine`),
    dite ? image(`/api/direct/moment/${moment.id}/figurine?bouche=1`) : Promise.resolve(null),
  ]);
  if (!fig) return null;
  try {
    await document.fonts?.load(`64px ${police}`);
  } catch {
    /* (la police du système) */
  }

  const { largeur: W, hauteur: H, ms, ips, debit } = VIDEO_MOMENT;
  const toile = document.createElement("canvas");
  toile.width = W;
  toile.height = H;
  const c = toile.getContext("2d");
  if (!c) return null;
  const minute = minuteDuMoment(moment.t);
  const adresse = adresseCourte(window.location.origin, moment.id);
  const eclats = eclatsDuMoment(m, moment.id, 18, 300);
  const titre = moment.video.titre.length > MP.titre ? `${moment.video.titre.slice(0, MP.titre - 1)}…` : moment.video.titre;
  const systeme = `system-ui,-apple-system,"Segoe UI",sans-serif`;

  // (trois temps : la télé en grand et le compteur qui monte — le flash — ma figurine qui explose ; puis « Et toi ? »)
  const { arrive, fin: finale } = MONTAGE;
  const sol = H - 205;
  const hAssise = 230;
  const hFig = 500;
  const petite = { l: W - 200, x: 100, y: 130 };
  const grande = { l: W - 32, x: 16, y: 190 };
  const debutCompte = Math.max(0, moment.t - MP.avant);

  /** la télé : la miniature, sa place entre la grande et la petite */
  const tele = (k: number, s: number, sombre: number) => {
    const l = grande.l + (petite.l - grande.l) * k;
    const x = grande.x + (petite.x - grande.x) * k;
    const y = grande.y + (petite.y - grande.y) * k;
    const h = Math.round((l * 9) / 16);
    c.save();
    arrondi(c, x, y, l, h, 26);
    c.clip();
    c.fillStyle = "#000";
    c.fillRect(x, y, l, h);
    if (mini) {
      const z = 1 + 0.14 * Math.min(1, s / arrive);
      c.drawImage(mini, x - (l * z - l) / 2, y - (h * z - h) / 2, l * z, h * z);
    }
    c.fillStyle = `rgba(0,0,0,${sombre})`;
    c.fillRect(x, y, l, h);
    c.restore();
    return { x, y, l, h };
  };
  /** la pastille rose de l'heure */
  const heure = (texte: string, x: number, y: number, taille: number) => {
    c.font = `800 ${taille}px ${systeme}`;
    c.textAlign = "left";
    c.textBaseline = "alphabetic";
    const l = c.measureText(texte).width + taille * 1.1;
    c.fillStyle = "#FF2E9A";
    arrondi(c, x, y, l, taille * 1.55, taille * 0.45);
    c.fill();
    c.fillStyle = "#fff";
    c.fillText(texte, x + taille * 0.55, y + taille * 1.13);
  };

  const dessiner = (ms0: number) => {
    const s = ms0 / 1000;
    const apres = s - arrive;
    c.save();
    c.fillStyle = "#1B0A17";
    c.fillRect(0, 0, W, H);
    if (apres > 0) {
      const fond = c.createRadialGradient(W / 2, sol - 260, 40, W / 2, sol - 260, H * 0.75);
      fond.addColorStop(0, `${m.couleur}66`);
      fond.addColorStop(1, "#1B0A17");
      c.globalAlpha = sortie(apres / 0.3);
      c.fillStyle = fond;
      c.fillRect(0, 0, W, H);
      c.globalAlpha = 1;
      // la secousse du flash
      if (apres < 0.55) {
        const amp = 16 * (1 - apres / 0.55);
        c.translate(Math.sin(apres * 95) * amp, Math.cos(apres * 70) * amp * 0.6);
      }
    }

    // la marque
    c.fillStyle = "#FFF4E6";
    c.font = `800 40px ${systeme}`;
    c.textAlign = "center";
    c.textBaseline = "alphabetic";
    c.fillText("ClikMe", W / 2, 96);

    // 1. le moment arrive : la télé en grand, le compteur qui monte (0:26… 0:27… 0:28…)
    const k = sortie(apres / 0.4);
    const t = tele(apres > 0 ? k : 0, s, apres > 0 ? 0.35 * k : 0);
    if (apres <= 0) {
      const sec = Math.min(moment.t, debutCompte + Math.floor((s / arrive) * (moment.t - debutCompte + 0.001)));
      heure(minuteDuMoment(sec), t.x + 20, t.y + t.h - 78, 40);
    } else heure(`à ${minute}`, t.x + 18, t.y + t.h - 62, 30);
    if (titre && apres <= 0) {
      c.font = `600 24px ${systeme}`;
      c.fillStyle = "rgba(255,244,230,.75)";
      c.textAlign = "left";
      c.fillText(titre.length > 46 ? `${titre.slice(0, 45)}…` : titre, t.x + 4, t.y + t.h + 40);
    }

    // ma figurine : assise et sage, puis elle explose au flash
    const a = apres / 0.5;
    const hAuj = a <= 0 ? hAssise : hAssise + (hFig - hAssise) * rebond(a);
    const l = (fig.width / fig.height) * hAuj;
    if (apres > 0) {
      // les rayons qui tournent, l'aura qui bat
      c.save();
      c.translate(W / 2, sol - hAuj * 0.45);
      c.rotate(s * 0.9);
      c.globalAlpha = (m.rayons ? 0.24 : 0.14) * sortie(a);
      c.fillStyle = "#fff";
      for (let i = 0; i < 26; i++) {
        c.beginPath();
        c.moveTo(0, 0);
        c.arc(0, 0, 1000, (i / 26) * Math.PI * 2, (i / 26) * Math.PI * 2 + 0.07);
        c.closePath();
        c.fill();
      }
      c.restore();
      const pouls = 0.92 + 0.08 * Math.sin(s * 7);
      const aura = c.createRadialGradient(W / 2, sol - hAuj * 0.5, 10, W / 2, sol - hAuj * 0.5, hAuj * 0.78 * pouls);
      aura.addColorStop(0, m.couleur);
      aura.addColorStop(0.55, `${m.couleur}66`);
      aura.addColorStop(1, `${m.couleur}00`);
      c.globalAlpha = sortie(a);
      c.fillStyle = aura;
      c.fillRect(0, sol - hAuj * 1.4, W, hAuj * 1.6);
      c.globalAlpha = 1;
    }
    let dy = 0;
    let rot = 0;
    let kx = 1;
    let ky = 1;
    // 🎙 sa voix, à partir du flash : sa bouche s'ouvre quand elle est forte (sans tête qui parle, elle bat dessus)
    const parle = Boolean(dite && apres >= 0 && apres <= dite.duree && boucheOuverte(dite.enveloppe, apres));
    if (parle && !figParle) {
      ky = 1.04;
      kx = 0.985;
    }
    const g = apres - 0.55;
    if (g > 0) {
      if (m.geste === "sautille") {
        dy = -Math.abs(Math.sin(g * 7.5)) * 34;
        rot = Math.sin(g * 7.5) * 0.05;
      } else if (m.geste === "saute") dy = -Math.abs(Math.sin(g * 6.3)) * 60;
      else if (m.geste === "flotte") dy = -Math.sin(g * 3.5) * 26;
      else if (m.geste === "bondit" && g < 0.5) kx = ky = 1 + 0.12 * Math.sin(g * Math.PI * 2);
      else if (m.geste === "tremble") dy = Math.sin(g * 140) * 4;
      else if (m.geste === "affaisse") {
        ky = 1 - 0.07 * sortie(g / 0.9);
        dy = 14 * sortie(g / 0.9);
      }
    }
    c.save();
    c.translate(W / 2, sol + dy);
    c.rotate(rot);
    c.scale(kx, ky);
    if (apres > 0) {
      c.shadowColor = m.couleur;
      c.shadowBlur = 34;
    } else c.globalAlpha = 0.8;
    c.drawImage(parle && figParle ? figParle : fig, -l / 2, -hAuj, l, hAuj);
    c.restore();
    c.globalAlpha = 1;

    if (apres > 0) {
      // le nuage (la tristesse)
      if (m.nuage && apres > 0.4) {
        c.globalAlpha = sortie((apres - 0.4) / 0.4);
        c.font = `90px ${systeme}`;
        c.textAlign = "center";
        c.fillText(m.nuage, W / 2, sol - hAuj - 10);
        c.globalAlpha = 1;
      }
      // les émojis qui jaillissent
      c.textAlign = "center";
      for (const x of eclats) {
        const p = (apres * 1000 - 120 - x.retard) / (x.duree + 600);
        if (p <= 0 || p >= 1) continue;
        const q = sortie(p);
        const ex = W / 2 + x.x * 1.15 * q;
        const ey = sol - hAuj * 0.55 + (m.sens === "tombe" ? Math.abs(x.y) * 1.4 * q : x.y * 1.35 * q);
        c.globalAlpha = p < 0.75 ? 1 : 1 - (p - 0.75) / 0.25;
        c.font = `${Math.round(x.taille * 2.4 * (0.4 + 0.6 * q))}px ${systeme}`;
        c.fillText(x.e, ex, ey);
      }
      c.globalAlpha = 1;
      // les confettis, de la couleur de l'émotion
      for (let i = 0; i < 44; i++) {
        const p = (apres * 1000 - 60 - i * 18) / 2100;
        if (p <= 0 || p >= 1) continue;
        const ang = ((i * 137.5) % 360) * (Math.PI / 180);
        const v = 280 + ((i * 53) % 240);
        const cx = W / 2 + Math.cos(ang) * v * p;
        const cy = sol - hAuj * 0.6 + Math.sin(ang) * v * p * 0.7 + 640 * p * p;
        c.save();
        c.translate(cx, cy);
        c.rotate(p * 12 + i);
        c.globalAlpha = 1 - p;
        c.fillStyle = (m.confettis ? ["#FF2E9A", "#FFD23F", "#3DDC97", "#4C8DFF", "#fff"] : [m.couleur, "#fff", m.couleur])[i % (m.confettis ? 5 : 3)];
        c.fillRect(-6, -10, 12, 20);
        c.restore();
      }
      // la bulle qui claque
      const b = (apres - 0.25) / 0.35;
      if (b > 0) {
        const kb = b < 1 ? 2.2 - 1.2 * rebond(b) : 1;
        c.save();
        const by = Math.max(t.y + t.h + 118, sol - hAuj - 30);
        c.translate(W / 2, by);
        c.rotate(-0.05);
        c.scale(kb, kb);
        c.globalAlpha = sortie(b * 2);
        c.font = `68px ${police}, ${systeme}`;
        const ls = lignes(c, moment.mot.toUpperCase(), W - 180);
        const lb = Math.max(...ls.map((x) => c.measureText(x).width)) + 56;
        const hb = ls.length * 68 + 36;
        c.fillStyle = "#1B0A17";
        arrondi(c, -lb / 2 + 9, -hb + 11, lb, hb, 26);
        c.fill();
        c.fillStyle = m.couleur;
        c.strokeStyle = "#1B0A17";
        c.lineWidth = 6;
        arrondi(c, -lb / 2, -hb, lb, hb, 26);
        c.fill();
        c.stroke();
        c.fillStyle = "#1B0A17";
        c.beginPath();
        c.moveTo(-20, -3);
        c.lineTo(10, -3);
        c.lineTo(-12, 26);
        c.closePath();
        c.fill();
        c.textAlign = "center";
        c.textBaseline = "middle";
        ls.forEach((x, i) => c.fillText(x, 0, -hb + 18 + 34 + i * 68 + 4));
        c.restore();
      }
    }

    // en bas : qui a réagi
    c.textAlign = "center";
    c.textBaseline = "alphabetic";
    c.fillStyle = "#FFF4E6";
    c.font = `800 36px ${systeme}`;
    c.fillText(apres > 0 ? `${m.e} ${P.aReagi(moment.prenom, minute)}` : moment.prenom, W / 2, H - 150);

    // le flash
    if (apres > 0 && apres < 0.35) {
      c.fillStyle = `rgba(255,255,255,${0.95 * (1 - apres / 0.35)})`;
      c.fillRect(-40, -40, W + 80, H + 80);
    }

    // 3. la fin : « Et toi, tu réagis comment ? » et l'adresse
    const f = (s - finale) / 0.3;
    if (f > 0) {
      c.fillStyle = `rgba(27,10,23,${0.82 * sortie(f)})`;
      c.fillRect(-40, -40, W + 80, H + 80);
      c.save();
      c.globalAlpha = sortie(f);
      c.translate(W / 2, H / 2 - 80);
      const kf = 0.85 + 0.15 * rebond(f);
      c.scale(kf, kf);
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillStyle = "#fff";
      c.font = `76px ${police}, ${systeme}`;
      lignes(c, P.etToi.toUpperCase(), W - 120).forEach((x, i, tout) => c.fillText(x, 0, (i - (tout.length - 1) / 2) * 82));
      c.restore();
    }
    c.globalAlpha = 1;
    c.textAlign = "center";
    c.textBaseline = "alphabetic";
    c.font = `800 30px ${systeme}`;
    const al = c.measureText(adresse).width + 48;
    c.fillStyle = "#FF2E9A";
    arrondi(c, (W - al) / 2, H - 112, al, 56, 28);
    c.fill();
    c.fillStyle = "#fff";
    c.fillText(adresse, W / 2, H - 74);
    c.restore();
  };

  dessiner(0);
  const filmee = (toile as HTMLCanvasElement & { captureStream: (ips?: number) => MediaStream }).captureStream(ips);
  // (🎙 sa voix : une piste de son à côté de l'image)
  const flux = dite ? new MediaStream([...filmee.getVideoTracks(), dite.piste]) : filmee;
  const enreg = new MediaRecorder(flux, { mimeType: format, videoBitsPerSecond: debit, ...(dite ? { audioBitsPerSecond: 96_000 } : {}) });
  const morceaux: Blob[] = [];
  enreg.ondataavailable = (x) => x.data.size && morceaux.push(x.data);
  const fin = new Promise<void>((ok) => (enreg.onstop = () => ok()));
  enreg.start(250);
  const debut = performance.now();
  dite?.lancer(arrive);
  await new Promise<void>((ok) => {
    const tour = () => {
      const t = performance.now() - debut;
      dessiner(Math.min(t, ms));
      if (t >= ms) return ok();
      // (l'onglet caché ne dessine plus d'images : on avance quand même)
      if (document.hidden) window.setTimeout(tour, 1000 / ips);
      else requestAnimationFrame(tour);
    };
    requestAnimationFrame(tour);
  });
  enreg.stop();
  flux.getTracks().forEach((x) => x.stop());
  await fin;
  if (!morceaux.length) return null;
  const type = format.split(";")[0];
  const blob = new Blob(morceaux, { type });
  return { fichier: new File([blob], `clikme-moment.${type === "video/mp4" ? "mp4" : "webm"}`, { type }), avecVoix: Boolean(dite) };
}
