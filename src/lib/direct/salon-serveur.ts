/**
 * 🚪 OUVRIR UNE CONVERSATION DU SALON, EN UNE REQUÊTE (`docs/univers/salon-du-duo.md`, section 7.4 ; lot S0b) :
 * `GET /api/direct/proches?ouvrir=<clé>` rend le fil, la vie de la conversation et la scène, au lieu de trois lectures
 * à la suite (`?fil=`, `?vivant=`, la pièce) — et les images de la scène à adresse stable (`salon-fichiers-serveur.ts`).
 *
 * La pièce du duo (le lot S2, section 4.13 ; `fils/<paire>/piece.json`) : celle qu'il a choisie ; sinon, on lui propose
 * celle de celui qui ouvre la conversation en premier (la pièce de sa maison), ou le salon — dans la lumière de l'heure de
 * Paris (la sienne si cette lumière n'est pas encore faite). On en change à tout moment ; si l'autre est là, c'est une
 * invitation (« Venir » / « Pas maintenant »), qu'il voit à son prochain pouls (`pouls-serveur.ts`).
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { assisesDe, emplacementsValides, hauteurDuo, momentDuoDe, pieceDuoDe, pieceDuoValide, PIECES_DUO, PLACES_PAR_DEFAUT, type EmplacementsDuo, type MomentDuo, type PieceDuo } from "./pieces-duo";
import { depotDans, ecrireJson, lireJson } from "./ma-figurine-serveur";
import { imageSalon } from "./salon-fichiers-serveur";
import type { CalqueFigurine, CataloguePieces, Flamme, OuvertureSalon, PieceDuSalon, SceneSalon } from "./salon";
import { LA_MS, cheminLa, cheminLus, cheminReglages, filAvec, hDeCle, noter, nomsDuFil, pairDe, qui8, seParlent } from "./talkie-serveur";
import { lireSaPiece } from "./ma-maison-serveur";
import { ordreDuCatalogue } from "./ma-maison";
import { sesDixHuitAns } from "./majorite-serveur";
import { cheminGestes, cheminGestesVus, lireTable, vivantAvec } from "./vivant-serveur";
import { chatDuSalon } from "./salon-chat-serveur";
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
 * `marquer: false` (⚡ lot S8, un préchargement, `&apercu=1`) : rien n'est marqué lu ni vu — l'ouverture pour de bon le
 * fait ensuite (`marquerLu`).
 */
export async function ouvrirSalon(
  supabase: Supabase,
  moi: Habitant,
  cle: unknown,
  maintenant = new Date(),
  { marquer = true }: { marquer?: boolean } = {},
): Promise<{ ouverture?: OuvertureSalon; aPreparer?: { h: string; pair: string; jusqua: number }; aNoter?: string; aDecouper?: string[]; error?: string; statut?: number }> {
  // (🎭 les calques des deux figurines se lisent en même temps que le reste : une lecture chacune ; 🚪 la pièce du duo, ou
  // celle qu'on lui propose ; 🔥 leurs jours de suite)
  const hP = hDeCle(supabase, cle).catch(() => null);
  const ficheP: Promise<Partial<FichePieceDuo>> = hP.then((x) => (x ? lireJson<FichePieceDuo>(supabase, cheminPieceDuo(pairDe(moi.id, x))) : {})).catch(() => ({}));
  const moment = momentDuoDe(heureDeParis(maintenant));
  const sceneP = Promise.all([ficheP, lireSaPiece(supabase, moi.id).catch(() => null)]).then(async ([fiche, sienne]) => {
    const voulue = pieceDuoValide(fiche.piece) ? fiche.piece : (sienne ?? PIECE_PAR_DEFAUT);
    return (await sceneDeLaPiece(supabase, voulue, moment).catch(() => null)) ?? (voulue !== PIECE_PAR_DEFAUT ? await sceneDeLaPiece(supabase, PIECE_PAR_DEFAUT, moment).catch(() => null) : null);
  });
  const [f, v, scene, h, mienne, sienne, fiche, noms, table, chat] = await Promise.all([
    filAvec(supabase, moi, cle, { marquer }),
    vivantAvec(supabase, moi, cle, { marquer }).catch(() => null),
    sceneP,
    hP,
    calquesDeFigurine(supabase, moi.id, { fabriquer: false }).catch(() => null),
    hP.then((x) => (x ? calquesDeFigurine(supabase, x, { fabriquer: false }) : null)).catch(() => null),
    ficheP,
    hP.then((x) => (x ? nomsDuFil(supabase, pairDe(moi.id, x)) : [])).catch(() => []),
    // (🌷 lot S3 : ce qui est posé sur leur table)
    hP.then((x) => (x ? lireTable(supabase, pairDe(moi.id, x), qui8(moi.id)) : [])).catch(() => []),
    // (🐾 lot S3 : le chat du salon, le même pour tous)
    chatDuSalon(supabase).catch(() => null),
  ]);
  if (!f.fil) return { error: f.error, statut: f.statut };
  // (posées aux deux places ; celles qui manquent sont découpées après la réponse)
  const calques = scene ? calquesPoses(scene, mienne, sienne) : null;
  // (🧍 22 novembre 2026 : aussi celles d'avant, sans leur corps sans tête — il s'ajoute après la réponse)
  const aDecouper = [...(mienne?.sansTete ? [] : [moi.id]), ...(sienne?.sansTete || !h ? [] : [h])];
  const choisie = Boolean(scene && fiche.piece === scene.piece);
  const installe = choisie && fiche.par8 ? { installePar: fiche.par8 === qui8(moi.id) ? ("moi" as const) : ("autre" as const) } : {};
  const sceneVue = scene ? { ...scene, ...(calques ? { calques } : {}), choisie, ...installe } : null;
  return {
    ouverture: { cle: f.fil.cle, fil: f.fil, vivant: v?.vivant ?? null, scene: sceneVue, ...(h ? { flamme: flammeDe(noms, qui8(moi.id), qui8(h), maintenant) } : {}), ...(table.length ? { table } : {}), ...(chat ? { chat } : {}) },
    ...(v?.aPreparer ? { aPreparer: v.aPreparer } : {}),
    ...(v?.aNoter ? { aNoter: v.aNoter } : {}),
    ...(aDecouper.length ? { aDecouper } : {}),
  };
}

// ─── 🔥 LA FLAMME (section 4.12) ────────────────────────────────────────────────────────────────────────────────────
const jourParis = (ts: number) => new Date(ts).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
/** 🔥 Leurs jours de suite (l'heure de Paris) où ils se sont écrit tous les deux, d'après les noms des messages du fil. */
export function flammeDe(noms: readonly { ts: number; de8: string }[], moi8: string, lui8: string, maintenant = new Date()): Flamme {
  const miens = new Set<string>();
  const siens = new Set<string>();
  for (const n of noms) {
    if (n.de8 === moi8) miens.add(jourParis(n.ts));
    else if (n.de8 === lui8) siens.add(jourParis(n.ts));
  }
  const auj = jourParis(maintenant.getTime());
  const deux = (j: string) => miens.has(j) && siens.has(j);
  let jours = 0;
  // (aujourd'hui compte s'ils se sont déjà écrit tous les deux ; sinon on part d'hier)
  for (let k = deux(auj) ? 0 : 1; k < 400; k++) {
    if (!deux(jourParis(maintenant.getTime() - k * 86_400_000))) break;
    jours += 1;
  }
  return { jours, moi: miens.has(auj), lui: siens.has(auj) };
}

// ─── 🚪 LA PIÈCE DU DUO (section 4.13) ──────────────────────────────────────────────────────────────────────────────
/** La pièce du duo ; l'invitation en cours (celui qui invite, quand ; la réponse « non », quand). */
export type FichePieceDuo = { piece?: PieceDuo; le?: string; par8?: string; invitation?: { piece: PieceDuo; de8: string; le: number; non?: number } };
export const cheminPieceDuo = (pair: string) => `fils/${pair}/piece.json`;
/** Une invitation vaut deux minutes ; son refus se montre une minute à celui qui l'a faite. */
export const INVITATION_MS = 120_000;
const REFUS_MS = 60_000;

/** 🚪 Ce que le pouls dit de la pièce : celle du duo, l'invitation qui m'attend, le refus de la mienne. */
/**
 * (`invitationLe` : quand l'invitation a été faite — deux invitations vers la même pièce, l'une refusée, l'autre faite
 * juste après, ne se confondent pas chez celui qui les reçoit.)
 */
export function etatPieceDuo(f: Partial<FichePieceDuo>, moi8: string, maintenant = Date.now()): { piece?: PieceDuo; invitation?: PieceDuo; invitationLe?: number; refus?: true } {
  const inv = f.invitation;
  const fraiche = inv && maintenant - inv.le < INVITATION_MS;
  return {
    ...(pieceDuoValide(f.piece) ? { piece: f.piece } : {}),
    ...(inv && fraiche && !inv.non && inv.de8 !== moi8 ? { invitation: inv.piece, invitationLe: inv.le } : {}),
    ...(inv && inv.non && inv.de8 === moi8 && maintenant - inv.non < REFUS_MS ? { refus: true as const } : {}),
  };
}

type Duo = { h: string; pair: string } | { error: string; statut: number };
async function duoDe(supabase: Supabase, moi: Habitant, cle: unknown): Promise<Duo> {
  const h = await hDeCle(supabase, cle);
  if (!h || h === moi.id) return { error: "Ce proche n’existe pas.", statut: 404 };
  if (!(await seParlent(supabase, moi.id, h))) return { error: "Vous pourrez vous parler quand vous vous serez ajoutés tous les deux.", statut: 403 };
  return { h, pair: pairDe(moi.id, h) };
}

/**
 * 🚪 LES PIÈCES OÙ S'INSTALLER, toutes prêtes : chacune avec sa scène (sa plaque dans la lumière de l'heure, ses places,
 * les deux figurines posées) — le téléphone les précharge une à une et passe de l'une à l'autre sans attendre. Celle
 * qu'on propose d'abord : la sienne (sa maison), puis l'ordre du catalogue selon son âge.
 */
export async function cataloguePieces(supabase: Supabase, moi: Habitant, cle: unknown, maintenant = new Date()): Promise<{ catalogue?: CataloguePieces; error?: string; statut?: number }> {
  const d = await duoDe(supabase, moi, cle);
  if ("error" in d) return d;
  const moment = momentDuoDe(heureDeParis(maintenant));
  const [fiche, sienne, adulte, mienne, sa] = await Promise.all([
    lireJson<FichePieceDuo>(supabase, cheminPieceDuo(d.pair)),
    lireSaPiece(supabase, moi.id).catch(() => null),
    sesDixHuitAns(supabase, moi.id).catch(() => null),
    calquesDeFigurine(supabase, moi.id, { fabriquer: false }).catch(() => null),
    calquesDeFigurine(supabase, d.h, { fabriquer: false }).catch(() => null),
  ]);
  const ordre = ordreDuCatalogue(adulte);
  const proposee: PieceDuo = sienne ?? PIECE_PAR_DEFAUT;
  const cles = [proposee, ...ordre.filter((c) => c !== proposee)];
  const scenes = await Promise.all(cles.map((c) => sceneDeLaPiece(supabase, c, moment).catch(() => null)));
  const pieces: PieceDuSalon[] = [];
  scenes.forEach((sc, i) => {
    if (!sc) return;
    const p = PIECES_DUO.find((x) => x.cle === cles[i])!;
    const calques = calquesPoses(sc, mienne, sa);
    pieces.push({ cle: p.cle, nom: p.nom, emoji: p.emoji, scene: { ...sc, ...(calques ? { calques } : {}), choisie: true } });
  });
  return { catalogue: { pieces, proposee, piece: pieceDuoValide(fiche.piece) ? fiche.piece : null } };
}

/**
 * 🚪 S'INSTALLER DANS UNE PIÈCE : la première fois, ou quand l'autre n'est pas là, la pièce change (il arrivera dans la
 * nouvelle) ; s'il est là, c'est une invitation, qu'il voit à son prochain pouls.
 */
export async function choisirPieceDuo(supabase: Supabase, moi: Habitant, cle: unknown, piece: unknown): Promise<{ piece?: PieceDuo; invitation?: true; error?: string; statut?: number }> {
  if (!pieceDuoValide(piece)) return { error: "Cette pièce n’existe pas.", statut: 400 };
  const d = await duoDe(supabase, moi, cle);
  if ("error" in d) return d;
  const [fiche, prete, la, reglages] = await Promise.all([
    lireJson<FichePieceDuo>(supabase, cheminPieceDuo(d.pair)),
    sceneDeLaPiece(supabase, piece, momentDuoDe(heureDeParis())).catch(() => null),
    lireJson<{ le?: number }>(supabase, cheminLa(d.h)),
    lireJson<{ presence?: boolean }>(supabase, cheminReglages(d.h)),
  ]);
  if (!prete) return { error: "Cette pièce n’est pas encore prête.", statut: 409 };
  const estLa = reglages.presence !== false && Date.now() - (Number(la.le) || 0) < LA_MS;
  const moi8 = qui8(moi.id);
  if (pieceDuoValide(fiche.piece) && fiche.piece !== piece && estLa) {
    await ecrireJson(supabase, cheminPieceDuo(d.pair), { ...fiche, invitation: { piece, de8: moi8, le: Date.now() } } satisfies FichePieceDuo);
    return { invitation: true };
  }
  await ecrireJson(supabase, cheminPieceDuo(d.pair), { piece, le: new Date().toISOString(), par8: moi8 } satisfies FichePieceDuo);
  return { piece };
}

/** 🚪 RÉPONDRE À UNE INVITATION : « Venir » (la pièce change, pour les deux) ou « Pas maintenant ». */
export async function repondreInvitation(supabase: Supabase, moi: Habitant, cle: unknown, oui: unknown): Promise<{ piece?: PieceDuo; ok?: true; error?: string; statut?: number }> {
  const d = await duoDe(supabase, moi, cle);
  if ("error" in d) return d;
  const fiche = await lireJson<FichePieceDuo>(supabase, cheminPieceDuo(d.pair));
  const inv = fiche.invitation;
  if (!inv || inv.non || inv.de8 === qui8(moi.id) || Date.now() - inv.le >= INVITATION_MS) return { error: "Cette invitation n’est plus valable.", statut: 410 };
  if (oui === true) {
    await ecrireJson(supabase, cheminPieceDuo(d.pair), { piece: inv.piece, le: new Date().toISOString(), par8: inv.de8 } satisfies FichePieceDuo);
    return { piece: inv.piece };
  }
  await ecrireJson(supabase, cheminPieceDuo(d.pair), { ...fiche, invitation: { ...inv, non: Date.now() } } satisfies FichePieceDuo);
  return { ok: true };
}

/**
 * 🪑 Les deux figurines posées aux deux places de la pièce, à la même taille (`hauteurDuo`) : `a`, la mienne, à gauche ;
 * `b`, la sienne, à droite. (Les places de la scène sont des points d'assise.)
 */
export function calquesPoses(scene: Pick<SceneSalon, "places" | "plaque">, mienne: FigurineLocale | null, sienne: FigurineLocale | null): { a?: CalqueFigurine; b?: CalqueFigurine } | null {
  if (!mienne && !sienne) return null;
  const [gauche, droite] = [...scene.places].sort((p, q) => p.x - q.x);
  const piece = { largeur: scene.plaque.largeur, hauteur: scene.plaque.hauteur };
  const taille = hauteurDuo(scene.places);
  // (chacune la sienne : si l'une n'est pas encore découpée — ou de l'ancien style —, l'autre est quand même là)
  return {
    ...(mienne ? { a: poserFigurine(mienne, gauche, piece, { tracee: false, taille }) } : {}),
    ...(sienne ? { b: poserFigurine(sienne, droite, piece, { tracee: false, taille }) } : {}),
  };
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

/**
 * ✓ (⚡ lot S8) UNE CONVERSATION PRÉCHARGÉE (`?ouvrir=<clé>&apercu=1`), OUVERTE POUR DE BON : ce qu'il m'a laissé est lu
 * (ses messages : `fils-lus.json`, et leur « vu » ; ses gestes : `gestes-vus.json`) — comme l'aurait fait l'ouverture
 * sans préchargement. Rien n'est écrit s'il n'y a rien de nouveau.
 */
export async function marquerLu(supabase: Supabase, moi: Habitant, cle: unknown): Promise<{ ok?: true; error?: string; statut?: number }> {
  const h = await hDeCle(supabase, cle);
  if (!h) return { error: "Ce proche n’existe pas.", statut: 404 };
  if (!(await seParlent(supabase, moi.id, h))) return { error: "Vous pourrez vous parler quand vous vous serez ajoutés tous les deux.", statut: 403 };
  const pair = pairDe(moi.id, h);
  const lui8 = qui8(h);
  const [noms, lus, gestes, gvus] = await Promise.all([
    nomsDuFil(supabase, pair),
    lireJson<Record<string, number>>(supabase, cheminLus(moi.id)),
    lireJson<{ liste?: unknown }>(supabase, cheminGestes(pair)),
    lireJson<Record<string, number>>(supabase, cheminGestesVus(moi.id)),
  ]);
  const maintenant = Date.now();
  const nouveaux = noms.filter((n) => n.de8 === lui8 && n.ts > (Number(lus[h]) || 0));
  const vuG = Number(gvus[pair]) || 0;
  const sesGestes = (Array.isArray(gestes.liste) ? (gestes.liste as { de8?: string; le?: string }[]) : []).filter((g) => g.de8 === lui8 && Date.parse(String(g.le)) > vuG);
  const dernierGeste = sesGestes.reduce((m, g) => Math.max(m, Date.parse(String(g.le)) || 0), 0);
  await Promise.all([
    nouveaux.length ? ecrireJson(supabase, cheminLus(moi.id), { ...lus, [h]: maintenant }) : null,
    ...nouveaux.slice(-30).map(() => noter(supabase, pair, h, "vu")),
    dernierGeste ? ecrireJson(supabase, cheminGestesVus(moi.id), { ...gvus, [pair]: Math.min(dernierGeste, maintenant) }) : null,
  ]);
  return { ok: true };
}
