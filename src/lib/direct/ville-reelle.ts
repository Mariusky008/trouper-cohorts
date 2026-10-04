/**
 * 🏙️ LA VRAIE VILLE — ce que `/ville/<ville>` montre, lu dans la base.
 *
 * « clikme.fr/autour-de-moi doit être calqué sur clikme.fr/ville/dax, et
 * clikme.fr/ville/dax branché sur l'admin commerçant. » « Seulement les
 * commerçants validés comme clients. » « La page est vide au départ. »
 *
 * UN SEUL ÉCRAN, DEUX SOURCES. L'écran de choix de l'application
 * (`ecran-choix.tsx`) montre la démonstration quand on ne lui donne rien, et
 * cette ville-ci quand on la lui donne : les mêmes cinq pictogrammes, le même
 * paquet de cartes, le même grand bouton. Ce fichier ne fait que le second
 * remplissage.
 *
 * CE QU'UNE CARTE MONTRE, ET D'OÙ ÇA VIENT. Chaque commerçant passe par la
 * MÊME recette que sa page (`construireFiche` puis `carteDepuisFiche`) : ce que
 * la ville dit de lui est donc exactement ce que sa page dit. On y prend, dans
 * cet ordre, la chose la plus fraîche qu'il a publiée depuis son comptoir :
 *
 *   1. « Il en reste ! » — son annonce en cours, quand c'est une relance ;
 *   2. son plat du jour (son Expérience restaurant) ;
 *   3. la pièce qu'il vient de mettre à essayer, le livre qu'il conseille ;
 *   4. son annonce en cours, quelle qu'elle soit ;
 *   5. rien de neuf : son métier, sa photo — c'est vrai, et c'est tout.
 *
 * CEUX QUI ONT QUELQUE CHOSE DE NEUF PASSENT DEVANT. Les autres restent dans le
 * paquet : un commerçant validé n'a pas à disparaître de sa ville un jour où il
 * n'a rien publié, mais il n'a pas non plus à cacher celui qui vient de le
 * faire.
 *
 * LES MESSAGES DE LA MAIRIE RESTENT. Ce sont les publications « Ma ville » du
 * fil (famille `ville`) : la seule chose de l'ancien Direct qui n'est pas
 * l'affaire d'un commerce. « Je propose de les garder » — « OK ». Les
 * événements sans commerce (une association, un concert) vont dans « Sorties ».
 *
 * FICHIER SERVEUR : il lit la base avec la clé d'administration.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { COLONNES_FICHE, construireFiche } from "@/lib/site-internet/fiche-du-site";
import { carteDepuisFiche } from "@/lib/site-internet/carte-depuis-fiche";
import { filDeVille } from "@/lib/direct/publications";
import { configVille, nomDeVille, villeSlug } from "@/lib/direct/ville";
import { ilYA } from "@/lib/site-internet/collectif";
import type { CarteAutour, CleMetier } from "@/lib/direct/apercu-habitant";
import type { CleCategorie } from "@/lib/direct/choisir-commerce";

const str = (v: unknown) => (v == null ? "" : String(v));

/** Une carte du paquet, telle que l'écran de choix l'affiche. */
export type VueVille = {
  id: string;
  photo: string;
  nom: string;
  quoi: string;
  prix: string;
  heure: string;
  vignette: string;
  distance: string;
  ville: string;
  /** Où mène le grand bouton : sa page. */
  lien?: string;
  /** Vrai s'il a publié quelque chose qui est encore vrai. */
  neuf?: boolean;
};

/** Un message de la mairie. */
export type MessageVille = { id: string; qui: string; texte: string; photo?: string; lien?: string; quand: string };

export type VilleReelle = {
  slug: string;
  nom: string;
  categories: Record<CleCategorie, VueVille[]>;
  mairie: MessageVille[];
};

/** La branche d'un commerce, rangée sous l'un des cinq pictogrammes. */
export function categorieDeLaBranche(b: CleMetier): CleCategorie {
  if (b === "restaurant") return "restaurants";
  if (b === "bar") return "sorties";
  if (b === "coiffeur" || b === "ongles") return "beaute";
  if (b === "mode" || b === "lunetier") return "mode";
  return "commerces";
}

/** Une photo affichable dans une carte — les vignettes `data:` de sa galerie le sont aussi. */
const affichable = (u?: string) => (u && /^(https?:\/\/|data:image\/|\/)/i.test(u) ? u : "");

/**
 * LA CARTE D'UN COMMERÇANT : la chose la plus fraîche qu'il a publiée.
 * Voir l'ordre en tête de fichier.
 */
export function vueDuCommercant(c: CarteAutour, slug: string): VueVille | null {
  const fond = affichable(c.couverture) || affichable(c.photo) || affichable(c.sesPhotos?.[0]?.src);
  const o = c.offreDuMoment;
  const piece = (c.catalogue ?? []).find((a) => a.photo && /^https:\/\//i.test(a.photo) && !a.id.startsWith(`${slug}-`));
  let photo = fond;
  let quoi = c.metier;
  let prix = "";
  let neuf = true;
  if (o?.reste) {
    photo = affichable(o.photo) || affichable(c.menu?.photo) || fond;
    quoi = `Il en reste ! ${o.texte}`;
  } else if (c.menu?.plat) {
    photo = affichable(c.menu.photo) || fond;
    quoi = c.menu.plat;
    prix = c.menu.prix ?? "";
  } else if (piece) {
    photo = affichable(piece.photo) || fond;
    quoi = piece.nom;
    prix = piece.prix ?? "";
  } else if (o) {
    photo = affichable(o.photo) || fond;
    quoi = o.texte;
  } else {
    neuf = false;
  }
  // SANS AUCUNE PHOTO, PAS DE CARTE. Le paquet est fait d'images : une carte
  // noire au milieu se lirait comme une panne, pas comme un commerce.
  if (!photo) return null;
  return {
    id: slug,
    photo,
    nom: c.nom,
    quoi: quoi.length > 90 ? `${quoi.slice(0, 88).trimEnd()}…` : quoi,
    prix,
    heure: "",
    vignette: affichable(c.photo) && affichable(c.photo) !== photo ? affichable(c.photo) : "",
    distance: "",
    ville: c.ville,
    lien: `/site-internet/apercu/${slug}`,
    neuf,
  };
}

/** LIRE LA VILLE. Une base absente rend une ville vide — l'écran le dit. */
export async function lireLaVilleReelle(ville: string): Promise<VilleReelle> {
  const slug = villeSlug(ville);
  const categories: Record<CleCategorie, VueVille[]> = { mode: [], restaurants: [], beaute: [], sorties: [], commerces: [] };
  // « saint-paul-les-dax » → « Saint-Paul-les-Dax », tant que la base n'a pas dit mieux.
  const vide: VilleReelle = { slug, nom: nomDeVille(slug.replace(/-/g, " ")) || ville, categories, mairie: [] };
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    return vide;
  }
  const cfg = await configVille(supabase, slug).catch(() => null);
  const nom = cfg?.nom || vide.nom;

  // ── LES COMMERÇANTS VALIDÉS DE LA VILLE ──
  // Même filtre large puis fin que `configVille` : le champ dit « Dax »,
  // « Dax, France » ou « 40100 Dax », et seul le slug tranche.
  const colle = (c: string) => {
    const cs = villeSlug(c);
    return cs === slug || cs.startsWith(`${slug}-`) || cs.endsWith(`-${slug}`);
  };
  let rows: Record<string, unknown>[] = [];
  try {
    const { data } = await supabase
      .from("human_vitrine_sites")
      .select(`${COLONNES_FICHE}, slug`)
      .eq("channel", "letter")
      .eq("est_client", true)
      .ilike("city", `%${slug.replace(/-/g, " ")}%`)
      .limit(300);
    rows = ((Array.isArray(data) ? data : []) as Record<string, unknown>[]).filter((r) => colle(str(r.city)));
  } catch {
    rows = [];
  }

  // SES PRESTATIONS, en une lecture pour tous — colonne récente, lue à part.
  const services = new Map<string, unknown>();
  if (rows.length) {
    try {
      const { data } = await supabase.from("human_vitrine_sites").select("id, services").in("id", rows.map((r) => str(r.id)));
      for (const r of (Array.isArray(data) ? data : []) as Record<string, unknown>[]) services.set(str(r.id), r.services);
    } catch {
      /* colonne non migrée */
    }
  }

  for (const r of rows) {
    const s = str(r.slug);
    if (!s) continue;
    try {
      const { fiche } = construireFiche(s, r, { services: services.get(str(r.id)) });
      const carte = carteDepuisFiche(fiche);
      const vue = vueDuCommercant(carte, s);
      if (vue) categories[categorieDeLaBranche(carte.branche)].push(vue);
    } catch {
      /* une fiche illisible ne vide pas la ville */
    }
  }
  for (const k of Object.keys(categories) as CleCategorie[]) {
    categories[k].sort((a, b) => Number(Boolean(b.neuf)) - Number(Boolean(a.neuf)));
  }

  // ── LA MAIRIE, ET LES ÉVÉNEMENTS QUI NE SONT PAS D'UN COMMERCE ──
  const mairie: MessageVille[] = [];
  try {
    const pubs = await filDeVille(supabase, slug, { fenetreLarge: true });
    for (const p of pubs) {
      if (p.famille === "ville") {
        mairie.push({
          id: p.id,
          qui: p.auteurNom || `Mairie de ${nom}`,
          texte: p.texte,
          photo: affichable(p.photo ?? undefined) || undefined,
          lien: p.lien || undefined,
          quand: ilYA(p.publieLe),
        });
      } else if (p.famille === "evenement" && !p.siteId && affichable(p.photo ?? undefined)) {
        categories.sorties.push({
          id: p.id,
          photo: affichable(p.photo ?? undefined),
          nom: p.auteurNom || "Dans la ville",
          quoi: p.texte.length > 90 ? `${p.texte.slice(0, 88).trimEnd()}…` : p.texte,
          prix: "",
          heure: "",
          vignette: "",
          distance: "",
          ville: nom,
          lien: p.lien || undefined,
          neuf: true,
        });
      }
    }
  } catch {
    /* fil indisponible → pas de message, la ville reste */
  }

  return { ...vide, nom, mairie: mairie.slice(0, 12) };
}
