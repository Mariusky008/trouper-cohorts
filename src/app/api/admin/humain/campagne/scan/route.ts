import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 240;

type ScanProspect = {
  externalId: string;
  fullName: string;
  metier: string;
  requestedMetier: string;
  city: string;
  phoneE164: string | null;
  rating: number | null;
};

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
  const { data: memberRow, error: memberError } = await supabaseAdmin.from("human_members").select("id").eq("user_id", userId).maybeSingle();
  if (memberError || !memberRow?.id) return { error: "Profil human_member admin introuvable." as const };
  return { ownerMemberId: String(memberRow.id) };
}

function normalizePhone(rawValue?: string | null): string | null {
  const raw = String(rawValue || "").trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`.slice(0, 24);
  if (digits.startsWith("33")) return `+${digits}`.slice(0, 24);
  if (digits.startsWith("0") && digits.length >= 9) return `+33${digits.slice(1)}`.slice(0, 24);
  if (digits.length >= 8) return `+${digits}`.slice(0, 24);
  return null;
}

function pickString(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function pickNumber(row: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const raw = row[key];
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string") {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

async function runApifySearch(input: { city: string; metiers: string[]; limitPerMetier: number }) {
  const apifyToken = String(process.env.APIFY_TOKEN || "").trim();
  const apifyTaskSlug = String(process.env.APIFY_TASK_SLUG || "").trim();
  if (!apifyToken || !apifyTaskSlug) {
    return { error: "Apify non configuré. Renseigner APIFY_TOKEN et APIFY_TASK_SLUG.", prospects: [] as ScanProspect[] };
  }
  const normalizedSlug = apifyTaskSlug.includes("/") ? apifyTaskSlug.replace("/", "~") : apifyTaskSlug;
  const endpoint = `https://api.apify.com/v2/actor-tasks/${encodeURIComponent(normalizedSlug)}/run-sync-get-dataset-items`;
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apifyToken}`,
      },
      body: JSON.stringify({
        searchStringsArray: input.metiers.slice(0, 10),
        locationQuery: input.city,
        maxCrawledPlacesPerSearch: Math.max(1, Math.min(10, Math.round(input.limitPerMetier || 3))),
        language: "fr",
        maxImages: 0,
        includeWebResults: false,
        skipClosedPlaces: true,
        additionalInfo: false,
      }),
      cache: "no-store",
    });
  } catch (error) {
    return {
      error: error instanceof Error ? `Apify: ${error.message}` : "Apify: erreur réseau (fetch).",
      prospects: [] as ScanProspect[],
    };
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const msg =
      typeof payload === "string"
        ? payload.slice(0, 240)
        : typeof payload === "object" && payload
          ? JSON.stringify(payload).slice(0, 240)
          : "";
    return { error: `Apify: erreur (${response.status}). ${msg || "Recherche impossible."}`, prospects: [] as ScanProspect[] };
  }
  const rows = Array.isArray(payload) ? payload : [];
  const prospects = rows
    .map((item, idx) => {
      const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
      const fullName = pickString(row, ["title", "name", "placeName", "displayName", "businessName"]);
      const requestedMetier = pickString(row, ["searchString"]) || input.metiers[idx % Math.max(1, input.metiers.length)] || "partenaire local";
      const metier = pickString(row, ["categoryName", "category", "searchString"]) || requestedMetier;
      if (!fullName || !metier) return null;
      const city = pickString(row, ["city", "locationCity", "addressCity"]) || input.city;
      const externalId =
        pickString(row, ["placeId", "cid", "url", "googleMapsUrl"]) || `${fullName.toLowerCase()}-${metier.toLowerCase()}-${idx + 1}`;
      const phoneRaw = pickString(row, ["phone", "phoneUnformatted", "phoneNumber", "phoneInternational"]);
      return {
        externalId,
        fullName,
        metier,
        requestedMetier,
        city,
        phoneE164: normalizePhone(phoneRaw),
        rating: pickNumber(row, ["totalScore", "rating", "stars"]),
      } satisfies ScanProspect;
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
  return { error: null as string | null, prospects };
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    if ("error" in admin) return NextResponse.json({ success: false, error: admin.error }, { status: 401 });

    const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const city = String(payload?.city || "").trim();
    const provider = String(payload?.provider || "b2b").trim().toLowerCase();
    const metiers = Array.isArray(payload?.metiers) ? payload?.metiers : [];
    const metiersNormalized = metiers.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 60);
    const limitPerMetier = Math.max(1, Math.min(10, Math.round(Number(payload?.limitPerMetier || 3))));
    if (!city) return NextResponse.json({ success: false, error: "Ville requise." }, { status: 400 });
    if (metiersNormalized.length === 0) return NextResponse.json({ success: false, error: "Liste de métiers vide." }, { status: 400 });
    if (provider !== "b2b") return NextResponse.json({ success: false, error: "Provider non supporté pour l’instant." }, { status: 400 });

    const chunkSize = 10;
    const chunks = Array.from({ length: Math.ceil(metiersNormalized.length / chunkSize) }).map((_, idx) =>
      metiersNormalized.slice(idx * chunkSize, idx * chunkSize + chunkSize),
    );
    const responses = await Promise.all(chunks.map((chunk) => runApifySearch({ city, metiers: chunk, limitPerMetier })));
    const firstError = responses.find((result) => result.error)?.error || null;

    const byPhone = new Map<string, ScanProspect>();
    const withoutPhone: ScanProspect[] = [];
    responses
      .flatMap((result) => result.prospects || [])
      .forEach((prospect) => {
        if (prospect.phoneE164) {
          const current = byPhone.get(prospect.phoneE164);
          const nextRating = Number(prospect.rating || 0);
          const currentRating = current ? Number(current.rating || 0) : -1;
          if (!current || nextRating >= currentRating) {
            byPhone.set(prospect.phoneE164, prospect);
          }
        } else {
          withoutPhone.push(prospect);
        }
      });

    const prospects = [...Array.from(byPhone.values()), ...withoutPhone].slice(0, 800);
    return NextResponse.json({
      success: true,
      ownerMemberId: admin.ownerMemberId,
      prospects,
      warning: firstError,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur serveur scan campagne." },
      { status: 500 },
    );
  }
}
