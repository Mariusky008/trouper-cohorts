// 🔬 LE BANC D'ESSAI — voir `banc.tsx` pour ce qu'il mesure et pourquoi.
//
// IL NE FAIT PAS PARTIE DU PRODUIT, ET LA PAGE LE DIT AUX MOTEURS. Aucun lien
// n'y mène depuis l'application ; c'est un instrument, pas un écran. `noindex`
// évite qu'une page qui lance quatre générations d'images se retrouve dans un
// résultat de recherche.
import type { Metadata } from "next";
import Banc from "./banc";

export const metadata: Metadata = {
  title: "Banc d’essai — ClikMe",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Banc />;
}
