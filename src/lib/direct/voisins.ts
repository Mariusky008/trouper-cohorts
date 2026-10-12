/**
 * 🏘️ LA RUE — les deux voisins qu'un commerçant présente, et pourquoi y aller.
 *
 * « Sur leur page commerçant, à "Explorer ma ville", c'était l'idée de mettre
 * les deux voisins les plus proches à droite et à gauche, et ensuite
 * l'application elle-même avec tous les commerçants — je trouve l'idée forte
 * mais mal réalisée. »
 *
 * CE QUI NE VA PAS AVEC LES « COPAINS » (`copains.ts`) : ils sont choisis par
 * métier complémentaire, ou au hasard dans la ville, et leurs « 500 m » sont
 * des chiffres de démonstration. Un vrai commerçant n'avait même pas l'écran.
 *
 * ICI, DANS CET ORDRE :
 *   1. CEUX QU'IL A CHOISIS (son espace pro) — il sait qui il apprécie dans sa rue ;
 *   2. SINON, LES PLUS PROCHES, à vol d'oiseau, d'après leurs coordonnées ;
 *   3. PERSONNE : « Vos voisins arrivent bientôt ».
 * Jamais deux du même métier que lui en premier : un magasin de vêtements ne
 * présente pas son concurrent tant qu'un coiffeur est à deux minutes.
 *
 * ET CHACUN DIT POURQUOI Y ALLER, avec ce qu'on vient de faire : son offre du
 * moment s'il en a une, sinon la raison qui va de l'un à l'autre (« la coupe
 * qui va avec votre nouvelle tenue »).
 *
 * FICHIER PUR : il ne lit rien, il calcule sur ce qu'on lui donne.
 */
import type { CleMetier } from "@/lib/direct/apercu-habitant";

export type Point = { lat: number; lng: number };

/** La distance à vol d'oiseau, en mètres. */
export function distanceM(a: Point, b: Point): number {
  const R = 6371000;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * « À 2 min à pied », « À 1,4 km ». Le pas d'un piéton en ville, rues comprises :
 * 70 m par minute à vol d'oiseau (on marche plus que la ligne droite).
 */
export function aPied(m: number): string {
  if (!Number.isFinite(m)) return "";
  if (m < 60) return "Juste à côté";
  const min = Math.max(1, Math.round(m / 70));
  if (min <= 25) return `À ${min} min à pied`;
  const km = m / 1000;
  return `À ${km < 10 ? km.toFixed(1).replace(".", ",") : Math.round(km)} km`;
}

/**
 * POURQUOI ALLER DE L'UN À L'AUTRE — ce qu'on vient de faire chez le premier,
 * et ce que le second y ajoute. Dans la langue du client, en une ligne.
 */
const DE_L_UN_A_L_AUTRE: Partial<Record<CleMetier, Partial<Record<CleMetier, string>>>> = {
  mode: {
    coiffeur: "La coupe qui va avec votre nouvelle tenue",
    lunetier: "Les lunettes qui finissent le look",
    ongles: "Les mains assorties à la tenue",
    restaurant: "Une table pour fêter la trouvaille",
    bar: "Un verre pour l’étrenner",
  },
  coiffeur: {
    mode: "La tenue qui va avec votre nouvelle coupe",
    ongles: "Les mains assorties à la coupe",
    lunetier: "La monture qui va avec la coupe",
    restaurant: "Une table pour montrer la nouvelle tête",
  },
  ongles: {
    coiffeur: "La coupe assortie à vos mains",
    mode: "La tenue qui va avec vos ongles",
  },
  lunetier: {
    mode: "La tenue qui va avec vos lunettes",
    coiffeur: "La coupe qui va avec la monture",
  },
  restaurant: {
    bar: "Le verre d’après",
    fleuriste: "Des fleurs pour finir en beauté",
    librairie: "Le livre pour le dessert",
    artisan: "Le cadeau à rapporter",
  },
  bar: {
    restaurant: "La table d’avant",
    mode: "La tenue pour la soirée",
  },
  fleuriste: {
    restaurant: "La table où offrir le bouquet",
    artisan: "Le cadeau qui va avec les fleurs",
    librairie: "Le livre qui va avec le bouquet",
  },
  librairie: {
    restaurant: "La table où ouvrir le livre",
    bar: "Le café où commencer le livre",
    fleuriste: "Les fleurs qui vont avec le cadeau",
  },
  artisan: {
    fleuriste: "Les fleurs qui vont avec le cadeau",
    restaurant: "La table d’à côté",
  },
};

/** Sans lien particulier : ce que l'on y fait, dans les mots de son métier. */
const CE_QU_ON_Y_FAIT: Record<CleMetier, string> = {
  coiffeur: "Votre prochaine coupe, essayée sur vous avant d’y aller",
  ongles: "Couleurs et poses essayées sur votre main",
  mode: "Les pièces du moment, essayées sur vous",
  lunetier: "Les montures essayées sur votre visage",
  restaurant: "Le plat du jour, avant de vous déplacer",
  bar: "L’ambiance de ce soir, avant d’y aller",
  fleuriste: "Les bouquets du jour, vus chez vous",
  librairie: "Les coups de cœur du libraire",
  artisan: "Ce qui sort de l’atelier",
};

/** Le bouton, dans les mots de son métier. */
export const BOUTON_VOISIN: Record<CleMetier, string> = {
  coiffeur: "Essayer une coupe",
  ongles: "Essayer une pose",
  mode: "Essayer sur moi",
  lunetier: "Essayer des lunettes",
  restaurant: "Voir ce qu’on mange",
  bar: "Voir la soirée",
  fleuriste: "Voir les bouquets",
  librairie: "Mon prochain livre",
  artisan: "Voir l’atelier",
};

export function raisonDuVoisin(depuis: CleMetier, voisin: CleMetier, offre?: string): string {
  const o = (offre ?? "").trim();
  if (o) return `Aujourd’hui : ${o}`;
  return DE_L_UN_A_L_AUTRE[depuis]?.[voisin] ?? CE_QU_ON_Y_FAIT[voisin] ?? "À découvrir à deux pas";
}

export type Candidat = { id: string; branche: CleMetier; point?: Point };

/**
 * LES DEUX VOISINS : ceux qu'il a choisis, puis les plus proches. Un concurrent
 * direct (même métier) ne passe qu'en dernier recours.
 */
export function choisirLesVoisins(
  moi: { id: string; branche: CleMetier; point?: Point },
  tous: Candidat[],
  choisis: string[] = [],
): { id: string; distance?: number }[] {
  const autres = tous.filter((c) => c.id !== moi.id);
  const loin = (c: Candidat) => (moi.point && c.point ? distanceM(moi.point, c.point) : undefined);
  const pris: { id: string; distance?: number }[] = [];
  const prendre = (c?: Candidat) => {
    if (c && pris.length < 2 && !pris.some((x) => x.id === c.id)) pris.push({ id: c.id, ...(loin(c) !== undefined ? { distance: loin(c) } : {}) });
  };
  // 1. CEUX QU'IL A CHOISIS, dans son ordre.
  for (const id of choisis) prendre(autres.find((c) => c.id === id));
  // 2. LES PLUS PROCHES (avec des coordonnées), les autres métiers d'abord.
  const proches = autres.filter((c) => loin(c) !== undefined).sort((a, b) => (loin(a) ?? 0) - (loin(b) ?? 0));
  for (const c of proches) if (c.branche !== moi.branche) prendre(c);
  for (const c of proches) prendre(c);
  // 3. SANS COORDONNÉES ENCORE (l'adresse n'est pas encore localisée) : ceux de sa
  //    ville que l'appelant a bien voulu passer — présentés sans temps à pied.
  const sansPoint = autres.filter((c) => loin(c) === undefined);
  for (const c of sansPoint) if (c.branche !== moi.branche) prendre(c);
  for (const c of sansPoint) prendre(c);
  return pris;
}
