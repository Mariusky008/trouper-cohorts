/**
 * 😐 LE CONCOURS DE REGARD — le prototype du « duel du jour » (7 novembre 2026, le patron : « l'idée de faire discuter
 * deux figurines est peut-être bonne, mais la forme n'est pas bonne, c'est ennuyant : il faudrait quelque chose
 * d'amusant à regarder » ; « est-ce que je peux influencer le résultat ? » ; « à la fin, une carte à collectionner avec
 * les deux figurines et une phrase, comme un polaroïd qu'on pourrait envoyer »).
 *
 * LA RÈGLE, EN UNE PHRASE : il garde le doigt posé — sa figurine garde son sérieux — pendant que l'autre fait tout pour
 * le faire craquer. Le premier qui rit a perdu.
 *   · 🪰 une mouche se pose sur sa figurine : il glisse son doigt pour la chasser (sinon, ça chatouille : la jauge monte) ;
 *   · 😜 l'autre louche : il ne bouge surtout pas (s'il bouge, il craque à moitié) ;
 *   · la tension monte toute seule, de plus en plus vite : tout le monde finit par craquer ;
 *   · il lâche l'écran : il a ri, c'est perdu ;
 *   · il tient plus longtemps que l'autre : c'est l'autre qui craque, il a gagné.
 * SA CARTE DE PERSONNAGE AIDE UN PEU : son humour (au-dessus de 50) le rend plus résistant — 15 % au plus : l'adresse
 * compte bien plus que la carte.
 *
 * Ici, l'adversaire est Pablito (la figurine du patron) : son temps change chaque jour (10 à 16 s).
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : aucun accès à la base ici.
 */

export type Distraction = { de: number; a: number; type: "mouche" | "grimace" };

/** Un tirage reproductible (une graine → toujours la même suite). */
export function hasard(graine: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < graine.length; i++) h = Math.imul(h ^ graine.charCodeAt(i), 16777619);
  let x = h >>> 0 || 1;
  return () => {
    // (xorshift 32)
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

/** Le temps de Pablito aujourd'hui (10 à 16 s, au dixième), le même pour tout le monde ce jour-là. */
export function tempsDuJour(jour: string): number {
  return Math.round((10 + hasard(`pablito-${jour}`)() * 6) * 10) / 10;
}

/**
 * Les distractions d'une partie : la première à 1,2 s, puis de plus en plus serrées (de 2 s à 0,8 s d'écart) et de
 * plus en plus courtes (de 1,5 s à 0,8 s) ; une mouche ou une grimace, jamais trois fois la même de suite.
 */
export function programme(graine: string, jusqua = 40): Distraction[] {
  const r = hasard(graine);
  const l: Distraction[] = [];
  let t = 1.2;
  while (t < jusqua) {
    const k = Math.min(1, t / 20);
    const duree = 1.5 - 0.7 * k;
    const memes = l.length >= 2 && l[l.length - 1].type === l[l.length - 2].type ? l[l.length - 1].type : null;
    const type: Distraction["type"] = memes ? (memes === "mouche" ? "grimace" : "mouche") : r() < 0.55 ? "mouche" : "grimace";
    l.push({ de: t, a: t + duree, type });
    t += duree + 2 - 1.2 * k + r() * 0.6;
  }
  return l;
}

/** Ce que chaque chose fait monter la jauge de fou rire (sur 100). */
export const JAUGE = {
  /** la mouche, s'il ne l'a pas chassée */
  mouche: 42,
  /** la grimace, s'il a bougé */
  bouge: 30,
  /** la grimace, même sans bouger (elle chatouille un peu) */
  grimace: 8,
  /** la tension, par seconde : elle monte avec le temps (1,5 + 0,2 × t) */
  tension: (t: number) => 1.5 + 0.2 * t,
} as const;
/** Il chasse la mouche en glissant son doigt d'au moins ça (en pixels) ; il « bouge » au-delà de ça pendant une grimace. */
export const GLISSE_MIN = 40;
export const BOUGE_MAX = 28;

/** Ce que son humour lui épargne : 0 à 15 % de chaque montée (50 → rien, 80 et plus → 15 %). */
export function resistance(humour: number | null | undefined): number {
  const h = Number(humour);
  if (!Number.isFinite(h)) return 1;
  return 1 - Math.min(0.15, Math.max(0, h - 50) / 200);
}

/** « 9,8 » */
export const secondes = (s: number) => (Math.floor(s * 10) / 10).toFixed(1).replace(".", ",");

/**
 * LA PHRASE DU POLAROÏD (il peut la changer) : d'après le duel. Des tournures qui vont à tout le monde : jamais un
 * accord au masculin ou au féminin.
 */
export function legende(o: { gagne: boolean; moi: string; autre: string; tMoi: number; tAutre: number; revanche: boolean }, r = Math.random): string {
  const moi = o.moi || "Moi";
  const l = o.gagne
    ? [
        `${o.autre} a craqué à ${secondes(o.tAutre)} s. ${moi}, imperturbable.`,
        `${secondes(o.tMoi)} s sans rire. Un mur. ${o.autre} n’a rien pu faire.`,
        `${o.autre} a louché, grimacé, insisté… Rien. Le sérieux de ${moi} a gagné.`,
        ...(o.revanche ? [`La revanche est servie. ${o.autre} a craqué en premier.`] : []),
      ]
    : [
        `${moi} a craqué à ${secondes(o.tMoi)} s. ${o.autre} n’a même pas cligné.`,
        `${secondes(o.tMoi)} s… puis le fou rire. Revanche demain.`,
        `${o.autre} : 1. Le sérieux de ${moi} : 0.`,
        `Une mouche, une grimace, et c’était fini. Bien joué, ${o.autre}.`,
      ];
  return l[Math.floor(r() * l.length) % l.length];
}
export const LEGENDE_MAX = 90;
