/**
 * 📅 LE PLANNING DES ANNONCES — préparer la semaine ou le mois en une fois.
 *
 * « Que les commerçants puissent préparer un jour du mois toute la semaine ou
 * tout le mois à l'avance, pour ne pas avoir à le faire tous les jours. Avec
 * une annonce qui tourne plusieurs jours d'affilée s'il le souhaite : une
 * veste pourrait rester 4 jours en annonce, une soirée annoncée le mardi pour
 * samedi soir resterait plusieurs jours avant. »
 *
 * ─── UNE ANNONCE PROGRAMMÉE N'EXISTE NULLE PART AILLEURS ─────────────────
 *
 * Elle attend dans SA fiche (`diagnostic.planning`), et rien d'autre ne la
 * voit. Le jour venu, elle est publiée par le chemin de toujours — le fil de
 * la ville, le bandeau de sa page, son plat ou sa pièce à essayer — voir
 * `planning-activation.ts`. On ne l'écrit PAS d'avance, datée dans le futur,
 * dans la table des annonces : une quinzaine d'écrans la lisent (le fil, les
 * menus du jour, les compteurs, les alertes, le plan du site…), et un seul
 * oubli l'aurait montrée avant l'heure.
 *
 * ─── LES TROIS RÈGLES ─────────────────────────────────────────────────────
 *
 *   · SEPT JOURS AU PLUS. Au-delà, Le Direct deviendrait le catalogue qu'il
 *     refuse d'être (voir `publications.ts`).
 *   · UN MOIS À L'AVANCE AU PLUS — son premier jour, pas son dernier.
 *   · TROIS ANNONCES PAR JOUR AU PLUS : la même borne que celles qui tournent
 *     déjà ensemble (`MAX_VIVANTES` de la route des annonces). Au-delà, la
 *     plus ancienne s'effacerait d'elle-même le jour venu ; on le dit plutôt
 *     au moment de programmer.
 *
 * ─── EN JOURS, À L'HEURE DE PARIS ─────────────────────────────────────────
 *
 * Il pense en jours : « à partir de mardi, pendant 4 jours ». Une annonce
 * s'ouvre à minuit le premier jour et se ferme à 23 h 59 le dernier, heure de
 * Paris (Vevey a la même) — le serveur, lui, peut tourner n'importe où.
 *
 * FICHIER PARTAGÉ : aucune dépendance au serveur.
 */
import { jourParis } from "@/lib/jour-paris";

export const DUREE_MAX_JOURS = 7;
export const HORIZON_JOURS = 31;
export const MAX_PAR_JOUR = 3;
/** Ce qu'il peut garder d'avance : un mois plein, trois par jour, et de la marge. */
export const MAX_PROGRAMMEES = 90;

/** La famille du fil de la ville : le plat du jour d'un restaurant, une annonce pour les autres — comme « Publier ». */
export type FamillePlanifiee = "offre" | "menu";

export type AnnoncePlanifiee = {
  id: string;
  texte: string;
  famille: FamillePlanifiee;
  /** La photo, rangée chez nous (https) — jamais un `data:` dans sa fiche. */
  photo: string;
  /** « 89 € », tel qu'il l'écrit. */
  prix?: string;
  /** Son premier jour, « 2026-10-14 » (Paris). */
  jour: string;
  /** Combien de jours elle tourne, de 1 à 7. */
  jours: number;
  /** ISO — minuit, son premier jour. */
  debut: string;
  /** ISO — 23 h 59, son dernier jour. */
  fin: string;
  /** Les copies « chaque semaine » portent le même repère : on peut les retirer ensemble. */
  serie?: string;
  /** Préparée au comptoir : le jour venu, elle part par les mêmes portes que « Publier ». */
  comptoir?: ComptoirPlanifie;
  creeLe: string;
};

/**
 * CE QUE LE COMPTOIR A PRÉPARÉ — son plat, sa pièce, son livre, tels que la
 * mission les a recueillis. Le jour venu, ça part comme si le commerçant
 * touchait « Publier » ce matin-là (voir `comptoir-en-ligne.ts`) : le plat du
 * jour avec sa voix dans son Expérience, la pièce dans son essayage, et
 * l'annonce dans Le Direct. Photos et voix sont rangées chez nous au moment
 * de programmer : rien d'autre que des adresses https ici.
 */
export type ComptoirPlanifie = {
  nom: string;
  prix?: string;
  /** La première fait l'annonce ; le plat en garde quatre. */
  photos: string[];
  voix?: string;
  voixSecondes?: number;
  voixTexte?: string;
  /** Le plat du jour de son Expérience (restaurant). */
  plat?: boolean;
  /** La pièce à essayer, ou le livre conseillé : le rayon de son catalogue. */
  rayon?: string;
  /** Ce que l'essayage pose sur le client — absent chez le libraire. */
  decrire?: string;
};

/** Le stockage du projet — en http seulement en local, avec le faux serveur ; https partout ailleurs. */
const STOCKAGE = `${String(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "")}/storage/v1/object/public/`;

/** Une adresse rangée chez nous (ou en https) — jamais un `data:` ni une adresse en clair d'ailleurs. */
export function adresseSure(v: unknown, max = 600): string {
  const u = s(v);
  if (/^https:\/\//i.test(u) || (STOCKAGE.length > 30 && u.startsWith(STOCKAGE))) return u.slice(0, max);
  return "";
}

/** Ce que le comptoir a préparé, tel que sa fiche le garde. */
function lireComptoir(v: unknown): ComptoirPlanifie | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const nom = s(o.nom).slice(0, 80);
  const photos = (Array.isArray(o.photos) ? o.photos : []).map((x) => adresseSure(x)).filter(Boolean).slice(0, 4);
  if (!nom || !photos.length) return undefined;
  const secondes = Math.round(Number(o.voixSecondes));
  const voix = adresseSure(o.voix);
  return {
    nom,
    photos,
    ...(s(o.prix) ? { prix: s(o.prix).slice(0, 20) } : {}),
    ...(voix ? { voix, ...(secondes > 0 ? { voixSecondes: secondes } : {}) } : {}),
    ...(s(o.voixTexte) ? { voixTexte: s(o.voixTexte).slice(0, 400) } : {}),
    ...(o.plat === true ? { plat: true } : {}),
    ...(s(o.rayon) ? { rayon: s(o.rayon).slice(0, 40) } : {}),
    ...(s(o.decrire) ? { decrire: s(o.decrire).slice(0, 300) } : {}),
  };
}

/** Une annonce du planning déjà mise en ligne, et qui court encore : de quoi rendre son bandeau. */
export type AnnonceEnCours = { id: string; texte: string; photo: string; debut: string; fin: string };

const s = (v: unknown) => String(v ?? "").trim();
const JOUR = /^\d{4}-\d{2}-\d{2}$/;
const FAMILLES = new Set<string>(["offre", "menu"]);

/** « 2026-10-14 » + n jours, en calendrier pur (aucun fuseau en jeu). */
export function ajouterJours(jour: string, n: number): string {
  const [a, m, j] = jour.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, j + n)).toISOString().slice(0, 10);
}

/** Le décalage de Paris par rapport à UTC à cet instant, en minutes (60 l'hiver, 120 l'été). */
function decalageParis(t: number): number {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(t));
  const n = (k: string) => Number(p.find((x) => x.type === k)?.value ?? 0);
  const commeUtc = Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute"));
  return Math.round((commeUtc - Math.floor(t / 60000) * 60000) / 60000);
}

/** L'instant où Paris lit `jour` à `h` h `m` — deux passes suffisent, même un jour de changement d'heure. */
export function instantParis(jour: string, h: number, m: number): string {
  const [a, mo, j] = jour.split("-").map(Number);
  const mur = Date.UTC(a, mo - 1, j, h, m);
  let t = mur - decalageParis(mur) * 60000;
  t = mur - decalageParis(t) * 60000;
  return new Date(t).toISOString();
}

/** Minuit le premier jour, 23 h 59 le dernier. */
export function bornes(jour: string, jours: number): { debut: string; fin: string } {
  return { debut: instantParis(jour, 0, 0), fin: instantParis(ajouterJours(jour, jours - 1), 23, 59) };
}

/** Les jours qu'elle couvre, du premier au dernier. */
export function joursCouverts(a: { jour: string; jours: number }): string[] {
  return Array.from({ length: a.jours }, (_, i) => ajouterJours(a.jour, i));
}

/** Les jours (Paris) qu'une annonce DÉJÀ en ligne occupe encore : de son début, ou d'aujourd'hui, à sa fin. */
export function joursDeLaFin(debut: string, fin: string | null, maintenant = new Date()): string[] {
  const aujourdhui = jourParis(maintenant);
  const d = Date.parse(debut);
  // SANS ÉCHÉANCE, ELLE TOURNE TROIS JOURS — la règle du fil (`FENETRE_SANS_ECHEANCE_MS`).
  const f = fin ? Date.parse(fin) : Number.isFinite(d) ? d + 3 * 24 * 3600 * 1000 : NaN;
  if (!Number.isFinite(f) || f <= maintenant.getTime()) return [];
  const dernier = jourParis(new Date(f));
  const premier = Number.isFinite(d) && jourParis(new Date(d)) > aujourdhui ? jourParis(new Date(d)) : aujourdhui;
  const out: string[] = [];
  for (let j = premier; j <= dernier && out.length < 40; j = ajouterJours(j, 1)) out.push(j);
  return out;
}

/** Son planning tel que sa fiche le garde — rien de mal formé. */
export function lirePlanning(diag: unknown): AnnoncePlanifiee[] {
  const d = (diag && typeof diag === "object" ? diag : {}) as Record<string, unknown>;
  const brutes = Array.isArray(d.planning) ? d.planning : [];
  const out: AnnoncePlanifiee[] = [];
  for (const x of brutes) {
    const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
    const id = s(o.id).slice(0, 60);
    const texte = s(o.texte).slice(0, 140);
    const photo = adresseSure(o.photo) || (/^\/[a-z0-9/_.-]+$/i.test(s(o.photo)) ? s(o.photo).slice(0, 600) : "");
    const jour = s(o.jour);
    const jours = Math.round(Number(o.jours));
    if (!id || !texte || !photo || !JOUR.test(jour) || !(jours >= 1 && jours <= DUREE_MAX_JOURS)) continue;
    const b = bornes(jour, jours);
    const comptoir = lireComptoir(o.comptoir);
    out.push({
      id,
      texte,
      famille: FAMILLES.has(s(o.famille)) ? (s(o.famille) as FamillePlanifiee) : "offre",
      photo,
      ...(s(o.prix) ? { prix: s(o.prix).slice(0, 20) } : {}),
      jour,
      jours,
      debut: b.debut,
      fin: b.fin,
      ...(s(o.serie) ? { serie: s(o.serie).slice(0, 40) } : {}),
      ...(comptoir ? { comptoir } : {}),
      creeLe: s(o.creeLe) || new Date(0).toISOString(),
    });
  }
  return out.sort((a, b) => a.debut.localeCompare(b.debut)).slice(0, MAX_PROGRAMMEES);
}

/** Celles du planning déjà en ligne, et qui courent encore. */
export function lireEnCours(diag: unknown, maintenant = Date.now()): AnnonceEnCours[] {
  const d = (diag && typeof diag === "object" ? diag : {}) as Record<string, unknown>;
  const brutes = Array.isArray(d.planning_en_cours) ? d.planning_en_cours : [];
  const out: AnnonceEnCours[] = [];
  for (const x of brutes) {
    const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
    const fin = s(o.fin);
    if (!s(o.id) || !s(o.texte) || !(Date.parse(fin) > maintenant)) continue;
    out.push({ id: s(o.id).slice(0, 60), texte: s(o.texte).slice(0, 140), photo: s(o.photo).slice(0, 600), debut: s(o.debut), fin });
  }
  return out.slice(0, 20);
}

/**
 * CE QU'ON PEUT PROGRAMMER : à partir d'aujourd'hui, un mois au plus, sept jours au plus.
 * Rend la phrase à lui dire, ou `null` quand c'est bon.
 */
export function verifierDates(jour: string, jours: number, maintenant = new Date()): string | null {
  if (!JOUR.test(jour)) return "Choisissez le jour où elle commence.";
  if (!(Number.isInteger(jours) && jours >= 1)) return "Choisissez combien de jours elle tourne.";
  if (jours > DUREE_MAX_JOURS) return `Une annonce tourne ${DUREE_MAX_JOURS} jours au plus.`;
  const aujourdhui = jourParis(maintenant);
  if (jour < aujourdhui) return "Ce jour est déjà passé.";
  if (jour > ajouterJours(aujourdhui, HORIZON_JOURS)) return "On peut programmer jusqu’à un mois à l’avance.";
  return null;
}

/** Combien d'annonces tournent chaque jour : celles du planning, et celles déjà en ligne. */
export function chargeParJour(
  planning: { jour: string; jours: number }[],
  enLigne: { debut: string; fin: string | null }[] = [],
  maintenant = new Date(),
): Map<string, number> {
  const c = new Map<string, number>();
  const compter = (j: string) => c.set(j, (c.get(j) ?? 0) + 1);
  for (const a of planning) joursCouverts(a).forEach(compter);
  for (const a of enLigne) joursDeLaFin(a.debut, a.fin, maintenant).forEach(compter);
  return c;
}

/** Le premier jour plein, ou `null` : « Le jeudi 16 octobre a déjà 3 annonces. » */
export function jourPlein(nouvelle: { jour: string; jours: number }, charge: Map<string, number>): string | null {
  for (const j of joursCouverts(nouvelle)) if ((charge.get(j) ?? 0) >= MAX_PAR_JOUR) return j;
  return null;
}

/** « jeudi 16 octobre » — un jour du planning, comme il le dit. */
export function jourEnClair(jour: string): string {
  const d = new Date(`${jour}T12:00:00Z`);
  return d.toLocaleDateString("fr-FR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
}

