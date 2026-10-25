/**
 * 📒 LE CARNET DU COMPTOIR — ceux qui ont libéré leur fantôme à la fin de ses films.
 *
 * C'est l'étape 2 des cages (`docs/les-cages.md`). À la fin d'un film, l'habitant
 * libère une cage : « J'adore la vidéo », « Je viendrai un jour », « Je réserve /
 * Je passe aujourd'hui ». Le commerçant, lui, a besoin de savoir QUI, et de quoi
 * il en est avec chacun : c'est le carnet.
 *
 * UNE LIGNE PAR PERSONNE, avec la cage qu'elle a libérée EN DERNIER (une cage par
 * film ; d'un film à l'autre, la plus récente dit où elle en est), le prénom et le
 * fantôme qu'elle avait, combien de ses films elle a vus jusqu'au bout. Si elle
 * veut être prévenue sur WhatsApp, et si elle a dit stop. Ses passages, que le
 * commerçant note d'un geste (« ✓ Passage aujourd'hui »).
 *
 * JAMAIS SON NUMÉRO. Le carnet n'en a pas besoin : le message, c'est l'étape
 * d'après, et il partira du WhatsApp du commerçant, pas de ClikMe.
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : aucun accès à la base ici.
 */
import { libellesCages, type Cage } from "./cages";

export type LigneCarnet = {
  /** La référence de la ligne pour la route (sa dernière cage) — jamais l'identité de la personne. */
  ref: string;
  prenom: string;
  /** Son fantôme (`lib/direct/look.ts`), vide s'il n'en avait pas. */
  look: string;
  cage: Cage;
  /** Quand elle a libéré cette cage (ISO). */
  le: string;
  /** Combien de ses films elle a vus jusqu'au bout (une cage libérée chacun). */
  films: number;
  /** Elle veut être prévenue sur WhatsApp, et n'a pas dit stop. */
  prevenir: boolean;
  /** Elle a dit stop : on ne lui propose plus rien, pour ce commerce. */
  stop: boolean;
  /** Ses passages notés au comptoir, et le dernier jour (« 2026-10-25 », heure de Paris). */
  passages: number;
  dernierPassage: string | null;
  /** Les messages que le commerçant lui a envoyés depuis le comptoir, le plus récent d'abord (5 au plus) :
   *  quand, et le petit plus offert (vide s'il n'y en avait pas). Voir `lib/direct/previens-les.ts`. */
  messages: MessageEnvoye[];
};

export type MessageEnvoye = { le: string; plus: string };

/** L'ordre des groupes du carnet : c'est décidé, puis la promesse, puis l'envie. */
export const ORDRE_CAGES: Cage[] = ["aujourdhui", "un-jour", "adore"];

/** Le titre d'un groupe : le mot de la cage, tel que la personne l'a lu (« Je réserve aujourd'hui »). */
export function titreDuGroupe(cage: Cage, branche: string): string {
  return libellesCages(branche)[cage].replace("\n", " ");
}

/** Ce que veut dire le groupe, en une ligne, sous son titre. */
export function sensDuGroupe(cage: Cage): string {
  if (cage === "aujourdhui") return "C’est décidé : ils ont dit venir le jour même.";
  if (cage === "un-jour") return "Une promesse de venir, sans date.";
  return "Ce que tu montres leur plaît. Rien n’est promis.";
}

/** Les chiffres de la carte de l'accueil. Les promesses : « un jour » et « aujourd'hui », sans les stops. */
export function resumeDuCarnet(lignes: LigneCarnet[]) {
  const vivantes = lignes.filter((l) => !l.stop);
  const n = (c: Cage) => vivantes.filter((l) => l.cage === c).length;
  return {
    personnes: lignes.length,
    promesses: n("un-jour") + n("aujourdhui"),
    aujourdhui: n("aujourdhui"),
    unJour: n("un-jour"),
    adore: n("adore"),
    aPrevenir: vivantes.filter((l) => l.prevenir).length,
    venues: lignes.filter((l) => l.passages > 0).length,
  };
}

/** « à l'instant », « il y a 3 h », « hier », « il y a 4 jours », « le 12 octobre ». */
export function quandEnClair(iso: string, maintenant = Date.now()): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const min = Math.round((maintenant - t) / 60_000);
  if (min < 2) return "à l’instant";
  if (min < 60) return `il y a ${min} min`;
  if (min < 24 * 60) return `il y a ${Math.round(min / 60)} h`;
  if (min < 48 * 60) return "hier";
  if (min < 7 * 24 * 60) return `il y a ${Math.floor(min / (24 * 60))} jours`;
  return `le ${new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" })}`;
}

/** « 1 passage », « 3 passages » — et le dernier, s'il n'est pas d'aujourd'hui. */
export function passagesEnClair(l: LigneCarnet, aujourdhui: string): string {
  if (!l.passages) return "";
  const n = `${l.passages} ${l.passages > 1 ? "passages" : "passage"}`;
  if (!l.dernierPassage || l.dernierPassage === aujourdhui) return n;
  const d = new Date(`${l.dernierPassage}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });
  return `${n} · le dernier le ${d}`;
}

/** « 2026-10-25 » → le même jour, moins `n` jours. */
function jourMoins(jour: string, n: number): string {
  const d = new Date(`${jour}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

// ═══ LE CARNET DE LA DÉMONSTRATION ═══════════════════════════════════════
//
// Un commerce du comptoir de démonstration n'existe que dans ce téléphone : son
// carnet est rempli de prénoms inventés, pour qu'on voie ce que ça donne. Les
// gestes (un passage, un stop) se gardent dans le téléphone.

type Graine = {
  prenom: string;
  look: string;
  cage: Cage;
  heures: number;
  films: number;
  prevenir?: boolean;
  passages?: number;
  joursDepuis?: number;
  /** Un message déjà envoyé, il y a tant de jours, avec ce petit plus. */
  message?: { jours: number; plus: string };
};
const GRAINES: Graine[] = [
  { prenom: "Camille", look: "fleuri", cage: "aujourdhui", heures: 1, films: 3, passages: 2, joursDepuis: 9 },
  { prenom: "Hugo", look: "denim", cage: "aujourdhui", heures: 4, films: 1 },
  { prenom: "Inès", look: "artiste", cage: "aujourdhui", heures: 27, films: 2, passages: 1, joursDepuis: 1 },
  { prenom: "Manon", look: "cosy", cage: "un-jour", heures: 2, films: 1, prevenir: true },
  { prenom: "Nathan", look: "curieux", cage: "un-jour", heures: 20, films: 2, prevenir: true, message: { jours: 3, plus: "le café" } },
  { prenom: "Sarah", look: "lecteur", cage: "un-jour", heures: 52, films: 1 },
  { prenom: "Jules", look: "voyageur", cage: "un-jour", heures: 98, films: 1, prevenir: true },
  { prenom: "Zoé", look: "soleil", cage: "adore", heures: 3, films: 4, passages: 3, joursDepuis: 5 },
  { prenom: "Adam", look: "melomane", cage: "adore", heures: 9, films: 1 },
  { prenom: "Chloé", look: "jardinier", cage: "adore", heures: 30, films: 2 },
  { prenom: "Louis", look: "flaneur", cage: "adore", heures: 75, films: 1 },
  { prenom: "Emma", look: "rebelle", cage: "adore", heures: 140, films: 1 },
];

/** Le carnet inventé d'un commerce de démonstration, daté par rapport à maintenant. */
export function carnetDemo(maintenant: number, aujourdhui: string): LigneCarnet[] {
  return GRAINES.map((g, i) => ({
    ref: `demo-${i}`,
    prenom: g.prenom,
    look: g.look,
    cage: g.cage,
    le: new Date(maintenant - g.heures * 3_600_000).toISOString(),
    films: g.films,
    prevenir: Boolean(g.prevenir),
    stop: false,
    passages: g.passages ?? 0,
    dernierPassage: g.passages ? jourMoins(aujourdhui, g.joursDepuis ?? 0) : null,
    messages: g.message ? [{ le: new Date(maintenant - g.message.jours * 86_400_000).toISOString(), plus: g.message.plus }] : [],
  }));
}
