/**
 * 📣 LA DIFFUSION CROISÉE, CÔTÉ SERVEUR — voir `diffusion.ts` pour la règle (l'anneau, les trois règles, le plafond).
 *
 *   · QUI EST DANS LE RÉSEAU : les commerces dont `metadata.diffusion_croisee.active` est vrai — chacun l'a accepté lui-même ;
 *   · SES PARTENAIRES : ses deux voisins de cercle dans sa ville (`anneauDeDiffusion`) ;
 *   · QUAND IL PUBLIE UNE VIDÉO (la route de l'annonce, `envoyerAuxPartenaires`) : elle arrive dans la boîte de ses
 *     deux partenaires ; chez celui qui a laissé l'envoi automatique, elle part sur ses réseaux tout de suite, en
 *     « découverte du quartier » (`publierUneDecouverte`), au plus `PLAFOND_PAR_SEMAINE` par semaine ; sinon elle
 *     attend son « Diffuser » ;
 *   · LA BOÎTE : une fiche par vidéo reçue, dans un seau PRIVÉ (`diffusions-croisees`, `<hôte>/<id>.json`) — une fiche
 *     par vidéo, pour que deux écritures ne s'effacent jamais.
 *
 * Ce qui circule : le nom du commerce, son métier, sa ville, son texte, sa photo et sa vidéo — ce qu'il a lui-même
 * publié. RIEN d'autre, aucune donnée de client.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { brancheDuMetier } from "@/lib/site-internet/carte-depuis-fiche";
import { resolveMetier } from "@/lib/site-internet/metier-profiles";
import { publierUneDecouverte, reseauxConfigures } from "@/lib/reseaux/intermediaire";
import { reseauxDuDiagnostic } from "@/lib/reseaux/reseaux-donnees";
import type { Point } from "./voisins";
import {
  JOURS_DE_FRAICHEUR,
  PLAFOND_PAR_SEMAINE,
  anneauDeDiffusion,
  diffuseesCetteSemaine,
  distanceEnMots,
  reglageDe,
  texteDeDecouverte,
  type ReglageDiffusion,
} from "./diffusion";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : Number.NaN);

export const SEAU_DIFFUSIONS = s(process.env.DIFFUSIONS_BUCKET) || "diffusions-croisees";

/** Un commerce, tel que la diffusion le lit. */
export type Commerce = {
  id: string;
  slug: string;
  nom: string;
  activite: string;
  metier: string;
  ville: string;
  point?: Point;
  reglage: ReglageDiffusion;
  metadata: Record<string, unknown>;
};

/** Une vidéo reçue d'un partenaire, dans la boîte de l'hôte. */
export type Recue = {
  id: string;
  le: string;
  de: { id: string; slug: string; nom: string; metier: string; ville: string };
  vers: { id: string; slug: string };
  /** Ses mots à lui (le texte de son annonce), et la découverte telle qu'elle part chez l'hôte. */
  texte: string;
  decouverte: string;
  photo: string;
  video?: { url: string; secondes: number; mp4: boolean };
  statut: "en-attente" | "diffusee" | "refusee";
  diffuseeLe?: string;
  reseaux?: string[];
  erreur?: string;
};

const COLONNES = "id, slug, business_name, activite, city, latitude, longitude, metadata";

function commerceDe(r: Record<string, unknown>): Commerce | null {
  const id = s(r.id);
  const slug = s(r.slug);
  if (!id || !slug) return null;
  const lat = num(r.latitude);
  const lng = num(r.longitude);
  const activite = s(r.activite);
  const metadata = (r.metadata && typeof r.metadata === "object" ? r.metadata : {}) as Record<string, unknown>;
  return {
    id,
    slug,
    nom: s(r.business_name) || slug,
    activite,
    metier: activite ? resolveMetier(activite).entry?.label ?? "" : "",
    ville: s(r.city),
    ...(Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0) ? { point: { lat, lng } } : {}),
    reglage: reglageDe(metadata),
    metadata,
  };
}

/** Les commerces du réseau (ceux qui l'ont accepté), toutes villes. */
export async function commercesDuReseau(supabase: Supabase): Promise<Commerce[]> {
  const { data } = await supabase.from("human_vitrine_sites").select(COLONNES).eq("channel", "letter").limit(2000);
  return ((Array.isArray(data) ? data : []) as Record<string, unknown>[]).map(commerceDe).filter((c): c is Commerce => Boolean(c && c.reglage.active));
}

export async function lireCommerce(supabase: Supabase, siteId: string): Promise<Commerce | null> {
  const { data } = await supabase.from("human_vitrine_sites").select(COLONNES).eq("id", siteId).maybeSingle();
  return data ? commerceDe(data as Record<string, unknown>) : null;
}

/** SES PARTENAIRES : ses voisins de cercle, s'il est dans le réseau. */
export async function partenairesDe(supabase: Supabase, moi: Commerce): Promise<Commerce[]> {
  if (!moi.reglage.active) return [];
  const reseau = await commercesDuReseau(supabase);
  const anneau = anneauDeDiffusion(reseau.map((c) => ({ id: c.id, branche: brancheDuMetier(c.activite), ville: c.ville, ...(c.point ? { point: c.point } : {}) })));
  return (anneau.get(moi.id) ?? []).map((id) => reseau.find((c) => c.id === id)).filter((c): c is Commerce => Boolean(c));
}

/** Son réglage, réécrit dans `metadata.diffusion_croisee` sans toucher au reste. */
export async function ecrireReglage(supabase: Supabase, moi: Commerce, reglage: ReglageDiffusion): Promise<void> {
  const { error } = await supabase.from("human_vitrine_sites").update({ metadata: { ...moi.metadata, diffusion_croisee: reglage } }).eq("id", moi.id);
  if (error) throw new Error(error.message);
}

// ─── la boîte ───────────────────────────────────────────────────────────────────────────────────

async function seauPret(supabase: Supabase): Promise<void> {
  const { data } = await supabase.storage.getBucket(SEAU_DIFFUSIONS);
  if (data) return;
  const { error } = await supabase.storage.createBucket(SEAU_DIFFUSIONS, { public: false });
  if (error && !/exist/i.test(error.message)) throw new Error(error.message);
}

async function ecrireRecue(supabase: Supabase, r: Recue): Promise<void> {
  await seauPret(supabase);
  const corps = Buffer.from(JSON.stringify(r));
  const { error } = await supabase.storage.from(SEAU_DIFFUSIONS).upload(`${r.vers.id}/${r.id}.json`, corps, { contentType: "application/json", upsert: true });
  if (error) throw new Error(error.message);
}

/** Les vidéos reçues par un commerce, la plus récente d'abord (trente au plus). */
export async function lireBoite(supabase: Supabase, siteId: string): Promise<Recue[]> {
  try {
    const { data } = await supabase.storage.from(SEAU_DIFFUSIONS).list(siteId, { limit: 100, sortBy: { column: "name", order: "desc" } });
    const noms = (data ?? []).map((f) => f.name).filter((n) => n.endsWith(".json")).sort().reverse().slice(0, 30);
    const fiches = await Promise.all(
      noms.map(async (n) => {
        const { data: f } = await supabase.storage.from(SEAU_DIFFUSIONS).download(`${siteId}/${n}`);
        return f ? (JSON.parse(await f.text()) as Recue) : null;
      }),
    );
    return fiches.filter((r): r is Recue => Boolean(r));
  } catch {
    return [];
  }
}

/** Une vidéo reçue qu'il n'a pas traitée au bout d'une semaine n'est plus d'actualité. */
export const perimee = (r: Recue, maintenant = Date.now()) => r.statut === "en-attente" && maintenant - Date.parse(r.le) > JOURS_DE_FRAICHEUR * 86_400_000;

// ─── l'envoi ────────────────────────────────────────────────────────────────────────────────────

/** Ses comptes à lui (l'hôte) sur lesquels une découverte peut partir : pas Google (voir `publierUneDecouverte`). */
async function aDesReseaux(supabase: Supabase, siteId: string): Promise<boolean> {
  if (!reseauxConfigures()) return false;
  const { data } = await supabase.from("human_vitrine_sites").select("diagnostic").eq("id", siteId).maybeSingle();
  return reseauxDuDiagnostic((data as Record<string, unknown> | null)?.diagnostic).comptes.some((c) => c.plateforme !== "googlebusiness");
}

/** La découverte part sur les réseaux de l'hôte ; la fiche dit ce qui est arrivé. */
export async function diffuser(supabase: Supabase, r: Recue): Promise<Recue> {
  const pub = await publierUneDecouverte(
    { id: r.vers.id },
    { texte: r.decouverte, photo: r.photo, ...(r.video ? { video: r.video } : {}), invite: { slug: r.de.slug, nom: r.de.nom, ville: r.de.ville, activite: r.de.metier } },
  );
  const suivante: Recue = pub.ok.length
    ? { ...r, statut: "diffusee", diffuseeLe: pub.at, reseaux: pub.ok, ...(pub.erreurs.length ? { erreur: pub.erreurs.map((e) => e.plateforme).join(", ") } : {}) }
    : { ...r, erreur: pub.erreurs[0]?.message ?? "erreur" };
  await ecrireRecue(supabase, suivante);
  return suivante;
}

export async function refuser(supabase: Supabase, r: Recue): Promise<Recue> {
  const suivante: Recue = { ...r, statut: "refusee" };
  await ecrireRecue(supabase, suivante);
  return suivante;
}

/**
 * ═══ IL VIENT DE PUBLIER UNE VIDÉO : ELLE PART CHEZ SES DEUX PARTENAIRES ═══
 * Rien s'il n'est pas dans le réseau, s'il n'a pas de partenaire, ou sans photo (la couverture). Ne lève jamais : sa
 * vidéo est déjà en ligne chez lui, la diffusion croisée est un plus.
 */
export async function envoyerAuxPartenaires(
  siteId: string,
  contenu: { texte: string; photo: string | null; video?: { url: string; secondes: number; mp4: boolean } },
): Promise<Recue[]> {
  try {
    const photo = contenu.photo;
    const video = contenu.video;
    if (!photo || !video) return [];
    const supabase = createAdminClient();
    const moi = await lireCommerce(supabase, siteId);
    if (!moi?.reglage.active) return [];
    const partenaires = await partenairesDe(supabase, moi);
    // LES DEUX EN MÊME TEMPS : une vidéo vers Instagram peut prendre deux minutes, la route en a cinq
    const parties = await Promise.all(partenaires.map(async (hote): Promise<Recue> => {
      const le = new Date().toISOString();
      const r: Recue = {
        id: `${le.replace(/[^0-9]/g, "").slice(0, 14)}-${moi.slug}`.slice(0, 120),
        le,
        de: { id: moi.id, slug: moi.slug, nom: moi.nom, metier: moi.metier, ville: moi.ville },
        vers: { id: hote.id, slug: hote.slug },
        texte: contenu.texte.slice(0, 300),
        decouverte: texteDeDecouverte({ nom: moi.nom, metier: moi.metier, texte: contenu.texte, ou: distanceEnMots(hote.point, moi.point) }),
        photo,
        video,
        statut: "en-attente",
      };
      await ecrireRecue(supabase, r);
      // CHEZ CELUI QUI A LAISSÉ L'ENVOI AUTOMATIQUE, ET SOUS SON PLAFOND : elle part tout de suite
      let finale = r;
      if (hote.reglage.auto && (await aDesReseaux(supabase, hote.id))) {
        const deja = (await lireBoite(supabase, hote.id)).filter((x) => x.statut === "diffusee" && x.diffuseeLe).map((x) => x.diffuseeLe as string);
        if (diffuseesCetteSemaine(deja) < PLAFOND_PAR_SEMAINE) finale = await diffuser(supabase, r);
      }
      return finale;
    }));
    if (parties.length) console.info("[diffusion] envoyée :", JSON.stringify({ de: moi.slug, vers: parties.map((p) => `${p.vers.slug}:${p.statut}`) }));
    return parties;
  } catch (e) {
    console.error("[diffusion] envoi impossible :", String((e as Error)?.message ?? e).slice(0, 300));
    return [];
  }
}

/** Ses vidéos à lui, chez ses partenaires (ce qu'il y a dans leurs boîtes et qui vient de lui). */
export async function mesEnvois(supabase: Supabase, moi: Commerce, partenaires: Commerce[]): Promise<Recue[]> {
  const boites = await Promise.all(partenaires.map((p) => lireBoite(supabase, p.id)));
  return boites
    .flat()
    .filter((r) => r.de.id === moi.id)
    .sort((a, b) => b.le.localeCompare(a.le))
    .slice(0, 12);
}

export { aDesReseaux };
