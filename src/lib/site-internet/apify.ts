// Source de données commune "Site internet" : acteur Apify Google Maps
// (compass~crawler-google-places), en synchrone. Utilisé par le diagnostic
// (une fiche) et par la découverte (un secteur entier). APIFY_TOKEN uniquement,
// aucune facturation Google Cloud.

export type ApifyPlaceItem = Record<string, unknown>;
export type ApifyResult = { items: ApifyPlaceItem[]; ok: boolean; status: number; error: string };

export async function apifyGoogleMaps(
  token: string,
  searchStrings: string[],
  locationQuery: string,
  limit: number,
  opts?: { maxImages?: number; maxReviews?: number; reviewsSort?: string; placeIds?: string[] }
): Promise<ApifyResult> {
  try {
    // Quand on connaît le placeId (fiche déjà identifiée), on cible CE lieu précis
    // pour ses photos + avis — bien plus fiable qu'une nouvelle recherche par nom
    // (qui peut tomber sur un homonyme ou ne rien renvoyer).
    const placeIds = (opts?.placeIds ?? []).filter((p) => typeof p === "string" && p.trim());
    const body: Record<string, unknown> = {
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
    const res = await fetch(
      `https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=180`,
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
      // Corps Apify souvent { error: { type, message } }
      const body = data as { error?: { type?: string; message?: string } };
      const msg = body?.error?.message || text.slice(0, 200);
      return { items: [], ok: false, status: res.status, error: `${res.status} ${body?.error?.type || ""} — ${msg}`.trim() };
    }
    const items = Array.isArray(data) ? (data as ApifyPlaceItem[]) : [];
    return { items, ok: true, status: res.status, error: "" };
  } catch (e) {
    return { items: [], ok: false, status: 0, error: `réseau: ${String(e).slice(0, 160)}` };
  }
}

export const normName = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
