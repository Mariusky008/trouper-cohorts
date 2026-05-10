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

function buildStartUrl(request: NextRequest): { startUrl: string; ville: string } {
  const params = request.nextUrl.searchParams;
  const ville = String(params.get("ville") || "dax").trim().toLowerCase() || "dax";
  const query = new URLSearchParams();
  for (const [key, value] of params.entries()) {
    if (!key) continue;
    if (key === "v") continue;
    query.append(key, value);
  }
  query.set("ville", ville);
  const qs = query.toString();
  return { startUrl: qs ? `/privilege/app?${qs}` : "/privilege/app?ville=dax", ville };
}

export async function GET(request: NextRequest) {
  const { startUrl, ville } = buildStartUrl(request);
  const label = toCityLabel(ville);
  const manifest = {
    name: `Catalogue Popey — ${label}`,
    short_name: "Catalogue Popey",
    description: "Catalogue privilèges Popey.",
    id: "/privilege/app",
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

