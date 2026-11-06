/**
 * 🕺🎵 LA MUSIQUE DE LA DANSE — 6 novembre 2026, le patron : « "la faire danser" : il faut y associer une musique qu'on
 * entend, autrement c'est plat ».
 *
 * Une boucle de quatre mesures, COMPOSÉE DANS LE TÉLÉPHONE note par note (comme celle du Studio, `studio-musique.ts`) :
 * aucune voix, aucun échantillon, rien sous une licence qu'on ne connaît pas. 100 battements par minute : un temps,
 * c'est un rebond du ressort (la danse fait deux rebonds en 1,2 s) ; la grosse caisse tombe quand le ressort
 * s'écrase. La mi m – do – sol – ré (un air léger et dansant), une basse qui sautille, des accords sur les
 * contretemps, une petite mélodie, et un « boing » de ressort au début de chaque mesure.
 *
 * Rendue une fois hors du temps (`OfflineAudioContext`), puis jouée en boucle. Elle se lance au toucher (iPhone : le
 * son ne démarre que dans le geste).
 *
 * FICHIER NAVIGATEUR.
 */

export const TEMPS_DANSE = 0.6; // secondes : un rebond du ressort
const MESURE = 4 * TEMPS_DANSE;
const MESURES = 4;
const DUREE = MESURES * MESURE;
/** La mi m – do – sol – ré : une mesure chacun. */
const ACCORDS = [
  [64, 67, 71],
  [60, 64, 67],
  [62, 67, 71],
  [62, 66, 69],
];
const BASSES = [40, 36, 43, 38];
/** La petite mélodie (mi mineur pentatonique), en croches : `null`, un silence. */
const MELODIE: (number | null)[] = [76, null, 79, 76, 74, null, 71, null, 72, null, 76, 72, 71, null, 67, null, 74, null, 79, 74, 71, null, 74, null, 74, 76, 78, null, 81, null, 78, null];

const hz = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

let tampon: Promise<AudioBuffer> | null = null;

/** La boucle, rendue une seule fois. */
export function musiqueDanse(sr = 44100): Promise<AudioBuffer> {
  tampon ??= rendre(sr).catch((e) => {
    tampon = null;
    throw e;
  });
  return tampon;
}

async function rendre(sr: number): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(2, Math.ceil(DUREE * sr), sr);
  const limiteur = ctx.createDynamicsCompressor();
  limiteur.threshold.value = -10;
  limiteur.ratio.value = 10;
  limiteur.attack.value = 0.003;
  limiteur.release.value = 0.12;
  const general = ctx.createGain();
  general.gain.value = 0.7;
  general.connect(limiteur);
  limiteur.connect(ctx.destination);

  const bruit = ctx.createBuffer(1, sr, sr);
  const d = bruit.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

  const piste = (v: number, pan = 0) => {
    const g = ctx.createGain();
    g.gain.value = v;
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    g.connect(p);
    p.connect(general);
    return g;
  };
  const batterie = piste(0.9);
  const basse = piste(0.55);
  const accords = piste(0.22, -0.25);
  const melo = piste(0.2, 0.25);
  const effets = piste(0.28);

  // ─── la batterie ───
  const caisse = (t: number) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(g);
    g.connect(batterie);
    o.start(t);
    o.stop(t + 0.36);
  };
  const souffle = (t: number, duree: number, filtre: BiquadFilterType, f: number, v: number) => {
    const s = ctx.createBufferSource();
    s.buffer = bruit;
    const b = ctx.createBiquadFilter();
    b.type = filtre;
    b.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duree);
    s.connect(b);
    b.connect(g);
    g.connect(batterie);
    s.start(t, Math.random() * 0.5);
    s.stop(t + duree + 0.02);
  };
  for (let k = 0; k < MESURES * 4; k++) {
    const t = k * TEMPS_DANSE;
    caisse(t);
    // le claquement des mains sur 2 et 4
    if (k % 2 === 1) {
      souffle(t, 0.16, "bandpass", 1500, 0.7);
      souffle(t + 0.012, 0.12, "bandpass", 1800, 0.45);
    }
    // les charleys sur les contretemps (et un petit en double croche)
    souffle(t + TEMPS_DANSE / 2, 0.05, "highpass", 8000, 0.35);
    if (k % 4 === 3) souffle(t + (3 * TEMPS_DANSE) / 4, 0.03, "highpass", 9000, 0.2);
  }

  // ─── la basse qui sautille (croches : la fondamentale, puis l'octave sur le contretemps) ───
  const note = (dest: AudioNode, type: OscillatorType, n: number, t: number, duree: number, v: number, coupure = 0) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = hz(n);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    if (coupure) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = coupure;
      o.connect(f);
      f.connect(g);
    } else o.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + duree + 0.02);
  };
  for (let m = 0; m < MESURES; m++) {
    for (let c = 0; c < 8; c++) {
      const t = m * MESURE + (c * TEMPS_DANSE) / 2;
      note(basse, "sawtooth", BASSES[m] + (c % 2 ? 12 : 0), t, 0.24, 0.7, 700);
    }
    // les accords, en petits coups sur les contretemps des temps 2 et 4
    for (const temps of [1, 3]) {
      const t = m * MESURE + temps * TEMPS_DANSE + TEMPS_DANSE / 2;
      for (const n of ACCORDS[m]) note(accords, "square", n, t, 0.16, 0.25, 2600);
    }
    // le « boing » du ressort, au début de chaque mesure
    const t = m * MESURE;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(260, t);
    o.frequency.exponentialRampToValueAtTime(820, t + 0.16);
    o.frequency.exponentialRampToValueAtTime(520, t + 0.3);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.6, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(g);
    g.connect(effets);
    o.start(t);
    o.stop(t + 0.34);
  }
  // ─── la petite mélodie ───
  MELODIE.forEach((n, k) => {
    if (n != null) note(melo, "triangle", n, (k * TEMPS_DANSE) / 2, 0.26, 0.6);
  });
  return ctx.startRendering();
}

type Lecture = { arreter: () => void; baisser: (oui: boolean) => void };
let partage: AudioContext | null = null;

/**
 * La lance (À APPELER DANS LE TOUCHER) ; `onDebut` : le moment (horloge de la page, `performance.now()`) de son premier
 * temps, pour caler le ressort dessus. `baisser` : elle se fait discrète quand la figurine parle.
 */
export function lancerMusiqueDanse(onDebut?: (ms: number) => void): Lecture {
  const AC = typeof window === "undefined" ? undefined : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  if (!AC) return { arreter: () => undefined, baisser: () => undefined };
  try {
    partage ??= new AC();
  } catch {
    return { arreter: () => undefined, baisser: () => undefined };
  }
  const ctx = partage;
  void ctx.resume().catch(() => undefined);
  const volume = ctx.createGain();
  volume.gain.value = 0;
  volume.connect(ctx.destination);
  let source: AudioBufferSourceNode | null = null;
  let fini = false;
  let bas = false;
  const niveau = () => (bas ? 0.22 : 0.85);
  void musiqueDanse(ctx.sampleRate)
    .then((b) => {
      if (fini) return;
      source = ctx.createBufferSource();
      source.buffer = b;
      source.loop = true;
      source.connect(volume);
      const t = ctx.currentTime + 0.06;
      volume.gain.setValueAtTime(0.0001, t);
      volume.gain.linearRampToValueAtTime(niveau(), t + 0.3);
      source.start(t);
      onDebut?.(performance.now() + 60);
    })
    .catch(() => undefined);
  return {
    arreter: () => {
      fini = true;
      const t = ctx.currentTime;
      volume.gain.cancelScheduledValues(t);
      volume.gain.setValueAtTime(volume.gain.value, t);
      volume.gain.linearRampToValueAtTime(0, t + 0.25);
      try {
        source?.stop(t + 0.3);
      } catch {
        /* déjà arrêtée */
      }
    },
    baisser: (oui) => {
      bas = oui;
      if (!source) return;
      const t = ctx.currentTime;
      volume.gain.cancelScheduledValues(t);
      volume.gain.setValueAtTime(volume.gain.value, t);
      volume.gain.linearRampToValueAtTime(niveau(), t + 0.2);
    },
  };
}
