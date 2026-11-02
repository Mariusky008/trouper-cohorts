// 🏆 « MA COLLECTION » — toutes ses figurines, commerce par commerce (`clikme.fr/collection`).
//
// « Un commerce = une page (sa famille) ; un client = une page (sa collection). » Pas dans l'application de la ville,
// déjà pleine : une page à part, qu'on ouvre par un lien — depuis sa page de famille (« Toutes mes figurines »), et
// plus tard depuis l'écran qui suit une visite validée. Voir `docs/figurines.md` (9.0) et `lib/direct/collection.ts`.
import type { Metadata, Viewport } from "next";
import { MaCollection } from "./ma-collection";

export const metadata: Metadata = {
  title: "Ma collection de figurines · ClikMe",
  description: "Toutes tes figurines, commerce par commerce : une visite, une figurine ; à 10, la figurine d’or.",
  robots: { index: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#12060F" };

export default function PageCollection() {
  return <MaCollection />;
}
