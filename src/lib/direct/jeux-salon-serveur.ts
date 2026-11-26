/**
 * 🙋🎯 LES JEUX DU SALON, CÔTÉ SERVEUR (`jeux-salon.ts` ; `docs/univers/decouvrir.md`, section 41).
 *
 * Rangé avec le salon (un salon ouvert, la séance chez quelqu'un, le salon d'un groupe) :
 * - `<salon>/jeu.json` : le jeu en cours (un seul à la fois) = { id, sorte, de, h, prenom, texte, debut, fin, video } ;
 * - `<salon>/jeux/<id>/votes/<q>.json` : le vote de chacun (chacun n'écrit que le sien) ;
 * - `<salon>/jeux-lances/<q>-<vidéo>.json` : il a déjà lancé un jeu sur cette vidéo.
 *
 * FICHIER SERVEUR.
 */
import { randomBytes } from "node:crypto";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { ecrireJson, lireJson, SEAU_FIGURINES } from "./ma-figurine-serveur";
import { qui8 } from "./talkie-serveur";
import { PHRASES_SALONS, refusDuMessage } from "./salons-ouverts";
import { dossierSalon, exclusion, lirePresent, presentsFrais, sonSalon, type Lieu } from "./salons-ouverts-serveur";
import { JEUX_SALON, PHRASES_JEUX, voteValide, type JeuVu, type SorteJeu, type VoteJeu } from "./jeux-salon";

type Supabase = ReturnType<typeof createAdminClient>;
type Resultat<T = object> = T & { error?: string; statut?: number; refus?: string };
type FicheJeu = Omit<JeuVu, "votes"> & { h: string; video: string };

const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const ID_VIDEO = /^[A-Za-z0-9_-]{11}$/;
const ID_JEU = /^[0-9]{10,15}-[a-f0-9]{6}$/;

const cheminJeu = (m: Lieu, sid: string) => `${dossierSalon(m, sid)}/jeu.json`;
const dossierVotes = (m: Lieu, sid: string, id: string) => `${dossierSalon(m, sid)}/jeux/${id}/votes`;
const cheminLance = (m: Lieu, sid: string, q: string, video: string) => `${dossierSalon(m, sid)}/jeux-lances/${q}-${video}.json`;

async function lireJeu(supabase: Supabase, m: Lieu, sid: string): Promise<FicheJeu | null> {
  const f = await lireJson<Partial<FicheJeu>>(supabase, cheminJeu(m, sid)).catch(() => ({}) as Partial<FicheJeu>);
  return f.id && f.de && f.sorte && Number(f.fin) > 0 ? (f as FicheJeu) : null;
}
/** En cours : on vote, ou son résultat est encore à l'écran. */
const enCours = (f: FicheJeu | null, ms: number): f is FicheJeu => Boolean(f) && ms < Number(f?.fin) + JEUX_SALON.resultatMs;

async function lesVotes(supabase: Supabase, m: Lieu, sid: string, id: string): Promise<Record<string, VoteJeu>> {
  const { data } = await supabase.storage.from(SEAU_FIGURINES).list(dossierVotes(m, sid, id), { limit: 100 });
  const noms = ((Array.isArray(data) ? data : []) as { name?: string }[]).map((x) => s(x.name)).filter((n) => n.endsWith(".json"));
  const lus = await Promise.all(noms.map(async (n) => [n.replace(/\.json$/, ""), (await lireJson<{ v?: unknown }>(supabase, `${dossierVotes(m, sid, id)}/${n}`).catch(() => ({}) as { v?: unknown })).v] as const));
  return Object.fromEntries(lus.filter(([, v]) => voteValide(v))) as Record<string, VoteJeu>;
}

/** 🙋 Le jeu en cours d'un salon (pour le pouls) ; rien s'il est fini, ou lancé par quelqu'un que je ne veux plus voir. */
export async function jeuDuSalon(supabase: Supabase, m: Lieu, sid: string, caches: string[], maintenant = Date.now()): Promise<JeuVu | null> {
  const f = await lireJeu(supabase, m, sid);
  if (!enCours(f, maintenant) || caches.includes(f.de)) return null;
  const votes = await lesVotes(supabase, m, sid, f.id);
  for (const q of caches) delete votes[q];
  return { id: f.id, sorte: f.sorte, de: f.de, prenom: f.prenom, texte: f.texte, debut: f.debut, fin: f.fin, votes };
}

/** Le salon où il est (et il y est vraiment), pas exclu. */
async function iciAuSalon(supabase: Supabase, moi: Habitant, salon: unknown, maintenant: number): Promise<Resultat<{ m?: Lieu; sid?: string; seance?: boolean; q?: string }>> {
  const r = await sonSalon(supabase, moi, salon);
  if (r.error || !r.m || !r.id) return { error: r.error, statut: r.statut };
  const q = qui8(moi.id);
  if (await exclusion(supabase, q, maintenant)) return { error: PHRASES_SALONS.exclu, statut: 403 };
  const presents = await presentsFrais(supabase, r.m, r.id, maintenant);
  if (!presents.some((x) => x.nom === q)) return { error: "Tu n’es plus dans ce salon : rentre d’abord.", statut: 409 };
  return { m: r.m, sid: r.id, seance: Boolean(r.seance), q };
}

/**
 * 🙋 Lancer un jeu (`sorte` : « accord ») : sa phrase (relue, sauf entre proches), sur la vidéo qui passe (`video`). Un
 * seul jeu à la fois dans le salon ; un jeu lancé par personne et par vidéo.
 */
export async function lancerJeu(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat<{ jeu?: JeuVu }>> {
  const maintenant = Date.now();
  const r = await iciAuSalon(supabase, moi, p.salon, maintenant);
  if (r.error || !r.m || !r.sid || !r.q) return { error: r.error, statut: r.statut };
  const { m, sid, q } = r;
  const sorte: SorteJeu = "accord";
  if (p.sorte !== sorte) return { error: "Quel jeu ?", statut: 400 };
  const video = s(p.video);
  if (!ID_VIDEO.test(video)) return { error: "Il faut une vidéo à la télé pour lancer un jeu.", statut: 400 };
  const texte = s(p.texte).replace(/\s+/g, " ");
  const refus = r.seance ? (texte ? null : "il est vide") : refusDuMessage(texte);
  if (refus) return { error: PHRASES_SALONS.refus(refus), statut: 400, refus };
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
    fin: maintenant + JEUX_SALON.voteMs,
    video,
  };
  if (!(await ecrireJson(supabase, cheminJeu(m, sid), fiche))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  await ecrireJson(supabase, cheminLance(m, sid, q, video), { le: maintenant });
  return { jeu: { id: fiche.id, sorte, de: q, prenom: fiche.prenom, texte: fiche.texte, debut: fiche.debut, fin: fiche.fin, votes: {} } };
}

/** 👍 / 👎 Voter au jeu en cours (`jeu` : son identifiant), tant que le vote est ouvert ; on peut changer d'avis. */
export async function voterAuJeu(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat> {
  const maintenant = Date.now();
  if (!voteValide(p.v)) return { error: "D’accord, ou pas d’accord ?", statut: 400 };
  const id = s(p.jeu);
  if (!ID_JEU.test(id)) return { error: PHRASES_JEUX.fini, statut: 404 };
  const r = await iciAuSalon(supabase, moi, p.salon, maintenant);
  if (r.error || !r.m || !r.sid || !r.q) return { error: r.error, statut: r.statut };
  const f = await lireJeu(supabase, r.m, r.sid);
  if (!f || f.id !== id || maintenant >= f.fin) return { error: PHRASES_JEUX.fini, statut: 409 };
  if (!(await ecrireJson(supabase, `${dossierVotes(r.m, r.sid, id)}/${r.q}.json`, { v: p.v, le: maintenant }))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  return {};
}
