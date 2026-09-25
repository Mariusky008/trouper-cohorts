// 🖼️ LA PROPOSITION DE CARTE — voir `proposition.tsx`.
//
// ELLE NE FAIT PAS PARTIE DU PRODUIT ET AUCUN LIEN N'Y MÈNE. C'est un dessin à
// regarder avant de décider, pas un écran de l'application.
import type { Metadata } from "next";
import Proposition from "./proposition";

export const metadata: Metadata = {
  title: "Proposition de carte — ClikMe",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Proposition />;
}
