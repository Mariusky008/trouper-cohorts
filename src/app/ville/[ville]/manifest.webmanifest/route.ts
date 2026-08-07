// Manifeste PWA PAR VILLE : « Ajouter à l'écran d'accueil » doit rouvrir LE
// DIRECT de cette ville, pas le manifeste racine d'une autre app.
//
// C'est le point le plus sous-estimé du produit : une habitude quotidienne doit
// être à un geste. Un résumé par e-mail arrive une fois par jour ; une icône est
// là tout le temps. Pas de passage par les magasins d'applications.
//
// `id` et `start_url` distincts par ville, `scope` limité à /ville/ pour que
// l'app installée ne capture pas le reste du site.
//
// Le mot « catalogue » n'apparaît nulle part — ni ici, ni ailleurs dans ce que
// voit l'habitant. Tout s'appelle Le Direct.
import { NextResponse } from "next/server";
import { nomDeVille, villeSlug } from "@/lib/direct/ville";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ ville: string }> }) {
  const { ville } = await context.params;
  const slug = villeSlug(String(ville || ""));
  const label = nomDeVille(slug.replace(/-/g, " ")) || "ma ville";

  return NextResponse.json(
    {
      name: `Le Direct de ${label}`,
      short_name: label,
      description: `Tout ce qui se passe à ${label} en ce moment.`,
      id: `/ville/${slug}`,
      start_url: `/ville/${slug}`,
      scope: "/ville/",
      display: "standalone",
      orientation: "portrait",
      // Accordés à l'en-tête sombre du Direct : au lancement, l'écran de
      // démarrage doit être la même couleur que la barre qui apparaît ensuite,
      // sinon l'ouverture « clignote » en blanc.
      background_color: "#14201A",
      theme_color: "#14201A",
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
