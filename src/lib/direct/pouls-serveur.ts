/**
 * 💓 LE POULS D'UNE CONVERSATION (`docs/univers/salon-du-duo.md`, section 7.4, étape 1 ; le lot S2, deuxième partie).
 *
 * Le salon écoute l'autre sans attendre ni tout relire : un « pouls » minuscule (`GET /api/direct/proches?pouls=<clé>`,
 * moins de 300 octets), relu toutes les 1,5 s quand les deux sont là, toutes les 10 s sinon, jamais page cachée :
 *
 * - `n` : le numéro du dernier événement du duo (un message, un mème, un geste, un message effacé) — l'heure, en
 *   millisecondes, où `battre` l'a noté dans `fils/<paire>/pouls.json` ; le salon ne relit la conversation que si
 *   ce numéro a changé ;
 * - `la` : l'autre est là (ClikMe ouvert dans les 2 min 30, s'il se montre) ; sinon `vu`, l'heure de sa dernière visite ;
 * - `ecrit` : il écrit (« … » au-dessus de sa figurine) — ce qu'il prépare, redit toutes les 5 s (`prepare.json`).
 *
 * Quatre petites lectures en parallèle ; qui parle à qui est gardé une minute en mémoire (pas de relecture des proches
 * à chaque battement).
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { ecrireJson, lireJson } from "./ma-figurine-serveur";
import { LA_MS, cheminLa, cheminReglages, hDeCle, pairDe, qui8, seParlent } from "./talkie-serveur";
import { cheminPrepare } from "./vivant-serveur";
import { ENREGISTRE_MS } from "./vivant";

type Supabase = ReturnType<typeof createAdminClient>;
export const cheminPouls = (pair: string) => `fils/${pair}/pouls.json`;

/** Le pouls, tel que le téléphone le lit. */
export type Pouls = { n: number; la: boolean; ecrit?: true; vu?: string };

const DUO_MS = 60_000;
const duos = new Map<string, { h: string; pair: string; jusqua: number }>();
/** Qui est derrière cette clé, et se parlent-ils (gardé une minute) ? */
async function duoDe(supabase: Supabase, moi: Habitant, cle: unknown): Promise<{ h: string; pair: string } | { error: string; statut: number }> {
  const k = `${moi.id}:${String(cle)}`;
  const deja = duos.get(k);
  if (deja && deja.jusqua > Date.now()) return deja;
  const h = await hDeCle(supabase, cle);
  if (!h || h === moi.id) return { error: "Ce proche n’existe pas.", statut: 404 };
  if (!(await seParlent(supabase, moi.id, h))) return { error: "Vous pourrez vous parler quand vous vous serez ajoutés tous les deux.", statut: 403 };
  const d = { h, pair: pairDe(moi.id, h), jusqua: Date.now() + DUO_MS };
  if (duos.size > 2000) duos.clear();
  duos.set(k, d);
  return d;
}

/** 💓 Le pouls de la conversation avec ce proche. */
export async function poulsAvec(supabase: Supabase, moi: Habitant, cle: unknown, maintenant = Date.now()): Promise<{ pouls?: Pouls; error?: string; statut?: number }> {
  const d = await duoDe(supabase, moi, cle);
  if ("error" in d) return d;
  const [p, la, reglages, prepare] = await Promise.all([
    lireJson<{ n?: number }>(supabase, cheminPouls(d.pair)),
    lireJson<{ le?: number }>(supabase, cheminLa(d.h)),
    lireJson<{ presence?: boolean }>(supabase, cheminReglages(d.h)),
    lireJson<Record<string, number>>(supabase, cheminPrepare(d.pair)),
  ]);
  const visible = reglages.presence !== false;
  const le = Number(la.le) || 0;
  const estLa = visible && maintenant - le < LA_MS;
  const ecrit = maintenant - (Number(prepare[qui8(d.h)]) || 0) < ENREGISTRE_MS;
  return { pouls: { n: Number(p.n) || 0, la: estLa, ...(ecrit ? { ecrit: true as const } : {}), ...(!estLa && visible && le ? { vu: new Date(le).toISOString() } : {}) } };
}

/** 💓 Un événement dans la conversation avec ce proche (un message, un mème, un geste, un message effacé) : le pouls bat. */
export async function battre(supabase: Supabase, moi: Habitant, cle: unknown): Promise<void> {
  const d = await duoDe(supabase, moi, cle);
  if ("error" in d) return;
  await ecrireJson(supabase, cheminPouls(d.pair), { n: Date.now() });
}
