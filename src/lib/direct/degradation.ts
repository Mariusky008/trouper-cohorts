// LES TROIS RÈGLES DE DÉGRADATION.
//
// Les écrans du Direct supposent des données qui n'existeront pas au lancement :
// du volume, une position, un historique. Sans ces règles, l'application paraît
// vide ou cassée à la première ouverture — et une première ouverture ratée ne se
// rattrape pas.
//
// Elles vivent ici, en fonctions pures, pour deux raisons : elles se testent
// sans base ni navigateur, et le jour où le volume arrive, ce sont ces
// fonctions-là qu'on relit — pas trois composants d'affichage.
import type { Publication } from "./publications";

// ─────────────────────────────────────────────────────────────────────────────
// 1. LE COMPTEUR
//
// « 24 choses se passent aujourd'hui » est excellent à 24. À 3, c'est un aveu de
// faiblesse — et c'est exactement ce qu'on aura au lancement avec vingt
// commerçants. Un compteur qui affiche un petit nombre fait plus de mal que pas
// de compteur du tout.
// ─────────────────────────────────────────────────────────────────────────────

export const SEUIL_COMPTEUR_DEFAUT = 12;

export type Pouls = {
  /** Vrai = on peut montrer le chiffre. Faux = formulation qualitative seule. */
  chiffre: boolean;
  /** Le nombre à afficher (0 si `chiffre` est faux). */
  n: number;
  /** La phrase principale, déjà accordée et au bon temps. */
  phrase: string;
  /** La ligne de contexte sous le compteur. */
  sous: string;
  /** Vrai = le fil doit être lu sur sept jours plutôt que sur la journée. */
  fenetreLarge: boolean;
  pres: number;
  bientot: number;
  places: number;
};

/**
 * L'heure qu'il est CHEZ L'HABITANT, pas sur le serveur.
 *
 * Le serveur tourne en UTC. `getHours()` y renvoyait 18 h alors qu'il est 20 h
 * à Dax : le fil basculait au passé deux heures trop tard, et le début de
 * journée — celui qui décide de « x choses se passent aujourd'hui » — sautait à
 * 2 h du matin en été. Même raison que dans `alertes.ts`, même correction.
 */
const ZONE = "Europe/Paris";

/** L'heure dans la ville, pas celle du serveur. Exportée parce qu'un deuxième
 *  module en a besoin : recopiée, elle finirait par diverger — et c'est
 *  exactement le bug qu'on a déjà eu deux fois avec le fuseau. */
export function heureLocale(quand: Date): number {
  try {
    const p = new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: ZONE }).formatToParts(quand);
    const n = Number(p.find((x) => x.type === "hour")?.value);
    return Number.isFinite(n) ? n % 24 : quand.getUTCHours();
  } catch {
    return quand.getUTCHours();
  }
}

/**
 * Le début de la journée LOCALE, en instant absolu.
 *
 * Calculé en retranchant le temps écoulé depuis minuit chez l'habitant. Pas de
 * construction de date à partir d'une chaîne : c'est ce qui casse aux
 * changements d'heure, où une journée fait 23 ou 25 heures.
 */
function debutDuJour(quand: Date): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: ZONE,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(quand);
    const lire = (t: string) => Number(parts.find((x) => x.type === t)?.value ?? NaN);
    const h = lire("hour") % 24;
    const m = lire("minute");
    const sec = lire("second");
    if (![h, m, sec].every(Number.isFinite)) return quand.getTime();
    return quand.getTime() - (h * 3600 + m * 60 + sec) * 1000 - quand.getMilliseconds();
  } catch {
    return quand.getTime();
  }
}

/** Après 18 h, la journée est derrière : le fil se raconte au passé. */
function auPasse(maintenant: Date): boolean {
  return heureLocale(maintenant) >= 18;
}

/**
 * Le pouls, à partir des publications VIVANTES de la ville.
 *
 * `pres` n'est comptable que si la distance l'est : sans position ni secteur, on
 * renvoie 0 et l'écran masque le sous-compteur plutôt que d'annoncer « 0 près de
 * vous », qui se lit comme « il n'y a rien autour de vous ».
 */
export function calculerPouls(
  publications: Publication[],
  opts: {
    seuil?: number;
    ville: string;
    maintenant?: Date;
    /** Distances en mètres, par id de publication. Absent = non calculable. */
    distances?: Map<string, number>;
    rayonM?: number;
  }
): Pouls {
  const maintenant = opts.maintenant ?? new Date();
  const seuil = opts.seuil ?? SEUIL_COMPTEUR_DEFAUT;
  const t = maintenant.getTime();

  const debutJour = debutDuJour(maintenant);
  const duJour = publications.filter((p) => Date.parse(p.publieLe) >= debutJour);

  const n = duJour.length;
  const chiffre = n >= seuil;

  const rayon = opts.rayonM ?? 2000;
  const pres = opts.distances
    ? publications.filter((p) => {
        const d = opts.distances!.get(p.id);
        return typeof d === "number" && d <= rayon;
      }).length
    : 0;

  // « Finit bientôt » = une échéance dans les deux heures. En deçà, l'urgence
  // n'est pas ressentie ; au-delà, tout finit « bientôt » et le mot ne veut plus
  // rien dire.
  const bientot = publications.filter((p) => {
    if (!p.expireLe) return false;
    const e = Date.parse(p.expireLe);
    return Number.isFinite(e) && e > t && e - t <= 2 * 3600 * 1000;
  }).length;

  const places = publications.filter((p) => p.famille === "place").length;

  const passe = auPasse(maintenant);
  const phrase = chiffre
    ? passe
      ? `${n} ${n > 1 ? "choses se sont passées" : "chose s'est passée"} aujourd'hui`
      : `${n} ${n > 1 ? "choses se passent" : "chose se passe"} aujourd'hui`
    : `${opts.ville} est actif`;

  const sous = chiffre
    ? passe
      ? "Le fil se calme — à demain"
      : `${opts.ville} est actif — le fil bouge encore`
    : publications.length > 0
      ? "Ce qui se passe cette semaine près de chez vous"
      : "Les premiers commerces arrivent";

  return { chiffre, n: chiffre ? n : 0, phrase, sous, fenetreLarge: !chiffre, pres, bientot, places };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. LA DISTANCE
//
// Elle exige la géolocalisation, que beaucoup refusent. Ne jamais afficher une
// carte sans repère spatial, et ne jamais bloquer l'usage sur une demande de
// position.
// ─────────────────────────────────────────────────────────────────────────────

/** Distance à vol d'oiseau, en mètres. Haversine — largement assez précis pour
 *  une échelle de ville, et sans dépendance. */
export function metresEntre(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
}

/** « 280 m » · « 1,2 km ». En dessous de 100 m on arrondit à 50 : afficher
 *  « 37 m » suggère une précision que la géolocalisation n'a pas. */
export function distanceCourte(m: number): string {
  if (m < 100) return `${Math.max(50, Math.round(m / 50) * 50)} m`;
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  return `${(m / 1000).toFixed(1).replace(".", ",")} km`;
}

/**
 * Le repère spatial d'une carte, avec ses trois niveaux de repli.
 *
 * Position autorisée → la distance. Sinon le quartier du commerce, sinon celui
 * choisi par l'habitant, sinon le nom de la ville. Le dernier niveau est
 * toujours disponible : une carte a donc toujours son repère.
 */
export function repereSpatial(
  p: Publication,
  ctx: { moi?: { lat: number; lng: number } | null; quartierHabitant?: string; ville: string }
): string {
  if (ctx.moi && p.lat != null && p.lng != null) {
    return distanceCourte(metresEntre(ctx.moi.lat, ctx.moi.lng, p.lat, p.lng));
  }
  if (p.quartier) return p.quartier;
  if (ctx.quartierHabitant) return ctx.quartierHabitant;
  return ctx.ville;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. LE RADAR « CE QUI VAUT LE COUP MAINTENANT »
//
// Il suppose position, goûts, historique et commerces suivis. Au lancement,
// aucun de ces signaux n'existe : le radar renverrait exactement le même contenu
// que le fil, et le bouton perdrait sa crédibilité au premier essai.
//
// Le tri sans signal personnel est objectif — ce qui expire le plus tôt, puis le
// plus proche, puis le plus récent. C'est déjà utile et honnête. La
// personnalisation s'ajoute ensuite SANS CHANGER L'ÉCRAN : mêmes cartes,
// meilleur tri.
// ─────────────────────────────────────────────────────────────────────────────

/** Jamais plus de huit. Une sélection qui en contient trente n'est plus une
 *  sélection — c'est le fil avec une autre mise en page. */
export const MAX_SELECTION = 8;

export type SignauxPersonnels = {
  /** Position de l'habitant, si accordée. */
  moi?: { lat: number; lng: number } | null;
  /** Identifiants des commerces suivis : leurs publications passent devant. */
  suivis?: Set<string>;
  /** Catégories choisies dans l'onglet Moi (libellés de métier). */
  categories?: Set<string>;
};

export function selection(publications: Publication[], s: SignauxPersonnels = {}): Publication[] {
  const t = Date.now();
  const INFINI = Number.MAX_SAFE_INTEGER;

  const score = (p: Publication) => {
    const expire = p.expireLe ? Date.parse(p.expireLe) : NaN;
    const echeance = Number.isFinite(expire) ? expire - t : INFINI;
    const dist =
      s.moi && p.lat != null && p.lng != null ? metresEntre(s.moi.lat, s.moi.lng, p.lat, p.lng) : INFINI;
    const publie = Date.parse(p.publieLe);
    // Les signaux personnels n'entrent que s'ils existent — ils déplacent le
    // classement, ils ne le remplacent pas. Le tri objectif reste le socle.
    const suivi = s.suivis?.size && p.siteId && s.suivis.has(p.siteId) ? 0 : 1;
    const categorie = s.categories?.size ? (s.categories.has(p.auteurMetier) ? 0 : 1) : 0;
    return { suivi, categorie, echeance, dist, publie: Number.isFinite(publie) ? publie : 0 };
  };

  return publications
    .map((p) => ({ p, s: score(p) }))
    .sort(
      (a, b) =>
        a.s.suivi - b.s.suivi ||
        a.s.categorie - b.s.categorie ||
        a.s.echeance - b.s.echeance ||
        a.s.dist - b.s.dist ||
        b.s.publie - a.s.publie
    )
    .slice(0, MAX_SELECTION)
    .map((x) => x.p);
}
