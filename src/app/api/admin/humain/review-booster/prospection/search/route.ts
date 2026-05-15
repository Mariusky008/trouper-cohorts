import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser, formatPhoneToE164 } from "@/lib/actions/review-booster-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const AUTO_SECTEURS = [
  "coiffeur", "restaurant", "boulangerie", "garage automobile",
  "plombier", "électricien", "fleuriste", "kinésithérapeute",
  "pizzeria", "bar",
];

function isMobile(e164: string): boolean {
  return /^\+33[67]/.test(e164);
}

async function scrapeApify(
  apifyToken: string,
  secteur: string,
  ville: string,
  limit: number
): Promise<Record<string, unknown>[]> {
  const res = await fetch(
    `https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${apifyToken}&timeout=120`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchStringsArray: [secteur],
        locationQuery,
        maxCrawledPlacesPerSearch: limit,
        language: "fr",
        countryCode: "fr",
      }),
    }
  );
  if (!res.ok) return [];
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
}

export async function POST(request: Request) {
  const auth = await requireAdminUser();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const ville = String(body.ville || "").trim();
  const zone = String(body.zone || "").trim();
  const secteur = String(body.secteur || "").trim();
  const limit = Math.min(200, Math.max(10, Number(body.limit) || 10));
  const maxAvis = Number(body.maxAvis) > 0 ? Number(body.maxAvis) : 50;
  const modeAuto = body.modeAuto === true;
  const locationQuery = zone ? `${ville} ${zone}, france` : `${ville}, france`;

  if (!ville) return NextResponse.json({ error: "La ville est obligatoire." }, { status: 400 });
  if (!modeAuto && !secteur) return NextResponse.json({ error: "Secteur obligatoire en mode manuel." }, { status: 400 });

  const apifyToken = process.env.APIFY_TOKEN;
  if (!apifyToken) return NextResponse.json({ error: "APIFY_TOKEN manquant." }, { status: 500 });

  // En mode auto : scrape les 10 secteurs prédéfinis en parallèle (10 résultats chacun)
  let allItems: { item: Record<string, unknown>; secteurLabel: string }[] = [];
  if (modeAuto) {
    const results = await Promise.all(
      AUTO_SECTEURS.map((s) => scrapeApify(apifyToken, s, ville, 10).then((items) => items.map((item) => ({ item, secteurLabel: s }))))
    );
    allItems = results.flat();
  } else {
    const items = await scrapeApify(apifyToken, secteur, ville, limit);
    allItems = items.map((item) => ({ item, secteurLabel: secteur }));
  }

  const supabase = createAdminClient();
  let found = 0;
  let imported = 0;
  let skipped = 0;

  for (const { item, secteurLabel } of allItems) {
    // Filtre principal : nb_avis < maxAvis (pas de filtre sur la note)
    const nbAvis = typeof item.reviewsCount === "number" ? item.reviewsCount : null;
    if (nbAvis !== null && nbAvis >= maxAvis) { skipped++; continue; }

    const rawPhone = typeof item.phone === "string" ? item.phone : null;
    if (!rawPhone) { skipped++; continue; }

    const telephone = formatPhoneToE164(rawPhone);
    if (!telephone) { skipped++; continue; }

    found++;

    const nom = typeof item.title === "string" ? item.title.trim() : "Inconnu";
    const adresse = typeof item.address === "string" ? item.address : null;
    const placeId = typeof item.placeId === "string" ? item.placeId : null;
    const rating = typeof item.totalScore === "number" ? item.totalScore : null;

    const { error } = await supabase.from("human_review_prospects").upsert(
      {
        nom,
        telephone,
        ville,
        zone: zone || null,
        secteur: secteurLabel,
        adresse,
        place_id: placeId,
        note_google: rating,
        nb_avis: nbAvis,
        source: "apify",
        est_mobile: isMobile(telephone),
      },
      { onConflict: "telephone", ignoreDuplicates: true }
    );

    if (!error) imported++;
    else skipped++;
  }

  return NextResponse.json({ found, imported, skipped });
}
