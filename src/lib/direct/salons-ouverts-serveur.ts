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
import { SEAU_FIGURINES, ajouterProche, ecrireJson, lireJson, prenomDe, telecharger } from "./ma-figurine-serveur";
import { hDeCle, poserProfil, qui8, seParlent } from "./talkie-serveur";
import { sesDixHuitAns } from "./majorite-serveur";
import { cheminMesSalons, figurineDeLaMaison, lireSaPiece, sceneDeLaMaison, visibiliteDeLaMaison } from "./ma-maison-serveur";
import { gradinDuSalon } from "./salons-gradins-serveur";
import { gradinDuTheme, type GradinScene, type IdGradin } from "./salons-gradins";
import { ajouterChezMoi, poserSouvenirCommun } from "./etagere-serveur";
import { LIEN_REGARDER_MAX, PHRASES_REGARDER, SECONDES_ENSEMBLE, SOUVENIR_DIT_MS, TITRE_PAR_DEFAUT } from "./regarder-a-deux";
import { videoYouTube } from "./tele";
import { prevenirUnHabitantAppli } from "./appli-collection-serveur";
import { maTeleDuJour, maVideo } from "./tele-du-jour-serveur";
import { details, lireSelection } from "./selection-serveur";
import { lirePassions } from "./passions-serveur";
import { PIECES_DUO, type PieceDuo } from "./pieces-duo";
import type { ScenePiece } from "./ma-maison";
import { themeDe, type IdTheme } from "./decouvrir";
import {
  AIMES_POUR_ETAGERE,
  CONSERVE_MS,
  DEMANDES_PAR_JOUR,
  INVITATION_MS,
  INVITES_MAX,
  PLACES_SEANCE,
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
  positionSeance,
  positionTele,
  reactionDe,
  refusDuMessage,
  salonDe,
  themesDesSalons,
  type CarteSalon,
  type DemandeProche,
  type InvitationTele,
  type MaisonSalons,
  type MomentSalon,
  type TeleSeance,
  type MessageSalon,
  type PresentSalon,
  type VideoSalon,
  type VitrineSalon,
} from "./salons-ouverts";

type Supabase = ReturnType<typeof createAdminClient>;
type Resultat<T = object> = T & { error?: string; statut?: number };
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

// ─── les chemins ───
/** Une maison de salons ouverts, ou « prives » : les séances chez quelqu'un (lot D2). */
type Lieu = MaisonSalons | "prives";
const base = (m: Lieu) => `decouvrir/salons/${m}`;
const dossierSalon = (m: Lieu, id: string) => `${base(m)}/${id}`;
const dossierPresents = (m: Lieu, id: string) => `${dossierSalon(m, id)}/presents`;
const dossierMessages = (m: Lieu, id: string) => `${dossierSalon(m, id)}/messages`;
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
async function presentsFrais(supabase: Supabase, m: Lieu, id: string, maintenant = Date.now()): Promise<Entree[]> {
  const l = await lister(supabase, dossierPresents(m, id));
  const frais = l.filter((e) => e.nom.endsWith(".json") && maintenant - e.ms < PRESENCE_MS);
  // (les fiches de ceux partis depuis plus d'un jour : effacées en passant)
  const vieux = l.filter((e) => maintenant - e.ms > 24 * 3600_000).map((e) => `${dossierPresents(m, id)}/${e.nom}`);
  if (vieux.length) void effacer(supabase, vieux);
  return frais.map((e) => ({ nom: e.nom.replace(/\.json$/, ""), ms: e.ms }));
}
const lirePresent = (supabase: Supabase, m: Lieu, id: string, q: string) => lireJson<Partial<FichePresent>>(supabase, `${dossierPresents(m, id)}/${q}.json`);
const publicDe = (f: Partial<FichePresent>): PresentSalon => ({
  q: s(f.q),
  prenom: s(f.prenom) || "Quelqu’un",
  figurine: f.figurine ?? null,
  place: Number(f.place) || 0,
  arrive: Number(f.arrive) || 0,
  ...(Array.isArray(f.passions) && f.passions.length ? { passions: f.passions.map(s).slice(0, 5) } : {}),
  ...(s(f.maison) ? { maison: s(f.maison) } : {}),
});
/** (lot D5) ce que sa fiche montre en plus : ses passions, sa maison si elle est ouverte à tous. */
async function sonProfilDeSalon(supabase: Supabase, h: string): Promise<{ passions?: string[]; maison?: string }> {
  const [p, v] = await Promise.all([lirePassions(supabase, h).catch(() => null), visibiliteDeLaMaison(supabase, h).catch(() => "proches")]);
  const maison = v === "tous" ? await poserProfil(supabase, h).catch(() => "") : "";
  return { ...(p?.passions?.length ? { passions: p.passions.slice(0, 5) } : {}), ...(maison ? { maison } : {}) };
}
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
 * une image refaite se voit tout de suite ; ses images, publiées une fois, ont une adresse stable). Depuis le 20 novembre
 * 2026, l'image de la pièce est celle de la messagerie (en hauteur), plus le panorama.
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
  salon: { id: string; theme?: IdTheme; n: number; nom: string; maison: Lieu; plein?: boolean; seance?: { hote: boolean; prenom: string; cle: string } };
  moi: string;
  presents: PresentSalon[];
  messages: MessageSalon[];
  caches: string[];
  decor: ScenePiece | null;
  /** 🎭 le gradin de sa passion, validé par le propriétaire (sinon `null` : la pièce du décor) ; jamais dans la séance */
  gradin: GradinScene | null;
  tele: {
    videos: VideoSalon[];
    maintenant: number;
    seance?: TeleSeance | null;
    /** 🎞️ (21 novembre 2026, « il garde sa vidéo ») l'invité avec une vidéo : il la regarde depuis le début, à son rythme */
    gardee?: VideoSalon;
  };
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
  const [figurine, prenom, salons, caches, gradin, videos, profil] = await Promise.all([
    figurineDeLaMaison(supabase, moi.id).catch(() => null),
    prenomDe(supabase, moi).catch(() => ""),
    salonsDuTheme(supabase, m, t.id),
    mesCaches(supabase, moi.id),
    gradinDuSalon(supabase, t.id).catch(() => null),
    videosDuSalon(supabase, t.id, m),
    sonProfilDeSalon(supabase, moi.id),
  ]);
  // (🎭 son gradin validé ; sinon la pièce de son décor)
  const decor = gradin ? null : await decorDuSalon(supabase, t.id);
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
  const fiche: FichePresent = { q, h: moi.id, prenom: prenom || "Quelqu’un", figurine, place, arrive: ancienne?.arrive ?? maintenant, ecrits: ancienne?.ecrits ?? [], ...profil };
  if (!(await ecrireJson(supabase, `${dossierPresents(m, id)}/${q}.json`, fiche))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  // (en passant : les messages de plus de 48 h s'effacent ; 🏠 « Mes salons » retient celui-ci)
  void nettoyerMessages(supabase, m, id, maintenant);
  void noterMonSalon(supabase, moi.id, t.id, maintenant);
  const messages = await derniersMessages(supabase, m, id, { depuis: maintenant - CONSERVE_MS, limite: 20, caches });
  return {
    ouverture: {
      salon: { id, theme: t.id, n, nom: nomDuSalon(t.id, n), maison: m, ...(salons.length && !ou ? { plein: true } : {}) },
      moi: q,
      presents: [...fiches.filter((f) => f.q).map(publicDe), publicDe(fiche)],
      messages,
      caches,
      decor,
      gradin,
      tele: { videos, maintenant },
    },
  };
}

async function nettoyerMessages(supabase: Supabase, m: Lieu, id: string, maintenant: number): Promise<void> {
  const l = await lister(supabase, dossierMessages(m, id), { limite: 60 }).catch(() => [] as Entree[]);
  const vieux = l.filter((e) => maintenant - (Number(e.nom.split("-")[0]) || 0) > CONSERVE_MS).map((e) => `${dossierMessages(m, id)}/${e.nom}`);
  await effacer(supabase, vieux);
}

/** Les messages d'un salon après `depuis` (ms), les plus récents (`limite`), sans ceux de qui il ne veut plus voir. */
async function derniersMessages(supabase: Supabase, m: Lieu, id: string, o: { depuis: number; limite: number; caches: string[] }): Promise<MessageSalon[]> {
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

/**
 * Le salon où il dit être (son identifiant) : un salon ouvert, dans sa maison à lui ; ou (lot D2) une séance chez
 * quelqu'un (« chez-<q> »), s'il en est l'hôte ou s'il y est invité.
 */
async function sonSalon(supabase: Supabase, moi: Habitant, id: unknown): Promise<Resultat<{ m?: Lieu; id?: string; seance?: { qHote: string; hote: boolean } }>> {
  const qHote = seanceDe(id);
  if (qHote) {
    const hote = qHote === qui8(moi.id);
    if (!hote && !(await invite(supabase, qHote, qui8(moi.id)))) return { error: PHRASES_SALONS.pasInvite, statut: 403 };
    return { m: "prives", id: idSeance(qHote), seance: { qHote, hote } };
  }
  const x = salonDe(id);
  if (!x) return { error: "Ce salon n’existe pas.", statut: 404 };
  const m = await maisonDeMoi(supabase, moi.id);
  if (!m) return { error: PHRASES_SALONS.age, statut: 409 };
  return { m, id: idSalon(x.theme, x.n) };
}

// ─── 💓 le pouls : qui est là, ce qui s'est dit depuis ───
export type PoulsSalonOuvert = { ici: string[]; nouveaux: PresentSalon[]; messages: MessageSalon[]; maintenant: number; exclu?: true; dehors?: true; seance?: TeleSeance | null; /** 🎬 (« Regarder à deux ») le titre du souvenir commun qui vient de se poser */ souvenir?: string };
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
  const [nouveaux, messages, seance] = await Promise.all([
    Promise.all(inconnus.map((p) => lirePresent(supabase, m, sid, p.nom))),
    derniersMessages(supabase, m, sid, { depuis: Math.max(Number(depuis) || 0, maintenant - CONSERVE_MS), limite: 30, caches }),
    r.seance ? lireTeleSeance(supabase, r.seance.qHote) : Promise.resolve(undefined),
  ]);
  // (🎬 « Regarder à deux » : vue ensemble, la vidéo devient un souvenir commun)
  const souvenir = r.seance && seance && presents.length >= 2 ? await souvenirSiEnsemble(supabase, r.seance.qHote, q, presents, seance, maintenant).catch(() => null) : null;
  return { pouls: { ici: presents.map((p) => p.nom), nouveaux: nouveaux.filter((f) => f.q).map(publicDe), messages, maintenant, ...(r.seance ? { seance: seance ?? null } : {}), ...(souvenir ? { souvenir } : {}) } };
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
    // (dans une séance, entre proches : comme leur conversation — seulement pas vide, 90 signes au plus)
    const refus = r.seance ? (texte ? null : "il est vide") : refusDuMessage(texte);
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
  // (👥 21 novembre 2026 : devant une télé aussi — un proche de proche peut y être ; l'administrateur le voit)
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
  await exclureDesSalons(supabase, { q: cible, h: s(f.h), prenom: s(f.prenom), salon: sid, ...(m !== "prives" ? { maison: m } : {}), par: "signalements", ms: EXCLUSION_MS });
  return { exclu: true };
}

/** 🚫 Hors des salons ouverts pour un temps : sa fiche d'exclusion, et sa place libérée. */
async function exclureDesSalons(supabase: Supabase, x: { q: string; h: string; prenom: string; salon?: string; maison?: MaisonSalons; par: "signalements" | "administrateur"; ms: number }): Promise<void> {
  const maintenant = Date.now();
  await ecrireJson(supabase, cheminExclu(x.q), { q: x.q, h: x.h, prenom: x.prenom, salon: x.salon ?? "", par: x.par, le: maintenant, jusqua: maintenant + x.ms });
  if (x.maison && x.salon) await effacer(supabase, [`${dossierPresents(x.maison, x.salon)}/${x.q}.json`]);
}

// ─── 🧭 l'accueil de Découvrir : les salons de mes passions, puis les autres ───
async function comptesDesSalons(supabase: Supabase, m: MaisonSalons): Promise<{ parTheme: Map<IdTheme, { presents: number; salons: number }>; plusVivant: { id: string; theme: IdTheme; presents: Entree[] } | null }> {
  const noms = (await lister(supabase, base(m))).map((e) => e.nom).filter((n) => salonDe(n));
  const l = await Promise.all(noms.map(async (id) => ({ id, theme: salonDe(id)!.theme, presents: await presentsFrais(supabase, m, id) })));
  const parTheme = new Map<IdTheme, { presents: number; salons: number }>();
  for (const x of l) {
    const c = parTheme.get(x.theme) ?? { presents: 0, salons: 0 };
    parTheme.set(x.theme, { presents: c.presents + x.presents.length, salons: c.salons + (x.presents.length ? 1 : 0) });
  }
  // (🟢 la vitrine : le salon le plus rempli en ce moment)
  const plusVivant = l.filter((x) => x.presents.length).sort((a, b) => b.presents.length - a.presents.length)[0] ?? null;
  return { parTheme, plusVivant };
}

/**
 * 🟢 LA VITRINE (la maquette B) : le salon le plus rempli — ce qui passe à sa télé (la sélection du jour, à la même
 * seconde pour tous), les figurines de ceux qui y sont (cinq au plus) ; personne nulle part : le premier de ses salons.
 */
async function vitrineDesSalons(supabase: Supabase, m: MaisonSalons, plusVivant: { id: string; theme: IdTheme; presents: Entree[] } | null, premier: IdTheme | undefined): Promise<VitrineSalon | undefined> {
  const theme = plusVivant?.theme ?? premier;
  const t = theme ? themeDe(theme) : null;
  if (!theme || !t) return undefined;
  const [videos, figurines] = await Promise.all([
    videosDuSalon(supabase, theme, m).catch(() => [] as VideoSalon[]),
    plusVivant ? Promise.all(plusVivant.presents.slice(0, 5).map((e) => lirePresent(supabase, m, plusVivant.id, e.nom).then((f) => s(f.figurine?.src)).catch(() => ""))) : Promise.resolve([] as string[]),
  ]);
  const pos = videos.length ? positionTele(videos, Date.now()) : null;
  const v = pos ? videos[pos.i] : null;
  return { theme, e: t.e, nom: SALONS[theme].nom, presents: plusVivant?.presents.length ?? 0, ...(v ? { video: { id: v.id, titre: v.titre } } : {}), figurines: figurines.filter(Boolean) };
}

/** 🧭 Les cartes des salons (ses passions d'abord) ; `age` : il doit d'abord dire s'il a 18 ans. */
export async function accueilDesSalons(supabase: Supabase, moi: Habitant): Promise<{ age?: true; maison?: MaisonSalons; cartes: CarteSalon[]; vitrine?: VitrineSalon; invitations?: InvitationTele[]; demandes?: DemandeProche[] }> {
  // (🎬 lot D2 : les invitations devant la télé d'un proche ; 👯 lot D5 : les demandes de proche reçues dans un salon)
  const [invitations, demandes] = await Promise.all([mesInvitations(supabase, moi).catch(() => []), mesDemandes(supabase, moi).catch(() => [])]);
  const enPlus = { ...(invitations.length ? { invitations } : {}), ...(demandes.length ? { demandes } : {}) };
  const m = await maisonDeMoi(supabase, moi.id);
  if (!m) return { age: true, cartes: [], ...enPlus };
  const themes = themesDesSalons(m);
  const [passions, { parTheme, plusVivant }] = await Promise.all([lirePassions(supabase, moi.id).catch(() => null), comptesDesSalons(supabase, m)]);
  const miens = new Set(passions?.passions ?? []);
  const premier = themes.find((t) => miens.has(t.id))?.id ?? themes[0]?.id;
  const decorsVus = new Map<PieceDuo, Promise<ScenePiece | null>>();
  const gradinsVus = new Map<IdGradin, Promise<GradinScene | null>>();
  const [cartes, vitrine] = await Promise.all([
    Promise.all(
    themes.map(async (t): Promise<CarteSalon> => {
      // (🎭 son gradin validé d'abord ; sinon la pièce de son décor)
      const g = gradinDuTheme(t.id);
      if (!gradinsVus.has(g)) gradinsVus.set(g, gradinDuSalon(supabase, t.id).catch(() => null));
      const gradin = await gradinsVus.get(g)!;
      const piece = SALONS[t.id].decor;
      if (!gradin && !decorsVus.has(piece)) decorsVus.set(piece, decorDuSalon(supabase, t.id));
      const scene = gradin ? null : await decorsVus.get(piece)!;
      const image = gradin?.image ?? scene?.panorama;
      const c = parTheme.get(t.id) ?? { presents: 0, salons: 0 };
      return { theme: t.id, e: t.e, nom: SALONS[t.id].nom, presents: c.presents, salons: c.salons, mien: miens.has(t.id), decor: image ? { src: image.src, flou: image.flou } : null };
    }),
    ),
    vitrineDesSalons(supabase, m, plusVivant, premier).catch(() => undefined),
  ]);
  return { maison: m, cartes: [...cartes.filter((c) => c.mien), ...cartes.filter((c) => !c.mien)], ...(vitrine ? { vitrine } : {}), ...enPlus };
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


// ═══ 🛋️ LE LOT D2 : LA SÉANCE CHEZ MOI — ma pièce, ma télé, jusqu'à trois proches ═══════════════════════════════════
// `decouvrir/salons/prives/chez-<q de l'hôte>/` : `presents/`, `messages/` (comme un salon ouvert), `invites/<q>.json`
// (qui peut entrer), `tele.json` (la télé que l'hôte mène). Chez l'invité : `<habitant>/invitations-tele/<q>.json`.
const idSeance = (qHote: string) => `chez-${qHote}`;
const seanceDe = (id: unknown): string | null => /^chez-([A-Za-z0-9_-]{4,16})$/.exec(String(id ?? ""))?.[1] ?? null;
const cheminInvite = (qHote: string, q: string) => `${dossierSalon("prives", idSeance(qHote))}/invites/${q}.json`;
const cheminTeleSeance = (qHote: string) => `${dossierSalon("prives", idSeance(qHote))}/tele.json`;
const dossierInvitations = (h: string) => `${h}/invitations-tele`;
/** ➕ (le lot B) une place libre réservée par un lien WhatsApp : `places/<jeton>.json` ({ h, le, pris?, prisLe? }). */
const cheminPlace = (qHote: string, jeton: string) => `${dossierSalon("prives", idSeance(qHote))}/places/${jeton}.json`;
const jetonValide = (x: unknown) => (/^[A-Za-z0-9_-]{12,32}$/.test(String(x ?? "")) ? String(x) : null);
/** 🎬 (« Regarder à deux ») ce que la séance attend : la vidéo proposée, à regarder avec lui. */
const cheminEnsemble = (qHote: string) => `${dossierSalon("prives", idSeance(qHote))}/ensemble.json`;
type Ensemble = { de?: string; avec?: string | string[]; video?: VideoSalon; le?: number; fait?: number; faits?: string[]; prevenu?: number };
/** (avec qui : un proche — « Regarder à deux » —, ou ceux qu'il a invités sur une vidéo de sa télé du jour) */
const avecQui = (e: Ensemble): string[] => (Array.isArray(e.avec) ? e.avec : e.avec ? [e.avec] : []).map(s).filter(Boolean);

/** (son invitation devant cette télé : quand, 🎞️ la vidéo qu'il garde, 👥 l'invité qui l'a invité à sa place libre) */
type FicheInvite = { h?: string; le?: number; titre?: string; video?: VideoSalon; par?: string };
async function lireInvite(supabase: Supabase, qHote: string, q: string): Promise<FicheInvite | null> {
  const f = await lireJson<FicheInvite>(supabase, cheminInvite(qHote, q)).catch(() => ({}) as FicheInvite);
  return Date.now() - (Number(f.le) || 0) < INVITATION_MS ? f : null;
}
async function invite(supabase: Supabase, qHote: string, q: string): Promise<boolean> {
  return Boolean(await lireInvite(supabase, qHote, q));
}
const videoValide = (v: unknown): VideoSalon | null => {
  const x = (v ?? {}) as Partial<VideoSalon>;
  return /^[A-Za-z0-9_-]{11}$/.test(s(x.id)) ? { id: s(x.id), titre: s(x.titre), chaine: s(x.chaine), duree: Number(x.duree) || 0 } : null;
};
async function lireTeleSeance(supabase: Supabase, qHote: string): Promise<TeleSeance | null> {
  const t = await lireJson<TeleSeance>(supabase, cheminTeleSeance(qHote)).catch(() => ({}) as Partial<TeleSeance>);
  return t.video?.id && Number.isFinite(t.depart) ? (t as TeleSeance) : null;
}

/**
 * 🚪 Entrer dans une séance : chez moi (`chez` = « moi ») ou chez un proche qui m'a invité (sa clé). Quatre places ; sa
 * pièce de Ma maison (sinon le salon du catalogue) ; la télé qu'il mène — l'hôte, en arrivant, la trouve prête (la
 * première vidéo de sa télé du jour).
 */
export async function entrerChez(supabase: Supabase, moi: Habitant, chez: unknown, jetonPlace?: unknown, revoir?: unknown): Promise<Resultat<{ ouverture?: OuvertureSalonOuvert; figurine?: true }>> {
  const hHote = chez === "moi" ? moi.id : await hDeCle(supabase, chez).catch(() => null);
  if (!hHote) return { error: "Cette maison n’existe pas.", statut: 404 };
  const qHote = qui8(hHote);
  const q = qui8(moi.id);
  const hote = hHote === moi.id;
  // (➕ le lot B : un lien WhatsApp qui réserve une place libre — il s'y assoit, et ils deviennent proches ; 🎞️ son
  // invitation, lue une fois : elle porte peut-être la vidéo qu'il garde)
  let monInvite = hote ? null : await lireInvite(supabase, qHote, q);
  if (!hote && !monInvite) {
    const jeton = jetonValide(jetonPlace);
    if (!jeton) return { error: PHRASES_SALONS.pasInvite, statut: 403 };
    if (!(await figurineDeLaMaison(supabase, moi.id).catch(() => null))) return { error: PHRASES_SALONS.sansFigurine, statut: 409, figurine: true };
    const r = await prendrePlace(supabase, hHote, qHote, moi, jeton);
    if (r) return { error: r, statut: 403 };
    monInvite = await lireInvite(supabase, qHote, q);
  }
  const m: Lieu = "prives";
  const id = idSeance(qHote);
  const [figurine, prenom, prenomHote, presents, piece, cle, teleDuJour, deja, saCle] = await Promise.all([
    figurineDeLaMaison(supabase, moi.id).catch(() => null),
    prenomDe(supabase, moi).catch(() => ""),
    hote ? Promise.resolve("") : prenomDuCompte(supabase, hHote),
    presentsFrais(supabase, m, id),
    lireSaPiece(supabase, hHote).catch(() => null),
    poserProfil(supabase, hHote).catch(() => ""),
    hote ? maTeleDuJour(supabase, moi.id).catch(() => null) : Promise.resolve(null),
    lireTeleSeance(supabase, qHote),
    hote ? Promise.resolve("") : poserProfil(supabase, moi.id).catch(() => ""),
  ]);
  const maCle = hote ? cle : saCle;
  if (!figurine) return { error: PHRASES_SALONS.sansFigurine, statut: 409, figurine: true };
  const autres = presents.filter((p) => p.nom !== q);
  if (autres.length >= PLACES_SEANCE) return { error: "Toutes les places sont prises.", statut: 409 };
  const fiches = await Promise.all(autres.map((p) => lirePresent(supabase, m, id, p.nom)));
  const prises = new Set(fiches.map((f) => Number(f.place)));
  // (l'hôte au milieu, devant ; ses proches à côté)
  const place = hote && !prises.has(0) ? 0 : [...Array(PLACES_SEANCE).keys()].find((k) => !prises.has(k)) ?? 0;
  const maintenant = Date.now();
  // (👥 sa maison, sur sa fiche : entre proches et proches de proches, « 🏠 Voir sa maison » — sa maison décide qui entre)
  const fiche: FichePresent = { q, h: moi.id, prenom: prenom || "Quelqu’un", figurine, place, arrive: maintenant, ecrits: [], ...(maCle ? { maison: maCle } : {}) };
  if (!(await ecrireJson(supabase, `${dossierPresents(m, id)}/${q}.json`, fiche))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  void nettoyerMessages(supabase, m, id, maintenant);
  // (🎬 « Regarder à deux » : son proche arrive pour la vidéo proposée, et l'hôte n'est pas là — il est prévenu, une fois)
  if (!hote && !presents.some((p) => p.nom === qHote)) await prevenirLHote(supabase, hHote, qHote, moi.id, prenom, maintenant).catch(() => undefined);
  // (l'hôte arrive : sa télé est prête — la première vidéo de sa télé du jour, si rien ne passe depuis six heures)
  const videos: VideoSalon[] = (teleDuJour?.videos ?? []).map((v) => ({ id: v.id, titre: v.titre, chaine: v.chaine, duree: v.duree }));
  let seance = deja && maintenant - deja.depart < INVITATION_MS ? deja : null;
  // (📼 section 31 : « Revoir » — chez moi, la télé se cale sur cette vidéo déjà vue, depuis le début ; mes amis qui l'ont
  // vue y rejouent leurs réactions)
  const aRevoir = hote && revoir ? await maVideo(supabase, moi.id, revoir).catch(() => null) : null;
  if (aRevoir) {
    seance = { video: { id: aRevoir.id, titre: aRevoir.titre, chaine: aRevoir.chaine, duree: aRevoir.duree }, depart: maintenant, n: (deja?.n ?? 0) + 1 };
    await ecrireJson(supabase, cheminTeleSeance(qHote), seance);
  }
  if (hote && !seance && videos.length) {
    seance = { video: videos[0], depart: maintenant, n: (deja?.n ?? 0) + 1 };
    await ecrireJson(supabase, cheminTeleSeance(qHote), seance);
  }
  const decor = (piece ? await sceneDeLaMaison(supabase, piece).catch(() => null) : null) ?? (await decorDuSalon(supabase, "series"));
  const messages = await derniersMessages(supabase, m, id, { depuis: maintenant - CONSERVE_MS, limite: 20, caches: [] });
  const nomHote = hote ? prenom : prenomHote;
  // (🎞️ « il garde sa vidéo » : invité avec une vidéo, il la regarde depuis le début, à son rythme — ensemble en direct
  // tant que l'hôte est dessus)
  const gardee = videoValide(monInvite?.video);
  return {
    ouverture: {
      salon: { id, n: 1, nom: PHRASES_SALONS.chez(nomHote || "toi"), maison: m, seance: { hote, prenom: nomHote, cle } },
      moi: q,
      presents: [...fiches.filter((f) => f.q).map(publicDe), publicDe(fiche)],
      messages,
      caches: [],
      decor,
      gradin: null,
      tele: { videos, maintenant, seance, ...(gardee ? { gardee } : {}) },
    },
  };
}
/**
 * 🎞️ (21 novembre 2026) LA VIDÉO D'UNE SÉANCE, POUR Y RÉAGIR : l'hôte ou un invité — celle qui passe à la télé de l'hôte,
 * ou celle que l'invité garde (son invitation). Ses réactions s'y gardent à la seconde, même si elle n'est pas à sa télé
 * du jour ; et il y voit celles de ses proches. Rien d'autre : `null`.
 */
export async function videoDeLaSeance(supabase: Supabase, moi: Habitant, salon: unknown, id: unknown): Promise<VideoSalon | null> {
  const qHote = seanceDe(salon);
  const i = s(id);
  if (!qHote || !/^[A-Za-z0-9_-]{11}$/.test(i)) return null;
  const hote = qHote === qui8(moi.id);
  const [tele, monInvite] = await Promise.all([lireTeleSeance(supabase, qHote), hote ? Promise.resolve(null) : lireInvite(supabase, qHote, qui8(moi.id))]);
  if (!hote && !monInvite) return null;
  if (tele?.video.id === i) return tele.video;
  const gardee = videoValide(monInvite?.video);
  return gardee?.id === i ? gardee : null;
}
/** Le prénom de l'hôte (son compte, sinon sa fiche de figurine). */
async function prenomDuCompte(supabase: Supabase, h: string): Promise<string> {
  const { data } = await supabase.from("human_habitants").select("prenom").eq("id", h).maybeSingle();
  const p = s((data as { prenom?: string } | null)?.prenom) || (await prenomDe(supabase, { id: h } as Habitant).catch(() => ""));
  return p || "Ton proche";
}

/** 📺 L'hôte mène la télé : une vidéo de sa télé du jour, « Suivante », la pause, la reprise. */
export async function teleDeLaSeance(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat<{ seance?: TeleSeance }>> {
  const qHote = seanceDe(p.salon);
  // (🎞️ 21 novembre 2026 : ensemble sur la même vidéo, l'invité aussi la met en pause et la reprend — pour tout le monde ;
  // choisir la vidéo reste à l'hôte : c'est sa télé du jour)
  const hote = qHote === qui8(moi.id);
  const pauseOuReprise = p.quoi === "pause" || p.quoi === "jouer";
  if (!qHote || (!hote && !(pauseOuReprise && (await invite(supabase, qHote, qui8(moi.id)))))) return { error: "C’est l’hôte qui mène la télé.", statut: 403 };
  const t = await lireTeleSeance(supabase, qHote);
  const maintenant = Date.now();
  let seance: TeleSeance | null = null;
  // (🎞️ à plusieurs, deux peuvent toucher en même temps : déjà en pause, ou déjà partie — rien ne bouge)
  if ((p.quoi === "pause" && t?.pause !== undefined) || (p.quoi === "jouer" && t && t.pause === undefined)) return { seance: t! };
  if (p.quoi === "pause" && t) seance = { ...t, pause: (maintenant - t.depart) / 1000, n: t.n + 1 };
  else if (p.quoi === "jouer" && t) seance = { ...t, depart: maintenant - (t.pause ?? 0) * 1000, pause: undefined, n: t.n + 1 };
  else if (p.quoi === "video" || p.quoi === "suivante") {
    const videos = (await maTeleDuJour(supabase, moi.id).catch(() => null))?.videos ?? [];
    const k = p.quoi === "suivante" ? videos.findIndex((v) => v.id === t?.video.id) + 1 : videos.findIndex((v) => v.id === s(p.id));
    const v = videos[k] ?? (p.quoi === "suivante" ? videos[0] : undefined);
    if (!v) return { error: "Cette vidéo n’est pas à ta télé.", statut: 404 };
    seance = { video: { id: v.id, titre: v.titre, chaine: v.chaine, duree: v.duree }, depart: maintenant, n: (t?.n ?? 0) + 1 };
  }
  if (!seance) return { error: "Demande incomplète.", statut: 400 };
  const { pause, ...reste } = seance;
  const ecrit = pause === undefined ? reste : seance;
  if (!(await ecrireJson(supabase, cheminTeleSeance(qHote), ecrit))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  return { seance: ecrit as TeleSeance };
}

/**
 * 👥 Inviter jusqu'à trois proches (des deux côtés) devant ma télé : chacun voit l'invitation dans Découvrir (« Venir »
 * / « Pas maintenant ») et reçoit une notification ; elle tient six heures.
 */
export async function inviterChezMoi(supabase: Supabase, moi: Habitant, cles: unknown, o: { titre?: string; video?: VideoSalon } = {}): Promise<Resultat<{ invites?: string[] }>> {
  const l = (Array.isArray(cles) ? cles : []).map(s).filter(Boolean);
  if (!l.length) return { error: "Qui invites-tu ?", statut: 400 };
  if (l.length > INVITES_MAX) return { error: `${INVITES_MAX} proches au plus.`, statut: 400 };
  const [prenom, maCle] = await Promise.all([prenomDe(supabase, moi).catch(() => ""), poserProfil(supabase, moi.id)]);
  const qMoi = qui8(moi.id);
  const maintenant = Date.now();
  const invites: string[] = [];
  for (const cle of l) {
    const h = await hDeCle(supabase, cle).catch(() => null);
    if (!h || h === moi.id || !(await seParlent(supabase, moi.id, h).catch(() => false))) continue;
    const q = qui8(h);
    // (une invitation par proche toutes les dix minutes : pas de pluie de notifications)
    const avant = await lireJson<{ le?: number; titre?: string }>(supabase, cheminInvite(qMoi, q)).catch(() => ({}) as { le?: number; titre?: string });
    const recente = maintenant - (Number(avant.le) || 0) < 10 * 60_000;
    const avec = { ...(o.titre ? { titre: o.titre } : {}), ...(o.video ? { video: o.video } : {}) };
    await ecrireJson(supabase, cheminInvite(qMoi, q), { h, le: maintenant, ...avec });
    await ecrireJson(supabase, `${dossierInvitations(h)}/${qMoi}.json`, { cle: maCle, prenom: prenom || "Ton proche", le: maintenant, ...avec });
    // (🎬 « Regarder à deux » : une vidéo proposée se dit — une autre vidéo passe même après une invitation récente ; la
    // même, non : pas de pluie de notifications)
    const notif = o.titre
      ? { titre: PHRASES_REGARDER.notifTitre(prenom || "Ton proche", o.titre), corps: PHRASES_REGARDER.notifCorps }
      : { titre: PHRASES_SALONS.invitation(prenom || "Ton proche"), corps: "Viens t’asseoir : on regarde la même vidéo, en même temps." };
    if (!recente || (o.titre && o.titre !== avant.titre)) await prevenirUnHabitantAppli(supabase, h, { ...notif, url: `/univers/salons?chez=${maCle}`, tag: `tele-${qMoi}` }).catch(() => "rien");
    invites.push(cle);
  }
  if (!invites.length) return { error: "Ces personnes ne sont pas tes proches.", statut: 403 };
  return { invites };
}

/**
 * 👥 (21 novembre 2026, le propriétaire : « s'il reste un siège de libre […] mon ami peut inviter un ami à lui aussi, juste
 * en cliquant sur le siège de libre » ; puis « non, juste invité ») L'INVITÉ INVITE : assis chez un proche, j'invite un de
 * MES proches à une place libre. Il devient invité de la séance (six heures) — pas le proche de l'hôte : l'hôte est
 * prévenu, et l'ajoute s'il veut depuis sa fiche. Chez moi : `inviterChezMoi`.
 */
export async function inviterALaSeance(supabase: Supabase, moi: Habitant, salon: unknown, chez: unknown, cles: unknown): Promise<Resultat<{ invites?: string[] }>> {
  const qHote = seanceDe(salon);
  const q = qui8(moi.id);
  if (!qHote || qHote === q) return inviterChezMoi(supabase, moi, cles);
  const hHote = await hoteDeLaSeance(supabase, qHote, chez);
  if (!hHote) return { error: "Cette maison n’existe pas.", statut: 404 };
  const l = (Array.isArray(cles) ? cles : []).map(s).filter(Boolean);
  if (!l.length) return { error: "Qui invites-tu ?", statut: 400 };
  const [monInvite, presents] = await Promise.all([lireInvite(supabase, qHote, q), presentsFrais(supabase, "prives", idSeance(qHote))]);
  if (!monInvite) return { error: PHRASES_SALONS.pasInvite, statut: 403 };
  const libres = PLACES_SEANCE - presents.length;
  if (libres <= 0) return { error: "Toutes les places sont prises.", statut: 409 };
  if (l.length > libres) return { error: libres > 1 ? `${libres} places libres au plus.` : "Une seule place libre.", statut: 400 };
  const [prenom, prenomHote, cleHote] = await Promise.all([prenomDe(supabase, moi).catch(() => ""), prenomDuCompte(supabase, hHote), poserProfil(supabase, hHote).catch(() => "")]);
  if (!cleHote) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  const maintenant = Date.now();
  const invites: string[] = [];
  for (const cle of l) {
    const h = await hDeCle(supabase, cle).catch(() => null);
    if (!h || h === moi.id || h === hHote || !(await seParlent(supabase, moi.id, h).catch(() => false))) continue;
    const qLui = qui8(h);
    // (déjà invité devant cette télé — par l'hôte, ou par un autre : rien ne change, pas de seconde notification)
    if (await invite(supabase, qHote, qLui)) {
      invites.push(cle);
      continue;
    }
    await ecrireJson(supabase, cheminInvite(qHote, qLui), { h, le: maintenant, par: moi.id });
    await ecrireJson(supabase, `${dossierInvitations(h)}/${qHote}.json`, { cle: cleHote, prenom: prenomHote, le: maintenant, par: prenom || "Ton proche" });
    await prevenirUnHabitantAppli(supabase, h, { titre: PHRASES_SALONS.invitationPar(prenom || "Ton proche", prenomHote), corps: "Viens t’asseoir : on regarde la même vidéo, en même temps.", url: `/univers/salons?chez=${cleHote}`, tag: `tele-${qHote}` }).catch(() => "rien");
    invites.push(cle);
  }
  if (!invites.length) return { error: "Ces personnes ne sont pas tes proches.", statut: 403 };
  await prevenirUnHabitantAppli(supabase, hHote, { titre: PHRASES_SALONS.invitePar(prenom || "Ton proche", invites.length), corps: PHRASES_SALONS.inviteParCorps, url: "/univers/salons?chez=moi", tag: `tele-${qHote}` }).catch(() => "rien");
  return { invites };
}
/** (le compte de l'hôte d'une séance : sa clé — que l'écran connaît, `seance.cle` —, qui doit être celle de la séance) */
async function hoteDeLaSeance(supabase: Supabase, qHote: string, chez: unknown): Promise<string | null> {
  const h = await hDeCle(supabase, chez).catch(() => null);
  return h && qui8(h) === qHote ? h : null;
}

/**
 * ➕ (le lot B, 21 novembre 2026) UNE PLACE LIBRE DE MA TÉLÉ, PAR WHATSAPP : un lien qui la réserve (six heures, une seule
 * personne) — `/univers/salons?chez=<ma clé>&place=<jeton>`. Celui qui l'ouvre (sa figurine faite) s'y assoit, et nous
 * devenons proches des deux côtés (le propriétaire : « oui, proche en s'asseyant »).
 */
export async function reserverUnePlace(supabase: Supabase, moi: Habitant, o: { salon?: unknown; chez?: unknown } = {}): Promise<Resultat<{ lien?: string; prenom?: string; chez?: string }>> {
  // (👥 21 novembre 2026, « l'invité invite » : assis chez un proche, le lien réserve une place chez lui — `par` : moi)
  const qHote = seanceDe(o.salon);
  const chezUnProche = Boolean(qHote && qHote !== qui8(moi.id));
  const hHote = chezUnProche ? await hoteDeLaSeance(supabase, qHote!, o.chez) : moi.id;
  if (!hHote) return { error: "Cette maison n’existe pas.", statut: 404 };
  if (chezUnProche && !(await invite(supabase, qHote!, qui8(moi.id)))) return { error: PHRASES_SALONS.pasInvite, statut: 403 };
  const [cle, prenom, prenomHote] = await Promise.all([poserProfil(supabase, hHote), prenomDe(supabase, moi).catch(() => ""), chezUnProche ? prenomDuCompte(supabase, hHote) : Promise.resolve("")]);
  if (!cle) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  const jeton = randomBytes(12).toString("base64url");
  if (!(await ecrireJson(supabase, cheminPlace(qui8(hHote), jeton), { h: hHote, le: Date.now(), ...(chezUnProche ? { par: moi.id } : {}) }))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  return { lien: `/univers/salons?chez=${encodeURIComponent(cle)}&place=${jeton}`, prenom, ...(chezUnProche ? { chez: prenomHote } : {}) };
}
/**
 * 🖼️ L'APERÇU D'UN LIEN DE PLACE, DANS WHATSAPP (21 novembre 2026, le propriétaire : « la miniature sur WhatsApp parle
 * d'un autre concept ») : le prénom de celui qui invite et sa figurine assise — seulement pour un lien de place qui
 * existe (créé il y a moins d'une semaine) : une clé seule ne montre la figurine de personne.
 */
export async function apercuDeLaPlace(supabase: Supabase, chez: unknown, jeton: unknown): Promise<{ prenom: string; figurine: Buffer | null; chez?: string } | null> {
  const j = jetonValide(jeton);
  if (!j) return null;
  const hHote = await hDeCle(supabase, chez).catch(() => null);
  if (!hHote) return null;
  const f = await lireJson<{ h?: string; le?: number; par?: string }>(supabase, cheminPlace(qui8(hHote), j)).catch(() => ({}) as { h?: string; le?: number; par?: string });
  if (f.h !== hHote || Date.now() - (Number(f.le) || 0) > 7 * 24 * 3600_000) return null;
  // (sa figurine assise, détourée — celle de sa maison : faite ici si elle ne l'est pas encore ; lue dans le seau ; 👥 une
  // place réservée par un invité : son prénom et sa figurine à lui, « chez Léa »)
  const qui = s(f.par) || hHote;
  const [prenom, faite, prenomHote] = await Promise.all([prenomDuCompte(supabase, qui).catch(() => ""), figurineDeLaMaison(supabase, qui).catch(() => null), f.par ? prenomDuCompte(supabase, hHote).catch(() => "") : Promise.resolve("")]);
  const figurine = faite ? await telecharger(supabase, `${qui}/ma-piece/figurine.png`).catch(() => null) : null;
  return { prenom, figurine, ...(prenomHote ? { chez: prenomHote } : {}) };
}
/** (il ouvre le lien d'une place : elle est à lui — l'invitation, et proches des deux côtés ; `null` : c'est fait) */
async function prendrePlace(supabase: Supabase, hHote: string, qHote: string, moi: Habitant, jeton: string): Promise<string | null> {
  const f = await lireJson<{ h?: string; le?: number; pris?: string; par?: string }>(supabase, cheminPlace(qHote, jeton)).catch(() => ({}) as { h?: string; le?: number; pris?: string; par?: string });
  const encore = f.h === hHote && Date.now() - (Number(f.le) || 0) < INVITATION_MS;
  if (!encore || (f.pris && f.pris !== moi.id)) return PHRASES_SALONS.placePerimee;
  const maintenant = Date.now();
  if (!f.pris) await ecrireJson(supabase, cheminPlace(qHote, jeton), { ...f, pris: moi.id, prisLe: maintenant });
  // (👥 une place réservée par un invité : proches de lui seulement — l'hôte est prévenu, et l'ajoute s'il veut)
  const par = s(f.par);
  const ami = par && par !== moi.id ? par : hHote;
  await ecrireJson(supabase, cheminInvite(qHote, qui8(moi.id)), { h: moi.id, le: maintenant, ...(par ? { par } : {}) });
  if (ami !== moi.id) await Promise.all([ajouterProche(supabase, moi.id, ami), ajouterProche(supabase, ami, moi.id)]);
  if (!f.pris) {
    const prenom = (await prenomDe(supabase, moi).catch(() => "")) || "Quelqu’un";
    if (ami === hHote) await prevenirUnHabitantAppli(supabase, hHote, { titre: PHRASES_SALONS.placePrise(prenom), corps: PHRASES_SALONS.placePriseCorps, url: "/univers/salons?chez=moi", tag: `tele-${qHote}` }).catch(() => "rien");
    else {
      const prenomPar = (await prenomDuCompte(supabase, ami).catch(() => "")) || "un proche";
      const cleHote = await poserProfil(supabase, hHote).catch(() => "");
      await prevenirUnHabitantAppli(supabase, hHote, { titre: PHRASES_SALONS.placePriseChez(prenom, prenomPar), corps: PHRASES_SALONS.placePriseChezCorps, url: "/univers/salons?chez=moi", tag: `tele-${qHote}` }).catch(() => "rien");
      await prevenirUnHabitantAppli(supabase, ami, { titre: PHRASES_SALONS.placePrise(prenom), corps: PHRASES_SALONS.placePriseCorps, url: `/univers/salons?chez=${cleHote}`, tag: `tele-${qHote}` }).catch(() => "rien");
    }
  }
  return null;
}

/** 🎬 Mes invitations (de moins de six heures). */
export async function mesInvitations(supabase: Supabase, moi: Habitant): Promise<InvitationTele[]> {
  const l = await lister(supabase, dossierInvitations(moi.id), { limite: 20, recents: true });
  const lus = await Promise.all(l.map((e) => lireJson<Partial<InvitationTele>>(supabase, `${dossierInvitations(moi.id)}/${e.nom}`)));
  return lus
    .filter((x) => s(x.cle) && Date.now() - (Number(x.le) || 0) < INVITATION_MS)
    .map((x) => {
      const video = videoValide(x.video);
      return { cle: s(x.cle), prenom: s(x.prenom), le: Number(x.le), ...(s(x.titre) ? { titre: s(x.titre) } : {}), ...(video ? { video } : {}), ...(s(x.par) ? { par: s(x.par) } : {}) };
    });
}

// ═══ 🎬 REGARDER À DEUX (`ma-maison.md`, section 24) ═══════════════════════════════════════════════════════════════
/**
 * 🎬 En visite chez un proche (des deux côtés) : une vidéo à regarder avec lui — une de ma télé du jour (`id`), ou un
 * lien YouTube (`lien`). Ma séance est prête (la vidéo, en pause au début : on la lance ensemble) ; il est invité devant
 * ma télé (six heures), et sa maison le dit (« Pendant ton absence »).
 */
export async function proposerDeRegarder(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat<{ titre?: string }>> {
  const h = await hDeCle(supabase, p.cle).catch(() => null);
  if (!h) return { error: "Cette maison n’existe pas.", statut: 404 };
  if (h === moi.id) return { error: "C’est chez toi 🙂", statut: 400 };
  if (!(await seParlent(supabase, moi.id, h).catch(() => false))) return { error: PHRASES_REGARDER.pasProche, statut: 403 };
  let video: VideoSalon | null = null;
  if (s(p.id)) {
    const v = ((await maTeleDuJour(supabase, moi.id).catch(() => null))?.videos ?? []).find((x) => x.id === s(p.id));
    if (!v) return { error: PHRASES_REGARDER.pasATaTele, statut: 404 };
    video = { id: v.id, titre: v.titre, chaine: v.chaine, duree: v.duree };
  } else if (s(p.lien)) {
    const y = videoYouTube(s(p.lien).slice(0, LIEN_REGARDER_MAX));
    if (!y) return { error: PHRASES_REGARDER.pasYouTube, statut: 400 };
    // (sa fiche YouTube — le faux YouTube dans les essais : son titre, sa chaîne, sa durée ; une vidéo qui ne se regarde
    // pas ici — réservée aux adultes, pas lisible ailleurs, en direct, des mots d'alcool — est refusée ; YouTube muet :
    // elle passe quand même, sous le nom « Une vidéo YouTube »)
    const fiche = await details([y.id], { min: 1, max: 6 * 3600 }).then(
      (l) => l[0] ?? null,
      () => undefined,
    );
    if (fiche === null) return { error: PHRASES_REGARDER.pasIci, statut: 400 };
    video = fiche ? { id: fiche.id, titre: fiche.titre, chaine: fiche.chaine, duree: fiche.duree } : { id: y.id, titre: TITRE_PAR_DEFAUT, chaine: "", duree: 0 };
  } else return { error: PHRASES_REGARDER.choisis, statut: 400 };
  const qMoi = qui8(moi.id);
  const maintenant = Date.now();
  const avant = await lireTeleSeance(supabase, qMoi);
  const seance: TeleSeance = { video, depart: maintenant, pause: 0, n: (avant?.n ?? 0) + 1 };
  if (!(await ecrireJson(supabase, cheminTeleSeance(qMoi), seance))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  await ecrireJson(supabase, cheminEnsemble(qMoi), { de: moi.id, avec: [h], video, le: maintenant } satisfies Ensemble);
  const cle = await poserProfil(supabase, h).catch(() => "");
  const r = await inviterChezMoi(supabase, moi, [cle], { titre: video.titre, video });
  if (r.error) return { error: r.error, statut: r.statut };
  return { titre: video.titre };
}
/**
 * 👥 (21 novembre 2026, le propriétaire : « au lieu d'avoir directement la liste de nos amis […] on est sorti de la page »)
 * INVITER SUR CETTE VIDÉO, depuis ma télé du jour, sans la quitter : ma séance se cale sur elle (à la seconde où j'en suis,
 * en pause : on la lance ensemble) ; mes proches choisis (trois au plus) sont invités devant ma télé, avec la vidéo
 * (« 🎬 Léa veut regarder « … » avec toi », leur maison le dit) ; regardée ensemble, elle devient un souvenir commun.
 */
export async function inviterSurUneVideo(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat<{ invites?: string[]; titre?: string; cle?: string }>> {
  const v = await maVideo(supabase, moi.id, p.id).catch(() => null);
  if (!v) return { error: PHRASES_REGARDER.pasATaTele, statut: 404 };
  const cles = (Array.isArray(p.cles) ? p.cles : []).map(s).filter(Boolean);
  if (!cles.length) return { error: "Qui invites-tu ?", statut: 400 };
  if (cles.length > INVITES_MAX) return { error: `${INVITES_MAX} proches au plus.`, statut: 400 };
  const video: VideoSalon = { id: v.id, titre: v.titre, chaine: v.chaine, duree: v.duree };
  const qMoi = qui8(moi.id);
  const maintenant = Date.now();
  const t = Math.max(0, Math.min(Number(p.t) || 0, Math.max(0, (v.duree || 1e6) - 5)));
  // (les proches d'abord : personne d'autre ne compte)
  const hs: string[] = [];
  for (const cle of cles) {
    const h = await hDeCle(supabase, cle).catch(() => null);
    if (h && h !== moi.id && (await seParlent(supabase, moi.id, h).catch(() => false))) hs.push(h);
  }
  if (!hs.length) return { error: "Ces personnes ne sont pas tes proches.", statut: 403 };
  const avant = await lireTeleSeance(supabase, qMoi);
  if (!(await ecrireJson(supabase, cheminTeleSeance(qMoi), { video, depart: maintenant - t * 1000, pause: t, n: (avant?.n ?? 0) + 1 } satisfies TeleSeance))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  await ecrireJson(supabase, cheminEnsemble(qMoi), { de: moi.id, avec: hs, video, le: maintenant } satisfies Ensemble);
  const r = await inviterChezMoi(supabase, moi, cles, { titre: video.titre, video });
  if (r.error) return { error: r.error, statut: r.statut };
  return { invites: r.invites, titre: video.titre, cle: await poserProfil(supabase, moi.id).catch(() => "") };
}
/**
 * (le pouls d'une séance : la vidéo proposée, regardée ensemble — les deux là, elle joue, une vingtaine de secondes —
 * devient un souvenir commun ; c'est le pouls de l'hôte qui le pose, une fois ; puis il se dit aux deux un moment)
 */
async function souvenirSiEnsemble(supabase: Supabase, qHote: string, q: string, presents: Entree[], seance: TeleSeance, maintenant: number): Promise<string | null> {
  const e = await lireJson<Ensemble>(supabase, cheminEnsemble(qHote)).catch(() => ({}) as Ensemble);
  const avec = avecQui(e);
  if (!e.de || !avec.length || !e.video?.id) return null;
  const dit = e.fait && maintenant - e.fait < SOUVENIR_DIT_MS ? e.video.titre : null;
  if (q !== qHote || maintenant - (Number(e.le) || 0) > INVITATION_MS) return dit;
  // (ceux qui sont là, avec qui ce n'est pas encore un souvenir)
  const faits = new Set(e.faits ?? (e.fait ? avec : []));
  const ici = new Set(presents.map((p) => p.nom));
  const la = avec.filter((h) => !faits.has(h) && ici.has(qui8(h)));
  if (!la.length || !ici.has(qHote)) return dit;
  if (seance.video.id !== e.video.id || seance.pause !== undefined || positionSeance(seance, maintenant) < SECONDES_ENSEMBLE) return dit;
  if (!(await ecrireJson(supabase, cheminEnsemble(qHote), { ...e, fait: maintenant, faits: [...faits, ...la] }))) return dit;
  for (const h of la) await poserSouvenirCommun(supabase, e.de, h, e.video);
  return e.video.titre;
}
/** (son proche arrive pour la vidéo proposée et l'hôte n'est pas là : « 🎬 Léa est devant ta télé », une fois) */
async function prevenirLHote(supabase: Supabase, hHote: string, qHote: string, hVenu: string, prenom: string, maintenant: number): Promise<void> {
  const e = await lireJson<Ensemble>(supabase, cheminEnsemble(qHote)).catch(() => ({}) as Ensemble);
  if (!avecQui(e).includes(hVenu) || e.fait || e.prevenu || !e.video || maintenant - (Number(e.le) || 0) > INVITATION_MS) return;
  await ecrireJson(supabase, cheminEnsemble(qHote), { ...e, prevenu: maintenant });
  await prevenirUnHabitantAppli(supabase, hHote, { titre: PHRASES_REGARDER.arriveTitre(prenom || "Ton proche"), corps: PHRASES_REGARDER.arriveCorps(e.video.titre), url: "/univers/salons?chez=moi", tag: `tele-${qHote}` }).catch(() => "rien");
}
/** « Pas maintenant » : l'invitation s'en va (celle de cet hôte). */
export async function refuserInvitation(supabase: Supabase, moi: Habitant, cle: unknown): Promise<Resultat> {
  const h = await hDeCle(supabase, cle).catch(() => null);
  if (!h) return { error: "Qui ?", statut: 400 };
  await effacer(supabase, [`${dossierInvitations(moi.id)}/${qui8(h)}.json`]);
  return {};
}

// ═══ 🗄️ LE LOT D5 : L'ÉTAGÈRE DES SALONS, « MES SALONS », AJOUTER EN PROCHE ═══════════════════════════════════════
// ❤️ `…/<salon>/aimes/<message>-<q>.json` (un fichier par cœur) ; 🗄️ `decouvrir/salons/<maison>/etageres/<thème>/<message>.json`
// (sans limite de temps) ; 🏠 `<habitant>/mes-salons.json` ; 👯 `decouvrir/demandes/<habitant>/<q>.json`.
const dossierEtagere = (m: MaisonSalons, theme: IdTheme) => `${base(m)}/etageres/${theme}`;
const dossierDemandes = (h: string) => `decouvrir/demandes/${h}`;
const ID_MESSAGE = /^\d{13}-[A-Za-z0-9_-]{4,16}-[0-9a-f]{6}$/;

/** ❤️ Aimer un message d'un salon ouvert : aimé par trois personnes, il monte sur l'étagère du salon. */
export async function aimerMessage(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat<{ aimes?: number; etagere?: boolean }>> {
  const r = await sonSalon(supabase, moi, p.salon);
  if (r.error || !r.m || !r.id) return { error: r.error, statut: r.statut };
  if (r.seance || r.m === "prives") return { error: "L’étagère, c’est dans les salons ouverts.", statut: 400 };
  const x = salonDe(r.id)!;
  const idm = s(p.message);
  if (!ID_MESSAGE.test(idm)) return { error: "Quel message ?", statut: 400 };
  const msg = await lireJson<Partial<FicheMessage>>(supabase, `${dossierMessages(r.m, r.id)}/${idm}.json`);
  if (msg.sorte !== "texte" || !msg.texte) return { error: "Ce message n’est plus là.", statut: 404 };
  const q = qui8(moi.id);
  if (msg.de === q) return { error: "Tes propres mots, d’autres les aimeront 🙂", statut: 400 };
  const dossierAimes = `${dossierSalon(r.m, r.id)}/aimes`;
  await ecrireJson(supabase, `${dossierAimes}/${idm}-${q}.json`, { le: Date.now() });
  const { data } = await supabase.storage.from(SEAU_FIGURINES).list(dossierAimes, { limit: 100, search: idm });
  const aimes = new Set(((Array.isArray(data) ? data : []) as { name?: string }[]).map((f) => s(f.name)).filter((n) => n.startsWith(`${idm}-`))).size;
  const etagere = aimes >= AIMES_POUR_ETAGERE;
  if (etagere) {
    const moment: MomentSalon = { id: idm, texte: s(msg.texte), prenom: s(msg.prenom), le: Number(msg.le) || Date.now(), n: aimes };
    await ecrireJson(supabase, `${dossierEtagere(r.m, x.theme)}/${idm}.json`, moment);
  }
  return { aimes, etagere };
}

/** 🗄️ L'étagère d'un salon (de son thème) : les moments aimés, les plus récents d'abord. */
export async function etagereDuSalon(supabase: Supabase, moi: Habitant, id: unknown): Promise<Resultat<{ moments?: MomentSalon[] }>> {
  const r = await sonSalon(supabase, moi, id);
  if (r.error || !r.m || !r.id) return { error: r.error, statut: r.statut };
  if (r.seance || r.m === "prives") return { moments: [] };
  const x = salonDe(r.id)!;
  const l = await lister(supabase, dossierEtagere(r.m, x.theme), { limite: 40, recents: true });
  const lus = await Promise.all(l.map((e) => lireJson<Partial<MomentSalon>>(supabase, `${dossierEtagere(r.m as MaisonSalons, x.theme)}/${e.nom}`)));
  return { moments: lus.filter((m) => m.id && m.texte).map((m) => m as MomentSalon).sort((a, b) => b.le - a.le) };
}

/** 📌 Garder un moment de l'étagère : il va dans ma maison (sur mon étagère), avec le nom du salon. */
export async function garderMoment(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat<{ id?: string }>> {
  const r = await sonSalon(supabase, moi, p.salon);
  if (r.error || !r.m || !r.id || r.m === "prives") return { error: r.error ?? "Quel salon ?", statut: r.statut ?? 400 };
  const x = salonDe(r.id)!;
  const idm = s(p.moment);
  if (!ID_MESSAGE.test(idm)) return { error: "Quel moment ?", statut: 400 };
  const moment = await lireJson<Partial<MomentSalon>>(supabase, `${dossierEtagere(r.m, x.theme)}/${idm}.json`);
  if (!moment.texte) return { error: "Ce moment n’est plus sur l’étagère.", statut: 404 };
  const nom = nomDuSalon(x.theme).replace(/^\S+\s/, "");
  const g = await ajouterChezMoi(supabase, moi, { quoi: "autre", titre: `« ${s(moment.texte)} »`, mot: `${nom} · ${s(moment.prenom)}` });
  if (g.error) return { error: g.error, statut: g.statut };
  return { id: g.id };
}

/** 🏠 « Mes salons » : il est entré dans celui-ci (une fois par heure au plus, pour l'ordre des fanions). */
async function noterMonSalon(supabase: Supabase, h: string, theme: IdTheme, maintenant: number): Promise<void> {
  const f = await lireJson<{ themes?: Record<string, { n?: number; dernier?: number }> }>(supabase, cheminMesSalons(h)).catch(() => ({}) as { themes?: Record<string, { n?: number; dernier?: number }> });
  const themes = f.themes ?? {};
  const avant = themes[theme];
  if (avant && maintenant - (Number(avant.dernier) || 0) < 3600_000) return;
  themes[theme] = { n: (Number(avant?.n) || 0) + 1, dernier: maintenant };
  await ecrireJson(supabase, cheminMesSalons(h), { themes });
}
/**
 * 👯 Ajouter en proche quelqu'un d'un salon ouvert : s'il m'avait déjà demandé, nous voilà proches (la conversation
 * s'ouvre) ; sinon, il reçoit ma demande (dans Découvrir, et une notification). Dix par jour au plus.
 */
export async function demanderProche(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat<{ proches?: boolean; envoyee?: boolean; deja?: boolean }>> {
  const r = await sonSalon(supabase, moi, p.salon);
  if (r.error || !r.m || !r.id) return { error: r.error, statut: r.statut };
  // (👥 21 novembre 2026 : devant une télé aussi — le proche d'un invité, que l'hôte ajoute depuis sa fiche)
  const cible = s(p.q);
  const qMoi = qui8(moi.id);
  if (!/^[A-Za-z0-9_-]{4,16}$/.test(cible) || cible === qMoi) return { error: "Qui ?", statut: 400 };
  const f = await lirePresent(supabase, r.m, r.id, cible);
  const h = s(f.h);
  if (!h) return { error: "Cette personne n’est plus là.", statut: 404 };
  const prenom = await prenomDe(supabase, moi).catch(() => "");
  if (await seParlent(supabase, moi.id, h).catch(() => false)) return { proches: true, deja: true };
  // (il m'avait demandé : nous voilà proches, des deux côtés)
  const sienne = await lireJson<{ le?: number }>(supabase, `${dossierDemandes(moi.id)}/${cible}.json`).catch(() => ({}) as { le?: number });
  if (Number(sienne.le)) {
    await Promise.all([ajouterProche(supabase, moi.id, h), ajouterProche(supabase, h, moi.id)]);
    await effacer(supabase, [`${dossierDemandes(moi.id)}/${cible}.json`, `${dossierDemandes(h)}/${qMoi}.json`]);
    await prevenirUnHabitantAppli(supabase, h, { titre: PHRASES_SALONS.procheFait(prenom || "Ton nouveau proche"), corps: "Votre conversation est ouverte dans « Proches ».", url: "/collection#proches", tag: `proche-${qMoi}` }).catch(() => "rien");
    return { proches: true };
  }
  const jour = jourParis();
  const compte = await lireJson<{ jour?: string; n?: number }>(supabase, `${moi.id}/demandes-proche.json`).catch(() => ({}) as { jour?: string; n?: number });
  const n = compte.jour === jour ? Number(compte.n) || 0 : 0;
  if (n >= DEMANDES_PAR_JOUR) return { error: "Assez de demandes pour aujourd’hui : la suite demain 🙂", statut: 429 };
  const x = salonDe(r.id);
  const nomSalon = x ? nomDuSalon(x.theme, x.n).replace(/^\S+\s/, "") : r.seance ? "devant la même télé" : "un salon";
  const deja = await lireJson<{ le?: number }>(supabase, `${dossierDemandes(h)}/${qMoi}.json`).catch(() => ({}) as { le?: number });
  await ecrireJson(supabase, `${dossierDemandes(h)}/${qMoi}.json`, { de: moi.id, q: qMoi, prenom: prenom || "Quelqu’un", salon: nomSalon, le: Date.now() });
  await ecrireJson(supabase, `${moi.id}/demandes-proche.json`, { jour, n: n + 1 });
  if (!Number(deja.le)) await prevenirUnHabitantAppli(supabase, h, { titre: PHRASES_SALONS.demandeProche(prenom || "Quelqu’un", nomSalon), corps: "Accepte-la dans Découvrir : votre conversation s’ouvrira.", url: "/collection#decouvrir", tag: `demande-${qMoi}` }).catch(() => "rien");
  return { envoyee: true };
}

/** 👯 Les demandes de proche que j'ai reçues (de moins de sept jours). */
export async function mesDemandes(supabase: Supabase, moi: Habitant): Promise<DemandeProche[]> {
  const l = await lister(supabase, dossierDemandes(moi.id), { limite: 20, recents: true });
  const lus = await Promise.all(l.map((e) => lireJson<Record<string, unknown>>(supabase, `${dossierDemandes(moi.id)}/${e.nom}`)));
  return lus.filter((x) => s(x.q) && Date.now() - (Number(x.le) || 0) < 7 * 24 * 3600_000).map((x) => ({ q: s(x.q), prenom: s(x.prenom), salon: s(x.salon), le: Number(x.le) }));
}
/** 👯 Accepter (nous voilà proches) ou refuser une demande reçue. */
export async function repondreDemande(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat<{ proches?: boolean }>> {
  const q = s(p.q);
  if (!/^[A-Za-z0-9_-]{4,16}$/.test(q)) return { error: "Qui ?", statut: 400 };
  const d = await lireJson<Record<string, unknown>>(supabase, `${dossierDemandes(moi.id)}/${q}.json`);
  const h = s(d.de);
  if (!h) return { error: "Cette demande n’est plus là.", statut: 404 };
  await effacer(supabase, [`${dossierDemandes(moi.id)}/${q}.json`]);
  if (p.oui !== true) return { proches: false };
  await Promise.all([ajouterProche(supabase, moi.id, h), ajouterProche(supabase, h, moi.id)]);
  const prenom = await prenomDe(supabase, moi).catch(() => "");
  await prevenirUnHabitantAppli(supabase, h, { titre: PHRASES_SALONS.procheFait(prenom || "Ton nouveau proche"), corps: "Votre conversation est ouverte dans « Proches ».", url: "/collection#proches", tag: `proche-${qui8(moi.id)}` }).catch(() => "rien");
  return { proches: true };
}
