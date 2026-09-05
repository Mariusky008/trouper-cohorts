/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚡ LE FLASH — une offre, trente minutes, maintenant
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ─── D'OÙ ÇA VIENT ────────────────────────────────────────────────────────
 *
 * « Une promotion classique dit "−20 % aujourd'hui" : le client se dit "je
 * regarderai plus tard". Un Flash dit "−30 %, pendant encore 18 min" : le
 * comportement devient "il faut que je décide maintenant". C'est exactement ce
 * que ClikMe cherche à créer — voir, décider, agir. »
 *
 * ET CE N'EST PAS UNE PROMOTION, C'EST UNE OPPORTUNITÉ DU MOMENT. Le
 * restaurateur à qui il reste huit plats, le coiffeur qui a une annulation à
 * 16 h, l'institut dont le créneau de 18 h est vide : aucun d'eux ne monte une
 * campagne. Ils ont un problème maintenant, et il dure une heure. « ClikMe ne
 * vend pas des promotions, ClikMe transforme les opportunités du moment en
 * ventes. »
 *
 * ─── POURQUOI IL EST RARE, ET POURQUOI C'EST DANS LE CODE ─────────────────
 *
 * « Si Margot fait lundi −30 %, mardi −30 %, mercredi −30 %, ça devient
 * simplement son prix normal. Et l'effet de surprise disparaît. »
 *
 * C'est la remarque qui fait la différence entre une fonctionnalité et un
 * mécanisme. Un Flash tire toute sa valeur de sa rareté ; laissée libre, elle
 * s'épuiserait en trois semaines — d'abord chez le commerçant qui en abuse,
 * puis chez l'habitant qui apprend à ne plus regarder. La limite n'est donc pas
 * un réglage qu'on pourrait relever : elle est la fonctionnalité.
 *
 * TROIS PAR SEMAINE, ET LE COMPTE SE VOIT. « Ça crée de la rareté du côté du
 * commerçant aussi, et ça protège la valeur du mécanisme. » Le voir descendre
 * fait réfléchir avant de le dépenser — exactement ce qu'on veut.
 *
 * ─── POURQUOI « FLASH » ET PAS « HAPPY HOUR » ─────────────────────────────
 *
 * « Happy Hour est associé aux bars et à une période récurrente. Flash peut
 * fonctionner partout — boulangerie, coiffeur, fleuriste, garage — et surtout :
 * Flash veut dire quelque chose qui se passe maintenant. »
 */
import type { MomentJour } from "./apercu-habitant";

/**
 * L'HEURE ÉCRITE — la même règle qu'ailleurs, recopiée ici EXPRÈS.
 *
 * Trois lignes contre une dépendance : ce module est le seul du produit qu'on
 * charge aussi hors du navigateur (le test le lit directement), et importer
 * `fil-du-jour` y traînerait tout le planning pour un formatage d'heure. Une
 * fonction de trois lignes recopiée est moins chère qu'un graphe de modules
 * qu'on ne peut plus lire seul.
 */
function hhmm(h: number): string {
  const m = Math.round((h % 1) * 60);
  return m ? `${Math.floor(h)} h ${String(m).padStart(2, "0")}` : `${Math.floor(h)} h`;
}

/** Combien de Flash un commerce peut lancer dans la semaine. Voir plus haut. */
export const FLASH_PAR_SEMAINE = 3;

/** La durée proposée par défaut, en minutes. Trente : le temps d'y aller. */
export const FLASH_MINUTES = 30;

/**
 * QUAND IL S'ÉTEINT — et jamais après minuit.
 *
 * UN FLASH LANCÉ À 23 H 45 POUR TRENTE MINUTES FINIRAIT À « 24 H 15 ». Écrit
 * tel quel sur la carte, et surtout invisible : la journée entière est rangée
 * au changement de date (voir `journee.ts`), si bien que la moitié d'après
 * minuit n'existerait dans aucun écran. On préfère un Flash plus court à un
 * Flash qui promet un quart d'heure qu'il ne tiendra pas.
 */
export function finDuFlash(lance: number, minutes: number): number {
  return Math.min(lance + minutes / 60, 23 + 59 / 60);
}

/**
 * CE QU'UN FLASH MET EN AVANT — et ce n'est pas forcément une remise.
 *
 * « Le Flash ne devrait pas forcément être une réduction : deux achetés = un
 * offert, dessert offert, dernières places à −20 %, massage 60 min à 49 € au
 * lieu de 70 €. Le moteur est : une offre exceptionnelle + une durée très
 * courte + une disponibilité réelle. »
 *
 * Le type suit ce moteur-là. `avantage` est écrit en clair par le commerçant —
 * on ne lui impose pas une grille de promotion, parce qu'une grille l'obligerait
 * à traduire son idée dans nos cases. `avant`/`apres` ne servent que quand il y
 * a deux prix ; sinon l'avantage se suffit.
 */
export type Flash = {
  /** Ce qui est en Flash : « Lasagnes maison », « Le créneau de 18 h ». */
  quoi: string;
  /** L'avantage, dit comme il le dirait : « −30 % », « Dessert offert ». */
  avantage: string;
  /** Le prix avant, s'il y en a un. */
  avant?: string;
  /** Le prix après. */
  apres?: string;
  /** Combien il y en a. Zéro veut dire « on ne compte pas ». */
  combien?: number;
  photo?: string;
  /** L'heure décimale de lancement, et celle de fin. */
  lance: number;
  fin: number;
};

/**
 * LES QUATRE RACCOURCIS, ET ILS PARLENT SON MÉTIER.
 *
 * LE DÉFAUT MESURÉ : « quand je suis sur coiffeur, on me propose dans Flash des
 * lasagnes et des desserts gratuits — ce n'est pas en corrélation avec le
 * métier. » Un coiffeur à qui l'on propose « dessert offert » comprend en une
 * seconde que l'outil n'a pas été fait pour lui, et il a raison : ces
 * raccourcis-là venaient d'un restaurant, écrits en dur.
 *
 * DEUX REMISES PARTOUT, DEUX IDÉES DE SON MÉTIER. Les pourcentages marchent
 * pour tout le monde ; les deux autres doivent être des phrases qu'il aurait pu
 * dire lui-même. Le champ reste libre — ce ne sont que des raccourcis — mais un
 * raccourci qui ne va nulle part est pire qu'aucun raccourci.
 */
const RACCOURCIS: Record<string, string[]> = {
  restaurant: ["−20 %", "−30 %", "2 achetés = 1 offert", "Dessert offert"],
  bar: ["−20 %", "−30 %", "2 achetés = 1 offert", "L’apéro offert"],
  coiffeur: ["−20 %", "−30 %", "Le créneau qui vient de se libérer", "Shampoing offert"],
  ongles: ["−20 %", "−30 %", "Le créneau qui vient de se libérer", "La pose de couleur offerte"],
  mode: ["−20 %", "−30 %", "2 achetés = 1 offert", "Les retouches offertes"],
  fleuriste: ["−20 %", "−30 %", "Le bouquet du jour", "La livraison offerte"],
};

/** Ce qu'on lui propose en un appui, selon son métier. */
export function raccourcisDuFlash(branche: string): string[] {
  return RACCOURCIS[branche] ?? ["−20 %", "−30 %", "−40 %", "Le dernier créneau"];
}

/**
 * UN PRIX S'ÉCRIT AVEC SON UNITÉ.
 *
 * VU SUR SA CAPTURE : il a tapé « 10 » dans « prix avant », et la carte a
 * affiché « 10 » — un nombre nu, à côté d'un « 9,80 € » qui, lui, portait son
 * euro. Deux prix côte à côte dont un seul a son unité se lisent comme une
 * erreur d'affichage. On ne le corrige pas à sa place dans le champ — il écrit
 * ce qu'il veut, « 10 min » ou « à partir de 10 » — mais un nombre SEUL n'a
 * qu'une lecture possible.
 */
export function prixEcrit(v: string): string {
  const t = v.trim();
  return /^\d+([.,]\d+)?$/.test(t) ? `${t} €` : t;
}

/**
 * LE PRIX D'APRÈS, CALCULÉ — parce que « −20 % » n'est pas un prix.
 *
 * LE DÉFAUT VU À L'ÉCRAN : la carte annonçait « −20 % » puis « 14 € », l'un
 * sous l'autre et tous deux en ambre. Personne ne peut lire ça autrement que
 * « le Flash est à 14 € », c'est-à-dire le prix d'avant. Et personne, devant
 * une vitrine, ne fait 14 × 0,8 de tête.
 *
 * IL A DEMANDÉ « PRIX AVANT, PRIX APRÈS » DÈS LE PREMIER JOUR, et c'est
 * exactement la bonne forme : ce sont deux nombres, pas un nombre et une
 * opération. Quand le raccourci choisi est un pourcentage et que le prix du
 * jour est connu, on remplit donc la case pour lui — il garde la main dessus,
 * c'est un champ comme les autres.
 *
 * ON REND « 11,20 » ET PAS « 11.2 » : c'est un prix français, et il va être
 * relu par le commerçant avant de partir.
 */
export function prixApres(avant: string, avantage: string): string {
  const p = Number(avant.replace(",", ".").replace(/[^0-9.]/g, ""));
  const pc = /(\d+(?:[.,]\d+)?)\s*%/.exec(avantage);
  if (!p || !pc) return "";
  const v = p * (1 - Number(pc[1].replace(",", ".")) / 100);
  if (!(v > 0)) return "";
  return (Math.round(v * 100) / 100).toFixed(2).replace(/[.,]00$/, "").replace(".", ",");
}

/** Le journal des Flash d'un commerce, pour tenir le compte de la semaine. */
export type JournalFlash = { commerce: string; jour: string; lance: number }[];

const CLE = "clikme.flash.v1";

function aujourdhui(): string {
  return new Date().toISOString().slice(0, 10);
}

function lire(): JournalFlash {
  try {
    const j = JSON.parse(window.localStorage.getItem(CLE) ?? "[]");
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

/**
 * COMBIEN IL LUI EN RESTE CETTE SEMAINE.
 *
 * SEPT JOURS GLISSANTS, ET PAS « DEPUIS LUNDI ». Une semaine calendaire
 * autorise six Flash en trente-six heures — trois le dimanche soir, trois le
 * lundi matin — c'est-à-dire exactement l'abus qu'on veut empêcher, avec la
 * bénédiction du compteur.
 */
export function flashRestants(commerce: string): number {
  if (typeof window === "undefined") return FLASH_PAR_SEMAINE;
  const limite = Date.now() - 7 * 24 * 3600 * 1000;
  const pris = lire().filter((f) => f.commerce === commerce && f.lance >= limite).length;
  return Math.max(0, FLASH_PAR_SEMAINE - pris);
}

/** Il vient d'en lancer un : on l'inscrit au journal. */
export function noterUnFlash(commerce: string) {
  if (typeof window === "undefined") return;
  try {
    const j = lire();
    j.push({ commerce, jour: aujourdhui(), lance: Date.now() });
    // On ne garde que la fenêtre utile : le journal ne grossit pas indéfiniment.
    const limite = Date.now() - 8 * 24 * 3600 * 1000;
    window.localStorage.setItem(CLE, JSON.stringify(j.filter((x) => x.lance >= limite)));
  } catch {
    /* Quota plein : le compte se relâche, l'écran continue. */
  }
}

/** Pour la remise à zéro d'une démonstration. */
export function viderLesFlash() {
  try {
    window.localStorage.removeItem(CLE);
  } catch {
    /* Rien à faire. */
  }
}

/**
 * COMBIEN DE MINUTES IL RESTE — et jamais un nombre négatif.
 *
 * Rendre 0 quand c'est fini permet à l'écran de poser une seule question :
 * « reste-t-il du temps ? ». Sans ça, chaque endroit qui affiche le compte
 * devrait refaire la soustraction et se souvenir de la borner.
 */
export function minutesRestantes(f: Flash, heure: number): number {
  return Math.max(0, Math.round((f.fin - heure) * 60));
}

/**
 * VRAI TANT QUE LE FLASH COURT — avec une minute de tolérance au départ.
 *
 * LE DÉFAUT MESURÉ, ET IL AURAIT ÉTÉ INVISIBLE EN DÉMONSTRATION : le lien qui
 * mène au paquet porte l'heure arrondie au centième — trente-six secondes. Un
 * Flash lancé à 10 h 40 min 20 s se voyait donc offrir une heure d'arrivée de
 * 10 h 40 min 12 s, c'est-à-dire AVANT son propre lancement : la carte partait
 * en ligne avec son étiquette et ses deux prix, mais sans son compte à rebours.
 * Le seul élément qui fait tout l'intérêt du mécanisme, absent une fois sur
 * deux, et sans rien dans la console pour le dire.
 *
 * UNE MINUTE, PARCE QU'UN FLASH NE SE PROGRAMME PAS. Il part toujours à
 * l'instant où on appuie ; il n'existe donc aucun cas légitime où l'on
 * regarderait un Flash « pas encore commencé ». La borne basse ne protège de
 * rien et coûtait une fonctionnalité entière.
 */
export function flashEnCours(f: Flash, heure: number): boolean {
  return heure >= f.lance - 1 / 60 && heure < f.fin;
}

/**
 * COMMENT ON ÉCRIT LE TEMPS QUI RESTE.
 *
 * PAS DE SECONDES QUI DÉFILENT. « Attention : pas un gros compteur anxiogène
 * façon site de e-commerce. Quelque chose de très simple. » Un chronomètre à la
 * seconde transforme une bonne nouvelle en pression, et c'est le genre de
 * pression qu'on ne pardonne pas à un commerce de son quartier. La minute
 * suffit à faire comprendre qu'il faut décider maintenant.
 */
export function tempsQuiReste(f: Flash, heure: number): string {
  const m = minutesRestantes(f, heure);
  if (m <= 0) return "C’est fini";
  if (m === 1) return "Encore 1 min";
  return `Encore ${m} min`;
}

/** La part écoulée, de 0 à 1 — pour la petite barre qui descend. */
export function partEcoulee(f: Flash, heure: number): number {
  const total = f.fin - f.lance;
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, (heure - f.lance) / total));
}

/**
 * LE FLASH DEVIENT UN MOMENT DE LA JOURNÉE.
 *
 * MÊME MÉCANIQUE QUE TOUT LE RESTE, ET C'EST VOLONTAIRE. « Je ne ferais pas du
 * Flash le cœur de ClikMe : ce serait une mécanique puissante À L'INTÉRIEUR du
 * Direct. » Il entre donc par la même porte qu'une annonce ordinaire — il
 * remonte dans le paquet par sa fraîcheur, il vit dans la journée du commerce,
 * il s'archive le soir avec le reste. Ce qui le distingue est son `flash`, que
 * la carte lit pour se dessiner autrement.
 */
export function momentDuFlash(f: Flash): Omit<MomentJour, "publie"> {
  return {
    de: f.lance,
    a: f.fin,
    quand: `${hhmm(f.lance)} – ${hhmm(f.fin)}`,
    icone: "⚡",
    titre: f.quoi,
    // L'AVANTAGE N'EST PLUS UNE LIGNE DE DÉTAIL — il est passé acteur principal
    // sur la carte (voir `cd-flash-a`). Le laisser ici l'écrirait deux fois,
    // une grosse et une petite, à quinze points d'écart.
    lignes: [],
    // ─── ON NE BARRE UN PRIX QUE SI UN AUTRE LE REMPLACE ───
    //
    // VU À L'ÉCRAN : « 14 € » seul, barré, et rien à côté. Le formulaire
    // pré-remplit le prix du jour dans « avant » ; si le commerçant s'arrête
    // là — ce que fait n'importe qui dont l'avantage est « −20 % » ou « le
    // dessert offert » —, la carte annonçait un prix supprimé sans successeur.
    // Un prix barré tout seul se lit « ce n'est plus valable », c'est-à-dire
    // le contraire exact de ce qu'un Flash veut dire.
    //
    // SANS PRIX D'APRÈS, LE PRIX RESTE UN PRIX. La chute, elle, est dite par
    // l'avantage, et il a désormais sa place à lui sur la carte.
    prix: f.apres ? prixEcrit(f.apres) : f.avant ? prixEcrit(f.avant) : undefined,
    prixBarre: f.apres && f.avant ? prixEcrit(f.avant) : undefined,
    photo: f.photo || undefined,
    places: f.combien || undefined,
    // PAS D'ÉTIQUETTE « FLASH » : LA PASTILLE LE DIT DÉJÀ. Vu à l'écran, l'un
    // sous l'autre — la pastille ambre « ⚡ FLASH · Encore 30 min », puis le mot
    // FLASH en petites capitales six points plus bas. C'est le métier qui
    // reprend sa place là, et il dit quelque chose de neuf.
    etiquette: undefined,
    action: "J’en profite",
    envies: [],
    flash: f,
  };
}
