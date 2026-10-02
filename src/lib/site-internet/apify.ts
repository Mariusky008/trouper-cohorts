// Source de données commune "Site internet" : acteur Apify Google Maps
// (compass~crawler-google-places), en synchrone. Utilisé par le diagnostic
// (une fiche) et par la découverte (un secteur entier). APIFY_TOKEN uniquement,
// aucune facturation Google Cloud.

export type ApifyPlaceItem = Record<string, unknown>;
export type ApifyResult = { items: ApifyPlaceItem[]; ok: boolean; status: number; error: string };

export type ApifyOptions = {
  maxImages?: number;
  maxReviews?: number;
  reviewsSort?: string;
  placeIds?: string[];
  /**
   * L'HEURE (en millisecondes) AVANT LAQUELLE TOUT DOIT ÊTRE FINI.
   *
   * « /api/site-internet/public-generate : 504 ». Chaque appel pouvait durer
   * trois minutes, et la réparation en rejouait jusqu'à quatre : bien plus
   * que les cinq minutes qu'une fonction a le droit de vivre. Chaque appel
   * reçoit donc ce qui reste, et on ne rejoue pas sans le temps de le faire.
   */
  finAvant?: number;
};

/**
 * Le temps laissé à un appel : ce qui reste, plafonné à deux minutes. Sans
 * échéance (la découverte d'un secteur, côté administration), on garde les
 * trois minutes d'avant : trente lieux d'un coup ne se lisent pas en deux.
 */
const tempsPour = (finAvant?: number) => (finAvant ? Math.min(120_000, finAvant - Date.now()) : 185_000);

/**
 * ═══ UN « 400 » D'APIFY SE RÉPARE AU LIEU DE TOUT FAIRE TOMBER ═════════════
 *
 * « J'ai refait un essai mais ça ne lit toujours pas la fiche Google » — et la
 * page affichait « code 400 ». Ce n'est ni le crédit (402) ni le jeton (401) :
 * c'est l'acteur qui REFUSE NOTRE ENTRÉE. Ces mêmes réglages marchaient il y a
 * quelques jours ; un acteur Apify évolue sans prévenir, et un champ qu'il
 * acceptait hier (une valeur de tri, un minimum, un nom de champ) peut être
 * refusé aujourd'hui. Une seule ligne de trop suffisait à faire perdre toute la
 * fiche — la note, les avis, les photos.
 *
 * ON FAIT DONC CE QUE FAIT DÉJÀ L'ESSAYAGE AVEC OPENAI : on lit le message,
 * on retire ce qu'il désigne (« input.xxx ») et on rejoue. S'il ne désigne
 * rien, on rejoue avec l'entrée la plus simple qui soit — la recherche, le
 * lieu, le nombre — ce qui ramène au moins la fiche ; puis sans le lieu. Quatre
 * essais au plus. Ce
 * qu'on a retiré est rendu dans `corrige`, pour qu'on sache quoi réécrire.
 */
const ESSENTIELS = new Set(["searchStringsArray", "locationQuery", "maxCrawledPlacesPerSearch", "placeIds", "startUrls"]);

export async function apifyGoogleMaps(
  token: string,
  searchStrings: string[],
  locationQuery: string,
  limit: number,
  opts?: ApifyOptions
): Promise<ApifyResult & { corrige?: string[] }> {
  // Quand on connaît le placeId (fiche déjà identifiée), on cible CE lieu précis
  // pour ses photos + avis — bien plus fiable qu'une nouvelle recherche par nom
  // (qui peut tomber sur un homonyme ou ne rien renvoyer).
  const placeIds = (opts?.placeIds ?? []).filter((p) => typeof p === "string" && p.trim());
  let body: Record<string, unknown> = {
    language: "fr",
    countryCode: "fr",
    maxImages: opts?.maxImages ?? 0,
    maxReviews: opts?.maxReviews ?? 0,
    reviewsSort: opts?.reviewsSort ?? "newest",
  };
  if (placeIds.length) {
    body.placeIds = placeIds;
    body.maxCrawledPlacesPerSearch = placeIds.length;
  } else {
    body.searchStringsArray = searchStrings;
    body.locationQuery = locationQuery;
    body.maxCrawledPlacesPerSearch = limit;
  }
  const corrige: string[] = [];
  let dernier: ApifyResult = { items: [], ok: false, status: 0, error: "" };
  for (let essai = 0; essai < 4; essai++) {
    const reste = tempsPour(opts?.finAvant);
    if (reste < 15_000) {
      if (!essai) dernier = { items: [], ok: false, status: 0, error: "délai : plus le temps de lire la fiche" };
      break;
    }
    dernier = await appeler(token, body, reste);
    if (dernier.ok || dernier.status !== 400) break;
    // UN REFUS DE L'ENTRÉE TOMBE EN UNE SECONDE ; UN ÉCHEC DU CRAWL, LUI, A
    // DÉJÀ COÛTÉ SON TEMPS. On ne le rejoue qu'une fois.
    if (!/invalid-input|input/i.test(dernier.error) && essai >= 1) break;
    const designes = [...new Set([...dernier.error.matchAll(/input\.([A-Za-z]+)/g)].map((m) => m[1]))];
    const retirables = designes.filter((k) => k in body && !ESSENTIELS.has(k));
    const avant = JSON.stringify(body);
    if (retirables.length) {
      for (const k of retirables) delete body[k];
      corrige.push(...retirables);
    } else if (designes.includes("placeIds") && placeIds.length) {
      // LE REPÈRE DE SA FICHE, DIT AUTREMENT : une adresse Google Maps.
      delete body.placeIds;
      body.startUrls = placeIds.map((id) => ({ url: `https://www.google.com/maps/place/?q=place_id:${id}` }));
      corrige.push("placeIds→startUrls");
    } else if (corrige.includes("entrée minimale") && "locationQuery" in body && "searchStringsArray" in body) {
      // TOUJOURS REFUSÉ AVEC L'ENTRÉE MINIMALE : le lieu lui-même peut faire
      // échouer l'acteur (une ville qu'il ne sait pas situer). La recherche
      // contient déjà la ville — « Le Bordeaux Dax » —, on s'en passe.
      delete body.locationQuery;
      corrige.push("sans locationQuery");
    } else {
      // RIEN DE DÉSIGNÉ : l'entrée la plus simple, en gardant ce qu'on demande vraiment.
      const simple: Record<string, unknown> = {};
      for (const k of Object.keys(body)) if (ESSENTIELS.has(k)) simple[k] = body[k];
      if ((opts?.maxImages ?? 0) > 0) simple.maxImages = opts?.maxImages;
      if ((opts?.maxReviews ?? 0) > 0) simple.maxReviews = opts?.maxReviews;
      body = simple;
      corrige.push("entrée minimale");
    }
    if (JSON.stringify(body) === avant) break;
    console.warn("[apify] entrée refusée, on rejoue sans", JSON.stringify({ corrige, message: dernier.error.slice(0, 300) }));
  }
  return corrige.length ? { ...dernier, corrige } : dernier;
}

async function appeler(token: string, body: Record<string, unknown>, reste = 185_000): Promise<ApifyResult> {
  try {
    const res = await fetch(
      // L'ADRESSE EST SURCHARGEABLE POUR LA RECETTE, comme celle de Gemini :
      // sans jeton, un faux Apify permet de mesurer tout le chemin.
      `${(process.env.APIFY_BASE_URL || "https://api.apify.com").trim()}/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=${Math.max(10, Math.floor(reste / 1000) - 5)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        // ON COUPE AVANT LA PASSERELLE : une réponse « délai » vaut mieux qu'un 504.
        signal: AbortSignal.timeout(reste),
      }
    );
    const text = await res.text();
    let data: unknown = [];
    try {
      data = JSON.parse(text);
    } catch {
      data = [];
    }
    if (!res.ok) {
      // Corps Apify souvent { error: { type, message } }. LE MESSAGE ENTIER :
      // c'est lui qui nomme le champ refusé, et on en a besoin pour réparer.
      const err = data as { error?: { type?: string; message?: string } };
      const msg = err?.error?.message || text.slice(0, 400);
      return { items: [], ok: false, status: res.status, error: `${res.status} ${err?.error?.type || ""} — ${msg}`.trim().slice(0, 500) };
    }
    const items = Array.isArray(data) ? (data as ApifyPlaceItem[]) : [];
    return { items, ok: true, status: res.status, error: "" };
  } catch (e) {
    return { items: [], ok: false, status: 0, error: `réseau: ${String(e).slice(0, 160)}` };
  }
}

export const normName = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/* ═══════════════════════════════════════════════════════════════════════════
 * LES LECTURES QUI N'ATTENDENT PAS — lancer, puis venir chercher.
 *
 * « recherche par le nom : 400 run-failed — Actor run did not succeed
 * (status: TIMED-OUT) »
 *
 * L'ACTEUR N'AVAIT PAS FINI, ET C'EST NOUS QUI L'AVIONS ARRÊTÉ. L'appel
 * « synchrone » attend la fin de la lecture dans la requête, avec le temps
 * qu'il reste à la fonction ; une fiche, ses photos et ses avis demandent
 * souvent plus. On ne peut pas allonger une requête au-delà de cinq minutes —
 * mais on n'a pas besoin de l'attendre : on LANCE la lecture chez Apify, elle
 * prend le temps qu'il lui faut (dix minutes au plus), et on vient chercher le
 * résultat quand elle a fini. Voir `avancerLaFiche`.
 * ═══════════════════════════════════════════════════════════════════════════ */

const baseApify = () => (process.env.APIFY_BASE_URL || "https://api.apify.com").trim();

export type RunApify = { runId: string; datasetId: string };

/** Lance une lecture et rend son numéro. Répare l'entrée si Apify en refuse un champ. */
export async function lancerRunApify(
  token: string,
  entree: Record<string, unknown>,
  /** Le robot : celui des fiches par défaut, un autre pour les photos du menu. */
  acteur = "compass~crawler-google-places",
): Promise<(RunApify & { corrige: string[] }) | { erreur: string }> {
  let body = { ...entree };
  const corrige: string[] = [];
  for (let essai = 0; essai < 3; essai++) {
    try {
      const r = await fetch(
        `${baseApify()}/v2/acts/${encodeURIComponent(acteur)}/runs?token=${encodeURIComponent(token)}&timeout=600`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(30_000),
        },
      );
      const texte = await r.text();
      let j: { data?: { id?: string; defaultDatasetId?: string }; error?: { type?: string; message?: string } } = {};
      try {
        j = JSON.parse(texte);
      } catch {
        /* corps illisible */
      }
      if (r.ok && j.data?.id) return { runId: j.data.id, datasetId: j.data.defaultDatasetId || "", corrige };
      const msg = `${r.status} ${j.error?.type || ""} — ${j.error?.message || texte.slice(0, 300)}`.trim();
      const designes = [...new Set([...msg.matchAll(/input\.([A-Za-z]+)/g)].map((m) => m[1]))].filter(
        (k) => k in body && !ESSENTIELS.has(k),
      );
      if (r.status !== 400 || !designes.length) return { erreur: msg.slice(0, 500) };
      for (const k of designes) delete body[k];
      body = { ...body };
      corrige.push(...designes);
    } catch (e) {
      return { erreur: `réseau: ${String(e).slice(0, 160)}` };
    }
  }
  return { erreur: "entrée refusée trois fois" };
}

/** Où en est une lecture : READY, RUNNING, SUCCEEDED, FAILED, TIMED-OUT, ABORTED… */
export async function etatRunApify(token: string, runId: string): Promise<{ statut: string; datasetId: string } | { erreur: string }> {
  try {
    const r = await fetch(`${baseApify()}/v2/actor-runs/${encodeURIComponent(runId)}?token=${encodeURIComponent(token)}`, {
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    const j = (await r.json().catch(() => ({}))) as { data?: { status?: string; defaultDatasetId?: string } };
    if (!r.ok || !j.data?.status) return { erreur: `état de la lecture : ${r.status}` };
    return { statut: j.data.status, datasetId: j.data.defaultDatasetId || "" };
  } catch (e) {
    return { erreur: `réseau: ${String(e).slice(0, 160)}` };
  }
}

/** Ce qu'une lecture terminée a trouvé. */
export async function resultatsRunApify(token: string, datasetId: string): Promise<ApifyPlaceItem[] | { erreur: string }> {
  try {
    const r = await fetch(
      `${baseApify()}/v2/datasets/${encodeURIComponent(datasetId)}/items?token=${encodeURIComponent(token)}&clean=true&format=json`,
      { signal: AbortSignal.timeout(30_000), cache: "no-store" },
    );
    const j = await r.json().catch(() => null);
    if (!r.ok || !Array.isArray(j)) return { erreur: `résultats de la lecture : ${r.status}` };
    return j as ApifyPlaceItem[];
  } catch (e) {
    return { erreur: `réseau: ${String(e).slice(0, 160)}` };
  }
}
