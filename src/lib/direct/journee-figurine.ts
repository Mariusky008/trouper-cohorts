/**
 * 👀 « PENDANT TON ABSENCE », SA FIGURINE RACONTE SA JOURNÉE (le chantier « Ma figurine », lot 2 ;
 * `docs/univers/ma-figurine.md`, section 4 ; le serveur : `journee-figurine-serveur.ts`).
 *
 * Elle parle à la première personne : « Sam et Hugo m'ont fait coucou », « 12 personnes m'ont vue dans les salons ».
 * Des prénoms, de vrais chiffres, jamais inventés : rien ne se dit quand il n'y a rien.
 *
 * FICHIER PARTAGÉ (l'écran et le serveur).
 */

/** Sa journée (aujourd'hui, l'heure de Paris) : les prénoms des coucous et des visites, ceux qui l'ont vue dans les salons. */
export type JourneeFigurine = { coucous: string[]; visites: string[]; salons: { n: number; prenoms: string[] } };

/** Les prénoms qu'on dit, au plus (« Sam, Hugo, Léa et 2 autres »). */
export const JOURNEE_PRENOMS_MAX = 3;

export const journeeVide = (j: JourneeFigurine | null | undefined) => !j || (!j.coucous.length && !j.visites.length && !j.salons.n);

/** « Sam », « Sam et Hugo », « Sam, Hugo et Léa », « Sam, Hugo, Léa et 2 autres » (`n` : combien en tout). */
export function prenomsDits(l: readonly string[], n = l.length): string {
  const v = [...new Set(l)].slice(0, JOURNEE_PRENOMS_MAX);
  const reste = Math.max(0, n - v.length);
  if (!v.length) return "";
  if (reste) return `${v.join(", ")} et ${reste} autre${reste > 1 ? "s" : ""}`;
  return v.length === 1 ? v[0] : `${v.slice(0, -1).join(", ")} et ${v[v.length - 1]}`;
}

export const PHRASES_JOURNEE = {
  titre: "👀 Ma journée, racontée par ta figurine",
  coucous: (l: readonly string[]) => `${prenomsDits(l)} ${l.length > 1 ? "m’ont" : "m’a"} fait coucou`,
  visites: (l: readonly string[]) => `${l.length > 1 ? "Visites" : "Visite"} de ${prenomsDits(l)} chez toi`,
  salons: (n: number) => `${n} personne${n > 1 ? "s" : ""} ${n > 1 ? "m’ont" : "m’a"} vue dans les salons`,
  salonsDont: (l: readonly string[], n: number) => (n > l.length ? `Dont ${prenomsDits(l, l.length)}` : prenomsDits(l)),
  rien: "Aujourd’hui, personne ne m’a encore vue. Assieds-toi dans un salon : on me verra.",
} as const;
