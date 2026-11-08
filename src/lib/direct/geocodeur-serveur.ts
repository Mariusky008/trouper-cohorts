/**
 * 🔎 CHERCHER UN ENDROIT DE LA VILLE (« Autour », 8 novembre 2026 — le propriétaire : « j'ai tapé “la gare”, la carte
 * n'a pas bougé »). La recherche d'« Autour » ne trouvait que les lieux de ClikMe (commerces, lieux publics, zones) ;
 * elle trouve maintenant n'importe quel endroit — la gare, une rue, un parc —, pour y aller sur la carte et, s'il veut,
 * y déposer son mème (une zone « quelque part par ici », jamais une épingle).
 *
 * Le géocodeur : Photon (OpenStreetMap, komoot), gratuit et sans clé, interrogé PAR LE SERVEUR (aucune clé ni adresse de
 * l'habitant ne part ; la recherche est penchée vers le centre de la carte et gardée dans un rayon de 25 km).
 * `GEOCODEUR_URL` le remplace (les essais : un faux, dans le faux Supabase).
 *
 * FICHIER SERVEUR.
 */
import type { Endroit } from "@/lib/direct/autour";
export type { Endroit };

const s = (v: unknown) => (v == null ? "" : String(v));
const GEOCODEUR = () =>
  s(process.env.GEOCODEUR_URL) || "https://photon.komoot.io/api/";
/** Au plus 25 km du centre de la carte : on cherche dans SA ville. */
const RAYON_KM = 25;
export const RECHERCHE_MAX = 80;

const km = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) => {
  const r = Math.PI / 180;
  const x = (b.lng - a.lng) * r * Math.cos(((a.lat + b.lat) / 2) * r);
  const y = (b.lat - a.lat) * r;
  return Math.sqrt(x * x + y * y) * 6371;
};

type Propriete = {
  name?: string;
  street?: string;
  housenumber?: string;
  city?: string;
  district?: string;
  postcode?: string;
  osm_value?: string;
};
type Trouvaille = {
  geometry?: { coordinates?: [number, number] };
  properties?: Propriete;
};

/** Les endroits qui répondent à `q`, près de `pres` (le centre de la carte). Rien si le géocodeur ne répond pas. */
export async function chercherEndroits(
  q: unknown,
  pres: { lat: unknown; lng: unknown },
): Promise<Endroit[]> {
  const t = s(q).replace(/\s+/g, " ").trim().slice(0, RECHERCHE_MAX);
  if (t.length < 2) return [];
  // (sans centre — `null`, « » —, rien : `Number(null)` vaudrait 0, et la recherche se pencherait vers le golfe de Guinée)
  const lat = s(pres.lat).trim() ? Number(pres.lat) : NaN;
  const lng = s(pres.lng).trim() ? Number(pres.lng) : NaN;
  const centre =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
      ? { lat, lng }
      : null;
  let url: URL;
  try {
    url = new URL(GEOCODEUR());
  } catch {
    return [];
  }
  url.searchParams.set("q", t);
  url.searchParams.set("limit", "10");
  url.searchParams.set("lang", "fr");
  if (centre) {
    url.searchParams.set("lat", String(centre.lat));
    url.searchParams.set("lon", String(centre.lng));
  }
  try {
    const r = await fetch(url, {
      headers: {
        "user-agent": "ClikMe (https://clikme.fr)",
        accept: "application/json",
      },
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!r.ok) return [];
    const j = (await r.json()) as { features?: Trouvaille[] };
    const vus = new Set<string>();
    const endroits: Endroit[] = [];
    for (const f of Array.isArray(j.features) ? j.features : []) {
      const [x, y] = f.geometry?.coordinates ?? [];
      const p = f.properties ?? {};
      if (
        typeof x !== "number" ||
        typeof y !== "number" ||
        !Number.isFinite(x) ||
        !Number.isFinite(y)
      )
        continue;
      const ici = { lat: y, lng: x };
      if (centre && km(centre, ici) > RAYON_KM) continue;
      const rue = [s(p.housenumber), s(p.street)].filter(Boolean).join(" ");
      const nom = s(p.name) || rue;
      if (!nom) continue;
      const detail = [
        s(p.name) && rue !== s(p.name) ? rue : "",
        s(p.district),
        s(p.city),
      ]
        .filter(Boolean)
        .filter((v, k, l) => l.indexOf(v) === k)
        .join(", ");
      const cle = `${nom}|${detail}`.toLowerCase();
      if (vus.has(cle)) continue;
      vus.add(cle);
      endroits.push({
        nom: nom.slice(0, 60),
        detail: detail.slice(0, 80),
        lat: Math.round(y * 1e6) / 1e6,
        lng: Math.round(x * 1e6) / 1e6,
      });
      if (endroits.length >= 5) break;
    }
    return endroits;
  } catch {
    return [];
  }
}
