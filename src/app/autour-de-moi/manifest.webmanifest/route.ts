import { NextResponse } from "next/server";

// LE MANIFESTE DE L'APPLICATION HABITANT.
//
// LE DÉFAUT QU'IL CORRIGE. « Ajouter à l'écran d'accueil » depuis
// `/autour-de-moi` posait bien une icône, mais l'ouvrir renvoyait sur
// clikme.fr. La raison est dans `app/layout.tsx` : il déclare
// `manifest: "/manifest.json"`, et ce fichier porte `start_url: "/"`. Le
// téléphone ne retient pas la page depuis laquelle on a installé — il retient
// ce que le manifeste lui dit d'ouvrir. Toute la maquette était donc
// inatteignable une fois installée.
//
// `id`, `start_url` ET `scope` valent tous les trois `/autour-de-moi` :
//   · `start_url` décide de ce qui s'ouvre ;
//   · `scope` garde la navigation dans l'application plutôt que de rebasculer
//     dans le navigateur au premier lien ;
//   · `id` empêche le téléphone de confondre cette installation avec celle du
//     manifeste racine — sans lui, installer les deux écrase la première.
//
// Même forme que `/pro/manifest.webmanifest`, qui règle exactement le même
// problème pour l'espace commerçant.
export const dynamic = "force-static";

export async function GET() {
  const manifest = {
    name: "Autour de moi — Clikme",
    short_name: "Autour de moi",
    description: "Ce qui se passe maintenant dans les commerces à côté de vous.",
    id: "/autour-de-moi",
    start_url: "/autour-de-moi",
    scope: "/autour-de-moi",
    display: "standalone",
    // Le fond doit être celui de l'application, pas le beige du site : c'est la
    // couleur que le téléphone affiche pendant le lancement, et un éclair clair
    // avant un écran noir se voit.
    background_color: "#05090C",
    theme_color: "#05090C",
    orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-touch-icon.png", sizes: "360x360", type: "image/png", purpose: "any" },
    ],
  };
  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
}
