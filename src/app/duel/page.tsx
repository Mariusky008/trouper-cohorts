// 😐 LE CONCOURS DE REGARD (`clikme.fr/duel`) — le prototype du « duel du jour » (7 novembre 2026), à essayer avant de
// refaire la page « Rencontres » : sa figurine contre Pablito, le doigt posé, et le polaroïd à la fin. Voir
// `lib/direct/duel-regard.ts` et `docs/figurines.md` (9.0 quinvicies). Pas dans Google ; aucun lien dans l'app pour l'instant.
import type { Metadata, Viewport } from "next";
import { Duel, STYLES_DUEL } from "./duel";

export const metadata: Metadata = {
  title: "Concours de regard",
  description: "Garde ton sérieux : le premier qui rit a perdu.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#12060F" };

export default function PageDuel() {
  return (
    <>
      <style>{STYLES_DUEL}</style>
      <Duel />
    </>
  );
}
