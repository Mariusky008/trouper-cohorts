/**
 * 🌱 LE GROUPE QUI GRANDIT (Mes groupes, le lot G8, 26 novembre 2026 ; `docs/univers/mes-groupes.md`, la maquette G0
 * validée, planche « Groupe »).
 *
 * - **＋ thème** : un membre ajoute un thème (trois de plus au plus) ; le groupe le voit tout de suite, et Aujourd'hui
 *   prend un thème par jour, à tour de rôle (`themeDuJour`).
 * - **Accueillir quelqu'un** : un membre propose un de ses proches ; « le groupe décide ensemble » : dès qu'un autre
 *   membre est partant, le proche est invité (il voit le groupe dans Mes groupes, et le garde s'il veut). Pas de vote
 *   chiffré.
 * - **Quitter** : quand on veut, sans rien expliquer.
 * - **Signaler** : une personne (et son message, si on veut) ; on ne voit plus ses messages, et l'équipe le voit (les
 *   signalements des salons, `signalerHorsSalon`).
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { SEAU_FIGURINES, ecrireJson, lireJson, lireLigne, prochesDe } from "./ma-figurine-serveur";
import { hDeCle, qui8, seParlent } from "./talkie-serveur";
import { figurineDeLaMaison } from "./ma-maison-serveur";
import { maisonDeMoi, nePlusVoir, signalerHorsSalon } from "./salons-ouverts-serveur";
import { prevenirUnHabitantAppli } from "./appli-collection-serveur";
import { MOTIFS_SIGNALEMENT } from "./salons-ouverts";
import {
  cheminGroupe,
  cheminMembre,
  cheminMiens,
  dossierAccueils,
  dossierDiscussion,
  dossierInvitationsGroupe,
  dossierInvites,
  dossierPartantsAccueil,
  dossierThemes,
  idGroupeValide,
  idSalonDuGroupe,
  listerGroupes,
  membresDe,
  themesEnPlus,
  type FicheMembre,
  type FicheTheme,
} from "./groupes-chemins-serveur";
import { MEMBRES_MAX, PHRASES_GRANDIR as PGR, THEMES_EN_PLUS_MAX, themeDuGroupe, type AccueilGroupe, type PlaceGroupe } from "./groupes";

type Supabase = ReturnType<typeof createAdminClient>;
type Resultat<T = object> = T & { error?: string; statut?: number };
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const LIEN = "/collection#groupes";
const effacer = (supabase: Supabase, chemins: string[]) => (chemins.length ? supabase.storage.from(SEAU_FIGURINES).remove(chemins).then(() => undefined, () => undefined) : Promise.resolve());

type FicheGroupe = { nom?: string; theme?: string; maison?: string };
type FicheAccueil = { q: string; h: string; prenom: string; src: string; de: string; deQ: string; le: number };
type FichePartant = { q: string; prenom: string; src: string; le: number };

async function membre(supabase: Supabase, moi: Habitant, groupe: unknown): Promise<Resultat<{ gid?: string; fiche?: FicheMembre; g?: FicheGroupe }>> {
  const gid = idGroupeValide(groupe);
  const q = qui8(moi.id);
  const fiche = gid ? await lireJson<Partial<FicheMembre>>(supabase, cheminMembre(gid, q)).catch(() => ({}) as Partial<FicheMembre>) : {};
  if (!gid || fiche.q !== q || !fiche.h) return { error: "Ce groupe n’existe pas.", statut: 404 };
  const g = await lireJson<FicheGroupe>(supabase, cheminGroupe(gid)).catch(() => ({}) as FicheGroupe);
  return { gid, fiche: fiche as FicheMembre, g };
}

// ─── 🌱 ＋ thème ───
export async function ajouterTheme(supabase: Supabase, moi: Habitant, p: Record<string, unknown>, maintenant = Date.now()): Promise<Resultat<{ themes?: string[] }>> {
  const m = await membre(supabase, moi, p.groupe);
  if (!m.gid || !m.fiche) return { error: m.error, statut: m.statut };
  const t = themeDuGroupe(p.theme);
  if (!t) return { error: "Choisis un thème.", statut: 400 };
  if (t.adultes && m.g?.maison !== "adultes") return { error: "Ce thème est réservé aux adultes.", statut: 403 };
  const avant = await themesEnPlus(supabase, m.gid);
  if (t.id === m.g?.theme || avant.some((x) => x.theme === t.id)) return { themes: avant.map((x) => x.theme) };
  if (avant.length >= THEMES_EN_PLUS_MAX) return { error: PGR.tropDeThemes, statut: 409 };
  const f: FicheTheme = { theme: t.id, q: m.fiche.q, prenom: m.fiche.prenom, le: maintenant };
  if (!(await ecrireJson(supabase, `${dossierThemes(m.gid)}/${t.id}.json`, f))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  return { themes: [...avant.map((x) => x.theme), t.id] };
}

// ─── 👥 accueillir quelqu'un ───
/** Ceux que des membres proposent d'accueillir (pas encore membres), et qui est partant. */
export async function accueilsDuGroupe(supabase: Supabase, gid: string, q: string, membres?: FicheMembre[]): Promise<AccueilGroupe[]> {
  const [noms, ms] = await Promise.all([listerGroupes(supabase, dossierAccueils(gid), 20), membres ? Promise.resolve(membres) : membresDe(supabase, gid)]);
  const dedans = new Set(ms.map((x) => x.q));
  const fiches = (await Promise.all(noms.map((n) => lireJson<Partial<FicheAccueil>>(supabase, `${dossierAccueils(gid)}/${n}`).catch(() => ({}) as Partial<FicheAccueil>)))).filter(
    (x): x is FicheAccueil => Boolean(x.q && x.h && !dedans.has(x.q)),
  );
  return Promise.all(
    fiches
      .sort((a, b) => a.le - b.le)
      .map(async (f): Promise<AccueilGroupe> => {
        const [partants, invite] = await Promise.all([partantsDe(supabase, gid, f.q, dedans), lireJson<{ q?: string }>(supabase, `${dossierInvites(gid)}/${f.q}.json`).catch(() => ({}) as { q?: string })]);
        return {
          q: f.q,
          prenom: f.prenom,
          src: f.src,
          de: f.de,
          partants,
          ...(partants.some((x) => x.q === q) ? { moi: true as const } : {}),
          ...(invite.q === f.q ? { invite: true as const } : {}),
        };
      }),
  );
}
async function partantsDe(supabase: Supabase, gid: string, qa: string, dedans: Set<string>): Promise<PlaceGroupe[]> {
  const noms = await listerGroupes(supabase, dossierPartantsAccueil(gid, qa), 20);
  const l = await Promise.all(noms.map((n) => lireJson<Partial<FichePartant>>(supabase, `${dossierPartantsAccueil(gid, qa)}/${n}`).catch(() => ({}) as Partial<FichePartant>)));
  return l
    .filter((x): x is FichePartant => Boolean(x.q && dedans.has(x.q)))
    .sort((a, b) => a.le - b.le)
    .map(({ q, prenom, src }) => ({ q, prenom, src }));
}

/** 👥 Je propose un de mes proches au groupe (je suis partant, bien sûr). */
export async function proposerAccueil(supabase: Supabase, moi: Habitant, p: Record<string, unknown>, maintenant = Date.now()): Promise<Resultat<{ accueils?: AccueilGroupe[] }>> {
  const m = await membre(supabase, moi, p.groupe);
  if (!m.gid || !m.fiche) return { error: m.error, statut: m.statut };
  const gid = m.gid;
  const h = await hDeCle(supabase, s(p.cle)).catch(() => null);
  const proches = await prochesDe(supabase, moi.id).catch(() => new Set<string>());
  if (!h || h === moi.id || !proches.has(h) || !(await seParlent(supabase, moi.id, h).catch(() => false))) return { error: "Choisis un de tes proches.", statut: 400 };
  const membres = await membresDe(supabase, gid);
  const qa = qui8(h);
  if (membres.some((x) => x.q === qa)) return { error: "Il est déjà dans le groupe.", statut: 409 };
  if (membres.length >= MEMBRES_MAX) return { error: `Un groupe, c’est ${MEMBRES_MAX} au plus.`, statut: 409 };
  const maison = await maisonDeMoi(supabase, h).catch(() => null);
  if (!maison || maison !== m.g?.maison) return { error: "Ce groupe n’est pas de son âge.", statut: 403 };
  const [ligne, figurine] = await Promise.all([lireLigne(supabase, h).catch(() => ({ ligne: null })), figurineDeLaMaison(supabase, h).catch(() => null)]);
  const prenom = s(ligne.ligne?.prenom) || "Ton proche";
  const deja = await lireJson<Partial<FicheAccueil>>(supabase, `${dossierAccueils(gid)}/${qa}.json`).catch(() => ({}) as Partial<FicheAccueil>);
  if (deja.q !== qa) {
    const f: FicheAccueil = { q: qa, h, prenom, src: figurine?.src ?? "", de: m.fiche.prenom, deQ: m.fiche.q, le: maintenant };
    if (!(await ecrireJson(supabase, `${dossierAccueils(gid)}/${qa}.json`, f))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  }
  const r = await etrePartant(supabase, moi, m.fiche, gid, qa, maintenant);
  if (r.error) return r;
  return { accueils: await accueilsDuGroupe(supabase, gid, m.fiche.q) };
}

/** « Partant ! » pour accueillir quelqu'un : au deuxième, il est invité. */
export async function partantAccueil(supabase: Supabase, moi: Habitant, p: Record<string, unknown>, maintenant = Date.now()): Promise<Resultat<{ accueils?: AccueilGroupe[]; invite?: true }>> {
  const m = await membre(supabase, moi, p.groupe);
  if (!m.gid || !m.fiche) return { error: m.error, statut: m.statut };
  const qa = s(p.q);
  if (!/^[A-Za-z0-9_-]{4,16}$/.test(qa)) return { error: "Qui ?", statut: 400 };
  const r = await etrePartant(supabase, moi, m.fiche, m.gid, qa, maintenant);
  if (r.error) return r;
  return { accueils: await accueilsDuGroupe(supabase, m.gid, m.fiche.q), ...(r.invite ? { invite: true as const } : {}) };
}

async function etrePartant(supabase: Supabase, moi: Habitant, fiche: FicheMembre, gid: string, qa: string, maintenant: number): Promise<Resultat<{ invite?: true }>> {
  const f = await lireJson<Partial<FicheAccueil>>(supabase, `${dossierAccueils(gid)}/${qa}.json`).catch(() => ({}) as Partial<FicheAccueil>);
  if (f.q !== qa || !f.h) return { error: "Plus personne n’est proposé.", statut: 404 };
  const membres = await membresDe(supabase, gid);
  if (membres.some((x) => x.q === qa)) return { error: "Il est déjà dans le groupe.", statut: 409 };
  const dedans = new Set(membres.map((x) => x.q));
  const avant = await partantsDe(supabase, gid, qa, dedans);
  if (!avant.some((x) => x.q === fiche.q)) {
    if (!(await ecrireJson(supabase, `${dossierPartantsAccueil(gid, qa)}/${fiche.q}.json`, { q: fiche.q, prenom: fiche.prenom, src: fiche.src, le: maintenant } satisfies FichePartant))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  }
  const n = avant.some((x) => x.q === fiche.q) ? avant.length : avant.length + 1;
  const deja = await lireJson<{ q?: string }>(supabase, `${dossierInvites(gid)}/${qa}.json`).catch(() => ({}) as { q?: string });
  if (n < 2 || deja.q === qa) return {};
  if (membres.length >= MEMBRES_MAX) return { error: `Un groupe, c’est ${MEMBRES_MAX} au plus.`, statut: 409 };
  // (deux partants : il est invité, comme par un proche qui crée le groupe — il le garde s'il veut)
  const g = await lireJson<FicheGroupe>(supabase, cheminGroupe(gid)).catch(() => ({}) as FicheGroupe);
  const inv = { id: gid, h: f.h, q: qa, de: s(f.de) || fiche.prenom, le: maintenant };
  await ecrireJson(supabase, `${dossierInvites(gid)}/${qa}.json`, inv);
  await ecrireJson(supabase, `${dossierInvitationsGroupe(qa)}/${gid}.json`, inv);
  await prevenirUnHabitantAppli(supabase, f.h, { titre: `👥 Le groupe « ${s(g.nom)} » t’accueille`, corps: "Garde-le si tu veux : il sera dans Mes groupes.", url: LIEN, tag: `groupe-invite-${gid}` }).catch(() => "rien");
  return { invite: true };
}

// ─── 🚪 quitter ───
export async function quitterGroupe(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat> {
  const m = await membre(supabase, moi, p.groupe);
  if (!m.gid || !m.fiche) return { error: m.error, statut: m.statut };
  const q = m.fiche.q;
  const miens = await lireJson<{ groupes?: string[] }>(supabase, cheminMiens(q)).catch(() => ({}) as { groupes?: string[] });
  await ecrireJson(supabase, cheminMiens(q), { groupes: (Array.isArray(miens.groupes) ? miens.groupes : []).filter((x) => x !== m.gid) });
  await effacer(supabase, [cheminMembre(m.gid, q), `decouvrir/salons/prives/${idSalonDuGroupe(m.gid)}/presents/${q}.json` /* (sa place au salon du groupe) */]);
  return {};
}

// ─── 🚩 signaler ───
/** Signaler un membre (et son message, si on veut) : je ne vois plus ses messages ; l'équipe le voit. */
export async function signalerDansLeGroupe(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat<{ caches?: string[] }>> {
  const m = await membre(supabase, moi, p.groupe);
  if (!m.gid || !m.fiche) return { error: m.error, statut: m.statut };
  const cible = s(p.q);
  if (cible === m.fiche.q) return { error: "Qui ?", statut: 400 };
  const f = (await membresDe(supabase, m.gid)).find((x) => x.q === cible);
  if (!f) return { error: "Cette personne n’est plus dans le groupe.", statut: 404 };
  const idm = s(p.message);
  const msg = /^\d{13}-[A-Za-z0-9_-]{4,16}-[0-9a-f]{6}$/.test(idm) ? await lireJson<{ q?: string; texte?: string }>(supabase, `${dossierDiscussion(m.gid)}/${idm}.json`).catch(() => ({}) as { q?: string; texte?: string }) : {};
  const motif = MOTIFS_SIGNALEMENT.find((x) => x === p.motif) ?? MOTIFS_SIGNALEMENT[3];
  await signalerHorsSalon(supabase, moi, { cible: { q: f.q, h: f.h, prenom: f.prenom }, salon: idSalonDuGroupe(m.gid), motif, ...(msg.q === cible && msg.texte ? { texte: msg.texte } : {}) });
  const r = await nePlusVoir(supabase, moi, cible);
  if (r.error) return { error: r.error, statut: r.statut };
  return { caches: r.caches };
}
