// Actualise le nombre d'avis Google d'un pro (Espace Pro → « +N avis »).
// Re-interroge Apify (même acteur que le diagnostic), met à jour le compteur
// réel et la date de relevé. HONNÊTE : on ne stocke que ce que Google renvoie.
// Protégé par le jeton privé. Anti-abus : 1 relevé / 30 min max.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apifyGoogleMaps, normName } from "@/lib/site-internet/apify";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: Record<string, unknown> | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }
  const slug = String(payload?.slug || "").trim();
  const token = String(payload?.token || "").trim();
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("human_vitrine_sites")
    .select("id, business_name, city, google_reviews, google_rating, google_reviews_refreshed_at, pro_reviews_baseline, pro_token")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();

  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || String(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const currentReviews = typeof site.google_reviews === "number" ? site.google_reviews : null;
  const currentRating = typeof site.google_rating === "number" ? site.google_rating : null;

  // Anti-abus : ne pas ré-interroger Apify plus d'une fois toutes les 30 min.
  const last = String(site.google_reviews_refreshed_at || "");
  if (last && Date.now() - new Date(last).getTime() < 30 * 60 * 1000) {
    return NextResponse.json({ ok: true, throttled: true, reviews: currentReviews, rating: currentRating, refreshed_at: last });
  }

  const apifyToken = process.env.APIFY_TOKEN || "";
  if (!apifyToken) return NextResponse.json({ error: "Actualisation indisponible." }, { status: 503 });

  const nom = String(site.business_name || "");
  const ville = String(site.city || "");
  const res = await apifyGoogleMaps(apifyToken, [`${nom} ${ville}`.trim()], `${ville}, france`, 4);

  let newReviews = currentReviews;
  let newRating = currentRating;
  if (res.ok && res.items.length) {
    const target = normName(nom);
    const items = res.items;
    const best =
      items.find((it) => normName(String((it as Record<string, unknown>).title || "")) === target) ||
      items.find((it) => {
        const t = normName(String((it as Record<string, unknown>).title || ""));
        return t && (t.includes(target) || target.includes(t));
      }) ||
      items[0];
    const rc = (best as Record<string, unknown>).reviewsCount;
    const ts = (best as Record<string, unknown>).totalScore;
    if (typeof rc === "number") newReviews = rc;
    if (typeof ts === "number") newRating = ts;
  } else if (!res.ok) {
    return NextResponse.json({ ok: false, error: "Google injoignable pour le moment. Réessayez plus tard.", reviews: currentReviews, rating: currentRating }, { status: 200 });
  }

  const nowIso = new Date().toISOString();
  const patch: Record<string, unknown> = {
    google_reviews: newReviews,
    google_rating: newRating,
    google_reviews_refreshed_at: nowIso,
  };
  // 1re fois : on ancre le point de départ du suivi.
  if (site.pro_reviews_baseline == null && typeof newReviews === "number") {
    patch.pro_reviews_baseline = newReviews;
    patch.pro_baseline_at = nowIso;
  }

  // Résilience : si les colonnes de suivi ne sont pas migrées, on retire et réessaie.
  const doUpdate = (p: Record<string, unknown>) => supabase.from("human_vitrine_sites").update(p).eq("id", String(site.id));
  let { error } = await doUpdate(patch);
  const OPTIONAL = ["google_reviews_refreshed_at", "pro_reviews_baseline", "pro_baseline_at"];
  while (error && /column .* does not exist|schema cache|Could not find/i.test(error.message)) {
    const miss = OPTIONAL.find((c) => c in patch && error!.message.includes(c));
    if (!miss) break;
    delete patch[miss];
    if (!Object.keys(patch).length) { error = null; break; }
    ({ error } = await doUpdate(patch));
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, reviews: newReviews, rating: newRating, refreshed_at: nowIso });
}
