/**
 * 🏪 LES MÈMES DES COMMERÇANTS, CÔTÉ SERVEUR — voir `memes-commerces.ts` pour la règle.
 *
 * PUBLICS, comme ses figurines : le seau `figurines-pros` (public). Pas de table (rien à migrer) :
 *   · la vidéo, fabriquée dans son téléphone, part tout droit au seau (une adresse signée) : `<site>/memes/<id>.<ext>` ;
 *   · sa fiche : `memes/<id>.json` (la page `/meme/<id>` la lit) ;
 *   · « Découvrir », par ville et par jour : une fiche par mème, `memes-du-jour/<ville>/<AAAA-MM-JJ>/<id>.json` (une par
 *     fichier : deux commerçants qui publient en même temps ne s'écrasent pas) ;
 *   · ses mèmes à lui : `<site>/memes/index.json` (les plus récents d'abord).
 * CE QU'IL RAPPORTE : la table de la mesure (`clik_meme_evenement`), sous `c-<id>` — vu, « Voir sa page » (clic),
 * partagé. Sans la migration, rien ne se compte (les mèmes partent quand même).
 *
 * FICHIER SERVEUR.
 */
import { randomBytes } from "crypto";
import type { createAdminClient } from "@/lib/supabase/admin";
import { villeSlug } from "./ville";
import { motInterdit } from "./mots-interdits";
import {
  JOURS_DECOUVRIR,
  MEMES_COMMERCE_PAR_JOUR,
  TEXTE_MEME_COMMERCE_MAX,
  cleMesureCommerce,
  idMemeCommerceValide,
  typeMemeDe,
  type MemeCommerce,
  type MemeCommerceVu,
} from "./memes-commerces";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const SEAU = s(process.env.FIGURINES_PROS_BUCKET) || "figurines-pros";
/** Un mème : 15 Mo au plus (une vingtaine de secondes en 720 × 1280). */
const MEME_MAX = 15 * 1024 * 1024;

const jourParis = (d = new Date()) => d.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
const cheminVideo = (site: string, id: string, ext: string) => `${site}/memes/${id}.${ext}`;
const cheminFiche = (id: string) => `memes/${id}.json`;
const cheminVille = (ville: string, jour: string, id: string) => `memes-du-jour/${ville}/${jour}/${id}.json`;
const cheminSiens = (site: string) => `${site}/memes/index.json`;
const extDe = (type: unknown) => (/^video\/mp4/i.test(s(type)) ? "mp4" : /^video\/webm/i.test(s(type)) ? "webm" : "");
const nouvelId = () => [...randomBytes(12)].map((b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
const nettoyerVille = (v: unknown) => s(v).replace(/\b\d{5}\b/g, " ").replace(/\s+/g, " ").trim();
const publique = (supabase: Supabase, chemin: string) => supabase.storage.from(SEAU).getPublicUrl(chemin).data.publicUrl;

async function lireJson<T>(supabase: Supabase, chemin: string): Promise<T | null> {
  try {
    const { data, error } = await supabase.storage.from(SEAU).download(chemin);
    if (error || !data) return null;
    return JSON.parse(Buffer.from(await data.arrayBuffer()).toString()) as T;
  } catch {
    return null;
  }
}
async function ecrireJson(supabase: Supabase, chemin: string, x: unknown): Promise<boolean> {
  const { error } = await supabase.storage.from(SEAU).upload(chemin, Buffer.from(JSON.stringify(x)), { contentType: "application/json", upsert: true });
  return !error;
}
async function noms(supabase: Supabase, dossier: string, limite = 100): Promise<{ name: string; size: number }[]> {
  const { data } = await supabase.storage.from(SEAU).list(dossier, { limit: limite, sortBy: { column: "created_at", order: "desc" } });
  return ((Array.isArray(data) ? data : []) as { name?: string; metadata?: { size?: number } }[]).map((x) => ({ name: s(x.name), size: Number(x.metadata?.size) || 0 })).filter((x) => x.name);
}
/** Le seau public existe (créé au premier dépôt, comme pour ses figurines). */
async function seauPret(supabase: Supabase): Promise<void> {
  const { data } = await supabase.storage.getBucket(SEAU);
  if (data) return;
  await supabase.storage.createBucket(SEAU, { public: true }).catch(() => undefined);
}

// ─── le commerçant (son lien pro) ─────────────────────────────────────────────────────────────────
export type SitePro = { id: string; slug: string; nom: string; ville: string };
/** Son commerce, si son jeton pro est le bon. */
export async function sitePro(supabase: Supabase, slug: unknown, token: unknown): Promise<SitePro | null> {
  if (!s(slug) || !s(token)) return null;
  const { data } = await supabase.from("human_vitrine_sites").select("id, slug, business_name, city, pro_token").eq("slug", s(slug)).eq("channel", "letter").maybeSingle();
  const r = (data as Record<string, unknown> | null) ?? null;
  if (!r || !s(r.pro_token) || s(r.pro_token) !== s(token)) return null;
  return { id: s(r.id), slug: s(r.slug), nom: s(r.business_name), ville: nettoyerVille(r.city) };
}

type Siens = { ids?: string[] };

/** Ses mèmes d'aujourd'hui (pour le plafond du jour). */
async function sesIds(supabase: Supabase, site: SitePro): Promise<string[]> {
  const x = await lireJson<Siens>(supabase, cheminSiens(site.id));
  return (Array.isArray(x?.ids) ? x.ids : []).filter(idMemeCommerceValide);
}

/** 🎬 Où envoyer la vidéo de son mème (fabriquée dans son téléphone, trop lourde pour passer par ici). */
export async function adresseEnvoiMemeCommerce(supabase: Supabase, site: SitePro, type: unknown): Promise<{ id?: string; seau?: string; chemin?: string; jeton?: string; error?: string; statut?: number }> {
  const ext = extDe(type);
  if (!ext) return { error: "Ce format de vidéo n’est pas pris.", statut: 400 };
  const aujourdhui = jourParis();
  const fiches = await Promise.all((await sesIds(supabase, site)).slice(0, MEMES_COMMERCE_PAR_JOUR + 2).map((id) => lireJson<MemeCommerce>(supabase, cheminFiche(id))));
  if (fiches.filter((f) => f?.jour === aujourdhui).length >= MEMES_COMMERCE_PAR_JOUR) return { error: `${MEMES_COMMERCE_PAR_JOUR} mèmes aujourd’hui : reviens demain.`, statut: 429 };
  await seauPret(supabase);
  const id = nouvelId();
  const chemin = cheminVideo(site.id, id, ext);
  const { data, error } = await supabase.storage.from(SEAU).createSignedUploadUrl(chemin, { upsert: true });
  if (error || !data?.token) return { error: "Ton mème n’a pas pu partir. Réessaie.", statut: 502 };
  return { id, seau: SEAU, chemin: data.path ?? chemin, jeton: data.token };
}

/** Ses mots : une ligne propre, sans gros mot. */
export function texteMemeCommerce(x: unknown): { texte?: string; error?: string } {
  const t = s(x)
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return { error: "Écris d’abord ce que ta figurine annonce." };
  if (t.length > TEXTE_MEME_COMMERCE_MAX) return { error: `${TEXTE_MEME_COMMERCE_MAX} signes au plus.` };
  if (motInterdit(t)) return { error: "Ça, ta figurine ne le dit pas. Écris autre chose 🙂" };
  return { texte: t };
}

/** Sa figurine sur l'affiche : une image de ClikMe (son seau public, ou les fantômes de l'appli), rien d'autre. */
function imageSure(supabase: Supabase, x: unknown): string {
  const u = s(x);
  const base = publique(supabase, "x").replace(/x$/, "");
  return (base && u.startsWith(base)) || /^\/direct\/[a-z0-9/_-]+\.(webp|png|jpg)$/i.test(u) ? u : "";
}

/** 📣 Le mème est arrivé : rangé, et dans « Découvrir » pour les gens de sa ville. */
export async function publierMemeCommerce(
  supabase: Supabase,
  site: SitePro,
  p: { id?: unknown; type?: unknown; texte?: unknown; videoType?: unknown; image?: unknown; voix?: unknown },
): Promise<{ meme?: MemeCommerce; error?: string; statut?: number }> {
  const id = s(p.id);
  if (!idMemeCommerceValide(id)) return { error: "Ce mème n’existe pas.", statut: 400 };
  const quoi = typeMemeDe(p.type);
  if (!quoi) return { error: "Choisis ce que ta figurine annonce.", statut: 400 };
  const t = texteMemeCommerce(p.texte);
  if (!t.texte) return { error: t.error, statut: 400 };
  const ext = extDe(p.videoType);
  if (!ext) return { error: "Ce format de vidéo n’est pas pris.", statut: 400 };
  const nom = `${id}.${ext}`;
  const f = (await noms(supabase, `${site.id}/memes`)).find((x) => x.name === nom);
  if (!f || f.size <= 0) return { error: "La vidéo de ton mème n’est pas arrivée.", statut: 400 };
  if (f.size > MEME_MAX) {
    await supabase.storage.from(SEAU).remove([cheminVideo(site.id, id, ext)]);
    return { error: "Ton mème est trop long.", statut: 413 };
  }
  const le = new Date();
  const ville = villeSlug(site.ville) || "ailleurs";
  const meme: MemeCommerce = {
    id,
    slug: site.slug,
    nom: site.nom,
    ville: site.ville,
    villeSlug: ville,
    type: quoi.cle,
    emoji: quoi.emoji,
    titre: quoi.titre,
    texte: t.texte,
    video: publique(supabase, cheminVideo(site.id, id, ext)),
    videoType: ext === "mp4" ? "video/mp4" : "video/webm",
    image: imageSure(supabase, p.image),
    voix: p.voix === true,
    le: le.toISOString(),
    jour: jourParis(le),
  };
  const ids = await sesIds(supabase, site);
  const ok = await Promise.all([
    ecrireJson(supabase, cheminFiche(id), meme),
    ecrireJson(supabase, cheminVille(ville, meme.jour, id), meme),
    ecrireJson(supabase, cheminSiens(site.id), { ids: [id, ...ids.filter((x) => x !== id)].slice(0, 30) }),
  ]);
  if (!ok.every(Boolean)) return { error: "Ton mème n’a pas pu être rangé.", statut: 502 };
  await noterGesteCommerce(supabase, "cree", id);
  return { meme };
}

/** Un mème de commerçant (sa page `/meme/<id>`). */
export async function memeCommerce(supabase: Supabase, id: unknown): Promise<MemeCommerce | null> {
  if (!idMemeCommerceValide(id)) return null;
  const m = await lireJson<MemeCommerce>(supabase, cheminFiche(id));
  return m?.id === id && m.video ? m : null;
}

// ─── 📈 ce qu'il rapporte ─────────────────────────────────────────────────────────────────────────
export type GesteCommerce = "cree" | "vu" | "clic" | "partage";
export async function noterGesteCommerce(supabase: Supabase, type: GesteCommerce, id: string): Promise<void> {
  if (!idMemeCommerceValide(id)) return;
  try {
    await supabase.from("clik_meme_evenement").insert({ message_id: cleMesureCommerce(id), type });
  } catch {
    /* pas encore de table : tant pis */
  }
}

/** 🏪 Au comptoir : ses derniers mèmes, et ce qu'ils rapportent (vus, « Voir sa page », partagés). */
export async function sesMemesCommerce(supabase: Supabase, site: SitePro): Promise<MemeCommerceVu[]> {
  const ids = (await sesIds(supabase, site)).slice(0, 6);
  const fiches = (await Promise.all(ids.map((id) => memeCommerce(supabase, id)))).filter((x): x is MemeCommerce => Boolean(x));
  if (!fiches.length) return [];
  const { data } = await supabase
    .from("clik_meme_evenement")
    .select("message_id, type")
    .in(
      "message_id",
      fiches.map((f) => cleMesureCommerce(f.id)),
    )
    .limit(20_000);
  const ev = (Array.isArray(data) ? data : []) as { message_id?: string; type?: string }[];
  const compte = (id: string, type: string) => ev.filter((e) => e.message_id === cleMesureCommerce(id) && e.type === type).length;
  return fiches.map((f) => ({ ...f, vues: compte(f.id, "vu"), visites: compte(f.id, "clic"), partages: compte(f.id, "partage") }));
}

// ─── 🔥 « Découvrir » ─────────────────────────────────────────────────────────────────────────────
/** Les mèmes d'une ville, ces derniers jours (les plus récents d'abord). */
async function memesDeLaVille(supabase: Supabase, ville: string, max: number): Promise<MemeCommerce[]> {
  const jours = Array.from({ length: JOURS_DECOUVRIR }, (_, k) => jourParis(new Date(Date.now() - k * 86_400_000)));
  const l: MemeCommerce[] = [];
  for (const jour of jours) {
    if (l.length >= max) break;
    const fichiers = (await noms(supabase, `memes-du-jour/${ville}/${jour}`, max)).filter((x) => x.name.endsWith(".json"));
    const fiches = await Promise.all(fichiers.slice(0, max - l.length).map((x) => lireJson<MemeCommerce>(supabase, `memes-du-jour/${ville}/${jour}/${x.name}`)));
    l.push(...fiches.filter((x): x is MemeCommerce => Boolean(x?.id && x.video)));
  }
  return l;
}

/**
 * 🔥 LE FIL DE « DÉCOUVRIR » : les mèmes du jour des commerçants de SA ville d'abord ; s'il y en a peu (ou s'il n'a pas
 * encore de ville), ceux des autres villes ClikMe. Les plus récents d'abord, 20 au plus.
 */
export async function memesDecouvrir(supabase: Supabase, ville: string): Promise<{ memes: MemeCommerce[]; ville: string }> {
  const MAX = 20;
  const siens = ville ? await memesDeLaVille(supabase, ville, MAX) : [];
  let autres: MemeCommerce[] = [];
  if (siens.length < 4) {
    const villes = (await noms(supabase, "memes-du-jour", 50)).map((x) => x.name).filter((v) => v && v !== ville);
    for (const v of villes) {
      if (autres.length >= MAX - siens.length) break;
      autres.push(...(await memesDeLaVille(supabase, v, 6)));
    }
    autres = autres.sort((a, b) => b.le.localeCompare(a.le)).slice(0, MAX - siens.length);
  }
  return { memes: [...siens.sort((a, b) => b.le.localeCompare(a.le)), ...autres], ville };
}
