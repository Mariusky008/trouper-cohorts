/**
 * 🎵 LA MUSIQUE DU STUDIO — composée dans le téléphone, note par note, comme celle de l'atelier.
 *
 * C'est `outils/clikme-studio/lili-ross/musique.py` (et `musique2.py` pour la version avec figurine) refait avec le son
 * du navigateur, hors du temps (`OfflineAudioContext`) : 120 battements par minute, une mesure de deux secondes par
 * chapitre, les accords fa maj7 – sol 6 – mi m7 – la m7. L'accroche douce, le rembobinage, le groove des cinq
 * chapitres avec un souffle avant chaque coupe, la montée vers le déclic, une note par mot du polaroïd, l'accord de
 * la fin. Avec la figurine, 3,5 s devant : sa petite comptine, le « boing » du ressort, les « pop » de ses bulles.
 *
 * AUCUNE VOIX, AUCUN ÉCHANTILLON : rien qui soit sous une licence qu'on ne connaît pas.
 *
 * FICHIER NAVIGATEUR.
 */
import { INTRO_FIGURINE, TEMPS as T_FILM, dureeDuFilm } from "./studio";

const TEMPS = 0.5; // un temps, à 120 battements par minute
const MESURE = 4 * TEMPS;
/** Fa maj7 – sol 6 – mi m7 – la m7 : une mesure chacun. */
const ACCORDS = [
  [53, 57, 60, 64],
  [55, 59, 62, 64],
  [52, 55, 59, 62],
  [57, 60, 64, 67],
];
const BASSES = [41, 43, 40, 45];
const MOTIF = [0, 2, 3, 1, 2, 3, 2, 1];

const mid = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
/** Un hasard qui donne toujours la même suite : la même musique à chaque montage. */
const hasard = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type Pistes = { batterie: AudioNode; basse: AudioNode; harmo: AudioNode; melo: AudioNode; nappe: AudioNode; effets: AudioNode };

export async function fabriquerMusiqueStudio(o: { figurine: boolean; sr?: number }): Promise<AudioBuffer> {
  const sr = o.sr ?? 44100;
  const D = o.figurine ? INTRO_FIGURINE : 0;
  const duree = dureeDuFilm(o.figurine);
  const ctx = new OfflineAudioContext(2, Math.ceil(duree * sr), sr);

  // ─── la table de mixage ───
  const limiteur = ctx.createDynamicsCompressor();
  limiteur.threshold.value = -8;
  limiteur.knee.value = 6;
  limiteur.ratio.value = 12;
  limiteur.attack.value = 0.003;
  limiteur.release.value = 0.15;
  // UN PEU SOUS LE MAXIMUM : mesuré à -13,6 LUFS et une crête à -0,1 dB à 0,9 — l'atelier vise -14 LUFS, crête -2 dB
  const general = ctx.createGain();
  general.gain.value = 0.75;
  // le fondu de la fin
  general.gain.setValueAtTime(0.75, D + 19.8);
  general.gain.linearRampToValueAtTime(0.0001, duree);
  general.connect(limiteur);
  limiteur.connect(ctx.destination);

  // quatre secondes de bruit : le plus long souffle (1,5 s) y tient, quel que soit l'endroit où il commence
  const bruit = ctx.createBuffer(1, sr * 4, sr);
  const b = bruit.getChannelData(0);
  for (let i = 0; i < b.length; i++) b[i] = hasard(i * 0.37) * 2 - 1;

  // la salle : une réverbération courte, la même à chaque fois
  const salle = ctx.createConvolver();
  const ir = ctx.createBuffer(2, Math.round(sr * 1.6), sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    let somme = 0;
    for (let i = 0; i < d.length; i++) {
      d[i] = (hasard(i * 1.31 + ch * 7.7) * 2 - 1) * Math.exp(-i / sr / 0.45);
      somme += d[i] * d[i];
    }
    const k = 1 / Math.sqrt(somme);
    for (let i = 0; i < d.length; i++) d[i] *= k;
  }
  salle.buffer = ir;
  salle.connect(general);
  const versSalle = (n: AudioNode, mouille: number) => {
    const g = ctx.createGain();
    g.gain.value = mouille;
    n.connect(g);
    g.connect(salle);
  };

  // la pompe : la nappe et la basse s'effacent sous la grosse caisse, pendant le groove
  const pompe = ctx.createGain();
  pompe.connect(general);
  for (let t = D + 2.5; t < D + 14.0 - 1e-6; t += TEMPS) {
    pompe.gain.setValueAtTime(0.35, t);
    pompe.gain.linearRampToValueAtTime(1, t + 0.32);
  }

  const piste = (vol: number, dest: AudioNode = general) => {
    const g = ctx.createGain();
    g.gain.value = vol;
    g.connect(dest);
    return g;
  };
  const P: Pistes = {
    batterie: piste(0.95),
    basse: piste(1, pompe),
    harmo: piste(0.95),
    melo: piste(0.9),
    nappe: piste(1, pompe),
    effets: piste(1),
  };
  versSalle(P.harmo, 0.35);
  versSalle(P.nappe, 0.5);
  versSalle(P.effets, 0.25);
  versSalle(P.melo, 0.3);
  // la mélodie en écho, une croche pointée plus tard, à droite
  const echo = ctx.createDelay(1);
  echo.delayTime.value = 0.375;
  const retour = ctx.createGain();
  retour.gain.value = 0.45;
  const droite = ctx.createStereoPanner();
  droite.pan.value = 0.6;
  P.melo.connect(echo);
  echo.connect(retour);
  retour.connect(droite);
  droite.connect(general);

  // ─── les instruments ───
  const enveloppe = (dest: AudioNode, t: number, vol: number, attaque: number, tenue: number) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attaque);
    g.gain.setTargetAtTime(0.0001, t + attaque, tenue / 3);
    g.connect(dest);
    return g;
  };
  const oscillateur = (type: OscillatorType, f: number, t: number, dur: number, dest: AudioNode) => {
    const o2 = ctx.createOscillator();
    o2.type = type;
    o2.frequency.value = f;
    o2.connect(dest);
    o2.start(t);
    o2.stop(t + dur + 0.05);
    return o2;
  };
  const souffleBruit = (t: number, dur: number, dest: AudioNode, filtre: BiquadFilterType, f: number, q = 0.8) => {
    const s = ctx.createBufferSource();
    s.buffer = bruit;
    const fl = ctx.createBiquadFilter();
    fl.type = filtre;
    fl.frequency.value = f;
    fl.Q.value = q;
    s.connect(fl);
    fl.connect(dest);
    s.start(t, hasard(t * 3.1) * 0.9, dur + 0.05);
    return fl;
  };

  const kick = (t: number, vol: number) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * 0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    g.connect(P.batterie);
    const o2 = oscillateur("sine", 156, t, 0.45, g);
    o2.frequency.setValueAtTime(156, t);
    o2.frequency.setTargetAtTime(46, t, 0.035);
    const c = ctx.createGain();
    c.gain.setValueAtTime(vol * 0.25, t);
    c.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    c.connect(P.batterie);
    souffleBruit(t, 0.03, c, "highpass", 2500);
  };
  const clap = (t: number, vol: number) => {
    for (const [dt, tenue, v] of [
      [0, 0.006, 0.8],
      [0.011, 0.006, 0.8],
      [0.022, 0.12, 1],
    ] as const) {
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * v * 0.55, t + dt);
      g.gain.exponentialRampToValueAtTime(0.001, t + dt + tenue * 5);
      g.connect(P.batterie);
      souffleBruit(t + dt, tenue * 5, g, "bandpass", 1700, 0.9);
    }
  };
  const hat = (t: number, vol: number, ouvert = false) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * (ouvert ? 0.22 : 0.16), t);
    g.gain.exponentialRampToValueAtTime(0.001, t + (ouvert ? 0.28 : 0.06));
    g.connect(P.batterie);
    souffleBruit(t, ouvert ? 0.28 : 0.06, g, "highpass", 7500);
  };
  const basse = (t: number, n: number, dur: number, vol = 1) => {
    const fl = ctx.createBiquadFilter();
    fl.type = "lowpass";
    fl.frequency.value = 520;
    const g = enveloppe(P.basse, t, 0.42 * vol, 0.004, dur * 0.9);
    fl.connect(g);
    oscillateur("sine", mid(n), t, dur, fl);
    const h = ctx.createGain();
    h.gain.value = 0.35;
    h.connect(fl);
    oscillateur("sine", mid(n) * 2, t, dur, h);
    const c = ctx.createGain();
    c.gain.value = 0.12;
    c.connect(fl);
    oscillateur("square", mid(n), t, dur, c);
  };
  /** Un piano électrique : une modulation qui s'éteint vite (l'attaque claire), puis le corps. */
  const piano = (t: number, n: number, dur: number, vel: number, dest: AudioNode) => {
    const f = mid(n);
    const g = enveloppe(dest, t, 0.16 * vel, 0.003, dur * 0.55);
    const porteuse = oscillateur("sine", f, t, dur, g);
    const indice = ctx.createGain();
    indice.gain.setValueAtTime(f * 2.45, t);
    indice.gain.setTargetAtTime(f * 0.25, t, 0.06);
    indice.connect(porteuse.frequency);
    oscillateur("sine", f, t, dur, indice);
    const h = enveloppe(dest, t, 0.04 * vel, 0.003, 0.15);
    oscillateur("sine", f * 2, t, Math.min(dur, 0.4), h);
  };
  const nappe = (t: number, notes: number[], dur: number, coupure = 1400) => {
    const fl = ctx.createBiquadFilter();
    fl.type = "lowpass";
    fl.frequency.value = coupure;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.035, t + 0.25);
    g.gain.setValueAtTime(0.035, Math.max(t + 0.25, t + dur - 0.35));
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    fl.connect(g);
    g.connect(P.nappe);
    for (const nt of notes) for (const det of [-0.12, 0, 0.11]) oscillateur("sawtooth", mid(nt + det), t, dur, fl);
  };
  const pincee = (t: number, n: number, dest: AudioNode, vol = 1) => {
    const g = enveloppe(dest, t, 0.13 * vol, 0.002, 0.16);
    oscillateur("sine", mid(n), t, 0.35, g);
    const h = enveloppe(dest, t, 0.04 * vol, 0.002, 0.03);
    oscillateur("sine", mid(n) * 3, t, 0.1, h);
  };
  /** Un « whoosh » : du bruit dont la bande monte (ou descend). */
  const souffle = (t: number, dur: number, f0: number, f1: number, vol: number) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + dur * 0.5);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    g.connect(P.effets);
    const fl = souffleBruit(t, dur, g, "bandpass", f0, 1.1);
    fl.frequency.setValueAtTime(f0, t);
    fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
  };
  const montee = (t: number, dur: number, vol: number) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + dur);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.03);
    g.connect(P.effets);
    const fl = souffleBruit(t, dur, g, "bandpass", 400, 1);
    fl.frequency.setValueAtTime(400, t);
    fl.frequency.exponentialRampToValueAtTime(9000, t + dur);
    const gt = ctx.createGain();
    gt.gain.setValueAtTime(0.0001, t);
    gt.gain.exponentialRampToValueAtTime(vol * 0.15, t + dur);
    gt.gain.linearRampToValueAtTime(0.0001, t + dur + 0.03);
    gt.connect(P.effets);
    const o2 = oscillateur("sine", 200, t, dur, gt);
    o2.frequency.setValueAtTime(200, t);
    o2.frequency.exponentialRampToValueAtTime(1100, t + dur);
  };
  /** La cassette qu'on rembobine : un ton qui glisse vers le grave en ondulant. */
  const rembobine = (t: number, dur: number) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.18, t);
    g.gain.setValueAtTime(0.18, t + dur - 0.05);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    g.connect(P.effets);
    const o2 = oscillateur("sine", 1020, t, dur, g);
    o2.frequency.setValueAtTime(1020, t);
    o2.frequency.exponentialRampToValueAtTime(120, t + dur);
    const lfo = ctx.createGain();
    lfo.gain.value = 60;
    lfo.connect(o2.frequency);
    oscillateur("sine", 18, t, dur, lfo);
    const gb = ctx.createGain();
    gb.gain.setValueAtTime(0.0001, t);
    gb.gain.linearRampToValueAtTime(0.25, t + dur);
    gb.connect(P.effets);
    souffleBruit(t, dur, gb, "bandpass", 4000, 0.6);
  };
  /** L'appareil photo : deux claquements secs et un petit ressort. */
  const declic = (t: number) => {
    for (const [dt, v] of [
      [0, 1],
      [0.055, 0.7],
    ] as const) {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.72 * v, t + dt);
      g.gain.exponentialRampToValueAtTime(0.001, t + dt + 0.04);
      g.connect(P.effets);
      souffleBruit(t + dt, 0.04, g, "bandpass", 3500, 0.7);
      const gs = enveloppe(P.effets, t + dt, 0.3 * v, 0.001, 0.02);
      oscillateur("sine", 180, t + dt, 0.1, gs);
    }
  };
  const pop = (t: number, n: number, vol = 1) => {
    const g = enveloppe(P.effets, t, 0.22 * vol, 0.001, 0.06);
    const o2 = oscillateur("sine", mid(n) * 1.6, t, 0.18, g);
    o2.frequency.setValueAtTime(mid(n) * 1.6, t);
    o2.frequency.setTargetAtTime(mid(n), t, 0.02);
  };
  const scintille = (t: number, dur: number) => {
    const NOTES = [88, 91, 93, 95, 96, 100];
    for (let k = 0; k < 18; k++) pincee(t + hasard(k * 3.3) * dur * 0.9, NOTES[Math.floor(hasard(k * 5.7) * NOTES.length)], P.effets, 0.4);
  };
  /** Le ressort de la figurine : un ton qui vibre et s'éteint. */
  const boing = (t: number, f0: number, dur: number, vol: number) => {
    const g = enveloppe(P.effets, t, 0.45 * vol, 0.002, 0.2);
    const o2 = oscillateur("sine", f0 * 1.5, t, dur, g);
    o2.frequency.setValueAtTime(f0 * 1.5, t);
    o2.frequency.setTargetAtTime(f0, t, 0.05);
    const vib = ctx.createGain();
    vib.gain.setValueAtTime(f0 * 0.22, t);
    vib.gain.setTargetAtTime(0.0001, t, 0.3);
    vib.connect(o2.frequency);
    oscillateur("sine", 12, t, dur, vib);
  };
  /** Le saut : un ton qui monte. */
  const hop = (t: number, dur: number, vol: number) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.35 * vol, t + dur * 0.4);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    g.connect(P.effets);
    const o2 = oscillateur("sine", 240, t, dur, g);
    o2.frequency.setValueAtTime(240, t);
    o2.frequency.exponentialRampToValueAtTime(1680, t + dur);
  };
  /** Le ressort qu'on écrase : un ton qui descend. */
  const serre = (t: number, dur: number, vol: number) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.3 * vol, t + dur * 0.5);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    g.connect(P.effets);
    const o2 = oscillateur("sine", 430, t, dur, g);
    o2.frequency.setValueAtTime(430, t);
    o2.frequency.exponentialRampToValueAtTime(195, t + dur);
  };

  // ─── l'arrangement : celui de musique.py, compté depuis le début du film ───
  const mesure = (t: number) => (((Math.floor((t - D) / MESURE) % 4) + 4) % 4);
  const groove = (debut: number, fin: number) => {
    for (let t = debut; t < fin - 1e-6; t += TEMPS) {
      const b = Math.round((t - D) / TEMPS);
      kick(t, 1);
      if (b % 2 === 1) clap(t, 0.9);
      hat(t + TEMPS / 2, 0.8, true);
      hat(t + TEMPS / 4, 0.55);
      hat(t + (3 * TEMPS) / 4, 0.7);
    }
  };
  const ligneDeBasse = (debut: number, fin: number) => {
    for (let t = debut; t < fin - 1e-6; t += MESURE) {
      const r = BASSES[mesure(t)];
      for (const [dt, d, oct] of [
        [0, 0.42, 0],
        [0.75, 0.2, 12],
        [1.0, 0.42, 0],
        [1.5, 0.22, 0],
        [1.75, 0.2, 7],
      ] as const)
        if (t + dt < fin) basse(t + dt, r + oct, d);
    }
  };
  const accords = (debut: number, fin: number, stabs = true) => {
    for (let t = debut; t < fin - 1e-6; t += MESURE) {
      const a = ACCORDS[mesure(t)];
      nappe(t, a, MESURE + 0.3);
      if (stabs) for (let k = 0; k < 4; k++) for (const nt of a) piano(t + k * TEMPS + TEMPS / 2, nt + 12, 0.28, 0.9, P.harmo);
    }
  };
  const arpege = (debut: number, fin: number, haut = 24) => {
    let i = 0;
    for (let t = debut; t < fin - 1e-6; t += TEMPS / 2, i++) pincee(t, ACCORDS[mesure(t)][MOTIF[i % 8]] + haut, P.melo);
  };

  if (o.figurine) {
    // la figurine arrive : elle tombe, rebondit, dit « Coucou », « Bienvenue », puis saute dans le film
    souffle(0, 0.32, 5000, 700, 0.28);
    boing(0.3, 150, 0.6, 1);
    kick(0.3, 0.55);
    nappe(0.45, [53, 57, 60, 65], 1.6, 1200);
    nappe(2.0, [48, 55, 60, 64], 1.1, 1200);
    for (const [t, nt] of [
      [0.5, 72],
      [0.75, 77],
      [1.0, 81],
      [1.25, 84],
      [1.5, 81],
      [1.75, 77],
      [2.0, 79],
      [2.25, 76],
      [2.5, 72],
      [2.625, 74],
    ] as const) {
      pincee(t, nt + 12, P.melo);
      piano(t, nt + 12, 0.35, 0.45, P.harmo);
    }
    for (const [t, nt] of [
      [0.5, 41],
      [1.0, 48],
      [1.5, 41],
      [2.0, 36],
      [2.5, 43],
    ] as const)
      basse(t, nt + 12, 0.22, 0.8);
    for (let t = 0.5; t < 2.8; t += TEMPS / 2) hat(t, 0.35);
    clap(1.0, 0.35);
    clap(2.0, 0.35);
    pop(0.55, 84);
    pop(1.5, 88);
    serre(2.82, 0.18, 1);
    hop(3.0, 0.3, 1);
    souffle(3.05, 0.4, 700, 7000, 0.25);
  }

  // l'accroche, douce : la fin de sa vidéo au ralenti
  accords(D, D + T_FILM.accroche, false);
  [76, 79, 81, 84].forEach((nt, k) => piano(D + 0.1 + k * TEMPS, nt, 0.9, 0.9, P.melo));
  montee(D + 0.5, 1.5, 0.3);
  // le retour en arrière
  rembobine(D + T_FILM.accroche, T_FILM.retour - T_FILM.accroche);
  // les cinq chapitres, et un souffle avant chaque coupe
  groove(D + 2.5, D + 12.5);
  ligneDeBasse(D + 2.5, D + 12.5);
  accords(D + 2.5, D + 12.5);
  arpege(D + 2.5, D + 12.5);
  for (const t of [4.5, 6.5, 8.5, 10.5]) souffle(D + t - 0.2, 0.36, 300, 4000, 0.35);
  souffle(D + 6.7, 0.5, 4000, 500, 0.3);
  // « Et voilà » : la montée vers le déclic
  groove(D + 12.5, D + 14.0);
  ligneDeBasse(D + 12.5, D + 14.5);
  accords(D + 12.5, D + 14.5);
  arpege(D + 12.5, D + 14.5, 36);
  for (let k = 0; k < 8; k++) clap(D + 14.0 + (k * TEMPS) / 8, 0.25 + 0.08 * k);
  montee(D + 13.5, 1.0, 0.35);
  // le déclic, puis ses mots, un par temps
  declic(D + T_FILM.declic);
  accords(D + 14.5, D + 18.5, false);
  for (let t = D + 15.0; t < D + 18.5 - 1e-6; t += TEMPS) {
    kick(t, 0.55);
    hat(t + TEMPS / 2, 0.5);
  }
  [84, 86, 88, 91, 93].forEach((nt, k) => pop(D + 15.5 + k * TEMPS, nt));
  scintille(D + 14.8, 3.5);
  // la fin
  souffle(D + 18.3, 0.5, 600, 6000, 0.3);
  for (const nt of [53, 57, 60, 64, 67, 72, 76]) piano(D + 18.5, nt, 2.4, 1.1, P.harmo);
  kick(D + 18.5, 1);
  nappe(D + 18.5, [53, 60, 64, 67], 2.5, 1800);

  if (o.figurine) {
    // la figurine pendant le film : ses deux passages, le polaroïd, le saut jusqu'à la carte de fin
    for (const [a, nt] of [
      [9.05, 86],
      [12.55, 88],
    ] as const) {
      souffle(a - 0.02, 0.25, 1800, 5000, 0.14);
      boing(a + 0.26, 200, 0.45, 0.5);
      pop(a + 0.23, nt, 0.9);
    }
    souffle(9.78, 0.2, 5000, 1800, 0.12);
    souffle(13.72, 0.2, 5000, 1800, 0.12);
    boing(19.0, 190, 0.45, 0.45);
    serre(21.82, 0.14, 0.7);
    hop(21.95, 0.3, 0.8);
    boing(22.42, 160, 0.55, 0.6);
    pop(22.85, 91);
  }

  return ctx.startRendering();
}
