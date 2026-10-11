/**
 * 🧥 « METTEZ-LA-MOI DE CÔTÉ » — la demande partie d'un look, et la réponse du
 * magasin. FICHIER SERVEUR : le secret ne quitte jamais le serveur.
 *
 * ═══ LA RÈGLE, DÉJÀ ÉCRITE POUR LES DUELS ═════════════════════════════════
 *
 * « Ne jamais afficher "réservé" si le commerçant ne l'a pas réellement
 * confirmé. » La demande part sur SON WhatsApp, depuis celui du client, avec
 * un lien signé ; c'est en appuyant sur la page de ce lien qu'il répond. Avant
 * ça, l'écran dit « demande envoyée », jamais « mis de côté ». Voir
 * `reponse-commerce.ts`, dont ce fichier reprend la mécanique.
 *
 * ═══ OÙ ELLE VIT ══════════════════════════════════════════════════════════
 *
 * Dans la Maison du client, à côté de son dressing : une ligne de
 * `human_maison_elements` (pièce « dressing », sorte « mise-de-cote »). Elle
 * part avec « tout effacer » et suit la Maison quand un téléphone la rejoint,
 * sans table ni migration de plus. Les vêtements, eux, se lisent par leur
 * sorte (`SORTES_VETEMENT`) : une demande n'est jamais prise pour une chemise.
 *
 * ═══ LE LIEN EST PRÉPARÉ AVANT L'APPUI, ET NE CRÉE RIEN ═══════════════════
 *
 * WhatsApp doit s'ouvrir dans le geste même — un téléphone bloque une fenêtre
 * ouverte après une attente réseau. Le lien est donc fabriqué dès l'écran des
 * détails ; il porte tout ce qu'il faut (la demande est dans le jeton), si
 * bien qu'en préparer un ne range rien. La ligne naît quand le client envoie
 * (« envoyée »), ou au plus tard quand le magasin répond.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { createAdminClient } from "@/lib/supabase/admin";

type Supabase = ReturnType<typeof createAdminClient>;

export type JetonCote = {
  /** La demande (aléatoire), pour retrouver sa ligne. */
  r: string;
  /** L'habitant qui demande. */
  h: string;
  /** La pièce, et son prix. */
  o: string;
  p?: string;
  /** Sa photo, quand elle a une adresse (jamais une image en data:). */
  ph?: string;
  /** Le prénom du client, quand il en a donné un. */
  q?: string;
  /** Le magasin, tel qu'il s'affiche, et sa carte. */
  m?: string;
  cm?: string;
  /** Sa page (chemin relatif), pour « Voir les infos du magasin ». */
  pg?: string;
  /** Quand le lien a été fait (ms). */
  t: number;
};

export type EtatCote = "envoyee" | "confirmee" | "refusee";

export type DemandeCote = {
  r: string;
  quoi: string;
  prix?: string;
  photo?: string;
  magasin?: string;
  carte?: string;
  /** La page du magasin, ouverte sur ses infos. */
  page?: string;
  etat: EtatCote;
  envoyeeLe?: string;
  reponduLe?: string;
  /** Le client a vu la réponse. */
  vue: boolean;
};

export const SORTE_COTE = "mise-de-cote";
/** Sept jours : au-delà, une mise de côté ne veut plus rien dire. */
const DUREE_MS = 7 * 24 * 3600_000;
/** Il peut se raviser, pas réécrire indéfiniment. */
export const REPONSES_MAX = 6;

const s = (v: unknown, n = 120) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const secret = () => String(process.env.SALONS_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const signer = (corps: string, k: string) => createHmac("sha256", k).update(`cote|${corps}`).digest("base64url").slice(0, 32);
const UUID = /^[0-9a-f-]{36}$/i;

export const nouvelleDemande = () => randomBytes(9).toString("base64url");

/** Une adresse de photo qu'on peut remettre dans un lien : publique, courte. */
export function photoDeLien(v: unknown): string | undefined {
  const u = s(v, 400);
  return /^(https:\/\/|\/(?!\/))[^\s"'<>]+$/.test(u) ? u : undefined;
}

/** La page d'un magasin de ClikMe, et rien d'autre : un lien qu'on rouvrira chez le client. */
export function pageDeMagasin(v: unknown): string | undefined {
  const u = s(v, 200);
  return /^\/(site-internet\/apercu\/[A-Za-z0-9._~%-]+|autour-de-moi\/boutique\?c=[A-Za-z0-9._~%-]+)$/.test(u) ? u : undefined;
}

/** Le jeton du lien ; vide quand le serveur n'a pas de quoi signer. */
export function signerCote(j: JetonCote): string {
  const k = secret();
  if (!k) return "";
  const corps = Buffer.from(JSON.stringify(j)).toString("base64url");
  return `${corps}.${signer(corps, k)}`;
}

/** Le jeton relu, s'il est intact et encore valable. */
export function lireJetonCote(jeton: string): JetonCote | null {
  const k = secret();
  const [corps, sig] = String(jeton || "").split(".");
  if (!k || !corps || !sig || corps.length > 1600) return null;
  const attendu = signer(corps, k);
  if (attendu.length !== sig.length || !timingSafeEqual(Buffer.from(attendu), Buffer.from(sig))) return null;
  try {
    const j = JSON.parse(Buffer.from(corps, "base64url").toString("utf8")) as JetonCote;
    if (!j || typeof j.r !== "string" || !UUID.test(String(j.h)) || typeof j.o !== "string") return null;
    if (!Number.isFinite(j.t) || Date.now() - j.t > DUREE_MS) return null;
    return j;
  } catch {
    return null;
  }
}

type Ligne = { id: string; donnees: Record<string, unknown> | null };

function enDemande(d: Record<string, unknown>): DemandeCote | null {
  const r = s(d.r, 40);
  const quoi = s(d.o);
  if (!r || !quoi) return null;
  const etat: EtatCote = d.etat === "confirmee" ? "confirmee" : d.etat === "refusee" ? "refusee" : "envoyee";
  return {
    r,
    quoi,
    ...(s(d.p, 30) ? { prix: s(d.p, 30) } : {}),
    ...(photoDeLien(d.ph) ? { photo: photoDeLien(d.ph) } : {}),
    ...(s(d.m, 80) ? { magasin: s(d.m, 80) } : {}),
    ...(s(d.cm, 80) ? { carte: s(d.cm, 80) } : {}),
    ...(pageDeMagasin(d.pg) ? { page: pageDeMagasin(d.pg) } : {}),
    etat,
    ...(s(d.envoyeeLe, 40) ? { envoyeeLe: s(d.envoyeeLe, 40) } : {}),
    ...(s(d.reponduLe, 40) ? { reponduLe: s(d.reponduLe, 40) } : {}),
    vue: d.vue === true,
  };
}

async function ligneDe(supabase: Supabase, habitant: string, r: string): Promise<Ligne | null> {
  const { data } = await supabase.from("human_maison_elements").select("id, donnees").eq("habitant", habitant).eq("piece", "dressing").eq("sorte", SORTE_COTE).limit(60);
  return ((data ?? []) as Ligne[]).find((x) => s(x.donnees?.r, 40) === r) ?? null;
}

const contenuDe = (j: JetonCote) => ({
  r: j.r,
  o: s(j.o),
  ...(j.p ? { p: s(j.p, 30) } : {}),
  ...(photoDeLien(j.ph) ? { ph: photoDeLien(j.ph) } : {}),
  ...(j.m ? { m: s(j.m, 80) } : {}),
  ...(j.cm ? { cm: s(j.cm, 80) } : {}),
  ...(pageDeMagasin(j.pg) ? { pg: pageDeMagasin(j.pg) } : {}),
});

/** Le client vient d'envoyer : la demande entre dans sa Maison (une seule fois). */
export async function noterEnvoi(supabase: Supabase, j: JetonCote): Promise<boolean> {
  try {
    if (await ligneDe(supabase, j.h, j.r)) return true;
    const maintenant = new Date().toISOString();
    const { error } = await supabase.from("human_maison_elements").insert({
      habitant: j.h,
      piece: "dressing",
      sorte: SORTE_COTE,
      donnees: { ...contenuDe(j), etat: "envoyee", envoyeeLe: maintenant, reponses: 0, vue: false },
      cree_le: maintenant,
      maj_le: maintenant,
    });
    return !error;
  } catch {
    return false;
  }
}

/** Le magasin répond. Rend l'état écrit, ou la raison du refus. */
export async function noterReponse(supabase: Supabase, j: JetonCote, etat: "confirmee" | "refusee"): Promise<{ ok: true } | { erreur: string; statut: number }> {
  try {
    const { data: h } = await supabase.from("human_habitants").select("id").eq("id", j.h).maybeSingle();
    if (!h) return { erreur: "Ce client n'existe plus.", statut: 404 };
    const maintenant = new Date().toISOString();
    const deja = await ligneDe(supabase, j.h, j.r);
    if (deja) {
      const d = deja.donnees ?? {};
      const reponses = Number(d.reponses) || 0;
      if (reponses >= REPONSES_MAX) return { erreur: "Déjà répondu.", statut: 429 };
      const { error } = await supabase
        .from("human_maison_elements")
        .update({ donnees: { ...d, etat, reponduLe: maintenant, reponses: reponses + 1, vue: false }, maj_le: maintenant })
        .eq("id", deja.id)
        .eq("habitant", j.h);
      return error ? { erreur: "Enregistrement impossible.", statut: 500 } : { ok: true };
    }
    const { error } = await supabase.from("human_maison_elements").insert({
      habitant: j.h,
      piece: "dressing",
      sorte: SORTE_COTE,
      donnees: { ...contenuDe(j), etat, reponduLe: maintenant, reponses: 1, vue: false },
      cree_le: maintenant,
      maj_le: maintenant,
    });
    return error ? { erreur: "Enregistrement impossible.", statut: 500 } : { ok: true };
  } catch {
    return { erreur: "Indisponible.", statut: 503 };
  }
}

/** La réponse déjà donnée, pour la page du magasin. */
export async function etatDeLaDemande(supabase: Supabase, j: JetonCote): Promise<EtatCote | undefined> {
  try {
    const l = await ligneDe(supabase, j.h, j.r);
    return l ? (enDemande(l.donnees ?? {})?.etat ?? undefined) : undefined;
  } catch {
    return undefined;
  }
}

/** Les demandes de cet habitant, la plus récente d'abord. */
export async function listerDemandes(supabase: Supabase, habitant: string): Promise<DemandeCote[] | null> {
  try {
    const { data, error } = await supabase
      .from("human_maison_elements")
      .select("id, donnees, maj_le")
      .eq("habitant", habitant)
      .eq("piece", "dressing")
      .eq("sorte", SORTE_COTE)
      .order("maj_le", { ascending: false })
      .limit(30);
    if (error) return null;
    return ((data ?? []) as Ligne[]).map((x) => enDemande(x.donnees ?? {})).filter((x): x is DemandeCote => Boolean(x));
  } catch {
    return null;
  }
}

/** Le client a vu la réponse : elle ne se rouvre plus d'elle-même. */
export async function marquerVue(supabase: Supabase, habitant: string, r: string): Promise<boolean> {
  try {
    const l = await ligneDe(supabase, habitant, r);
    if (!l) return false;
    const { error } = await supabase
      .from("human_maison_elements")
      .update({ donnees: { ...(l.donnees ?? {}), vue: true } })
      .eq("id", l.id)
      .eq("habitant", habitant);
    return !error;
  } catch {
    return false;
  }
}
