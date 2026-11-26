/**
 * 🔔 SUIVRE UNE DISCUSSION DE VIDÉO (`docs/univers/discussions-video.md`, le lot A3) : 🔔 Prévenir, 🤫 Sans bruit,
 * 🔕 Ne plus suivre — pour chaque discussion (une vidéo × un cercle). Toujours réversible.
 *
 * - `<habitant>/suivis-videos.json` = { suivis: { "<cercle>:<vidéo>": { niveau?, lu?, depuis?, titre? } } } : mes choix
 *   (`niveau` absent : le niveau de départ), et quand je l'ai lue la dernière fois (`lu`) ; deux cents au plus.
 * - `discussions/<cercle>/<tranche ou ->/<vidéo>/suiveurs/<q>.json` = { h, niveau } : qui la suit (écrit par celui qui
 *   suit) — pour prévenir (lots A4 et A5) sans relire tout le monde.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { SEAU_FIGURINES, ecrireJson, lireJson } from "./ma-figurine-serveur";
import { qui8 } from "./talkie-serveur";
import { NIVEAUX_SUIVI, type CercleDiscussion, type NiveauSuivi } from "./discussion-video";

type Supabase = ReturnType<typeof createAdminClient>;
type Suivi = { niveau?: NiveauSuivi; lu?: number; depuis?: number; titre?: string };
type Fiche = { suivis?: Record<string, Suivi> };
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const MAX = 200;
const cheminSuivis = (h: string) => `${h}/suivis-videos.json`;
export const cleSuivi = (cercle: CercleDiscussion, video: string) => `${cercle}:${video}`;
export const dossierSuiveurs = (cercle: CercleDiscussion, tranche: string, video: string) => `discussions/${cercle}/${tranche || "-"}/${video}/suiveurs`;
export const niveauValide = (x: unknown): NiveauSuivi | null => ((NIVEAUX_SUIVI as readonly unknown[]).includes(x) ? (x as NiveauSuivi) : null);

/** Tous mes suivis (pour Activité, lot A4). */
export const tousMesSuivis = (supabase: Supabase, h: string) => lire(supabase, h);
export type { Suivi };

async function lire(supabase: Supabase, h: string): Promise<Record<string, Suivi>> {
  const f = await lireJson<Fiche>(supabase, cheminSuivis(h)).catch(() => ({}) as Fiche);
  return f.suivis && typeof f.suivis === "object" ? f.suivis : {};
}
async function ecrire(supabase: Supabase, h: string, suivis: Record<string, Suivi>): Promise<void> {
  const gardes = Object.entries(suivis)
    .sort((a, b) => (Number(b[1].lu ?? b[1].depuis) || 0) - (Number(a[1].lu ?? a[1].depuis) || 0))
    .slice(0, MAX);
  await ecrireJson(supabase, cheminSuivis(h), { suivis: Object.fromEntries(gardes) }).catch(() => false);
}

/** Mes choix pour une vidéo (les deux cercles), et quand je l'ai lue. */
export async function mesSuivis(supabase: Supabase, h: string, video: string): Promise<Partial<Record<CercleDiscussion, Suivi>>> {
  const l = await lire(supabase, h);
  return { proches: l[cleSuivi("proches", video)], tous: l[cleSuivi("tous", video)] };
}

/** Choisir son niveau (toujours réversible) ; l'index des suiveurs suit. */
export async function choisirNiveau(supabase: Supabase, h: string, o: { cercle: CercleDiscussion; video: string; tranche: string; niveau: NiveauSuivi; titre?: string }): Promise<void> {
  const l = await lire(supabase, h);
  const c = cleSuivi(o.cercle, o.video);
  l[c] = { ...l[c], niveau: o.niveau, depuis: l[c]?.depuis ?? Date.now(), ...(o.titre ? { titre: o.titre } : {}) };
  await ecrire(supabase, h, l);
  const chemin = `${dossierSuiveurs(o.cercle, o.tranche, o.video)}/${qui8(h)}.json`;
  if (o.niveau === "non") await supabase.storage.from(SEAU_FIGURINES).remove([chemin]).then(() => undefined, () => undefined);
  else await ecrireJson(supabase, chemin, { h, niveau: o.niveau }).catch(() => false);
}

/**
 * ✍️ Je viens de publier (un mot écrit ou dit) : je suis la discussion 🌍 sans bruit — sauf si j'ai déjà choisi.
 * Rend `true` si c'est la première fois (l'écran propose alors « 🔔 Te prévenir quand quelqu'un écrit ici ? »).
 */
export async function suivreApresPublication(supabase: Supabase, h: string, o: { video: string; tranche: string; titre?: string }): Promise<boolean> {
  const l = await lire(supabase, h);
  const c = cleSuivi("tous", o.video);
  if (l[c]?.niveau) return false;
  await choisirNiveau(supabase, h, { cercle: "tous", video: o.video, tranche: o.tranche, niveau: "discret", titre: o.titre });
  return true;
}

/** Je l'ai lue (maintenant) : rend quand je l'avais lue avant (0 : jamais). */
export async function marquerLu(supabase: Supabase, h: string, video: string, titre: string): Promise<Partial<Record<CercleDiscussion, number>>> {
  const l = await lire(supabase, h);
  const avant = { proches: Number(l[cleSuivi("proches", video)]?.lu) || 0, tous: Number(l[cleSuivi("tous", video)]?.lu) || 0 };
  const maintenant = Date.now();
  for (const cercle of ["proches", "tous"] as const) {
    const c = cleSuivi(cercle, video);
    l[c] = { ...l[c], lu: maintenant, ...(s(titre) ? { titre: s(titre) } : {}) };
  }
  await ecrire(supabase, h, l);
  return avant;
}
