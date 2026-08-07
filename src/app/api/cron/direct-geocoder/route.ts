// Renseigne les coordonnées des commerces, pour que la distance existe.
//
// Sans latitude ni longitude, la règle de dégradation tombe systématiquement sur
// le repli « quartier, puis ville » : une carte affiche « Dax » là où elle
// pourrait afficher « 280 m ». Le repli est bon — l'application ne casse pas —
// mais il n'est censé être qu'un repli.
//
// AUCUNE SOURCE NOUVELLE : les fiches portent déjà `google_place_id`, et la clé
// Places est déjà configurée pour le compteur d'avis. On demande juste un champ
// de plus sur une fiche qu'on interroge déjà.
//
// Idempotent et repris par lots : on ne traite que les fiches SANS coordonnées,
// donc un second passage ne redemande rien et ne recoûte rien.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const str = (v: unknown) => (v == null ? "" : String(v));

// Un lot par exécution. Le quota Places se paie à l'appel, et une ville entière
// n'a pas besoin d'être géocodée dans la minute : c'est une donnée qui ne bouge
// que lorsqu'un commerce déménage.
const LOT = 40;

type Position = { lat: number; lng: number };

async function positionDe(placeId: string, apiKey: string): Promise<Position | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "geometry/location");
  url.searchParams.set("key", apiKey);
  try {
    const res = await fetch(url.toString(), { next: { revalidate: 0 } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status?: string;
      result?: { geometry?: { location?: { lat?: number; lng?: number } } };
    };
    if (data.status !== "OK") return null;
    const loc = data.result?.geometry?.location;
    if (typeof loc?.lat !== "number" || typeof loc?.lng !== "number") return null;
    // Garde-fou : une coordonnée hors des bornes terrestres est une réponse
    // aberrante, et une carte qui annonce « 4 300 km » discrédite tout l'écran.
    if (Math.abs(loc.lat) > 90 || Math.abs(loc.lng) > 180) return null;
    return { lat: loc.lat, lng: loc.lng };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const apiKey = str(process.env.GOOGLE_PLACES_API_KEY).trim();
  if (!apiKey) return NextResponse.json({ ok: true, skipped: "GOOGLE_PLACES_API_KEY manquant" });

  const supabase = createAdminClient();

  let fiches: Array<Record<string, unknown>> = [];
  try {
    const { data, error } = await supabase
      .from("human_vitrine_sites")
      .select("id, google_place_id")
      .eq("channel", "letter")
      .eq("published", true)
      .not("google_place_id", "is", null)
      .is("latitude", null)
      .limit(LOT);
    if (error) throw new Error(error.message);
    fiches = (Array.isArray(data) ? data : []) as Array<Record<string, unknown>>;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/does not exist|schema cache|Could not find/i.test(msg)) {
      return NextResponse.json({ ok: true, skipped: "colonnes latitude/longitude non migrées" });
    }
    return NextResponse.json({ error: "Lecture impossible." }, { status: 500 });
  }

  let places = 0;
  let echecs = 0;
  for (const f of fiches) {
    const pid = str(f.google_place_id);
    if (!pid) continue;
    const pos = await positionDe(pid, apiKey);
    if (!pos) {
      echecs++;
      continue;
    }
    try {
      await supabase
        .from("human_vitrine_sites")
        .update({ latitude: pos.lat, longitude: pos.lng })
        .eq("id", str(f.id));
      places++;
    } catch {
      echecs++;
    }
  }

  return NextResponse.json({ ok: true, examinees: fiches.length, places, echecs, reste: fiches.length === LOT });
}
