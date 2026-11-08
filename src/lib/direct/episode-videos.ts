/**
 * 🎞️ L'ÉPISODE, À PARTIR DE SES VIDÉOS DÉJÀ TOURNÉES — 8 novembre 2026, le propriétaire : « quand je clique sur “en
 * épisode”, je n'ai que l'option de placer mon portable ; je voudrais pouvoir déposer une ou plusieurs vidéos que j'ai
 * déjà prises, pour qu'il en fasse mon épisode […] avoir le meilleur des moments de ces vidéos en un seul épisode ».
 *
 * Ses vidéos, mises bout à bout dans l'ordre de sa fabrication, font une SESSION comme celle du téléphone posé : le
 * montage (`episode-montage.ts`) reçoit le même `Tournage` et n'y voit aucune différence. En deux passes :
 *
 *   1. REGARDER, EN ACCÉLÉRÉ (×4, sans le son) : quatre fois par seconde DE VIDÉO, l'image minuscule qui dit ce qui
 *      bouge et la lumière — les mêmes mesures et la même note que la session (`noter`), le son en moins (on ne
 *      l'entend pas en accéléré) —, et les images de l'accéléré. La réserve (`Reserve`) garde les meilleurs morceaux,
 *      répartis sur toutes ses vidéos, et toujours le dernier : la fin de sa dernière vidéo, son produit fini ;
 *   2. DÉCOUPER, EN VRAI (×1, avec son son) : seulement les morceaux que les films prendront (`morceauxADecouper`) —
 *      chacun devient un petit fichier, comme un morceau de session (la vidéo dessinée dans une toile, son son pris
 *      par le mixeur, enregistrés ensemble).
 *
 * Ses vidéos ne quittent jamais le téléphone, et ne sont jamais chargées en entier en mémoire : le navigateur les lit
 * là où elles sont.
 *
 * LE SON SUR UN IPHONE : une vidéo ne joue avec son son que si un geste l'a lancée. `preparerLecteurs` se fait donc
 * DANS le toucher « Faire mon épisode » (chaque lecteur part et s'arrête aussitôt, son son pris par le mixeur, qui ne
 * sort pas dans le haut-parleur) ; si le téléphone refuse quand même, le morceau se découpe sans son.
 *
 * FICHIER NAVIGATEUR.
 */
import { formatVideo } from "@/lib/direct/interview-montage";
import { Accelere, MORCEAU_S, Reserve, fenetresDe, mesurer, mesuresVides, morceauxADecouper, noter, type Mesures, type MorceauNote } from "@/lib/direct/episode";
import type { ImageFilmee, MorceauFilme, Tournage } from "@/lib/direct/episode-session";

/** Ce qu'on sait d'une vidéo déposée : sa durée, et une petite image (une adresse à rendre avec `URL.revokeObjectURL`). */
export type InfoVideo = { duree: number; affiche: string; erreur?: string };
/** Un lecteur par vidéo, préparé dans le geste du doigt. */
export type Lecteurs = { liste: { v: HTMLVideoElement; url: string; son: MediaStreamAudioDestinationNode | null }[]; liberer: () => void };

/** La vitesse de la première passe. */
const VITESSE = 4;
/** Une mesure tous les quarts de seconde DE VIDÉO : comme la session (`episode-session.ts`), la note veut dire la même chose. */
const PAS_MESURE = 0.25;
const SONDE = { w: 32, h: 56 };
const IMAGE = { cote: 800, qualite: 0.72 };
/** Les morceaux découpés : la même taille que l'image du montage, assez pour une vidéo 720 × 1280. */
const DECOUPE = { cote: 1280, debit: 4_000_000 };

const attendre = (ms: number) => new Promise<void>((ok) => setTimeout(ok, ms));
const pair = (x: number) => Math.max(2, Math.round(x / 2) * 2);

/** Un événement d'un lecteur, ou rien au bout de `ms` (un téléphone qui ne répond pas ne bloque pas tout). */
function evenement(v: HTMLVideoElement, nom: string, ms: number): Promise<boolean> {
  return new Promise((ok) => {
    const t = setTimeout(() => {
      v.removeEventListener(nom, fait);
      ok(false);
    }, ms);
    const fait = () => {
      clearTimeout(t);
      ok(true);
    };
    v.addEventListener(nom, fait, { once: true });
  });
}

async function chercher(v: HTMLVideoElement, t: number): Promise<void> {
  if (Math.abs(v.currentTime - t) < 0.02) return;
  const p = evenement(v, "seeked", 3000);
  try {
    v.currentTime = t;
  } catch {
    return;
  }
  await p;
}

function lecteur(url: string, muet: boolean): HTMLVideoElement {
  const v = document.createElement("video");
  v.muted = muet;
  v.playsInline = true;
  v.preload = "auto";
  v.setAttribute("playsinline", "");
  v.src = url;
  return v;
}

/** Sa durée (une vidéo enregistrée par un navigateur ne la dit pas toujours : on va au bout pour la lire). */
async function dureeDe(v: HTMLVideoElement): Promise<number> {
  if (Number.isFinite(v.duration) && v.duration > 0) return v.duration;
  const p = evenement(v, "durationchange", 4000);
  try {
    v.currentTime = 1e9;
  } catch {
    return 0;
  }
  await p;
  const d = Number.isFinite(v.duration) ? v.duration : 0;
  await chercher(v, 0);
  return d;
}

/** 🎞️ Une vidéo déposée : sa durée, et sa petite image (prise vers la première seconde). */
export async function lireVideo(f: File): Promise<InfoVideo> {
  const url = URL.createObjectURL(f);
  const v = lecteur(url, true);
  try {
    if (!(await evenement(v, "loadedmetadata", 15_000))) return { duree: 0, affiche: "", erreur: "Cette vidéo ne se lit pas sur ce téléphone." };
    const duree = await dureeDe(v);
    if (!duree) return { duree: 0, affiche: "", erreur: "Cette vidéo ne se lit pas sur ce téléphone." };
    await chercher(v, Math.min(1, duree / 2));
    if (v.readyState < 2) await evenement(v, "loadeddata", 4000);
    let affiche = "";
    if (v.videoWidth && v.videoHeight) {
      const c = document.createElement("canvas");
      const k = 220 / Math.max(v.videoWidth, v.videoHeight);
      c.width = Math.max(1, Math.round(v.videoWidth * k));
      c.height = Math.max(1, Math.round(v.videoHeight * k));
      c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
      const b = await new Promise<Blob | null>((ok) => c.toBlob(ok, "image/jpeg", 0.7));
      if (b) affiche = URL.createObjectURL(b);
    }
    return { duree, affiche };
  } catch {
    return { duree: 0, affiche: "", erreur: "Cette vidéo ne se lit pas sur ce téléphone." };
  } finally {
    v.removeAttribute("src");
    v.load();
    URL.revokeObjectURL(url);
  }
}

/**
 * LES LECTEURS, DANS LE GESTE DU DOIGT (avant tout `await`) : un par vidéo, son son branché sur le mixeur (pas sur le
 * haut-parleur), lancé et arrêté aussitôt — après ça, le téléphone le laisse jouer avec son son.
 */
export function preparerLecteurs(fichiers: File[], ctx: AudioContext): Lecteurs {
  const liste = fichiers.map((f) => {
    const url = URL.createObjectURL(f);
    const v = lecteur(url, false);
    let son: MediaStreamAudioDestinationNode | null = null;
    try {
      const source = ctx.createMediaElementSource(v);
      son = ctx.createMediaStreamDestination();
      source.connect(son);
    } catch {
      son = null;
      v.muted = true;
    }
    void v
      .play()
      .then(() => v.pause())
      .catch(() => undefined);
    return { v, url, son };
  });
  return {
    liste,
    liberer: () => {
      for (const l of liste) {
        try {
          l.v.pause();
          l.v.removeAttribute("src");
          l.v.load();
        } catch {
          /* déjà parti */
        }
        URL.revokeObjectURL(l.url);
      }
    },
  };
}

/** L'image de la vidéo, entière, au milieu de la toile de l'aperçu (ce qu'il voit pendant qu'on regarde ses vidéos). */
function montrer(apercu: HTMLCanvasElement | null | undefined, v: HTMLVideoElement) {
  if (!apercu || !v.videoWidth) return;
  const g = apercu.getContext("2d");
  if (!g) return;
  if (apercu.width !== 720 || apercu.height !== 1280) {
    apercu.width = 720;
    apercu.height = 1280;
  }
  g.fillStyle = "#140C09";
  g.fillRect(0, 0, 720, 1280);
  const k = Math.min(720 / v.videoWidth, 1280 / v.videoHeight);
  const w = v.videoWidth * k;
  const h = v.videoHeight * k;
  g.drawImage(v, (720 - w) / 2, (1280 - h) / 2, w, h);
}

type Fenetre = MorceauNote & { video: number; de: number };

/**
 * 1. REGARDER UNE VIDÉO, EN ACCÉLÉRÉ : les mesures de chacun de ses morceaux, et les images de l'accéléré (aux
 * instants de la session : `decalage` + l'instant dans la vidéo). Sans le son.
 */
async function regarder(o: {
  v: HTMLVideoElement;
  duree: number;
  decalage: number;
  accelere: Accelere<ImageFilmee>;
  apercu?: HTMLCanvasElement | null;
  surAvance: (t: number) => void;
  signal?: AbortSignal;
}): Promise<Mesures[]> {
  const { v, duree } = o;
  const fenetres = fenetresDe(duree);
  const mesures: Mesures[] = fenetres.map(() => mesuresVides());
  const sonde = document.createElement("canvas");
  sonde.width = SONDE.w;
  sonde.height = SONDE.h;
  const g = sonde.getContext("2d", { willReadFrequently: true });
  const image = document.createElement("canvas");
  let precedente: Uint8ClampedArray | null = null;
  let tPrecedent = 0;
  let prochain = 0;
  let montre = 0;

  const echantillonner = (t: number) => {
    if (!g || !v.videoWidth || t + 1e-3 < prochain) return;
    prochain = Math.floor(t / PAS_MESURE) * PAS_MESURE + PAS_MESURE;
    try {
      g.drawImage(v, 0, 0, SONDE.w, SONDE.h);
      const d = g.getImageData(0, 0, SONDE.w, SONDE.h).data;
      const l = new Uint8ClampedArray(SONDE.w * SONDE.h);
      let lum = 0;
      let diff = 0;
      for (let i = 0, j = 0; i < d.length; i += 4, j++) {
        l[j] = (d[i] * 3 + d[i + 1] * 6 + d[i + 2]) / 10;
        lum += l[j];
        if (precedente) diff += Math.abs(l[j] - precedente[j]);
      }
      // (des images plus espacées qu'un quart de seconde bougent plus : on ramène leur écart à un quart de seconde)
      const ecart = t - tPrecedent;
      const mouvement = precedente ? (diff / l.length) * (ecart > PAS_MESURE * 1.2 ? (PAS_MESURE / ecart) : 1) : 0;
      precedente = l;
      tPrecedent = t;
      const k = Math.floor(t / MORCEAU_S);
      if (k < mesures.length) mesures[k] = mesurer(mesures[k], mouvement, lum / l.length, -90);
    } catch {
      return;
    }
    const ts = o.decalage + t;
    if (o.accelere.aPrendre(ts)) {
      const k = IMAGE.cote / Math.max(v.videoWidth, v.videoHeight, 1);
      image.width = Math.max(1, Math.round(v.videoWidth * k));
      image.height = Math.max(1, Math.round(v.videoHeight * k));
      const ig = image.getContext("2d");
      if (ig) {
        ig.drawImage(v, 0, 0, image.width, image.height);
        image.toBlob((b) => b && o.accelere.ajouter({ t: ts, blob: b }), "image/jpeg", IMAGE.qualite);
      }
    }
    const maintenant = performance.now();
    if (maintenant - montre > 120) {
      montre = maintenant;
      montrer(o.apercu, v);
    }
  };

  /** Si la lecture accélérée ne part pas (un vieux téléphone) : image par image, en cherchant. */
  const pasAPas = async () => {
    v.pause();
    for (let t = Math.max(prochain, 0); t < duree; t += PAS_MESURE * 2) {
      if (o.signal?.aborted) throw new Error("Interrompu.");
      await chercher(v, t);
      echantillonner(t);
      o.surAvance(t);
    }
  };

  v.muted = true;
  await chercher(v, 0);
  v.playbackRate = VITESSE;
  let lance = true;
  try {
    await v.play();
  } catch {
    lance = false;
  }
  if (!lance) {
    await pasAPas();
    return mesures;
  }
  await new Promise<void>((ok, ko) => {
    let fini = false;
    let immobile = 0;
    let dernier = -1;
    const rvfc = (v as HTMLVideoElement & { requestVideoFrameCallback?: (f: (now: number, m: { mediaTime: number }) => void) => number }).requestVideoFrameCallback?.bind(v);
    let minuterie: ReturnType<typeof setInterval> | null = null;
    const finir = (e?: Error) => {
      if (fini) return;
      fini = true;
      clearInterval(garde);
      if (minuterie) clearInterval(minuterie);
      v.pause();
      if (e) ko(e);
      else ok();
    };
    if (rvfc) {
      const boucle = (_n: number, m: { mediaTime: number }) => {
        if (fini) return;
        echantillonner(Number.isFinite(m?.mediaTime) ? m.mediaTime : v.currentTime);
        rvfc(boucle);
      };
      rvfc(boucle);
    } else {
      minuterie = setInterval(() => echantillonner(v.currentTime), 30);
    }
    v.addEventListener("ended", () => finir(), { once: true });
    const garde = setInterval(() => {
      if (o.signal?.aborted) return finir(new Error("Interrompu."));
      o.surAvance(v.currentTime);
      if (v.ended || v.currentTime >= duree - 0.05) return finir();
      immobile = Math.abs(v.currentTime - dernier) < 0.01 ? immobile + 1 : 0;
      dernier = v.currentTime;
      // la lecture s'est figée (cinq secondes sans avancer) : on finit image par image
      if (immobile >= 20) {
        fini = true;
        clearInterval(garde);
        if (minuterie) clearInterval(minuterie);
        pasAPas().then(ok, ko);
      }
    }, 250);
  });
  v.playbackRate = 1;
  return mesures;
}

/**
 * 2. DÉCOUPER UN MORCEAU, EN VRAI : de `de` à `de + duree`, la vidéo dessinée dans une toile, son son (s'il passe)
 * avec, enregistrés ensemble — un petit fichier, comme un morceau de session.
 */
async function decouper(o: {
  v: HTMLVideoElement;
  son: MediaStreamAudioDestinationNode | null;
  de: number;
  duree: number;
  type: string;
  apercu?: HTMLCanvasElement | null;
  signal?: AbortSignal;
}): Promise<{ blob: Blob; duree: number; type: string } | null> {
  const { v } = o;
  if (!v.videoWidth) await evenement(v, "loadeddata", 5000);
  if (!v.videoWidth) return null;
  const k = Math.min(1, DECOUPE.cote / Math.max(v.videoWidth, v.videoHeight));
  const toile = document.createElement("canvas");
  toile.width = pair(v.videoWidth * k);
  toile.height = pair(v.videoHeight * k);
  const g = toile.getContext("2d");
  if (!g || typeof toile.captureStream !== "function") return null;
  v.pause();
  v.playbackRate = 1;
  await chercher(v, o.de);
  g.drawImage(v, 0, 0, toile.width, toile.height);
  const pistes = [...toile.captureStream(30).getVideoTracks(), ...(o.son && !v.muted ? o.son.stream.getAudioTracks() : [])];
  const flux = new MediaStream(pistes);
  let rec: MediaRecorder;
  try {
    rec = new MediaRecorder(flux, { ...(o.type ? { mimeType: o.type } : {}), videoBitsPerSecond: DECOUPE.debit, audioBitsPerSecond: 96_000 });
  } catch {
    rec = new MediaRecorder(flux);
  }
  const bouts: Blob[] = [];
  const type = rec.mimeType || o.type || "video/webm";
  const ferme = new Promise<Blob>((ok) => {
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size) bouts.push(e.data);
    };
    rec.onstop = () => ok(new Blob(bouts, { type }));
  });
  rec.start();
  try {
    await v.play();
  } catch {
    // le téléphone refuse le son sans geste : le morceau, sans son
    v.muted = true;
    await v.play().catch(() => undefined);
  }
  const fin = o.de + o.duree;
  await new Promise<void>((ok) => {
    let fait = false;
    const finir = () => {
      if (fait) return;
      fait = true;
      clearTimeout(garde);
      ok();
    };
    const garde = setTimeout(finir, o.duree * 1000 + 6000);
    const dessiner = () => {
      if (fait) return;
      try {
        g.drawImage(v, 0, 0, toile.width, toile.height);
      } catch {
        /* image pas prête */
      }
      montrer(o.apercu, v);
      if (o.signal?.aborted || v.ended || v.paused || v.currentTime >= fin) return finir();
      requestAnimationFrame(dessiner);
    };
    requestAnimationFrame(dessiner);
  });
  const joue = Math.max(0, Math.min(o.duree, v.currentTime - o.de));
  v.pause();
  try {
    if (rec.state !== "inactive") rec.stop();
  } catch {
    /* déjà arrêté */
  }
  // (comme en session : trois secondes au plus pour rendre le fichier)
  const blob = await Promise.race([ferme, attendre(3000).then(() => new Blob(bouts, { type }))]);
  if (o.signal?.aborted) throw new Error("Interrompu.");
  return blob.size > 2000 && joue >= 1.2 ? { blob, duree: joue, type } : null;
}

/**
 * 🎬 SES VIDÉOS → UN TOURNAGE : regarder chacune en accéléré, garder les meilleurs morceaux, découper ceux que les
 * films prendront. `videos` : dans l'ordre de sa fabrication, avec leur durée (`lireVideo`) ; `lecteurs` : préparés
 * dans le geste (`preparerLecteurs`), dans le même ordre ; `plansReel` : les gestes de son Reel (`REEL.plansMax`).
 */
export async function tournageDesVideos(o: {
  videos: { duree: number }[];
  lecteurs: Lecteurs;
  plansReel: number;
  apercu?: HTMLCanvasElement | null;
  surEtape?: (mot: string, p: number) => void;
  signal?: AbortSignal;
}): Promise<Tournage> {
  const total = o.videos.reduce((s, x) => s + x.duree, 0);
  const accelere = new Accelere<ImageFilmee>();
  const reserve = new Reserve<Fenetre>();
  let decalage = 0;
  let n = 0;

  // 1. REGARDER : la moitié de la barre
  for (let i = 0; i < o.videos.length; i++) {
    if (o.signal?.aborted) throw new Error("Interrompu.");
    const { duree } = o.videos[i];
    const v = o.lecteurs.liste[i].v;
    const mot = o.videos.length > 1 ? `Je regarde tes vidéos en accéléré… ${i + 1}/${o.videos.length}` : "Je regarde ta vidéo en accéléré…";
    const avant = decalage;
    o.surEtape?.(mot, (avant / Math.max(1, total)) * 0.5);
    const mesures = await regarder({
      v,
      duree,
      decalage,
      accelere,
      apercu: o.apercu,
      signal: o.signal,
      surAvance: (t) => o.surEtape?.(mot, ((avant + Math.min(t, duree)) / Math.max(1, total)) * 0.5),
    });
    fenetresDe(duree).forEach((f, k) => reserve.ajouter({ n: n++, debut: decalage + f.de, duree: f.duree, score: noter(mesures[k]), video: i, de: f.de }));
    decalage += duree;
  }
  const gardes = reserve.liste();
  // (les images de l'accéléré arrivent un peu après leur instant : on leur laisse le temps)
  await attendre(300);
  const images = [...accelere.images].sort((a, b) => a.t - b.t);

  // 2. DÉCOUPER : seulement ce que les films prendront
  const ks = morceauxADecouper({ morceaux: gardes, images: images.map((x) => x.t), session: total, plansReel: o.plansReel });
  const type = formatVideo();
  const morceaux: MorceauFilme[] = [];
  for (let j = 0; j < ks.length; j++) {
    if (o.signal?.aborted) throw new Error("Interrompu.");
    const m = gardes[ks[j]];
    o.surEtape?.(`Je garde tes meilleurs moments… ${j + 1}/${ks.length}`, 0.5 + (j / ks.length) * 0.5);
    const l = o.lecteurs.liste[m.video];
    const d = await decouper({ v: l.v, son: l.son, de: m.de, duree: m.duree, type, apercu: o.apercu, signal: o.signal });
    if (d) morceaux.push({ n: morceaux.length, debut: m.debut, duree: d.duree, score: m.score, blob: d.blob, type: d.type });
  }
  o.surEtape?.("Tes meilleurs moments sont prêts.", 1);
  return { morceaux, images, duree: total, type: type || "video/webm" };
}
