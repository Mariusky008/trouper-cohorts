/**
 * 📅💬 LA VIE D'UN GROUPE, CÔTÉ SERVEUR — ses rendez-vous et sa discussion (Mes groupes, le lot G5, 26 novembre 2026 ;
 * `docs/univers/mes-groupes.md`).
 *
 * - Les rendez-vous : les habitudes (« le rendez-vous du soir », chaque jour ; « la découverte du mercredi », chaque
 *   semaine) et les séances exceptionnelles (une seule fois). Pour sa prochaine fois, chacun répond Je viens, Absent ou
 *   Plus tard ; ceux qui viennent ont leur figurine sur la carte, et un rappel dix minutes avant (la tâche des cinq
 *   minutes, lot G3).
 * - La discussion, entre deux rencontres : 90 signes, la modération des salons. Une idée de séance (« Partant ! ») est un
 *   rendez-vous exceptionnel qui entre dans les rendez-vous quand deux personnes sont partantes.
 *
 * Seuls les membres du groupe lisent et écrivent. Un fichier par personne : personne n'écrit celui d'un autre.
 *
 * FICHIER SERVEUR.
 */
import { randomBytes } from "node:crypto";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { SEAU_FIGURINES, ecrireJson, lireJson } from "./ma-figurine-serveur";
import { qui8 } from "./talkie-serveur";
import { prevenirUnHabitantAppli } from "./appli-collection-serveur";
import { NOTIF_DISCUSSION_MS, heureCalme } from "./regle-de-bruit";
import {
  cheminGroupe,
  cheminMembre,
  cheminRappelRdv,
  dossierDiscussion,
  dossierRdv,
  dossierReponses,
  idGroupeValide,
  listerGroupes,
  membresDe,
  type FicheMembre,
} from "./groupes-chemins-serveur";
import {
  HORIZON_MS,
  MESSAGE_GROUPE_MAX,
  NOM_GROUPE_MAX,
  PARTANTS_MIN,
  PHRASES_PROPOSITIONS as P,
  PHRASES_VIE_DU_GROUPE as PV,
  RAPPEL_APRES_MS,
  RAPPEL_AVANT_MS,
  RDV_MAX,
  REPONSES_RDV,
  prochaineFois,
  refusDuGroupe,
  themeDuGroupe,
  type MessageGroupe,
  type Recurrence,
  type RdvGroupe,
  type ReponseRdv,
  type VieDuGroupe,
} from "./groupes";

type Supabase = ReturnType<typeof createAdminClient>;
type Resultat<T = object> = T & { error?: string; statut?: number };
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const LIEN = "/collection#groupes";
const ID = /^\d{13}-[A-Za-z0-9_-]{4,16}-[0-9a-f]{6}$/;
const idValide = (x: unknown) => (ID.test(s(x)) ? s(x) : null);
const effacer = (supabase: Supabase, chemins: string[]) => (chemins.length ? supabase.storage.from(SEAU_FIGURINES).remove(chemins).then(() => undefined, () => undefined) : Promise.resolve());

export type FicheRdv = { id: string; nom: string; e: string; recurrence: Recurrence; jour?: number; heure: number; minute: number; quand?: number; idee?: true; q: string; prenom: string; le: number };
export type FicheReponse = { q: string; r: ReponseRdv; fois: number; le: number };
type FicheMessage = { id: string; q: string; prenom: string; src: string; texte: string; le: number; idee?: string };

/** Moi, membre de ce groupe (ma fiche de membre) — sinon une erreur. */
async function membre(supabase: Supabase, moi: Habitant, groupe: unknown): Promise<Resultat<{ gid?: string; fiche?: FicheMembre }>> {
  const gid = idGroupeValide(groupe);
  const q = qui8(moi.id);
  const fiche = gid ? await lireJson<Partial<FicheMembre>>(supabase, cheminMembre(gid, q)).catch(() => ({}) as Partial<FicheMembre>) : {};
  if (!gid || fiche.q !== q || !fiche.h) return { error: "Ce groupe n’existe pas.", statut: 404 };
  return { gid, fiche: fiche as FicheMembre };
}

export async function lireRdvs(supabase: Supabase, gid: string): Promise<FicheRdv[]> {
  const noms = await listerGroupes(supabase, dossierRdv(gid), 40);
  const l = await Promise.all(noms.map((n) => lireJson<Partial<FicheRdv>>(supabase, `${dossierRdv(gid)}/${n}`).catch(() => ({}) as Partial<FicheRdv>)));
  return l.filter((x): x is FicheRdv => Boolean(x.id && x.nom && x.recurrence));
}
export async function reponsesDe(supabase: Supabase, gid: string, rid: string): Promise<FicheReponse[]> {
  const noms = await listerGroupes(supabase, dossierReponses(gid, rid), 20);
  const l = await Promise.all(noms.map((n) => lireJson<Partial<FicheReponse>>(supabase, `${dossierReponses(gid, rid)}/${n}`).catch(() => ({}) as Partial<FicheReponse>)));
  return l.filter((x): x is FicheReponse => Boolean(x.q && x.r && x.fois));
}

/** Un rendez-vous pour l'écran, à sa prochaine fois (`null` : passé). */
async function vueDuRdv(supabase: Supabase, gid: string, f: FicheRdv, membres: FicheMembre[], q: string, maintenant: number): Promise<RdvGroupe | null> {
  const quand = prochaineFois(f, maintenant);
  if (quand == null) return null;
  const reps = (await reponsesDe(supabase, gid, f.id)).filter((r) => r.fois === quand);
  const viens = new Set(reps.filter((r) => r.r === "viens").map((r) => r.q));
  const mienne = reps.find((r) => r.q === q);
  return {
    id: f.id,
    nom: f.nom,
    e: f.e,
    recurrence: f.recurrence,
    ...(f.recurrence === "semaine" ? { jour: f.jour ?? 0 } : {}),
    heure: f.heure,
    minute: f.minute,
    quand,
    viennent: membres.filter((m) => viens.has(m.q)).map(({ q: x, prenom, src }) => ({ q: x, prenom, src })),
    ...(mienne ? { moi: mienne.r } : {}),
    ...(f.q === q ? { mien: true as const } : {}),
    ...(f.idee ? { idee: true as const } : {}),
    de: f.prenom,
  };
}

/** 📅💬 Ce qu'on lit en ouvrant l'espace d'un groupe : ses rendez-vous (les idées aussi), sa discussion. */
export async function vieDuGroupe(supabase: Supabase, moi: Habitant, groupe: unknown, maintenant = Date.now()): Promise<Resultat<{ vie?: VieDuGroupe }>> {
  const m = await membre(supabase, moi, groupe);
  if (!m.gid) return { error: m.error, statut: m.statut };
  const gid = m.gid;
  const q = qui8(moi.id);
  const [fiches, membres, noms, caches] = await Promise.all([
    lireRdvs(supabase, gid),
    membresDe(supabase, gid),
    listerGroupes(supabase, dossierDiscussion(gid), 40),
    // (🚩 lot G8 : ceux que je ne veux plus voir — les mêmes que dans les salons, `{h}/salons-caches.json`)
    lireJson<{ qs?: string[] }>(supabase, `${moi.id}/salons-caches.json`).then((c) => new Set(Array.isArray(c.qs) ? c.qs.map(String) : []), () => new Set<string>()),
  ]);
  const [rdv, lus] = await Promise.all([
    Promise.all(fiches.map((f) => vueDuRdv(supabase, gid, f, membres, q, maintenant))),
    Promise.all(noms.map((n) => lireJson<Partial<FicheMessage>>(supabase, `${dossierDiscussion(gid)}/${n}`).catch(() => ({}) as Partial<FicheMessage>))),
  ]);
  // (une séance exceptionnelle passée depuis plus de deux heures : son fichier s'en va)
  const passes = fiches.filter((f, k) => !rdv[k] && f.recurrence === "une").map((f) => `${dossierRdv(gid)}/${f.id}.json`);
  if (passes.length) void effacer(supabase, passes);
  const messages: MessageGroupe[] = lus
    .filter((x): x is FicheMessage => Boolean(x.id && x.q && x.texte) && !caches.has(String(x.q)))
    .sort((a, b) => a.le - b.le)
    .map((x) => ({ id: x.id, q: x.q, prenom: x.prenom, src: x.src, texte: x.texte, le: x.le, ...(x.q === q ? { mien: true as const } : {}), ...(x.idee ? { idee: x.idee } : {}) }));
  return { vie: { rdv: rdv.filter((x): x is RdvGroupe => Boolean(x)).sort((a, b) => a.quand - b.quand), messages } };
}

/** 📅 Son prochain rendez-vous (pour sa table, dans Tous mes groupes) : pas une idée qui attend ses partants. */
export async function prochainDuGroupe(supabase: Supabase, gid: string, maintenant = Date.now()): Promise<{ nom: string; quand: number } | null> {
  const fiches = await lireRdvs(supabase, gid);
  const l: { nom: string; quand: number }[] = [];
  for (const f of fiches) {
    const quand = prochaineFois(f, maintenant);
    if (quand == null) continue;
    if (f.idee && (await reponsesDe(supabase, gid, f.id)).filter((r) => r.fois === quand && r.r === "viens").length < PARTANTS_MIN) continue;
    l.push({ nom: f.nom, quand });
  }
  return l.sort((a, b) => a.quand - b.quand)[0] ?? null;
}

/** 📅 Un rendez-vous (ou 💡 une idée de séance, `idee`) : celui qui le propose vient, bien sûr. */
export async function ajouterRdv(supabase: Supabase, moi: Habitant, p: Record<string, unknown>, maintenant = Date.now()): Promise<Resultat<{ rdv?: RdvGroupe; message?: MessageGroupe }>> {
  const m = await membre(supabase, moi, p.groupe);
  if (!m.gid || !m.fiche) return { error: m.error, statut: m.statut };
  const gid = m.gid;
  const idee = p.idee === true;
  const recurrence: Recurrence = idee ? "une" : p.recurrence === "jour" || p.recurrence === "semaine" ? p.recurrence : "une";
  const nom = s(p.nom).replace(/\s+/g, " ") || (recurrence === "jour" ? "Le rendez-vous du soir" : recurrence === "semaine" ? "Le rendez-vous de la semaine" : "Une séance spéciale");
  // (« rendez-vous », refusé dans les salons ouverts — on ne s'y donne pas rendez-vous —, est ici le mot du groupe : une
  // séance dans son salon. Le reste de la modération tient.)
  const refus = refusDuGroupe(nom.replace(/rendez[- ]vous/gi, "séance"), NOM_GROUPE_MAX);
  if (refus) return { error: `Son nom ne passe pas : ${refus}.`, statut: 400 };
  let heure = Math.floor(Number(p.heure));
  let minute = Math.floor(Number(p.minute) || 0);
  let quand: number | undefined;
  if (recurrence === "une") {
    quand = Math.round(Number(p.quand) / 60_000) * 60_000;
    if (!Number.isFinite(quand) || quand < maintenant || quand > maintenant + HORIZON_MS) return { error: "Choisis un moment dans les deux prochaines semaines.", statut: 400 };
    const hm = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", hourCycle: "h23", hour: "2-digit", minute: "2-digit" }).format(quand).split(":").map(Number);
    heure = hm[0];
    minute = hm[1];
  } else if (!(heure >= 0 && heure <= 23) || !(minute >= 0 && minute <= 59)) return { error: "À quelle heure ?", statut: 400 };
  const jour = recurrence === "semaine" ? Math.floor(Number(p.jour)) : undefined;
  if (recurrence === "semaine" && !(jour! >= 0 && jour! <= 6)) return { error: "Quel jour ?", statut: 400 };
  const deja = (await lireRdvs(supabase, gid)).filter((f) => prochaineFois(f, maintenant) != null);
  if (deja.length >= RDV_MAX) return { error: PV.tropDeRdv, statut: 409 };
  const g = await lireJson<{ theme?: string }>(supabase, cheminGroupe(gid)).catch(() => ({}) as { theme?: string });
  const e = recurrence === "une" ? "⭐" : recurrence === "jour" ? (heure >= 18 ? "🌙" : "☀️") : (themeDuGroupe(g.theme)?.e ?? "📅");
  const q = qui8(moi.id);
  const id = `${maintenant}-${q}-${randomBytes(3).toString("hex")}`;
  const f: FicheRdv = { id, nom, e, recurrence, ...(jour != null ? { jour } : {}), heure, minute, ...(quand ? { quand } : {}), ...(idee ? { idee: true as const } : {}), q, prenom: m.fiche.prenom, le: maintenant };
  if (!(await ecrireJson(supabase, `${dossierRdv(gid)}/${id}.json`, f))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  const fois = prochaineFois(f, maintenant);
  if (fois) await ecrireJson(supabase, `${dossierReponses(gid, id)}/${q}.json`, { q, r: "viens", fois, le: maintenant } satisfies FicheReponse);
  // (💡 une idée de séance : elle arrive aussi dans la discussion, où chacun dit « Partant ! »)
  let message: MessageGroupe | undefined;
  if (idee) {
    const r = await ecrire(supabase, moi, gid, m.fiche, nom, maintenant, id);
    message = r.message;
  }
  const rdv = await vueDuRdv(supabase, gid, f, await membresDe(supabase, gid), q, maintenant);
  return { ...(rdv ? { rdv } : {}), ...(message ? { message } : {}) };
}

/** ✓ Je viens, Absent, Plus tard — pour sa prochaine fois (« Partant ! » : Je viens, pour une idée). */
export async function repondreRdv(supabase: Supabase, moi: Habitant, p: Record<string, unknown>, maintenant = Date.now()): Promise<Resultat<{ rdv?: RdvGroupe; entre?: true }>> {
  const m = await membre(supabase, moi, p.groupe);
  if (!m.gid) return { error: m.error, statut: m.statut };
  const gid = m.gid;
  const rid = idValide(p.rdv);
  const r = REPONSES_RDV.find((x) => x === p.reponse);
  if (!rid || !r) return { error: "Quelle réponse ?", statut: 400 };
  const f = await lireJson<Partial<FicheRdv>>(supabase, `${dossierRdv(gid)}/${rid}.json`).catch(() => ({}) as Partial<FicheRdv>);
  if (f.id !== rid || !f.recurrence) return { error: "Ce rendez-vous n’existe plus.", statut: 404 };
  const fiche = f as FicheRdv;
  const fois = prochaineFois(fiche, maintenant);
  if (fois == null) return { error: "Ce rendez-vous est passé.", statut: 410 };
  const membres = await membresDe(supabase, gid);
  const q = qui8(moi.id);
  const avant = fiche.idee ? await vueDuRdv(supabase, gid, fiche, membres, q, maintenant) : null;
  if (!(await ecrireJson(supabase, `${dossierReponses(gid, rid)}/${q}.json`, { q, r, fois, le: maintenant } satisfies FicheReponse))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  const rdv = await vueDuRdv(supabase, gid, fiche, membres, q, maintenant);
  const entre = Boolean(fiche.idee && avant && avant.viennent.length < PARTANTS_MIN && rdv && rdv.viennent.length >= PARTANTS_MIN);
  return { ...(rdv ? { rdv } : {}), ...(entre ? { entre: true as const } : {}) };
}

/** Retirer un rendez-vous (celui qui l'a proposé). */
export async function retirerRdv(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat> {
  const m = await membre(supabase, moi, p.groupe);
  if (!m.gid) return { error: m.error, statut: m.statut };
  const rid = idValide(p.rdv);
  const f = rid ? await lireJson<Partial<FicheRdv>>(supabase, `${dossierRdv(m.gid)}/${rid}.json`).catch(() => ({}) as Partial<FicheRdv>) : {};
  if (!rid || f.id !== rid) return { error: "Ce rendez-vous n’existe plus.", statut: 404 };
  if (f.q !== qui8(moi.id)) return { error: "C’est à celui qui l’a proposé de le retirer.", statut: 403 };
  await effacer(supabase, [`${dossierRdv(m.gid)}/${rid}.json`]);
  return {};
}

async function ecrire(supabase: Supabase, moi: Habitant, gid: string, fiche: FicheMembre, texteBrut: string, maintenant: number, idee?: string): Promise<Resultat<{ message?: MessageGroupe }>> {
  const texte = texteBrut.replace(/\s+/g, " ").trim();
  const refus = refusDuGroupe(texte, MESSAGE_GROUPE_MAX);
  if (refus) return { error: `Ce message ne part pas : ${refus}.`, statut: 400 };
  const q = qui8(moi.id);
  const id = `${maintenant}-${q}-${randomBytes(3).toString("hex")}`;
  const f: FicheMessage = { id, q, prenom: fiche.prenom, src: fiche.src, texte, le: maintenant, ...(idee ? { idee } : {}) };
  if (!(await ecrireJson(supabase, `${dossierDiscussion(gid)}/${id}.json`, f))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  await prevenirLeGroupe(supabase, gid, f, maintenant).catch(() => undefined);
  return { message: { id, q, prenom: f.prenom, src: f.src, texte, le: maintenant, mien: true, ...(idee ? { idee } : {}) } };
}

/** 💬 Écrire au groupe (90 signes, la modération des salons). */
export async function ecrireAuGroupe(supabase: Supabase, moi: Habitant, p: Record<string, unknown>, maintenant = Date.now()): Promise<Resultat<{ message?: MessageGroupe }>> {
  const m = await membre(supabase, moi, p.groupe);
  if (!m.gid || !m.fiche) return { error: m.error, statut: m.statut };
  return ecrire(supabase, moi, m.gid, m.fiche, s(p.texte), maintenant);
}

/**
 * 🔔 (la tâche des cinq minutes, lot G3) Les rendez-vous des groupes qui commencent : un rappel à ceux qui viennent, une
 * fois par fois (`groupes/rappels-rdv/<groupe>/<rdv>.json` garde la dernière).
 */
export async function rappelerLesRendezVous(supabase: Supabase, o: { maintenant?: number; fin?: number } = {}): Promise<{ rappels: number; personnes: number }> {
  const maintenant = o.maintenant ?? Date.now();
  const fin = o.fin ?? Date.now() + 50_000;
  // (les dossiers de `groupes/rdv` sont les groupes qui ont des rendez-vous)
  const { data } = await supabase.storage.from(SEAU_FIGURINES).list("groupes/rdv", { limit: 1000 });
  const gids = ((Array.isArray(data) ? data : []) as { name?: string }[]).map((x) => idGroupeValide(x.name)).filter((x): x is string => Boolean(x));
  let rappels = 0;
  let personnes = 0;
  for (const gid of gids) {
    if (Date.now() > fin) break;
    const fiches = await lireRdvs(supabase, gid);
    for (const f of fiches) {
      const fois = prochaineFois(f, maintenant);
      if (fois == null || maintenant < fois - RAPPEL_AVANT_MS || maintenant > fois + RAPPEL_APRES_MS) continue;
      const deja = await lireJson<{ fois?: number }>(supabase, cheminRappelRdv(gid, f.id)).catch(() => ({}) as { fois?: number });
      if (deja.fois === fois) continue;
      const viens = new Set((await reponsesDe(supabase, gid, f.id)).filter((r) => r.fois === fois && r.r === "viens").map((r) => r.q));
      if (f.idee && viens.size < PARTANTS_MIN) continue;
      if (!(await ecrireJson(supabase, cheminRappelRdv(gid, f.id), { fois, le: maintenant }))) continue;
      const qui = (await membresDe(supabase, gid)).filter((x) => viens.has(x.q));
      if (!qui.length) continue;
      const minutes = Math.max(0, Math.round((fois - maintenant) / 60_000));
      const notif = { titre: P.rappelTitre(f.nom, minutes), corps: PV.rappelCorps, url: LIEN, tag: `groupe-rdv-${f.id}` };
      const issues = await Promise.all(qui.map((x) => prevenirUnHabitantAppli(supabase, x.h, notif).catch(() => "rien" as const)));
      rappels++;
      personnes += issues.filter((x) => x === "envoye").length;
    }
  }
  return { rappels, personnes };
}

// ─── 🔔 les nouveaux messages du groupe (fait « avec soin », après G8) ───
/** (🤫 la règle de bruit, commune aux discussions des vidéos depuis le lot A5 : `regle-de-bruit.ts`) */
export { NOTIF_DISCUSSION_MS, heureCalme };
const cheminNotifDiscussion = (gid: string) => `groupes/notifs-discussion/${gid}.json`;

/**
 * 🔔 Un message (ou 💡 une idée) dans la discussion : les autres membres sont prévenus — pas celui qui écrit, pas ceux
 * qui sont dans le salon du groupe, pas la nuit, et une fois toutes les deux heures au plus pour tout le groupe (la
 * notification suivante remplace la précédente sur le téléphone : `groupe-msg-<id>`).
 */
async function prevenirLeGroupe(supabase: Supabase, gid: string, f: FicheMessage, maintenant: number): Promise<number> {
  if (heureCalme(maintenant)) return 0;
  const avant = await lireJson<{ le?: number }>(supabase, cheminNotifDiscussion(gid)).catch(() => ({}) as { le?: number });
  if (maintenant - (Number(avant.le) || 0) < NOTIF_DISCUSSION_MS) return 0;
  if (!(await ecrireJson(supabase, cheminNotifDiscussion(gid), { le: maintenant, de: f.q }))) return 0;
  // (import à la demande : les salons dépendent déjà des groupes)
  const { presentsDuGroupe } = await import("./salons-ouverts-serveur");
  const [membres, ici, g] = await Promise.all([
    membresDe(supabase, gid),
    presentsDuGroupe(supabase, gid, maintenant).catch(() => [] as string[]),
    lireJson<{ nom?: string }>(supabase, cheminGroupe(gid)).catch(() => ({}) as { nom?: string }),
  ]);
  const qui = membres.filter((m) => m.q !== f.q && !ici.includes(m.q));
  const notif = f.idee
    ? { titre: `💡 ${f.prenom} propose une séance`, corps: `« ${f.texte} » · ${s(g.nom)}`, url: "/collection#groupes", tag: `groupe-msg-${gid}` }
    : { titre: `💬 ${s(g.nom) || "Ton groupe"}`, corps: `${f.prenom} : ${f.texte}`, url: "/collection#groupes", tag: `groupe-msg-${gid}` };
  // (🔔 lot A5 : l'interrupteur « Mes proches et mes groupes »)
  const issues = await Promise.all(qui.map((m) => prevenirUnHabitantAppli(supabase, m.h, notif, "proches").catch(() => "rien" as const)));
  return issues.filter((x) => x === "envoye").length;
}
