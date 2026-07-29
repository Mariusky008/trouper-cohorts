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
  slug: string;
  nom: string;
  metier: string;
  texte: string;
  photo: string | null;
};

const str = (v: unknown) => (v == null ? "" : String(v));
// Comparaison de métiers insensible aux accents, à la casse et au pluriel.
const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();

type SiteRow = Record<string, unknown>;

/** Annonce en cours d'un site, ou "" si aucune (ou expirée). */
function offerText(row: SiteRow): string {
  const raw = row.current_offer;
  if (!raw || typeof raw !== "object") return "";
  const o = raw as Record<string, unknown>;
  const text = str(o.text).trim();
  if (!text) return "";
  const until = typeof o.until === "string" && o.until ? o.until : null;
  if (until && Date.parse(until) < Date.now()) return "";
  return text;
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
      .eq("published", true)
      .neq("id", siteId)
      .limit(40);
  const BASE = "slug, business_name, activite, current_offer, gallery_photos";

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
    const texte = offerText(r);
    if (!texte) continue;
    const photos = Array.isArray(r.gallery_photos) ? r.gallery_photos : [];
    out.push({
      slug: str(r.slug),
      nom: str(r.business_name) || "Un commerce voisin",
      metier: resolveMetier(act).entry?.label ?? act,
      texte,
      photo: str(photos[0]) || null,
    });
    if (out.length >= (opts.max ?? 4)) break;
  }
  return out;
}
