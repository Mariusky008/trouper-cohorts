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
 * - `ecrit` : il écrit (« … » au-dessus de sa figurine) — ce qu'il prépare, redit toutes les 5 s (`prepare.json`) ;
 * - 🚪 (section 4.13) `piece` : la pièce du duo ; `invitation` : celle où il m'invite ; `refus` : il a dit « Pas
 *   maintenant » à la mienne (`salon-serveur.ts`, `piece.json`) ;
 * - 👀 (22 novembre 2026) `ici` : il est dans cette conversation, en ce moment (son pouls l'y note, `ici.json`) — changer
 *   de pièce est alors une invitation ; sinon, la pièce change tout de suite.
 *
 * Cinq petites lectures en parallèle ; qui parle à qui est gardé une minute en mémoire (pas de relecture des proches
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
import { cheminIci, cheminPieceDuo, estIci, etatPieceDuo, type FichePieceDuo } from "./salon-serveur";
import type { PieceDuo } from "./pieces-duo";

type Supabase = ReturnType<typeof createAdminClient>;
export const cheminPouls = (pair: string) => `fils/${pair}/pouls.json`;

/** Le pouls, tel que le téléphone le lit. */
/** (🎙️ lot S4) `parle` : il parle dans son talkie (au lieu d'écrire). */
export type Pouls = { n: number; la: boolean; ici?: true; ecrit?: true; parle?: true; vu?: string; piece?: PieceDuo; invitation?: PieceDuo; invitationLe?: number; refus?: true };

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

/** (👀 la dernière fois que ce serveur m'a noté dans cette conversation : une écriture toutes les 15 s au plus) */
const ICI_REDIT_MS = 15_000;
const notesIci = new Map<string, number>();

/** 💓 Le pouls de la conversation avec ce proche. */
export async function poulsAvec(supabase: Supabase, moi: Habitant, cle: unknown, maintenant = Date.now()): Promise<{ pouls?: Pouls; error?: string; statut?: number }> {
  const d = await duoDe(supabase, moi, cle);
  if ("error" in d) return d;
  const [p, la, reglages, prepare, piece, ici] = await Promise.all([
    lireJson<{ n?: number }>(supabase, cheminPouls(d.pair)),
    lireJson<{ le?: number }>(supabase, cheminLa(d.h)),
    lireJson<{ presence?: boolean }>(supabase, cheminReglages(d.h)),
    lireJson<Record<string, number>>(supabase, cheminPrepare(d.pair)),
    lireJson<FichePieceDuo>(supabase, cheminPieceDuo(d.pair)),
    lireJson<Record<string, number>>(supabase, cheminIci(d.pair)),
  ]);
  const visible = reglages.presence !== false;
  const le = Number(la.le) || 0;
  const estLa = visible && maintenant - le < LA_MS;
  const lui8 = qui8(d.h);
  // (👀 je suis dans cette conversation : noté — une écriture toutes les 15 s au plus)
  const moi8 = qui8(moi.id);
  const k = `${d.pair}:${moi8}`;
  if (maintenant - (notesIci.get(k) ?? 0) >= ICI_REDIT_MS || maintenant - (Number(ici[moi8]) || 0) >= ICI_REDIT_MS * 2) {
    if (notesIci.size > 5000) notesIci.clear();
    notesIci.set(k, maintenant);
    await ecrireJson(supabase, cheminIci(d.pair), { ...ici, [moi8]: maintenant }).catch(() => undefined);
  }
  const prepare8 = maintenant - (Number(prepare[lui8]) || 0) < ENREGISTRE_MS;
  // (🎙️ lot S4 : il parle dans son talkie, ou il écrit)
  const parle = prepare8 && Number(prepare[`${lui8}~`]) === 1;
  const ecrit = prepare8 && !parle;
  return {
    pouls: {
      n: Number(p.n) || 0,
      la: estLa,
      ...(estLa && estIci(ici, lui8, maintenant) ? { ici: true as const } : {}),
      ...(ecrit ? { ecrit: true as const } : {}),
      ...(parle ? { parle: true as const } : {}),
      ...(!estLa && visible && le ? { vu: new Date(le).toISOString() } : {}),
      ...etatPieceDuo(piece, qui8(moi.id), maintenant),
    },
  };
}

/** 💓 Un événement dans la conversation avec ce proche (un message, un mème, un geste, un message effacé) : le pouls bat. */
export async function battre(supabase: Supabase, moi: Habitant, cle: unknown): Promise<void> {
  const d = await duoDe(supabase, moi, cle);
  if ("error" in d) return;
  await ecrireJson(supabase, cheminPouls(d.pair), { n: Date.now() });
}
