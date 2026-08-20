// LE DIRECT — lecture du fil d'une ville.
//
// Le principe directeur, qui tranche toutes les décisions de ce module : ce
// n'est pas un catalogue, c'est le pouls de la ville en temps réel. Une
// publication expirée ne s'affiche pas, même si le fil devient court. Un fil
// court est une information vraie ; un fil rempli d'annonces d'hier est un
// mensonge qui coûte la confiance au deuxième usage.
import { resolveMetier } from "@/lib/site-internet/metier-profiles";
import { lirePrix } from "./prix";

const str = (v: unknown) => (v == null ? "" : String(v));

// Le client Supabase est typé de façon lâche : ce module est appelé aussi bien
// depuis une page que depuis une route, et n'a rien à savoir de la génération
// de types.
type Supabase = {
  from: (t: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
  rpc?: (fn: string, args: Record<string, unknown>) => PromiseLike<unknown>;
};

/** Les familles. L'ordre est celui des filtres à l'écran.
 *
 *  `menu` — le plat du jour — n'est pas une offre comme une autre : il expire à
 *  la fin du service, il remonte en tête entre 10 h et 14 h, et il est réservé
 *  à la restauration. Trois comportements différents : trois raisons de ne pas
 *  le confondre avec `offre`. Les règles vivent dans `dejeuner.ts`. */
export const FAMILLES = ["place", "offre", "menu", "evenement", "ville"] as const;
export type Famille = (typeof FAMILLES)[number];

export const FAMILLE_LABEL: Record<Famille, string> = {
  place: "Place libre",
  offre: "Offre",
  menu: "Plat du jour",
  evenement: "Événement",
  ville: "Ma ville",
};

export function estFamille(v: unknown): v is Famille {
  return typeof v === "string" && (FAMILLES as readonly string[]).includes(v);
}

// Une publication sans échéance annoncée sort du fil au bout de trois jours.
//
// Le commerçant qui n'a pas fixé de limite n'a pas dit « pour toujours », il a
// dit « je ne sais pas ». Sans cette borne, la première annonce publiée resterait
// en tête du fil d'une petite ville pendant des semaines — et Le Direct
// deviendrait exactement le catalogue qu'il refuse d'être.
export const FENETRE_SANS_ECHEANCE_MS = 3 * 24 * 3600 * 1000;

// Fenêtre du fil quand la ville est encore calme (cf. règle de dégradation du
// compteur) : on regarde sept jours en arrière plutôt que la seule journée.
export const FENETRE_LARGE_MS = 7 * 24 * 3600 * 1000;

export type Publication = {
  id: string;
  famille: Famille;
  texte: string;
  photo: string | null;
  video: string | null;
  lien: string | null;
  auteurNom: string;
  auteurMetier: string;
  auteurSlug: string;
  siteId: string | null;
  publieLe: string;
  expireLe: string | null;
  /** Coordonnées de l'auteur, quand on les a. Sert au calcul de distance. */
  lat: number | null;
  lng: number | null;
  /** Quartier de l'auteur — le repli d'affichage quand la position est refusée. */
  quartier: string;
  /** CE QU'IL RESTE, en clair : « 2 tables », « 3 parts ». Saisi par le
   *  commerçant, jamais déduit — nous ne savons pas ce qu'il lui reste. */
  reste: string;
  /** L'adresse de sa carte du jour, affichée « Voir l'ardoise ». */
  ardoise: string | null;
  /** LE PRIX ANNONCÉ, en euros. `null` quand le commerçant n'en annonce pas —
   *  et c'est le cas courant : seule la carte du jour le demande, parce que
   *  c'est la première question qu'on se pose en comparant six menus à midi. */
  prix: number | null;
};

type Row = Record<string, unknown>;

// LES COLONNES RÉCENTES SONT DEMANDÉES À PART.
//
// PostgREST refuse TOUTE la requête quand une seule colonne demandée n'existe
// pas. Une migration non appliquée ne doit pas vider le fil d'une ville : on
// tente avec, et on retente sans. C'est exactement la leçon de `nom_facon`, qui
// avait fait disparaître les trois façons d'une annonce en silence.
const CHAMPS_BASE =
  "id, famille, texte, photo, video, lien, auteur_nom, auteur_metier, auteur_slug, site_id, publie_le, expire_le";
const CHAMPS_RECENTS = "reste, ardoise, prix";
const CHAMPS = `${CHAMPS_BASE}, ${CHAMPS_RECENTS}`;

/** Vrai quand l'erreur PostgREST dit « cette colonne n'existe pas ».
 *
 *  On teste les formulations de PostgREST, pas les noms de colonnes : `reste`
 *  est un mot trop courant pour servir de signal — il apparaîtrait dans des
 *  messages qui n'ont rien à voir, et on retenterait des requêtes saines. */
function colonneAbsente(e: unknown): boolean {
  return /does not exist|schema cache|Could not find|42703|PGRST204/i.test(String(e));
}

/** Les colonnes sans lesquelles une publication ne veut plus rien dire. On ne
 *  les sacrifie jamais pour faire passer une écriture : une annonce sans texte
 *  ni ville serait une ligne muette dans le fil de quelqu'un. */
const INDISPENSABLES = new Set(["ville", "ville_slug", "famille", "texte"]);

/**
 * Le nom de la colonne que la base dit ne pas connaître.
 *
 * Les deux formulations rencontrées, et elles ne se ressemblent pas :
 *   PostgREST — « Could not find the 'video' column of 'human_publications'… »
 *   Postgres  — « column "video" of relation "human_publications" does not exist »
 */
function colonneNommee(e: unknown): string | null {
  const m = /'([a-z_]+)' column|column "([a-z_]+)"/i.exec(String(e));
  return m ? m[1] || m[2] : null;
}

/**
 * Lance `construire(champs)` avec les colonnes récentes, puis sans elles si la
 * base ne les connaît pas encore.
 */
async function avecRepli(construire: (champs: string) => PromiseLike<{ data: unknown; error: unknown }>): Promise<Row[]> {
  let { data, error } = await construire(CHAMPS);
  if (error && colonneAbsente(error)) ({ data, error } = await construire(CHAMPS_BASE));
  if (error) throw new Error(String((error as { message?: string })?.message ?? error));
  return Array.isArray(data) ? (data as Row[]) : [];
}

function lirePublication(r: Row, site?: Row | null): Publication | null {
  const texte = str(r.texte).trim();
  if (!texte) return null;
  const famille = estFamille(r.famille) ? r.famille : "offre";
  const nLat = site?.latitude;
  const nLng = site?.longitude;
  return {
    id: str(r.id),
    famille,
    texte,
    photo: str(r.photo) || null,
    video: str(r.video) || null,
    lien: str(r.lien) || null,
    auteurNom: str(r.auteur_nom) || (famille === "ville" ? "Ma ville" : "Un commerce"),
    auteurMetier: str(r.auteur_metier),
    auteurSlug: str(r.auteur_slug),
    siteId: str(r.site_id) || null,
    publieLe: str(r.publie_le),
    expireLe: str(r.expire_le) || null,
    lat: typeof nLat === "number" ? nLat : null,
    lng: typeof nLng === "number" ? nLng : null,
    quartier: str(site?.quartier),
    reste: str(r.reste).trim().slice(0, 40),
    // Relu à la sortie autant qu'à l'entrée : une ligne écrite avant ce contrôle,
    // ou par une autre voie, ne doit pas poser un `javascript:` sur la page
    // d'accueil d'une ville.
    ardoise: /^https?:\/\//i.test(str(r.ardoise)) ? str(r.ardoise) : null,
    prix: lirePrix(r.prix),
  };
}

/** Vivante = ni retirée, ni expirée, ni plus vieille que la fenêtre. */
export function estVivante(p: Publication, maintenant = Date.now(), fenetreMs = FENETRE_SANS_ECHEANCE_MS): boolean {
  if (p.expireLe) {
    const t = Date.parse(p.expireLe);
    return Number.isFinite(t) ? t > maintenant : true;
  }
  const t = Date.parse(p.publieLe);
  if (!Number.isFinite(t)) return false;
  return maintenant - t < fenetreMs;
}

/**
 * Le fil d'une ville.
 *
 * `fenetreLarge` applique la règle de dégradation : quand la ville n'a pas
 * encore le volume qui rend un fil du jour intéressant, on regarde sept jours en
 * arrière plutôt que d'afficher trois cartes. C'est un élargissement de fenêtre,
 * jamais un remplissage : rien n'est inventé, on montre simplement plus loin.
 */
export async function filDeVille(
  supabase: Supabase,
  villeSlug: string,
  opts: { fenetreLarge?: boolean; max?: number } = {}
): Promise<Publication[]> {
  const slug = villeSlug.trim().toLowerCase();
  if (!slug) return [];
  const fenetre = opts.fenetreLarge ? FENETRE_LARGE_MS : FENETRE_SANS_ECHEANCE_MS;
  // La fenêtre borne les publications SANS échéance, jamais celles qui en ont
  // une. Une offre annoncée « jusqu'au 30 » disparaissait du fil au bout de
  // trois jours alors qu'elle courait encore — et qu'elle restait affichée sur
  // le bandeau du commerçant. Le filtre SQL laisse donc passer tout ce qui a une
  // échéance future ; `estVivante` tranche ensuite, avec la même règle qu'ici.
  const depuis = new Date(Date.now() - fenetre).toISOString();
  const maintenantIso = new Date().toISOString();

  let rows: Row[] = [];
  try {
    rows = await avecRepli((champs) =>
      supabase
        .from("human_publications")
        .select(champs)
        .eq("ville_slug", slug)
        .is("retire_le", null)
        .or(`publie_le.gte.${depuis},expire_le.gt.${maintenantIso}`)
        .order("publie_le", { ascending: false })
        .limit(opts.max ?? 200)
    );
  } catch {
    // Table absente (migration non appliquée) : un fil vide, pas une page en
    // erreur. L'écran a déjà son état « rien pour l'instant ».
    return [];
  }

  // Les coordonnées et le quartier vivent sur la fiche du commerce, pas sur la
  // publication : ils changent rarement, et les recopier à chaque publication
  // figerait une adresse au moment où le commerce déménage.
  const ids = Array.from(new Set(rows.map((r) => str(r.site_id)).filter(Boolean)));
  const sites = new Map<string, Row>();
  if (ids.length) {
    try {
      const { data } = await supabase
        .from("human_vitrine_sites")
        .select("id, latitude, longitude, quartier")
        .in("id", ids);
      for (const s of (Array.isArray(data) ? data : []) as Row[]) sites.set(str(s.id), s);
    } catch {
      /* colonnes non migrées → repli sur le quartier vide, puis la ville */
    }
  }

  const maintenant = Date.now();
  return rows
    .map((r) => lirePublication(r, sites.get(str(r.site_id)) ?? null))
    .filter((p): p is Publication => p !== null)
    .filter((p) => estVivante(p, maintenant, fenetre));
}

/** Les publications d'un commerce — pour sa page, en application ou en autonome. */
export async function filDeCommerce(supabase: Supabase, siteId: string, max = 12): Promise<Publication[]> {
  if (!siteId) return [];
  try {
    const rows = await avecRepli((champs) =>
      supabase
        .from("human_publications")
        .select(champs)
        .eq("site_id", siteId)
        .is("retire_le", null)
        .order("publie_le", { ascending: false })
        .limit(max)
    );
    const maintenant = Date.now();
    return rows
      .map((r) => lirePublication(r))
      .filter((p): p is Publication => p !== null)
      .filter((p) => estVivante(p, maintenant));
  } catch {
    return [];
  }
}

/**
 * Écrit une publication. Point d'entrée UNIQUE — la route pro et l'espace ville
 * passent tous les deux par ici, pour que la dénormalisation de l'auteur soit
 * faite au même endroit et de la même façon.
 */
export async function publier(
  supabase: Supabase,
  p: {
    villeSlug: string;
    ville: string;
    famille: Famille;
    texte: string;
    photo?: string | null;
    video?: string | null;
    lien?: string | null;
    expireLe?: string | null;
    /** « 2 tables » — ce qu'il reste, tel que le commerçant l'a écrit. */
    reste?: string | null;
    /** L'adresse de sa carte du jour. */
    ardoise?: string | null;
    /** Le prix annoncé, en euros. Facultatif partout sauf dans l'intention. */
    prix?: number | null;
    site?: { id: string; slug: string; nom: string; activite: string } | null;
  }
): Promise<{ id?: string; erreur?: string } | null> {
  const texte = p.texte.trim();
  if (!texte || !p.villeSlug.trim()) return { erreur: "Annonce vide ou ville inconnue." };
  const metier = p.site ? resolveMetier(p.site.activite).entry?.label ?? p.site.activite : "";
  const base = {
    ville: p.ville,
    ville_slug: p.villeSlug.trim().toLowerCase(),
    site_id: p.site?.id ?? null,
    auteur_nom: p.site?.nom ?? "",
    auteur_metier: metier,
    auteur_slug: p.site?.slug ?? "",
    famille: p.famille,
    texte,
    photo: p.photo ?? null,
    video: p.video ?? null,
    lien: p.lien ?? null,
    expire_le: p.expireLe ?? null,
  };
  const recents = {
    reste: (p.reste ?? "").trim().slice(0, 40) || null,
    ardoise: /^https?:\/\//i.test(p.ardoise ?? "") ? (p.ardoise as string).slice(0, 500) : null,
    prix: lirePrix(p.prix),
  };
  const inserer = (ligne: Record<string, unknown>) =>
    supabase.from("human_publications").insert(ligne).select("id").maybeSingle();

  // ON LAISSE TOMBER LA COLONNE QUE LA BASE NOMME, ET ON RECOMMENCE.
  //
  // L'ancien repli retirait un lot FIXE (`reste`, `ardoise`, `prix`) et
  // réessayait une seule fois. Une base en retard d'une autre migration — `video`,
  // par exemple — faisait donc échouer les DEUX tentatives, et plus aucune
  // annonce n'atteignait le fil de la ville. Sans un mot : voir plus bas.
  //
  // On lit maintenant le nom de la colonne dans le message, on l'enlève, on
  // recommence. Une annonce qui perd son prix reste une annonce ; une annonce
  // refusée n'existe pas.
  const ligne: Record<string, unknown> = { ...base, ...recents };
  const perdues: string[] = [];
  let dernier = "";
  for (let essai = 0; essai < 6; essai++) {
    const { data, error } = await inserer(ligne);
    if (!error) {
      const id = str((data as Row | null)?.id);
      return id
        ? { id, erreur: perdues.length ? `Colonnes absentes en base : ${perdues.join(", ")}.` : undefined }
        : { erreur: "La base n'a rien renvoyé après l'écriture." };
    }
    dernier = String((error as { message?: string })?.message ?? error);
    const nom = colonneNommee(dernier);
    if (nom && nom in ligne && !INDISPENSABLES.has(nom)) {
      delete ligne[nom];
      perdues.push(nom);
      continue;
    }
    // LA FAMILLE REFUSÉE : on publie quand même, dans la famille par défaut.
    //
    // `menu` demande la migration `20260812120000_famille_menu`. Sans elle, la
    // contrainte rejetait la ligne entière — et la carte du jour d'un
    // restaurateur disparaissait au lieu de simplement manquer son onglet.
    // Perdre l'onglet « Déjeuner » est un défaut ; perdre l'annonce en est un
    // autre, bien pire.
    if (/famille/.test(dernier) && /check constraint|violates/i.test(dernier) && ligne.famille !== "offre") {
      ligne.famille = "offre";
      perdues.push(`famille « ${p.famille} » refusée`);
      continue;
    }
    break;
  }
  return { erreur: dernier || "Écriture refusée par la base." };
}

/**
 * Retire TOUTES les publications vivantes d'un commerce.
 *
 * Appelée quand il remplace ou annule son offre : son écran lui promet une seule
 * offre en cours, le fil doit dire la même chose. On marque, on ne supprime pas
 * — les gardées des habitants pointent dessus.
 */
export async function retirerToutesDe(supabase: Supabase, siteId: string): Promise<void> {
  if (!siteId) return;
  try {
    await supabase
      .from("human_publications")
      .update({ retire_le: new Date().toISOString() })
      .eq("site_id", siteId)
      .is("retire_le", null);
  } catch {
    /* table absente → rien à retirer */
  }
}

/**
 * Ne garde que les `garder` publications les plus récentes d'un commerce, et
 * retire les plus anciennes.
 *
 * Un plafond, pas une exclusivité : plusieurs annonces peuvent coexister — une
 * fournée du matin et des invendus du soir n'ont rien à voir. Mais le fil est
 * le bien commun d'une ville : sans borne, un commerce prolixe occuperait à lui
 * seul l'écran d'accueil de tous les habitants.
 */
export async function limiterVivantes(supabase: Supabase, siteId: string, garder: number): Promise<void> {
  if (!siteId || garder < 0) return;
  try {
    const { data } = await supabase
      .from("human_publications")
      .select("id")
      .eq("site_id", siteId)
      .is("retire_le", null)
      .order("publie_le", { ascending: false });
    const ids = ((Array.isArray(data) ? data : []) as Array<Record<string, unknown>>)
      .map((r) => str(r.id))
      .filter(Boolean)
      .slice(garder);
    if (!ids.length) return;
    await supabase
      .from("human_publications")
      .update({ retire_le: new Date().toISOString() })
      .in("id", ids);
  } catch {
    /* table absente → rien à limiter */
  }
}

/**
 * SES ANNONCES PASSÉES — celles qui sont terminées ou qu'il a retirées.
 *
 * PAS DE NOUVELLE TABLE : une annonce retirée n'est pas supprimée, elle porte
 * un `retire_le`. L'historique qu'il demande existait déjà en base, personne ne
 * le lui montrait. Une table « historique » aurait dupliqué la même vérité à
 * deux endroits, et l'un des deux aurait fini par mentir.
 *
 * Sert à REPRENDRE un texte : un commerçant republie souvent la même chose (le
 * plat du jeudi, la fournée du samedi). Le retaper à chaque fois est la
 * première raison de ne pas republier du tout.
 */
export async function siennesPassees(supabase: Supabase, siteId: string, max = 12): Promise<Publication[]> {
  if (!siteId) return [];
  try {
    // `retire_le` EN PLUS des champs habituels : c'est lui qui distingue une
    // annonce retirée à la main d'une annonce simplement expirée, et les deux
    // sont « passées ».
    const rows = await avecRepli((champs) =>
      supabase
        .from("human_publications")
        .select(`${champs}, retire_le`)
        .eq("site_id", siteId)
        .order("publie_le", { ascending: false })
        .limit(60)
    );
    const maintenant = Date.now();
    const out: Publication[] = [];
    // On garde la ligne brute AVEC sa publication : filtrer d'abord puis relire
    // `rows[i]` désaligne les index dès qu'une ligne est écartée.
    for (const r of rows) {
      const pub = lirePublication(r);
      if (!pub) continue;
      const retiree = str(r.retire_le) !== "";
      if (!retiree && estVivante(pub, maintenant)) continue;
      out.push(pub);
      if (out.length >= max) break;
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Les publications VIVANTES d'un commerce, pour son espace pro.
 *
 * Il n'avait aucun moyen de voir ce qui tourne à son nom : il publiait, et
 * l'annonce lui échappait. Trois peuvent coexister — sans liste, il ne savait
 * même pas lesquelles.
 */
export async function siennesVivantes(supabase: Supabase, siteId: string): Promise<Publication[]> {
  if (!siteId) return [];
  try {
    const rows = await avecRepli((champs) =>
      supabase
        .from("human_publications")
        .select(champs)
        .eq("site_id", siteId)
        .is("retire_le", null)
        .order("publie_le", { ascending: false })
        .limit(20)
    );
    const maintenant = Date.now();
    return rows
      .map((r) => lirePublication(r))
      .filter((p): p is Publication => p !== null)
      .filter((p) => estVivante(p, maintenant));
  } catch {
    return [];
  }
}

/**
 * Repousse l'échéance d'une annonce. « La remettre pour demain » sans la
 * réécrire : le commerçant qui a une place libre chaque jeudi ne devrait pas
 * retaper la même phrase toutes les semaines.
 *
 * L'appartenance est vérifiée dans la requête même (`site_id`) : sans elle, un
 * jeton pro permettrait de prolonger l'annonce d'un voisin.
 */
export async function prolonger(
  supabase: Supabase,
  id: string,
  siteId: string,
  expireLe: string | null
): Promise<boolean> {
  if (!id || !siteId) return false;
  try {
    const { error } = await supabase
      .from("human_publications")
      // `publie_le` avance aussi : une annonce prolongée est de nouveau
      // d'actualité, et le fil est chronologique. La laisser à sa date d'origine
      // la renverrait tout en bas, invisible — prolonger n'aurait servi à rien.
      .update({ expire_le: expireLe, publie_le: new Date().toISOString() })
      .eq("id", id)
      .eq("site_id", siteId)
      .is("retire_le", null);
    return !error;
  } catch {
    return false;
  }
}

/** Retrait par l'auteur. On marque plutôt que de supprimer : les gardées des
 *  habitants pointent dessus, et une disparition doit pouvoir s'expliquer. */
export async function retirer(supabase: Supabase, id: string, siteId: string): Promise<boolean> {
  if (!id || !siteId) return false;
  try {
    const { error } = await supabase
      .from("human_publications")
      .update({ retire_le: new Date().toISOString() })
      .eq("id", id)
      .eq("site_id", siteId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Note qu'un lot de publications a été affiché.
 *
 * Appelée après le rendu du fil, jamais pendant : si le comptage échoue, la page
 * est déjà partie. Un commerçant préfère un compteur légèrement bas à une page
 * qui ne s'affiche pas.
 *
 * Le chiffre compte des AFFICHAGES, pas des personnes : dédupliquer demanderait
 * d'identifier chaque lecteur, donc de poser une ligne pour quelqu'un qui ne
 * fait que lire — ce que Le Direct s'interdit.
 */
export async function noterAffichages(supabase: Supabase, publications: Publication[]): Promise<void> {
  const ids = publications.map((p) => p.id).filter(Boolean);
  if (!ids.length || typeof supabase.rpc !== "function") return;
  try {
    await supabase.rpc("increment_publication_views", { ids });
  } catch {
    /* fonction absente (migration non appliquée) → on ne compte simplement pas */
  }
}

/** Note qu'une publication a mené quelqu'un chez le commerçant. */
export async function noterClic(supabase: Supabase, id: string): Promise<void> {
  if (!id || typeof supabase.rpc !== "function") return;
  try {
    await supabase.rpc("increment_publication_click", { pid: id });
  } catch {
    /* idem */
  }
}
