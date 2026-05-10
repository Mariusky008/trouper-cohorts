import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function toCityLabel(ville: string): string {
  const value = String(ville || "").trim().toLowerCase();
  if (!value) return "Catalogue";
  if (value === "dax") return "Grand Dax";
  if (value === "bordeaux") return "Bordeaux";
  if (value === "bayonne") return "Bayonne";
  if (value === "mont-de-marsan") return "Mont-de-Marsan";
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function buildStartUrl(ville: string, request: NextRequest): string {
  const city = String(ville || "dax").trim().toLowerCase() || "dax";
  const query = new URLSearchParams();
  for (const [key, value] of request.nextUrl.searchParams.entries()) {
    if (!key) continue;
    if (key === "v") continue;
    query.append(key, value);
  }
  const qs = query.toString();
  return qs ? `/privilege/${city}?${qs}` : `/privilege/${city}`;
}

export async function GET(request: NextRequest, context: { params: Promise<{ ville: string }> | { ville: string } }) {
  const resolvedParams = await Promise.resolve(context.params);
  const ville = String(resolvedParams?.ville || "dax").trim().toLowerCase() || "dax";
  const label = toCityLabel(ville);
  const startUrl = buildStartUrl(ville, request);
  const manifest = {
    name: `Catalogue Popey — ${label}`,
    short_name: `Popey ${label}`,
    description: "Catalogue privilèges Popey.",
    id: startUrl,
    start_url: startUrl,
    scope: "/privilege/",
    display: "standalone",
    background_color: "#E2D9BC",
    theme_color: "#0A0B0C",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
