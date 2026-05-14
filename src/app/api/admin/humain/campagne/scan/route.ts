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

type ScanMeta = {
  searchTerms: string[];
  fallbackUsed: boolean;
  rawCount: number;
};

const METIER_SEARCH_ALIASES: Record<string, string[]> = {
  "Pisciniste (Entretien ou construction)": ["pisciniste", "constructeur de piscine", "entretien piscine"],
  "Élagueur": ["élagueur", "elagage", "paysagiste"],
  "Nettoyage de toiture / Façade": ["demoussage toiture", "nettoyage toiture", "nettoyage facade", "facadier", "ravalement facade"],
  "Architecte d'intérieur / Décorateur": ["architecte d'intérieur", "décorateur intérieur", "décorateur"],
  "Cuisiniste": ["magasin de cuisine", "cuisine sur mesure", "concepteur cuisine", "cuisiniste"],
  "Menuisier (Portails, terrasses bois)": ["pose de portail", "portail alu", "terrasse bois", "menuiserie exterieure", "menuisier"],
  "Storiste / Volets roulants": ["volets roulants", "store banne", "storiste"],
  "Entreprise de nettoyage (Aide au ménage ou grand nettoyage de printemps)": [
    "entreprise de nettoyage",
    "service de ménage",
    "aide ménagère",
  ],
  "Déménageur": ["déménageur", "demenagement", "societe de demenagement"],
  "Garde-meuble / Self-stockage": ["garde meuble", "self stockage", "box de stockage"],
  "Ramoneur": ["ramoneur", "ramonage"],
  "Vente de poêles à bois / Granulés": ["poele a bois", "poele a granules", "chauffage bois"],
  "Restaurants / Bar": ["restaurant", "bar", "brasserie"],
  "Coach sportif à domicile": ["coach sportif", "coach sportif domicile", "personal trainer"],
  "Studio de Yoga / Pilates": ["yoga", "pilates", "studio yoga"],
  "Institut de beauté (Soins du visage/corps)": ["institut de beauté", "soin du visage", "soin du corps"],
  "Centre d'amincissement / Cryothérapie": ["centre amincissement", "cryotherapie", "minceur"],
  "Barbière / Coiffeur créateur": ["barbier", "coiffeur", "salon de coiffure"],
  "Prothésiste ongulaire": ["prothesiste ongulaire", "onglerie", "nail artist"],
  "Réflexologue / Sophrologue": ["reflexologue", "sophrologue", "bien etre"],
  "Ostéopathe / Masseur bien-être": ["osteopathe", "massage bien etre", "masseur"],
  "Blanchiment dentaire / Sourire": ["blanchiment dentaire", "blanchiment dents", "esthetique sourire"],
  "Tatoueur": ["tatoueur", "tatouage"],
  "Nettoyage auto à domicile (Intérieur/Extérieur)": ["nettoyage auto", "lavage auto domicile", "detailing auto"],
  "Réparation de pare-brise": ["pare brise", "reparation pare brise", "vitrage auto"],
  "Vente de vélos électriques / Réparateur": ["velo electrique", "reparation velo", "magasin velo"],
  "Contrôle technique": ["controle technique auto", "controle technique"],
  "Auto-école": ["auto ecole", "permis de conduire"],
  "Toiletteur canin": ["toiletteur canin", "toilettage chien"],
  "Éducateur canin / Comportementaliste": ["educateur canin", "comportementaliste canin"],
  "Pet-sitter / Pension pour chiens et chats": ["pet sitter", "pension canine", "garde animaux"],
  "Photographe (Grossesse, mariage, portrait)": ["photographe mariage", "photographe portrait", "photographe grossesse"],
  "Traiteur / Chef à domicile": ["traiteur", "chef a domicile"],
  "Organisateur d'anniversaires enfants": ["animation anniversaire enfant", "organisateur anniversaire", "evenement enfant"],
  "Caviste": ["caviste", "boutique vin"],
  "Boutique de fleurs / Ateliers floraux": ["fleuriste", "atelier floral"],
  "Magasin de jeux de société / Escape Game local": ["escape game", "jeux de societe", "loisirs indoor"],
  "Food-truck local": ["food truck", "restauration mobile"],
  "Pâtissier / Cake Designer": ["patisserie", "cake designer", "patissier"],
  "Soutien scolaire / Cours d'anglais": ["soutien scolaire", "cours anglais", "cours particuliers"],
  "Garde d'enfants (Babysitting structuré)": ["garde d'enfants", "babysitting", "nounou"],
  "Coach de vie / Conseil conjugal": ["coach de vie", "conseil conjugal", "therapie couple"],
  "Informaticien (Dépannage PC / Installation Box)": ["depannage informatique", "reparation pc", "installation box"],
  "Agent immobilier indépendant": ["agent immobilier", "agence immobiliere"],
  "Courtier en prêt immobilier": ["courtier immobilier", "courtier pret immobilier"],
  "Assureur (Auto / Habitation / Santé)": ["assurance auto", "assurance habitation", "mutuelle sante"],
  "Conseiller en gestion de patrimoine": ["gestion de patrimoine", "conseiller patrimoine"],
  "Courtier en travaux": ["courtier en travaux", "travaux renovation"],
  "Pompes funèbres / Marbrerie": ["pompes funebres", "marbrerie funeraire"],
  "Vente et installation d'alarmes / Télésurveillance": ["alarme maison", "telesurveillance", "installateur alarme"],
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
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
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    return {
      error:
        error instanceof Error && error.name === "AbortError"
          ? "Apify: délai dépassé (>45s). Réduis le volume ou relance le scan."
          : error instanceof Error
            ? `Apify: ${error.message}`
            : "Apify: erreur réseau (fetch).",
      prospects: [] as ScanProspect[],
      meta: {
        searchTerms: input.metiers.slice(0, 10),
        fallbackUsed: false,
        rawCount: 0,
      } satisfies ScanMeta,
    };
  }
  clearTimeout(timeout);

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
    return {
      error:
        response.status === 504
          ? `Apify: timeout upstream (504). ${msg || "Le provider a mis trop de temps à répondre."}`
          : `Apify: erreur (${response.status}). ${msg || "Recherche impossible."}`,
      prospects: [] as ScanProspect[],
      meta: {
        searchTerms: input.metiers.slice(0, 10),
        fallbackUsed: false,
        rawCount: 0,
      } satisfies ScanMeta,
    };
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
  return {
    error: null as string | null,
    prospects,
    meta: {
      searchTerms: input.metiers.slice(0, 10),
      fallbackUsed: false,
      rawCount: rows.length,
    } satisfies ScanMeta,
  };
}

function expandMetierSearchTerms(input: string) {
  const raw = String(input || "").trim();
  if (!raw) return [];
  const variants = new Set<string>();
  const add = (value: string) => {
    const clean = String(value || "").replace(/\s+/g, " ").trim();
    if (clean.length >= 3) variants.add(clean);
  };
  add(raw);
  add(raw.replace(/\([^)]*\)/g, " "));
  raw.split("/").forEach((part) => add(part));
  const withoutParenthesis = raw.replace(/\([^)]*\)/g, " ").trim();
  if (withoutParenthesis.includes("/")) {
    add(withoutParenthesis.replace(/\//g, " "));
  }
  return Array.from(variants).slice(0, 4);
}

function buildPreferredMetierSearchTerms(input: string) {
  const curated = METIER_SEARCH_ALIASES[String(input || "").trim()] || [];
  const fallback = expandMetierSearchTerms(input);
  const ordered = new Set<string>();
  [...curated, ...fallback].forEach((term) => {
    const clean = String(term || "").trim();
    if (clean) ordered.add(clean);
  });
  return Array.from(ordered).slice(0, 5);
}

function withScanMeta<T extends { error: string | null; prospects: ScanProspect[]; meta?: ScanMeta }>(
  result: T,
  searchTerms: string[],
  fallbackUsed: boolean,
) {
  return {
    ...result,
    meta: {
      ...(result.meta || { rawCount: 0 }),
      searchTerms,
      fallbackUsed,
    } satisfies ScanMeta,
  };
}

async function runApifySearchWithFallback(input: { city: string; metier: string; limitPerMetier: number }) {
  const preferredTerms = buildPreferredMetierSearchTerms(input.metier);
  const primaryTerm = preferredTerms[0] || input.metier;
  const fallbackTerms = preferredTerms.filter((term) => term !== primaryTerm).slice(0, 3);
  const primary = withScanMeta(
    await runApifySearch({ city: input.city, metiers: [primaryTerm], limitPerMetier: input.limitPerMetier }),
    [primaryTerm],
    false,
  );
  if (!primary.error && primary.prospects.length > 0) return primary;

  let bestNonErrorResult = primary.error ? null : primary;
  for (const term of fallbackTerms) {
    const retry = withScanMeta(
      await runApifySearch({ city: input.city, metiers: [term], limitPerMetier: input.limitPerMetier }),
      [term],
      true,
    );
    if (!retry.error && retry.prospects.length > 0) return retry;
    if (!retry.error) bestNonErrorResult = retry;
  }

  return bestNonErrorResult || primary;
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

    const responses = await Promise.all(
      metiersNormalized.map((metier) => runApifySearchWithFallback({ city, metier, limitPerMetier })),
    );
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
      scanMeta: responses[0]?.meta || null,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur serveur scan campagne." },
      { status: 500 },
    );
  }
}
