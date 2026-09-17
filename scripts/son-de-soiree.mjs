// 🎧 LES DIX SECONDES QU'ON FAIT ÉCOUTER AVANT D'Y ALLER.
//
// ═══ POURQUOI UN FICHIER FABRIQUÉ ══════════════════════════════════════════
//
// « Découvrez 10 secondes du morceau qui donnera le ton. »
//
// UN BOUTON LECTURE QUI NE JOUE RIEN EST PIRE QUE PAS DE BOUTON. C'est la faute
// qu'il a déjà signalée deux fois dans ce dossier — « ça donne pas du tout
// envie » — et elle serait ici à sa place la plus visible : l'essai EST
// l'écran, et le son EST l'essai. Un lecteur muet transforme la promesse en
// décor.
//
// DANS LE PRODUIT, C'EST LE LIEU QUI DÉPOSE SON EXTRAIT. Le bar met dix
// secondes de son DJ set, le kiosque dix secondes du trio. `EssaiSoiree.media`
// pointe alors sur son fichier et ce script ne sert plus à rien — il ne fabrique
// pas le produit, il l'empêche d'être muet en attendant.
//
// ═══ CE QU'IL FABRIQUE ════════════════════════════════════════════════════
//
// UN TRIO DE JAZZ, PARCE QUE C'EST CE QUE LE KIOSQUE ANNONCE. « Trio de jazz
// landais », dit sa fiche : une contrebasse qui marche, un piano qui pose des
// accords, une cymbale ride. Une boucle house aurait été plus facile à écrire et
// aurait menti sur l'affiche — et l'affiche est justement ce qu'on essaie.
//
// DEUX TOURS DE ii–V–I–VI EN RÉ MINEUR, à cent vingt temps par minute : vingt
// temps, dix secondes. C'est la grille la plus commune du répertoire, celle
// qu'on reconnaît sans la nommer.
//
// ═══ POURQUOI DU WAV, ET POURQUOI C'EST ACCEPTABLE ════════════════════════
//
// IL N'Y A NI ffmpeg NI ENCODEUR dans cet environnement : on écrit donc des
// échantillons bruts, et le WAV est le seul format qu'un navigateur lise sans
// encodeur. EN MONO À 22 050 Hz, dix secondes pèsent quatre cent quarante
// kilooctets — l'ordre de grandeur des photographies de ce dossier, pour un
// fichier qui ne se charge QUE si l'on touche le bouton (`preload="none"`).
//
//   node scripts/son-de-soiree.mjs

import { mkdirSync, writeFileSync } from "node:fs";

const TAUX = 22050;
const SECONDES = 10;
const N = TAUX * SECONDES;
const sortie = "public/direct/soiree";
mkdirSync(sortie, { recursive: true });

/** La piste, en flottants entre -1 et 1. Le clipping se fait à la fin. */
const piste = new Float32Array(N);

/** Le demi-ton par rapport au la 440. */
const hz = (demiTons) => 440 * Math.pow(2, demiTons / 12);

/**
 * LA GRILLE — ii V I VI en ré mineur, deux fois.
 *
 * Les nombres sont des demi-tons depuis le la 440 : le ré du dessous est -7, le
 * sol -2, le do -9, le la 0. Écrire les notes plutôt que les fréquences est ce
 * qui permet de relire la grille — et de la corriger sans calculette.
 */
const GRILLE = [
  { nom: "Dm7", basse: -19, accord: [-7, -3, 0, 5] },
  { nom: "G7", basse: -14, accord: [-2, 2, 5, 9] },
  { nom: "Cmaj7", basse: -21, accord: [-9, -5, -2, 3] },
  { nom: "A7", basse: -24, accord: [-12, -8, -5, 1] },
  { nom: "Dm7", basse: -19, accord: [-7, -3, 0, 5] },
  { nom: "G7", basse: -14, accord: [-2, 2, 5, 9] },
];

const TEMPO = 120;
const TEMPS = 60 / TEMPO; // une noire, en secondes

/** Pose un son dans la piste, échantillon par échantillon. */
function poser(debut, duree, voix) {
  const d0 = Math.round(debut * TAUX);
  const d1 = Math.min(N, d0 + Math.round(duree * TAUX));
  for (let i = d0; i < d1; i++) {
    if (i < 0) continue;
    piste[i] += voix((i - d0) / TAUX);
  }
}

/**
 * LA CONTREBASSE — une sinusoïde et sa quinte, avec l'attaque courte d'une
 * corde pincée. La deuxième harmonique donne le bois ; sans elle on obtient un
 * synthétiseur des années quatre-vingt, ce qui n'est pas un trio de jazz.
 */
function basse(f, force = 0.5) {
  return (t) => {
    const env = Math.min(1, t * 120) * Math.exp(-t * 3.1);
    return (
      force *
      env *
      (Math.sin(2 * Math.PI * f * t) * 0.8 +
        Math.sin(4 * Math.PI * f * t) * 0.18 +
        Math.sin(6 * Math.PI * f * t) * 0.05)
    );
  };
}

/**
 * LE PIANO — quatre partiels et une décroissance longue. Les partiels
 * légèrement désaccordés (le 1,002) évitent le son de diapason : un piano réel
 * a trois cordes par note et elles ne sont jamais parfaitement d'accord.
 */
function piano(f, force = 0.14) {
  return (t) => {
    const env = Math.min(1, t * 400) * Math.exp(-t * 2.4);
    return (
      force *
      env *
      (Math.sin(2 * Math.PI * f * t) +
        Math.sin(2 * Math.PI * f * 1.002 * t) * 0.7 +
        Math.sin(4 * Math.PI * f * t) * 0.28 +
        Math.sin(6 * Math.PI * f * t) * 0.12)
    );
  };
}

/**
 * LA CYMBALE — du bruit, et rien d'autre.
 *
 * ELLE EST TIRÉE D'UNE SUITE ÉCRITE, PAS DE `Math.random()`. Le script doit
 * rendre le même fichier à chaque exécution, sinon on ne peut plus dire si une
 * différence entendue vient d'un changement voulu ou du hasard.
 */
let graine = 20260917;
function bruit() {
  graine = (graine * 1664525 + 1013904223) % 4294967296;
  return graine / 2147483648 - 1;
}
function ride(force = 0.06) {
  return (t) => {
    const env = Math.exp(-t * 14) + Math.exp(-t * 2.2) * 0.22;
    return force * env * bruit() * (0.6 + 0.4 * Math.sin(2 * Math.PI * 7300 * t));
  };
}

// ═══ ON JOUE ═══════════════════════════════════════════════════════════════

GRILLE.forEach((accord, mesure) => {
  const t0 = mesure * 4 * TEMPS;

  // LA CONTREBASSE MARCHE : une note par temps, fondamentale, quinte, octave,
  // puis une note d'approche qui mène à l'accord suivant. C'est la définition
  // même d'une walking bass, et c'est ce qui donne l'avancée.
  const suivant = GRILLE[(mesure + 1) % GRILLE.length].basse;
  const marche = [accord.basse, accord.basse + 7, accord.basse + 12, suivant - 1];
  marche.forEach((n, i) => poser(t0 + i * TEMPS, TEMPS * 1.1, basse(hz(n))));

  // LE PIANO POSE L'ACCORD SUR LE DEUXIÈME ET LE QUATRIÈME TEMPS — la place du
  // comping. Sur les temps forts, il doublerait la basse et l'ensemble
  // deviendrait un mur.
  for (const retard of [TEMPS * 1.5, TEMPS * 3.25]) {
    accord.accord.forEach((n, k) =>
      poser(t0 + retard + k * 0.006, 1.9, piano(hz(n), 0.13 - k * 0.012)),
    );
  }

  // LA RIDE, EN RYTHME TERNAIRE : 1, 2, 2-et-demi, 3, 4, 4-et-demi. Le
  // décalage des deux « et » aux deux tiers du temps est LE swing ; à la
  // moitié, on obtient une boîte à rythmes.
  for (const p of [0, 1, 1 + 2 / 3, 2, 3, 3 + 2 / 3]) {
    poser(t0 + p * TEMPS, 0.55, ride(p % 1 === 0 ? 0.075 : 0.05));
  }
});

// ═══ ON FERME ══════════════════════════════════════════════════════════════

// UNE ENTRÉE ET UNE SORTIE EN FONDU. Sans elles, l'échantillon commence et
// finit par un craquement — le saut brutal de zéro à la première valeur — et ce
// craquement est la première chose qu'on entend.
const fondu = Math.round(TAUX * 0.06);
for (let i = 0; i < fondu; i++) {
  piste[i] *= i / fondu;
  piste[N - 1 - i] *= i / fondu;
}

// ON NORMALISE À MOINS DE UN plutôt que de laisser écrêter : un dépassement se
// transforme en distorsion sur toute la durée du pic, et sur un téléphone ça
// s'entend plus que sur n'importe quoi d'autre.
let crete = 0;
for (let i = 0; i < N; i++) crete = Math.max(crete, Math.abs(piste[i]));
const gain = crete > 0 ? 0.89 / crete : 1;

const pcm = Buffer.alloc(N * 2);
for (let i = 0; i < N; i++) {
  const v = Math.max(-1, Math.min(1, piste[i] * gain));
  pcm.writeInt16LE(Math.round(v * 32767), i * 2);
}

/** L'en-tête WAV canonique : RIFF, fmt (PCM 16 bits), data. */
function enTete(octets) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + octets, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); // taille du bloc fmt
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(TAUX, 24);
  h.writeUInt32LE(TAUX * 2, 28); // octets par seconde
  h.writeUInt16LE(2, 32); // alignement
  h.writeUInt16LE(16, 34); // bits
  h.write("data", 36);
  h.writeUInt32LE(octets, 40);
  return h;
}

const fichier = `${sortie}/son-de-ce-soir.wav`;
writeFileSync(fichier, Buffer.concat([enTete(pcm.length), pcm]));
console.log(
  `${fichier} — ${SECONDES} s, ${TAUX} Hz mono, ${(pcm.length / 1024).toFixed(0)} ko, crête ${crete.toFixed(2)}`,
);
