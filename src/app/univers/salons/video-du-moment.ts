"use client";

/**
 * 🎬 LA VIDÉO DE 4 SECONDES (les grands moments, lot R5 ; `docs/univers/grands-moments.md`). Pour TikTok et les Reels, une
 * vidéo marche mieux qu'une image : le téléphone la fabrique lui-même, sans serveur (rien à payer). Un canevas 720 × 1280 :
 * la miniature de la vidéo et « à 2:47 », puis ma figurine qui surgit et grandit (l'aura, les rayons du choc), la bulle,
 * les émojis qui jaillissent, l'adresse du moment en bas. Le canevas est filmé (`captureStream` + `MediaRecorder`) :
 * en MP4 quand le téléphone sait le faire (iPhone, Chrome récent), sinon en WebM. Il ne sait pas : pas de vidéo, l'image
 * reste. Jamais de son ajouté.
 */
import { eclatsDuMoment, type Moment } from "@/lib/direct/grands-moments";
import { MOMENT_PARTAGE as MP, PHRASES_MOMENT as P, adresseCourte, minuteDuMoment, type MomentPartage } from "@/lib/direct/moment-partage";

export const VIDEO_MOMENT = { largeur: 720, hauteur: 1280, ms: 4000, ips: 30, debit: 3_000_000 } as const;

const FORMATS = ["video/mp4;codecs=avc1.42E01E", "video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];

/** Le format que ce téléphone sait filmer ("" : il ne sait pas). */
export function formatVideo(): string {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined" || typeof HTMLCanvasElement === "undefined") return "";
  if (typeof (HTMLCanvasElement.prototype as { captureStream?: unknown }).captureStream !== "function") return "";
  return FORMATS.find((f) => MediaRecorder.isTypeSupported?.(f)) ?? "";
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

/** Fabrique la vidéo du moment. `null` : le téléphone ne sait pas, ou une image manque. */
export async function fabriquerVideoDuMoment({ moment, m, police }: { moment: MomentPartage; m: Moment; police: string }): Promise<File | null> {
  const format = formatVideo();
  if (!format) return null;
  const [mini, fig] = await Promise.all([image(`/api/direct/moment/${moment.id}/miniature`), image(`/api/direct/moment/${moment.id}/figurine`)]);
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

  // (la télé en haut, la scène dessous)
  const tl = W - 80;
  const th = Math.round((tl * 9) / 16);
  const tx = 40;
  const ty = 150;
  const sol = H - 230;
  const hFig = 560;

  const dessiner = (ms0: number) => {
    const s = ms0 / 1000;
    c.save();
    // le fond, teinté de l'émotion
    const fond = c.createRadialGradient(W / 2, sol - 200, 40, W / 2, sol - 200, H * 0.75);
    fond.addColorStop(0, `${m.couleur}55`);
    fond.addColorStop(1, "#1B0A17");
    c.fillStyle = "#1B0A17";
    c.fillRect(0, 0, W, H);
    c.fillStyle = fond;
    c.fillRect(0, 0, W, H);
    // la secousse (le choc, la colère)
    if (m.secoue && s > 1 && s < 1.45) c.translate(Math.sin(s * 90) * 9, Math.cos(s * 70) * 5);

    // la marque
    c.fillStyle = "#FFF4E6";
    c.font = `800 40px ${systeme}`;
    c.textAlign = "center";
    c.textBaseline = "alphabetic";
    c.fillText("ClikMe", W / 2, 96);

    // la télé : la miniature, qui s'approche doucement
    c.save();
    arrondi(c, tx, ty, tl, th, 26);
    c.clip();
    c.fillStyle = "#000";
    c.fillRect(tx, ty, tl, th);
    if (mini) {
      const z = 1 + 0.06 * (s / 4);
      const lw = tl * z;
      const lh = th * z;
      c.drawImage(mini, tx - (lw - tl) / 2, ty - (lh - th) / 2, lw, lh);
    }
    // l'assombrissement quand elle prend la scène
    c.fillStyle = `rgba(0,0,0,${0.35 * sortie((s - 0.6) / 0.4)})`;
    c.fillRect(tx, ty, tl, th);
    c.restore();
    // « à 2:47 »
    c.font = `800 30px ${systeme}`;
    const heure = `à ${minute}`;
    const hl = c.measureText(heure).width + 32;
    c.fillStyle = "#FF2E9A";
    arrondi(c, tx + 18, ty + th - 62, hl, 46, 14);
    c.fill();
    c.fillStyle = "#fff";
    c.textAlign = "left";
    c.fillText(heure, tx + 34, ty + th - 28);
    if (titre) {
      c.font = `600 24px ${systeme}`;
      c.fillStyle = "rgba(255,244,230,.75)";
      c.fillText(titre.length > 46 ? `${titre.slice(0, 45)}…` : titre, tx + 4, ty + th + 40);
    }

    // sa figurine : elle surgit à 0,6 s et grandit
    const a = (s - 0.6) / 0.55;
    if (a > 0) {
      const k = 0.25 + 0.75 * rebond(a);
      let dy = 0;
      let rot = 0;
      let kx = 1;
      let ky = 1;
      const g = s - 1.15;
      if (g > 0) {
        if (m.geste === "sautille") {
          dy = -Math.abs(Math.sin(g * 7.5)) * 34;
          rot = Math.sin(g * 7.5) * 0.05;
        }
        else if (m.geste === "saute") dy = -Math.abs(Math.sin(g * 6.3)) * 60;
        else if (m.geste === "flotte") dy = -Math.sin(g * 3.5) * 26;
        else if (m.geste === "bondit" && g < 0.5) kx = ky = 1 + 0.12 * Math.sin(g * Math.PI * 2);
        else if (m.geste === "tremble") c.translate(Math.sin(g * 140) * 7, 0);
        else if (m.geste === "affaisse") {
          ky = 1 - 0.07 * sortie(g / 0.9);
          dy = 14 * sortie(g / 0.9);
        }
      }
      const h = hFig * k;
      const l = (fig.width / fig.height) * h;
      // les rayons (le choc)
      if (m.rayons) {
        c.save();
        c.translate(W / 2, sol - h * 0.45);
        c.rotate(s * 0.9);
        c.globalAlpha = 0.18 * sortie(a);
        c.fillStyle = "#fff";
        for (let i = 0; i < 26; i++) {
          c.beginPath();
          c.moveTo(0, 0);
          c.arc(0, 0, 900, (i / 26) * Math.PI * 2, (i / 26) * Math.PI * 2 + 0.07);
          c.closePath();
          c.fill();
        }
        c.restore();
      }
      // l'aura qui bat
      const pouls = 0.92 + 0.08 * Math.sin(s * 7);
      const aura = c.createRadialGradient(W / 2, sol - h * 0.5, 10, W / 2, sol - h * 0.5, h * 0.75 * pouls);
      aura.addColorStop(0, m.couleur);
      aura.addColorStop(0.55, `${m.couleur}66`);
      aura.addColorStop(1, `${m.couleur}00`);
      c.fillStyle = aura;
      c.globalAlpha = sortie(a);
      c.fillRect(0, sol - h * 1.4, W, h * 1.6);
      c.globalAlpha = 1;
      // elle
      c.save();
      c.translate(W / 2, sol + dy);
      c.rotate(rot);
      c.scale(kx, ky);
      c.shadowColor = m.couleur;
      c.shadowBlur = 30;
      c.drawImage(fig, -l / 2, -h, l, h);
      c.restore();
      // le nuage (la tristesse)
      if (m.nuage && s > 1) {
        c.globalAlpha = sortie((s - 1) / 0.4);
        c.font = `90px ${systeme}`;
        c.textAlign = "center";
        c.fillText(m.nuage, W / 2, sol - h - 10);
        c.globalAlpha = 1;
      }
      // les émojis qui jaillissent
      c.textAlign = "center";
      for (const x of eclats) {
        const p = (ms0 - 1000 - x.retard) / (x.duree + 600);
        if (p <= 0 || p >= 1) continue;
        const q = sortie(p);
        const ex = W / 2 + x.x * 1.1 * q;
        const ey = sol - h * 0.55 + (m.sens === "tombe" ? Math.abs(x.y) * 1.4 * q : x.y * 1.3 * q);
        c.globalAlpha = p < 0.75 ? 1 : 1 - (p - 0.75) / 0.25;
        c.font = `${Math.round(x.taille * 2.3 * (0.4 + 0.6 * q))}px ${systeme}`;
        c.fillText(x.e, ex, ey);
      }
      c.globalAlpha = 1;
      // les confettis
      if (m.confettis) {
        for (let i = 0; i < 40; i++) {
          const p = (ms0 - 1050 - i * 22) / 2200;
          if (p <= 0 || p >= 1) continue;
          const ang = ((i * 137.5) % 360) * (Math.PI / 180);
          const v = 260 + ((i * 53) % 220);
          const cx = W / 2 + Math.cos(ang) * v * p;
          const cy = sol - h * 0.6 + Math.sin(ang) * v * p * 0.7 + 600 * p * p;
          c.save();
          c.translate(cx, cy);
          c.rotate(p * 12 + i);
          c.globalAlpha = 1 - p;
          c.fillStyle = ["#FF2E9A", "#FFD23F", "#3DDC97", "#4C8DFF", "#fff"][i % 5];
          c.fillRect(-6, -10, 12, 20);
          c.restore();
        }
      }
      // la bulle, au-dessus d'elle
      const b = (s - 0.95) / 0.4;
      if (b > 0) {
        const kb = rebond(b);
        c.save();
        const by = Math.max(ty + th + 70, sol - h - 40);
        c.translate(W / 2, by);
        c.rotate(-0.05);
        c.scale(kb, kb);
        c.font = `64px ${police}, ${systeme}`;
        const ls = lignes(c, moment.mot.toUpperCase(), W - 180);
        const lb = Math.max(...ls.map((x) => c.measureText(x).width)) + 56;
        const hb = ls.length * 64 + 36;
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
        ls.forEach((x, i) => c.fillText(x, 0, -hb + 18 + 32 + i * 64 + 4));
        c.restore();
      }
    }

    // en bas : qui, et l'adresse
    c.textAlign = "center";
    c.textBaseline = "alphabetic";
    c.fillStyle = "#FFF4E6";
    c.font = `800 36px ${systeme}`;
    c.fillText(`${m.e} ${P.aReagi(moment.prenom, minute)}`, W / 2, H - 140);
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
  const flux = (toile as HTMLCanvasElement & { captureStream: (ips?: number) => MediaStream }).captureStream(ips);
  const enreg = new MediaRecorder(flux, { mimeType: format, videoBitsPerSecond: debit });
  const morceaux: Blob[] = [];
  enreg.ondataavailable = (x) => x.data.size && morceaux.push(x.data);
  const fin = new Promise<void>((ok) => (enreg.onstop = () => ok()));
  enreg.start(250);
  const debut = performance.now();
  await new Promise<void>((ok) => {
    const image = () => {
      const t = performance.now() - debut;
      dessiner(Math.min(t, ms));
      if (t >= ms) return ok();
      // (l'onglet caché ne dessine plus d'images : on avance quand même)
      if (document.hidden) window.setTimeout(image, 1000 / ips);
      else requestAnimationFrame(image);
    };
    requestAnimationFrame(image);
  });
  enreg.stop();
  flux.getTracks().forEach((x) => x.stop());
  await fin;
  if (!morceaux.length) return null;
  const type = format.split(";")[0];
  const blob = new Blob(morceaux, { type });
  return new File([blob], `clikme-moment.${type === "video/mp4" ? "mp4" : "webm"}`, { type });
}
