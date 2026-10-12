/**
 * 🤔 « ÇA ME VA ? » — l'essai envoyé aux amis, et leur vote d'un appui.
 * FICHIER SERVEUR : le secret ne quitte jamais le serveur.
 *
 * ═══ POURQUOI ═════════════════════════════════════════════════════════════
 *
 * Les duels et les salons font voter, mais seulement DANS l'application : un
 * ami sans ClikMe n'y entre pas, et la boutique ne gagne personne. Ici, le
 * lien s'ouvre sans application et sans compte ; l'ami vote, voit le nom de
 * la boutique et « Essayez cette pièce sur vous ». Chaque essai partagé fait
 * découvrir le commerçant à trois ou quatre personnes.
 *
 * ═══ OÙ ÇA VIT ════════════════════════════════════════════════════════════
 *
 * Dans la Maison de celui qui demande : une ligne de `human_maison_elements`
 * (pièce « dressing », sorte « avis-amis »), son image dans le seau privé de la
 * Maison. Elle part avec « tout effacer », sans table ni migration de plus.
 * L'image n'a aucune adresse publique : `/api/direct/avis-amis/image` la sert
 * à qui a le lien signé — l'ami, et l'aperçu de WhatsApp.
 *
 * ═══ LE LIEN EST PRÉPARÉ AVANT L'ENVOI ════════════════════════════════════
 *
 * Le lien porte l'identifiant de la ligne (choisi d'avance) : il est prêt
 * pendant que l'image monte, et WhatsApp s'ouvre dans le geste même. Une
 * maison qui en rejoint une autre change d'habitant, pas d'identifiant : le
 * lien continue de marcher.
 */
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import { SEAU_MAISON } from "@/lib/direct/maison-serveur";
import { pageDeMagasin } from "@/lib/direct/mise-de-cote";

type Supabase = ReturnType<typeof createAdminClient>;

export const SORTE_AVIS = "avis-amis";
/** Trente jours : au-delà, on ne vote plus pour une pièce essayée le mois dernier. */
const DUREE_MS = 30 * 24 * 3600_000;
/** Assez pour un groupe d'amis, pas pour un sondage public. */
const VOTES_MAX = 60;
/** Ses demandes d'avis gardées : au-delà, il en a assez demandé. */
const AVIS_MAX = 60;

export type ChoixVote = "oui" | "non";

/** Le lien, tel que l'ami l'ouvre. */
export type JetonAvis = {
  /** La ligne (son identifiant, choisi avant qu'elle existe). */
  e: string;
  /** Celui qui demande : lui seul peut y ranger l'essai. */
  h: string;
  /** Quand le lien a été fait (ms). */
  t: number;
};

/** Une demande d'avis, telle que celui qui l'a envoyée la voit. */
export type Avis = {
  e: string;
  quoi: string;
  prix?: string;
  magasin?: string;
  page?: string;
  oui: number;
  non: number;
  /** Les votes, du plus récent au plus ancien — le prénom quand l'ami l'a donné. */
  votes: { v: ChoixVote; q?: string; t: string }[];
  /** Combien il en a déjà vus. */
  vus: number;
  creeLe: string;
  /** Le lien (pour le renvoyer) et l'adresse de l'image. */
  lien: string;
  image: string;
};

/** Ce que l'ami voit : les chiffres, jamais les prénoms des autres. */
export type AvisPublic = {
  quoi: string;
  prix?: string;
  magasin?: string;
  page?: string;
  /** « cette pièce », « cette coupe »… */
  ceci?: string;
  prenom?: string;
  oui: number;
  non: number;
  /** Son propre vote, s'il a déjà voté depuis ce téléphone. */
  monVote?: ChoixVote;
};

const s = (v: unknown, n = 120) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const secret = () => String(process.env.SALONS_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const signer = (corps: string, k: string) => createHmac("sha256", k).update(`avis|${corps}`).digest("base64url").slice(0, 32);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** L'identifiant d'un téléphone qui vote : tiré au hasard chez lui, rien de plus. */
const votantValide = (v: unknown) => /^[A-Za-z0-9_-]{8,40}$/.test(String(v ?? "")) ? String(v) : "";

export const nouvelAvis = () => randomUUID();

export function signerAvis(j: JetonAvis): string {
  const k = secret();
  if (!k) return "";
  const corps = Buffer.from(JSON.stringify(j)).toString("base64url");
  return `${corps}.${signer(corps, k)}`;
}

export function lireJetonAvis(jeton: string): JetonAvis | null {
  const k = secret();
  const [corps, sig] = String(jeton || "").split(".");
  if (!k || !corps || !sig || corps.length > 400) return null;
  const attendu = signer(corps, k);
  if (attendu.length !== sig.length || !timingSafeEqual(Buffer.from(attendu), Buffer.from(sig))) return null;
  try {
    const j = JSON.parse(Buffer.from(corps, "base64url").toString("utf8")) as JetonAvis;
    if (!j || !UUID.test(String(j.e)) || !UUID.test(String(j.h))) return null;
    if (!Number.isFinite(j.t) || Date.now() - j.t > DUREE_MS) return null;
    return j;
  } catch {
    return null;
  }
}

type Ligne = { id: string; habitant: string; donnees: Record<string, unknown> | null; photo: string | null; cree_le: string };
type VoteRange = { v: ChoixVote; q?: string; a: string; t: string };

const votesDe = (d: Record<string, unknown> | null | undefined): VoteRange[] =>
  (Array.isArray(d?.votes) ? (d.votes as Record<string, unknown>[]) : [])
    .map((x) => ({ v: x?.v === "non" ? ("non" as const) : ("oui" as const), ...(s(x?.q, 30) ? { q: s(x?.q, 30) } : {}), a: s(x?.a, 40), t: s(x?.t, 40) }))
    .filter((x) => x.a && x.t);

async function ligne(supabase: Supabase, e: string): Promise<Ligne | null> {
  if (!UUID.test(e)) return null;
  const { data } = await supabase.from("human_maison_elements").select("id, habitant, donnees, photo, cree_le").eq("id", e).eq("sorte", SORTE_AVIS).maybeSingle();
  return (data as Ligne | null) ?? null;
}

/**
 * L'ESSAI ENTRE DANS SA MAISON : l'image dans le seau privé, la ligne ensuite.
 * Rejouer la même demande ne fait rien de plus (le lien a déjà son identifiant).
 */
export async function creerAvis(
  supabase: Supabase,
  j: JetonAvis,
  image: Buffer,
  d: { quoi: string; prix?: string; magasin?: string; carte?: string; page?: string; ceci?: string },
): Promise<"ok" | "plein" | "image" | "base"> {
  try {
    if (await ligne(supabase, j.e)) return "ok";
    const { data: deja } = await supabase.from("human_maison_elements").select("id").eq("habitant", j.h).eq("piece", "dressing").eq("sorte", SORTE_AVIS);
    if (Array.isArray(deja) && deja.length >= AVIS_MAX) return "plein";
    let jpeg: Buffer;
    try {
      jpeg = await sharp(image).rotate().resize(1080, 1350, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 84 }).toBuffer();
    } catch {
      return "image";
    }
    const chemin = `${j.h}/avis/${j.e}.jpg`;
    const { error: errPhoto } = await supabase.storage.from(SEAU_MAISON).upload(chemin, jpeg, { contentType: "image/jpeg", upsert: true });
    if (errPhoto) return "base";
    const maintenant = new Date().toISOString();
    const { error } = await supabase.from("human_maison_elements").insert({
      id: j.e,
      habitant: j.h,
      piece: "dressing",
      sorte: SORTE_AVIS,
      donnees: {
        o: s(d.quoi),
        ...(s(d.prix, 30) ? { p: s(d.prix, 30) } : {}),
        ...(s(d.magasin, 80) ? { m: s(d.magasin, 80) } : {}),
        ...(s(d.carte, 80) ? { cm: s(d.carte, 80) } : {}),
        ...(pageDeMagasin(d.page) ? { pg: pageDeMagasin(d.page) } : {}),
        // « cette coupe », « cette pose » : ce que l'ami pourra essayer à son tour.
        ...(/^(cette|ce|ces) [a-zàâçéèêëîïôûüœ' -]{2,30}$/i.test(s(d.ceci, 40)) ? { c: s(d.ceci, 40) } : {}),
        votes: [],
        vus: 0,
      },
      photo: chemin,
      cree_le: maintenant,
      maj_le: maintenant,
    });
    if (error) {
      // DEUX ENVOIS PRESQUE ENSEMBLE : le second trouve la ligne du premier.
      if (await ligne(supabase, j.e)) return "ok";
      await supabase.storage.from(SEAU_MAISON).remove([chemin]);
      return "base";
    }
    return "ok";
  } catch {
    return "base";
  }
}

const compte = (votes: VoteRange[]) => ({ oui: votes.filter((x) => x.v === "oui").length, non: votes.filter((x) => x.v === "non").length });

/** Ce que voit l'ami qui ouvre le lien. `null` : l'essai n'est pas (encore) là. */
export async function lireAvisPublic(supabase: Supabase, e: string, votant?: string): Promise<AvisPublic | null> {
  try {
    const l = await ligne(supabase, e);
    if (!l) return null;
    const d = l.donnees ?? {};
    const votes = votesDe(d);
    const { data: h } = await supabase.from("human_habitants").select("prenom").eq("id", l.habitant).maybeSingle();
    const prenom = s((h as Record<string, unknown> | null)?.prenom, 30);
    const moi = votantValide(votant);
    const mien = moi ? votes.find((x) => x.a === moi) : undefined;
    return {
      quoi: s(d.o),
      ...(s(d.p, 30) ? { prix: s(d.p, 30) } : {}),
      ...(s(d.m, 80) ? { magasin: s(d.m, 80) } : {}),
      ...(pageDeMagasin(d.pg) ? { page: pageDeMagasin(d.pg) } : {}),
      ...(s(d.c, 40) ? { ceci: s(d.c, 40) } : {}),
      ...(prenom ? { prenom } : {}),
      ...compte(votes),
      ...(mien ? { monVote: mien.v } : {}),
    };
  } catch {
    return null;
  }
}

/** L'ami vote. Un même téléphone peut changer d'avis, pas voter deux fois. */
export async function voter(
  supabase: Supabase,
  e: string,
  votant: unknown,
  v: unknown,
  prenom: unknown,
): Promise<{ oui: number; non: number } | { erreur: string; statut: number }> {
  const a = votantValide(votant);
  if (!a || (v !== "oui" && v !== "non")) return { erreur: "Vote incomplet.", statut: 400 };
  try {
    const l = await ligne(supabase, e);
    if (!l) return { erreur: "Cet essai n'est plus là.", statut: 404 };
    const d = l.donnees ?? {};
    const autres = votesDe(d).filter((x) => x.a !== a);
    if (autres.length >= VOTES_MAX) return { erreur: "Assez d'avis pour celui-ci.", statut: 429 };
    const q = s(prenom, 30);
    const votes = [{ v, ...(q ? { q } : {}), a, t: new Date().toISOString() } as VoteRange, ...autres];
    const { error } = await supabase
      .from("human_maison_elements")
      .update({ donnees: { ...d, votes }, maj_le: new Date().toISOString() })
      .eq("id", l.id)
      .eq("sorte", SORTE_AVIS);
    if (error) return { erreur: "Vote non enregistré.", statut: 500 };
    return compte(votes);
  } catch {
    return { erreur: "Vote non enregistré.", statut: 500 };
  }
}

/** Ses demandes d'avis, de la plus récente à la plus ancienne. `null` : la table n'est pas là. */
export async function listerAvis(supabase: Supabase, habitant: string, adresse: (jeton: string) => { lien: string; image: string }): Promise<Avis[] | null> {
  try {
    const { data, error } = await supabase
      .from("human_maison_elements")
      .select("id, habitant, donnees, photo, cree_le")
      .eq("habitant", habitant)
      .eq("piece", "dressing")
      .eq("sorte", SORTE_AVIS)
      .order("cree_le", { ascending: false })
      .limit(20);
    if (error) return null;
    const out: Avis[] = [];
    for (const l of (Array.isArray(data) ? data : []) as Ligne[]) {
      const d = l.donnees ?? {};
      const votes = votesDe(d);
      const jeton = signerAvis({ e: l.id, h: habitant, t: Date.parse(l.cree_le) || Date.now() });
      if (!jeton) continue;
      out.push({
        e: l.id,
        quoi: s(d.o),
        ...(s(d.p, 30) ? { prix: s(d.p, 30) } : {}),
        ...(s(d.m, 80) ? { magasin: s(d.m, 80) } : {}),
        ...(pageDeMagasin(d.pg) ? { page: pageDeMagasin(d.pg) } : {}),
        ...compte(votes),
        votes: votes.map(({ v, q, t }) => ({ v, ...(q ? { q } : {}), t })),
        vus: Math.max(0, Number(d.vus) || 0),
        creeLe: l.cree_le,
        ...adresse(jeton),
      });
    }
    return out;
  } catch {
    return null;
  }
}

/** Il a vu les avis arrivés : ils ne rouvriront plus la fenêtre. */
export async function marquerAvisVus(supabase: Supabase, habitant: string, e: string): Promise<boolean> {
  try {
    const l = await ligne(supabase, e);
    if (!l || l.habitant !== habitant) return false;
    const d = l.donnees ?? {};
    const { error } = await supabase
      .from("human_maison_elements")
      .update({ donnees: { ...d, vus: votesDe(d).length } })
      .eq("id", l.id)
      .eq("sorte", SORTE_AVIS);
    return !error;
  } catch {
    return false;
  }
}

/** L'image de l'essai, pour qui a le lien. */
export async function imageAvis(supabase: Supabase, e: string): Promise<Buffer | null> {
  try {
    const l = await ligne(supabase, e);
    const chemin = s(l?.photo, 300);
    if (!chemin) return null;
    const { data: blob, error } = await supabase.storage.from(SEAU_MAISON).download(chemin);
    if (error || !blob) return null;
    return Buffer.from(await (blob as Blob).arrayBuffer());
  } catch {
    return null;
  }
}
