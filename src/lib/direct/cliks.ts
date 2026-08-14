// LES CLIKS, CÔTÉ HABITANT.
//
// Deux mécaniques, un seul module — comme en base, et pour la même raison :
// elles partagent le commerce, l'échéance, le statut et l'annonce d'origine.
//
//   'cadeau'    → un stock d'avantages qui S'ÉPUISE. On sait tout de suite ce
//                 qu'on a. Le ressort est la rareté immédiate.
//   'collectif' → un objectif qui SE REMPLIT. On ne sait qu'à la fin, mais on
//                 peut faire basculer le groupe. Le ressort est l'imminence.
//
// CE MODULE NE DESSINE RIEN. Il dit ce qui est vrai d'une campagne à un instant
// donné, et l'écran en tire les conséquences. C'est ce qui permet de tester les
// règles sans monter un navigateur — et elles ont besoin de l'être : « il reste
// 2 places » et « il manque 2 personnes » sont deux phrases opposées que la même
// donnée pourrait produire.

const str = (v: unknown) => (v == null ? "" : String(v));
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// La même convention que `publications.ts` : PostgREST se chaîne trop librement
// pour qu'un type structurel écrit à la main tienne, et dix formes recopiées
// pour dix requêtes ne protègent de rien. Une seule ligne assumée vaut mieux.
type Supabase = {
  from: (t: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export const TYPES_CLIK = ["cadeau", "collectif"] as const;
export type TypeClik = (typeof TYPES_CLIK)[number];

export type Campagne = {
  id: string;
  siteId: string;
  publicationId: string | null;
  villeSlug: string;
  type: TypeClik;
  titre: string;
  objectif: number | null;
  participants: number;
  prixInitial: number | null;
  prixGroupe: number | null;
  echeance: string;
  statut: string;
  /** Renseigné pour les campagnes « cadeau » uniquement. */
  restants: number | null;
  total: number | null;
  /** CE QU'IL Y A DANS LE STOCK, avant d'appuyer. La séquence est figée et
   *  mélangée, donc on ne peut pas promettre un avantage précis — mais on peut
   *  et on DOIT dire ce qu'on peut obtenir et à quelle condition. Sans ça, on
   *  demande d'appuyer à l'aveugle, et la condition d'achat se découvre une
   *  fois engagé : c'est le meilleur moyen de la faire passer pour un piège. */
  aGagner: string[];
  conditions: string[];
};

/** L'état d'une campagne pour l'habitant qui la regarde. */
export type EtatClik =
  | "ouverte" // on peut rejoindre / prendre
  | "presque" // collectif à qui il manque peu : c'est LE moment d'appuyer
  | "complete" // objectif atteint, prix débloqué pour tout le monde
  | "epuise" // cadeau : plus rien dans le stock
  | "terminee"; // échéance passée, ou campagne close

/** « Proche du seuil », la même valeur que le tri du fil. Les deux doivent dire
 *  le même mot au même moment : un fil qui remonte une carte que l'écran
 *  n'annonce pas comme urgente rend le tri incompréhensible. */
export const PRESQUE = 2;

export function etatDe(c: Campagne, maintenant: number = Date.now()): EtatClik {
  const fin = Date.parse(str(c.echeance));
  const finie = Number.isFinite(fin) && fin <= maintenant;
  if (finie || c.statut === "terminee" || c.statut === "annulee" || c.statut === "echouee") return "terminee";

  if (c.type === "cadeau") {
    return (c.restants ?? 0) > 0 ? "ouverte" : "epuise";
  }

  const obj = c.objectif ?? 0;
  if (obj > 0 && c.participants >= obj) return "complete";
  const manque = obj - c.participants;
  return manque > 0 && manque <= PRESQUE ? "presque" : "ouverte";
}

/** Combien il manque de personnes. `0` quand l'objectif est atteint ou hors sujet. */
export function manque(c: Campagne): number {
  if (c.type !== "collectif" || !c.objectif) return 0;
  return Math.max(0, c.objectif - c.participants);
}

/**
 * La phrase de la carte, côté habitant.
 *
 * Elle est ici et pas dans l'écran parce que c'est une RÈGLE, pas une décoration :
 * un collectif qui affiche « 4 personnes participent » raconte le passé, alors
 * que « Encore 2 et le prix baisse » dit ce que le geste change. La deuxième
 * formulation est la seule qui donne une raison d'appuyer.
 */
export function phraseClik(c: Campagne, maintenant: number = Date.now()): string {
  const e = etatDe(c, maintenant);
  if (e === "terminee") return "C'est fini";
  if (c.type === "cadeau") {
    const r = c.restants ?? 0;
    if (r <= 0) return "Tout est parti";
    return r === 1 ? "Il en reste 1" : `Il en reste ${r}`;
  }
  if (e === "complete") return "C'est débloqué pour tout le monde";
  const m = manque(c);
  return m === 1 ? "Encore 1 personne et le prix baisse" : `Encore ${m} personnes et le prix baisse`;
}

/** La remise, en pourcentage entier. `null` si elle n'a pas de sens. */
export function remise(c: Campagne): number | null {
  if (c.type !== "collectif" || !c.prixInitial || !c.prixGroupe) return null;
  if (c.prixInitial <= 0 || c.prixGroupe >= c.prixInitial) return null;
  return Math.round(((c.prixInitial - c.prixGroupe) / c.prixInitial) * 100);
}

/**
 * L'avancement, entre 0 et 1.
 *
 * Jamais 0 exact pour une campagne qui a au moins un participant : une jauge
 * vide alors que quelqu'un s'est engagé donne l'impression que le clic n'a rien
 * fait. On plancher à 6 % — assez pour se voir, trop peu pour mentir.
 */
export function avancement(c: Campagne): number {
  if (c.type === "cadeau") {
    const t = c.total ?? 0;
    if (t <= 0) return 0;
    const pris = t - (c.restants ?? 0);
    return Math.max(0, Math.min(1, pris / t));
  }
  const obj = c.objectif ?? 0;
  if (obj <= 0) return 0;
  const p = Math.max(0, Math.min(1, c.participants / obj));
  return p > 0 && p < 0.06 ? 0.06 : p;
}

/** Traduit une ligne PostgREST. Tolérant : une colonne absente ne doit pas
 *  faire disparaître la campagne du fil. */
export function versCampagne(r: Record<string, unknown>, restants?: number, total?: number): Campagne {
  const type: TypeClik = str(r.type) === "cadeau" ? "cadeau" : "collectif";
  return {
    id: str(r.id),
    siteId: str(r.site_id),
    publicationId: str(r.publication_id) || null,
    villeSlug: str(r.ville_slug),
    type,
    titre: str(r.titre),
    objectif: r.objectif == null ? null : num(r.objectif),
    participants: num(r.participants),
    prixInitial: r.prix_initial == null ? null : num(r.prix_initial),
    prixGroupe: r.prix_groupe == null ? null : num(r.prix_groupe),
    echeance: str(r.echeance),
    statut: str(r.statut),
    restants: restants == null ? null : restants,
    total: total == null ? null : total,
    aGagner: [],
    conditions: [],
  };
}

/** Les libellés distincts d'une liste de récompenses, dans l'ordre rencontré.
 *  Distincts : dix parts de gâteau ne doivent pas s'écrire dix fois. */
function distincts(v: readonly string[]): string[] {
  const vus = new Set<string>();
  const out: string[] = [];
  for (const x of v) {
    const t = x.trim();
    if (!t || vus.has(t)) continue;
    vus.add(t);
    out.push(t);
  }
  return out;
}


/**
 * Les campagnes vivantes d'une ville, avec le stock des « cadeau ».
 *
 * Deux requêtes plutôt qu'une jointure : PostgREST sait agréger, mais compter
 * les récompenses restantes par campagne demande un `group by` qui ne passe pas
 * par le filtre de sélection. Deux lectures simples sont ici plus lisibles que
 * la vue qu'il faudrait maintenir en face.
 *
 * Une campagne dont la table n'existe pas encore ne doit PAS casser le fil :
 * l'erreur est avalée et le fil s'affiche sans Cliks. Le Direct sans Cliks reste
 * utile ; une page blanche, non.
 */
export async function cliksDeVille(supabase: unknown, villeSlug: string): Promise<Campagne[]> {
  const sb = supabase as Supabase;
  try {
    const { data, error } = await sb
      .from("clik_campaign")
      .select("id, site_id, publication_id, ville_slug, type, titre, objectif, participants, prix_initial, prix_groupe, echeance, statut")
      .eq("ville_slug", villeSlug);
    if (error || !Array.isArray(data)) return [];

    const lignes = data as Record<string, unknown>[];
    const vivantes = lignes.filter((r) => ["active", "debloquee"].includes(str(r.statut)));
    if (!vivantes.length) return [];

    // Le stock, uniquement pour les « cadeau » — les collectifs n'en ont pas.
    const idsCadeau = vivantes.filter((r) => str(r.type) === "cadeau").map((r) => str(r.id));
    const stock = new Map<string, { restants: number; total: number }>();
    if (idsCadeau.length) {
      const { data: rw } = await sb.from("clik_reward").select("campagne_id, statut").in("campagne_id", idsCadeau);
      for (const r of (Array.isArray(rw) ? rw : []) as Record<string, unknown>[]) {
        const k = str(r.campagne_id);
        const e = stock.get(k) || { restants: 0, total: 0 };
        e.total += 1;
        if (str(r.statut) === "disponible") e.restants += 1;
        stock.set(k, e);
      }
    }

    return vivantes.map((r) => {
      const s = stock.get(str(r.id));
      return versCampagne(r, s?.restants, s?.total);
    });
  } catch {
    return [];
  }
}

/**
 * Une campagne seule, avec son stock si c'est un « cadeau ».
 *
 * Volontairement SANS filtre de statut : l'écran doit pouvoir afficher « c'est
 * fini » plutôt qu'un 404. Quelqu'un qui ouvre un lien reçu la veille mérite une
 * phrase, pas une page d'erreur.
 */
export async function campagneParId(supabase: unknown, id: string): Promise<Campagne | null> {
  const sb = supabase as Supabase;
  try {
    const { data } = await sb.from("clik_campaign").select("*").eq("id", id).maybeSingle();
    if (!data) return null;
    const r = data as Record<string, unknown>;
    if (str(r.type) !== "cadeau") return versCampagne(r);

    const { data: rw } = await sb
      .from("clik_reward")
      .select("statut, libelle, condition_achat")
      .eq("campagne_id", id);
    const lignes = (Array.isArray(rw) ? rw : []) as Record<string, unknown>[];
    const total = lignes.length;
    const dispo = lignes.filter((x) => str(x.statut) === "disponible");
    const c = versCampagne(r, dispo.length, total);
    // Ce qu'il reste À PRENDRE, pas tout le stock d'origine : annoncer un
    // avantage déjà parti est une promesse qu'on ne peut plus tenir.
    c.aGagner = distincts(dispo.map((x) => str(x.libelle)));
    c.conditions = distincts(dispo.map((x) => str(x.condition_achat)));
    return c;
  } catch {
    return null;
  }
}

/** L'engagement de cet habitant sur cette campagne, s'il y en a un. */
export async function maParticipation(
  supabase: unknown,
  campagneId: string,
  habitantId: string
): Promise<{ statut: string; libelle: string | null; conditionAchat: string | null } | null> {
  const sb = supabase as Supabase;
  try {
    const { data } = await sb
      .from("clik_participation")
      .select("statut, reward_id")
      .eq("campagne_id", campagneId)
      .eq("habitant_id", habitantId)
      .maybeSingle();
    if (!data) return null;
    const r = data as Record<string, unknown>;
    const rewardId = str(r.reward_id);
    let libelle: string | null = null;
    let conditionAchat: string | null = null;
    if (rewardId) {
      const { data: rw } = await sb.from("clik_reward").select("libelle, condition_achat").eq("id", rewardId).maybeSingle();
      const w = (rw || {}) as Record<string, unknown>;
      libelle = str(w.libelle) || null;
      conditionAchat = str(w.condition_achat) || null;
    }
    return { statut: str(r.statut), libelle, conditionAchat };
  } catch {
    return null;
  }
}

/** Indexe les campagnes par publication, pour les accrocher au fil. */
export function parPublication(campagnes: readonly Campagne[]): Map<string, Campagne> {
  const m = new Map<string, Campagne>();
  for (const c of campagnes) {
    if (!c.publicationId) continue;
    // À égalité, on garde CELLE QUI FINIT LE PLUS TÔT : c'est celle qui a
    // besoin d'être vue maintenant.
    const dejà = m.get(c.publicationId);
    if (!dejà || Date.parse(c.echeance) < Date.parse(dejà.echeance)) m.set(c.publicationId, c);
  }
  return m;
}
