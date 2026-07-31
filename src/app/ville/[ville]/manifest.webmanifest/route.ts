// Manifeste PWA PAR VILLE : « Ajouter à l'écran d'accueil » doit rouvrir LE
// catalogue de cette ville, pas le manifeste racine d'une autre app.
//
// C'est le point le plus sous-estimé du produit : une habitude quotidienne doit
// être à un geste. Un digest par e-mail arrive une fois par jour ; une icône est
// là tout le temps.
//
// `id` et `start_url` distincts par ville, `scope` limité à /ville/ pour que
// l'app installée ne capture pas le reste du site.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const capWords = (s: string) =>
  s.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_m, p, c) => p + c.toUpperCase());

export async function GET(_request: Request, context: { params: Promise<{ ville: string }> }) {
  const { ville } = await context.params;
  const slug = String(ville || "").trim().toLowerCase();
  const label = capWords(slug.replace(/-/g, " ")) || "ma ville";

  return NextResponse.json(
    {
      name: `Aujourd'hui à ${label}`,
      short_name: label,
      description: `Ce que proposent les commerçants de ${label} en ce moment.`,
      id: `/ville/${slug}`,
      start_url: `/ville/${slug}`,
      scope: "/ville/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#0E1014",
      theme_color: "#0E1014",
      icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
    },
    {
      headers: {
        "Content-Type": "application/manifest+json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  );
}
