/**
 * 📣 L'EXTRAIT DE 8 SECONDES POUR SES PARTENAIRES — la diffusion croisée (`diffusion.ts`) : chez ses deux partenaires,
 * pas tout le film (21 à 25 s, une publicité qui s'impose), mais huit secondes bien faites, « une découverte locale
 * qui a du sens » — avec le nom de son commerce et l'adresse pour voir le film entier.
 *
 * LE SERVEUR NE DÉCOUPE PAS DE VIDÉO : c'est le téléphone, comme pour la bande-annonce d'un épisode. Il REJOUE le film
 * qu'il vient de monter (le blob, déjà là) et en enregistre huit secondes :
 *   · 0 → 6,4 s : le film à partir de `debut` (l'accroche et ses titres, puis ses premiers moments), avec en haut
 *     « 📣 Découverte du quartier » et en bas le nom de son commerce ;
 *   · 6,4 → 8 s : la carte de fin — son nom, « Le film entier sur sa page », son adresse (clikme.fr/b/…).
 * Le son est celui du film (sa musique), qui s'éteint doucement à la fin.
 *
 * Huit secondes de plus au moment de publier, et seulement s'il est dans le réseau de diffusion.
 *
 * POUR TOUS SES FILMS : le Studio (`monterExtrait`, sa toile et ses polices), l'interview et l'épisode
 * (`extraitPourPartenaires` : sa toile et les polices du Studio, à lui).
 *
 * LE SON EST DÉCODÉ DU FICHIER (`decodeAudioData`), la vidéo se rejoue MUETTE : un iPhone laisse toujours jouer une
 * vidéo muette, pas une vidéo qui parle hors d'un geste. Le contexte du son, lui, naît au toucher (`ouvrirSon`).
 */
import { formatVideo } from "./interview-montage";
import { LARGEUR_STUDIO, HAUTEUR_STUDIO, chargerStudio, type FilmStudio } from "./studio-montage";

export const DUREE_EXTRAIT = 8;
const PART_DU_FILM = 6.4;
const FONDU = 0.35;
const W = LARGEUR_STUDIO;
const H = HAUTEUR_STUDIO;

const borne = (x: number) => Math.max(0, Math.min(1, x));
const doux = (x: number) => {
  const t = borne(x);
  return t * t * (3 - 2 * t);
};

/** Le texte sur deux lignes au plus, à la largeur donnée. */
function enLignes(g: CanvasRenderingContext2D, texte: string, largeur: number): string[] {
  const mots = texte.split(/\s+/).filter(Boolean);
  const lignes: string[] = [];
  let ligne = "";
  for (const m of mots) {
    const essai = ligne ? `${ligne} ${m}` : m;
    if (g.measureText(essai).width <= largeur || !ligne) ligne = essai;
    else {
      lignes.push(ligne);
      ligne = m;
    }
  }
  if (ligne) lignes.push(ligne);
  return lignes.length > 2 ? [lignes[0], `${lignes.slice(1).join(" ").slice(0, 28)}…`] : lignes;
}

function pilule(g: CanvasRenderingContext2D, texte: string, cx: number, y: number, police: string, a: number) {
  g.save();
  g.globalAlpha = a;
  g.font = police;
  const l = g.measureText(texte).width + 44;
  const h = 58;
  const x = cx - l / 2;
  g.fillStyle = "rgba(255,255,255,0.93)";
  g.shadowColor = "rgba(60,10,30,0.25)";
  g.shadowBlur = 18;
  g.beginPath();
  g.roundRect(x, y, l, h, h / 2);
  g.fill();
  g.shadowBlur = 0;
  g.fillStyle = "#2B1A22";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(texte, cx, y + h / 2 + 1);
  g.restore();
}

/** La vidéo, couvrant toute la toile. */
function couvrir(g: CanvasRenderingContext2D, v: HTMLVideoElement) {
  const iw = v.videoWidth || W;
  const ih = v.videoHeight || H;
  const k = Math.max(W / iw, H / ih);
  g.drawImage(v, (W - iw * k) / 2, (H - ih * k) / 2, iw * k, ih * k);
}

/** La carte de fin : son nom, et où voir le film entier. */
function carteDeFin(g: CanvasRenderingContext2D, o: { commerce: string; adresse: string; serif: string; sans: string; logo?: HTMLImageElement | null }, t: number) {
  const fond = g.createLinearGradient(0, 0, 0, H);
  fond.addColorStop(0, "#FFF1F4");
  fond.addColorStop(1, "#F6CAD7");
  g.fillStyle = fond;
  g.fillRect(0, 0, W, H);
  const a = doux(t / 0.4);
  g.save();
  g.globalAlpha = a;
  g.textAlign = "center";
  g.textBaseline = "alphabetic";
  if (o.logo) {
    const lh = 120;
    const lw = (lh * o.logo.naturalWidth) / Math.max(1, o.logo.naturalHeight);
    g.drawImage(o.logo, (W - lw) / 2, 330, lw, lh);
  }
  g.fillStyle = "#B0306A";
  g.font = `700 26px ${o.sans}`;
  g.fillText("DÉCOUVERTE DU QUARTIER", W / 2, 520);
  g.fillStyle = "#2B1A22";
  g.font = `italic 600 66px ${o.serif}`;
  const lignes = enLignes(g, o.commerce, W - 110);
  lignes.forEach((l, k) => g.fillText(l, W / 2, 620 + k * 76));
  const y = 620 + lignes.length * 76 + 40;
  g.font = `500 30px ${o.sans}`;
  g.fillStyle = "#5A3A47";
  g.fillText("Le film entier sur sa page", W / 2, y);
  g.font = `700 32px ${o.sans}`;
  g.fillStyle = "#FF2E9A";
  g.fillText(o.adresse, W / 2, y + 52);
  g.restore();
}

/**
 * HUIT SECONDES DU FILM, POUR SES PARTENAIRES. `debut` : où commencer dans le film (après l'intro de la figurine).
 * `toile` : une toile de la page (elle s'enregistre comme le film). Rend l'extrait, au même format que le film.
 */
export async function monterExtrait(o: {
  ctx: AudioContext;
  film: { blob: Blob; type: string; duree: number; affiche?: string };
  debut: number;
  commerce: string;
  /** « clikme.fr/b/boulangerie-martin » : où voir le film entier. */
  adresse: string;
  serif: string;
  sans: string;
  logo?: HTMLImageElement | null;
  toile: HTMLCanvasElement;
  signal?: AbortSignal;
}): Promise<FilmStudio> {
  if (typeof o.toile.captureStream !== "function") throw new Error("Ce téléphone ne sait pas enregistrer un dessin animé (captureStream).");
  o.toile.width = W;
  o.toile.height = H;
  const g = o.toile.getContext("2d");
  if (!g) throw new Error("Ce téléphone ne sait pas dessiner la vidéo.");

  // LE FILM, REJOUÉ MUET : son image sur la toile ; son son, décodé du fichier, vers l'enregistrement
  const url = URL.createObjectURL(o.film.blob);
  const v = document.createElement("video");
  v.playsInline = true;
  v.muted = true;
  v.preload = "auto";
  v.src = url;
  await new Promise<void>((ok, ko) => {
    v.onloadedmetadata = () => ok();
    v.onerror = () => ko(new Error("Le film ne se rejoue pas."));
  });
  const debut = Math.max(0, Math.min(o.debut, Math.max(0, (Number.isFinite(v.duration) ? v.duration : o.film.duree) - PART_DU_FILM - 0.2)));
  await new Promise<void>((ok) => {
    v.onseeked = () => ok();
    v.currentTime = debut;
  });
  const enregistree = o.ctx.createMediaStreamDestination();
  const volume = o.ctx.createGain();
  volume.connect(enregistree);
  let musique: AudioBufferSourceNode | null = null;
  try {
    const decode = await o.ctx.decodeAudioData(await o.film.blob.arrayBuffer());
    musique = o.ctx.createBufferSource();
    musique.buffer = decode;
    musique.connect(volume);
  } catch {
    /* pas de son lisible : l'extrait part muet */
  }
  if (o.ctx.state !== "running") await o.ctx.resume().catch(() => {});

  const format = formatVideo();
  const flux = new MediaStream([...o.toile.captureStream(30).getVideoTracks(), ...enregistree.stream.getAudioTracks()]);
  const rec = new MediaRecorder(flux, { ...(format ? { mimeType: format } : {}), videoBitsPerSecond: 5_000_000, audioBitsPerSecond: 128_000 });
  const morceaux: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data.size) morceaux.push(e.data);
  };
  const arret = new Promise<void>((ok) => (rec.onstop = () => ok()));

  couvrir(g, v);
  const police = `600 28px ${o.sans}`;
  try {
    await v.play();
    musique?.start(0, debut);
    rec.start(250);
    const t0 = performance.now();
    await new Promise<void>((ok, ko) => {
      const image = () => {
        if (o.signal?.aborted) {
          ko(new DOMException("Montage arrêté", "AbortError"));
          return;
        }
        const t = (performance.now() - t0) / 1000;
        // le son s'éteint doucement sur la dernière seconde
        volume.gain.value = 1 - doux((t - (DUREE_EXTRAIT - 1)) / 0.9);
        if (t < PART_DU_FILM + FONDU) {
          couvrir(g, v);
          // en haut, la découverte ; en bas, son nom
          pilule(g, "📣 Découverte du quartier", W / 2, 70, police, doux((t - 0.15) / 0.35));
          const a = doux((t - 0.5) / 0.4);
          if (a > 0) {
            g.save();
            const voile = g.createLinearGradient(0, H - 330, 0, H);
            voile.addColorStop(0, "rgba(20,8,14,0)");
            voile.addColorStop(1, `rgba(20,8,14,${0.62 * a})`);
            g.fillStyle = voile;
            g.fillRect(0, H - 330, W, 330);
            g.globalAlpha = a;
            g.fillStyle = "#FFFFFF";
            g.textAlign = "center";
            g.font = `italic 600 54px ${o.serif}`;
            const lignes = enLignes(g, o.commerce, W - 90);
            lignes.forEach((l, k) => g.fillText(l, W / 2, H - 110 - (lignes.length - 1 - k) * 62));
            g.font = `500 24px ${o.sans}`;
            g.fillStyle = "rgba(255,255,255,0.86)";
            g.fillText("tout près de chez vous", W / 2, H - 62);
            g.restore();
          }
        }
        if (t >= PART_DU_FILM) {
          // LE FONDU VERS LA CARTE DE FIN
          const k = doux((t - PART_DU_FILM) / FONDU);
          g.save();
          g.globalAlpha = k;
          carteDeFin(g, o, t - PART_DU_FILM);
          g.restore();
          if (t >= PART_DU_FILM + FONDU && !v.paused) v.pause();
        }
        if (t >= DUREE_EXTRAIT) ok();
        else requestAnimationFrame(image);
      };
      requestAnimationFrame(image);
    });
  } finally {
    v.pause();
    try {
      musique?.stop();
    } catch {
      /* déjà fini */
    }
    if (rec.state !== "inactive") rec.stop();
    URL.revokeObjectURL(url);
    v.removeAttribute("src");
  }
  await arret;
  const type = rec.mimeType || format || "video/webm";
  return { blob: new Blob(morceaux, { type }), type, duree: DUREE_EXTRAIT, affiche: o.film.affiche ?? "" };
}

/** Le contexte du son, ouvert AU TOUCHER (avant toute attente) : sans geste, un iPhone le garde muet. */
export function ouvrirSon(): AudioContext | null {
  try {
    const ctx = new AudioContext();
    void ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

/**
 * L'EXTRAIT D'UNE INTERVIEW OU D'UN ÉPISODE : sa propre toile (cachée, mais dans la page : elle s'enregistre comme une
 * autre), les polices et le fantôme du Studio. `debut` : où commencer (0 : le début de ce qu'on lui donne — le Reel du
 * jour, la bande-annonce, déjà resserrés). Rend `null` si le téléphone n'y arrive pas : ses partenaires recevront le
 * film entier.
 */
export async function extraitPourPartenaires(
  film: { blob: Blob; type: string; duree: number },
  o: { ctx: AudioContext | null; commerce: string; adresse: string; debut?: number },
): Promise<{ blob: Blob; type: string; duree: number } | null> {
  if (!o.ctx || typeof document === "undefined") return null;
  const toile = document.createElement("canvas");
  toile.setAttribute("aria-hidden", "true");
  toile.style.cssText = "position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none;";
  document.body.appendChild(toile);
  try {
    const el = await chargerStudio(null);
    const e = await monterExtrait({ ctx: o.ctx, film, debut: o.debut ?? 0, commerce: o.commerce, adresse: o.adresse, serif: el.serif, sans: el.sans, logo: el.fantome, toile });
    return { blob: e.blob, type: e.type, duree: e.duree };
  } catch (e) {
    console.warn("[extrait] impossible :", String((e as Error)?.message ?? e));
    return null;
  } finally {
    toile.remove();
  }
}
