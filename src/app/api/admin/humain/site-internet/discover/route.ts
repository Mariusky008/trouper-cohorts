// Mode "Découverte" : au lieu de saisir un commerce, on scanne un secteur dans
// une ville (Apify Google Maps) et on remonte les commerces à cibler en
// priorité — sans site d'abord (variante A), puis les moins bien notés.
// Aucun écrit en base : l'admin choisit ensuite qui transformer en prospect.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";
import { apifyGoogleMaps } from "@/lib/site-internet/apify";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function requireAdminUser() {
  const userId = await getServerUserIdWithProxyFallback();
  if (!userId) return { error: "Session requise." as const };
  const supabaseAdmin = createAdminClient();
  const { data: adminRow, error: adminError } = await supabaseAdmin
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (adminError || !adminRow?.user_id) return { error: "Accès admin requis." as const };
  return { ok: true as const };
}

type Candidate = {
  name: string;
  address: string;
  rating: number | null;
  reviews: number | null;
  website: string;
  hasSite: boolean;
  variant: "A" | "B";
};

export async function POST(request: Request) {
  const auth = await requireAdminUser();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  let payload: Record<string, unknown> | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const ville = String(payload?.ville || "").trim();
  const activite = String(payload?.activite || "").trim();
  const maxRatingRaw = Number(payload?.maxRating);
  const maxRating = Number.isFinite(maxRatingRaw) && maxRatingRaw > 0 ? maxRatingRaw : null;

  if (!ville || !activite) {
    return NextResponse.json({ error: "Ville et activité sont requises." }, { status: 400 });
  }

  const apifyToken = String(process.env.APIFY_TOKEN || "").trim();
  if (!apifyToken) {
    return NextResponse.json({ error: "APIFY_TOKEN manquant sur Vercel." }, { status: 409 });
  }

  const items = await apifyGoogleMaps(apifyToken, [activite], `${ville}, france`, 40);
  if (items.length === 0) {
    return NextResponse.json({ error: "Apify n'a renvoyé aucun résultat (token/quota ?).", candidates: [] }, { status: 200 });
  }

  const seen = new Set<string>();
  let candidates: Candidate[] = [];
  for (const it of items) {
    const name = String(it.title || "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const website = String(it.website || "").trim();
    const hasSite = Boolean(website);
    const rating = typeof it.totalScore === "number" ? (it.totalScore as number) : null;
    const reviews = typeof it.reviewsCount === "number" ? (it.reviewsCount as number) : null;

    // Filtre note : si l'admin fixe une note max, on écarte les commerces
    // clairement au-dessus (mais on GARDE ceux sans note et sans site).
    if (maxRating != null && rating != null && rating > maxRating && hasSite) continue;

    candidates.push({
      name,
      address: String(it.address || "").trim(),
      rating,
      reviews,
      website,
      hasSite,
      variant: hasSite ? "B" : "A",
    });
  }

  // Priorité : d'abord ceux sans site (cibles les plus évidentes), puis les
  // moins bien notés (note absente traitée comme neutre).
  candidates = candidates
    .sort((a, b) => {
      if (a.hasSite !== b.hasSite) return a.hasSite ? 1 : -1;
      const ra = a.rating ?? 3.5;
      const rb = b.rating ?? 3.5;
      return ra - rb;
    })
    .slice(0, 30);

  return NextResponse.json({ candidates, count: candidates.length }, { status: 200 });
}
