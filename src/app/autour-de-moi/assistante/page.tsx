// LE COMPTOIR — l'espace du commerçant. Voir `comptoir.tsx`.
//
// NOINDEX : c'est l'écran d'un commerçant, pas une page publique.
//
// SON PROPRE MANIFESTE, et c'est tout le sujet : sans lui, « ajouter à l'écran
// d'accueil » posait une icône qui rouvrait clikme.fr — le téléphone suit le
// manifeste, jamais la page depuis laquelle on installe.
import type { Metadata, Viewport } from "next";
import { MARQUE } from "@/lib/marque";
import { Comptoir } from "./comptoir";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#120C09",
};

export const metadata: Metadata = {
  title: { absolute: `Mon comptoir — ${MARQUE}` },
  robots: { index: false, follow: false },
  manifest: "/autour-de-moi/assistante/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Mon comptoir", statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/direct/icone-autour.svg", type: "image/svg+xml" },
      { url: "/direct/icone-autour-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/direct/icone-autour-512.png",
    apple: "/direct/icone-autour-180.png",
  },
};

export default function Page() {
  return <Comptoir />;
}
