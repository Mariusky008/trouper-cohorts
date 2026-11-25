/**
 * 👀 « PENDANT TON ABSENCE », SA FIGURINE RACONTE SA JOURNÉE (le chantier « Ma figurine », lot 2 ;
 * `docs/univers/ma-figurine.md`, section 4 ; le partagé : `journee-figurine.ts`).
 *
 * Le propriétaire, le 25 novembre 2026 : « Sa figurine raconte sa journée : qui m'a fait coucou, qui est passé chez moi,
 * combien m'ont vue dans les salons. Des prénoms, des vrais chiffres, jamais inventés. »
 *
 * Tout se lit dans ce qui est déjà rangé, sauf les salons :
 *   · 👋 `<h>/monde/coucous.json` (les coucous reçus, `coucous-serveur.ts`) ;
 *   · 🚪 `<h>/monde/visites.json` (qui est passé chez lui, `visites-serveur.ts`) ;
 *   · 👀 `<h>/ma-journee.json` = { jour, salons: { <q8>: prénom } } — NOUVEAU : ceux qui étaient dans le même salon ouvert
 *     (ou la même séance) que lui aujourd'hui, donc qui ont vu sa figurine. Noté à chaque entrée dans un salon, des deux
 *     côtés (celui qui entre voit ceux qui sont là, et ils le voient) : `noterVusAuSalon`. Une personne compte une fois
 *     par jour ; à minuit (l'heure de Paris), on repart de zéro.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { jourParis } from "@/lib/jour-paris";
import { ecrireJson, lireJson, lireLigne } from "./ma-figurine-serveur";
import { lireCoucous } from "./coucous-serveur";
// (le même identifiant court que les salons : jamais son compte)
import { qui8 } from "./talkie-serveur";
import { JOURNEE_PRENOMS_MAX, type JourneeFigurine } from "./journee-figurine";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

export const cheminJournee = (h: string) => `${h}/ma-journee.json`;
type FicheJournee = { jour?: string; salons?: Record<string, string> };

async function ajouterVus(supabase: Supabase, h: string, vus: { h: string; prenom: string }[], jour: string): Promise<void> {
  const autres = vus.filter((x) => x.h && x.h !== h);
  if (!autres.length) return;
  const f = await lireJson<FicheJournee>(supabase, cheminJournee(h)).catch(() => ({}) as Partial<FicheJournee>);
  const salons = f.jour === jour && f.salons && typeof f.salons === "object" ? { ...f.salons } : {};
  let neuf = false;
  for (const x of autres) {
    const q = qui8(x.h);
    if (salons[q]) continue;
    salons[q] = s(x.prenom) || "Quelqu’un";
    neuf = true;
  }
  if (neuf || f.jour !== jour) await ecrireJson(supabase, cheminJournee(h), { jour, salons });
}

/**
 * 👀 Il entre dans un salon (ou une séance) où d'autres sont déjà : il les voit, et ils voient sa figurine. Noté des deux
 * côtés. Jamais d'erreur : un salon de moins dans sa journée, rien de cassé.
 */
export async function noterVusAuSalon(supabase: Supabase, moi: { h: string; prenom: string }, autres: { h?: string; prenom?: string }[]): Promise<void> {
  const jour = jourParis();
  const l = autres.map((x) => ({ h: s(x.h), prenom: s(x.prenom) })).filter((x) => x.h && x.h !== moi.h);
  if (!l.length) return;
  await Promise.all([ajouterVus(supabase, moi.h, l, jour), ...l.map((x) => ajouterVus(supabase, x.h, [moi], jour))]).catch(() => undefined);
}

const premiers = (l: string[]) => [...new Set(l.filter(Boolean))];

/** 👀 Sa journée, racontée par sa figurine : les coucous, les visites, ceux qui l'ont vue dans les salons — aujourd'hui. */
export async function saJournee(supabase: Supabase, h: string): Promise<JourneeFigurine> {
  const jour = jourParis();
  const aujourdhui = (iso: unknown) => {
    const t = Date.parse(s(iso));
    return Boolean(t) && jourParis(new Date(t)) === jour;
  };
  const [coucous, visites, f] = await Promise.all([
    lireCoucous(supabase, h).catch(() => []),
    lireJson<{ liste?: { de?: string; le?: string }[] }>(supabase, `${h}/monde/visites.json`).catch(() => ({}) as { liste?: { de?: string; le?: string }[] }),
    lireJson<FicheJournee>(supabase, cheminJournee(h)).catch(() => ({}) as Partial<FicheJournee>),
  ]);
  // (les plus récents d'abord)
  const idsCoucou = premiers(coucous.filter((c) => c.de !== h && aujourdhui(c.le)).sort((a, b) => s(b.le).localeCompare(s(a.le))).map((c) => s(c.de)));
  const idsVisite = premiers((Array.isArray(visites.liste) ? visites.liste : []).filter((v) => s(v?.de) && s(v.de) !== h && aujourdhui(v.le)).sort((a, b) => s(b.le).localeCompare(s(a.le))).map((v) => s(v.de)));
  const ids = premiers([...idsCoucou, ...idsVisite]);
  const prenoms = new Map(await Promise.all(ids.map(async (id) => [id, s((await lireLigne(supabase, id).catch(() => ({ ligne: null }))).ligne?.prenom) || "Quelqu’un"] as const)));
  const vus = f.jour === jour && f.salons && typeof f.salons === "object" ? Object.values(f.salons).map(s).filter(Boolean) : [];
  return {
    coucous: idsCoucou.map((id) => prenoms.get(id) ?? "Quelqu’un"),
    visites: idsVisite.map((id) => prenoms.get(id) ?? "Quelqu’un"),
    salons: { n: vus.length, prenoms: vus.slice(-JOURNEE_PRENOMS_MAX).reverse() },
  };
}
