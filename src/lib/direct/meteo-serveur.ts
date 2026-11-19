/**
 * 🌦️ LA MÉTÉO DU SALON, CÔTÉ SERVEUR (le lot S7 ; les règles : `meteo.ts`).
 *
 * Open-Meteo (gratuit, sans clé), interrogé PAR LE SERVEUR, sur la ville de celui qui regarde (`ville_slug` : jamais
 * sa position) : la ville est cherchée une fois (`meteo/villes/<slug>.json`, ses coordonnées gardées), puis le temps
 * qu'il fait, **au plus une fois par heure par ville** (`meteo/<slug>.json`). Open-Meteo ne répond pas : la dernière
 * météo connue (même vieille), sinon rien — la fenêtre reste comme elle est.
 *
 * `OPEN_METEO_URL` et `OPEN_METEO_GEO_URL` les remplacent (les essais : un faux, dans le faux Supabase).
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { ecrireJson, lireJson } from "./ma-figurine-serveur";
import { METEO_MS, meteoDuCode, villeValide, type Meteo } from "./meteo";
import { nomDeVille } from "./ville";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const TEMPS = () => s(process.env.OPEN_METEO_URL) || "https://api.open-meteo.com/v1/forecast";
const GEO = () => s(process.env.OPEN_METEO_GEO_URL) || "https://geocoding-api.open-meteo.com/v1/search";

/** Où est la ville (cherchée une fois, puis gardée). */
async function coordonnees(supabase: Supabase, slug: string): Promise<{ lat: number; lon: number } | null> {
  const chemin = `meteo/villes/${slug}.json`;
  const c = await lireJson<{ lat?: number; lon?: number }>(supabase, chemin);
  if (Number.isFinite(c.lat) && Number.isFinite(c.lon)) return { lat: Number(c.lat), lon: Number(c.lon) };
  try {
    const u = new URL(GEO());
    u.searchParams.set("name", nomDeVille(slug.replace(/-/g, " ")));
    u.searchParams.set("count", "1");
    u.searchParams.set("language", "fr");
    u.searchParams.set("countryCode", "FR");
    const r = await fetch(u, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return null;
    const j = (await r.json()) as { results?: { latitude?: number; longitude?: number }[] };
    const x = j.results?.[0];
    const lat = Number(x?.latitude);
    const lon = Number(x?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    await ecrireJson(supabase, chemin, { lat, lon, le: new Date().toISOString() });
    return { lat, lon };
  } catch {
    return null;
  }
}

/** 🌦️ LE TEMPS QU'IL FAIT dans la ville (`ville_slug`) : relu au plus une fois par heure ; `null` si on ne sait pas. */
export async function meteoDe(supabase: Supabase, ville: unknown): Promise<Meteo | null> {
  const slug = villeValide(ville);
  if (!slug) return null;
  const chemin = `meteo/${slug}.json`;
  const garde = await lireJson<{ le?: string; meteo?: Meteo }>(supabase, chemin);
  if (garde.meteo && garde.le && Date.now() - Date.parse(garde.le) < METEO_MS) return garde.meteo;
  const ou = await coordonnees(supabase, slug);
  if (!ou) return garde.meteo ?? null;
  try {
    const u = new URL(TEMPS());
    u.searchParams.set("latitude", String(ou.lat));
    u.searchParams.set("longitude", String(ou.lon));
    u.searchParams.set("current", "temperature_2m,weather_code,is_day");
    u.searchParams.set("timezone", "auto");
    const r = await fetch(u, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return garde.meteo ?? null;
    const j = (await r.json()) as { current?: { temperature_2m?: number; weather_code?: number; is_day?: number } };
    const m = meteoDuCode(Number(j.current?.weather_code), Number(j.current?.temperature_2m), j.current?.is_day !== 0);
    if (!m) return garde.meteo ?? null;
    await ecrireJson(supabase, chemin, { le: new Date().toISOString(), meteo: m });
    return m;
  } catch {
    return garde.meteo ?? null;
  }
}
