// LA PAGE D'UN BON D'ÉCHANGE — ce qu'ouvre l'appareil photo d'un téléphone
// qui scanne le QR d'un bon (`/bon/CLK-XXXXXX`).
//
// Chez le commerçant qui fournit, sur SON téléphone, le comptoir a laissé de
// quoi le reconnaître : la page propose alors de valider le bon d'un geste.
// Ailleurs, elle explique quoi faire — sans rien montrer du bon lui-même : un
// code ne dit pas à qui il appartient.
//
// SAUF LE CADEAU DU VOISIN : ce bon-là a été remis à un client, qui doit voir
// ce qu'il a reçu, de qui, où aller et jusqu'à quand (`lireBonCadeau`).
import type { Metadata, Viewport } from "next";
import { MARQUE } from "@/lib/marque";
import { codeNormalise } from "@/lib/echanges/echanges";
import { lireBonCadeau } from "@/lib/echanges/bon-public";
import { ValiderBon } from "./valider-bon";

export const dynamic = "force-dynamic";

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#120C09" };

export const metadata: Metadata = {
  title: { absolute: `Bon d’échange — ${MARQUE}` },
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const propre = codeNormalise(decodeURIComponent(String(code ?? "")));
  const cadeau = propre ? await lireBonCadeau(propre) : null;
  return <ValiderBon code={propre} cadeau={cadeau} />;
}
