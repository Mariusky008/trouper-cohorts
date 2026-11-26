/**
 * 🎬 AUJOURD'HUI DANS UN GROUPE (Mes groupes, le lot G6, 26 novembre 2026 ; `docs/univers/mes-groupes.md`, la maquette G0
 * validée, planche « Groupe »).
 *
 * - **La sélection du jour** : la vidéo que chaque membre propose aujourd'hui, avec son mot (« pourquoi elle »), puis les
 *   nouveautés de la passion du groupe (sa sélection du jour, celle des salons). Chacun lève la main (🙋) pour celles
 *   qu'il veut ce soir : on voit les têtes, jamais un nombre. À deux mains (`ENVIES_RETENUE`), « ✓ Ce soir » : elle
 *   ouvrira la télé du salon du groupe (`videosRetenues`, lue par `entrerAuGroupe`).
 * - **Les rôles qui tournent** (`rolesDuJour`) : 🎬 la vidéo, 💬 le sujet, 🔎 la découverte, 📅 la prochaine ; chaque
 *   jour, chacun prend le rôle suivant. Pas de points, pas de classement.
 *
 * Un fichier par personne : `groupes/jour/<id>/<jour>/<q>.json` (ma vidéo), `groupes/envies/<id>/<jour>/<q>.json`
 * (mes 🙋). FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { SEAU_FIGURINES, ecrireJson, lireJson } from "./ma-figurine-serveur";
import { qui8 } from "./talkie-serveur";
import { jourParis } from "@/lib/jour-paris";
import { maisonDeMoi, videosDuSalon } from "./salons-ouverts-serveur";
import { videoChoisie } from "./groupes-serveur";
import type { VideoSalon } from "./salons-ouverts";
import {
  cheminGroupe,
  cheminMembre,
  dossierEnvies,
  dossierJourGroupe,
  enviesDuJour,
  listerGroupes,
  membresDe,
  idGroupeValide,
  themesDuGroupe,
  type FicheEnvies,
  type FicheMembre,
} from "./groupes-chemins-serveur";
import { ENVIES_RETENUE, MOT_GROUPE_MAX, NOUVEAUTES_DU_JOUR, refusDuGroupe, rolesDuJour, themeDuGroupe, themeDuJour, type AujourdhuiDuGroupe, type PlaceGroupe, type VideoDuGroupe } from "./groupes";

type Supabase = ReturnType<typeof createAdminClient>;
type Resultat<T = object> = T & { error?: string; statut?: number };
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

/** Ma vidéo du jour pour le groupe. */
type FicheVideoDuJour = { q: string; prenom: string; src: string; video: VideoSalon; mot?: string; le: number };

async function membre(supabase: Supabase, moi: Habitant, groupe: unknown): Promise<Resultat<{ gid?: string; fiche?: FicheMembre }>> {
  const gid = idGroupeValide(groupe);
  const q = qui8(moi.id);
  const fiche = gid ? await lireJson<Partial<FicheMembre>>(supabase, cheminMembre(gid, q)).catch(() => ({}) as Partial<FicheMembre>) : {};
  if (!gid || fiche.q !== q || !fiche.h) return { error: "Ce groupe n’existe pas.", statut: 404 };
  return { gid, fiche: fiche as FicheMembre };
}

const place = ({ q, prenom, src }: PlaceGroupe): PlaceGroupe => ({ q, prenom, src });

/** 🎬 L'onglet Aujourd'hui : la sélection du jour (et les 🙋 de chacun), les rôles. */
async function construire(supabase: Supabase, moi: Habitant, gid: string, jour: string): Promise<AujourdhuiDuGroupe> {
  const q = qui8(moi.id);
  const g = await lireJson<{ theme?: string }>(supabase, cheminGroupe(gid)).catch(() => ({}) as { theme?: string });
  const [themes, membres, noms, envies, maison] = await Promise.all([
    themesDuGroupe(supabase, gid, g.theme),
    membresDe(supabase, gid),
    listerGroupes(supabase, dossierJourGroupe(gid, jour), 40),
    enviesDuJour(supabase, gid, jour),
    maisonDeMoi(supabase, moi.id).catch(() => null),
  ]);
  // (🌱 lot G8 : sa passion et les thèmes ajoutés, un par jour)
  const t = themeDuGroupe(themeDuJour(themes, jour) ?? g.theme);
  const dedans = new Map(membres.map((m) => [m.q, m]));
  const fiches = (await Promise.all(noms.map((n) => lireJson<Partial<FicheVideoDuJour>>(supabase, `${dossierJourGroupe(gid, jour)}/${n}`).catch(() => ({}) as Partial<FicheVideoDuJour>))))
    .filter((x): x is FicheVideoDuJour => Boolean(x.q && x.video?.id && dedans.has(x.q)))
    .sort((a, b) => a.le - b.le);
  const vues = new Set<string>();
  const proposees = fiches.filter((f) => (vues.has(f.video.id) ? false : (vues.add(f.video.id), true)));
  const nouveautes = t ? (await videosDuSalon(supabase, t.id, maison ?? "jeunes").catch(() => [] as VideoSalon[])).filter((v) => !vues.has(v.id)).slice(0, proposees.length ? NOUVEAUTES_DU_JOUR : NOUVEAUTES_DU_JOUR + 1) : [];
  // (🙋 : qui veut quoi — les membres seulement)
  const veulent = new Map<string, PlaceGroupe[]>();
  for (const f of envies.filter((x) => dedans.has(x.q)).sort((a, b) => a.le - b.le))
    for (const v of f.videos) if (v?.id) veulent.set(v.id, [...(veulent.get(v.id) ?? []), place(dedans.get(f.q)!)]);
  const vue = (v: VideoSalon, f?: FicheVideoDuJour): VideoDuGroupe => {
    const l = veulent.get(v.id) ?? [];
    return {
      id: v.id,
      titre: v.titre,
      chaine: v.chaine,
      duree: v.duree,
      ...(f ? { de: place(dedans.get(f.q)!), ...(f.mot ? { mot: f.mot } : {}) } : { nouveaute: true as const }),
      envies: l,
      ...(l.some((p) => p.q === q) ? { moi: true as const } : {}),
      ...(l.length >= ENVIES_RETENUE ? { retenue: true as const } : {}),
      ...(f?.q === q ? { mienne: true as const } : {}),
    };
  };
  return {
    jour,
    selection: [...proposees.map((f) => vue(f.video, f)), ...nouveautes.map((v) => vue(v))],
    roles: rolesDuJour(membres.map(place), jour, q),
    ...(t ? { theme: t.id } : {}),
  };
}

export async function aujourdhuiDuGroupe(supabase: Supabase, moi: Habitant, groupe: unknown): Promise<Resultat<{ aujourdhui?: AujourdhuiDuGroupe }>> {
  const m = await membre(supabase, moi, groupe);
  if (!m.gid) return { error: m.error, statut: m.statut };
  return { aujourdhui: await construire(supabase, moi, m.gid, jourParis()) };
}

/** ＋ Ma vidéo du jour pour le groupe (de ma télé du jour, ou un lien YouTube), et mon mot. Je la veux, bien sûr. */
export async function proposerVideoDuJour(supabase: Supabase, moi: Habitant, p: Record<string, unknown>, maintenant = Date.now()): Promise<Resultat<{ aujourdhui?: AujourdhuiDuGroupe }>> {
  const m = await membre(supabase, moi, p.groupe);
  if (!m.gid || !m.fiche) return { error: m.error, statut: m.statut };
  const mot = s(p.mot).replace(/\s+/g, " ");
  const refus = mot ? refusDuGroupe(mot, MOT_GROUPE_MAX) : null;
  if (refus) return { error: `Le mot ne passe pas : ${refus}.`, statut: 400 };
  const c = await videoChoisie(supabase, moi, p);
  if (c.error) return { error: c.error, statut: c.statut };
  if (!c.video) return { error: "Choisis une vidéo.", statut: 400 };
  const jour = jourParis(new Date(maintenant));
  const q = qui8(moi.id);
  const f: FicheVideoDuJour = { q, prenom: m.fiche.prenom, src: m.fiche.src, video: c.video, ...(mot ? { mot } : {}), le: maintenant };
  if (!(await ecrireJson(supabase, `${dossierJourGroupe(m.gid, jour)}/${q}.json`, f))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  await poserEnvie(supabase, m.gid, jour, q, c.video, true, maintenant);
  return { aujourdhui: await construire(supabase, moi, m.gid, jour) };
}

/** Retirer ma vidéo du jour. */
export async function retirerVideoDuJour(supabase: Supabase, moi: Habitant, p: Record<string, unknown>): Promise<Resultat<{ aujourdhui?: AujourdhuiDuGroupe }>> {
  const m = await membre(supabase, moi, p.groupe);
  if (!m.gid) return { error: m.error, statut: m.statut };
  const jour = jourParis();
  await supabase.storage
    .from(SEAU_FIGURINES)
    .remove([`${dossierJourGroupe(m.gid, jour)}/${qui8(moi.id)}.json`])
    .then(
      () => undefined,
      () => undefined,
    );
  return { aujourdhui: await construire(supabase, moi, m.gid, jour) };
}

async function poserEnvie(supabase: Supabase, gid: string, jour: string, q: string, v: VideoSalon, oui: boolean, maintenant: number): Promise<boolean> {
  const chemin = `${dossierEnvies(gid, jour)}/${q}.json`;
  const avant = await lireJson<Partial<FicheEnvies>>(supabase, chemin).catch(() => ({}) as Partial<FicheEnvies>);
  const l = (Array.isArray(avant.videos) ? avant.videos : []).filter((x) => x?.id && x.id !== v.id);
  const videos = oui ? [...l, { id: v.id, titre: v.titre, chaine: v.chaine, duree: v.duree }].slice(-12) : l;
  return ecrireJson(supabase, chemin, { q, videos, le: Number(avant.le) || maintenant } satisfies FicheEnvies);
}

/** 🙋 Je la veux ce soir (ou plus). → `retenue` : ma main est la deuxième, elle ouvrira la séance. */
export async function envieDuJour(supabase: Supabase, moi: Habitant, p: Record<string, unknown>, maintenant = Date.now()): Promise<Resultat<{ aujourdhui?: AujourdhuiDuGroupe; retenue?: true }>> {
  const m = await membre(supabase, moi, p.groupe);
  if (!m.gid) return { error: m.error, statut: m.statut };
  const jour = jourParis(new Date(maintenant));
  const avant = await construire(supabase, moi, m.gid, jour);
  const v = avant.selection.find((x) => x.id === s(p.video));
  if (!v) return { error: "Cette vidéo n’est plus dans la sélection du jour.", statut: 404 };
  const oui = p.oui !== false;
  if (!(await poserEnvie(supabase, m.gid, jour, qui8(moi.id), v, oui, maintenant))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  const apres = await construire(supabase, moi, m.gid, jour);
  const retenue = Boolean(oui && !v.retenue && apres.selection.find((x) => x.id === v.id)?.retenue);
  return { aujourdhui: apres, ...(retenue ? { retenue: true as const } : {}) };
}
