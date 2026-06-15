import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Manifest PWA de l'espace commerçant : le start_url RENVOIE sur /privilege/pro avec les
// mêmes params (p / token / tab) → « Ajouter à l'écran d'accueil » rouvre bien sa page perso
// (et non le manifest racine /manifest.json dont le start_url est /mon-reseau-local/dashboard).
function buildStartUrl(request: NextRequest): { startUrl: string; slug: string } {
  const params = request.nextUrl.searchParams;
  const slug = String(params.get("p") || params.get("token") || "").trim();
  const query = new URLSearchParams();
  for (const [key, value] of params.entries()) {
    if (!key || key === "v") continue;
    query.append(key, value);
  }
  const qs = query.toString();
  return { startUrl: qs ? `/privilege/pro?${qs}` : "/privilege/pro", slug };
}

export async function GET(request: NextRequest) {
  const { startUrl, slug } = buildStartUrl(request);
  const manifest = {
    name: "Espace commerçant — Popey",
    short_name: "Popey Pro",
    description: "Vos statistiques, votre mission et votre classement Popey Privilège.",
    // id distinct par commerçant → install séparée ; scope large → reste en standalone.
    id: slug ? `/privilege/pro/${slug}` : "/privilege/pro",
    start_url: startUrl,
    scope: "/privilege/",
    display: "standalone",
    background_color: "#0B0D14",
    theme_color: "#0B0D14",
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
