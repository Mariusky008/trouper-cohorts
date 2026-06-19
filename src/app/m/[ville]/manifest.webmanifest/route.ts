import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function toCityLabel(ville: string): string {
  const value = String(ville || "").trim().toLowerCase();
  if (!value) return "Popey";
  if (value === "dax") return "Dax";
  if (value === "bordeaux") return "Bordeaux";
  if (value === "bayonne") return "Bayonne";
  if (value === "mont-de-marsan") return "Mont-de-Marsan";
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function buildStartUrl(ville: string, request: NextRequest): string {
  const city = String(ville || "dax").trim().toLowerCase() || "dax";
  const query = new URLSearchParams();
  for (const [key, value] of request.nextUrl.searchParams.entries()) {
    if (!key || key === "v") continue;
    query.append(key, value);
  }
  const qs = query.toString();
  return qs ? `/m/${city}?${qs}` : `/m/${city}`;
}

// Manifest PWA PAR VILLE de l'app cliente v3 (/m/<ville>). id + start_url distincts → l'app installée
// sur l'écran d'accueil ouvre BIEN le catalogue de cette ville (pas le manifest racine d'une autre app).
export async function GET(request: NextRequest, context: { params: Promise<{ ville: string }> | { ville: string } }) {
  const resolvedParams = await Promise.resolve(context.params);
  const ville = String(resolvedParams?.ville || "dax").trim().toLowerCase() || "dax";
  const label = toCityLabel(ville);
  const manifest = {
    name: `Popey — ${label}`,
    short_name: `Popey ${label}`,
    description: "Tes commerçants de quartier à swiper — deviens leur habitué·e.",
    id: `/m/${ville}`,
    start_url: buildStartUrl(ville, request),
    scope: "/m/",
    display: "standalone",
    background_color: "#0B0D12",
    theme_color: "#0B0D12",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
  };
  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
