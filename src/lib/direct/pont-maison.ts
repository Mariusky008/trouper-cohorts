/**
 * 🌉 LE PONT ENTRE CLIKME.FR ET LE DOMAINE D'UN COMMERÇANT — pour ne pas
 * refaire son dressing. FICHIER SERVEUR : le secret ne quitte jamais le serveur.
 *
 * ═══ POURQUOI IL FAUT UN PONT ════════════════════════════════════════════
 *
 * Sur `boutique-lafitte.fr`, le navigateur ne montre pas le cookie posé sur
 * `clikme.fr` : chaque domaine a les siens, et c'est voulu (sinon n'importe
 * quel site lirait ceux des autres). Sans pont, la même personne a deux
 * Maisons, et refait son dressing.
 *
 * ═══ COMMENT IL MARCHE — UN APPUI, ET SON ACCORD ═════════════════════════
 *
 *   1. Sur le domaine du magasin, « Retrouver mon dressing ClikMe » ouvre
 *      `clikme.fr/maison/relier?retour=…` : une page de clikme.fr, que son
 *      cookie accompagne. Elle dit à quel magasin on relie, et attend l'appui.
 *   2. L'appui (un formulaire, donc un POST que le cookie `lax` n'accompagne
 *      que depuis clikme.fr lui-même) fabrique un jeton signé : CET habitant,
 *      CE domaine, deux minutes, et un numéro à usage unique.
 *   3. Retour sur le domaine du magasin, `…/api/direct/ma-maison/pont/arrivee`
 *      vérifie le jeton (signature, domaine, durée), le consomme, et pose le
 *      cookie de l'habitant sur ce domaine-là. Ce qui y avait déjà été rangé
 *      rejoint sa Maison (`fusionner`), comme quand on donne son code e-mail.
 *
 * ═══ CE QUI EST VÉRIFIÉ ══════════════════════════════════════════════════
 *
 *   · Le domaine de retour est celui d'un commerçant de ClikMe, publié
 *     (`custom_domain`, `visible_public`) — jamais une adresse quelconque.
 *   · Le jeton ne vaut que pour ce domaine, deux minutes, une fois. Le numéro
 *     unique vit dans `human_habitant_codes` (ligne « pont:… »), la table des
 *     codes à six chiffres : pas de migration de plus.
 *   · Rien ne se fait en ouvrant une page : il faut l'appui de la personne,
 *     sur clikme.fr.
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { createAdminClient } from "@/lib/supabase/admin";
import { estNotreHote } from "@/lib/site-url";

type Supabase = ReturnType<typeof createAdminClient>;

export type JetonPont = { h: string; d: string; n: string; t: number };

const DUREE_MS = 2 * 60_000;
const secret = () => String(process.env.SALONS_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const signer = (corps: string, k: string) => createHmac("sha256", k).update(`pont|${corps}`).digest("base64url").slice(0, 32);
const empreinte = (n: string) => createHash("sha256").update(`pont|${n}`).digest("hex");
const UUID = /^[0-9a-f-]{36}$/i;

/** L'hôte d'une adresse, en minuscules, sans `www.` ni port. */
export function hoteDe(adresse: string): string {
  try {
    return new URL(adresse).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Le domaine propre d'un commerçant publié, ou `null`. Les nôtres n'en ont pas besoin. */
export async function magasinDuDomaine(supabase: Supabase, hote: string): Promise<{ slug: string; nom: string } | null> {
  const h = hote.toLowerCase().replace(/^www\./, "");
  if (!h || estNotreHote(h) || !/^[a-z0-9.-]{3,253}$/.test(h)) return null;
  try {
    const { data } = await supabase
      .from("human_vitrine_sites")
      .select("slug, business_name")
      .eq("custom_domain", h)
      .eq("visible_public", true)
      .eq("channel", "letter")
      .maybeSingle();
    const r = data as { slug?: string; business_name?: string } | null;
    return r?.slug ? { slug: String(r.slug), nom: String(r.business_name ?? "") } : null;
  } catch {
    return null;
  }
}

/** Le jeton du pont, et son numéro unique rangé. Vide si le serveur ne peut ni signer ni ranger. */
export async function ouvrirPont(supabase: Supabase, habitant: string, hote: string): Promise<string> {
  const k = secret();
  if (!k || !UUID.test(habitant)) return "";
  const n = randomBytes(16).toString("base64url");
  const t = Date.now();
  const { error } = await supabase.from("human_habitant_codes").insert({
    email: `pont:${n}`,
    ville_slug: "",
    empreinte: empreinte(n),
    expire_le: new Date(t + DUREE_MS).toISOString(),
  });
  if (error) return "";
  const corps = Buffer.from(JSON.stringify({ h: habitant, d: hote, n, t } satisfies JetonPont)).toString("base64url");
  return `${corps}.${signer(corps, k)}`;
}

/** Le jeton relu, pour CE domaine, encore valable, et consommé. `null` sinon. */
export async function passerLePont(supabase: Supabase, jeton: string, hote: string): Promise<JetonPont | null> {
  const k = secret();
  const [corps, sig] = String(jeton || "").split(".");
  if (!k || !corps || !sig || corps.length > 600) return null;
  const attendu = signer(corps, k);
  if (attendu.length !== sig.length || !timingSafeEqual(Buffer.from(attendu), Buffer.from(sig))) return null;
  let j: JetonPont;
  try {
    j = JSON.parse(Buffer.from(corps, "base64url").toString("utf8")) as JetonPont;
  } catch {
    return null;
  }
  if (!j || !UUID.test(String(j.h)) || typeof j.n !== "string" || !Number.isFinite(j.t)) return null;
  if (j.d !== hote.toLowerCase().replace(/^www\./, "") || Date.now() - j.t > DUREE_MS) return null;
  // UNE SEULE FOIS : le numéro est consommé avant de poser quoi que ce soit.
  try {
    const { data } = await supabase
      .from("human_habitant_codes")
      .select("id, empreinte, utilise_le, expire_le")
      .eq("email", `pont:${j.n}`)
      .limit(1);
    const r = (Array.isArray(data) ? data[0] : null) as { id?: number; empreinte?: string; utilise_le?: string | null; expire_le?: string } | null;
    if (!r || r.utilise_le || r.empreinte !== empreinte(j.n) || Date.parse(String(r.expire_le)) < Date.now()) return null;
    const { error } = await supabase.from("human_habitant_codes").update({ utilise_le: new Date().toISOString() }).eq("id", r.id).is("utilise_le", null);
    return error ? null : j;
  } catch {
    return null;
  }
}

/** Un chemin de retour sur le même domaine — jamais une autre adresse. */
export function cheminDeRetour(v: unknown): string {
  const c = String(v ?? "").trim();
  return /^\/(?!\/)[^\s\\]{0,300}$/.test(c) ? c : "/";
}
