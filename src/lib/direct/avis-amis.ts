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
import { compterParAdresse } from "@/lib/site-internet/compteurs-jour";

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
  /** Celui qui demande : lui seul peut y ranger l'essai. Vide pour un lien court (il ne range rien). */
  h: string;
  /** Quand le lien a été fait (ms). 0 pour un lien court : c'est l'âge de la ligne qui compte. */
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

/**
 * 🔗 LE LIEN COURT, CELUI QUI PART CHEZ LES AMIS — 48 signes au lieu de 150.
 *
 * « Le lien est très long » : le jeton complet porte l'identifiant, celui qui
 * demande et l'heure, en JSON. L'ami n'a besoin que de la ligne : son
 * identifiant (32 signes hexadécimaux) et une signature de 16 signes. La durée
 * de vie se lit sur la ligne elle-même (`ligne`). Le jeton complet reste celui
 * qui sert à ranger l'essai, et les liens déjà envoyés continuent de marcher.
 */
const COURT = /^([0-9a-f]{32})([A-Za-z0-9_-]{16})$/;
const signerCourt = (e: string, k: string) => createHmac("sha256", k).update(`avis-court|${e}`).digest("base64url").slice(0, 16);
export function lienCourtAvis(e: string): string {
  const k = secret();
  if (!k || !UUID.test(e)) return "";
  return `${e.replace(/-/g, "").toLowerCase()}${signerCourt(e.toLowerCase(), k)}`;
}

export function lireJetonAvis(jeton: string): JetonAvis | null {
  const k = secret();
  const court = COURT.exec(String(jeton || ""));
  if (court) {
    if (!k) return null;
    const x = court[1];
    const e = `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
    const attendu = signerCourt(e, k);
    return timingSafeEqual(Buffer.from(attendu), Buffer.from(court[2])) ? { e, h: "", t: 0 } : null;
  }
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
  const l = (data as Ligne | null) ?? null;
  // TRENTE JOURS, LUS SUR LA LIGNE : un lien court ne porte pas son heure.
  if (l && Date.now() - (Date.parse(l.cree_le) || Date.now()) > DUREE_MS) return null;
  return l;
}

/**
 * L'ESSAI ENTRE DANS SA MAISON : l'image dans le seau privé, la ligne ensuite.
 * Rejouer la même demande ne fait rien de plus (le lien a déjà son identifiant).
 */
export async function creerAvis(
  supabase: Supabase,
  j: JetonAvis,
  image: Buffer,
  d: { quoi: string; prix?: string; magasin?: string; carte?: string; page?: string; ceci?: string; prenom?: string },
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
        // SON PRÉNOM, quand son téléphone le connaît : « Le salon de Marie », « Marie vous demande ».
        ...(s(d.prenom, 30) ? { qp: s(d.prenom, 30) } : {}),
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
    // UN « ÇA ME VA ? » SUR UNE DE SES PIÈCES COMPTE POUR LE MAGASIN.
    if (s(d.carte, 80)) await compterParAdresse(s(d.carte, 80), "avis");
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
    const prenom = (await prenomDe(supabase, l.habitant)) || s(d.qp, 30);
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
export async function listerAvis(supabase: Supabase, habitant: string, adresse: (e: string) => { lien: string; image: string } | null): Promise<Avis[] | null> {
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
      const a = adresse(l.id);
      if (!a) continue;
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
        ...a,
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

/* ═══════════════════════════════════════════════════════════════════════
   💬 LE SALON DE L'ESSAI — la discussion privée autour d'un « Ça me va ? ».

   « Quand l'ami clique, c'est un bon UX, mais on n'est pas du tout sur la
   page du commerçant. Il aurait fallu que ça ouvre un salon de discussion
   privé, où l'essayant peut y voir plus clair et voir ce qu'il se passe. »

   LE SALON VIT SUR LA MÊME LIGNE QUE L'ESSAI ET SES VOTES : les mots
   (`donnees.mots`) à côté des votes, dans la Maison de celui qui demande. Ni
   table ni migration de plus — et il part avec « tout effacer ». Il est
   PRIVÉ COMME LE LIEN : seuls ceux à qui on l'a envoyé l'ouvrent, et ils
   s'y retrouvent sur la page du commerçant (voir `salon-essai.tsx`).

   CLIKME Y PARLE AUSSI : son verdict, puis ses réponses — voir
   `lib/direct/clikme-tranche.ts`. Ses mots portent `k: "clikme"`, ceux de
   celui qui a essayé `k: "auteur"`.
   ═══════════════════════════════════════════════════════════════════════ */

/** Un mot du salon, tel qu'on le range. `a` : le téléphone qui l'a écrit (jamais renvoyé). */
type MotRange = { i: string; a: string; q: string; x: string; t: string; k?: "auteur" | "clikme"; v?: "oui" | "non" | "hesite" };

/** Un mot du salon, tel qu'on le montre. `mien` : écrit depuis ce téléphone. */
export type MotSalon = { i: string; q: string; x: string; t: string; k?: "auteur" | "clikme"; v?: "oui" | "non" | "hesite"; mien?: boolean };

export type SalonEssai = AvisPublic & {
  mots: MotSalon[];
  /** C'est celui qui a essayé qui regarde : il voit qui a voté quoi. */
  auteur: boolean;
  votes?: { v: ChoixVote; q?: string; t: string }[];
  /** Combien de fois ClikMe peut encore parler dans ce salon. */
  clikme: number;
};

/** Ce qu'un salon garde : assez pour un groupe d'amis, pas pour un forum. */
const MOTS_MAX = 150;
/** Les mots d'un même téléphone. */
const MOTS_PAR_PERSONNE = 60;
/** Un mot par seconde et demie au plus, par téléphone. */
const MOTS_ECART_MS = 1500;
/** Combien de fois ClikMe parle dans un salon, et pour une même personne. */
export const CLIKME_MAX = 12;
const CLIKME_PAR_PERSONNE = 6;

const motsDe = (d: Record<string, unknown> | null | undefined): MotRange[] =>
  (Array.isArray(d?.mots) ? (d.mots as Record<string, unknown>[]) : [])
    .map((m) => ({
      i: s(m?.i, 24),
      a: s(m?.a, 40),
      q: s(m?.q, 30),
      x: s(m?.x, 420),
      t: s(m?.t, 40),
      ...(m?.k === "auteur" || m?.k === "clikme" ? { k: m.k as "auteur" | "clikme" } : {}),
      ...(m?.v === "oui" || m?.v === "non" || m?.v === "hesite" ? { v: m.v as "oui" | "non" | "hesite" } : {}),
    }))
    .filter((m) => m.i && m.x && m.t);

const idMot = () => `${Date.now().toString(36)}${randomUUID().slice(0, 6)}`;

async function prenomDe(supabase: Supabase, habitant: string): Promise<string> {
  const { data: h } = await supabase.from("human_habitants").select("prenom").eq("id", habitant).maybeSingle();
  return s((h as Record<string, unknown> | null)?.prenom, 30);
}

/** Le salon, pour celui qui l'ouvre. `null` : l'essai n'est pas (ou plus) là. */
export async function lireSalonEssai(supabase: Supabase, e: string, qui: { votant?: unknown; habitant?: string | null }): Promise<SalonEssai | null> {
  try {
    const l = await ligne(supabase, e);
    if (!l) return null;
    const d = l.donnees ?? {};
    const votes = votesDe(d);
    const prenom = (await prenomDe(supabase, l.habitant)) || s(d.qp, 30);
    const moi = votantValide(qui.votant);
    const auteur = Boolean(qui.habitant && qui.habitant === l.habitant);
    const mien = moi ? votes.find((x) => x.a === moi) : undefined;
    const ck = Math.max(0, Number(d.ck) || 0);
    return {
      quoi: s(d.o),
      ...(s(d.p, 30) ? { prix: s(d.p, 30) } : {}),
      ...(s(d.m, 80) ? { magasin: s(d.m, 80) } : {}),
      ...(pageDeMagasin(d.pg) ? { page: pageDeMagasin(d.pg) } : {}),
      ...(s(d.c, 40) ? { ceci: s(d.c, 40) } : {}),
      ...(prenom ? { prenom } : {}),
      ...compte(votes),
      ...(mien ? { monVote: mien.v } : {}),
      mots: motsDe(d).map(({ a, ...m }) => ({ ...m, ...(moi && a === moi && m.k !== "clikme" ? { mien: true } : {}) })),
      auteur,
      ...(auteur ? { votes: votes.map(({ v, q, t }) => ({ v, ...(q ? { q } : {}), t })) } : {}),
      clikme: Math.max(0, CLIKME_MAX - ck),
    };
  } catch {
    return null;
  }
}

/** Un mot dans le salon. Celui qui a essayé signe de son prénom ; les amis, du leur. */
export async function ecrireDansSalonEssai(
  supabase: Supabase,
  e: string,
  m: { votant: unknown; prenom: unknown; texte: unknown; habitant?: string | null },
): Promise<{ ok: true } | { erreur: string; statut: number }> {
  const a = votantValide(m.votant);
  const x = s(m.texte, 280);
  if (!a || !x) return { erreur: "Mot vide.", statut: 400 };
  try {
    const l = await ligne(supabase, e);
    if (!l) return { erreur: "Cet essai n'est plus là.", statut: 404 };
    const d = l.donnees ?? {};
    const mots = motsDe(d);
    const miens = mots.filter((y) => y.a === a);
    if (miens.length >= MOTS_PAR_PERSONNE) return { erreur: "Vous avez beaucoup écrit ici : laissez la place aux autres.", statut: 429 };
    const dernier = miens.at(-1);
    if (dernier && Date.now() - (Date.parse(dernier.t) || 0) < MOTS_ECART_MS) return { erreur: "Doucement : une seconde.", statut: 429 };
    const auteur = Boolean(m.habitant && m.habitant === l.habitant);
    const q = auteur ? (await prenomDe(supabase, l.habitant)) || s(d.qp, 30) || s(m.prenom, 30) : s(m.prenom, 30);
    const mot: MotRange = { i: idMot(), a, q, x, t: new Date().toISOString(), ...(auteur ? { k: "auteur" as const } : {}) };
    const { error } = await supabase
      .from("human_maison_elements")
      .update({ donnees: { ...d, mots: [...mots, mot].slice(-MOTS_MAX) }, maj_le: new Date().toISOString() })
      .eq("id", l.id)
      .eq("sorte", SORTE_AVIS);
    return error ? { erreur: "Mot non enregistré.", statut: 500 } : { ok: true };
  } catch {
    return { erreur: "Mot non enregistré.", statut: 500 };
  }
}

/** ClikMe peut-il encore parler ici, pour ce téléphone ? Et de quoi parle-t-on ? */
export async function avantClikMe(
  supabase: Supabase,
  e: string,
  votant: unknown,
): Promise<{ quoi: string; prix?: string; magasin?: string; mots: { q: string; x: string; clikme?: boolean }[] } | { erreur: string; statut: number }> {
  const a = votantValide(votant);
  if (!a) return { erreur: "Qui demande ?", statut: 400 };
  const l = await ligne(supabase, e);
  if (!l) return { erreur: "Cet essai n'est plus là.", statut: 404 };
  const d = l.donnees ?? {};
  if ((Number(d.ck) || 0) >= CLIKME_MAX) return { erreur: "ClikMe a déjà beaucoup parlé ici : à vos amis de trancher !", statut: 429 };
  const parLui = (Array.isArray(d.cka) ? (d.cka as unknown[]) : []).filter((x) => x === a).length;
  if (parLui >= CLIKME_PAR_PERSONNE) return { erreur: "Vous avez déjà beaucoup demandé à ClikMe ici.", statut: 429 };
  return {
    quoi: s(d.o),
    ...(s(d.p, 30) ? { prix: s(d.p, 30) } : {}),
    ...(s(d.m, 80) ? { magasin: s(d.m, 80) } : {}),
    mots: motsDe(d).map((m) => ({ q: m.q, x: m.x, ...(m.k === "clikme" ? { clikme: true } : {}) })),
  };
}

/** ClikMe a répondu : son mot entre dans le salon, et compte. */
export async function ecrireClikMe(supabase: Supabase, e: string, votant: unknown, texte: string, verdict?: "oui" | "non" | "hesite"): Promise<boolean> {
  try {
    const l = await ligne(supabase, e);
    if (!l) return false;
    const d = l.donnees ?? {};
    const a = votantValide(votant);
    const mot: MotRange = { i: idMot(), a: "clikme", q: "ClikMe", x: s(texte, 420), t: new Date().toISOString(), k: "clikme", ...(verdict ? { v: verdict } : {}) };
    const cka = [...(Array.isArray(d.cka) ? (d.cka as unknown[]).filter((x): x is string => typeof x === "string") : []), ...(a ? [a] : [])].slice(-60);
    const { error } = await supabase
      .from("human_maison_elements")
      .update({ donnees: { ...d, mots: [...motsDe(d), mot].slice(-MOTS_MAX), ck: (Number(d.ck) || 0) + 1, cka }, maj_le: new Date().toISOString() })
      .eq("id", l.id)
      .eq("sorte", SORTE_AVIS);
    return !error;
  } catch {
    return false;
  }
}
