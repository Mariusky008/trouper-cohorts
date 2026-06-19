import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function buildStartUrl(request: NextRequest): string {
  const query = new URLSearchParams();
  for (const [key, value] of request.nextUrl.searchParams.entries()) {
    if (!key || key === "v") continue;
    query.append(key, value);
  }
  const qs = query.toString();
  return qs ? `/pro?${qs}` : `/pro`;
}

// Manifest PWA de l'espace PRO v3 (/pro). id + start_url = /pro → l'app installée ouvre BIEN l'espace
// commerçant (pas le manifest racine d'une autre app). Le lien magique (?p=…) est conservé dans start_url.
export async function GET(request: NextRequest) {
  const manifest = {
    name: "Popey — Espace Pro",
    short_name: "Popey Pro",
    description: "Ton espace commerçant Popey : visites, fidélité, coups de feu.",
    id: "/pro",
    start_url: buildStartUrl(request),
    scope: "/pro",
    display: "standalone",
    background_color: "#0B0D12",
    theme_color: "#0B0D12",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
  };
  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
