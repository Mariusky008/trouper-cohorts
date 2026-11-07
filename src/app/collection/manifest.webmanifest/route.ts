// 📲 LE MANIFESTE DE CLIKME, POSÉ SUR L'ÉCRAN D'ACCUEIL (le lot 3, 7 novembre 2026).
//
// SANS LUI, « Sur l'écran d'accueil » depuis `/collection` ouvrait clikme.fr : le manifeste racine porte `start_url: "/"`,
// et le téléphone suit le manifeste, pas la page d'où l'on installe (même défaut, même remède qu'`/autour-de-moi` et
// `/pro`). `id` reste `/collection` : une seule appli ClikMe sur un téléphone, quel que soit le jeton.
//
// `?appli=<jeton>` : la page se recharge avec, juste avant d'installer sur iPhone (`appli-collection-serveur.ts`) ;
// l'appli s'ouvrira alors sur cette adresse, et le jeton y posera le cookie de SA figurine. Sans jeton : `/collection`.
import { jetonValide } from "@/lib/direct/appli-collection-serveur";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const jeton = new URL(request.url).searchParams.get("appli");
  const manifeste = {
    name: "ClikMe — ta figurine qui parle",
    short_name: "ClikMe",
    description: "Ta figurine qui parle, tes mèmes, et le mème du jour à 11 h 30.",
    id: "/collection",
    start_url: jetonValide(jeton) ? `/collection?appli=${jeton}` : "/collection",
    scope: "/collection",
    display: "standalone",
    // (la couleur de l'appli : c'est elle que le téléphone montre au lancement, avant le premier écran)
    background_color: "#12060F",
    theme_color: "#12060F",
    orientation: "portrait",
    // le signe ClikMe recentré, comme partout sur le site (voir `icons` dans `app/layout.tsx`)
    icons: [
      { src: "/direct/icone-autour.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/direct/icone-autour-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/direct/icone-autour-masquable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return new Response(JSON.stringify(manifeste), {
    headers: { "content-type": "application/manifest+json; charset=utf-8", "cache-control": "no-store" },
  });
}
