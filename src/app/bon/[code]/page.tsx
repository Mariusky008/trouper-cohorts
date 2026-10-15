// LA PAGE D'UN BON D'ÉCHANGE — ce qu'ouvre l'appareil photo d'un téléphone
// qui scanne le QR d'un bon (`/bon/CLK-XXXXXX`).
//
// Chez le commerçant qui fournit, sur SON téléphone, le comptoir a laissé de
// quoi le reconnaître : la page propose alors de valider le bon d'un geste.
// Ailleurs, elle explique quoi faire — sans rien montrer du bon lui-même : un
// code ne dit pas à qui il appartient.
import type { Metadata, Viewport } from "next";
import { MARQUE } from "@/lib/marque";
import { codeNormalise } from "@/lib/echanges/echanges";
import { ValiderBon } from "./valider-bon";

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#120C09" };

export const metadata: Metadata = {
  title: { absolute: `Bon d’échange — ${MARQUE}` },
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <ValiderBon code={codeNormalise(decodeURIComponent(String(code ?? "")))} />;
}
