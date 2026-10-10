// 🏠 MA MAISON, CÔTÉ SERVEUR — lire, écrire, effacer la maison de L'HABITANT
// DU COOKIE, et rien d'autre. Aucune fonction ici ne prend un identifiant venu
// du navigateur : la maison qu'on touche est toujours celle de l'appareil qui
// demande (voir `lib/direct/habitant.ts`).
//
// Le code à six chiffres vit ici aussi : c'est la seule porte vers une maison
// depuis un autre téléphone. L'adresse e-mail seule n'ouvre rien.
import { createHash, randomInt, timingSafeEqual } from "crypto";
import { fusionnerMemoires, lireMemoire, MEMOIRE_VIDE, type Memoire } from "@/lib/direct/maison";

type Supabase = { from: (t: string) => any; storage: any }; // eslint-disable-line @typescript-eslint/no-explicit-any

export const SEAU_MAISON = process.env.MAISON_BUCKET?.trim() || "maison-privee";
/** Au-delà, on refuse : une mémoire pèse quelques kilo-octets, pas un roman. */
export const MEMOIRE_OCTETS_MAX = 96_000;

const str = (v: unknown) => (v == null ? "" : String(v));

/** La mémoire de cet habitant, ou une mémoire vide. Une table absente ne casse rien. */
export async function lireMaison(supabase: Supabase, habitant: string): Promise<{ memoire: Memoire; ok: boolean }> {
  try {
    const { data, error } = await supabase.from("human_maisons_privees").select("memoire").eq("habitant", habitant).maybeSingle();
    if (error) return { memoire: MEMOIRE_VIDE, ok: false };
    return { memoire: lireMemoire((data as Record<string, unknown> | null)?.memoire), ok: true };
  } catch {
    return { memoire: MEMOIRE_VIDE, ok: false };
  }
}

/**
 * ÉCRIRE EN FUSIONNANT : deux téléphones de la même personne ne s'écrasent pas.
 * Ce qui arrive est fusionné avec ce qui est déjà là (`fusionnerMemoires`), et
 * c'est le résultat qui repart vers le téléphone.
 */
export async function ecrireMaison(supabase: Supabase, habitant: string, arrivee: Memoire): Promise<Memoire | null> {
  const { memoire: deja, ok } = await lireMaison(supabase, habitant);
  if (!ok) return null;
  const m = fusionnerMemoires(deja, arrivee);
  try {
    const maj_le = new Date().toISOString();
    const { data: ex } = await supabase.from("human_maisons_privees").select("habitant").eq("habitant", habitant).maybeSingle();
    const { error } = ex
      ? await supabase.from("human_maisons_privees").update({ memoire: m, maj_le }).eq("habitant", habitant)
      : await supabase.from("human_maisons_privees").insert({ habitant, memoire: m, maj_le });
    return error ? null : m;
  } catch {
    return null;
  }
}

/**
 * TOUT EFFACER : la mémoire, ce qui a été déposé, et les photos du seau privé.
 * Les photos d'abord : une ligne sans photo ne fuit rien, une photo sans ligne
 * ne serait plus retrouvée pour être effacée.
 */
export async function effacerMaison(supabase: Supabase, habitant: string): Promise<boolean> {
  try {
    const { data } = await supabase.from("human_maison_elements").select("photo").eq("habitant", habitant);
    const chemins = ((Array.isArray(data) ? data : []) as Record<string, unknown>[]).map((r) => str(r.photo)).filter(Boolean);
    if (chemins.length) await supabase.storage.from(SEAU_MAISON).remove(chemins);
    await supabase.from("human_maison_elements").delete().eq("habitant", habitant);
    await supabase.from("human_maisons_privees").delete().eq("habitant", habitant);
    return true;
  } catch {
    return false;
  }
}

/**
 * QUAND UN TÉLÉPHONE REJOINT UNE MAISON EXISTANTE (le code a été donné) : la
 * mémoire de l'appareil s'ajoute à celle de la maison, ses dépôts la
 * rejoignent. Appelée par `fusionner` (habitant.ts), avant que la ligne de
 * l'appareil disparaisse.
 */
export async function rejoindreMaison(supabase: Supabase, source: string, cible: string): Promise<void> {
  if (!source || !cible || source === cible) return;
  const a = await lireMaison(supabase, source);
  if (a.ok && (a.memoire.signaux.length || Object.keys(a.memoire.choix).length || Object.keys(a.memoire.pauses).length)) {
    await ecrireMaison(supabase, cible, a.memoire);
  }
  try {
    await supabase.from("human_maison_elements").update({ habitant: cible }).eq("habitant", source);
  } catch {
    /* les dépôts restent sur l'ancienne ligne : rien n'est perdu, rien ne fuit */
  }
}

// ─── LE CODE À SIX CHIFFRES ────────────────────────────────────────────────

export const CODE_VIE_MS = 10 * 60_000;
export const CODE_ESSAIS_MAX = 5;
/** Pas plus de trois codes par adresse en quinze minutes. */
export const CODES_PAR_QUART = 3;

export const normaliserEmail = (e: unknown) => str(e).trim().toLowerCase().slice(0, 180);
export const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * L'EMPREINTE D'UN CODE. Liée à l'adresse : le même code pour deux adresses ne
 * donne pas la même empreinte. Le sel est la clé du serveur (ou celui qu'on
 * lui donne) : une base copiée ne suffit pas à retrouver les codes.
 */
function empreinte(email: string, code: string): string {
  const sel = process.env.MAISON_CODE_SEL || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createHash("sha256").update(`${email}|${code}|${sel}`).digest("hex");
}

/** Un nouveau code pour cette adresse, ou la raison pour laquelle on n'en donne pas. */
export async function nouveauCode(
  supabase: Supabase,
  email: string,
  villeSlug: string,
): Promise<{ code: string } | { erreur: "trop" | "base" }> {
  try {
    const depuis = new Date(Date.now() - 15 * 60_000).toISOString();
    const { data: recents } = await supabase.from("human_habitant_codes").select("id").eq("email", email).gte("cree_le", depuis);
    if (Array.isArray(recents) && recents.length >= CODES_PAR_QUART) return { erreur: "trop" };
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const { error } = await supabase.from("human_habitant_codes").insert({
      email,
      ville_slug: villeSlug,
      empreinte: empreinte(email, code),
      essais: 0,
      expire_le: new Date(Date.now() + CODE_VIE_MS).toISOString(),
      cree_le: new Date().toISOString(),
    });
    return error ? { erreur: "base" } : { code };
  } catch {
    return { erreur: "base" };
  }
}

/**
 * LE CODE DONNÉ EST-IL LE BON ? Seul le dernier code encore valide compte ;
 * cinq essais ratés et il ne vaut plus rien. Un code juste ne sert qu'une fois.
 */
export async function verifierCode(supabase: Supabase, email: string, code: string): Promise<"ok" | "faux" | "expire" | "trop" | "base"> {
  try {
    const { data } = await supabase
      .from("human_habitant_codes")
      .select("id, empreinte, essais, expire_le, utilise_le")
      .eq("email", email)
      .is("utilise_le", null)
      .order("cree_le", { ascending: false })
      .limit(1);
    const r = (Array.isArray(data) ? data[0] : null) as Record<string, unknown> | null;
    if (!r) return "expire";
    if (new Date(str(r.expire_le)).getTime() < Date.now()) return "expire";
    const essais = Number(r.essais) || 0;
    if (essais >= CODE_ESSAIS_MAX) return "trop";
    const attendu = Buffer.from(str(r.empreinte), "hex");
    const donne = Buffer.from(empreinte(email, code.replace(/\D/g, "").slice(0, 6)), "hex");
    const juste = attendu.length === donne.length && attendu.length > 0 && timingSafeEqual(attendu, donne);
    if (!juste) {
      await supabase.from("human_habitant_codes").update({ essais: essais + 1 }).eq("id", r.id);
      return essais + 1 >= CODE_ESSAIS_MAX ? "trop" : "faux";
    }
    await supabase.from("human_habitant_codes").update({ utilise_le: new Date().toISOString() }).eq("id", r.id);
    return "ok";
  } catch {
    return "base";
  }
}
