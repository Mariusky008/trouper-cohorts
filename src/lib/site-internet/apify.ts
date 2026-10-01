// Source de données commune "Site internet" : acteur Apify Google Maps
// (compass~crawler-google-places), en synchrone. Utilisé par le diagnostic
// (une fiche) et par la découverte (un secteur entier). APIFY_TOKEN uniquement,
// aucune facturation Google Cloud.

export type ApifyPlaceItem = Record<string, unknown>;
export type ApifyResult = { items: ApifyPlaceItem[]; ok: boolean; status: number; error: string };

export type ApifyOptions = { maxImages?: number; maxReviews?: number; reviewsSort?: string; placeIds?: string[] };

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
    dernier = await appeler(token, body);
    if (dernier.ok || dernier.status !== 400) break;
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

async function appeler(token: string, body: Record<string, unknown>): Promise<ApifyResult> {
  try {
    const res = await fetch(
      // L'ADRESSE EST SURCHARGEABLE POUR LA RECETTE, comme celle de Gemini :
      // sans jeton, un faux Apify permet de mesurer tout le chemin.
      `${(process.env.APIFY_BASE_URL || "https://api.apify.com").trim()}/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=180`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
