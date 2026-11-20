/**
 * 🛋️ LES SALONS OUVERTS, CÔTÉ SERVEUR — les lots D3 et D4 de Découvrir (`docs/univers/decouvrir.md`, section 18 ; les
 * règles : `salons-ouverts.ts`).
 *
 * Tout est rangé dans le seau, **un fichier par personne et par message** : personne n'écrit jamais le fichier d'un
 * autre, rien ne se perd quand deux écrivent en même temps.
 *
 * - `decouvrir/salons/<maison>/<thème>-<n>/presents/<q>.json` : qui est là (son prénom, sa figurine, sa place) ; sa date
 *   d'écriture dit quand on l'a vu (redite toutes les 30 s au plus) ; présent : vu depuis moins de 2 min 30.
 * - `decouvrir/salons/<maison>/<thème>-<n>/messages/<ms>-<q>-<x>.json` : un message (texte, réaction, geste) ; leur nom
 *   commence par l'heure, la liste les donne dans l'ordre ; effacés après 48 h.
 * - `decouvrir/signalements/<q>/<ms>-<q de l'auteur>.json` ; `decouvrir/exclus/<q>.json` (24 h hors des salons).
 * - `<habitant>/salons-caches.json` : ceux qu'il ne veut plus voir.
 *
 * `<maison>` : « adultes » ou « jeunes » (les 15-17 ans) — ils ne se croisent jamais. `<q>` : l'identifiant court de
 * quelqu'un (`qui8`) ; son compte n'est jamais montré.
 *
 * FICHIER SERVEUR.
 */
import { randomBytes } from "node:crypto";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { jourAvant, jourParis } from "@/lib/jour-paris";
import { SEAU_FIGURINES, ecrireJson, lireJson, prenomDe } from "./ma-figurine-serveur";
import { qui8 } from "./talkie-serveur";
import { sesDixHuitAns } from "./majorite-serveur";
import { figurineDeLaMaison, sceneDeLaMaison } from "./ma-maison-serveur";
import { lireSelection } from "./selection-serveur";
import { lirePassions } from "./passions-serveur";
import { PIECES_DUO, type PieceDuo } from "./pieces-duo";
import type { ScenePiece } from "./ma-maison";
import { themeDe, type IdTheme } from "./decouvrir";
import {
  CONSERVE_MS,
  EXCLUSION_MS,
  MOTIFS_SIGNALEMENT,
  PHRASES_SALONS,
  PLACES_SALON,
  PRESENCE_MS,
  REDIRE_MS,
  SALONS,
  SIGNALEMENTS_FENETRE_MS,
  SIGNALEMENTS_SEUIL,
  TEXTE_SALON_MAX,
  gesteDe,
  idSalon,
  maisonDe,
  nomDuSalon,
  reactionDe,
  refusDuMessage,
  salonDe,
  themesDesSalons,
  type CarteSalon,
  type MaisonSalons,
  type MessageSalon,
  type PresentSalon,
  type VideoSalon,
} from "./salons-ouverts";

type Supabase = ReturnType<typeof createAdminClient>;
type Resultat<T = object> = T & { error?: string; statut?: number };
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

// ─── les chemins ───
const base = (m: MaisonSalons) => `decouvrir/salons/${m}`;
const dossierSalon = (m: MaisonSalons, id: string) => `${base(m)}/${id}`;
const dossierPresents = (m: MaisonSalons, id: string) => `${dossierSalon(m, id)}/presents`;
const dossierMessages = (m: MaisonSalons, id: string) => `${dossierSalon(m, id)}/messages`;
const dossierSignalements = (q: string) => `decouvrir/signalements/${q}`;
const cheminExclu = (q: string) => `decouvrir/exclus/${q}.json`;
const cheminCaches = (h: string) => `${h}/salons-caches.json`;

/** La fiche de présence (dans le seau, jamais montrée telle quelle : elle porte son compte). */
type FichePresent = PresentSalon & { h: string; ecrits?: number[] };
type FicheMessage = MessageSalon & { h: string };
type Entree = { nom: string; ms: number };

/** Un dossier du seau : ses noms, et quand chacun a été écrit (les sous-dossiers n'ont pas de date). */
async function lister(supabase: Supabase, dossier: string, o: { limite?: number; recents?: boolean } = {}): Promise<Entree[]> {
  const { data } = await supabase.storage.from(SEAU_FIGURINES).list(dossier, { limit: o.limite ?? 100, sortBy: { column: "name", order: o.recents ? "desc" : "asc" } });
  return ((Array.isArray(data) ? data : []) as { name?: string; updated_at?: string | null; created_at?: string | null }[])
    .map((f) => ({ nom: s(f.name), ms: Date.parse(s(f.updated_at) || s(f.created_at)) || 0 }))
    .filter((f) => f.nom && f.nom !== ".emptyFolderPlaceholder");
}
const effacer = (supabase: Supabase, chemins: string[]) => (chemins.length ? supabase.storage.from(SEAU_FIGURINES).remove(chemins).then(() => undefined, () => undefined) : Promise.resolve());

/** Les présents d'un salon (vus depuis moins de 2 min 30) : leur `q` et quand on les a vus. */
async function presentsFrais(supabase: Supabase, m: MaisonSalons, id: string, maintenant = Date.now()): Promise<Entree[]> {
  const l = await lister(supabase, dossierPresents(m, id));
  const frais = l.filter((e) => e.nom.endsWith(".json") && maintenant - e.ms < PRESENCE_MS);
  // (les fiches de ceux partis depuis plus d'un jour : effacées en passant)
  const vieux = l.filter((e) => maintenant - e.ms > 24 * 3600_000).map((e) => `${dossierPresents(m, id)}/${e.nom}`);
  if (vieux.length) void effacer(supabase, vieux);
  return frais.map((e) => ({ nom: e.nom.replace(/\.json$/, ""), ms: e.ms }));
}
const lirePresent = (supabase: Supabase, m: MaisonSalons, id: string, q: string) => lireJson<Partial<FichePresent>>(supabase, `${dossierPresents(m, id)}/${q}.json`);
const publicDe = (f: Partial<FichePresent>): PresentSalon => ({ q: s(f.q), prenom: s(f.prenom) || "Quelqu’un", figurine: f.figurine ?? null, place: Number(f.place) || 0, arrive: Number(f.arrive) || 0 });
const messagePublic = (f: Partial<FicheMessage>): MessageSalon => {
  const { h: _h, ...m } = f as FicheMessage;
  void _h;
  return m;
};

// ─── son âge, son exclusion, ceux qu'il ne veut plus voir ───
export async function maisonDeMoi(supabase: Supabase, h: string): Promise<MaisonSalons | null> {
  return maisonDe(await sesDixHuitAns(supabase, h).catch(() => null));
}
async function exclusion(supabase: Supabase, q: string, maintenant = Date.now()): Promise<number> {
  const e = await lireJson<{ jusqua?: number }>(supabase, cheminExclu(q)).catch(() => ({}) as { jusqua?: number });
  return Number(e.jusqua) > maintenant ? Number(e.jusqua) : 0;
}
export async function mesCaches(supabase: Supabase, h: string): Promise<string[]> {
  const c = await lireJson<{ qs?: string[] }>(supabase, cheminCaches(h)).catch(() => ({}) as { qs?: string[] });
  return Array.isArray(c.qs) ? c.qs.map(s).filter(Boolean) : [];
}

// ─── 🖼️ le décor et la télé d'un salon ───
/**
 * Le décor d'un salon : sa pièce préférée du catalogue si elle est prête, sinon la première prête (relu à chaque fois :
 * un panorama refait se voit tout de suite ; ses images, publiées une fois, ont une adresse stable).
 */
export async function decorDuSalon(supabase: Supabase, theme: IdTheme): Promise<ScenePiece | null> {
  const ordre: PieceDuo[] = [SALONS[theme].decor, ...PIECES_DUO.map((p) => p.cle as PieceDuo).filter((p) => p !== SALONS[theme].decor)];
  for (const p of ordre) {
    const scene = await sceneDeLaMaison(supabase, p).catch(() => null);
    if (scene) return scene;
  }
  return null;
}
/** La télé d'un salon : la sélection du jour de son thème (celle d'hier si la nuit n'est pas passée). */
export async function videosDuSalon(supabase: Supabase, theme: IdTheme, m: MaisonSalons): Promise<VideoSalon[]> {
  const jeunes = m === "jeunes" && !themeDe(theme)?.adultes;
  const jour = jourParis();
  const sel = (await lireSelection(supabase, jour, theme, jeunes).catch(() => null)) ?? (await lireSelection(supabase, jourAvant(jour, 1), theme, jeunes).catch(() => null));
  return (sel?.videos ?? []).map((v) => ({ id: v.id, titre: v.titre, chaine: v.chaine, duree: v.duree }));
}

// ─── 🚪 entrer ───
/** Les salons d'un thème (« foot-1 », « foot-2 »…), et combien y sont. */
async function salonsDuTheme(supabase: Supabase, m: MaisonSalons, theme: IdTheme, maintenant = Date.now()): Promise<{ id: string; n: number; presents: Entree[] }[]> {
  const noms = (await lister(supabase, base(m))).map((e) => e.nom).filter((n) => salonDe(n)?.theme === theme);
  const l = await Promise.all(noms.map(async (id) => ({ id, n: salonDe(id)!.n, presents: await presentsFrais(supabase, m, id, maintenant) })));
  return l.sort((a, b) => a.n - b.n);
}

export type OuvertureSalonOuvert = {
  salon: { id: string; theme: IdTheme; n: number; nom: string; maison: MaisonSalons; plein?: boolean };
  moi: string;
  presents: PresentSalon[];
  messages: MessageSalon[];
  caches: string[];
  decor: ScenePiece | null;
  tele: { videos: VideoSalon[]; maintenant: number };
};

/**
 * 🚪 Entrer dans le salon d'un thème : le plus rempli qui a une place (celui où il est déjà, s'il revient) ; sa figurine
 * s'assoit sur la première place libre.
 */
export async function entrerAuSalon(supabase: Supabase, moi: Habitant, theme: unknown): Promise<Resultat<{ ouverture?: OuvertureSalonOuvert; age?: true; figurine?: true; exclu?: true }>> {
  const t = themeDe(theme);
  if (!t) return { error: "Ce salon n’existe pas.", statut: 404 };
  const m = await maisonDeMoi(supabase, moi.id);
  if (!m) return { error: PHRASES_SALONS.age, statut: 409, age: true };
  if (t.adultes && m !== "adultes") return { error: "Le salon des jeunes parents est réservé aux adultes.", statut: 403 };
  const q = qui8(moi.id);
  if (await exclusion(supabase, q)) return { error: PHRASES_SALONS.exclu, statut: 403, exclu: true };
  const [figurine, prenom, salons, caches, decor, videos] = await Promise.all([
    figurineDeLaMaison(supabase, moi.id).catch(() => null),
    prenomDe(supabase, moi).catch(() => ""),
    salonsDuTheme(supabase, m, t.id),
    mesCaches(supabase, moi.id),
    decorDuSalon(supabase, t.id),
    videosDuSalon(supabase, t.id, m),
  ]);
  if (!figurine) return { error: PHRASES_SALONS.sansFigurine, statut: 409, figurine: true };
  // (celui où il est déjà ; sinon le plus rempli qui a une place ; sinon un nouveau)
  const ou = salons.find((x) => x.presents.some((p) => p.nom === q)) ?? [...salons].filter((x) => x.presents.length < PLACES_SALON).sort((a, b) => b.presents.length - a.presents.length || a.n - b.n)[0];
  const n = ou?.n ?? (salons.length ? Math.max(...salons.map((x) => x.n)) + 1 : 1);
  const id = idSalon(t.id, n);
  const autres = (ou?.presents ?? []).filter((p) => p.nom !== q);
  const fiches = await Promise.all(autres.map((p) => lirePresent(supabase, m, id, p.nom)));
  const ancienne = ou?.presents.some((p) => p.nom === q) ? await lirePresent(supabase, m, id, q) : null;
  const prises = new Set(fiches.map((f) => Number(f.place)));
  const place = ancienne && !prises.has(Number(ancienne.place)) ? Number(ancienne.place) : [...Array(PLACES_SALON).keys()].find((k) => !prises.has(k)) ?? 0;
  const maintenant = Date.now();
  const fiche: FichePresent = { q, h: moi.id, prenom: prenom || "Quelqu’un", figurine, place, arrive: ancienne?.arrive ?? maintenant, ecrits: ancienne?.ecrits ?? [] };
  if (!(await ecrireJson(supabase, `${dossierPresents(m, id)}/${q}.json`, fiche))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  // (en passant : les messages de plus de 48 h s'effacent)
  void nettoyerMessages(supabase, m, id, maintenant);
  const messages = await derniersMessages(supabase, m, id, { depuis: maintenant - CONSERVE_MS, limite: 20, caches });
  return {
    ouverture: {
      salon: { id, theme: t.id, n, nom: nomDuSalon(t.id, n), maison: m, ...(salons.length && !ou ? { plein: true } : {}) },
      moi: q,
      presents: [...fiches.filter((f) => f.q).map(publicDe), publicDe(fiche)],
      messages,
      caches,
      decor,
      tele: { videos, maintenant },
    },
  };
}

async function nettoyerMessages(supabase: Supabase, m: MaisonSalons, id: string, maintenant: number): Promise<void> {
  const l = await lister(supabase, dossierMessages(m, id), { limite: 60 }).catch(() => [] as Entree[]);
  const vieux = l.filter((e) => maintenant - (Number(e.nom.split("-")[0]) || 0) > CONSERVE_MS).map((e) => `${dossierMessages(m, id)}/${e.nom}`);
  await effacer(supabase, vieux);
}

/** Les messages d'un salon après `depuis` (ms), les plus récents (`limite`), sans ceux de qui il ne veut plus voir. */
async function derniersMessages(supabase: Supabase, m: MaisonSalons, id: string, o: { depuis: number; limite: number; caches: string[] }): Promise<MessageSalon[]> {
  const l = await lister(supabase, dossierMessages(m, id), { limite: o.limite, recents: true });
  const caches = new Set(o.caches);
  const noms = l.filter((e) => {
    const [ms, q] = e.nom.split("-");
    return Number(ms) > o.depuis && !caches.has(q);
  });
  const lus = await Promise.all(noms.map((e) => lireJson<Partial<FicheMessage>>(supabase, `${dossierMessages(m, id)}/${e.nom}`)));
  return lus
    .filter((x) => x.id && x.de)
    .map(messagePublic)
    .sort((a, b) => a.le - b.le);
}

/** Le salon où il dit être (son identifiant), dans sa maison à lui. */
async function sonSalon(supabase: Supabase, moi: Habitant, id: unknown): Promise<Resultat<{ m?: MaisonSalons; id?: string }>> {
  const x = salonDe(id);
  if (!x) return { error: "Ce salon n’existe pas.", statut: 404 };
  const m = await maisonDeMoi(supabase, moi.id);
  if (!m) return { error: PHRASES_SALONS.age, statut: 409 };
  return { m, id: idSalon(x.theme, x.n) };
}

// ─── 💓 le pouls : qui est là, ce qui s'est dit depuis ───
export type PoulsSalonOuvert = { ici: string[]; nouveaux: PresentSalon[]; messages: MessageSalon[]; maintenant: number; exclu?: true; dehors?: true };
/**
 * 💓 Le pouls (toutes les quelques secondes) : les présents (`ici`, et le détail de ceux qu'il ne connaît pas encore),
 * les messages après `depuis` ; il redit qu'il est là (toutes les 30 s au plus).
 */
export async function poulsDuSalon(supabase: Supabase, moi: Habitant, id: unknown, depuis: unknown, connus: unknown): Promise<Resultat<{ pouls?: PoulsSalonOuvert }>> {
  const r = await sonSalon(supabase, moi, id);
  if (r.error || !r.m || !r.id) return { error: r.error, statut: r.statut };
  const { m } = r;
  const sid = r.id;
  const q = qui8(moi.id);
  const maintenant = Date.now();
  const [presents, caches] = await Promise.all([presentsFrais(supabase, m, sid, maintenant), mesCaches(supabase, moi.id)]);
  const mien = presents.find((p) => p.nom === q);
  if (!mien) {
    // (parti trop longtemps, ou exclu : le téléphone le dit, et il rentre s'il le peut)
    return { pouls: { ici: [], nouveaux: [], messages: [], maintenant, ...((await exclusion(supabase, q, maintenant)) ? { exclu: true as const } : { dehors: true as const }) } };
  }
  if (maintenant - mien.ms > REDIRE_MS) {
    if (await exclusion(supabase, q, maintenant)) {
      await effacer(supabase, [`${dossierPresents(m, sid)}/${q}.json`]);
      return { pouls: { ici: [], nouveaux: [], messages: [], maintenant, exclu: true } };
    }
    const f = await lirePresent(supabase, m, sid, q);
    if (f.q) await ecrireJson(supabase, `${dossierPresents(m, sid)}/${q}.json`, f);
  }
  const deja = new Set(s(connus).split(",").filter(Boolean));
  const inconnus = presents.filter((p) => !deja.has(p.nom));
  const [nouveaux, messages] = await Promise.all([
    Promise.all(inconnus.map((p) => lirePresent(supabase, m, sid, p.nom))),
    derniersMessages(supabase, m, sid, { depuis: Math.max(Number(depuis) || 0, maintenant - CONSERVE_MS), limite: 30, caches }),
  ]);
  return { pouls: { ici: presents.map((p) => p.nom), nouveaux: nouveaux.filter((f) => f.q).map(publicDe), messages, maintenant } };
}

// ─── ✍️ écrire, réagir, un geste ───
const ECRITS_PAR_MINUTE = 12;
const ECART_MS = 1500;
/** ✍️ Un message au salon : un texte (relu avant de partir), une réaction, ou un geste à quelqu'un qui est là. */
export async function ecrireAuSalon(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat<{ message?: MessageSalon; refus?: string }>> {
  const r = await sonSalon(supabase, moi, p.salon);
  if (r.error || !r.m || !r.id) return { error: r.error, statut: r.statut };
  const { m } = r;
  const sid = r.id;
  const q = qui8(moi.id);
  const maintenant = Date.now();
  if (await exclusion(supabase, q, maintenant)) return { error: PHRASES_SALONS.exclu, statut: 403 };
  const presents = await presentsFrais(supabase, m, sid, maintenant);
  if (!presents.some((x) => x.nom === q)) return { error: "Tu n’es plus dans ce salon : rentre d’abord.", statut: 409 };
  const sorte = p.sorte === "reaction" || p.sorte === "geste" ? p.sorte : "texte";
  let corps: Pick<MessageSalon, "sorte" | "texte" | "cle" | "a">;
  if (sorte === "texte") {
    const texte = s(p.texte).replace(/\s+/g, " ");
    const refus = refusDuMessage(texte);
    if (refus) return { error: PHRASES_SALONS.refus(refus), statut: 400, refus };
    corps = { sorte, texte: [...texte].slice(0, TEXTE_SALON_MAX).join("") };
  } else if (sorte === "reaction") {
    const x = reactionDe(p.cle);
    if (!x) return { error: "Quelle réaction ?", statut: 400 };
    corps = { sorte, cle: x.cle };
  } else {
    const x = gesteDe(p.cle);
    const a = s(p.a);
    if (!x || !a || a === q || !presents.some((y) => y.nom === a)) return { error: "Cette personne n’est plus là.", statut: 400 };
    corps = { sorte, cle: x.cle, a };
  }
  // (pas plus d'un message toutes les secondes et demie, douze par minute)
  const f = await lirePresent(supabase, m, sid, q);
  const ecrits = (Array.isArray(f.ecrits) ? f.ecrits : []).filter((t) => maintenant - t < 60_000);
  if (ecrits.length >= ECRITS_PAR_MINUTE || (ecrits.length && maintenant - Math.max(...ecrits) < ECART_MS)) return { error: "Doucement 🙂 Un message à la fois.", statut: 429 };
  const id = `${maintenant}-${q}-${randomBytes(3).toString("hex")}`;
  const message: FicheMessage = { id, de: q, prenom: s(f.prenom) || "Quelqu’un", le: maintenant, ...corps, h: moi.id };
  if (!(await ecrireJson(supabase, `${dossierMessages(m, sid)}/${id}.json`, message))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  await ecrireJson(supabase, `${dossierPresents(m, sid)}/${q}.json`, { ...f, ecrits: [...ecrits, maintenant] });
  return { message: messagePublic(message) };
}

/** 💬 La conversation du salon : tout ce qui s'est dit ces dernières 48 heures (les 80 derniers messages). */
export async function conversationDuSalon(supabase: Supabase, moi: Habitant, id: unknown): Promise<Resultat<{ messages?: MessageSalon[] }>> {
  const r = await sonSalon(supabase, moi, id);
  if (r.error || !r.m || !r.id) return { error: r.error, statut: r.statut };
  const caches = await mesCaches(supabase, moi.id);
  return { messages: await derniersMessages(supabase, r.m, r.id, { depuis: Date.now() - CONSERVE_MS, limite: 80, caches }) };
}

/** 🚪 Sortir : sa place se libère tout de suite. */
export async function sortirDuSalon(supabase: Supabase, moi: Habitant, id: unknown): Promise<Resultat> {
  const r = await sonSalon(supabase, moi, id);
  if (r.error || !r.m || !r.id) return { error: r.error, statut: r.statut };
  await effacer(supabase, [`${dossierPresents(r.m, r.id)}/${qui8(moi.id)}.json`]);
  return {};
}

// ─── 🛡️ ne plus voir, signaler ───
/** 🙈 Ne plus voir quelqu'un : ses bulles disparaissent, partout (ou il revient, `non`). */
export async function nePlusVoir(supabase: Supabase, moi: Habitant, q: unknown, revoir = false): Promise<Resultat<{ caches?: string[] }>> {
  const x = s(q);
  if (!/^[A-Za-z0-9_-]{4,16}$/.test(x) || x === qui8(moi.id)) return { error: "Qui ?", statut: 400 };
  const avant = await mesCaches(supabase, moi.id);
  const caches = revoir ? avant.filter((y) => y !== x) : [...new Set([...avant, x])].slice(-200);
  if (!(await ecrireJson(supabase, cheminCaches(moi.id), { qs: caches, le: new Date().toISOString() }))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  return { caches };
}

/**
 * 🚩 Signaler quelqu'un (et le message en cause) : trois personnes différentes en une heure, et il quitte les salons
 * ouverts pour 24 heures ; l'administrateur le voit.
 */
export async function signalerAuSalon(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat<{ exclu?: boolean }>> {
  const r = await sonSalon(supabase, moi, p.salon);
  if (r.error || !r.m || !r.id) return { error: r.error, statut: r.statut };
  const { m } = r;
  const sid = r.id;
  const auteur = qui8(moi.id);
  const cible = s(p.q);
  const motif = MOTIFS_SIGNALEMENT.find((x) => x === p.motif) ?? MOTIFS_SIGNALEMENT[3];
  if (!/^[A-Za-z0-9_-]{4,16}$/.test(cible) || cible === auteur) return { error: "Qui ?", statut: 400 };
  const f = await lirePresent(supabase, m, sid, cible);
  if (!f.q) return { error: "Cette personne n’est plus là.", statut: 404 };
  // (le message en cause, s'il est donné : sa copie, pour l'administrateur)
  const idm = s(p.message);
  const msg = /^\d{13}-[A-Za-z0-9_-]{4,16}-[0-9a-f]{6}$/.test(idm) ? await lireJson<Partial<FicheMessage>>(supabase, `${dossierMessages(m, sid)}/${idm}.json`) : {};
  const maintenant = Date.now();
  await ecrireJson(supabase, `${dossierSignalements(cible)}/${maintenant}-${auteur}.json`, {
    le: maintenant,
    motif,
    salon: sid,
    maison: m,
    q: cible,
    h: f.h,
    prenom: f.prenom,
    auteur: { q: auteur, h: moi.id },
    ...(msg.de === cible && msg.texte ? { texte: msg.texte } : {}),
  });
  const l = await lister(supabase, dossierSignalements(cible), { limite: 60, recents: true });
  const auteurs = new Set(
    l
      .map((e) => e.nom.replace(/\.json$/, "").split("-"))
      .filter(([ms]) => maintenant - (Number(ms) || 0) < SIGNALEMENTS_FENETRE_MS)
      .map(([, a]) => a),
  );
  if (auteurs.size < SIGNALEMENTS_SEUIL) return { exclu: false };
  await exclureDesSalons(supabase, { q: cible, h: s(f.h), prenom: s(f.prenom), salon: sid, maison: m, par: "signalements", ms: EXCLUSION_MS });
  return { exclu: true };
}

/** 🚫 Hors des salons ouverts pour un temps : sa fiche d'exclusion, et sa place libérée. */
async function exclureDesSalons(supabase: Supabase, x: { q: string; h: string; prenom: string; salon?: string; maison?: MaisonSalons; par: "signalements" | "administrateur"; ms: number }): Promise<void> {
  const maintenant = Date.now();
  await ecrireJson(supabase, cheminExclu(x.q), { q: x.q, h: x.h, prenom: x.prenom, salon: x.salon ?? "", par: x.par, le: maintenant, jusqua: maintenant + x.ms });
  if (x.maison && x.salon) await effacer(supabase, [`${dossierPresents(x.maison, x.salon)}/${x.q}.json`]);
}

// ─── 🧭 l'accueil de Découvrir : les salons de mes passions, puis les autres ───
async function comptesDesSalons(supabase: Supabase, m: MaisonSalons): Promise<Map<IdTheme, { presents: number; salons: number }>> {
  const noms = (await lister(supabase, base(m))).map((e) => e.nom).filter((n) => salonDe(n));
  const l = await Promise.all(noms.map(async (id) => ({ theme: salonDe(id)!.theme, n: (await presentsFrais(supabase, m, id)).length })));
  const parTheme = new Map<IdTheme, { presents: number; salons: number }>();
  for (const x of l) {
    const c = parTheme.get(x.theme) ?? { presents: 0, salons: 0 };
    parTheme.set(x.theme, { presents: c.presents + x.n, salons: c.salons + (x.n ? 1 : 0) });
  }
  return parTheme;
}

/** 🧭 Les cartes des salons (ses passions d'abord) ; `age` : il doit d'abord dire s'il a 18 ans. */
export async function accueilDesSalons(supabase: Supabase, moi: Habitant): Promise<{ age?: true; maison?: MaisonSalons; cartes: CarteSalon[] }> {
  const m = await maisonDeMoi(supabase, moi.id);
  if (!m) return { age: true, cartes: [] };
  const themes = themesDesSalons(m);
  const [passions, parTheme] = await Promise.all([lirePassions(supabase, moi.id).catch(() => null), comptesDesSalons(supabase, m)]);
  const miens = new Set(passions?.passions ?? []);
  const decorsVus = new Map<PieceDuo, Promise<ScenePiece | null>>();
  const cartes = await Promise.all(
    themes.map(async (t): Promise<CarteSalon> => {
      const piece = SALONS[t.id].decor;
      if (!decorsVus.has(piece)) decorsVus.set(piece, decorDuSalon(supabase, t.id));
      const scene = await decorsVus.get(piece)!;
      const c = parTheme.get(t.id) ?? { presents: 0, salons: 0 };
      return { theme: t.id, e: t.e, nom: SALONS[t.id].nom, presents: c.presents, salons: c.salons, mien: miens.has(t.id), decor: scene ? { src: scene.panorama.src, flou: scene.panorama.flou } : null };
    }),
  );
  return { maison: m, cartes: [...cartes.filter((c) => c.mien), ...cartes.filter((c) => !c.mien)] };
}

// ─── 🛡️ l'administration (`/admin/humain/salons`) ───
export type SalonEnCours = { maison: MaisonSalons; id: string; nom: string; presents: { q: string; prenom: string }[]; messages24h: number };
export type SignalementVu = { le: number; q: string; prenom: string; motif: string; salon: string; texte?: string; par: string };
export type ExclusionVue = { q: string; prenom: string; jusqua: number; par: string; salon: string };

export async function administrationDesSalons(supabase: Supabase): Promise<{ salons: SalonEnCours[]; signalements: SignalementVu[]; exclus: ExclusionVue[] }> {
  const maintenant = Date.now();
  const salons = (
    await Promise.all(
      (["adultes", "jeunes"] as const).map(async (m) => {
        const noms = (await lister(supabase, base(m))).map((e) => e.nom).filter((n) => salonDe(n));
        return Promise.all(
          noms.map(async (id): Promise<SalonEnCours> => {
            const [presents, messages] = await Promise.all([presentsFrais(supabase, m, id, maintenant), lister(supabase, dossierMessages(m, id), { limite: 100, recents: true })]);
            const fiches = await Promise.all(presents.map((p) => lirePresent(supabase, m, id, p.nom)));
            const x = salonDe(id)!;
            return { maison: m, id, nom: nomDuSalon(x.theme, x.n), presents: fiches.filter((f) => f.q).map((f) => ({ q: s(f.q), prenom: s(f.prenom) })), messages24h: messages.filter((e) => maintenant - (Number(e.nom.split("-")[0]) || 0) < 24 * 3600_000).length };
          }),
        );
      }),
    )
  ).flat();
  const cibles = (await lister(supabase, "decouvrir/signalements")).map((e) => e.nom).slice(0, 40);
  const signalements = (
    await Promise.all(
      cibles.map(async (q) => {
        const l = (await lister(supabase, dossierSignalements(q), { limite: 10, recents: true })).filter((e) => maintenant - (Number(e.nom.split("-")[0]) || 0) < 7 * 24 * 3600_000);
        const lus = await Promise.all(l.map((e) => lireJson<Record<string, unknown>>(supabase, `${dossierSignalements(q)}/${e.nom}`)));
        return lus.map((x): SignalementVu => ({ le: Number(x.le) || 0, q, prenom: s(x.prenom), motif: s(x.motif), salon: s(x.salon), ...(s(x.texte) ? { texte: s(x.texte) } : {}), par: s((x.auteur as { q?: string } | undefined)?.q) }));
      }),
    )
  )
    .flat()
    .sort((a, b) => b.le - a.le)
    .slice(0, 60);
  const exclusFichiers = await lister(supabase, "decouvrir/exclus");
  const exclus = (await Promise.all(exclusFichiers.map((e) => lireJson<Record<string, unknown>>(supabase, `decouvrir/exclus/${e.nom}`))))
    .filter((x) => Number(x.jusqua) > maintenant)
    .map((x): ExclusionVue => ({ q: s(x.q), prenom: s(x.prenom), jusqua: Number(x.jusqua), par: s(x.par), salon: s(x.salon) }));
  return { salons: salons.filter((x) => x.presents.length || x.messages24h), signalements, exclus };
}

/** L'administrateur exclut quelqu'un des salons ouverts (24 h, ou plus), ou le réintègre. */
export async function exclusionParAdministrateur(supabase: Supabase, p: Record<string, unknown>): Promise<Resultat> {
  const q = s(p.q);
  if (!/^[A-Za-z0-9_-]{4,16}$/.test(q)) return { error: "Qui ?", statut: 400 };
  if (p.action === "reintegrer") {
    await effacer(supabase, [cheminExclu(q)]);
    return {};
  }
  const heures = Math.min(24 * 365, Math.max(1, Math.round(Number(p.heures) || 24)));
  // (son prénom, d'après le salon où il est, ou un signalement)
  const salons = await administrationDesSalons(supabase);
  const ici = salons.salons.find((x) => x.presents.some((y) => y.q === q));
  const prenom = ici?.presents.find((y) => y.q === q)?.prenom ?? salons.signalements.find((x) => x.q === q)?.prenom ?? "";
  await exclureDesSalons(supabase, { q, h: "", prenom, ...(ici ? { salon: ici.id, maison: ici.maison } : {}), par: "administrateur", ms: heures * 3600_000 });
  return {};
}
