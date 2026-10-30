/**
 * 🎞️ LE MONTAGE DU REEL DU JOUR — joué une fois et enregistré, comme l'interview (`interview-montage.ts`),
 * juste après elle, des mêmes prises : une dizaine de secondes de plus sous ses yeux.
 *
 * Le son de sa phrase vient du fichier décodé de sa prise (pas du lecteur : sur iPhone, un lecteur ne joue
 * un son qu'après un toucher) ; l'image vient d'un lecteur muet, calé sur le début de sa phrase.
 *
 * FICHIER NAVIGATEUR.
 */
import { DEBIT_SON, debitDuMontage, enteteArdoise } from "./interview-fantome";
import { formatVideo, lecteurMuet } from "./interview-montage";
import {
  HAUTEUR as H,
  LARGEUR as W,
  borne,
  bruitBlanc,
  fabriquerFondCarte,
  fabriquerGrain,
  reverbe,
  sonCarte,
  sonClic,
  sonSignature,
  sonTampon,
  sonZoom,
  type Polices,
  type SortieSon,
} from "./interview-signature";
import type { FamilleVideo } from "./famille";
import type { ImagesFamille } from "./famille-video";
import { appelDuReel, dureeDuReel, type PhraseDuReel } from "./reel-du-jour";
import { chargerCageDoree, dessinerReel, morceauxDuReel, tempsDuReel, type ImagesReel, type SceneReel } from "./reel-dessin";

const IPS = 30;
export type Reel = { blob: Blob; type: string; duree: number; affiche: string };

function image(src: string): Promise<HTMLImageElement | null> {
  return new Promise((ok) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => ok(null);
    i.src = src;
  });
}

export async function monterReel(o: {
  ctx: AudioContext;
  toile: HTMLCanvasElement;
  police: Polices;
  musique: AudioBuffer | null;
  /** La photo du jour : l'accroche. */
  photo: string | null;
  /** Sa phrase (`phraseDuReel`), et la prise d'où elle vient : sa vidéo (`null` s'il ne se montre pas) et son son. */
  phrase: PhraseDuReel | null;
  prise: { url: string | null; audio: AudioBuffer | null } | null;
  plat: string;
  prix: string;
  commerce: string;
  ville: string;
  /** « Ce midi », « Aujourd'hui » (le `quand` de son script). */
  quand: string;
  /** Sa famille : le vrai stock de la cage dorée, son lien, son fantôme. */
  famille: { d: FamilleVideo; im: ImagesFamille } | null;
  /** « Écris FANTÔME en commentaire » : seulement si l'envoi automatique du lien est branché sur son compte. */
  motCle?: string | null;
  ecouter: boolean;
  surProgres?: (p: number) => void;
  signal?: AbortSignal;
}): Promise<Reel> {
  const { ctx } = o;
  const c2d = o.toile.getContext("2d");
  if (!c2d) throw new Error("Ce téléphone ne sait pas dessiner la vidéo.");
  if (typeof o.toile.captureStream !== "function") throw new Error("Ce téléphone ne sait pas enregistrer un dessin animé (captureStream).");
  o.toile.width = W;
  o.toile.height = H;
  // SA PHRASE SANS SON SON NE SE JOUE PAS : le Reel se fait alors sur sa photo seule
  const phrase = o.phrase && o.prise?.audio ? o.phrase : null;

  /* ─── les images ─── */
  const [photo, cage, video] = await Promise.all([
    o.photo ? image(o.photo) : Promise.resolve(null),
    chargerCageDoree(),
    phrase && o.prise?.url ? lecteurMuet(o.prise.url) : Promise.resolve(null),
  ]);
  // SA VIDÉO, CALÉE SUR LE DÉBUT DE SA PHRASE avant de commencer (un lecteur qui cherche met du temps)
  if (video && phrase && video.videoWidth) {
    await new Promise<void>((ok) => {
      const fini = () => ok();
      video.addEventListener("seeked", fini, { once: true });
      setTimeout(fini, 2500);
      video.currentTime = phrase.de;
    });
  }
  const im: ImagesReel = { photo, fondCarte: fabriquerFondCarte(), cage, hote: o.famille?.im.hote ?? null, grain: fabriquerGrain() };
  const e = enteteArdoise(o.commerce, o.quand);
  const scene: SceneReel = {
    plat: o.plat,
    prix: o.prix,
    entete: `${e.avant}${/['’]$/.test(e.avant) ? "" : " "}${e.nom}`.toLocaleUpperCase("fr-FR"),
    nomCadre: o.ville.trim() ? `${o.commerce} · ${o.ville.trim()}` : o.commerce,
    phrase,
    appel: appelDuReel({ surprises: o.famille?.d.surprises ?? null, motCle: o.motCle }),
    lien: o.famille?.d.lien ?? null,
    video: video && video.videoWidth ? video : null,
  };
  const morceaux = morceauxDuReel(phrase);
  const T = tempsDuReel(phrase);
  const TOUT = dureeDuReel(phrase);

  /* ─── le son ─── */
  const enregistree = ctx.createMediaStreamDestination();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 3;
  const limite = ctx.createDynamicsCompressor();
  limite.threshold.value = -2;
  limite.knee.value = 0;
  limite.ratio.value = 20;
  const bus = ctx.createGain();
  bus.connect(comp);
  comp.connect(limite);
  limite.connect(enregistree);
  const ecoute = ctx.createGain();
  ecoute.gain.value = o.ecouter ? 1 : 0;
  limite.connect(ecoute);
  ecoute.connect(ctx.destination);
  const salle = reverbe(ctx);
  const retour = ctx.createGain();
  retour.gain.value = 0.3;
  salle.connect(retour);
  retour.connect(bus);
  const effets = ctx.createGain();
  effets.gain.value = 0.9;
  effets.connect(bus);
  const S: SortieSon = { ctx, bruit: bruitBlanc(ctx), dest: effets, salle };
  const sources: AudioScheduledSourceNode[] = [];
  const musique = ctx.createGain();
  musique.gain.value = 0;
  musique.connect(bus);
  const niveau = (quand: number, v: number, en = 0.25) => {
    musique.gain.cancelScheduledValues(quand);
    musique.gain.setTargetAtTime(Math.max(0.0001, v), quand, en / 3);
  };

  /* ─── l'enregistreur ─── */
  const format = formatVideo();
  const flux = new MediaStream([...o.toile.captureStream(IPS).getVideoTracks(), ...enregistree.stream.getAudioTracks()]);
  const rec = new MediaRecorder(flux, { ...(format ? { mimeType: format } : {}), videoBitsPerSecond: debitDuMontage(TOUT), audioBitsPerSecond: DEBIT_SON });
  const morceauxVideo: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size) morceauxVideo.push(e.data);
  };
  const arrete = new Promise<void>((ok) => (rec.onstop = () => ok()));

  /* ─── les sons, posés une fois ─── */
  if (ctx.state !== "running") await ctx.resume().catch(() => {});
  c2d.fillStyle = "#000";
  c2d.fillRect(0, 0, W, H);
  rec.start(1000);
  const T0 = ctx.currentTime + 0.12;
  if (o.musique) {
    const boucle = ctx.createBufferSource();
    boucle.buffer = o.musique;
    boucle.loop = true;
    boucle.connect(musique);
    boucle.start(T0);
    sources.push(boucle);
  }
  niveau(T0, 0.32, 0.1);
  sonClic(S, T0 + 0.02);
  if (phrase && o.prise?.audio) {
    const B0 = T0 + T.phrase;
    niveau(B0 - 0.15, 0.06, 0.3);
    sonZoom(S, B0);
    const s = ctx.createBufferSource();
    s.buffer = o.prise.audio;
    s.connect(bus);
    s.start(B0, phrase.de, phrase.a - phrase.de);
    sources.push(s);
  }
  // L'APPEL : la carte arrive en coup de fouet, la cage tremble, il est libre, le chemin se pose
  const C0 = T0 + T.appel;
  niveau(C0, 0.3, 0.2);
  sonCarte(S, C0);
  if (scene.appel.cage) {
    sonTampon(S, C0 + 0.55);
    sonZoom(S, C0 + 1.4);
  }
  sonClic(S, C0 + (scene.appel.cage ? 1.75 : 0.75));
  sonSignature(S, C0 + (scene.appel.cage ? 2.1 : 1.1));
  niveau(T0 + TOUT - 0.6, 0.0001, 0.6);

  /* ─── la boucle : l'horloge du son mène, l'image suit ─── */
  let affiche = "";
  let erreur: Error | null = null;
  let joue = false;
  await new Promise<void>((fini) => {
    const tic = () => {
      if (o.signal?.aborted) {
        erreur = new Error("Montage interrompu.");
        return fini();
      }
      const t = ctx.currentTime - T0;
      if (t >= TOUT) return fini();
      if (t < 0) {
        c2d.fillStyle = "#000";
        c2d.fillRect(0, 0, W, H);
      } else {
        if (scene.video && !joue && t >= T.phrase - 0.05) {
          joue = true;
          void scene.video.play().catch(() => {});
        }
        dessinerReel(c2d, o.police, scene, im, t, morceaux);
        if (!affiche && t >= 1.3) {
          try {
            affiche = o.toile.toDataURL("image/jpeg", 0.82);
          } catch {
            affiche = "";
          }
        }
      }
      o.surProgres?.(borne(t / TOUT));
      requestAnimationFrame(tic);
    };
    requestAnimationFrame(tic);
  });

  await new Promise((r) => setTimeout(r, 150));
  if (rec.state !== "inactive") rec.stop();
  await arrete;
  for (const s of sources) {
    try {
      s.stop();
    } catch {
      /* déjà arrêtée */
    }
  }
  if (video) {
    video.pause();
    video.remove();
  }
  bus.disconnect();
  limite.disconnect();
  ecoute.disconnect();
  musique.disconnect();
  salle.disconnect();
  flux.getTracks().forEach((t) => t.stop());
  if (erreur) throw erreur;
  const type = rec.mimeType || format || "video/webm";
  return { blob: new Blob(morceauxVideo, { type }), type, duree: ctx.currentTime - T0, affiche };
}
