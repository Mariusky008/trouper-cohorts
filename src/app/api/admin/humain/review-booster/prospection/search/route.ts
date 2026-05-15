import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser, formatPhoneToE164 } from "@/lib/actions/review-booster-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isMobile(e164: string): boolean {
  return /^\+33[67]/.test(e164);
}

export async function POST(request: Request) {
  const auth = await requireAdminUser();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const ville = String(body.ville || "").trim();
  const secteur = String(body.secteur || "").trim();
  const limit = [10, 20, 30].includes(Number(body.limit)) ? Number(body.limit) : 10;

  if (!ville || !secteur) {
    return NextResponse.json({ error: "ville et secteur sont obligatoires." }, { status: 400 });
  }

  const apifyToken = process.env.APIFY_TOKEN;
  if (!apifyToken) return NextResponse.json({ error: "APIFY_TOKEN manquant." }, { status: 500 });

  const apifyRes = await fetch(
    `https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${apifyToken}&timeout=300`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchStringsArray: [secteur],
        locationQuery: `${ville}, france`,
        maxCrawledPlacesPerSearch: limit,
        language: "fr",
        countryCode: "fr",
      }),
    }
  );

  if (!apifyRes.ok) {
    const text = await apifyRes.text().catch(() => "");
    return NextResponse.json({ error: `Apify error: ${apifyRes.status} ${text}` }, { status: 502 });
  }

  const items: unknown[] = await apifyRes.json().catch(() => []);
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "Réponse Apify inattendue." }, { status: 502 });
  }

  const supabase = createAdminClient();

  let found = 0;
  let imported = 0;
  let skipped = 0;

  for (const raw of items) {
    const item = raw as Record<string, unknown>;

    const rating = typeof item.totalScore === "number" ? item.totalScore : null;
    if (rating !== null && rating >= 4.2) {
      skipped++;
      continue;
    }

    const rawPhone = typeof item.phone === "string" ? item.phone : null;
    if (!rawPhone) { skipped++; continue; }

    const telephone = formatPhoneToE164(rawPhone);
    if (!telephone) { skipped++; continue; }

    found++;

    const nom = typeof item.title === "string" ? item.title.trim() : "Inconnu";
    const adresse = typeof item.address === "string" ? item.address : null;
    const placeId = typeof item.placeId === "string" ? item.placeId : null;
    const nbAvis = typeof item.reviewsCount === "number" ? item.reviewsCount : null;
    const noteGoogle = rating !== null ? rating : null;

    const { error } = await supabase.from("human_review_prospects").upsert(
      {
        nom,
        telephone,
        ville,
        secteur,
        adresse,
        place_id: placeId,
        note_google: noteGoogle,
        nb_avis: nbAvis,
        source: "apify",
        est_mobile: isMobile(telephone),
      },
      { onConflict: "telephone", ignoreDuplicates: true }
    );

    if (!error) {
      imported++;
    } else {
      skipped++;
    }
  }

  return NextResponse.json({ found, imported, skipped });
}
