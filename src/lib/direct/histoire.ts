// LA PETITE HISTOIRE DU JOUR.
//
// Une phrase par commerce et par jour, écrite par lui. Ce n'est ni une offre,
// ni un avis : c'est ce qui se passe chez lui aujourd'hui.
//
//   🥐 « 6 h 12. Le premier croissant est sorti du four. Et oui… on en a
//        goûté un. »
//   ✂️ « Première cliente de la journée : 32 cm de cheveux en moins. »
//
// POURQUOI CE N'EST PAS UNE CARTE DU FIL. Le fil montre ce qu'on peut saisir
// maintenant ; une histoire ne se saisit pas. Lui donner une carte la mettrait
// en concurrence avec les vraies offres, et un fil rempli d'anecdotes est
// exactement le catalogue que Le Direct refuse d'être. Elle s'affiche donc SUR
// la carte du commerce, sous son annonce : au même endroit, sans prendre la
// place de personne.
//
// POURQUOI UNE SEULE PAR JOUR. « La petite histoire du jour » au pluriel n'est
// plus une histoire, c'est un mur. La contrainte vit dans le schéma, pas dans
// l'écran : `unique (site_id, jour)`.
//
// PERSONNE D'AUTRE QUE LE COMMERCE N'ÉCRIT ICI. La proposition d'origine
// prévoyait aussi des phrases de clients (« Je suis venu pour un café, j'ai
// finalement déjeuné » — Marc). C'est un champ libre publié sur la page d'un
// commerce : charge de modération permanente, risque de dérapage, et une
// collectivité ne l'hébergera pas. Les habitants s'expriment par les quatre
// réactions, qui ne sont pas du texte.
import { resolveMetier } from "@/lib/site-internet/metier-profiles";

const str = (v: unknown) => (v == null ? "" : String(v));

type Supabase = {
  from: (t: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

/** Assez pour deux phrases, trop court pour un communiqué. Au-delà, ce n'est
 *  plus une petite histoire — et ça ne tient plus sur une carte. */
export const MAX_HISTOIRE = 220;
export const MIN_HISTOIRE = 3;

export type Histoire = { texte: string; emoji: string; jour: string };

/**
 * Le pictogramme d'un métier.
 *
 * Il est figé au moment de l'écriture et non recalculé à la lecture : un
 * commerce qui change d'activité ne doit pas voir le croissant d'hier devenir
 * une paire de ciseaux.
 */
export function emojiDuMetier(activite: string): string {
  const a = str(activite).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const table: Array<[RegExp, string]> = [
    [/boulanger|patissier|viennoiser/, "🥐"],
    [/coiffeur|barbier|coiffure/, "✂️"],
    [/restaur|brasserie|bistrot|traiteur|pizz|creperie/, "🍽️"],
    [/fleuri/, "🌸"],
    [/boucher|charcut/, "🥩"],
    [/fromag/, "🧀"],
    [/caviste|vin\b|bière|brasseur/, "🍷"],
    [/cafe|salon de the|torref/, "☕"],
    [/estheti|onglerie|institut|spa|massage/, "💅"],
    [/librairie|livre/, "📚"],
    [/garage|mecani|carross/, "🔧"],
    [/opti|lunet/, "👓"],
    [/pharmac/, "💊"],
    [/primeur|marai|epicerie|superette/, "🧺"],
    [/poissonn/, "🐟"],
    [/chocolat|confiseur|glacier/, "🍫"],
    [/tatou|piercing/, "🖋️"],
    [/sport|fitness|yoga|danse/, "🤸"],
  ];
  for (const [re, e] of table) if (re.test(a)) return e;
  // Le libellé catalogué est plus fiable que la saisie libre : on retente
  // dessus avant d'abandonner.
  const label = str(resolveMetier(activite).entry?.label).toLowerCase();
  if (label && label !== a) {
    for (const [re, e] of table) if (re.test(label.normalize("NFD").replace(/[̀-ͯ]/g, ""))) return e;
  }
  // Le repli est une bulle de parole, pas un métier deviné : mieux vaut ne rien
  // dire du commerce que de lui coller la mauvaise enseigne.
  return "💬";
}

/**
 * Le texte, ramené à ce qu'une petite histoire peut être.
 *
 * Les retours à la ligne disparaissent : sur une carte, ils cassent la
 * composition et transforment une phrase en tract. Les guillemets d'ouverture
 * et de fermeture aussi — l'affichage les pose lui-même, et « « ... » » est
 * arrivé plus d'une fois par copier-coller.
 */
export function nettoyerHistoire(brut: unknown): string {
  return str(brut)
    .replace(/\s+/g, " ")
    .replace(/^["«“”\s]+|["»“”\s]+$/g, "")
    .trim()
    .slice(0, MAX_HISTOIRE);
}

export function histoireValide(texte: string): boolean {
  return texte.length >= MIN_HISTOIRE && texte.length <= MAX_HISTOIRE;
}

/** La date du jour telle que la base la stocke : la journée du commerce, à
 *  l'heure de Paris. Le serveur peut tourner ailleurs. */
export function jourParis(maintenant = new Date()): string {
  // `en-CA` rend « 2026-08-15 », le seul format que PostgreSQL lit sans
  // ambiguïté. `fr-FR` rendrait « 15/08/2026 », qui serait relu à l'envers.
  return maintenant.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
}

/**
 * Les histoires du jour des commerces dont on affiche les annonces.
 *
 * UNE SEULE LECTURE pour tout le fil : une requête par carte multiplierait les
 * allers-retours par le nombre d'annonces.
 *
 * Table absente (migration non appliquée) : une carte sans histoire, pas une
 * page en erreur.
 */
export async function histoiresDuJour(
  supabase: unknown,
  siteIds: readonly string[],
  jour = jourParis()
): Promise<Map<string, Histoire>> {
  const out = new Map<string, Histoire>();
  const ids = Array.from(new Set(siteIds.filter(Boolean)));
  if (!ids.length) return out;
  try {
    const { data, error } = await (supabase as Supabase)
      .from("human_histoire")
      .select("site_id, texte, emoji, jour")
      .in("site_id", ids)
      .eq("jour", jour)
      .is("retire_le", null);
    if (error || !Array.isArray(data)) return out;
    for (const r of data as Record<string, unknown>[]) {
      const site = str(r.site_id);
      const texte = nettoyerHistoire(r.texte);
      if (!site || !texte) continue;
      out.set(site, { texte, emoji: str(r.emoji) || "💬", jour: str(r.jour) });
    }
  } catch {
    /* table absente : des cartes sans histoire */
  }
  return out;
}

/** L'histoire d'AUJOURD'HUI d'un commerce — ce que son espace pro affiche. */
export async function histoireDuCommerce(
  supabase: unknown,
  siteId: string,
  jour = jourParis()
): Promise<Histoire | null> {
  const m = await histoiresDuJour(supabase, [siteId], jour);
  return m.get(siteId) ?? null;
}

/**
 * Écrit — ou remplace — l'histoire du jour.
 *
 * `upsert` sur (site_id, jour) : réécrire dans la journée corrige, ça n'empile
 * pas. C'est le comportement que l'écran promet, et la contrainte d'unicité le
 * garantit même si deux onglets envoient en même temps.
 */
export async function ecrireHistoire(
  supabase: unknown,
  p: { siteId: string; villeSlug: string; texte: string; emoji: string; jour?: string }
): Promise<void> {
  const texte = nettoyerHistoire(p.texte);
  if (!p.siteId || !histoireValide(texte)) throw new Error("histoire invalide");
  const { error } = await (supabase as Supabase).from("human_histoire").upsert(
    {
      site_id: p.siteId,
      ville_slug: p.villeSlug.trim().toLowerCase(),
      jour: p.jour ?? jourParis(),
      texte,
      emoji: p.emoji || "💬",
      publie_le: new Date().toISOString(),
      retire_le: null,
    },
    { onConflict: "site_id,jour" }
  );
  if (error) throw new Error(error.message);
}

/** Retire l'histoire du jour. On marque, on ne supprime pas : la ligne du jour
 *  reste, et réécrire ensuite retombe sur le même `upsert`. */
export async function retirerHistoire(supabase: unknown, siteId: string, jour = jourParis()): Promise<void> {
  const { error } = await (supabase as Supabase)
    .from("human_histoire")
    .update({ retire_le: new Date().toISOString() })
    .eq("site_id", siteId)
    .eq("jour", jour);
  if (error) throw new Error(error.message);
}
