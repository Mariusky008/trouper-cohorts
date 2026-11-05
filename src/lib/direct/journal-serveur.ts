/**
 * 📓 TOUT CE QU'IL DIT DE LUI, GARDÉ — 5 novembre 2026, le lot 1 de la stratégie validée avec le patron (« tu
 * enregistres tout sur Supabase pour ne pas perdre les infos ? » — jusque-là, seules ses 8 dernières réponses et ses
 * 12 dernières réactions restaient) : ses réponses à « Et toi ? », ses « c'est tout moi / jamais de la vie », et ce que
 * chaque rencontre a révélé de lui, datés, MOIS PAR MOIS (`<habitant>/journal/<AAAA-MM>.json`, seau privé des
 * figurines, sur Supabase : rien ne reste sur le téléphone).
 *
 * À QUOI ÇA SERVIRA : sa phrase du mois (le lot 3 — « un horoscope drôle et bienveillant qui le connaît »), et la page
 * « Ce que ta figurine sait de toi » (le lot 2), où il verra tout, corrigera et effacera. Rien de sensible n'y entre :
 * les réponses passent par les mêmes refus que le reste (pas de numéro, de lien, de mot interdit).
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { SEAU_FIGURINES } from "./ma-figurine-serveur";
import { ecrire, lire } from "./personnage-serveur";

type Supabase = ReturnType<typeof createAdminClient>;

export type EntreeJournal =
  /** Sa réponse à la question de fin d'une rencontre (« Et toi ? »). */
  | { type: "reponse"; le: string; rencontre: string; question: string; texte: string }
  /** Il s'est reconnu (« moi ») ou pas (« pas ») dans une phrase de sa figurine ; `null` : il a retiré son avis. */
  | { type: "verdict"; le: string; rencontre: string; phrase: string; verdict: "moi" | "pas" | null }
  /** Ce que la rencontre a révélé de lui (écrit par l'IA, ou composé sans elle), et avec qui. */
  | { type: "revele"; le: string; rencontre: string; avec: string; texte: string }
  /** Sa réponse à la question du jour (`connaitre.ts`). */
  | { type: "question"; le: string; cle: string; question: string; texte: string };

/** (au plus, par mois : de quoi tenir des années d'un usage quotidien sans qu'un fichier enfle sans fin) */
const ENTREES_PAR_MOIS = 2000;

export const moisParis = (d = new Date()) => d.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" }).slice(0, 7);
const cheminJournal = (habitantId: string, mois: string) => `${habitantId}/journal/${mois}.json`;

/** Une entrée de plus dans son journal du mois. Jamais bloquant : un journal qui n'a pas pu s'écrire ne casse rien. */
export async function noterAuJournal(supabase: Supabase, habitantId: string, e: EntreeJournal): Promise<void> {
  if (!habitantId) return;
  try {
    const chemin = cheminJournal(habitantId, moisParis(new Date(e.le)));
    const avant = (await lire<{ entrees?: EntreeJournal[] }>(supabase, chemin))?.entrees ?? [];
    await ecrire(supabase, chemin, { entrees: [...avant, e].slice(-ENTREES_PAR_MOIS) });
  } catch {
    /* rien : le journal ne doit jamais empêcher une rencontre */
  }
}

/** Son journal d'un mois (le mois en cours par défaut). */
export async function journalDuMois(supabase: Supabase, habitantId: string, mois = moisParis()): Promise<EntreeJournal[]> {
  return (await lire<{ entrees?: EntreeJournal[] }>(supabase, cheminJournal(habitantId, mois)))?.entrees ?? [];
}

/** Les mois de son journal (« 2026-11 »…), les plus récents d'abord. */
export async function moisDuJournal(supabase: Supabase, habitantId: string): Promise<string[]> {
  try {
    const { data } = await supabase.storage.from(SEAU_FIGURINES).list(`${habitantId}/journal`, { limit: 240 });
    return ((Array.isArray(data) ? data : []) as { name?: string }[])
      .map((x) => String(x.name ?? "").replace(/\.json$/, ""))
      .filter((m) => /^\d{4}-\d{2}$/.test(m))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

/** Tout son journal (tous les mois), les plus récentes d'abord. */
export async function toutLeJournal(supabase: Supabase, habitantId: string): Promise<EntreeJournal[]> {
  const mois = await moisDuJournal(supabase, habitantId);
  const parMois = await Promise.all(mois.map((m) => journalDuMois(supabase, habitantId, m)));
  return parMois.flat().sort((a, b) => b.le.localeCompare(a.le));
}

/** 🗑️ Il efface UNE chose (son heure `le`) : rendue, pour qu'on l'oublie aussi ailleurs. */
export async function effacerDuJournal(supabase: Supabase, habitantId: string, le: string): Promise<EntreeJournal | null> {
  const mois = moisParis(new Date(le));
  if (!/^\d{4}-\d{2}$/.test(mois)) return null;
  const entrees = await journalDuMois(supabase, habitantId, mois);
  const ote = entrees.find((e) => e.le === le) ?? null;
  if (ote) await ecrire(supabase, cheminJournal(habitantId, mois), { entrees: entrees.filter((e) => e.le !== le) });
  return ote;
}

/** 🗑️ Il efface TOUT son journal. */
export async function effacerToutLeJournal(supabase: Supabase, habitantId: string): Promise<void> {
  const mois = await moisDuJournal(supabase, habitantId);
  if (mois.length) await supabase.storage.from(SEAU_FIGURINES).remove(mois.map((m) => cheminJournal(habitantId, m)));
}
