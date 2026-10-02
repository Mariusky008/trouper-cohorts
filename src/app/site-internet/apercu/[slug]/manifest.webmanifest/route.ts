import { NextResponse } from "next/server";
import { nomCourt, nomDeLaPage } from "@/lib/site-internet/nom-de-la-page";

// 📲 LE MANIFESTE DE LA PAGE D'UN COMMERCE — pour qu'elle s'ouvre, une fois sur l'écran d'accueil.
//
// « Tous ces sites, quand je veux les mettre sur l'écran d'accueil de mon iPad
// ou de mon téléphone, s'ouvrent sur clikme.fr au lieu d'arriver sur les
// bonnes adresses. »
//
// C'EST LE DÉFAUT QU'`/autour-de-moi` A DÉJÀ CONNU, sur une autre adresse.
// `app/layout.tsx` déclare `manifest: "/manifest.json"`, qui porte
// `start_url: "/"`. L'iPhone et l'iPad ne retiennent pas la page depuis
// laquelle on installe : ils ouvrent ce que le manifeste leur dit d'ouvrir. La
// page du Bordeaux, posée sur l'écran d'accueil, s'ouvrait donc sur le site de
// ClikMe.
//
// CHAQUE PAGE A DÉSORMAIS LE SIEN, fabriqué à la demande :
//   · `start_url` est SA page — c'est ce qui s'ouvre ;
//   · `id` aussi, et c'est ce qui permet de poser le Bordeaux ET El Txupinazo
//     sur le même écran : avec un même identifiant, le second écrasait le
//     premier ;
//   · `scope` reste tout le site : « Explorer ma ville » mène à
//     `/autour-de-moi`, et l'en sortir l'aurait ouvert dans une feuille de
//     navigateur par-dessus l'application ;
//   · `name` est son nom, et c'est lui qu'on lit sous l'icône.
//
// QUI L'INSTALLE COMPTE. Un client venu par l'affiche ou le Direct porte
// `?via=` ; ouverte sans, la page le prendrait pour le commerçant et lui
// montrerait l'argumentaire. Son icône rouvre donc la page avec `via=ecran` —
// un visiteur public, qui ne compte pas comme un passage amené par le
// collectif (voir `VIA_PUBLIC` et `VIA_COLLECTIF` dans `page.tsx`). Le
// commerçant, lui, installe sa page sans `via`, et la retrouve telle qu'il la
// connaît.
export const dynamic = "force-dynamic";

const VIA_PUBLIC = new Set(["direct", "catalogue", "digest", "alerte", "offre", "affiche", "ecran"]);

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,120}$/i.test(slug)) return new NextResponse("Not found", { status: 404 });
  const via = new URL(request.url).searchParams.get("via") ?? "";
  const page = `/site-internet/apercu/${slug}`;
  const trouve = await nomDeLaPage(slug);
  const nom = trouve?.nom ?? "Sa page ClikMe";
  const manifest = {
    name: nom,
    short_name: nomCourt(nom),
    description: trouve
      ? `${nom}${trouve.ville ? ` à ${trouve.ville}` : ""}, sur ClikMe : ce qu’on peut y essayer, et comment y aller.`
      : "Une page de commerce, sur ClikMe.",
    id: page,
    start_url: VIA_PUBLIC.has(via) ? `${page}?via=ecran` : page,
    scope: "/",
    display: "standalone",
    // LA NUIT BRUNE DES PAGES : c'est la couleur du lancement, avant le
    // premier affichage. Un éclair beige avant un écran sombre se voit.
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
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
