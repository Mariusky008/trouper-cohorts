/**
 * 🔥🎧❤️ « ELLE CHANGE TOUTE SEULE », CÔTÉ SERVEUR (`ornements.ts` ; `docs/univers/ma-figurine.md`, section 3).
 *
 * Tout se lit dans ce qui est déjà rangé, sans rien fabriquer :
 *   · 🔥 `<habitant>/presence.json` (ses jours sur ClikMe, notés à l'ouverture de l'appli : `etapes-serveur.ts`) ;
 *   · 🎧 `<habitant>/mes-salons.json` (les salons ouverts où il va) — sinon `<habitant>/passions.json` ;
 *   · ❤️ `<habitant>/coeur.json` = { prenom, sorte, le } : son dernier souvenir avec un proche, noté quand il ouvre une
 *     surprise (`visites-serveur.ts`, `deciderSouvenir`) ou quand une vidéo vue ensemble devient un souvenir commun
 *     (`etagere-serveur.ts`, `poserSouvenirCommun`) ;
 *   · la boîte de sa tête : ses calques (`calquesDeFigurine`, sans rien fabriquer).
 *
 * Pas d'import de `ma-maison-serveur` ni d'`etagere-serveur` (qui l'importent).
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { jourParis } from "@/lib/jour-paris";
import { ecrireJson, lireJson, lireLigne } from "./ma-figurine-serveur";
import { calquesDeFigurine } from "./calques-figurine-serveur";
import { themeDe, type IdTheme } from "./decouvrir";
import type { Zone } from "./pieces-duo";
import { COEUR_JOURS, PASSION_JOURS, aDesOrnements, accessoireDe, serieDeJours, type CoeurSouvenir, type Ornements } from "./ornements";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const JOUR_MS = 86_400_000;

export const cheminCoeur = (h: string) => `${h}/coeur.json`;

/** ❤️ Noter son dernier souvenir avec un proche (`de` : le proche). Jamais d'erreur : un cœur de moins, rien de cassé. */
export async function noterCoeur(supabase: Supabase, h: string, de: string, sorte: CoeurSouvenir["sorte"]): Promise<void> {
  if (!h || !de || h === de) return;
  try {
    const prenom = s((await lireLigne(supabase, de)).ligne?.prenom);
    if (!prenom) return;
    await ecrireJson(supabase, cheminCoeur(h), { prenom, sorte, le: new Date().toISOString() });
  } catch {
    /* (un cœur de moins) */
  }
}

/** 🎧 Sa passion du moment : le salon où il est allé le plus souvent ce mois-ci (le plus récent, à égalité), sinon sa première passion. */
export async function passionDuMoment(supabase: Supabase, h: string, maintenant = Date.now()): Promise<IdTheme | null> {
  const [salons, passions] = await Promise.all([
    lireJson<{ themes?: Record<string, { n?: number; dernier?: number }> }>(supabase, `${h}/mes-salons.json`).catch(() => ({}) as { themes?: Record<string, { n?: number; dernier?: number }> }),
    lireJson<{ passions?: unknown[] }>(supabase, `${h}/passions.json`).catch(() => ({}) as { passions?: unknown[] }),
  ]);
  const recents = Object.entries(salons.themes ?? {})
    .map(([t, v]) => ({ t, n: Number(v?.n) || 1, dernier: Number(v?.dernier) || 0 }))
    .filter((x) => themeDe(x.t) && maintenant - x.dernier < PASSION_JOURS * JOUR_MS)
    .sort((a, b) => b.n - a.n || b.dernier - a.dernier);
  if (recents.length) return recents[0].t as IdTheme;
  const premiere = (Array.isArray(passions.passions) ? passions.passions : []).map(s).find((t) => themeDe(t));
  return (premiere as IdTheme) ?? null;
}

/**
 * ✨ Ce qu'elle porte toute seule aujourd'hui (rien : `null`). `boite` : celle de sa tête, si on l'a déjà (sa tête du
 * jour) — sinon lue dans ses calques.
 */
export async function ornementsDe(supabase: Supabase, h: string, o: { boite?: Zone | null } = {}): Promise<Ornements | null> {
  const maintenant = Date.now();
  const [presence, theme, coeur, calques] = await Promise.all([
    lireJson<{ jours?: unknown[] }>(supabase, `${h}/presence.json`).catch(() => ({}) as { jours?: unknown[] }),
    passionDuMoment(supabase, h, maintenant).catch(() => null),
    lireJson<{ prenom?: string; sorte?: string; le?: string }>(supabase, cheminCoeur(h)).catch(() => ({}) as { prenom?: string; sorte?: string; le?: string }),
    o.boite ? Promise.resolve(null) : calquesDeFigurine(supabase, h, { fabriquer: false }).catch(() => null),
  ]);
  const serie = serieDeJours((Array.isArray(presence.jours) ? presence.jours : []).map(s), jourParis());
  const accessoire = accessoireDe(theme);
  const frais = maintenant - (Date.parse(s(coeur.le)) || 0) < COEUR_JOURS * JOUR_MS;
  const c: CoeurSouvenir | null = frais && s(coeur.prenom) && (coeur.sorte === "surprise" || coeur.sorte === "ensemble") ? { prenom: s(coeur.prenom), sorte: coeur.sorte } : null;
  const boite = o.boite ?? (Array.isArray(calques?.tete?.boite) ? (calques!.tete.boite as Zone) : null);
  const r: Ornements = {
    ...(serie > 0 ? { serie } : {}),
    ...(accessoire ? { accessoire } : {}),
    ...(c ? { coeur: c } : {}),
    ...(boite ? { boite } : {}),
  };
  return aDesOrnements(r) ? r : null;
}
