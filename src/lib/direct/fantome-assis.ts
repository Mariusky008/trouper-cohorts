/**
 * 🧵 LE FANTÔME ASSIS DU RESTAURANT ET SON NOM BRODÉ — les mesures, à part.
 *
 * L'expérience du restaurant (`boutique/experience-table.tsx`) les dessine en
 * SVG ; le montage de l'interview (`interview-montage.ts`) les redessine dans
 * sa vidéo, quand la cloche se soulève. Deux copies d'une mesure finissent
 * toujours par ne plus se ressembler : elles vivent donc ici, une fois.
 */
export type Pt = readonly [number, number];
/**
 * LE NOM, BRODÉ COMME SUR SA MAQUETTE — pose par pose, en fraction de l'image.
 *
 * « Le nom est étrange sur la casquette, pas proportionnel et pas bien
 * ajusté. » Il était posé à plat, en capitales, au milieu de la calotte. Sur
 * sa maquette, il SUIT LA COURBE de la casquette, juste au-dessus de la
 * visière, en italique à empattements couleur crème — et il se répète sur le
 * plastron du tablier. Les arcs ci-dessous sont mesurés sur ses trois PNG :
 * départ, point de contrôle (le bombé), arrivée. `tablier` : centre, largeur
 * permise et inclinaison du plastron.
 */
export const BRODERIE: Record<
  "montre" | "repos" | "salut",
  { l: number; h: number; arc: readonly [Pt, Pt, Pt]; tablier: readonly [number, number, number, number] }
> = {
  montre: { l: 1047, h: 1010, arc: [[0.35, 0.143], [0.535, 0.11], [0.735, 0.173]], tablier: [0.475, 0.69, 0.27, 4] },
  repos: { l: 853, h: 1015, arc: [[0.255, 0.15], [0.45, 0.114], [0.69, 0.183]], tablier: [0.39, 0.665, 0.27, 3] },
  salut: { l: 963, h: 1020, arc: [[0.305, 0.14], [0.5, 0.106], [0.715, 0.17]], tablier: [0.455, 0.675, 0.26, 4] },
};
export type Pose = keyof typeof BRODERIE;

/** LE NOM EN UNE OU DEUX LIGNES, coupé entre deux mots au plus près du milieu. */
export function lignesDuNom(nom: string): string[] {
  const mots = nom.trim().split(/\s+/);
  if (nom.length <= 14 || mots.length < 2) return [nom];
  let mieux = 1;
  let ecart = Infinity;
  for (let i = 1; i < mots.length; i++) {
    const d = Math.abs(mots.slice(0, i).join(" ").length - mots.slice(i).join(" ").length);
    if (d < ecart) [ecart, mieux] = [d, i];
  }
  return [mots.slice(0, mieux).join(" "), mots.slice(mieux).join(" ")];
}


/**
 * LES ARCS SUR LESQUELS LE NOM S'ÉCRIT : un seul, ou deux quand le nom tient
 * sur deux lignes — la première monte d'un cran, la seconde se resserre.
 */
export function arcsDuNom(arc: readonly [Pt, Pt, Pt], lignes: number): (readonly Pt[])[] {
  return lignes === 1
    ? [arc]
    : [arc.map(([x, y]) => [x + 0.012, y - 0.047] as Pt), arc.map(([x, y], i) => [x + (i === 0 ? 0.02 : i === 2 ? -0.02 : 0), y] as Pt)];
}
