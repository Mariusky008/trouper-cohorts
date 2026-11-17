/**
 * 🚪 OUVRIR UNE CONVERSATION DU SALON, EN UNE REQUÊTE (`docs/univers/salon-du-duo.md`, section 7.4 ; lot S0b) :
 * `GET /api/direct/proches?ouvrir=<clé>` rend le fil, la vie de la conversation et la scène, au lieu de trois lectures
 * à la suite (`?fil=`, `?vivant=`, la pièce) — et les images de la scène à adresse stable (`salon-fichiers-serveur.ts`).
 *
 * La pièce du duo : le salon tant que le duo n'en a pas choisi une (le lot S2, section 4.13), dans la lumière de l'heure
 * de Paris (la sienne si cette lumière n'est pas encore faite).
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { assisesDe, emplacementsValides, hauteurDuo, momentDuoDe, pieceDuoDe, pieceDuoValide, PLACES_PAR_DEFAUT, type EmplacementsDuo, type MomentDuo, type PieceDuo } from "./pieces-duo";
import { depotDans } from "./ma-figurine-serveur";
import { imageSalon } from "./salon-fichiers-serveur";
import type { CalqueFigurine, OuvertureSalon, SceneSalon } from "./salon";
import { filAvec, hDeCle } from "./talkie-serveur";
import { vivantAvec } from "./vivant-serveur";
import { calquesDeFigurine } from "./calques-figurine-serveur";
import { poserFigurine, type FigurineLocale } from "./figurine-calques";

type Supabase = ReturnType<typeof createAdminClient>;

/** L'heure de Paris (0 à 23). */
export const heureDeParis = (d = new Date()) => Number(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hour12: false, timeZone: "Europe/Paris" }).format(d)) % 24;
/** La pièce d'un duo qui n'en a pas encore choisi (section 4.13, lot S2). */
export const PIECE_PAR_DEFAUT: PieceDuo = "salon";

/** (les fichiers d'une pièce, comme `pieces-duo-serveur.ts` les range) */
const dossierPiece = (p: PieceDuo) => `pieces-duo/${p}`;
const nomLumiere = (m: MomentDuo) => `lumiere-${m}.png`;

/**
 * 🛋️ La scène d'une pièce dans une lumière : sa plaque à adresse stable, ses places (en points d'assise), ses
 * emplacements. `null` si la pièce n'est pas encore faite.
 */
export async function sceneDeLaPiece(supabase: Supabase, piece: PieceDuo, moment: MomentDuo): Promise<SceneSalon | null> {
  const d = depotDans(supabase, dossierPiece(piece));
  const noms = await d.lister().catch(() => [] as string[]);
  if (!noms.includes("decor.png")) return null;
  const sien = pieceDuoDe(piece).moment;
  // (la lumière demandée si elle est faite ; sinon celle de la pièce, son décor)
  const m: MomentDuo = moment !== sien && noms.includes(nomLumiere(moment)) ? moment : sien;
  const [plaque, releve] = await Promise.all([
    imageSalon(supabase, `${dossierPiece(piece)}/${m === sien ? "decor.png" : nomLumiere(m)}`),
    noms.includes("releve.json") ? d.lire("releve.json").catch(() => null) : Promise.resolve(null),
  ]);
  if (!plaque) return null;
  type Releve = { emplacements?: unknown; ajuste?: unknown };
  let r: Releve | null = null;
  try {
    r = releve ? (JSON.parse(releve.toString("utf8")) as Releve) : null;
  } catch {
    r = null;
  }
  const emplacements = r?.emplacements ? emplacementsValides(r.emplacements) : null;
  const places = emplacements?.places.length === 2 ? assisesDe([...emplacements.places].sort((a, b) => a.x - b.x), r?.ajuste === true) : PLACES_PAR_DEFAUT;
  return { piece, moment: m, plaque, places, emplacements };
}

/**
 * 🚪 Tout ce qu'il faut pour ouvrir la conversation avec ce proche : le fil, la vie, la scène. Rend aussi ce que la route
 * fait après la réponse (l'aparté d'un échange qui vient de finir, les notes de l'étagère), comme `?vivant=`.
 */
export async function ouvrirSalon(
  supabase: Supabase,
  moi: Habitant,
  cle: unknown,
  maintenant = new Date(),
): Promise<{ ouverture?: OuvertureSalon; aPreparer?: { h: string; pair: string; jusqua: number }; aNoter?: string; aDecouper?: string[]; error?: string; statut?: number }> {
  // (🎭 les calques des deux figurines se lisent en même temps que le reste : une lecture chacune)
  const hP = hDeCle(supabase, cle).catch(() => null);
  const [f, v, scene, h, mienne, sienne] = await Promise.all([
    filAvec(supabase, moi, cle),
    vivantAvec(supabase, moi, cle).catch(() => null),
    sceneDeLaPiece(supabase, PIECE_PAR_DEFAUT, momentDuoDe(heureDeParis(maintenant))).catch(() => null),
    hP,
    calquesDeFigurine(supabase, moi.id, { fabriquer: false }).catch(() => null),
    hP.then((x) => (x ? calquesDeFigurine(supabase, x, { fabriquer: false }) : null)).catch(() => null),
  ]);
  if (!f.fil) return { error: f.error, statut: f.statut };
  // (posées aux deux places ; celles qui manquent sont découpées après la réponse)
  const calques = scene && mienne && sienne ? calquesPoses(scene, mienne, sienne) : null;
  const aDecouper = [...(mienne ? [] : [moi.id]), ...(sienne || !h ? [] : [h])];
  return {
    ouverture: { cle: f.fil.cle, fil: f.fil, vivant: v?.vivant ?? null, scene: scene && calques ? { ...scene, calques } : scene },
    ...(v?.aPreparer ? { aPreparer: v.aPreparer } : {}),
    ...(v?.aNoter ? { aNoter: v.aNoter } : {}),
    ...(aDecouper.length ? { aDecouper } : {}),
  };
}

/**
 * 🪑 Les deux figurines posées aux deux places de la pièce, à la même taille (`hauteurDuo`) : `a`, la mienne, à gauche ;
 * `b`, la sienne, à droite. (Les places de la scène sont des points d'assise.)
 */
export function calquesPoses(scene: Pick<SceneSalon, "places" | "plaque">, mienne: FigurineLocale, sienne: FigurineLocale): { a: CalqueFigurine; b: CalqueFigurine } {
  const [gauche, droite] = [...scene.places].sort((p, q) => p.x - q.x);
  const piece = { largeur: scene.plaque.largeur, hauteur: scene.plaque.hauteur };
  const taille = hauteurDuo(scene.places);
  return { a: poserFigurine(mienne, gauche, piece, { tracee: false, taille }), b: poserFigurine(sienne, droite, piece, { tracee: false, taille }) };
}

// ─── ⚡ LA VITESSE DU SALON (section 7.6) ─────────────────────────────────────────────────────────────────────────────
/** Une ouverture mesurée sur un téléphone : la plaque à l'écran et la scène prête, depuis le toucher (ms). */
export type MesureVitesse = { plaque?: number; pret: number; deja: boolean; appareil: "iPhone" | "Android" | "autre"; ecran?: number };
export type StatsVitesse = {
  ouvertures: number;
  /** médiane et 90 % de « la scène prête », pour une conversation déjà vue sur ce téléphone, et la première fois */
  deja: { n: number; mediane: number; p90: number };
  premiere: { n: number; mediane: number; p90: number };
  parAppareil: Record<string, { n: number; mediane: number }>;
};
const MAX_PAR_JOUR = 500;
const jourDeParis = (d = new Date()) => d.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
const duree = (x: unknown) => {
  const n = Number(x);
  return Number.isFinite(n) && n >= 0 && n < 60_000 ? Math.round(n) : undefined;
};
export const appareilDe = (ua: string): MesureVitesse["appareil"] => (/iPhone|iPad/.test(ua) ? "iPhone" : /Android/.test(ua) ? "Android" : "autre");

/** ⚡ Noter une ouverture (jamais bloquant ; deux en même temps : l'une peut se perdre, c'est une mesure). */
export async function noterVitesse(supabase: Supabase, x: Record<string, unknown>, ua: string, maintenant = new Date()): Promise<boolean> {
  const pret = duree(x.pret);
  if (pret == null) return false;
  const plaque = duree(x.plaque);
  const ecran = duree(x.ecran);
  const m: MesureVitesse = { pret, deja: x.deja === true, appareil: appareilDe(ua), ...(plaque != null ? { plaque } : {}), ...(ecran != null ? { ecran } : {}) };
  const d = depotDans(supabase, "salon/vitesse");
  const nom = `${jourDeParis(maintenant)}.json`;
  let liste: MesureVitesse[] = [];
  try {
    const b = await d.lire(nom);
    liste = b ? (JSON.parse(b.toString("utf8")) as MesureVitesse[]) : [];
  } catch {
    liste = [];
  }
  if (!Array.isArray(liste)) liste = [];
  if (liste.length >= MAX_PAR_JOUR) return false;
  return d.ecrire(nom, Buffer.from(JSON.stringify([...liste, m])), "application/json");
}

const rang = (xs: number[], q: number) => {
  if (!xs.length) return 0;
  const t = [...xs].sort((a, b) => a - b);
  return t[Math.min(t.length - 1, Math.floor(q * t.length))];
};
/** ⚡ Pour l'administrateur : les ouvertures des `jours` derniers jours. */
export async function statsVitesse(supabase: Supabase, jours = 7, maintenant = new Date()): Promise<StatsVitesse> {
  const d = depotDans(supabase, "salon/vitesse");
  const toutes: MesureVitesse[] = [];
  for (let k = 0; k < jours; k++) {
    const b = await d.lire(`${jourDeParis(new Date(maintenant.getTime() - k * 86_400_000))}.json`).catch(() => null);
    try {
      const l = b ? (JSON.parse(b.toString("utf8")) as MesureVitesse[]) : [];
      if (Array.isArray(l)) toutes.push(...l);
    } catch {
      /* un jour illisible : passé */
    }
  }
  const resume = (l: MesureVitesse[]) => ({ n: l.length, mediane: rang(l.map((m) => m.pret), 0.5), p90: rang(l.map((m) => m.pret), 0.9) });
  const parAppareil: StatsVitesse["parAppareil"] = {};
  for (const a of ["iPhone", "Android", "autre"] as const) {
    const l = toutes.filter((m) => m.appareil === a);
    if (l.length) parAppareil[a] = { n: l.length, mediane: rang(l.map((m) => m.pret), 0.5) };
  }
  return { ouvertures: toutes.length, deja: resume(toutes.filter((m) => m.deja)), premiere: resume(toutes.filter((m) => !m.deja)), parAppareil };
}

// ─── ✋ LES EMPLACEMENTS DU SALON (lot S1 ; sections 4.9 et 4.11) ────────────────────────────────────────────────────────
const CLES_SALON = ["fenetreCoins", "fentes"] as const;
/**
 * ✋ Poser les emplacements du salon d'une pièce (les carreaux de la fenêtre en polygone, les fentes de l'étagère), posés à
 * la main sur l'adresse d'essai : SEULEMENT ces deux-là sont remplacés dans son relevé — ses autres zones (la table et les
 * lampes comprises, tracées sur la page des pièces), ses places et la façon de les lire (`ajuste`) restent telles quelles
 * (l'action « ajuster » de la page des pièces, elle, refait tout le relevé « à la main »).
 */
export async function poserEmplacementsSalon(supabase: Supabase, piece: unknown, x: unknown): Promise<{ emplacements?: EmplacementsDuo; erreur?: string }> {
  if (!pieceDuoValide(piece)) return { erreur: "Quelle pièce ?" };
  const d = depotDans(supabase, dossierPiece(piece));
  const noms = await d.lister().catch(() => [] as string[]);
  if (!noms.includes("decor.png")) return { erreur: "La pièce n’est pas encore faite." };
  let releve: Record<string, unknown> = {};
  if (noms.includes("releve.json")) {
    try {
      const b = await d.lire("releve.json");
      releve = b ? (JSON.parse(b.toString("utf8")) as Record<string, unknown>) : {};
    } catch {
      return { erreur: "Le relevé de la pièce ne se lit pas." };
    }
  }
  const r = (x ?? {}) as Record<string, unknown>;
  const neufs = emplacementsValides({ cadres: [], places: [], fenetreCoins: r.fenetreCoins, fentes: r.fentes });
  const garde: Record<string, unknown> = { ...((releve.emplacements ?? {}) as Record<string, unknown>) };
  for (const k of CLES_SALON) {
    delete garde[k];
    if (neufs[k]) garde[k] = neufs[k];
  }
  const ok = await d.ecrire("releve.json", Buffer.from(JSON.stringify({ ...releve, emplacements: garde, salonLe: new Date().toISOString() })), "application/json");
  return ok ? { emplacements: emplacementsValides(garde) } : { erreur: "Pas enregistré : réessaie." };
}
