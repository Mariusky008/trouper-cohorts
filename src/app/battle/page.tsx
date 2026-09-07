// ⚔️ BATTLE — UN APARTÉ, ET IL N'A RIEN À VOIR AVEC CLIKME.
//
// « On va faire un petit aparté avec une page de ClikMe qui n'aura rien à voir
// avec le concept ClikMe, et on l'intitulera Battle. »
//
// C'EST ASSUMÉ, ET C'EST POURQUOI ELLE VIT DANS SON PROPRE DOSSIER. Elle ne
// partage ni les données, ni les composants, ni la charte du Direct : deux
// couleurs de camp, des capitales, un chrono qui prend la moitié de l'écran.
// Le seul lien avec le reste du dépôt est le domaine qui l'héberge.
//
// NOINDEX, POUR LA MÊME RAISON QUE `/autour-de-moi` ET UNE DE PLUS. Une page
// qui promet un arbitrage par IA, indexée sous le même domaine que
// l'argumentaire commerçant, dirait aux commerçants de Dax que ClikMe fait
// autre chose que ce qu'on leur vend. Elle se partage par un lien, à quelques
// personnes, et à personne d'autre.
//
// CE QU'ELLE MET EN SCÈNE ET QUI N'EXISTE PAS est détaillé en tête de
// `lib/battle/donnees.ts` — au premier rang, la reconnaissance vocale : rien
// n'est enregistré.
import type { Metadata, Viewport } from "next";
import { Battle } from "./battle";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Sans `cover`, Safari encadre la page dans les marges de sécurité et les
  // peint avec le fond du site — voir le même réglage sur `/autour-de-moi`.
  viewportFit: "cover",
  themeColor: "#07070A",
};

export const metadata: Metadata = {
  title: { absolute: "Battle — défends ton opinion" },
  description:
    "Deux personnes, un sujet, le même temps de parole, une IA arbitre, un gagnant. Une idée en test.",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Battle", statusBarStyle: "black-translucent" },
};

export default function BattlePage() {
  return <Battle />;
}
