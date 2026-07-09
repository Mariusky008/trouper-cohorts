// Mode "Découverte" : au lieu de saisir un commerce, on scanne un secteur dans
// une ville (Apify Google Maps) et on remonte les commerces à cibler en
// priorité. Deux familles honnêtes :
//   A — pas de vrai site (aucun, ou seulement une fiche annuaire) → SANS_SITE ;
//   B — a un site (l'analyse décidera s'il a un vrai défaut, sinon écarté).
// Filtre anti-piège : on ne garde que les commerces ENCORE EN ACTIVITÉ (pas
// fermés, avec un signe de vie récent — dernier avis < ~18 mois ou horaires).
// Aucun écrit en base : l'admin (ou la découverte en lot) choisit ensuite qui
// transformer en prospect. On signale ceux déjà créés (alreadyProspect).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";
import { apifyGoogleMaps, normName } from "@/lib/site-internet/apify";
import { isDirectoryUrl, directoryPlatformName } from "@/lib/site-internet/directories";

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
  placeId: string;
  hasSite: boolean;
  directory: string; // plateforme si le "site" n'est qu'une fiche annuaire (Doctolib…)
  variant: "A" | "B";
  // Signaux "encore en activité" (anti-piège du pro qui ne pratique plus).
  active: boolean;
  closed: boolean;
  lastReviewMonths: number | null; // âge du dernier avis en mois (null = inconnu)
  alreadyProspect: boolean; // déjà transformé en prospect (pour le « +N de plus »)
  competitors: Array<{ name: string; note: string }>;
};

const fmtNote = (n: number | null) => (n != null ? `${n.toFixed(1).replace(".", ",")}★` : "");

const norm = normName;

// Âge (en mois) du dernier avis, si l'acteur a renvoyé au moins un avis daté.
function monthsSinceLastReview(item: Record<string, unknown>): number | null {
  const reviews = Array.isArray(item.reviews) ? (item.reviews as Array<Record<string, unknown>>) : [];
  let newest = 0;
  for (const r of reviews) {
    const raw = String(r?.publishedAtDate || r?.publishAtDate || r?.publishedAt || "").trim();
    if (!raw) continue;
    const t = Date.parse(raw);
    if (Number.isFinite(t) && t > newest) newest = t;
  }
  if (!newest) return null;
  const months = (Date.now() - newest) / (1000 * 60 * 60 * 24 * 30.44);
  return months < 0 ? 0 : Math.round(months);
}

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

  // On tire 1 avis (le plus récent) par fiche : c'est le signal « encore en
  // activité » le plus fiable, pour ~négligeable en crédits.
  const res = await apifyGoogleMaps(apifyToken, [activite], `${ville}, france`, 30, {
    maxReviews: 1,
    reviewsSort: "newest",
  });
  if (!res.ok) {
    const hint =
      res.status === 401 || res.status === 403
        ? "Token Apify invalide ou sans accès à l'acteur."
        : res.status === 402 || res.status === 429
          ? "Quota/crédits Apify épuisés (ou trop d'appels) — vérifie ton compte Apify."
          : "Apify a échoué (peut-être un délai dépassé) — réessaie dans un instant.";
    return NextResponse.json({ error: `Apify : ${hint} [${res.error}]`, candidates: [] }, { status: 200 });
  }
  if (res.items.length === 0) {
    return NextResponse.json({ error: "Aucun commerce trouvé pour ce secteur/ville. Essaie un terme plus large (ex. « coiffeur »).", candidates: [] }, { status: 200 });
  }
  const items = res.items;

  // Prospects déjà créés dans cette ville → pour ne jamais reproposer/recréer les
  // mêmes (le « Découvrir N de plus » avance dans la liste).
  const already = new Set<string>();
  try {
    const supabase = createAdminClient();
    const { data: existing } = await supabase
      .from("human_vitrine_sites")
      .select("business_name, city")
      .eq("channel", "letter")
      .limit(2000);
    if (Array.isArray(existing)) {
      const nv = norm(ville);
      for (const row of existing as Array<Record<string, unknown>>) {
        const rc = norm(String(row.city || ""));
        if (rc === nv || rc.includes(nv) || nv.includes(rc)) {
          const bn = norm(String(row.business_name || ""));
          if (bn) already.add(bn);
        }
      }
    }
  } catch {
    /* table pas encore migrée → on n'exclut rien */
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
    // Une fiche d'annuaire (Doctolib, Facebook, PagesJaunes…) n'est PAS un site
    // à soi → le commerçant est en réalité SANS_SITE (meilleure cible).
    const isDir = Boolean(website) && isDirectoryUrl(website);
    const hasSite = Boolean(website) && !isDir;
    const rating = typeof it.totalScore === "number" ? (it.totalScore as number) : null;
    const reviews = typeof it.reviewsCount === "number" ? (it.reviewsCount as number) : null;

    // ── Signaux « encore en activité » ──────────────────────────────────────
    const closed = Boolean(it.permanentlyClosed) || Boolean(it.temporarilyClosed);
    const lastReviewMonths = monthsSinceLastReview(it);
    const hasHours = Array.isArray(it.openingHours) && (it.openingHours as unknown[]).length > 0;
    // Piège : dernier avis très ancien (> 24 mois) = a probablement arrêté.
    const likelyStopped = lastReviewMonths != null && lastReviewMonths > 24;
    // On écarte franchement les commerces fermés ou manifestement inactifs.
    if (closed || likelyStopped) continue;
    let active = false;
    if (lastReviewMonths != null) active = lastReviewMonths <= 18;
    else active = hasHours; // pas d'avis daté → on se fie aux horaires renseignées

    // Filtre note optionnel : on écarte les commerces clairement au-dessus du
    // seuil (mais on GARDE ceux sans note et ceux sans site).
    if (maxRating != null && rating != null && rating > maxRating && hasSite) continue;

    candidates.push({
      name,
      address: String(it.address || "").trim(),
      rating,
      reviews,
      website,
      placeId: String(it.placeId || "").trim(),
      hasSite,
      directory: isDir ? directoryPlatformName(website) : "",
      variant: hasSite ? "B" : "A",
      active,
      closed,
      lastReviewMonths,
      alreadyProspect: already.has(norm(name)),
      competitors: [],
    });
  }

  // Concurrents = les commerces du même secteur qui ONT un site, les mieux
  // notés d'abord. On les attache à chaque cible (sert la variante A).
  const withSite = candidates
    .filter((c) => c.hasSite)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  for (const c of candidates) {
    c.competitors = withSite
      .filter((o) => o.name.toLowerCase() !== c.name.toLowerCase())
      .slice(0, 2)
      .map((o) => ({ name: o.name, note: fmtNote(o.rating) }));
  }

  // Priorité : cibles fraîches et actives sans vrai site d'abord (les plus
  // évidentes), puis actives avec site, puis les moins bien notées — en
  // reléguant en fin de liste celles déjà transformées en prospect.
  candidates = candidates
    .sort((a, b) => {
      if (a.alreadyProspect !== b.alreadyProspect) return a.alreadyProspect ? 1 : -1;
      if (a.active !== b.active) return a.active ? -1 : 1;
      if (a.hasSite !== b.hasSite) return a.hasSite ? 1 : -1;
      const ra = a.rating ?? 3.5;
      const rb = b.rating ?? 3.5;
      return ra - rb;
    })
    .slice(0, 40);

  return NextResponse.json({ candidates, count: candidates.length }, { status: 200 });
}
