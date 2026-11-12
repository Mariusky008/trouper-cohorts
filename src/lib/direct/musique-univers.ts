/**
 * 🎵 LA MUSIQUE D'AMBIANCE DE SON UNIVERS — 12 novembre 2026, le propriétaire, son univers créé : « peut-être
 * pourrions-nous rajouter pendant cette étape une petite musique d'ambiance ? ».
 *
 * Une boucle de 32 secondes, COMPOSÉE DANS LE TÉLÉPHONE note par note (comme celle de la danse, `musique-danse.ts`) :
 * aucune voix, aucun échantillon, rien sous une licence qu'on ne connaît pas. Lente et chaude, comme la lumière dorée
 * des univers « Film, chaleureux » : des accords tenus (ré majeur : Ré 9 – Si m 7 – Sol 7M – La sus), une basse ronde,
 * et une boîte à musique qui égrène quelques notes, avec un peu d'écho de pièce. La fin de la boucle retombe sur son
 * début : on n'entend pas la couture.
 *
 * Elle se lance au toucher (iPhone : le son ne démarre que dans le geste) : « Créer mon univers », une retouche, ou le
 * bouton 🎵. Elle respecte le son coupé de l'appli (`sons.ts`), et se tait quand la page est cachée.
 *
 * FICHIER NAVIGATEUR.
 */
import { sonCoupe } from "./sons";

const MESURE = 4; // secondes : un accord
const ACCORDS = [
  [50, 57, 64, 66, 69], // Ré 9
  [47, 54, 62, 66, 69], // Si m 7
  [43, 55, 59, 62, 66], // Sol 7M
  [45, 57, 59, 64, 69], // La sus 2
];
const MESURES = 8; // deux tours, une mélodie différente à chaque tour
const DUREE = MESURES * MESURE;
const QUEUE = 4; // la résonance après la fin, ramenée au début (la couture)
/** La boîte à musique (ré majeur pentatonique), en noires (une seconde) : `null`, un silence. */
const MELODIE: (number | null)[] = [
  [78, null, 81, 78],
  [74, null, null, 76],
  [79, null, 78, 74],
  [76, null, null, null],
  [81, null, 83, 81],
  [78, null, 76, null],
  [74, 76, 79, null],
  [81, null, null, null],
].flat();

const hz = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

let tampon: Promise<AudioBuffer> | null = null;

/** La boucle, rendue une seule fois. */
export function musiqueUnivers(sr = 32000): Promise<AudioBuffer> {
  tampon ??= rendre(sr).catch((e) => {
    tampon = null;
    throw e;
  });
  return tampon;
}

async function rendre(sr: number): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(2, Math.ceil((DUREE + QUEUE) * sr), sr);
  const general = ctx.createGain();
  general.gain.value = 0.55;
  general.connect(ctx.destination);
  // ─── l'écho de la pièce : une réponse faite de bruit qui s'éteint ───
  const echo = ctx.createConvolver();
  const rep = ctx.createBuffer(2, Math.ceil(2.6 * sr), sr);
  for (let c = 0; c < 2; c++) {
    const d = rep.getChannelData(c);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
  }
  echo.buffer = rep;
  const humide = ctx.createGain();
  humide.gain.value = 0.32;
  echo.connect(humide);
  humide.connect(general);

  const piste = (v: number, pan = 0, avecEcho = 0.5) => {
    const g = ctx.createGain();
    g.gain.value = v;
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    g.connect(p);
    p.connect(general);
    const e = ctx.createGain();
    e.gain.value = avecEcho;
    p.connect(e);
    e.connect(echo);
    return g;
  };
  const nappe = piste(0.16, 0, 0.6);
  const basse = piste(0.34, 0, 0.2);
  const boite = piste(0.22, 0.2, 0.9);

  // ─── les accords tenus : deux voix un peu désaccordées, filtrées, qui montent et redescendent doucement ───
  const tenue = (n: number, t: number, duree: number, pan: number) => {
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 1100;
    f.Q.value = 0.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.5, t + 1.4);
    g.gain.setValueAtTime(0.5, t + duree - 0.6);
    g.gain.linearRampToValueAtTime(0.0001, t + duree + 1.2);
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    f.connect(g);
    g.connect(p);
    p.connect(nappe);
    for (const [type, desaccord] of [
      ["triangle", -6],
      ["sawtooth", 5],
    ] as const) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = hz(n);
      o.detune.value = desaccord;
      const v = ctx.createGain();
      v.gain.value = type === "sawtooth" ? 0.35 : 1;
      o.connect(v);
      v.connect(f);
      o.start(t);
      o.stop(t + duree + 1.3);
    }
  };
  for (let m = 0; m < MESURES; m++) {
    const t = m * MESURE;
    const accord = ACCORDS[m % ACCORDS.length];
    accord.slice(1).forEach((n, i) => tenue(n, t, MESURE, (i - 1.5) * 0.25));
    // la basse ronde, la fondamentale une octave plus bas
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = hz(accord[0] - 12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.9, t + 0.5);
    g.gain.setValueAtTime(0.9, t + MESURE - 0.5);
    g.gain.linearRampToValueAtTime(0.0001, t + MESURE + 0.6);
    o.connect(g);
    g.connect(basse);
    o.start(t);
    o.stop(t + MESURE + 0.7);
  }
  // ─── la boîte à musique : une attaque nette, une longue retombée, une harmonique douce ───
  MELODIE.forEach((n, k) => {
    if (n == null) return;
    const t = k * 1 + 0.02;
    for (const [mult, v] of [
      [1, 0.8],
      [2, 0.18],
      [3, 0.06],
    ] as const) {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = hz(n) * mult;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2 / mult);
      o.connect(g);
      g.connect(boite);
      o.start(t);
      o.stop(t + 2.3);
    }
  });
  const rendu = await ctx.startRendering();
  // ─── la couture : ce qui résonne après la fin est ramené au début, la boucle tourne sans à-coup ───
  const longueur = Math.ceil(DUREE * sr);
  const boucle = ctx.createBuffer(2, longueur, sr);
  for (let c = 0; c < 2; c++) {
    const source = rendu.getChannelData(c);
    const d = boucle.getChannelData(c);
    d.set(source.subarray(0, longueur));
    for (let i = 0; i < source.length - longueur && i < longueur; i++) d[i] += source[longueur + i];
  }
  return boucle;
}

export type MusiqueUnivers = { arreter: () => void };
let partage: AudioContext | null = null;

/** La lance (À APPELER DANS LE TOUCHER) ; elle monte en douceur, et se tait quand la page est cachée. */
export function lancerMusiqueUnivers(): MusiqueUnivers {
  const rien = { arreter: () => undefined };
  const AC = typeof window === "undefined" ? undefined : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  if (!AC) return rien;
  try {
    partage ??= new AC();
  } catch {
    return rien;
  }
  const ctx = partage;
  void ctx.resume().catch(() => undefined);
  const volume = ctx.createGain();
  volume.gain.value = 0;
  volume.connect(ctx.destination);
  let source: AudioBufferSourceNode | null = null;
  let fini = false;
  const cachee = () => {
    if (document.hidden) void ctx.suspend().catch(() => undefined);
    else if (!fini) void ctx.resume().catch(() => undefined);
  };
  document.addEventListener("visibilitychange", cachee);
  void musiqueUnivers()
    .then((b) => {
      if (fini) return;
      source = ctx.createBufferSource();
      source.buffer = b;
      source.loop = true;
      source.connect(volume);
      const t = ctx.currentTime + 0.05;
      volume.gain.setValueAtTime(0.0001, t);
      volume.gain.linearRampToValueAtTime(0.7, t + 2.5);
      source.start(t);
    })
    .catch(() => undefined);
  return {
    arreter: () => {
      if (fini) return;
      fini = true;
      document.removeEventListener("visibilitychange", cachee);
      const t = ctx.currentTime;
      volume.gain.cancelScheduledValues(t);
      volume.gain.setValueAtTime(volume.gain.value, t);
      volume.gain.linearRampToValueAtTime(0, t + 0.8);
      try {
        source?.stop(t + 0.9);
      } catch {
        /* déjà arrêtée */
      }
    },
  };
}

/** Le son de l'appli est-il coupé (`sons.ts`) ? La musique ne se lance alors pas d'elle-même. */
export const musiqueCoupee = () => sonCoupe();
