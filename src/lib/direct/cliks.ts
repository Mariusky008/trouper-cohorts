// LES CLIKS, CÔTÉ HABITANT.
//
// Une annonce porte UNE À TROIS FAÇONS d'en profiter, et l'habitant choisit.
// Elles partagent le commerce, l'annonce d'origine et l'échéance ; seul change
// ce qu'on demande en échange du prix.
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

// TROIS FAÇONS DE PROFITER D'UNE MÊME ANNONCE, pas un mécanisme unique.
//
//   'cadeau'    → prix normal, PLUS un avantage surprise. Ne coûte rien au
//                 commerçant sur son prix, et c'est la façon qui n'exige rien.
//   'express'   → prix réduit si l'on vient tout de suite. Rémunère la vitesse,
//                 c'est-à-dire le remplissage d'un creux.
//   'collectif' → prix le plus bas si l'on vient à plusieurs. Rémunère le
//                 nombre, c'est-à-dire le remplissage d'une table.
//
// Le commerce ne brade pas, il RÉMUNÈRE UN COMPORTEMENT. C'est toute la
// différence avec un site de bons de réduction, et c'est pour ça que les trois
// façons doivent se voir ENSEMBLE : c'est la comparaison qui donne son sens à
// chaque prix.
// ET UN QUATRIÈME CAS, QUI N'EST PAS UN PRIX : « À PRENDRE ».
//
//   'simple' → un créneau qui vient de se libérer. Ni réduction, ni cadeau : il
//              a juste besoin de quelqu'un. C'est le cas le plus fréquent chez
//              un coiffeur ou un tatoueur, et il ne se compare à rien — il
//              s'affiche donc SEUL, sans échelle de prix.
//
//   'portion' → « il me reste 8 lasagnes ». Un STOCK qui descend, avec ou sans
//              prix réduit. C'est la seule façon qui dise un nombre exact et
//              qui s'arrête toute seule à la dernière part — les autres n'ont
//              soit pas de stock (express, simple), soit pas de prix propre
//              (cadeau : il s'ajoute à un achat), soit attendent un groupe.
export const TYPES_CLIK = ["simple", "cadeau", "express", "collectif", "portion"] as const;
export type TypeClik = (typeof TYPES_CLIK)[number];

/** L'ordre d'affichage, du moindre effort au plus engageant — et donc du prix
 *  le plus haut au plus bas. C'est cette descente qui rend la carte lisible.
 *
 *  La portion se range avec l'express : elle demande la même chose — venir
 *  maintenant — et elle porte le même genre de prix. */
export const ORDRE_TYPE: Record<TypeClik, number> = { simple: 0, cadeau: 1, portion: 2, express: 2, collectif: 3 };

/** Ce que chaque façon s'appelle, côté habitant. Les libellés sont ici et pas
 *  dans l'écran : ils doivent être les mêmes dans le fil, sur la fiche du Clik
 *  et dans l'espace du commerçant.
 *
 *  Le collectif porte un nom PAR DÉFAUT seulement : « Table à partager » chez un
 *  restaurant, « Le collectif » ailleurs. Le commerçant peut le renommer, et
 *  c'est ce nom-là qui prime — « table » ne veut rien dire chez un fleuriste. */
export function estTypeClik(v: unknown): v is TypeClik {
  return typeof v === "string" && (TYPES_CLIK as readonly string[]).includes(v);
}

/**
 * Cette façon puise-t-elle dans un STOCK de lignes `clik_reward` ?
 *
 * UNE SEULE RÉPONSE, ICI. Trois endroits en dépendaient — la lecture du stock,
 * le calcul de l'état, le choix entre « prendre » et « rejoindre » — et chacun
 * portait sa propre liste de types. En ajoutant « portion », deux d'entre eux
 * ont été mis à jour et pas le troisième : le stock n'était plus lu, `restants`
 * restait à `null`, et une annonce « il me reste 8 lasagnes » s'affichait
 * « Tout est parti », sans bouton, sur huit parts intactes. Mesuré au
 * navigateur. La prochaine façon à stock n'aura qu'à s'ajouter ici.
 */
export function aStock(type: unknown): boolean {
  return type === "cadeau" || type === "portion";
}

export const FACON_LABEL: Record<TypeClik, string> = {
  simple: "À prendre",
  cadeau: "Le cadeau",
  express: "L'express",
  collectif: "Le collectif",
  // Le nom dit le fait, pas l'opération : ce n'est pas une promotion, c'est ce
  // qu'il reste. Le commerçant peut le renommer (« dernières parts »,
  // « invendus ») — `nom_facon` prime, comme pour le collectif.
  portion: "Dernières portions",
};

/** La promesse de chaque façon, en une ligne. Elle dit CE QU'ON DOIT FAIRE, pas
 *  ce qu'on obtient : le prix est déjà affiché juste à côté. */
export const FACON_PROMESSE: Record<TypeClik, string> = {
  simple: "Aucune réduction, aucun cadeau : un créneau qui cherche preneur",
  cadeau: "Prix normal + cadeau surprise",
  express: "Prix réduit si vous venez vite",
  collectif: "Prix de groupe si vous venez à plusieurs",
  // ON EN MET UNE DE CÔTÉ, ON NE LA LIVRE PAS. La promesse dit le geste réel —
  // venir la chercher — parce que c'est là que se joue la confiance : promettre
  // « réservé » à quelqu'un qui trouvera le bac vide se paie une seule fois.
  portion: "Vous en réservez une, vous passez la chercher",
};

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
  /** Début de la plage, quand la façon en a une. Vide = elle vaut dès sa
   *  publication. Un restaurateur vise un creux précis (« entre 11 h 30 et
   *  11 h 45 ») ; sans ce début, son prix baissait dès qu'il appuyait. */
  debut: string;
  statut: string;
  /** Rang d'affichage parmi les façons d'une même annonce. */
  ordre: number;
  /** Le nom que le commerçant donne à cette façon, quand il en donne un.
   *  « Table à partager » chez un restaurant, « Le bouquet à plusieurs » chez
   *  un fleuriste : le mot juste dépend du métier, pas de nous. */
  nom: string;
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

  // LE CADEAU ET LA PORTION PUISENT DANS LE MÊME STOCK, donc ils s'éteignent de
  // la même façon : à zéro restant, la façon est épuisée. C'est le seul état où
  // « épuisé » est une bonne nouvelle pour le commerçant — tout est parti.
  if (aStock(c.type)) {
    return (c.restants ?? 0) > 0 ? "ouverte" : "epuise";
  }
  // L'express et le « à prendre » n'ont ni stock ni groupe : ils ne dépendent
  // que de l'heure, déjà tranchée au-dessus. Tant qu'elle n'est pas passée, ils
  // sont ouverts.
  if (c.type === "express" || c.type === "simple") return "ouverte";

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
  if (c.type === "simple") return "À prendre";
  if (c.type === "express") return "Prix réduit si vous venez vite";
  if (e === "complete") return "C'est débloqué pour tout le monde";
  const m = manque(c);
  return m === 1 ? "Encore 1 personne et le prix baisse" : `Encore ${m} personnes et le prix baisse`;
}

/** La remise, en pourcentage entier. `null` si elle n'a pas de sens. */
export function remise(c: Campagne): number | null {
  // L'express aussi affiche un prix barré : c'est la même mécanique de remise,
  // sur un autre effort. La réserver au collectif privait la façon du milieu de
  // la seule chose qui la rend comparable aux deux autres.
  if (c.type === "cadeau" || c.type === "simple" || !c.prixInitial || !c.prixGroupe) return null;
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
  const brut = str(r.type);
  const type: TypeClik = (TYPES_CLIK as readonly string[]).includes(brut) ? (brut as TypeClik) : "collectif";
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
    debut: str(r.debut),
    statut: str(r.statut),
    // L'ordre stocké fait foi ; sans lui (migration fraîche), on retombe sur
    // l'ordre canonique du type, qui donne déjà la bonne descente de prix.
    ordre: r.ordre == null ? ORDRE_TYPE[type] : num(r.ordre),
    nom: str(r.nom_facon),
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
    // LES COLONNES RÉCENTES SONT DEMANDÉES À PART, ET LEUR ABSENCE NE DOIT PAS
    // VIDER LE FIL.
    //
    // C'est le défaut le plus coûteux qu'on ait eu : PostgREST refuse TOUTE la
    // requête quand une seule colonne demandée n'existe pas. Tant que la
    // migration `trois_facons` n'était pas appliquée, cette lecture renvoyait
    // une erreur — donc AUCUNE façon, sur AUCUNE annonce, dans le fil comme
    // dans « À saisir ». Le commerçant cochait ses trois options, elles
    // s'écrivaient bien (l'écriture, elle, avait déjà son repli), et rien ne
    // s'affichait. Impossible à deviner de l'extérieur.
    const champs =
      "id, site_id, publication_id, ville_slug, type, titre, objectif, participants, prix_initial, prix_groupe, echeance, statut";
    let { data, error } = await sb.from("clik_campaign").select(`${champs}, ordre, nom_facon, debut`).eq("ville_slug", villeSlug);
    if (error) ({ data, error } = await sb.from("clik_campaign").select(champs).eq("ville_slug", villeSlug));
    if (error || !Array.isArray(data)) return [];

    const lignes = data as Record<string, unknown>[];
    const vivantes = lignes.filter((r) => ["active", "debloquee"].includes(str(r.statut)));
    if (!vivantes.length) return [];

    // LE STOCK, POUR TOUTES LES FAÇONS QUI EN ONT UN.
    //
    // Cette liste ne contenait que « cadeau », et la portion est arrivée après :
    // son stock n'était donc jamais lu, `restants` valait `null`, et `etatDe`
    // en concluait « épuisé ». Résultat mesuré au navigateur : une annonce
    // « il me reste 8 lasagnes » affichait « Tout est parti » et ne proposait
    // même plus de bouton — sur un stock intact de huit parts.
    //
    // La liste est donc DÉDUITE du type, une seule fois, plutôt que recopiée à
    // chaque ajout : la prochaine façon à stock n'aura rien à venir modifier
    // ici.
    const idsStock = vivantes.filter((r) => aStock(str(r.type))).map((r) => str(r.id));
    const stock = new Map<string, { restants: number; total: number }>();
    if (idsStock.length) {
      const { data: rw } = await sb.from("clik_reward").select("campagne_id, statut").in("campagne_id", idsStock);
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
    // MÊME RÈGLE QUE PARTOUT : `aStock`, et pas un test sur « cadeau ».
    // C'était le SECOND endroit à porter sa propre liste, et il produisait le
    // même défaut un cran plus loin : l'écran du Clik affichait « Tout est
    // parti » et remplaçait le bouton par un lien de sortie — sur un stock de
    // huit parts. La carte du fil était corrigée, celui-ci non.
    if (!aStock(r.type)) return versCampagne(r);

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
    // Les conditions d'achat VIDES sont écartées : une portion n'en a pas, et
    // une liste contenant une chaîne vide ferait afficher une puce sans texte.
    c.conditions = distincts(dispo.map((x) => str(x.condition_achat)).filter(Boolean));
    return c;
  } catch {
    return null;
  }
}

/** L'engagement de cet habitant sur cette campagne, s'il y en a un. */
/**
 * LES FAÇONS AUXQUELLES JE PARTICIPE DÉJÀ, pour tout le fil.
 *
 * Une seule lecture : le fil affiche une trentaine de façons, et une requête
 * par ligne multiplierait les allers-retours d'autant.
 *
 * Sert à ce que la carte ne REPROPOSE pas ce qui est déjà pris. Sans ça, on
 * lisait « 16 € · table à partager » sur une offre qu'on avait rejointe dix
 * minutes plus tôt : la carte donnait l'impression qu'il fallait recommencer.
 */
export async function mesParticipations(
  supabase: unknown,
  campagneIds: readonly string[],
  habitantId: string | null
): Promise<Set<string>> {
  const out = new Set<string>();
  const ids = Array.from(new Set(campagneIds.filter(Boolean)));
  if (!habitantId || !ids.length) return out;
  try {
    const { data, error } = await (supabase as Supabase)
      .from("clik_participation")
      .select("campagne_id, statut")
      .in("campagne_id", ids)
      .eq("habitant_id", habitantId);
    if (error || !Array.isArray(data)) return out;
    for (const r of data as Record<string, unknown>[]) {
      // Une participation annulée n'en est plus une : la façon redevient
      // disponible, et la carte doit la reproposer.
      if (["engage", "liste_attente", "confirme"].includes(str(r.statut))) out.add(str(r.campagne_id));
    }
  } catch {
    /* table absente : la carte propose tout, comme avant */
  }
  return out;
}

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

/**
 * LES FAÇONS DE CHAQUE ANNONCE, groupées et ordonnées.
 *
 * La version précédente ne gardait QU'UNE campagne par annonce — celle qui
 * finissait le plus tôt — parce qu'elle supposait un mécanisme unique. C'est
 * exactement ce qui manquait : la carte doit montrer les trois façons ensemble,
 * puisque c'est la comparaison des trois prix qui donne son sens à chacun.
 *
 * L'ordre suit `ordre`, donc la descente des prix, et jamais l'échéance : deux
 * façons dont les heures limites se croisent réordonneraient la colonne des
 * prix d'un rafraîchissement à l'autre.
 */
export function faconsParPublication(campagnes: readonly Campagne[]): Map<string, Campagne[]> {
  const m = new Map<string, Campagne[]>();
  for (const c of campagnes) {
    if (!c.publicationId) continue;
    const l = m.get(c.publicationId);
    if (l) l.push(c);
    else m.set(c.publicationId, [c]);
  }
  for (const l of m.values()) {
    l.sort((a, b) => (a.ordre !== b.ordre ? a.ordre - b.ordre : ORDRE_TYPE[a.type] - ORDRE_TYPE[b.type]));
  }
  return m;
}

/**
 * Ce que le tri du fil doit savoir d'une annonce : le collectif le plus proche
 * de basculer, s'il y en a un.
 *
 * Le rang « presque » du §3 récompense l'imminence d'un basculement. Parmi
 * plusieurs façons, seule la « table à partager » peut basculer — les deux
 * autres ne dépendent que du temps.
 */
export function collectifDe(facons: readonly Campagne[] | undefined): { participants: number; objectif: number } | null {
  for (const c of facons ?? []) {
    if (c.type === "collectif" && c.objectif) return { participants: c.participants, objectif: c.objectif };
  }
  return null;
}
