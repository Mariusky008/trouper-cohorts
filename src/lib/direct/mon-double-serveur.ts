/**
 * ✨ MON DOUBLE DU JOUR, CÔTÉ SERVEUR (le chantier « Ma figurine », lot 1 ; `mon-double.ts` ; `docs/univers/ma-figurine.md`).
 *
 * RANGÉ DANS LE SEAU, À CÔTÉ DE SON HUMEUR : `<habitant>/mon-double.json` =
 *   { tete?: { jour, e } — la tête choisie aujourd'hui (elle ne vaut que ce jour-là) ;
 *     pancarte?: { mot, le } — sa phrase, jusqu'à ce qu'il la change (c'est aussi son mot du jour d'Autour) ;
 *     pret?: jour — le jour où il a préparé son double (la pastille de « ✨ Ma figurine » s'en va) }.
 *
 * `teteChoisieDuJour` est LA tête qu'il fait partout aujourd'hui : celle qu'il a choisie, sinon celle de son humeur du
 * jour. `teteDuJour` (la messagerie, sa maison, le fil, les salons), sa figurine vivante (la séance) et Autour la lisent.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { jourParis } from "@/lib/jour-paris";
import { ecrireJson, lireJson } from "./ma-figurine-serveur";
import { humeurDuJour } from "./talkie-serveur";
import { expressionDeLHumeur, expressionFigurineValide, type ExpressionFigurine } from "./expressions-figurine";
import { motInterdit } from "./mots-interdits";
import { parleDAlcool } from "./meme-surprise";
import { PANCARTE_MAX, PHRASES_DOUBLE } from "./mon-double";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

type FicheDouble = { tete?: { jour?: string; e?: string }; pancarte?: { mot?: string; le?: string }; pret?: string };
export const cheminDouble = (h: string) => `${h}/mon-double.json`;
const lire = (supabase: Supabase, h: string) => lireJson<FicheDouble>(supabase, cheminDouble(h)).catch(() => ({}) as Partial<FicheDouble>);

/** Ce qui est rangé de son double, lu une fois : la tête choisie aujourd'hui, sa pancarte, s'il est prêt aujourd'hui. */
export async function sonDouble(supabase: Supabase, h: string): Promise<{ choisie: ExpressionFigurine | null; pancarte: string; pret: boolean }> {
  const f = await lire(supabase, h);
  const jour = jourParis();
  const e = f.tete?.jour === jour && expressionFigurineValide(f.tete?.e) ? (f.tete!.e as ExpressionFigurine) : null;
  return { choisie: e, pancarte: s(f.pancarte?.mot).slice(0, PANCARTE_MAX), pret: s(f.pret) === jour };
}

/** 😊 La tête qu'il fait partout aujourd'hui : celle qu'il a choisie, sinon celle de son humeur du jour (rien : l'habituelle). */
export async function teteChoisieDuJour(supabase: Supabase, h: string): Promise<ExpressionFigurine | null> {
  const [d, humeur] = await Promise.all([sonDouble(supabase, h), humeurDuJour(supabase, h).catch(() => null)]);
  return d.choisie ?? expressionDeLHumeur(humeur);
}

/** 🪧 Sa pancarte (rien s'il n'en a pas). */
export const pancarteDe = async (supabase: Supabase, h: string) => (await sonDouble(supabase, h)).pancarte;

/** Une phrase de pancarte propre : un seul espace, 80 signes ; `refus` si elle ne passe pas (mots interdits, l'alcool). */
export function pancartePropre(x: unknown): { mot: string; refus?: string } {
  const mot = s(x).replace(/\s+/g, " ").trim().slice(0, PANCARTE_MAX);
  if (mot && (motInterdit(mot) || parleDAlcool(mot))) return { mot: "", refus: PHRASES_DOUBLE.refus };
  return { mot };
}

async function modifier(supabase: Supabase, h: string, f: (x: Partial<FicheDouble>) => Partial<FicheDouble>) {
  const avant = await lire(supabase, h);
  await ecrireJson(supabase, cheminDouble(h), f(avant));
}

/** 😊 Choisir sa tête du jour (`null` : revenir à celle de son humeur). Choisir, c'est préparer son double. */
export async function choisirSaTete(supabase: Supabase, h: string, e: unknown): Promise<{ ok?: true; error?: string }> {
  if (e !== null && e !== "humeur" && !expressionFigurineValide(e)) return { error: "Cette tête n’existe pas." };
  const jour = jourParis();
  await modifier(supabase, h, (x) => {
    const { tete: _t, ...reste } = x;
    void _t;
    return { ...reste, ...(e && e !== "humeur" ? { tete: { jour, e: String(e) } } : {}), pret: jour };
  });
  return { ok: true };
}

/** 🪧 Écrire sa pancarte (vide : l'enlever) — aussi quand il pose sa figurine dans Autour avec un mot du jour. */
export async function ecrireSaPancarte(supabase: Supabase, h: string, texte: unknown, o: { preparer?: boolean } = {}): Promise<{ ok?: true; pancarte?: string; error?: string }> {
  const p = pancartePropre(texte);
  if (p.refus) return { error: p.refus };
  const jour = jourParis();
  await modifier(supabase, h, (x) => {
    const { pancarte: _p, ...reste } = x;
    void _p;
    return { ...reste, ...(p.mot ? { pancarte: { mot: p.mot, le: new Date().toISOString() } } : {}), ...(o.preparer !== false ? { pret: jour } : {}) };
  });
  return { ok: true, pancarte: p.mot };
}

/** ✓ « C'est moi aujourd'hui » : son double est prêt (la pastille s'en va jusqu'à demain). */
export const marquerPret = (supabase: Supabase, h: string) => modifier(supabase, h, (x) => ({ ...x, pret: jourParis() }));
