// 🎁 LE BON D'UNE SURPRISE DU CHEF — ce qu'ouvre l'appareil photo du commerçant qui scanne le QR de l'écran d'un client
// (`/f/<lien>/bon/<code>`). Sur SON téléphone (le comptoir y a laissé de quoi le reconnaître), la page propose
// « Servie » d'un geste : c'est une venue. Ailleurs, elle ne montre rien du bon : un code ne dit pas à qui il est.
import type { Metadata, Viewport } from "next";
import { MARQUE } from "@/lib/marque";
import { codeBonPropre } from "@/lib/direct/surprise-code";
import { ServirBon } from "./servir-bon";

export const dynamic = "force-dynamic";

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#120C09" };

export const metadata: Metadata = {
  title: { absolute: `Surprise du chef — ${MARQUE}` },
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ slug: string; code: string }> }) {
  const { slug, code } = await params;
  const propre = codeBonPropre(decodeURIComponent(String(code ?? "")));
  return <ServirBon slug={decodeURIComponent(String(slug ?? ""))} code={propre.length === 4 ? propre : ""} />;
}
