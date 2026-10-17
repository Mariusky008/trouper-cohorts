import { NextResponse } from "next/server";

// LE MANIFESTE DE L'ACCÈS D'UN MEMBRE — `/e/<jeton>/manifest.webmanifest`.
//
// « Ajouter à l'écran d'accueil » : LE TÉLÉPHONE NE RETIENT PAS LA PAGE DEPUIS
// LAQUELLE ON INSTALLE, il retient ce que le manifeste lui dit d'ouvrir. Sans
// manifeste à elle, la page d'un membre hérite de celui de la racine
// (`start_url: "/"`) : son icône rouvrirait clikme.fr, pas son accès. Le même
// défaut que le comptoir (`autour-de-moi/assistante/manifest.webmanifest`).
//
// UN MANIFESTE PAR LIEN : `start_url`, `scope` et `id` désignent SON accès. Deux
// membres sur un même téléphone (ou un membre et son responsable) ont chacun
// leur icône, sans que l'une écrase l'autre. Le jeton y figure : c'est déjà
// l'adresse de la page, rien de plus n'est dévoilé.
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params;
  const j = decodeURIComponent(String(jeton ?? ""));
  if (!/^[A-Za-z0-9_-]{24,64}$/.test(j)) return NextResponse.json({ error: "Lien inconnu." }, { status: 404 });
  const ici = `/e/${j}`;
  const manifest = {
    name: "Mon accès ClikMe",
    short_name: "Mon accès",
    description: "Tes 50 € du mois chez les commerçants ClikMe, tes bons, et « Valider un bon » au comptoir.",
    id: ici,
    start_url: ici,
    scope: ici,
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
    headers: { "Content-Type": "application/manifest+json; charset=utf-8", "Cache-Control": "private, no-store" },
  });
}
