// Le Collectif — diffusion croisée des annonces entre commerces d'une même ville.
//
// Le commerçant publie une annonce sur son site ; elle apparaît aussi chez les
// commerces partenaires de sa ville. Ce fichier contient TOUTE la règle
// d'appariement, côté serveur : elle ne doit jamais dépendre de l'interface.
//
// Ce qui circule : nom du commerce, métier, annonce du moment, lien vers le site.
// RIEN d'autre — aucune donnée de client, jamais.
import { resolveMetier } from "./metier-profiles";

export type PartnerOffer = {
  /** Identifiant du site — sert à compter les affichages dans le catalogue. */
  id: string;
  slug: string;
  nom: string;
  metier: string;
  texte: string;
  photo: string | null;
  /** Horodatage de publication — sert au tri par fraîcheur. */
  publieLe: string | null;
  /** Réputation Google réelle. Absente hors catalogue de ville (non demandée). */
  note?: number | null;
  avis?: number | null;
  /** Fin de validité de l'annonce, si le pro en a fixé une. */
  jusqua?: string | null;
};

const str = (v: unknown) => (v == null ? "" : String(v));
// Comparaison de métiers insensible aux accents, à la casse et au pluriel.
const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();

type SiteRow = Record<string, unknown>;

/**
 * Les photos d'un commerce, dans l'ordre où son site les utilise : celles qu'il
 * a téléversées d'abord, sinon celles de sa fiche Google.
 *
 * Les deux ne sont pas au même endroit — `gallery_photos` pour les siennes,
 * `diagnostic.photos` pour Google. Le catalogue ne lisait que la première, si
 * bien qu'un commerce dont le site est plein de photos y paraissait sur un
 * aplat de couleur.
 */
export function photosDe(row: SiteRow): string[] {
  const propres = (Array.isArray(row.gallery_photos) ? row.gallery_photos : [])
    .map((p) => str(p))
    .filter((u) => /^data:image\//i.test(u));
  if (propres.length) return propres.slice(0, 10);
  const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;
  return (Array.isArray(diag.photos) ? diag.photos : [])
    .map((p) => str(p))
    .filter((u) => /^https?:\/\//i.test(u))
    .slice(0, 6);
}

/** Annonce en cours d'un site : son texte, sa date, son échéance, sa photo. */
function offerOf(row: SiteRow): { text: string; at: string | null; until: string | null; photo: string | null } | null {
  const raw = row.current_offer;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const text = str(o.text).trim();
  if (!text) return null;
  const until = typeof o.until === "string" && o.until ? o.until : null;
  if (until && Date.parse(until) < Date.now()) return null;
  const at = typeof o.created_at === "string" && o.created_at ? o.created_at : null;
  // Photo choisie POUR CETTE ANNONCE. Absente sur les annonces publiées avant
  // que le choix existe → on retombe sur la première photo du commerce.
  const photo = str(o.photo).trim() || null;
  return { text, at, until, photo };
}

/**
 * Deux commerces sont partenaires s'ils ne se font PAS concurrence.
 * Même métier = concurrent direct → jamais. Dans le doute (métier non reconnu),
 * on compare les activités brutes : mieux vaut rater un partenaire que d'envoyer
 * un client chez le voisin d'en face.
 */
export function sontComplementaires(activiteA: string, activiteB: string): boolean {
  const a = resolveMetier(activiteA).entry;
  const b = resolveMetier(activiteB).entry;
  if (a && b) return a.label !== b.label;
  const na = norm(activiteA);
  const nb = norm(activiteB);
  if (!na || !nb) return false;
  return !na.includes(nb) && !nb.includes(na);
}

/** Un commerce peut-il participer au Collectif ? (déonto : commerce uniquement) */
export function peutParticiper(activite: string): boolean {
  return resolveMetier(activite).def.avis_sollicitation;
}

// Le client Supabase est typé de façon lâche ici : ce module ne doit rien savoir
// de la génération de types, et il est appelé aussi bien depuis une page que
// depuis une route.
type Supabase = { from: (t: string) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Les annonces des commerces partenaires à afficher sur le site de `siteId`.
 * Renvoie [] dès qu'une condition manque — c'est volontaire : une section vide
 * ne s'affiche pas, plutôt que de promettre un réseau qui n'est pas encore là.
 */
export async function partnerOffers(
  supabase: Supabase,
  opts: { siteId: string; ville: string; activite: string; collectifActif: boolean; max?: number }
): Promise<PartnerOffer[]> {
  const { siteId, ville, activite, collectifActif } = opts;
  // Réciprocité : qui ne partage pas ne reçoit pas.
  if (!collectifActif || !ville.trim() || !peutParticiper(activite)) return [];

  // `collectif_actif` n'existe qu'après la migration « collectif » : on réessaie
  // sans la colonne plutôt que de priver tout le monde de la section.
  const query = (cols: string) =>
    supabase
      .from("human_vitrine_sites")
      .select(cols)
      .eq("channel", "letter")
      .eq("city", ville)
      .eq("est_client", true)
      .neq("id", siteId)
      .limit(40);
  const BASE = "id, slug, business_name, activite, current_offer, gallery_photos, diagnostic";

  let rows: SiteRow[] = [];
  try {
    const { data, error } = await query(`${BASE}, collectif_actif`);
    if (error) throw new Error(error.message);
    if (Array.isArray(data)) rows = data as SiteRow[];
  } catch {
    try {
      const { data } = await query(BASE);
      if (Array.isArray(data)) rows = data as SiteRow[];
    } catch {
      return [];
    }
  }

  const out: PartnerOffer[] = [];
  for (const r of rows) {
    // `collectif_actif` est absent tant que la migration n'est pas passée : on
    // considère alors que le commerce participe (valeur par défaut de la colonne).
    if (r.collectif_actif === false) continue;
    const act = str(r.activite);
    if (!peutParticiper(act)) continue;
    if (!sontComplementaires(activite, act)) continue;
    const off = offerOf(r);
    if (!off) continue;
    const photos = photosDe(r);
    out.push({
      id: str(r.id),
      slug: str(r.slug),
      nom: str(r.business_name) || "Un commerce voisin",
      metier: resolveMetier(act).entry?.label ?? act,
      texte: off.text,
      photo: off.photo || str(photos[0]) || null,
      publieLe: off.at,
      // Sans l'échéance, une offre « jusqu'à 18 h » s'affichait sans fin sur le
      // site d'un voisin : le visiteur y arrivait à 19 h en croyant qu'elle court.
      jusqua: off.until,
    });
  }

  // TRI PAR FRAÎCHEUR. Sans lui, les places étaient attribuées dans l'ordre
  // arbitraire de la base : deux commerçants passaient toujours, deux jamais,
  // sans raison ni moyen de le vérifier.
  //
  // La fraîcheur est le bon critère parce que le produit sert le PÉRISSABLE :
  // une annonce d'il y a une heure doit passer devant une annonce de mardi.
  // C'est aussi auto-régulant — publier souvent rend plus visible.
  out.sort((a, b) => {
    const ta = a.publieLe ? Date.parse(a.publieLe) : 0;
    const tb = b.publieLe ? Date.parse(b.publieLe) : 0;
    return tb - ta;
  });
  return out.slice(0, opts.max ?? 4);
}

/** Un commerce de la ville, SANS annonce en cours : sa fiche, rien de plus. */
export type CityMerchant = {
  slug: string;
  nom: string;
  metier: string;
  photo: string | null;
  note: number | null;
  avis: number | null;
};

/** Slug d'URL d'une ville — même règle que `slugify`, dupliquée pour rester autonome. */
const villeSlug = (v: string) =>
  v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/**
 * Le catalogue complet d'une ville : les annonces du moment ET les commerces qui
 * n'en ont pas.
 *
 * Pourquoi les deux : une page vide ne donne envie de revenir à personne. Les
 * fiches font que le catalogue existe dès le premier commerce, et qu'un habitant
 * y trouve toujours quelque chose. Les annonces passent devant — elles sont
 * datées, elles ont une raison d'être vues aujourd'hui.
 *
 * On ne liste QUE les sites publiés : les commerces simplement démarchés n'ont
 * jamais accepté d'apparaître où que ce soit.
 */
export async function cityDirectory(
  supabase: Supabase,
  slug: string
): Promise<{ ville: string; offers: PartnerOffer[]; autres: CityMerchant[] }> {
  const vide = { ville: "", offers: [] as PartnerOffer[], autres: [] as CityMerchant[] };
  if (!slug.trim()) return vide;

  const BASE = "id, slug, business_name, city, activite, current_offer, gallery_photos, diagnostic, google_rating, google_reviews";
  const query = (cols: string) =>
    supabase.from("human_vitrine_sites").select(cols).eq("channel", "letter").eq("est_client", true).limit(500);

  let rows: SiteRow[] = [];
  try {
    const { data, error } = await query(`${BASE}, collectif_actif`);
    if (error) throw new Error(error.message);
    if (Array.isArray(data)) rows = data as SiteRow[];
  } catch {
    try {
      const { data } = await query(BASE);
      if (Array.isArray(data)) rows = data as SiteRow[];
    } catch {
      return vide;
    }
  }

  // Le nom de la ville stocké n'est pas toujours nu (« Dax, France », « 40100 Dax ») :
  // une correspondance stricte laissait la page sans nom de ville du tout.
  const colle = (s: string) => s === slug || s.startsWith(`${slug}-`) || s.endsWith(`-${slug}`);
  let ville = "";
  for (const r of rows) {
    const c = str(r.city).trim();
    if (!c) continue;
    const cs = villeSlug(c);
    if (cs === slug) {
      ville = c;
      break;
    }
    if (!ville && colle(cs)) ville = c;
  }
  if (!ville) return vide;

  const offers: PartnerOffer[] = [];
  const autres: CityMerchant[] = [];
  for (const r of rows) {
    if (str(r.city).trim() !== ville) continue;
    if (r.collectif_actif === false) continue;
    const act = str(r.activite);
    if (!peutParticiper(act)) continue; // déonto : commerce uniquement
    const photos = photosDe(r);
    const metier = resolveMetier(act).entry?.label ?? act;
    const off = offerOf(r);
    if (off) {
      offers.push({
        id: str(r.id),
        slug: str(r.slug),
        nom: str(r.business_name) || "Un commerce",
        metier,
        texte: off.text,
        // L'annonce porte sa propre image : un arrivage de fraises ne s'illustre
        // pas avec la devanture. À défaut de choix, la première photo du commerce.
        photo: off.photo || str(photos[0]) || null,
        publieLe: off.at,
        note: typeof r.google_rating === "number" ? r.google_rating : null,
        avis: typeof r.google_reviews === "number" ? r.google_reviews : null,
        jusqua: off.until,
      });
    } else {
      autres.push({
        slug: str(r.slug),
        nom: str(r.business_name) || "Un commerce",
        metier,
        photo: str(photos[0]) || null,
        note: typeof r.google_rating === "number" ? r.google_rating : null,
        avis: typeof r.google_reviews === "number" ? r.google_reviews : null,
      });
    }
  }

  offers.sort((a, b) => (b.publieLe ? Date.parse(b.publieLe) : 0) - (a.publieLe ? Date.parse(a.publieLe) : 0));
  // Sans annonce, l'ordre ne peut pas être « le plus frais » : on prend la
  // réputation réelle, et le nom pour départager. Jamais un ordre arbitraire.
  autres.sort((a, b) => (b.note ?? 0) - (a.note ?? 0) || a.nom.localeCompare(b.nom, "fr"));
  return { ville, offers, autres };
}

/** Une ville où au moins un commerce est en ligne. */
export type VilleEntry = { nom: string; slug: string; commerces: number; annonces: number };

/**
 * Les villes réellement couvertes, pour le sélecteur.
 *
 * On ne liste que ce qui existe : une ville sans commerce publié n'apparaît pas.
 * Proposer une ville vide dans un menu, c'est promettre une page qu'on sait vide.
 */
export async function cityList(supabase: Supabase): Promise<VilleEntry[]> {
  const BASE = "city, activite, current_offer";
  const query = (cols: string) =>
    supabase.from("human_vitrine_sites").select(cols).eq("channel", "letter").eq("est_client", true).limit(500);

  let rows: SiteRow[] = [];
  try {
    const { data, error } = await query(`${BASE}, collectif_actif`);
    if (error) throw new Error(error.message);
    if (Array.isArray(data)) rows = data as SiteRow[];
  } catch {
    try {
      const { data } = await query(BASE);
      if (Array.isArray(data)) rows = data as SiteRow[];
    } catch {
      return [];
    }
  }

  const par = new Map<string, VilleEntry>();
  for (const r of rows) {
    if (r.collectif_actif === false) continue;
    if (!peutParticiper(str(r.activite))) continue; // déonto : commerce uniquement
    const nom = str(r.city).trim();
    if (!nom) continue;
    const slug = villeSlug(nom);
    const e = par.get(slug) ?? { nom, slug, commerces: 0, annonces: 0 };
    e.commerces += 1;
    if (offerOf(r)) e.annonces += 1;
    par.set(slug, e);
  }
  // Les villes les plus vivantes d'abord : ce qui bouge aujourd'hui, puis la taille.
  return [...par.values()].sort((a, b) => b.annonces - a.annonces || b.commerces - a.commerces || a.nom.localeCompare(b.nom, "fr"));
}

/**
 * Compte un AFFICHAGE pour chaque annonce rendue — page catalogue ou fenêtre sur
 * le site d'un confrère. C'est le seul chiffre qui prouve au commerçant que le
 * catalogue travaille pour lui.
 *
 * Volontairement « best-effort » et non bloquant : un compteur ne doit jamais
 * empêcher une page de s'afficher. Si la migration n'est pas passée, la fonction
 * RPC n'existe pas et on ne compte rien — sans casser quoi que ce soit.
 *
 * Ce n'est pas une lecture, c'est une exposition : l'Espace Pro doit l'écrire
 * « affiché N fois », jamais « vu par N personnes ».
 */
export async function noteCatalogueViews(
  supabase: { rpc?: (fn: string, args: Record<string, unknown>) => PromiseLike<unknown> },
  offers: PartnerOffer[]
): Promise<void> {
  const ids = offers.map((o) => o.id).filter(Boolean);
  if (!ids.length || typeof supabase.rpc !== "function") return;
  try {
    await supabase.rpc("increment_catalogue_views", { ids });
  } catch {
    /* fonction absente (migration non appliquée) → on n'affiche simplement rien */
  }
}

/** « il y a 2 h », « hier », « le 12/03 » — la fraîcheur EST l'information. */
export function ilYA(iso: string | null): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const min = Math.floor((Date.now() - t) / 60000);
  if (min < 2) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  if (h < 48) return "hier";
  return new Date(t).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}
