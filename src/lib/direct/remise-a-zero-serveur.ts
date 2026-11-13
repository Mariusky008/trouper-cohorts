/**
 * 🧹 REMETTRE L'APPLI À ZÉRO — le propriétaire, le 13 novembre 2026, une fois l'univers ouvert à tous : « ce sont que des
 * comptes fictifs, donc peut-être que le plus simple c'est de tout réinitialiser, effacer les comptes et recommencer à
 * zéro » ; ses réponses : tout effacer, son compte aussi ; l'appli seulement.
 *
 * CE QUI PART — tous les comptes de l'appli (`human_habitants`) et ce qui leur appartient (`TABLES`) : leurs figurines,
 * leurs mèmes et leur mesure, leurs vœux, leurs proches et leurs conversations, leurs cartes de fidélité, leurs visites
 * et les mots du jour chez les commerçants, leurs maisons, leurs salons, leurs notifications ; et leurs fichiers
 * (`SEAUX`) : le seau des figurines (leurs dossiers, leurs univers, leurs fils, les profils, les mèmes déposés « Autour »…)
 * sauf ce qui n'est pas à eux (`GARDES`), et les seaux de leurs maisons et de leurs salons.
 * CE QUI RESTE — les commerçants et tout ce qui est à eux (vitrines, offres, échanges, factures, leurs mèmes), les
 * administrateurs, Pablito (`demo-proprio/`), les essais du lot 0 (`essais-univers/`), les lieux publics placés par
 * l'admin (`lieux-publics/`).
 *
 * En deux temps : `compterLaRemise` (rien n'est effacé), puis `effacerUnLot` (une confirmation tapée, « EFFACER » ; les
 * fichiers d'abord, par lots — la page rappelle jusqu'au bout —, puis les lignes). Une table absente est sautée.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { SEAU_FIGURINES } from "./ma-figurine-serveur";
import { SEAU_MAISON } from "./maison-serveur";
import { SEAU_SALONS } from "./ranger-photo";

type Supabase = ReturnType<typeof createAdminClient>;

/** La confirmation à taper. */
export const CONFIRMATION_REMISE = "EFFACER";

/** Les tables des comptes de l'appli, et la colonne qui les y relie (les enfants d'abord, les comptes à la fin). */
export const TABLES: readonly (readonly [string, string])[] = [
  ["clik_voeu_vue", "id"],
  ["clik_voeu_serie", "habitant_id"],
  ["clik_voeu", "habitant_id"],
  ["clik_meme_evenement", "id"],
  ["clik_figurine_message", "habitant_id"],
  ["clik_ma_figurine", "habitant_id"],
  ["clik_surprise_tirage", "habitant_id"],
  ["clik_accord", "habitant_id"],
  ["clik_presence", "habitant_id"],
  ["clik_mot", "habitant_id"],
  ["clik_message", "habitant_id"],
  ["clik_visite", "habitant_id"],
  ["clik_contact", "habitant_id"],
  ["clik_cage", "habitant_id"],
  ["clik_avis_film", "habitant_id"],
  ["clik_reaction", "habitant_id"],
  ["clik_participation", "habitant_id"],
  ["human_push_envois", "habitant"],
  ["human_push_abonnements", "habitant"],
  ["human_habitant_blocages", "habitant"],
  ["human_maison_elements", "habitant"],
  ["human_maisons_privees", "habitant"],
  ["human_maisons", "habitant"],
  ["human_ville_signalements", "habitant"],
  ["human_ville_gestes", "habitant"],
  ["human_ville_publications", "habitant"],
  ["human_conversations", "createur"],
  ["human_suivis", "habitant_id"],
  ["human_gardees", "habitant_id"],
  ["human_habitant_codes", "id"],
  ["human_habitants", "id"],
];

/** Dans le seau des figurines, ce qui n'est pas aux comptes de l'appli (les dossiers du haut). */
export const GARDES: readonly string[] = ["demo-proprio", "essais-univers", "lieux-publics"];
/** Les seaux à vider : celui des figurines (sauf `GARDES`), ceux des maisons et des salons (tout). */
const SEAUX: readonly { seau: string; garder: readonly string[] }[] = [
  { seau: SEAU_FIGURINES, garder: GARDES },
  { seau: SEAU_MAISON, garder: [] },
  { seau: SEAU_SALONS, garder: [] },
];

type Entree = { name?: string; id?: string | null };
async function lister(supabase: Supabase, seau: string, dossier: string): Promise<{ fichiers: string[]; dossiers: string[] }> {
  const fichiers: string[] = [];
  const dossiers: string[] = [];
  for (let offset = 0; offset < 100_000; offset += 1000) {
    const { data, error } = await supabase.storage.from(seau).list(dossier, { limit: 1000, offset });
    if (error) break;
    const l = (Array.isArray(data) ? data : []) as Entree[];
    for (const e of l) {
      const nom = String(e.name ?? "");
      if (!nom || nom === ".emptyFolderPlaceholder") continue;
      const chemin = dossier ? `${dossier}/${nom}` : nom;
      if (e.id) fichiers.push(chemin);
      else dossiers.push(chemin);
    }
    if (l.length < 1000) break;
  }
  return { fichiers, dossiers };
}

/** Les fichiers à effacer d'un seau, `max` au plus (le parcours s'arrête là). */
async function fichiersAEffacer(supabase: Supabase, seau: string, garder: readonly string[], max: number): Promise<{ chemins: string[]; gardes: string[]; plus: boolean }> {
  const chemins: string[] = [];
  const haut = await lister(supabase, seau, "");
  const gardes = haut.dossiers.filter((d) => garder.includes(d));
  chemins.push(...haut.fichiers.filter((f) => !garder.includes(f)).slice(0, max));
  const pile = haut.dossiers.filter((d) => !garder.includes(d));
  while (pile.length && chemins.length < max) {
    const d = pile.shift()!;
    const l = await lister(supabase, seau, d);
    chemins.push(...l.fichiers.slice(0, max - chemins.length));
    pile.unshift(...l.dossiers);
  }
  return { chemins, gardes, plus: chemins.length >= max };
}

export type CompteRemise = {
  tables: { table: string; lignes: number | null }[];
  fichiers: { seau: string; n: number; plus: boolean; gardes: string[] }[];
};

/** 🔎 Ce qui partirait (rien n'est effacé). `null` : la table n'existe pas ici. */
export async function compterLaRemise(supabase: Supabase): Promise<CompteRemise> {
  const tables = await Promise.all(
    TABLES.map(async ([table, colonne]) => {
      const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true }).not(colonne, "is", null);
      return { table, lignes: error ? null : (count ?? 0) };
    }),
  );
  const fichiers: CompteRemise["fichiers"] = [];
  for (const { seau, garder } of SEAUX) {
    const r = await fichiersAEffacer(supabase, seau, garder, 5000);
    fichiers.push({ seau, n: r.chemins.length, plus: r.plus, gardes: r.gardes });
  }
  return { tables, fichiers };
}

/**
 * 🧹 Un lot : d'abord les fichiers (500 au plus par passage), puis, quand il n'en reste plus, toutes les lignes. Rend
 * ce qui a été effacé, et s'il reste à faire (la page rappelle).
 */
export async function effacerUnLot(supabase: Supabase, confirmation: unknown): Promise<{ error?: string; statut?: number; fichiers?: number; lignes?: number; reste?: boolean }> {
  if (confirmation !== CONFIRMATION_REMISE) return { error: `Tapez ${CONFIRMATION_REMISE} pour confirmer.`, statut: 400 };
  let fichiers = 0;
  for (const { seau, garder } of SEAUX) {
    const { chemins } = await fichiersAEffacer(supabase, seau, garder, 500 - fichiers);
    for (let i = 0; i < chemins.length; i += 100) {
      const { error } = await supabase.storage.from(seau).remove(chemins.slice(i, i + 100));
      if (error) return { error: `Les fichiers de « ${seau} » n’ont pas pu être effacés : ${error.message}`, statut: 502 };
    }
    fichiers += chemins.length;
    if (fichiers >= 500) return { fichiers, lignes: 0, reste: true };
  }
  if (fichiers > 0) return { fichiers, lignes: 0, reste: true };
  let lignes = 0;
  for (const [table, colonne] of TABLES) {
    const { count, error } = await supabase.from(table).delete({ count: "exact" }).not(colonne, "is", null);
    // (une table absente ici : sautée ; une autre erreur : on s'arrête, rien de plus n'est effacé)
    if (error && !/does not exist|relation|schema cache|Could not find/i.test(error.message)) return { error: `La table « ${table} » n’a pas pu être vidée : ${error.message}`, statut: 502, lignes };
    lignes += count ?? 0;
  }
  return { fichiers: 0, lignes, reste: false };
}
