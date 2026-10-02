import { NextResponse } from "next/server";
import { toutesLesCartes } from "@/lib/direct/apercu-habitant";
import { nomCourt } from "@/lib/site-internet/nom-de-la-page";

// 📲 LE MANIFESTE DE LA PAGE D'UN COMMERCE OUVERTE DEPUIS LA VILLE (`?c=`).
//
// Même défaut, même remède que `site-internet/apercu/[slug]/manifest.webmanifest` :
// sans manifeste à elle, la page posée sur l'écran d'accueil s'ouvrait sur
// clikme.fr. Celui-ci rouvre la page du commerce nommé par `c`, ou la
// maquette quand il n'y en a pas.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const c = new URL(request.url).searchParams.get("c") ?? "";
  const carte = /^[a-z0-9-]{1,60}$/i.test(c) ? toutesLesCartes().find((x) => x.id === c) : undefined;
  const page = carte ? `/autour-de-moi/boutique?c=${encodeURIComponent(carte.id)}` : "/autour-de-moi/boutique";
  const nom = carte?.nom ?? "La page d’un commerce";
  const manifest = {
    name: carte ? `${nom} — démonstration` : nom,
    short_name: nomCourt(nom),
    description: "La page d’un commerce, sur ClikMe. Un commerce de démonstration.",
    id: page,
    start_url: page,
    scope: "/",
    display: "standalone",
    background_color: "#120C09",
    theme_color: "#120C09",
    orientation: "portrait",
    icons: [
      { src: "/direct/icone-autour.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/direct/icone-autour-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/direct/icone-autour-masquable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8", "Cache-Control": "public, max-age=300" },
  });
}
