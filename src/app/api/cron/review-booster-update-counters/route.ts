import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;
  return new URL(request.url).searchParams.get("secret") === secret;
}

type PlacesResult = {
  result?: {
    user_ratings_total?: number;
    rating?: number;
  };
  status?: string;
};

async function fetchGooglePlaceInfo(placeId: string, apiKey: string): Promise<{ nb_avis: number; note: number } | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "rating,user_ratings_total");
  url.searchParams.set("key", apiKey);

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 0 } });
    if (!res.ok) return null;
    const data: PlacesResult = await res.json();
    if (data.status !== "OK" || !data.result) return null;
    return {
      nb_avis: data.result.user_ratings_total ?? 0,
      note: data.result.rating ?? 0,
    };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const googleApiKey = String(process.env.GOOGLE_PLACES_API_KEY || "").trim();
  if (!googleApiKey) {
    return NextResponse.json({ skipped: true, reason: "GOOGLE_PLACES_API_KEY manquant" });
  }

  const supabase = createAdminClient();

  const { data: commercants, error } = await supabase
    .from("human_review_commercants")
    .select("id, place_id, nb_avis_debut")
    .eq("abonnement", "actif")
    .not("place_id", "is", null)
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!commercants?.length) return NextResponse.json({ updated: 0 });

  let updated = 0;
  let failed = 0;

  for (const commerce of commercants) {
    if (!commerce.place_id) continue;

    const info = await fetchGooglePlaceInfo(commerce.place_id, googleApiKey);
    if (!info) { failed++; continue; }

    const { error: updateError } = await supabase
      .from("human_review_commercants")
      .update({
        nb_avis_actuel: info.nb_avis,
        note_actuelle: info.note,
        updated_at: new Date().toISOString(),
      })
      .eq("id", commerce.id);

    if (updateError) { failed++; }
    else { updated++; }
  }

  return NextResponse.json({ updated, failed, total: commercants.length });
}
