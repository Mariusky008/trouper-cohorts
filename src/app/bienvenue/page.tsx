// 👋 LA BIENVENUE « ENTRE CHEZ PABLITO », À SON ADRESSE DIRECTE (`clikme.fr/bienvenue`) — pour la regarder, la rejouer,
// la montrer (`lib/direct/bienvenue.ts`). Elle se joue chez Pablito : l'univers que le propriétaire a adopté depuis
// l'admin (`/admin/humain/univers-essais`, « 🏡 L'univers de Pablito »). Jamais dans les moteurs de recherche.
import type { Metadata, Viewport } from "next";
import { ApercuBienvenue } from "./apercu";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Bienvenue chez Pablito — ClikMe", robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#12060F" };

export default function PageBienvenue() {
  return <ApercuBienvenue />;
}
