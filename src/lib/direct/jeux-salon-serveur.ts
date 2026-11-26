/**
 * 🙋🎯 LES JEUX DU SALON, CÔTÉ SERVEUR (`jeux-salon.ts` ; `docs/univers/decouvrir.md`, section 41).
 *
 * Rangé avec le salon (un salon ouvert, la séance chez quelqu'un, le salon d'un groupe) :
 * - `<salon>/jeu.json` : le jeu en cours (un seul à la fois) = { id, sorte, de, h, prenom, texte, debut, fin, video,
 *   (🎯) a, aH, aPrenom, finVerite, pasMaintenant? } ;
 * - `<salon>/jeux/<id>/votes/<q>.json` : la réponse de chacun (chacun n'écrit que la sienne) ;
 * - `<salon>/jeux/<id>/verite/<q>.json` : (🎯) ce que chacun a vu au moment de vérité ;
 * - `<salon>/jeux/<id>/compte.json` : (🎯) les points, comptés une fois ;
 * - `<salon>/jeux-lances/<q>-<vidéo>.json` : il a déjà lancé un jeu sur cette vidéo.
 * - `<h>/defis/<id>.json` : (🎯) ses points d'un défi { points, jour, le } — son total, chez lui seulement ;
 *   `<h>/defis-lances/<q>.json` : il a défié cette personne (pas deux fois dans l'heure).
 *
 * FICHIER SERVEUR.
 */
import { randomBytes } from "node:crypto";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { ecrireJson, lireJson, SEAU_FIGURINES } from "./ma-figurine-serveur";
import { qui8 } from "./talkie-serveur";
import { jourParis } from "@/lib/jour-paris";
import { PHRASES_SALONS, refusDuMessage } from "./salons-ouverts";
import { dossierSalon, exclusion, lirePresent, mesCaches, presentsFrais, sonSalon, type Lieu } from "./salons-ouverts-serveur";
import { JEUX_SALON, PHRASES_JEUX, etapeDuJeu, finDuJeu, pointsDuDefi, verdictDuDefi, voteValide, type JeuVu, type SorteJeu, type VoteJeu } from "./jeux-salon";

type Supabase = ReturnType<typeof createAdminClient>;
type Resultat<T = object> = T & { error?: string; statut?: number; refus?: string };
type FicheJeu = Omit<JeuVu, "votes" | "repondu" | "temoins" | "verdict" | "points"> & { h: string; video: string; aH?: string };

const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const ID_VIDEO = /^[A-Za-z0-9_-]{11}$/;
const ID_JEU = /^[0-9]{10,15}-[a-f0-9]{6}$/;
const ID_Q = /^[A-Za-z0-9_-]{4,16}$/;

const cheminJeu = (m: Lieu, sid: string) => `${dossierSalon(m, sid)}/jeu.json`;
const dossierJeu = (m: Lieu, sid: string, id: string) => `${dossierSalon(m, sid)}/jeux/${id}`;
const cheminLance = (m: Lieu, sid: string, q: string, video: string) => `${dossierSalon(m, sid)}/jeux-lances/${q}-${video}.json`;
const dossierMesDefis = (h: string) => `${h}/defis`;

async function lireJeu(supabase: Supabase, m: Lieu, sid: string): Promise<FicheJeu | null> {
  const f = await lireJson<Partial<FicheJeu>>(supabase, cheminJeu(m, sid)).catch(() => ({}) as Partial<FicheJeu>);
  return f.id && f.de && f.sorte && Number(f.fin) > 0 ? (f as FicheJeu) : null;
}
/** En cours : on joue, ou son résultat est encore à l'écran. */
const enCours = (f: FicheJeu | null, ms: number): f is FicheJeu => Boolean(f) && ms < finDuJeu(f as FicheJeu);

async function noms(supabase: Supabase, dossier: string): Promise<string[]> {
  const { data } = await supabase.storage.from(SEAU_FIGURINES).list(dossier, { limit: 200 });
  return ((Array.isArray(data) ? data : []) as { name?: string }[]).map((x) => s(x.name)).filter((n) => n.endsWith(".json"));
}
async function lesReponses(supabase: Supabase, dossier: string): Promise<Record<string, VoteJeu>> {
  const l = await noms(supabase, dossier);
  const lus = await Promise.all(l.map(async (n) => [n.replace(/\.json$/, ""), (await lireJson<{ v?: unknown }>(supabase, `${dossier}/${n}`).catch(() => ({}) as { v?: unknown })).v] as const));
  return Object.fromEntries(lus.filter(([, v]) => voteValide(v))) as Record<string, VoteJeu>;
}

/** 🎯 Les points d'un défi, comptés une fois (le plafond du jour de chacun), puis relus. */
async function compterUneFois(supabase: Supabase, m: Lieu, sid: string, f: FicheJeu, brut: Record<string, number>): Promise<Record<string, number>> {
  const chemin = `${dossierJeu(m, sid, f.id)}/compte.json`;
  const deja = await lireJson<{ points?: Record<string, number> }>(supabase, chemin).catch(() => ({}) as { points?: Record<string, number> });
  if (deja.points) return deja.points;
  const jour = jourParis();
  const points: Record<string, number> = {};
  await Promise.all(
    Object.entries(brut).map(async ([q, n]) => {
      const h = q === f.de ? f.h : q === f.a ? s(f.aH) : s((await lirePresent(supabase, m, sid, q).catch(() => ({}) as { h?: string })).h);
      if (!h) return;
      // (des points pour trois défis par jour : au-delà, on joue pour le plaisir)
      const miens = await noms(supabase, dossierMesDefis(h));
      const lus = await Promise.all(miens.filter((x) => x !== `${f.id}.json`).map((x) => lireJson<{ jour?: string; points?: number }>(supabase, `${dossierMesDefis(h)}/${x}`).catch(() => ({}) as { jour?: string })));
      const aujourdhui = lus.filter((x) => x.jour === jour && Number((x as { points?: number }).points) > 0).length;
      const gagne = aujourdhui < JEUX_SALON.defisParJour ? n : 0;
      await ecrireJson(supabase, `${dossierMesDefis(h)}/${f.id}.json`, { points: gagne, jour, le: Date.now() });
      if (gagne) points[q] = gagne;
    }),
  );
  await ecrireJson(supabase, chemin, { points, le: Date.now() });
  return points;
}

/**
 * 🙋 Le jeu en cours d'un salon (pour le pouls), tel que je le vois (`moi` : mon `q`) ; rien s'il est fini, ou lancé
 * par quelqu'un que je ne veux plus voir. 🎯 Dans un défi, les réponses restent cachées jusqu'au résultat.
 */
export async function jeuDuSalon(supabase: Supabase, m: Lieu, sid: string, caches: string[], maintenant = Date.now(), moi = ""): Promise<JeuVu | null> {
  const f = await lireJeu(supabase, m, sid);
  if (!enCours(f, maintenant) || caches.includes(f.de)) return null;
  const votes = await lesReponses(supabase, `${dossierJeu(m, sid, f.id)}/votes`);
  for (const q of caches) delete votes[q];
  const base: JeuVu = { id: f.id, sorte: f.sorte, de: f.de, prenom: f.prenom, texte: f.texte, debut: f.debut, fin: f.fin, votes };
  if (f.sorte !== "defi" || !f.a) return base;
  const etape = etapeDuJeu(f, maintenant);
  const defi: JeuVu = { ...base, a: f.a, aPrenom: f.aPrenom, finVerite: f.finVerite, ...(f.pasMaintenant ? { pasMaintenant: true as const } : {}), repondu: Object.keys(votes) };
  if (etape === "vote") return { ...defi, votes: votes[moi] ? { [moi]: votes[moi] } : {} };
  const temoins = await lesReponses(supabase, `${dossierJeu(m, sid, f.id)}/verite`);
  for (const q of caches) delete temoins[q];
  if (etape === "verite") return { ...defi, votes: votes[moi] ? { [moi]: votes[moi] } : {}, temoins: Object.fromEntries(Object.keys(temoins).map((q) => [q, q === moi ? temoins[q] : true])) };
  const verdict = f.pasMaintenant ? null : verdictDuDefi(f.de, f.a, temoins);
  const points = f.pasMaintenant ? {} : await compterUneFois(supabase, m, sid, f, pointsDuDefi(f.de, f.a, votes, verdict));
  return { ...defi, temoins, verdict, points };
}

/** Le salon où il est (et il y est vraiment), pas exclu. */
async function iciAuSalon(supabase: Supabase, moi: Habitant, salon: unknown, maintenant: number): Promise<Resultat<{ m?: Lieu; sid?: string; seance?: boolean; q?: string; presents?: string[] }>> {
  const r = await sonSalon(supabase, moi, salon);
  if (r.error || !r.m || !r.id) return { error: r.error, statut: r.statut };
  const q = qui8(moi.id);
  if (await exclusion(supabase, q, maintenant)) return { error: PHRASES_SALONS.exclu, statut: 403 };
  const presents = (await presentsFrais(supabase, r.m, r.id, maintenant)).map((x) => x.nom.replace(/\.json$/, ""));
  if (!presents.includes(q)) return { error: "Tu n’es plus dans ce salon : rentre d’abord.", statut: 409 };
  return { m: r.m, sid: r.id, seance: Boolean(r.seance), q, presents };
}

/**
 * 🙋 Lancer un jeu : « accord » (sa phrase) ou 🎯 « defi » (`a` : qui il défie ; `quand` : 30, 60 ou « fin » ; `reste` :
 * les secondes qui restent à la vidéo). Relu, sauf entre proches ; sur la vidéo qui passe (`video`). Un seul jeu à la
 * fois dans le salon ; un jeu lancé par personne et par vidéo ; pas deux défis à la même personne dans l'heure.
 */
export async function lancerJeu(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat<{ jeu?: JeuVu }>> {
  const maintenant = Date.now();
  const r = await iciAuSalon(supabase, moi, p.salon, maintenant);
  if (r.error || !r.m || !r.sid || !r.q) return { error: r.error, statut: r.statut };
  const { m, sid, q } = r;
  if (p.sorte !== "accord" && p.sorte !== "defi") return { error: "Quel jeu ?", statut: 400 };
  const sorte: SorteJeu = p.sorte;
  const video = s(p.video);
  if (!ID_VIDEO.test(video)) return { error: PHRASES_JEUX.pasDeVideo, statut: 400 };
  const texte = s(p.texte).replace(/\s+/g, " ");
  const refus = r.seance ? (texte ? null : "il est vide") : refusDuMessage(texte);
  if (refus) return { error: PHRASES_SALONS.refus(refus), statut: 400, refus };
  // (🎯 le défi : quelqu'un d'autre, qui est là, que je vois ; quand on saura la réponse)
  let defi: Pick<FicheJeu, "a" | "aH" | "aPrenom" | "finVerite"> | null = null;
  let fin = maintenant + JEUX_SALON.voteMs;
  if (sorte === "defi") {
    const a = s(p.a);
    if (!ID_Q.test(a)) return { error: PHRASES_JEUX.plusLa, statut: 400 };
    if (a === q) return { error: PHRASES_JEUX.pasToi, statut: 400 };
    if (!r.presents?.includes(a) || (await mesCaches(supabase, moi.id)).includes(a)) return { error: PHRASES_JEUX.plusLa, statut: 409 };
    const fa = await lirePresent(supabase, m, sid, a);
    if (!s(fa.h)) return { error: PHRASES_JEUX.plusLa, statut: 409 };
    const reste = Math.max(0, Math.floor(Number(p.reste) || 0));
    const delai = p.quand === "fin" ? reste : Number(p.quand);
    if (p.quand === "fin" ? reste < JEUX_SALON.finMinS || reste > JEUX_SALON.finMaxS : !JEUX_SALON.quandS.includes(delai)) return { error: PHRASES_JEUX.videoFinit, statut: 400 };
    if (p.quand !== "fin" && reste > 0 && reste < delai) return { error: PHRASES_JEUX.videoFinit, statut: 400 };
    const avant = await lireJson<{ le?: number }>(supabase, `${moi.id}/defis-lances/${a}.json`).catch(() => ({}) as { le?: number });
    if (Number(avant.le) > maintenant - JEUX_SALON.memePersonneMs) return { error: PHRASES_JEUX.dejaDefie, statut: 409 };
    fin = maintenant + delai * 1000;
    defi = { a, aH: s(fa.h), aPrenom: s(fa.prenom) || "Quelqu’un", finVerite: fin + JEUX_SALON.veriteMs };
  }
  if (enCours(await lireJeu(supabase, m, sid), maintenant)) return { error: PHRASES_JEUX.unJeuDeja, statut: 409 };
  if (await lireJson<{ le?: number }>(supabase, cheminLance(m, sid, q, video)).then((x) => Boolean(x.le)).catch(() => false)) return { error: PHRASES_JEUX.dejaLance, statut: 409 };
  const f = await lirePresent(supabase, m, sid, q);
  const fiche: FicheJeu = {
    id: `${maintenant}-${randomBytes(3).toString("hex")}`,
    sorte,
    de: q,
    h: moi.id,
    prenom: s(f.prenom) || "Quelqu’un",
    texte: [...texte].slice(0, JEUX_SALON.texteMax).join(""),
    debut: maintenant,
    fin,
    video,
    ...(defi ?? {}),
  };
  if (!(await ecrireJson(supabase, cheminJeu(m, sid), fiche))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  await ecrireJson(supabase, cheminLance(m, sid, q, video), { le: maintenant });
  if (defi?.a) await ecrireJson(supabase, `${moi.id}/defis-lances/${defi.a}.json`, { le: maintenant });
  return { jeu: (await jeuDuSalon(supabase, m, sid, [], maintenant, q)) ?? undefined };
}

/**
 * 👍 / 👎 Répondre au jeu en cours (`jeu` : son identifiant), tant que c'est ouvert ; on peut changer d'avis. 🎯 Le défié
 * répond d'abord ; les autres après lui (ou après 20 s) ; le lanceur, non.
 */
export async function voterAuJeu(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat> {
  const maintenant = Date.now();
  if (!voteValide(p.v)) return { error: "Oui, ou non ?", statut: 400 };
  const id = s(p.jeu);
  if (!ID_JEU.test(id)) return { error: PHRASES_JEUX.fini, statut: 404 };
  const r = await iciAuSalon(supabase, moi, p.salon, maintenant);
  if (r.error || !r.m || !r.sid || !r.q) return { error: r.error, statut: r.statut };
  const f = await lireJeu(supabase, r.m, r.sid);
  if (!f || f.id !== id || maintenant >= f.fin) return { error: PHRASES_JEUX.fini, statut: 409 };
  if (f.sorte === "defi") {
    if (r.q === f.de) return { error: "C’est toi qui as lancé le défi.", statut: 400 };
    if (r.q !== f.a && maintenant < f.debut + JEUX_SALON.reponseMs && !(await lireJson<{ v?: unknown }>(supabase, `${dossierJeu(r.m, r.sid, id)}/votes/${f.a}.json`).then((x) => voteValide(x.v)).catch(() => false))) {
      return { error: PHRASES_JEUX.reflechit(s(f.aPrenom)), statut: 409 };
    }
  }
  if (!(await ecrireJson(supabase, `${dossierJeu(r.m, r.sid, id)}/votes/${r.q}.json`, { v: p.v, le: maintenant }))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  return {};
}

/** 🎯 Le défié : « Pas maintenant » (avant d'avoir répondu) — le défi s'arrête, sans points pour personne. */
export async function pasMaintenantAuDefi(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat> {
  const maintenant = Date.now();
  const r = await iciAuSalon(supabase, moi, p.salon, maintenant);
  if (r.error || !r.m || !r.sid || !r.q) return { error: r.error, statut: r.statut };
  const f = await lireJeu(supabase, r.m, r.sid);
  if (!f || f.id !== s(p.jeu) || f.sorte !== "defi" || f.a !== r.q || maintenant >= f.fin) return { error: PHRASES_JEUX.fini, statut: 409 };
  if (!(await ecrireJson(supabase, cheminJeu(r.m, r.sid), { ...f, pasMaintenant: true, fin: maintenant, finVerite: maintenant }))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  return {};
}

/** 🎯 Le moment de vérité : ce que j'ai vu (Oui / Non), tant qu'il dure. */
export async function temoignerAuDefi(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat> {
  const maintenant = Date.now();
  if (!voteValide(p.v)) return { error: "Oui, ou non ?", statut: 400 };
  const r = await iciAuSalon(supabase, moi, p.salon, maintenant);
  if (r.error || !r.m || !r.sid || !r.q) return { error: r.error, statut: r.statut };
  const f = await lireJeu(supabase, r.m, r.sid);
  if (!f || f.id !== s(p.jeu) || f.sorte !== "defi" || f.pasMaintenant || etapeDuJeu(f, maintenant) !== "verite") return { error: PHRASES_JEUX.fini, statut: 409 };
  if (!(await ecrireJson(supabase, `${dossierJeu(r.m, r.sid, f.id)}/verite/${r.q}.json`, { v: p.v, le: maintenant }))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  return {};
}

/** 🎯 Mes points de défis, en tout (chez moi seulement). */
export async function mesPointsDeDefis(supabase: Supabase, moi: Habitant): Promise<number> {
  const l = await noms(supabase, dossierMesDefis(moi.id));
  const lus = await Promise.all(l.map((n) => lireJson<{ points?: number }>(supabase, `${dossierMesDefis(moi.id)}/${n}`).catch(() => ({}) as { points?: number })));
  return lus.reduce((t, x) => t + (Number(x.points) > 0 ? Number(x.points) : 0), 0);
}
