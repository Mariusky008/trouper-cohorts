/**
 * 🧵 SES ÉCUSSONS — brodés, cousus sur le bas du corps de son fantôme.
 *
 * C'est l'étape 3 du prototype « Les trois fantômes » (« Ses écussons, cousus sur
 * son fantôme »). Ce ne sont pas des pastilles dans une liste : ils se voient dans
 * toutes les vitrines, et la bulle de qui le touche les nomme — une preuve, pas un
 * tableau de score. Trois, qu'on peut gagner aujourd'hui :
 *   · 🤝 PAROLE DE FANTÔME — tenir une promesse : il a libéré « Je viendrai un jour »
 *     ou « Je réserve / Je passe aujourd'hui », puis le commerçant a noté son passage ;
 *   · 📍 LE PIN DU COMMERCE — un par commerce où il a tenu parole (dans la vitrine de
 *     ce commerce, son fantôme porte son pin) ;
 *   · 💛 COUP DE CŒUR — un petit mot qui a touché un commerçant (son 💛).
 * « Ambassadeur » (faire venir un ami par sa vitrine) viendra avec le partage, et
 * « Bon conseil » avec les conseils : on ne montre pas un écusson qu'on ne peut pas gagner.
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : aucun accès à la base ici.
 */
export type Ecusson = "parole" | "pin" | "coeur";

export const ECUSSONS: { id: Ecusson; nom: string; icone: string; couleur: string; gagner: string }[] = [
  {
    id: "parole",
    nom: "Parole de fantôme",
    icone: "🤝",
    couleur: "#1E8F69",
    gagner: "Promets de venir (« Je viendrai un jour » ou « aujourd’hui »), puis passe : le commerçant note ton passage.",
  },
  { id: "pin", nom: "Les pins des commerces", icone: "📍", couleur: "#C9962E", gagner: "Un pin par commerce où tu as tenu parole." },
  { id: "coeur", nom: "Coup de cœur", icone: "💛", couleur: "#7A1E33", gagner: "Un petit mot qui touche un commerçant." },
];
export const ECUSSON = Object.fromEntries(ECUSSONS.map((e) => [e.id, e])) as Record<Ecusson, (typeof ECUSSONS)[number]>;

/** Où on les coud, selon leur nombre (x, y en % du fantôme), d'après le prototype. */
export const PLACES_ECUSSONS: [number, number][][] = [[], [[50, 72]], [[40, 72], [60, 72]], [[34, 70], [50, 73], [66, 70]]];

/**
 * LES PROMESSES TENUES : par personne, les commerces où elle a promis de venir (une cage
 * « un jour » ou « aujourd'hui ») et où un passage a été noté le jour même ou après.
 */
export function promessesTenues(
  cages: { qui: string; site: string; cage: string; le: string }[],
  visites: { qui: string; site: string; jour: string }[],
): Map<string, Set<string>> {
  const promis = new Map<string, string>(); // « qui|site » → le jour de sa première promesse
  for (const c of cages) {
    if (c.cage !== "un-jour" && c.cage !== "aujourdhui") continue;
    const cle = `${c.qui}|${c.site}`;
    const jour = c.le.slice(0, 10);
    if (!promis.has(cle) || jour < (promis.get(cle) as string)) promis.set(cle, jour);
  }
  const tenues = new Map<string, Set<string>>();
  for (const v of visites) {
    const depuis = promis.get(`${v.qui}|${v.site}`);
    if (!depuis || v.jour.slice(0, 10) < depuis) continue;
    if (!tenues.has(v.qui)) tenues.set(v.qui, new Set());
    tenues.get(v.qui)?.add(v.site);
  }
  return tenues;
}

/** Ses écussons dans la vitrine d'un commerce : la parole, le pin de CE commerce, le coup de cœur. */
export function ecussonsIci(o: { tenues?: Set<string>; site: string; coeur: boolean }): Ecusson[] {
  const e: Ecusson[] = [];
  if (o.tenues?.size) e.push("parole");
  if (o.tenues?.has(o.site)) e.push("pin");
  if (o.coeur) e.push("coeur");
  return e;
}

/** Ce que la route rend à l'habitant pour Ma Maison. */
export type MesEcussons = {
  /** Les commerces où il a tenu parole (ses pins). */
  pins: { cle: string; nom: string }[];
  /** Les commerces qui ont eu un coup de cœur pour un de ses mots. */
  coeurs: { cle: string; nom: string }[];
};
export const ecussonsGagnes = (m: MesEcussons): Ecusson[] =>
  [m.pins.length ? "parole" : null, m.pins.length ? "pin" : null, m.coeurs.length ? "coeur" : null].filter(Boolean) as Ecusson[];
