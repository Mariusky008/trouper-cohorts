// Source de données commune "Site internet" : acteur Apify Google Maps
// (compass~crawler-google-places), en synchrone. Utilisé par le diagnostic
// (une fiche) et par la découverte (un secteur entier). APIFY_TOKEN uniquement,
// aucune facturation Google Cloud.

export type ApifyPlaceItem = Record<string, unknown>;

export async function apifyGoogleMaps(
  token: string,
  searchStrings: string[],
  locationQuery: string,
  limit: number
): Promise<ApifyPlaceItem[]> {
  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=180`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchStringsArray: searchStrings,
          locationQuery,
          maxCrawledPlacesPerSearch: limit,
          language: "fr",
          countryCode: "fr",
        }),
      }
    );
    if (!res.ok) return [];
    const data = await res.json().catch(() => []);
    return Array.isArray(data) ? (data as ApifyPlaceItem[]) : [];
  } catch {
    return [];
  }
}

export const normName = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
