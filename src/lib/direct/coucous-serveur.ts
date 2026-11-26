/**
 * 👋 LE COUCOU (le lot F2 du fil, 25 novembre 2026 ; `docs/univers/fil.md`) — RANGÉ DANS LE SEAU, chez celui qui le
 * reçoit : `<h>/monde/coucous.json` = { liste: [{ id, de, le, repondu_le?, laisse_le? }] } (les 40 derniers).
 *
 * Quelqu'un qui partage une de ses passions voit sa pièce dans le fil et lui fait coucou : sa figurine apparaît dans la
 * pièce (« 👋 Coucou ! »), il est prévenu. Il répond s'il veut (`repondu_le`), ou le laisse (`laisse_le`) : la figurine
 * s'en va. Jamais une fausse réponse : seule la sienne compte. Les règles (qui peut, une fois par jour) :
 * `visites-serveur.ts` (`faireCoucou`, `repondreCoucou`, `coucousRecus`).
 *
 * FICHIER SERVEUR.
 */
import { randomUUID } from "node:crypto";
import type { createAdminClient } from "@/lib/supabase/admin";
import { ecrireJson, lireJson } from "./ma-figurine-serveur";
import type { GesteCoucou } from "./ma-maison";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

export type Coucou = { id: string; de: string; le: string; repondu_le?: string; laisse_le?: string; /** (« Quoi de neuf ? ») son geste, et l'emoji de la passion pour « Allez ! » */ geste?: GesteCoucou; e?: string };
const chemin = (h: string) => `${h}/monde/coucous.json`;

export async function lireCoucous(supabase: Supabase, h: string): Promise<Coucou[]> {
  const v = await lireJson<{ liste?: Coucou[] }>(supabase, chemin(h)).catch(() => ({}) as { liste?: Coucou[] });
  return Array.isArray(v.liste) ? v.liste.filter((x) => s(x?.id) && s(x?.de) && s(x?.le)) : [];
}

export const ecrireCoucous = (supabase: Supabase, h: string, liste: Coucou[]) => ecrireJson(supabase, chemin(h), { liste: liste.slice(-40) });

export const coucouDe = (de: string, geste: GesteCoucou = "coucou", e?: string): Coucou => ({ id: randomUUID().slice(0, 12), de, le: new Date().toISOString(), ...(geste !== "coucou" ? { geste } : {}), ...(e ? { e } : {}) });
