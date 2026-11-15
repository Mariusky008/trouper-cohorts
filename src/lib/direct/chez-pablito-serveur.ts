/**
 * 🏡 CHEZ PABLITO — l'univers de Pablito, celui de la bienvenue (le propriétaire, le 15 novembre 2026 : « OUI » à « ton
 * univers deviendrait celui de Pablito, montré à tous les nouveaux venus »).
 *
 * Pablito, c'est la figurine du propriétaire (`guide.ts`, `pablito-univers-serveur.ts`) ; son univers, c'est donc le
 * sien. Il l'adopte d'un toucher depuis l'admin (`/admin/humain/univers-essais`, « 🏡 L'univers de Pablito ») : on retient
 * de qui il est (`demo-proprio/univers/chez/adopte.json`), rien n'est copié. Ce que la bienvenue montre suit donc son
 * univers tel qu'il est : son décor du moment (celui du mois, s'il est fait), sa figurine assise à sa place (sa tenue du
 * mois, si elle est méritée), ses clés posées sur le décor, la saison. « Retirer » l'oublie : la bienvenue se passe
 * alors de lui (elle garde son ancienne scène).
 *
 * Ce qui sort d'ici est vu par tout le monde (la bienvenue n'a pas de compte) : jamais ses retouches, sa proposition,
 * ses visites ni ses souvenirs ; ses clés seulement (ce qui est sur le décor, et pourquoi), comme il l'a accepté.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import type { UniversDePablito } from "./bienvenue";
import { BOUCLES, ESPECES, type Boucle } from "./compagnons";
import { depotDans, ecrireJson, lireJson, signer } from "./ma-figurine-serveur";
import { etatUnivers } from "./univers-creation-serveur";

export type { UniversDePablito };

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

const CHEMIN = "demo-proprio/univers/chez/adopte.json";
type Adoption = { habitant?: string; le?: string };
const habitantValide = (x: unknown) => (/^[a-zA-Z0-9-]{8,64}$/.test(s(x)) ? s(x) : "");

/** Les clés que la bienvenue montre : celles posées sur le décor, six au plus. */
export const CLES_MONTREES_MAX = 6;

/** D'après son état (`etatUnivers`) : ce que tout le monde peut voir ; `null` sans décor. */
export function vuePublique(e: Awaited<ReturnType<typeof etatUnivers>>): UniversDePablito | null {
  if (!e.decor || e.etape !== "decouverte") return null;
  const hote = e.scene?.places.find((p) => p.id === "hote");
  return {
    decor: e.decor,
    ...(e.figurine ? { figurine: e.figurine } : {}),
    ...(e.scene?.figurine ? { place: e.scene.figurine } : {}),
    ...(hote ? { hote } : {}),
    cles: e.cles.filter((c) => c.zone && s(c.quoi) && s(c.pourquoi)).slice(0, CLES_MONTREES_MAX),
    ...(e.saison ? { saison: { nom: e.saison.nom, emoji: e.saison.emoji } } : {}),
    ...(e.decorVivant ? { decorVivant: e.decorVivant } : {}),
    ...(e.version ? { version: e.version } : {}),
  };
}

/**
 * 🐾 SON CHAT (le 15 novembre 2026, « oui, les boucles sont déjà validées ») : les boucles faites du chat, dans le
 * catalogue des compagnons (`compagnon-essai-serveur.ts` : `compagnons/chat/<boucle>/video.mp4`), signées ; son nom, celui
 * du chat par défaut. `null` si aucune boucle n'est faite. `CLIKME_CHAT_BIENVENUE=0` : le frein (la bienvenue sans lui).
 */
export async function compagnonDePablito(supabase: Supabase): Promise<NonNullable<UniversDePablito["compagnon"]> | null> {
  if (s(process.env.CLIKME_CHAT_BIENVENUE) === "0") return null;
  const espece = "chat" as const;
  const faites = await Promise.all(
    BOUCLES.map(async (b) => {
      const noms = await depotDans(supabase, `compagnons/${espece}/${b.cle}`).lister().catch(() => [] as string[]);
      if (!noms.includes("video.mp4")) return null;
      const url = await signer(supabase, `compagnons/${espece}/${b.cle}/video.mp4`).catch(() => "");
      return url ? ([b.cle, url] as [Boucle, string]) : null;
    }),
  );
  const boucles = Object.fromEntries(faites.filter((x): x is [Boucle, string] => Boolean(x))) as Partial<Record<Boucle, string>>;
  if (!Object.keys(boucles).length) return null;
  return { espece, nom: ESPECES.find((e) => e.cle === espece)?.nomParDefaut ?? "Moustache", boucles };
}

/** De qui est l'univers de Pablito (adopté depuis l'admin) ; « » s'il n'y en a pas. */
export async function habitantDePablito(supabase: Supabase): Promise<string> {
  const a = await lireJson<Adoption>(supabase, CHEMIN).catch(() => ({}) as Partial<Adoption>);
  return habitantValide(a.habitant);
}

// (lu par chaque nouveau venu : gardé dix minutes ; les adresses signées valent une heure)
let memo: { le: number; h: string; vue: UniversDePablito | null } | null = null;
const DUREE_MEMO = 10 * 60_000;

/** 🏡 L'univers de Pablito, pour la bienvenue ; `null` s'il n'est pas adopté (ou plus créé). */
export async function universDePablito(supabase: Supabase): Promise<UniversDePablito | null> {
  const h = await habitantDePablito(supabase);
  if (!h) return null;
  if (memo && memo.h === h && Date.now() - memo.le < DUREE_MEMO) return memo.vue;
  const [etat, compagnon] = await Promise.all([etatUnivers(supabase, h), compagnonDePablito(supabase).catch(() => null)]);
  const brute = vuePublique(etat);
  const vue = brute && compagnon ? { ...brute, compagnon } : brute;
  memo = { le: Date.now(), h, vue };
  return vue;
}

/** « Adopter mon univers comme celui de Pablito » : il faut un univers créé (un décor). */
export async function adopterSonUnivers(supabase: Supabase, h: string): Promise<{ error?: string }> {
  const id = habitantValide(h);
  if (!id) return { error: "Ce téléphone n’a pas de figurine : ouvre d’abord /univers/figurine." };
  const vue = vuePublique(await etatUnivers(supabase, id));
  if (!vue) return { error: "Ton univers n’est pas encore créé : ouvre d’abord /univers/monde." };
  await ecrireJson(supabase, CHEMIN, { habitant: id, le: new Date().toISOString() });
  memo = null;
  return {};
}

/** « Retirer » : la bienvenue se passe de son univers. */
export async function retirerSonUnivers(supabase: Supabase): Promise<void> {
  await ecrireJson(supabase, CHEMIN, {});
  memo = null;
}

/** Pour l'admin : adopté ou non, quand, et ce que la bienvenue montrera. */
export async function etatChezPablito(supabase: Supabase): Promise<{ adopte: boolean; le?: string; univers: UniversDePablito | null }> {
  const a = await lireJson<Adoption>(supabase, CHEMIN).catch(() => ({}) as Partial<Adoption>);
  const h = habitantValide(a.habitant);
  if (!h) return { adopte: false, univers: null };
  memo = null;
  return { adopte: true, ...(s(a.le) ? { le: s(a.le) } : {}), univers: await universDePablito(supabase) };
}
